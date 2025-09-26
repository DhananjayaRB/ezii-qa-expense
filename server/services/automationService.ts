import { and, eq, lt, lte, isNull, or, gte } from 'drizzle-orm';
import { db } from '../db';
import { 
  contracts, 
  expenseClaims, 
  notifications, 
  automatedTasks,
  users,
  workflowAssignments,
  vendors
} from '@shared/schema';
import { emailService } from './emailService';

interface ContractDueDateCalculation {
  contractId: string;
  currentDueDate: Date;
  nextDueDate: Date;
  frequency: string;
}

interface VendorClaimGenerationResult {
  success: boolean;
  claimId?: string;
  error?: string;
}

export class AutomationService {
  
  /**
   * Calculate the next due date based on frequency
   */
  private calculateNextDueDate(currentDueDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDueDate);
    
    switch (frequency.toLowerCase()) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annually':
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'bi-annually':
      case 'half-yearly':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      default:
        // Default to monthly if frequency is not recognized
        nextDate.setMonth(nextDate.getMonth() + 1);
        console.warn(`Unknown frequency: ${frequency}, defaulting to monthly`);
    }
    
    return nextDate;
  }

  /**
   * Get users assigned to workflow for notifications
   */
  private async getWorkflowAssignedUsers(orgId: string): Promise<string[]> {
    try {
      // Get users with admin role - they are typically assigned to workflows
      const adminUsers = await db
        .select({ email: users.email })
        .from(users)
        .where(and(
          eq(users.role, 'admin'),
          eq(users.companyId, orgId)
        ));

      return adminUsers
        .map((user: { email: string | null }) => user.email)
        .filter((email): email is string => email !== null);
    } catch (error) {
      console.error('Error getting workflow assigned users:', error);
      return [];
    }
  }

  /**
   * Generate a vendor claim automatically based on contract
   */
  private async generateVendorClaimFromContract(contract: any, userId: string): Promise<VendorClaimGenerationResult> {
    try {
      // Get vendor details
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, contract.vendorId))
        .limit(1);

      if (!vendor.length) {
        return { success: false, error: 'Vendor not found' };
      }

      const vendorData = vendor[0];

      // Calculate vendor due date based on contract settings
      const contractDueDate = new Date(contract.dueDate);
      const vendorDueDate = new Date(contractDueDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from contract due date
      
      // Generate vendor claim
      const claimData = {
        userId: userId,
        title: `${contract.title} - ${contract.frequency} Payment`,
        description: `Automatically generated vendor claim for contract: ${contract.title}\nAgreement Reference: ${contract.agreementReference || 'N/A'}\nFrequency: ${contract.frequency}`,
        totalAmount: contract.amount.toString(),
        balancePayment: contract.amount.toString(),
        currency: 'INR',
        vendorId: contract.vendorId,
        status: 'submitted',
        submittedAt: new Date(),
        
        // CRITICAL: Set vendor due date and reminder settings for automation
        vendorDueDate: vendorDueDate,
        enableDueDateReminder: true,
        dueDateReminderDays: 3, // Send reminder 3 days before vendor payment is due
      };

      const result = await db.insert(expenseClaims).values(claimData).returning();
      
      if (result.length > 0) {
        const newClaimId = result[0].id;
        
        // Update contract to track last vendor claim generated
        await db
          .update(contracts)
          .set({ 
            lastVendorClaimGenerated: new Date(),
            nextDueDate: this.calculateNextDueDate(new Date(contract.dueDate), contract.frequency)
          })
          .where(eq(contracts.id, contract.id));

        console.log(`✅ Auto-generated vendor claim ${newClaimId} for contract ${contract.id}`);
        
        return { 
          success: true, 
          claimId: newClaimId 
        };
      }

      return { success: false, error: 'Failed to create vendor claim' };
    } catch (error) {
      console.error('Error generating vendor claim:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Process contract reminders and auto-generate vendor claims
   */
  async processContractReminders(): Promise<{ processed: number; errors: string[] }> {
    console.log('🔄 Processing contract reminders...');
    const errors: string[] = [];
    let processed = 0;

    try {
      const today = new Date();
      
      // Find contracts that need reminders or vendor claim generation
      const contractsToProcess = await db
        .select()
        .from(contracts)
        .where(and(
          eq(contracts.status, 'active'),
          eq(contracts.enableReminders, true),
          lte(contracts.dueDate, new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))), // Due within 30 days
          or(
            isNull(contracts.lastReminderSent),
            lt(contracts.lastReminderSent, new Date(today.getTime() - (24 * 60 * 60 * 1000))) // Last reminder sent more than 24 hours ago
          )
        ));

      for (const contract of contractsToProcess) {
        try {
          const dueDate = new Date(contract.dueDate!);
          const reminderDaysBefore = contract.reminderDaysBefore || 7; // Default to 7 days
          const reminderDate = new Date(dueDate.getTime() - (reminderDaysBefore * 24 * 60 * 60 * 1000));
          const shouldSendReminder = today >= reminderDate;
          const shouldGenerateVendorClaim = today >= dueDate && contract.autoGenerateVendorClaim;

          if (shouldSendReminder) {
            // Get workflow assigned users for notifications
            const recipientEmails = await this.getWorkflowAssignedUsers(contract.vendorId); // Using vendorId as orgId proxy
            
            if (recipientEmails.length > 0) {
              // Create email content
              const emailContent = emailService.generateContractReminderEmail({
                title: contract.title,
                vendorName: contract.vendorName,
                amount: parseFloat(contract.amount),
                dueDate: dueDate.toLocaleDateString('en-GB'),
                frequency: contract.frequency,
                agreementReference: contract.agreementReference || undefined,
              });

              // Schedule notification
              await db.insert(notifications).values({
                type: 'contract_reminder',
                entityType: 'contract',
                entityId: contract.id,
                title: `Contract Reminder: ${contract.title}`,
                message: `Payment due for ${contract.title} on ${dueDate.toLocaleDateString('en-GB')}`,
                recipientEmails: JSON.stringify(recipientEmails),
                scheduledFor: new Date(),
                priority: 'high',
                metadata: JSON.stringify({
                  contractTitle: contract.title,
                  vendorName: contract.vendorName,
                  amount: contract.amount,
                  dueDate: dueDate.toISOString(),
                }),
              });

              // Send email
              emailContent.to = recipientEmails;
              await emailService.sendEmail(emailContent);

              // Update last reminder sent
              await db
                .update(contracts)
                .set({ lastReminderSent: new Date() })
                .where(eq(contracts.id, contract.id));

              console.log(`📧 Sent reminder for contract: ${contract.title}`);
            }
          }

          if (shouldGenerateVendorClaim) {
            // Check if vendor claim was already generated recently (within last 7 days)
            const recentGeneration = contract.lastVendorClaimGenerated && 
              (new Date().getTime() - new Date(contract.lastVendorClaimGenerated).getTime()) < (7 * 24 * 60 * 60 * 1000);

            if (!recentGeneration) {
              // Generate vendor claim
              const adminUsers = await db
                .select()
                .from(users)
                .where(eq(users.role, 'admin'))
                .limit(1);

              if (adminUsers.length > 0) {
                const claimResult = await this.generateVendorClaimFromContract(contract, adminUsers[0].id);
                
                if (claimResult.success && claimResult.claimId) {
                  // Send notification about auto-generated claim
                  const recipientEmails = await this.getWorkflowAssignedUsers(contract.vendorId);
                  
                  if (recipientEmails.length > 0) {
                    const emailContent = emailService.generateVendorClaimCreatedEmail({
                      title: `${contract.title} - ${contract.frequency} Payment`,
                      vendorName: contract.vendorName,
                      amount: parseFloat(contract.amount),
                      contractTitle: contract.title,
                      claimId: claimResult.claimId,
                    });

                    emailContent.to = recipientEmails;
                    await emailService.sendEmail(emailContent);

                    await db.insert(notifications).values({
                      type: 'vendor_claim_generated',
                      entityType: 'expense_claim',
                      entityId: claimResult.claimId,
                      title: `Auto-generated Vendor Claim: ${contract.title}`,
                      message: `Vendor claim has been automatically generated for contract ${contract.title}`,
                      recipientEmails: JSON.stringify(recipientEmails),
                      scheduledFor: new Date(),
                      status: 'sent',
                      priority: 'medium',
                    });
                  }

                  console.log(`🤖 Auto-generated vendor claim for contract: ${contract.title}`);
                } else {
                  errors.push(`Failed to generate vendor claim for contract ${contract.title}: ${claimResult.error}`);
                }
              }
            }
          }

          processed++;
        } catch (error) {
          const errorMsg = `Error processing contract ${contract.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Processed ${processed} contract reminders`);
      return { processed, errors };

    } catch (error) {
      const errorMsg = `Error in processContractReminders: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { processed, errors };
    }
  }

  /**
   * Process vendor claim due date reminders
   */
  async processVendorClaimDueReminders(): Promise<{ processed: number; errors: string[] }> {
    console.log('🔄 Processing vendor claim due date reminders...');
    const errors: string[] = [];
    let processed = 0;

    try {
      const today = new Date();
      
      // Find vendor claims with due dates that need reminders
      const claimsToProcess = await db
        .select()
        .from(expenseClaims)
        .where(and(
          eq(expenseClaims.enableDueDateReminder, true),
          lte(expenseClaims.vendorDueDate, new Date(today.getTime() + (10 * 24 * 60 * 60 * 1000))), // Due within 10 days
          or(
            isNull(expenseClaims.lastDueDateReminderSent),
            lt(expenseClaims.lastDueDateReminderSent, new Date(today.getTime() - (24 * 60 * 60 * 1000))) // Last reminder sent more than 24 hours ago
          ),
          or(
            eq(expenseClaims.status, 'approved'),
            eq(expenseClaims.status, 'payment_submitted')
          )
        ));

      for (const claim of claimsToProcess) {
        try {
          if (!claim.vendorDueDate) continue;

          const dueDate = new Date(claim.vendorDueDate);
          const dueDateReminderDays = claim.dueDateReminderDays || 3; // Default to 3 days  
          const reminderDate = new Date(dueDate.getTime() - (dueDateReminderDays * 24 * 60 * 60 * 1000));
          const shouldSendReminder = today >= reminderDate;

          if (shouldSendReminder) {
            // Get vendor details
            const vendor = claim.vendorId ? await db
              .select()
              .from(vendors)
              .where(eq(vendors.id, claim.vendorId))
              .limit(1) : [];

            const vendorName = vendor.length > 0 ? vendor[0].name : 'Unknown Vendor';

            // Get workflow assigned users
            const recipientEmails = await this.getWorkflowAssignedUsers(claim.userId); // Using userId as orgId proxy
            
            if (recipientEmails.length > 0) {
              // Create email content
              const emailContent = emailService.generateVendorClaimDueReminderEmail({
                title: claim.title,
                vendorName: vendorName,
                amount: parseFloat(claim.totalAmount),
                dueDate: dueDate.toLocaleDateString('en-GB'),
                invoiceNumber: claim.vendorInvoiceNumber || undefined,
              });

              // Send email
              emailContent.to = recipientEmails;
              await emailService.sendEmail(emailContent);

              // Schedule notification
              await db.insert(notifications).values({
                type: 'vendor_claim_due',
                entityType: 'expense_claim',
                entityId: claim.id,
                title: `Vendor Payment Due: ${claim.title}`,
                message: `Payment due for ${claim.title} on ${dueDate.toLocaleDateString('en-GB')}`,
                recipientEmails: JSON.stringify(recipientEmails),
                scheduledFor: new Date(),
                status: 'sent',
                priority: 'urgent',
                metadata: JSON.stringify({
                  claimTitle: claim.title,
                  vendorName: vendorName,
                  amount: claim.totalAmount,
                  dueDate: dueDate.toISOString(),
                }),
              });

              // Update last reminder sent
              await db
                .update(expenseClaims)
                .set({ lastDueDateReminderSent: new Date() })
                .where(eq(expenseClaims.id, claim.id));

              console.log(`📧 Sent due date reminder for claim: ${claim.title}`);
            }
          }

          processed++;
        } catch (error) {
          const errorMsg = `Error processing claim ${claim.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Processed ${processed} vendor claim due date reminders`);
      return { processed, errors };

    } catch (error) {
      const errorMsg = `Error in processVendorClaimDueReminders: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { processed, errors };
    }
  }

  /**
   * Master automation processor - runs all automation tasks
   */
  async runAllAutomationTasks(): Promise<{ 
    contractReminders: { processed: number; errors: string[] };
    vendorClaimReminders: { processed: number; errors: string[] };
  }> {
    console.log('🚀 Starting automation service...');
    
    const contractReminders = await this.processContractReminders();
    const vendorClaimReminders = await this.processVendorClaimDueReminders();

    console.log('✅ Automation service completed');
    
    return {
      contractReminders,
      vendorClaimReminders,
    };
  }

  /**
   * Calculate and update next due dates for all active contracts
   */
  async calculateNextDueDates(): Promise<{ updated: number; errors: string[] }> {
    console.log('🔄 Calculating next due dates for contracts...');
    const errors: string[] = [];
    let updated = 0;

    try {
      const activeContracts = await db
        .select()
        .from(contracts)
        .where(eq(contracts.status, 'active'));

      for (const contract of activeContracts) {
        try {
          if (!contract.dueDate) continue;

          const currentDueDate = new Date(contract.dueDate);
          const nextDueDate = this.calculateNextDueDate(currentDueDate, contract.frequency);

          await db
            .update(contracts)
            .set({ nextDueDate })
            .where(eq(contracts.id, contract.id));

          updated++;
        } catch (error) {
          const errorMsg = `Error updating contract ${contract.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Updated next due dates for ${updated} contracts`);
      return { updated, errors };

    } catch (error) {
      const errorMsg = `Error in calculateNextDueDates: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { updated: 0, errors };
    }
  }
}

// Create singleton instance
export const automationService = new AutomationService();