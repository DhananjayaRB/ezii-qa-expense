import { Router } from 'express';
import { automationService } from '../services/automationService';
import { emailService } from '../services/emailService';
import { z } from 'zod';
import { requireAuth } from '../middleware/unifiedAuth';
import { requireAdminRole } from '../middleware/jwtRoleMapping';

const router = Router();

// Use the existing admin role middleware

/**
 * GET /api/automation/status
 * Check automation service status
 */
router.get('/status', requireAuth, requireAdminRole, async (req, res) => {
  try {
    // Check email service connection
    const emailStatus = await emailService.verifyConnection();
    
    // Check if required environment variables are set
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    
    res.json({
      status: 'active',
      emailService: {
        configured: smtpConfigured,
        connected: emailStatus,
      },
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking automation status:', error);
    res.status(500).json({ error: 'Failed to check automation status' });
  }
});

/**
 * POST /api/automation/test-email
 * Test email functionality
 */
const testEmailSchema = z.object({
  recipientEmail: z.string().email('Valid email required'),
  testType: z.enum(['contract_reminder', 'vendor_claim_due', 'vendor_claim_created']).default('contract_reminder'),
});

router.post('/test-email', requireAuth, requireAdminRole, async (req, res) => {
  try {
    const { recipientEmail, testType } = testEmailSchema.parse(req.body);

    let emailContent;
    
    switch (testType) {
      case 'contract_reminder':
        emailContent = emailService.generateContractReminderEmail({
          title: 'Test Contract - Office Rent',
          vendorName: 'Test Vendor Ltd.',
          amount: 50000,
          dueDate: '25-12-2024',
          frequency: 'monthly',
          agreementReference: 'AGR-2024-001',
        });
        break;
      case 'vendor_claim_due':
        emailContent = emailService.generateVendorClaimDueReminderEmail({
          title: 'Test Vendor Claim',
          vendorName: 'Test Vendor Ltd.',
          amount: 25000,
          dueDate: '25-12-2024',
          invoiceNumber: 'INV-2024-001',
        });
        break;
      case 'vendor_claim_created':
        emailContent = emailService.generateVendorClaimCreatedEmail({
          title: 'Test Auto-Generated Claim',
          vendorName: 'Test Vendor Ltd.',
          amount: 35000,
          contractTitle: 'Test Contract - Office Rent',
          claimId: 'test-claim-id-123',
        });
        break;
    }

    emailContent.to = [recipientEmail];
    const result = await emailService.sendEmail(emailContent);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

/**
 * POST /api/automation/process-reminders
 * Manually trigger reminder processing (for testing)
 */
router.post('/process-reminders', requireAuth, requireAdminRole, async (req, res) => {
  try {
    console.log('🚀 Manual reminder processing triggered by admin');
    
    const results = await automationService.runAllAutomationTasks();
    
    res.json({
      success: true,
      message: 'Automation tasks completed',
      results: {
        contractReminders: {
          processed: results.contractReminders.processed,
          errors: results.contractReminders.errors.length,
          errorDetails: results.contractReminders.errors.slice(0, 5), // Limit error details
        },
        vendorClaimReminders: {
          processed: results.vendorClaimReminders.processed,
          errors: results.vendorClaimReminders.errors.length,
          errorDetails: results.vendorClaimReminders.errors.slice(0, 5),
        },
      },
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/automation/calculate-due-dates
 * Recalculate next due dates for all contracts
 */
router.post('/calculate-due-dates', requireAuth, requireAdminRole, async (req, res) => {
  try {
    console.log('🔄 Calculating next due dates triggered by admin');
    
    const results = await automationService.calculateNextDueDates();
    
    res.json({
      success: true,
      message: 'Due dates calculated successfully',
      results: {
        updated: results.updated,
        errors: results.errors.length,
        errorDetails: results.errors.slice(0, 5),
      },
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating due dates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate due dates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/automation/setup-guide
 * Provide setup instructions for email configuration
 */
router.get('/setup-guide', requireAuth, requireAdminRole, async (req, res) => {
  try {
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    
    res.json({
      configured: smtpConfigured,
      setupInstructions: {
        message: 'To enable automated email notifications, set the following environment variables:',
        requiredVariables: [
          {
            name: 'SMTP_HOST',
            value: 'email-smtp.ap-south-1.amazonaws.com',
            description: 'SMTP server hostname',
            configured: !!process.env.SMTP_HOST,
          },
          {
            name: 'SMTP_PORT',
            value: '587',
            description: 'SMTP server port',
            configured: !!process.env.SMTP_PORT,
          },
          {
            name: 'SMTP_USER',
            value: '[Your AWS SES Access Key ID]',
            description: 'SMTP username (AWS Access Key ID)',
            configured: !!process.env.SMTP_USER,
          },
          {
            name: 'SMTP_PASSWORD',
            value: '[Your AWS SES Secret Access Key]',
            description: 'SMTP password (AWS Secret Access Key)',
            configured: !!process.env.SMTP_PASSWORD,
          },
        ],
        securityNote: 'Never hardcode these credentials in your code. Use environment variables for security.',
      },
    });
  } catch (error) {
    console.error('Error getting setup guide:', error);
    res.status(500).json({ error: 'Failed to get setup guide' });
  }
});

export { router as automationRoutes };