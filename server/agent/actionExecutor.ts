import { db } from "../db";
import { expenseClaims, users, paymentBatches, vendors } from "@shared/schema";
import { eq, and, lt, sql, inArray } from "drizzle-orm";

export interface ExecuteResult {
  message: string;
  data?: any;
  actions?: string[];
}

export class ActionExecutor {
  async execute(intent: any, userId: string): Promise<ExecuteResult> {
    try {
      switch (intent.target) {
        case 'approve_claims':
          return await this.approveClaims(intent.parameters, userId);
        case 'approve_claim':
          return await this.approveClaim(intent.parameters, userId);
        case 'reject_claim':
          return await this.rejectClaim(intent.parameters, userId);
        case 'approve_batch':
          return await this.approveBatch(intent.parameters, userId);
        case 'approve_batches':
          return await this.approveBatches(userId);
        case 'reject_batch':
          return await this.rejectBatch(intent.parameters, userId);
        case 'process_payments':
          return await this.processPayments(userId);
        case 'process_batch':
          return await this.processBatch(intent.parameters, userId);
        case 'create_claim':
          return await this.createClaim(intent.parameters, userId);
        case 'create_request':
          return await this.createRequest(intent.parameters, userId);
        case 'create_batch':
          return await this.createBatch(userId);
        case 'create_vendor':
          return await this.createVendor(intent.parameters, userId);
        case 'create_direct_expense':
          return await this.createDirectExpense(intent.parameters, userId);
        case 'create_advance':
          return await this.createAdvance(intent.parameters, userId);
        case 'create_contract':
          return await this.createContract(intent.parameters, userId);
        case 'create_petty_transaction':
          return await this.createPettyTransaction(intent.parameters, userId);
        case 'create_vendor_onboarding':
          return await this.createVendorOnboarding(intent.parameters, userId);
        case 'create_policy_rule':
          return await this.createPolicyRule(intent.parameters, userId);
        case 'approve_vendor_onboarding':
          return await this.approveVendorOnboarding(intent.parameters, userId);
        case 'approve_vendor_document':
          return await this.approveVendorDocument(intent.parameters, userId);
        case 'explain_restriction':
          return await this.explainRestriction(intent.parameters, userId);
        case 'explain_validation':
          return await this.explainValidation(intent.parameters, userId);
        case 'explain_location_rule':
          return await this.explainLocationRule(intent.parameters, userId);
        default:
          return { message: "Action not supported yet." };
      }
    } catch (error) {
      console.error('Action executor error:', error);
      return { message: "Error executing action. Please try again." };
    }
  }

  private async approveClaims(parameters: any, userId: string): Promise<ExecuteResult> {
    // Include all pending statuses: pending, pending admin, pending manager, etc.
    const pendingStatuses = ['pending', 'pending admin', 'pending_admin', 'pending_manager', 'pending manager', 'submitted'];
    let query = db.select().from(expenseClaims);
    
    // If amount limit specified
    if (parameters.amount) {
      query = query.where(and(
        inArray(expenseClaims.status, pendingStatuses),
        lt(sql`CAST(${expenseClaims.totalAmount} AS DECIMAL)`, parameters.amount)
      ));
    }

    const pendingClaims = await query.limit(50); // Safety limit

    if (pendingClaims.length === 0) {
      const amountText = parameters.amount ? ` under ₹${parameters.amount.toLocaleString()}` : '';
      return { message: `No pending/submitted claims found${amountText}.` };
    }

    // Approve each claim
    const approvedIds = [];
    let totalApproved = 0;

    for (const claim of pendingClaims) {
      try {
        await db.update(expenseClaims)
          .set({ 
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: userId
          })
          .where(eq(expenseClaims.id, claim.id));
        
        approvedIds.push(claim.id);
        totalApproved += parseFloat(claim.totalAmount);
      } catch (error) {
        console.error(`Failed to approve claim ${claim.id}:`, error);
      }
    }

    return {
      message: `✅ Approved ${approvedIds.length} claims totaling ₹${totalApproved.toLocaleString()}`,
      data: { approvedIds, totalAmount: totalApproved },
      actions: [`approved_${approvedIds.length}_claims`]
    };
  }

  private async approveClaim(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id && !parameters.name) {
      return { message: "Please specify the claim ID or name to approve." };
    }

    let claim;
    
    // Search by ID first, then by name (title)
    if (parameters.id) {
      claim = await db.select().from(expenseClaims)
        .where(eq(expenseClaims.id, parameters.id))
        .limit(1);
    } else if (parameters.name) {
      // Search by title (case-insensitive)
      claim = await db.select().from(expenseClaims)
        .where(sql`LOWER(${expenseClaims.title}) = LOWER(${parameters.name})`)
        .limit(1);
    }

    if (!claim || claim.length === 0) {
      const searchTerm = parameters.id || parameters.name;
      return { message: `Claim named not found.` };
    }

    // Check if claim is in a pending status
    const pendingStatuses = ['pending', 'pending admin', 'pending_admin', 'pending_manager', 'pending manager', 'submitted'];
    if (!pendingStatuses.includes(claim[0].status)) {
      return { message: `Claim "${claim[0].title}" is already ${claim[0].status}.` };
    }

    await db.update(expenseClaims)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId
      })
      .where(eq(expenseClaims.id, claim[0].id));

    return {
      message: `✅ Approved claim "${claim[0].title}" for ₹${parseFloat(claim[0].totalAmount).toLocaleString()}`,
      actions: [`approved_claim_${claim[0].id}`]
    };
  }

  private async rejectClaim(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id) {
      return { message: "Please specify the claim ID to reject." };
    }

    const claim = await db.select().from(expenseClaims)
      .where(eq(expenseClaims.id, parameters.id))
      .limit(1);

    if (claim.length === 0) {
      return { message: `Claim ${parameters.id} not found.` };
    }

    if (claim[0].status !== 'pending') {
      return { message: `Claim ${parameters.id} is already ${claim[0].status}.` };
    }

    await db.update(expenseClaims)
      .set({
        status: 'rejected',
        approvedAt: new Date(),
        approvedBy: userId
      })
      .where(eq(expenseClaims.id, parameters.id));

    return {
      message: `❌ Rejected claim ${parameters.id}`,
      actions: [`rejected_claim_${parameters.id}`]
    };
  }

  private async approveBatch(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id) {
      return { message: "Please specify the batch ID to approve." };
    }

    const batch = await db.select().from(paymentBatches)
      .where(eq(paymentBatches.id, parameters.id))
      .limit(1);

    if (batch.length === 0) {
      return { message: `Batch ${parameters.id} not found.` };
    }

    await db.update(paymentBatches)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId
      })
      .where(eq(paymentBatches.id, parameters.id));

    return {
      message: `✅ Approved payment batch ${batch[0].batchNumber} for ₹${parseFloat(batch[0].totalAmount).toLocaleString()}`,
      actions: [`approved_batch_${parameters.id}`]
    };
  }

  private async approveBatches(userId: string): Promise<ExecuteResult> {
    const pendingBatches = await db.select().from(paymentBatches)
      .where(eq(paymentBatches.status, 'pending_approval'))
      .limit(20);

    if (pendingBatches.length === 0) {
      return { message: "No pending payment batches found." };
    }

    let approvedCount = 0;
    let totalAmount = 0;

    for (const batch of pendingBatches) {
      try {
        await db.update(paymentBatches)
          .set({
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: userId
          })
          .where(eq(paymentBatches.id, batch.id));
        
        approvedCount++;
        totalAmount += parseFloat(batch.totalAmount);
      } catch (error) {
        console.error(`Failed to approve batch ${batch.id}:`, error);
      }
    }

    return {
      message: `✅ Approved ${approvedCount} payment batches totaling ₹${totalAmount.toLocaleString()}`,
      actions: [`approved_${approvedCount}_batches`]
    };
  }

  private async rejectBatch(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id) {
      return { message: "Please specify the batch ID to reject." };
    }

    await db.update(paymentBatches)
      .set({
        status: 'rejected',
        approvedAt: new Date(),
        approvedBy: userId
      })
      .where(eq(paymentBatches.id, parameters.id));

    return {
      message: `❌ Rejected payment batch ${parameters.id}`,
      actions: [`rejected_batch_${parameters.id}`]
    };
  }

  private async processPayments(userId: string): Promise<ExecuteResult> {
    // This would integrate with your payment processing system
    const readyPayments = await db.select().from(expenseClaims)
      .where(eq(expenseClaims.status, 'approved'))
      .limit(10);

    return {
      message: `Found ${readyPayments.length} payments ready for processing. Payment processing integration needed.`,
      data: { readyCount: readyPayments.length }
    };
  }

  private async processBatch(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id) {
      return { message: "Please specify the batch ID to process." };
    }

    // This would integrate with batch processing
    return {
      message: `Batch ${parameters.id} processing initiated. Integration with payment system needed.`,
      actions: [`initiated_batch_processing_${parameters.id}`]
    };
  }

  private async createClaim(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.amount || !parameters.description) {
      return { message: "Please specify amount and description. Example: 'create expense for 500 taxi fare'" };
    }

    // This would create a basic expense claim
    // For now, return guidance
    return {
      message: `To create expense for ₹${parameters.amount} - ${parameters.description}, please use the expense submission form for proper receipt upload and categorization.`,
      data: { 
        amount: parameters.amount, 
        description: parameters.description,
        suggestion: "Use expense form for complete submission"
      }
    };
  }

  private async createRequest(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.amount) {
      return { message: "Please specify amount for the request." };
    }

    return {
      message: `To create expense request for ₹${parameters.amount}, please use the expense request form for proper approval workflow.`,
      data: { 
        amount: parameters.amount,
        suggestion: "Use request form for complete submission"
      }
    };
  }

  private async createBatch(userId: string): Promise<ExecuteResult> {
    return {
      message: "To create payment batch, please use the payment processing interface for proper batch configuration.",
      data: { suggestion: "Use payment batch form" }
    };
  }

  private async createVendor(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.name) {
      return { message: "Please specify vendor name." };
    }

    return {
      message: `To create vendor '${parameters.name}', please use the vendor management form for complete vendor details.`,
      data: { 
        name: parameters.name,
        suggestion: "Use vendor form for complete setup"
      }
    };
  }

  private async createDirectExpense(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "To create a direct expense, please use the Direct Expenses section in the application. Direct expenses are company-level costs not tied to individual employees.",
      data: { 
        amount: parameters.amount,
        description: parameters.description,
        suggestion: "Use Direct Expenses form for complete setup"
      }
    };
  }

  private async createAdvance(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "To create an advance payment, please use the Advance Payments section. This handles pre-approved payments to employees.",
      data: { 
        amount: parameters.amount,
        suggestion: "Use Advance Payments form for complete setup"
      }
    };
  }

  private async createContract(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "To create a contract, please use the Contract Management section. This handles vendor agreements and service contracts.",
      data: { 
        name: parameters.name,
        suggestion: "Use Contract Management form for complete setup"
      }
    };
  }

  private async createPettyTransaction(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "To create a petty cash transaction, please use the Petty Cash section. This handles small cash payments and receipts.",
      data: { 
        amount: parameters.amount,
        description: parameters.description,
        suggestion: "Use Petty Cash form for complete transaction setup"
      }
    };
  }

  private async createVendorOnboarding(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "To create a vendor onboarding request, please use the Vendor Management > Onboarding section. This initiates the vendor registration and approval process.",
      data: { 
        name: parameters.name,
        suggestion: "Use Vendor Onboarding form with complete vendor details, documents, and banking information"
      }
    };
  }

  private async createPolicyRule(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "To create an expense policy rule, please use Configuration > Expense Policies. This sets up validation rules, amount limits, and restrictions.",
      data: { 
        amount: parameters.amount,
        suggestion: "Use Expense Policy form to configure rule type, limits, criteria, and restrictions"
      }
    };
  }

  private async approveVendorOnboarding(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id) {
      return { message: "Please specify the vendor onboarding request ID to approve." };
    }

    try {
      // This would call the actual API to approve vendor onboarding
      const response = await fetch(`/api/vendor-onboarding-requests/${parameters.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        return {
          message: `Vendor onboarding request #${parameters.id} has been approved successfully. The vendor can now be activated for transactions.`,
          data: { id: parameters.id, status: 'approved' },
          actions: ['Vendor activated', 'Notification sent', 'Database updated']
        };
      } else {
        return { message: `Failed to approve vendor onboarding request #${parameters.id}. Please check the request status and try again.` };
      }
    } catch (error) {
      return { message: "To approve vendor onboarding requests, please use the Vendor Management > Onboarding section where you can review and approve pending requests." };
    }
  }

  private async approveVendorDocument(parameters: any, userId: string): Promise<ExecuteResult> {
    if (!parameters.id) {
      return { message: "Please specify the document ID to approve for verification." };
    }

    try {
      const response = await fetch(`/api/vendor-documents/${parameters.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'verified' })
      });

      if (response.ok) {
        return {
          message: `Vendor document #${parameters.id} has been verified and approved. The document is now marked as valid for compliance.`,
          data: { id: parameters.id, status: 'verified' },
          actions: ['Document verified', 'Compliance updated', 'Vendor notified']
        };
      } else {
        return { message: `Failed to verify document #${parameters.id}. Please check the document status and try again.` };
      }
    } catch (error) {
      return { message: "To verify vendor documents, please use the Vendor Management > Documents section where you can review and approve uploaded documents." };
    }
  }

  private async explainRestriction(parameters: any, userId: string): Promise<ExecuteResult> {
    try {
      const { storage } = await import("../storage");
      
      // Get user information and their location/department
      const user = await storage.getUser(userId);
      const policies = await storage.getExpensePolicies();
      const workflows = await storage.getWorkflows();
      
      // Find relevant policies for this user
      let explanation = "Let me check your expense restrictions:\n\n";
      
      // Check amount-based restrictions
      if (parameters.amount) {
        const relevantPolicies = policies.filter(p => 
          p.limitAmount && p.limitAmount <= parameters.amount && p.status === true
        );
        
        if (relevantPolicies.length > 0) {
          explanation += `**Amount Restrictions:**\n`;
          relevantPolicies.forEach(policy => {
            explanation += `- ${policy.ruleType} policy limits you to ₹${policy.limitAmount} ${policy.dayLimitPerTransaction ? 'per transaction' : 'total'}\n`;
          });
        }
      }
      
      // Check workflow restrictions
      const activeWorkflows = workflows.filter(w => w.isActive === true);
      if (activeWorkflows.length > 0) {
        explanation += `\n**Approval Requirements:**\n`;
        activeWorkflows.forEach(workflow => {
          explanation += `- ${workflow.processTypes} requires ${workflow.name} approval workflow\n`;
        });
      }
      
      // Check location/department restrictions
      const locationPolicies = policies.filter(p => p.locationId && p.status === true);
      if (locationPolicies.length > 0) {
        explanation += `\n**Location-Based Rules:**\n`;
        explanation += `- Your location may have specific expense limits and approval requirements\n`;
        explanation += `- Check with your manager for location-specific policies\n`;
      }
      
      if (explanation === "Let me check your expense restrictions:\n\n") {
        explanation = "No specific restrictions found for your request. Your expense should be processed according to standard company policies.";
      }
      
      return {
        message: explanation,
        data: { 
          user: user?.firstName || 'User',
          amount: parameters.amount,
          applicablePolicies: policies.filter(p => p.status === true).length,
          activeWorkflows: activeWorkflows.length
        }
      };
    } catch (error) {
      return {
        message: "I can help explain expense restrictions based on your location, department, amount limits, and approval workflows. Please check Configuration > Expense Policies for detailed rules.",
        data: {}
      };
    }
  }

  private async explainValidation(parameters: any, userId: string): Promise<ExecuteResult> {
    return {
      message: "Expense validation is based on several factors:\n\n" +
               "**Policy Rules:** Amount limits, transaction frequency, supporting document requirements\n" +
               "**Location Rules:** Department and location-specific expense limits\n" +
               "**Workflow Rules:** Approval hierarchy based on expense type and amount\n" +
               "**Cost Center Rules:** Budget allocation and cost distribution requirements\n\n" +
               "Check Configuration > Expense Policies and Workflow Configuration for detailed rules.",
      data: { suggestion: "Review Configuration sections for complete validation details" }
    };
  }

  private async explainLocationRule(parameters: any, userId: string): Promise<ExecuteResult> {
    try {
      const { storage } = await import("../storage");
      const policies = await storage.getExpensePolicies();
      
      // Find location-based policies
      const locationPolicies = policies.filter(p => 
        (p.locationId || p.departmentId || p.divisionId) && p.status === true
      );
      
      let explanation = "Location and department-based expense rules:\n\n";
      
      if (locationPolicies.length > 0) {
        explanation += "**Active Location Rules:**\n";
        locationPolicies.forEach(policy => {
          const ruleDetails = [];
          if (policy.locationId) ruleDetails.push(`Location: ${policy.locationName}`);
          if (policy.departmentId) ruleDetails.push(`Department: ${policy.departmentName}`);
          if (policy.limitAmount) ruleDetails.push(`Limit: ₹${policy.limitAmount}`);
          
          explanation += `- ${ruleDetails.join(', ')}\n`;
        });
        
        explanation += "\n**Cost Trends Impact:**\n";
        explanation += "- Your location may have different expense limits based on cost center trends\n";
        explanation += "- Department budgets influence individual expense allowances\n";
        explanation += "- Regional policies may apply different approval requirements\n";
      } else {
        explanation = "No specific location-based rules found. Standard company-wide policies apply to your expense claims.";
      }
      
      return {
        message: explanation,
        data: { 
          locationPolicies: locationPolicies.length,
          hasLocationRules: locationPolicies.length > 0
        }
      };
    } catch (error) {
      return {
        message: "Location and department rules are configured in Expense Policies. These include cost center trends, regional limits, and department-specific approval requirements.",
        data: {}
      };
    }
  }
}

export const actionExecutor = new ActionExecutor();