// Tutorial Configuration System - Matches Original Design

export interface TutorialAction {
  number: number;
  title: string;
  description: string;
  icon?: string;
}

export interface TutorialStep {
  id: string;
  target: string;
  headline: string;
  body: string;
  actions: TutorialAction[];
  anchor?: 'top' | 'bottom' | 'left' | 'right';
  route?: string; // Add route navigation for each step
  waitForElement?: boolean; // Wait for target element to be available
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  steps: TutorialStep[];
}

export const TUTORIAL_CONFIG: Record<string, Tutorial> = {
  employeeClaims: {
    id: 'employeeClaims',
    title: 'Employee Claims Tutorial',
    description: 'Learn how to manage expense claims effectively',
    totalSteps: 7,
    steps: [
      {
        id: 'welcome',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Welcome to Employee Claims',
        body: 'Let\'s learn how to navigate and manage your expense claims efficiently.',
        route: '/', // Start on dashboard
        actions: [
          {
            number: 1,
            title: 'Getting Started',
            description: 'We\'ll walk you through the key features step by step.'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'navigate-claims',
        target: '[data-testid="nav-claim"]',
        headline: 'Go to Employee Claims',
        body: 'Let\'s start by navigating to the Employee Claims section where you can manage all your expense requests.',
        route: '/', // Stay on dashboard to show navigation
        actions: [
          {
            number: 1,
            title: 'Click on "Claims" under the Employee section',
            description: 'Click on "Claim" under the Employee section in the sidebar to access your expense management area.'
          },
          {
            number: 2,
            title: 'I will navigate you there automatically',
            description: 'The tutorial will take you to the Claims page to continue.',
            icon: '🚀'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'create-claim',
        target: '[data-testid="button-new-claim"]',
        headline: 'Create New Expense',
        body: 'Now let\'s create your first expense claim. This is where all expense submissions begin.',
        route: '/employee/claim', // Navigate to claims page
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Click "New Claim" button',
            description: 'Click the "New Claim" button to start a new expense claim.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'fill-details',
        target: '[data-testid="expense-claim-modal"]',
        headline: 'Fill Expense Details',
        body: 'The expense form will open in a modal. Enter the essential information about your expense.',
        route: '/employee/claim', // Stay on claims page, form opens in modal
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Form will open automatically',
            description: 'The expense form modal will appear for you to fill out.'
          },
          {
            number: 2,
            title: 'Enter expense details',
            description: 'Provide a clear title and select the appropriate category.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'upload-receipt',
        target: '[data-testid="expense-claim-modal"]',
        headline: 'Upload Receipt',
        body: 'Upload your receipt for compliance and faster approval.',
        route: '/employee/claim',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Upload receipt image',
            description: 'Look for the upload area and add your receipt image or PDF.'
          }
        ],
        anchor: 'left'
      },
      {
        id: 'review-submit',
        target: '[data-testid="expense-claim-modal"]',
        headline: 'Review and Submit',
        body: 'Review all the information before submitting your expense claim.',
        route: '/employee/claim',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Review your information',
            description: 'Double-check all expense details are accurate.'
          },
          {
            number: 2,
            title: 'Submit for approval',
            description: 'Click submit to send your expense claim for approval.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'completion',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Tutorial Complete!',
        body: 'Congratulations! You\'ve learned how to submit expense claims. You can now manage your expenses efficiently.',
        route: '/', // Navigate back to dashboard
        actions: [
          {
            number: 1,
            title: 'You\'re all set!',
            description: 'Start submitting your expense claims and track their approval status.'
          }
        ],
        anchor: 'bottom'
      }
    ]
  },

  expenseRequest: {
    id: 'expenseRequest',
    title: 'Expense Request Tutorial',
    description: 'Learn how to create pre-approval requests for upcoming expenses',
    totalSteps: 6,
    steps: [
      {
        id: 'welcome',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Welcome to Expense Requests',
        body: 'Learn how to request pre-approval for expenses before you spend money.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Pre-Approval Process',
            description: 'Get approval before making expenses to ensure compliance.'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'navigate-requests',
        target: '[data-testid="nav-request"]',
        headline: 'Go to Expense Requests',
        body: 'Navigate to the Expense Requests section to create pre-approval requests.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Click "Request" under Employee section',
            description: 'This takes you to the expense request management area.'
          },
          {
            number: 2,
            title: 'Navigating automatically',
            description: 'The tutorial will take you to the Request page.',
            icon: '🚀'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'create-request',
        target: '[data-testid="button-new-request"]',
        headline: 'Create New Request',
        body: 'Create a new expense request for pre-approval.',
        route: '/employee/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Click "New Request" button',
            description: 'Start creating your expense request for approval.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'fill-request-details',
        target: '[data-testid="request-form"]',
        headline: 'Fill Request Details',
        body: 'Provide details about the upcoming expense you need pre-approved.',
        route: '/employee/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Enter request details',
            description: 'Describe the expense, estimated amount, and business justification.'
          },
          {
            number: 2,
            title: 'Select expense category',
            description: 'Choose the appropriate category for your expense.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'submit-request',
        target: '[data-testid="button-submit-request"]',
        headline: 'Submit for Approval',
        body: 'Submit your expense request to get pre-approval from your manager.',
        route: '/employee/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Review and submit',
            description: 'Double-check details and submit for approval.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'completion',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Request Tutorial Complete!',
        body: 'You\'ve learned how to create expense requests for pre-approval.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'You\'re ready!',
            description: 'Create expense requests to get pre-approval before spending.'
          }
        ],
        anchor: 'bottom'
      }
    ]
  },

  vendorOnboarding: {
    id: 'vendorOnboarding',
    title: 'Vendor Onboarding Tutorial',
    description: 'Learn how to onboard new vendors for expense management',
    totalSteps: 8,
    steps: [
      {
        id: 'welcome',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Welcome to Vendor Onboarding',
        body: 'Learn how to request and manage vendor onboarding for your expense needs.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Vendor Management',
            description: 'Streamline vendor onboarding and expense processing.'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'navigate-vendor-request',
        target: '[data-testid="nav-request-vendor"]',
        headline: 'Go to Vendor Request',
        body: 'Navigate to request a new vendor to be onboarded into the system.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Click "Request Vendor" under Employee section',
            description: 'Start the vendor onboarding request process.'
          },
          {
            number: 2,
            title: 'Navigating to vendor requests',
            description: 'The tutorial will take you to the vendor request page.',
            icon: '🚀'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'vendor-basic-info',
        target: '[data-testid="vendor-basic-info"]',
        headline: 'Enter Vendor Basic Information',
        body: 'Provide the essential details about the new vendor.',
        route: '/vendor-onboarding/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Vendor details',
            description: 'Enter vendor name, business type, and contact information.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'vendor-business-info',
        target: '[data-testid="vendor-business-info"]',
        headline: 'Business Information',
        body: 'Add business registration and tax details for the vendor.',
        route: '/vendor-onboarding/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Business details',
            description: 'Enter registration number, tax ID, and business category.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'vendor-banking-info',
        target: '[data-testid="vendor-banking-info"]',
        headline: 'Banking Information',
        body: 'Provide banking details for payments to the vendor.',
        route: '/vendor-onboarding/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Payment details',
            description: 'Enter bank account number, IFSC code, and account holder name.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'vendor-documents',
        target: '[data-testid="vendor-documents"]',
        headline: 'Upload Documents',
        body: 'Upload required vendor documents for verification.',
        route: '/vendor-onboarding/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Document upload',
            description: 'Upload PAN card, GST certificate, and other required documents.'
          }
        ],
        anchor: 'left'
      },
      {
        id: 'submit-vendor-request',
        target: '[data-testid="button-submit-vendor"]',
        headline: 'Submit Vendor Request',
        body: 'Submit the vendor onboarding request for approval.',
        route: '/vendor-onboarding/request',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Submit for processing',
            description: 'Your vendor request will be reviewed and processed.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'completion',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Vendor Onboarding Complete!',
        body: 'You\'ve learned how to request vendor onboarding.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Vendor management ready!',
            description: 'You can now request new vendors for your expense needs.'
          }
        ],
        anchor: 'bottom'
      }
    ]
  },

  vendorClaim: {
    id: 'vendorClaim',
    title: 'Vendor Claim Tutorial',
    description: 'Learn how to manage and process vendor expense claims',
    totalSteps: 7,
    steps: [
      {
        id: 'welcome',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Welcome to Vendor Claims',
        body: 'Learn how to manage expense claims submitted by vendors.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Vendor Expense Processing',
            description: 'Handle vendor bills and expense claims efficiently.'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'navigate-vendor-claims',
        target: '[data-testid="nav-vendor-claims"]',
        headline: 'Go to Vendor Claims',
        body: 'Navigate to the vendor claims management section.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Click "Vendor Claims" in the menu',
            description: 'Access the vendor claims management area.'
          },
          {
            number: 2,
            title: 'Navigating to vendor claims',
            description: 'The tutorial will take you to vendor claims.',
            icon: '🚀'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'review-vendor-claim',
        target: '[data-testid="vendor-claim-list"]',
        headline: 'Review Vendor Claims',
        body: 'Review pending vendor claims that need approval or processing.',
        route: '/vendor-claims',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'View claim details',
            description: 'Click on a vendor claim to review details and attachments.'
          }
        ],
        anchor: 'top'
      },
      {
        id: 'verify-vendor-documents',
        target: '[data-testid="vendor-claim-documents"]',
        headline: 'Verify Documents',
        body: 'Review and verify vendor submitted documents and invoices.',
        route: '/vendor-claims',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Document verification',
            description: 'Check invoices, receipts, and supporting documents.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'approve-vendor-claim',
        target: '[data-testid="button-approve-vendor-claim"]',
        headline: 'Approve or Reject Claim',
        body: 'Make approval decisions on vendor claims after verification.',
        route: '/vendor-claims',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Approval decision',
            description: 'Approve valid claims or reject with comments for corrections.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'payment-processing',
        target: '[data-testid="vendor-payment-status"]',
        headline: 'Payment Processing',
        body: 'Track payment status and processing for approved vendor claims.',
        route: '/vendor-claims',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Payment tracking',
            description: 'Monitor payment processing and completion status.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'completion',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Vendor Claims Complete!',
        body: 'You\'ve learned how to manage vendor expense claims effectively.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Vendor claims mastered!',
            description: 'You can now efficiently process vendor claims and payments.'
          }
        ],
        anchor: 'bottom'
      }
    ]
  },

  configurationSetup: {
    id: 'configurationSetup',
    title: 'Configuration Setup Tutorial',
    description: 'Learn how to configure the expense management system foundations',
    totalSteps: 10,
    steps: [
      {
        id: 'welcome',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Welcome to Configuration Setup',
        body: 'Learn how to set up the foundational configurations for your expense management system.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'System Foundation',
            description: 'Configure essential settings before users can start using the system.'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'navigate-configuration',
        target: '[data-testid="nav-configuration"]',
        headline: 'Go to Configuration',
        body: 'Navigate to the main configuration section.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Click "Configuration" in the menu',
            description: 'Access the system configuration area.'
          },
          {
            number: 2,
            title: 'Navigating to configuration',
            description: 'The tutorial will take you to configuration settings.',
            icon: '⚙️'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'expense-categories',
        target: '[data-testid="nav-expense-groups"]',
        headline: 'Set Up Expense Categories',
        body: 'Configure expense categories that users will select when creating claims.',
        route: '/configuration',
        actions: [
          {
            number: 1,
            title: 'Essential foundation',
            description: 'Categories are required before users can create any expense claims.'
          },
          {
            number: 2,
            title: 'Navigate to Expense Groups',
            description: 'Click on "Expense Groups" to set up categories.',
            icon: '📝'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'create-expense-category',
        target: '[data-testid="button-add-expense-group"]',
        headline: 'Create Expense Categories',
        body: 'Add expense categories like Travel, Meals, Office Supplies, etc.',
        route: '/config/expense-groups',
        waitForElement: true,
        actions: [
          {
            number: 1,
            title: 'Add categories',
            description: 'Create categories that match your business expense types.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'expense-policy',
        target: '[data-testid="nav-expense-policy"]',
        headline: 'Configure Expense Policy',
        body: 'Set up expense policies and limits for different expense types.',
        route: '/configuration',
        actions: [
          {
            number: 1,
            title: 'Policy setup',
            description: 'Define spending limits and approval requirements.'
          },
          {
            number: 2,
            title: 'Navigate to Expense Policy',
            description: 'Click on "Expense Policy" to configure limits.',
            icon: '📋'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'workflow-setup',
        target: '[data-testid="nav-workflow"]',
        headline: 'Setup Approval Workflows',
        body: 'Configure approval workflows for different expense amounts and types.',
        route: '/configuration',
        actions: [
          {
            number: 1,
            title: 'Approval process',
            description: 'Define who approves expenses at different levels.'
          },
          {
            number: 2,
            title: 'Navigate to Workflow',
            description: 'Click on "Workflow" to set up approval chains.',
            icon: '🔄'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'user-roles',
        target: '[data-testid="nav-employees"]',
        headline: 'Configure User Roles',
        body: 'Set up employee roles and permissions for the expense system.',
        route: '/configuration',
        actions: [
          {
            number: 1,
            title: 'User management',
            description: 'Define roles like Employee, Manager, Accountant, and Admin.'
          },
          {
            number: 2,
            title: 'Navigate to Employees',
            description: 'Click on "Employees" to manage user roles.',
            icon: '👥'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'cost-centers',
        target: '[data-testid="nav-cost-center"]',
        headline: 'Setup Cost Centers',
        body: 'Configure cost centers for expense allocation and reporting.',
        route: '/configuration',
        actions: [
          {
            number: 1,
            title: 'Budget allocation',
            description: 'Create cost centers for departments and projects.'
          },
          {
            number: 2,
            title: 'Navigate to Cost Centers',
            description: 'Click on "Cost Center" to set up budget allocation.',
            icon: '🏢'
          }
        ],
        anchor: 'right'
      },
      {
        id: 'test-configuration',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Test Your Configuration',
        body: 'Go back to dashboard to test that all configurations are working properly.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'Configuration testing',
            description: 'Try creating a test expense claim to verify setup.'
          }
        ],
        anchor: 'bottom'
      },
      {
        id: 'completion',
        target: '[data-testid="nav-dashboard"]',
        headline: 'Configuration Setup Complete!',
        body: 'Congratulations! Your expense management system is now properly configured and ready for users.',
        route: '/',
        actions: [
          {
            number: 1,
            title: 'System ready!',
            description: 'Users can now create expense claims, requests, and manage vendors efficiently.'
          }
        ],
        anchor: 'bottom'
      }
    ]
  }
};

export type TutorialState = {
  isActive: boolean;
  currentTutorial: Tutorial | null;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  progress: number;
};

export type TutorialActionType = 
  | { type: 'START_TUTORIAL'; payload: { tutorialId: string } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: { stepIndex: number } }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'END_TUTORIAL' };