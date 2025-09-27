// Tutorial Prerequisites System - Dependency Management

export interface TutorialPrerequisite {
  id: string;
  name: string;
  description: string;
  checkFn: () => Promise<boolean>;
  setupRoute?: string;
  setupInstructions?: string;
}

export const TUTORIAL_PREREQUISITES: Record<string, TutorialPrerequisite> = {
  expenseCategories: {
    id: 'expenseCategories',
    name: 'Expense Categories',
    description: 'At least one expense category must be configured',
    checkFn: async () => {
      try {
        const response = await fetch('/api/expense-categories');
        const categories = await response.json();
        return Array.isArray(categories) && categories.length > 0;
      } catch {
        return false;
      }
    },
    setupRoute: '/config/expense-groups',
    setupInstructions: 'Go to Configuration > Expense Groups and create expense categories like Travel, Meals, Office Supplies, etc.'
  },
  
  expensePolicy: {
    id: 'expensePolicy',
    name: 'Expense Policy',
    description: 'Expense policies and limits must be configured',
    checkFn: async () => {
      try {
        const response = await fetch('/api/expense-policy');
        const policies = await response.json();
        return Array.isArray(policies) && policies.length > 0;
      } catch {
        return false;
      }
    },
    setupRoute: '/config/expense-policy',
    setupInstructions: 'Go to Configuration > Expense Policy and set up spending limits and approval requirements.'
  },

  approvalWorkflow: {
    id: 'approvalWorkflow',
    name: 'Approval Workflow',
    description: 'Approval workflows must be configured for expense processing',
    checkFn: async () => {
      try {
        const response = await fetch('/api/workflow-assignments');
        const workflows = await response.json();
        return Array.isArray(workflows) && workflows.length > 0;
      } catch {
        return false;
      }
    },
    setupRoute: '/config/workflow',
    setupInstructions: 'Go to Configuration > Workflow and set up approval chains for different expense types and amounts.'
  },

  employees: {
    id: 'employees',
    name: 'Employee Setup',
    description: 'Employee roles and permissions must be configured',
    checkFn: async () => {
      try {
        const response = await fetch('/api/employees');
        const employees = await response.json();
        return Array.isArray(employees) && employees.length > 1; // More than just admin
      } catch {
        return false;
      }
    },
    setupRoute: '/config/employees',
    setupInstructions: 'Go to Configuration > Employees and set up user roles and permissions.'
  },

  costCenters: {
    id: 'costCenters',
    name: 'Cost Centers',
    description: 'Cost centers should be configured for expense allocation',
    checkFn: async () => {
      try {
        const response = await fetch('/api/cost-center-config');
        const costCenters = await response.json();
        return Array.isArray(costCenters) && costCenters.length > 0;
      } catch {
        return false;
      }
    },
    setupRoute: '/configuration/cost-center',
    setupInstructions: 'Go to Configuration > Cost Center and create cost centers for departments and projects.'
  }
};

// Tutorial dependency mappings - what prerequisites each tutorial needs
export const TUTORIAL_DEPENDENCIES: Record<string, string[]> = {
  // Employee tours need basic system configuration
  employeeClaims: ['expenseCategories', 'approvalWorkflow'],
  expenseRequest: ['expenseCategories', 'expensePolicy', 'approvalWorkflow'],
  
  // Vendor tours need more comprehensive setup
  vendorOnboarding: ['expenseCategories', 'approvalWorkflow', 'employees'],
  vendorClaim: ['expenseCategories', 'approvalWorkflow', 'employees', 'costCenters'],
  
  // Configuration setup has no dependencies (it IS the foundation)
  configurationSetup: []
};

// Check if tutorial can be started based on its dependencies
export async function checkTutorialPrerequisites(tutorialId: string): Promise<{
  canStart: boolean;
  missingPrerequisites: TutorialPrerequisite[];
  allPrerequisites: TutorialPrerequisite[];
}> {
  const dependencyIds = TUTORIAL_DEPENDENCIES[tutorialId] || [];
  const allPrerequisites = dependencyIds.map(id => TUTORIAL_PREREQUISITES[id]).filter(Boolean);
  
  const results = await Promise.all(
    allPrerequisites.map(async (prerequisite) => ({
      prerequisite,
      satisfied: await prerequisite.checkFn()
    }))
  );
  
  const missingPrerequisites = results
    .filter(result => !result.satisfied)
    .map(result => result.prerequisite);
  
  return {
    canStart: missingPrerequisites.length === 0,
    missingPrerequisites,
    allPrerequisites
  };
}

// Get setup status for all prerequisites  
export async function getSetupStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  for (const [id, prerequisite] of Object.entries(TUTORIAL_PREREQUISITES)) {
    try {
      status[id] = await prerequisite.checkFn();
    } catch {
      status[id] = false;
    }
  }
  
  return status;
}