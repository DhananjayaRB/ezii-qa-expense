import nodemailer from 'nodemailer';
import { Notification } from '../../shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailContent {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    // Load email configuration from environment variables for security
    this.config = {
      host: process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (!this.config.auth.user || !this.config.auth.pass) {
      console.error('❌ Email credentials not found. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
      return;
    }

    this.transporter = nodemailer.createTransport(this.config);
    console.log('📧 Email service initialized successfully');
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  async sendEmail(emailContent: EmailContent): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'Email transporter not initialized. Please check SMTP credentials.' };
    }

    try {
      const mailOptions = {
        from: `"Expense Management System" <${this.config.auth.user}>`,
        to: emailContent.to.join(', '),
        subject: emailContent.subject,
        text: emailContent.text || emailContent.html.replace(/<[^>]*>/g, ''), // Fallback plain text
        html: emailContent.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId 
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Contract reminder email template
  generateContractReminderEmail(contractDetails: {
    title: string;
    vendorName: string;
    amount: number;
    dueDate: string;
    frequency: string;
    agreementReference?: string;
  }): EmailContent {
    const { title, vendorName, amount, dueDate, frequency, agreementReference } = contractDetails;
    
    const subject = `🔔 Contract Payment Reminder - ${title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">📋 Contract Payment Reminder</h1>
            <div style="width: 50px; height: 3px; background-color: #2563eb; margin: 10px auto;"></div>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">⏰ Payment Due Soon</p>
            <p style="margin: 5px 0 0 0; color: #92400e;">Your contract payment is due on <strong>${dueDate}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Contract Title</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Vendor</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${vendorName}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Amount</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #059669; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Due Date</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${dueDate}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Frequency</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151; text-transform: capitalize;">${frequency}</td>
            </tr>
            ${agreementReference ? `
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Agreement Ref</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${agreementReference}</td>
            </tr>` : ''}
          </table>

          <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">💡 What's Next?</h3>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 5px;">A vendor claim will be automatically generated for this contract</li>
              <li style="margin-bottom: 5px;">You will receive a notification once the claim is created</li>
              <li style="margin-bottom: 5px;">Please review and approve the generated claim in the system</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="#" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              🔗 View Contract Details
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated reminder from the Expense Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    return {
      to: [], // Will be populated by caller
      subject,
      html,
    };
  }

  // Vendor claim due date reminder email template
  generateVendorClaimDueReminderEmail(claimDetails: {
    title: string;
    vendorName: string;
    amount: number;
    dueDate: string;
    invoiceNumber?: string;
  }): EmailContent {
    const { title, vendorName, amount, dueDate, invoiceNumber } = claimDetails;
    
    const subject = `⚠️ Vendor Payment Due - ${title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px;">💳 Vendor Payment Due</h1>
            <div style="width: 50px; height: 3px; background-color: #dc2626; margin: 10px auto;"></div>
          </div>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">🚨 Urgent: Payment Due</p>
            <p style="margin: 5px 0 0 0; color: #991b1b;">This vendor payment is due on <strong>${dueDate}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Claim Title</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Vendor</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${vendorName}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Amount</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #059669; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Due Date</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${dueDate}</td>
            </tr>
            ${invoiceNumber ? `
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Invoice Number</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${invoiceNumber}</td>
            </tr>` : ''}
          </table>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="#" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              🔗 Process Payment Now
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated reminder from the Expense Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    return {
      to: [], // Will be populated by caller
      subject,
      html,
    };
  }

  // Auto-generated vendor claim notification email
  generateVendorClaimCreatedEmail(claimDetails: {
    title: string;
    vendorName: string;
    amount: number;
    contractTitle: string;
    claimId: string;
  }): EmailContent {
    const { title, vendorName, amount, contractTitle, claimId } = claimDetails;
    
    const subject = `✅ Vendor Claim Auto-Generated - ${title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0; font-size: 24px;">🤖 Auto-Generated Vendor Claim</h1>
            <div style="width: 50px; height: 3px; background-color: #059669; margin: 10px auto;"></div>
          </div>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #047857; font-weight: bold;">🎉 Claim Generated Successfully</p>
            <p style="margin: 5px 0 0 0; color: #047857;">A vendor claim has been automatically created based on your contract schedule</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Claim ID</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151; font-family: monospace;">${claimId}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Claim Title</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${title}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Contract</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${contractTitle}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Vendor</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #374151;">${vendorName}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Amount</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: #059669; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📋 Next Steps Required</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 5px;">Review the auto-generated vendor claim</li>
              <li style="margin-bottom: 5px;">Verify all details and amounts</li>
              <li style="margin-bottom: 5px;">Approve or edit the claim as needed</li>
              <li style="margin-bottom: 5px;">Process payment once approved</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="#" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              🔗 Review Claim Now
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This claim was automatically generated by the Expense Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    return {
      to: [], // Will be populated by caller
      subject,
      html,
    };
  }
}

// Create singleton instance  
export const emailService = new EmailService();