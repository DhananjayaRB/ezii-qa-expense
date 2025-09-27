import { TourFlow } from './InteractiveProductTour';

export const TOUR_FLOWS: Record<string, TourFlow> = {
  'complete-admin-setup': {
    id: 'complete-admin-setup',
    name: 'Complete Admin Setup',
    title: 'Master Your Expense Management System',
    description: 'Complete walkthrough of setting up and managing your expense system as an administrator',
    category: 'admin',
    estimatedTime: '8-10 minutes',
    completionReward: '🏆 Admin Master - You now know how to fully configure and manage your expense system!',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Your Expense Manager! 🎉',
        content: 'This guided tour will walk you through the complete setup and management of your expense system. We\'ll cover user roles, workflows, claims, and approvals.',
        placement: 'center',
        action: 'wait',
        hint: 'This tour will take about 8-10 minutes. You can skip or pause anytime.'
      },
      {
        id: 'navigate-to-configuration',
        title: 'Let\'s Start with Configuration',
        content: 'First, we need to set up the foundation of your expense system. Click on the Configuration menu to begin.',
        target: '[data-testid="nav-configuration"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/configuration',
        hint: 'Click on "Configuration" in the sidebar to open the system settings.'
      },
      {
        id: 'user-roles-intro',
        title: 'User Roles Management',
        content: 'User roles define who can do what in your system. Let\'s create and manage user roles to control permissions.',
        target: '[data-testid="nav-user-roles"]',
        placement: 'bottom',
        action: 'click',
        requiredClick: true,
        route: '/configuration/user-roles',
        hint: 'Click on "User Roles" to manage user permissions and access levels.'
      },
      {
        id: 'add-new-role',
        title: 'Create a New Role',
        content: 'Now let\'s create a new user role. This allows you to customize permissions for different types of users in your organization.',
        target: '[data-testid="button-add-role"]',
        placement: 'bottom',
        action: 'click',
        requiredClick: true,
        hint: 'Click the "Add Role" button to create a new user role with custom permissions.'
      },
      {
        id: 'workflow-configuration',
        title: 'Configure Approval Workflows',
        content: 'Workflows define how expense requests move through your approval process. Let\'s set up workflows to automate approvals.',
        target: '[data-testid="nav-workflows"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/configuration/workflows',
        hint: 'Click on "Workflows" to configure how expense approvals flow through your organization.'
      },
      {
        id: 'create-workflow',
        title: 'Create Your First Workflow',
        content: 'Let\'s create an approval workflow that defines the steps and approvers for expense requests.',
        target: '[data-testid="button-create-workflow"]',
        placement: 'bottom',
        action: 'click',
        requiredClick: true,
        hint: 'Click "Create Workflow" to set up your approval process with multiple levels and conditions.'
      },
      {
        id: 'navigate-to-dashboard',
        title: 'Back to Dashboard',
        content: 'Great! Now let\'s go back to the dashboard to see how these configurations work in practice.',
        target: '[data-testid="nav-dashboard"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/dashboard',
        hint: 'Click on "Dashboard" to return to the main overview of your expense system.'
      },
      {
        id: 'expense-claims-section',
        title: 'Go to Employee Claims',
        content: 'Let\'s start by navigating to the Employee Claims section where you can manage all your expense requests.',
        target: '[data-testid="nav-claim"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/employee/claim',
        hint: 'Click on "Claim" under the Employee section in the sidebar to access your expense management area.'
      },
      {
        id: 'create-sample-claim',
        title: 'Create a Sample Claim',
        content: 'Let\'s create a sample expense claim to see how the workflow you just configured works in action.',
        target: '[data-testid="button-new-claim"]',
        placement: 'bottom',
        action: 'click',
        requiredClick: true,
        hint: 'Click "New Claim" to start creating an expense claim and see your workflow in action.'
      },
      {
        id: 'approval-dashboard',
        title: 'Review Pending Approvals',
        content: 'As an admin or manager, you can review and approve expense claims here. This is where your configured workflows come to life.',
        target: '[data-testid="nav-approvals"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/approvals',
        hint: 'Click on "Approvals" to see pending expense requests that need your review.'
      },
      {
        id: 'completion',
        title: 'Congratulations! Setup Complete 🎉',
        content: 'You\'ve successfully learned how to configure user roles, set up workflows, manage claims, and handle approvals. Your expense management system is ready to use!',
        placement: 'center',
        action: 'complete',
        hint: 'You can always restart this tour from the Help menu if you need a refresher.'
      }
    ]
  },

  'employee-quick-start': {
    id: 'employee-quick-start',
    name: 'Employee Quick Start',
    title: 'Submit Your First Expense Claim',
    description: 'Learn how to submit expense claims, upload receipts, and track approvals',
    category: 'employee',
    estimatedTime: '3-4 minutes',
    completionReward: '💼 Expense Pro - You\'re ready to manage your expenses like a pro!',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Employee! 👋',
        content: 'This quick tour will show you how to submit expense claims, upload receipts, and track your requests.',
        placement: 'center',
        action: 'wait',
        hint: 'This tour takes about 3-4 minutes and covers everything you need to know as an employee.'
      },
      {
        id: 'navigate-to-claims',
        title: 'Go to Employee Claims', 
        content: 'Let\'s start by navigating to the Employee Claims section where you can manage all your expense requests.',
        target: '[data-testid="nav-claim"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/employee/claim',
        hint: 'Click on "Claim" under the Employee section in the sidebar to access your expense management area.'
      },
      {
        id: 'create-new-claim',
        title: 'Submit a New Expense Claim',
        content: 'Click the "New Claim" button to start submitting your expense. This is where you\'ll add all your expense details.',
        target: '[data-testid="button-new-claim"]',
        placement: 'bottom',
        action: 'click',
        requiredClick: true,
        hint: 'Click "New Claim" to open the expense submission form.'
      },
      {
        id: 'expense-form-intro',
        title: 'Fill Out Your Expense Details',
        content: 'This form captures all the important information about your expense: date, category, amount, and description.',
        target: '[data-testid="expense-form"]',
        placement: 'left',
        action: 'highlight',
        hint: 'Fill in the date, select a category, enter the amount, and add a description for your expense.'
      },
      {
        id: 'receipt-upload',
        title: 'Upload Your Receipt',
        content: 'Always attach receipts or supporting documents. Our AI can even extract information from receipts automatically!',
        target: '[data-testid="receipt-upload"]',
        placement: 'top',
        action: 'highlight',
        hint: 'Drag and drop your receipt image or PDF, or click to browse files.'
      },
      {
        id: 'track-approvals',
        title: 'Track Your Submission',
        content: 'After submitting, you can track the approval status of your claims right here. You\'ll see which stage your request is in.',
        target: '[data-testid="claims-list"]',
        placement: 'top',
        action: 'highlight',
        hint: 'Your submitted claims will appear in this list with their current approval status.'
      },
      {
        id: 'completion',
        title: 'You\'re All Set! ✅',
        content: 'You now know how to submit expenses, upload receipts, and track approvals. Start submitting your expenses and get reimbursed faster!',
        placement: 'center',
        action: 'complete',
        hint: 'Remember: always attach receipts and provide clear descriptions for faster approvals.'
      }
    ]
  },

  'manager-approval-flow': {
    id: 'manager-approval-flow',
    name: 'Manager Approval Flow',
    title: 'Master the Approval Process',
    description: 'Learn how to review, approve, and manage expense requests efficiently',
    category: 'manager',
    estimatedTime: '4-5 minutes',
    completionReward: '👑 Approval Master - You can now efficiently manage team expenses!',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Manager! 🏢',
        content: 'This tour will show you how to efficiently review and approve expense requests from your team members.',
        placement: 'center',
        action: 'wait',
        hint: 'Learn to review claims quickly and maintain compliance with company policies.'
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        content: 'Your dashboard shows pending approvals at a glance. This widget tells you how many requests need your attention.',
        target: '[data-testid="widget-pending-approvals"]',
        placement: 'bottom',
        action: 'highlight',
        hint: 'Keep an eye on this number - it shows claims waiting for your review.'
      },
      {
        id: 'navigate-to-approvals',
        title: 'Access Approval Dashboard',
        content: 'Click on "Approvals" to see all pending expense requests that require your review and approval.',
        target: '[data-testid="nav-approvals"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        route: '/approvals',
        hint: 'This is your main workspace for reviewing and approving expense requests.'
      },
      {
        id: 'review-claim-details',
        title: 'Review Claim Details',
        content: 'Click on any expense claim to review the details, receipts, and supporting information before making your decision.',
        target: '[data-testid="claim-item-first"]',
        placement: 'right',
        action: 'click',
        requiredClick: true,
        hint: 'Always review receipt images and verify expense details match company policy.'
      },
      {
        id: 'approval-actions',
        title: 'Approve or Reject',
        content: 'Use these buttons to approve valid expenses or reject those that don\'t meet policy requirements. Add comments to explain your decision.',
        target: '[data-testid="approval-actions"]',
        placement: 'top',
        action: 'highlight',
        hint: 'Provide clear feedback when rejecting claims to help employees understand requirements.'
      },
      {
        id: 'batch-operations',
        title: 'Bulk Approve Multiple Claims',
        content: 'For efficiency, you can select multiple claims and approve them all at once if they meet your criteria.',
        target: '[data-testid="batch-approve"]',
        placement: 'bottom',
        action: 'highlight',
        hint: 'Use bulk operations for routine, policy-compliant expenses to save time.'
      },
      {
        id: 'completion',
        title: 'Approval Mastery Achieved! 🌟',
        content: 'You now know how to efficiently review claims, make approval decisions, and manage your team\'s expenses. Keep your team moving fast!',
        placement: 'center',
        action: 'complete',
        hint: 'Quick approvals keep your team productive and maintain good expense management practices.'
      }
    ]
  },

  'ocr-and-ai-features': {
    id: 'ocr-and-ai-features',
    name: 'AI-Powered Features',
    title: 'Discover Smart Expense Processing',
    description: 'Learn how AI automatically extracts information from receipts and streamlines expense submission',
    category: 'all',
    estimatedTime: '3 minutes',
    completionReward: '🤖 AI Expert - You\'re leveraging cutting-edge technology for expenses!',
    steps: [
      {
        id: 'welcome',
        title: 'Meet Your AI Assistant! 🤖',
        content: 'Our AI-powered features make expense submission faster and more accurate by automatically reading receipt information.',
        placement: 'center',
        action: 'wait',
        hint: 'AI can extract dates, amounts, vendor names, and categories from receipt images.'
      },
      {
        id: 'ai-upload-area',
        title: 'Smart Receipt Upload',
        content: 'When you upload a receipt here, our AI automatically extracts key information like date, amount, and vendor.',
        target: '[data-testid="ocr-upload-zone"]',
        placement: 'bottom',
        action: 'highlight',
        route: '/employee/claim',
        hint: 'Try uploading a clear receipt image to see AI extraction in action.'
      },
      {
        id: 'ai-extraction-preview',
        title: 'Review AI Extracted Data',
        content: 'After AI processes your receipt, review and edit the extracted information before submitting your claim.',
        target: '[data-testid="ai-extracted-data"]',
        placement: 'left',
        action: 'highlight',
        hint: 'Always verify AI-extracted information for accuracy before submitting.'
      },
      {
        id: 'smart-categorization',
        title: 'Automatic Categorization',
        content: 'AI suggests expense categories based on the vendor and receipt content, making classification faster and more consistent.',
        target: '[data-testid="category-suggestions"]',
        placement: 'top',
        action: 'highlight',
        hint: 'AI learns from your patterns to suggest the most appropriate expense categories.'
      },
      {
        id: 'completion',
        title: 'AI-Powered Efficiency Unlocked! ⚡',
        content: 'You now know how to leverage AI for faster, more accurate expense submissions. Let technology do the heavy lifting!',
        placement: 'center',
        action: 'complete',
        hint: 'Use AI features to reduce manual data entry and improve expense accuracy.'
      }
    ]
  }
};

// Helper function to get flows by category
export function getFlowsByCategory(category: 'admin' | 'employee' | 'manager' | 'all'): TourFlow[] {
  return Object.values(TOUR_FLOWS).filter(flow => 
    flow.category === category || flow.category === 'all'
  );
}

// Helper function to get flow by ID
export function getFlowById(id: string): TourFlow | undefined {
  return TOUR_FLOWS[id];
}