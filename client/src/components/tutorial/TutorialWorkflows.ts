// Interface definitions for tutorial system
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  screen: string;
  action: string;
  element?: string | null;
  hint?: string;
  nextScreen?: string;
  media?: string | null;
  rewards?: string;
}

export interface TutorialWorkflow {
  name: string;
  description: string;
  role: string;
  totalSteps: number;
  rewards: string;
  steps: WorkflowStep[];
}

// COMPREHENSIVE Tutorial Workflow Definitions - All Tours Active!
export const TUTORIAL_WORKFLOWS: Record<string, TutorialWorkflow> = {
  "complete-admin-setup": {
    name: "Complete Admin Setup",
    description: "Complete walkthrough of setting up and managing your expense system as an administrator",
    role: "admin",
    totalSteps: 12,
    rewards: "🏆 Admin Master Badge",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Your Expense Manager! 🎉",
        description: "This guided tour will walk you through the complete setup and management of your expense system. We'll cover user roles, workflows, claims, and approvals.",
        screen: "dashboard",
        action: "show_modal",
        element: null,
        hint: "This tour will take about 8-10 minutes. You can skip or pause anytime."
      },
      {
        id: "navigate-to-configuration",
        title: "Let's Start with Configuration",
        description: "First, we need to set up the foundation of your expense system. Click on the Configuration menu to begin.",
        screen: "dashboard",
        action: "click",
        element: "[data-testid='nav-configuration']",
        hint: "Click on 'Configuration' in the sidebar to open the system settings.",
        nextScreen: "configuration"
      },
      {
        id: "user-roles-intro",
        title: "User Roles Management",
        description: "User roles define who can do what in your system. Let's create and manage user roles to control permissions.",
        screen: "configuration",
        action: "click",
        element: "[data-testid='nav-user-roles']",
        hint: "Click on 'User Roles' to manage user permissions and access levels.",
        nextScreen: "user-roles"
      },
      {
        id: "add-new-role",
        title: "Create a New Role",
        description: "Now let's create a new user role. This allows you to customize permissions for different types of users in your organization.",
        screen: "user-roles",
        action: "click",
        element: "[data-testid='button-add-role']",
        hint: "Click the 'Add Role' button to create a new user role with custom permissions."
      },
      {
        id: "workflow-configuration",
        title: "Configure Approval Workflows",
        description: "Workflows define how expense requests move through your approval process. Let's set up workflows to automate approvals.",
        screen: "configuration",
        action: "click",
        element: "[data-testid='nav-workflows']",
        hint: "Click on 'Workflows' to configure how expense approvals flow through your organization.",
        nextScreen: "workflows"
      },
      {
        id: "create-workflow",
        title: "Create Your First Workflow",
        description: "Let's create an approval workflow that defines the steps and approvers for expense requests.",
        screen: "workflows",
        action: "click",
        element: "[data-testid='button-create-workflow']",
        hint: "Click 'Create Workflow' to set up your approval process with multiple levels and conditions."
      },
      {
        id: "expense-categories",
        title: "Set Up Expense Categories",
        description: "Categories help organize and track different types of expenses. Let's create categories that match your business needs.",
        screen: "configuration",
        action: "click",
        element: "[data-testid='nav-expense-categories']",
        hint: "Click on 'Expense Categories' to create and manage expense types like Travel, Meals, Office Supplies, etc.",
        nextScreen: "expense-categories"
      },
      {
        id: "add-expense-category",
        title: "Add Your First Category",
        description: "Create an expense category to organize your team's expenses effectively.",
        screen: "expense-categories",
        action: "click",
        element: "[data-testid='button-add-category']",
        hint: "Click 'Add Category' to create expense types that employees can select from."
      },
      {
        id: "vendor-management",
        title: "Vendor Management Setup",
        description: "Manage vendors and suppliers that your organization works with. This helps track expenses by vendor and maintain vendor relationships.",
        screen: "configuration",
        action: "click",
        element: "[data-testid='nav-vendors']",
        hint: "Click on 'Vendors' to manage your suppliers and business partners.",
        nextScreen: "vendors"
      },
      {
        id: "reporting-setup",
        title: "Configure Reporting & Analytics",
        description: "Set up custom reports to track expenses, analyze spending patterns, and generate insights for better financial management.",
        screen: "configuration",
        action: "click",
        element: "[data-testid='nav-reports']",
        hint: "Click on 'Reports' to configure custom analytics and expense tracking reports.",
        nextScreen: "reports"
      },
      {
        id: "system-settings",
        title: "Finalize System Settings",
        description: "Configure global system settings including notifications, approval limits, and organizational preferences.",
        screen: "configuration",
        action: "click",
        element: "[data-testid='nav-settings']",
        hint: "Click on 'Settings' to configure global system preferences and limits.",
        nextScreen: "settings"
      },
      {
        id: "completion",
        title: "Admin Setup Complete! 🎉",
        description: "Congratulations! You've successfully configured your expense management system. Your team can now start submitting and managing expenses efficiently.",
        screen: "dashboard",
        action: "show_success",
        element: null,
        hint: "Your system is now ready! Monitor the dashboard to track expenses and approvals as your team starts using the system."
      }
    ]
  },

  "employee-quick-start": {
    name: "Employee Quick Start",
    description: "Learn how to submit expense claims, upload receipts, and track approvals",
    role: "employee",
    totalSteps: 6,
    rewards: "🎖️ Expense Pro Badge",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Expense Claims! 🎯",
        description: "This quick tour will teach you how to submit expense claims, upload receipts, and track your submissions through the approval process.",
        screen: "dashboard",
        action: "show_modal",
        element: null,
        hint: "This tour takes about 3-4 minutes and covers the essentials you'll use daily."
      },
      {
        id: "navigate-to-claims",
        title: "Access Your Expense Claims",
        description: "Let's start by navigating to the expense claims section where you can view and manage all your submissions.",
        screen: "dashboard",
        action: "click",
        element: "[data-testid='nav-expense-claims']",
        hint: "Click on 'Expense Claims' in the sidebar to view your submissions and create new ones.",
        nextScreen: "expense-claims"
      },
      {
        id: "create-new-claim",
        title: "Submit Your First Expense",
        description: "Click the 'New Claim' button to start creating your expense submission. You can add multiple expenses to a single claim.",
        screen: "expense-claims",
        action: "click",
        element: "[data-testid='button-new-claim']",
        hint: "Use 'New Claim' to group related expenses together (like a business trip with multiple receipts)."
      },
      {
        id: "upload-receipt",
        title: "Smart Receipt Upload 📸",
        description: "Upload receipt images here. Our AI will automatically extract information like amount, date, and vendor to save you time!",
        screen: "new-claim",
        action: "highlight",
        element: "[data-testid='receipt-upload-area']",
        hint: "Take clear photos of receipts - our AI works best with well-lit, straight images."
      },
      {
        id: "review-and-submit",
        title: "Review Before Submitting",
        description: "Always review the extracted information and add any required notes or justifications before submitting your claim.",
        screen: "new-claim",
        action: "highlight",
        element: "[data-testid='claim-review-section']",
        hint: "Double-check amounts and dates - accurate submissions get approved faster!"
      },
      {
        id: "track-approval",
        title: "Track Your Submissions 📊",
        description: "After submitting, you can track the approval status and see any feedback from approvers in your claims list.",
        screen: "expense-claims",
        action: "highlight",
        element: "[data-testid='claims-status-list']",
        hint: "Green means approved, yellow is pending, and red needs your attention for corrections."
      }
    ]
  },

  "manager-approval-flow": {
    name: "Manager Approval Flow",
    description: "Learn how to review, approve, and manage expense requests efficiently",
    role: "manager",
    totalSteps: 6,
    rewards: "👑 Approval Master Badge",
    steps: [
      {
        id: "welcome",
        title: "Master the Approval Process! ⚡",
        description: "Learn how to efficiently review and approve expense claims from your team members. We'll cover approval workflows, batch operations, and feedback tools.",
        screen: "dashboard",
        action: "show_modal",
        element: null,
        hint: "This tour covers manager-specific features that will save you time reviewing expenses."
      },
      {
        id: "pending-approvals",
        title: "Review Pending Approvals",
        description: "Your pending approvals appear here on the dashboard. This gives you a quick overview of what needs your attention.",
        screen: "dashboard",
        action: "highlight",
        element: "[data-testid='pending-approvals-widget']",
        hint: "Click on any pending item to review the full details and make approval decisions."
      },
      {
        id: "approval-details",
        title: "Review Claim Details",
        description: "When reviewing a claim, check the receipts, amounts, and any notes from the employee. Look for policy compliance and reasonable amounts.",
        screen: "approval-detail",
        action: "highlight",
        element: "[data-testid='claim-review-panel']",
        hint: "Pay attention to expense categories, amounts, and whether receipts match the claimed expenses."
      },
      {
        id: "approve-or-reject",
        title: "Make Approval Decisions",
        description: "Use the approve or reject buttons after reviewing. You can add comments to guide employees on policy compliance.",
        screen: "approval-detail",
        action: "highlight",
        element: "[data-testid='approval-actions']",
        hint: "Provide clear feedback when rejecting claims to help employees understand requirements."
      },
      {
        id: "batch-operations",
        title: "Bulk Approve Multiple Claims",
        description: "For efficiency, you can select multiple claims and approve them all at once if they meet your criteria.",
        screen: "approvals",
        action: "highlight",
        element: "[data-testid='batch-approve']",
        hint: "Use bulk operations for routine, policy-compliant expenses to save time."
      },
      {
        id: "completion",
        title: "Approval Mastery Achieved! 🌟",
        description: "You now know how to efficiently review claims, make approval decisions, and manage your team's expenses. Keep your team moving fast!",
        screen: "approvals",
        action: "show_success",
        element: null,
        hint: "Quick approvals keep your team productive and maintain good expense management practices."
      }
    ]
  },

  "ocr-and-ai-features": {
    name: "AI-Powered Features",
    description: "Learn how AI automatically extracts information from receipts and streamlines expense submission",
    role: "all",
    totalSteps: 5,
    rewards: "🤖 AI Expert Badge",
    steps: [
      {
        id: "welcome",
        title: "Meet Your AI Assistant! 🤖",
        description: "Our AI-powered features make expense submission faster and more accurate by automatically reading receipt information.",
        screen: "dashboard",
        action: "show_modal",
        element: null,
        hint: "AI can extract dates, amounts, vendor names, and categories from receipt images."
      },
      {
        id: "ai-upload-area",
        title: "Smart Receipt Upload",
        description: "When you upload a receipt here, our AI automatically extracts key information like date, amount, and vendor.",
        screen: "employee-claims",
        action: "highlight",
        element: "[data-testid='ocr-upload-zone']",
        hint: "Try uploading a clear receipt image to see AI extraction in action."
      },
      {
        id: "ai-extraction-preview",
        title: "Review AI Extracted Data",
        description: "After AI processes your receipt, review and edit the extracted information before submitting your claim.",
        screen: "new-claim",
        action: "highlight",
        element: "[data-testid='ai-extracted-data']",
        hint: "Always verify AI-extracted information for accuracy before submitting."
      },
      {
        id: "smart-categorization",
        title: "Automatic Categorization",
        description: "AI suggests expense categories based on the vendor and receipt content, making classification faster and more consistent.",
        screen: "new-claim",
        action: "highlight",
        element: "[data-testid='category-suggestions']",
        hint: "AI learns from your patterns to suggest the most appropriate expense categories."
      },
      {
        id: "completion",
        title: "AI-Powered Efficiency Unlocked! ⚡",
        description: "You now know how to leverage AI for faster, more accurate expense submissions. Let technology do the heavy lifting!",
        screen: "new-claim",
        action: "show_success",
        element: null,
        hint: "Use AI features to reduce manual data entry and improve expense accuracy."
      }
    ]
  }
};