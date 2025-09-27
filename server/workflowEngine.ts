console.log("🚀 WorkflowEngine v2025-09-17 loaded");

import { IStorage } from './storage';
import type { 
  Workflow, 
  WorkflowAssignment, 
  WorkflowLevel, 
  WorkflowRole,
  User 
} from '../shared/schema';

export interface WorkflowContext {
  processType: 'request' | 'claim' | 'payment' | 'vendor';
  vendorId?: string;
  expenseHeadId?: string;
  amount?: number;
  submitterId: string;
  companyId: string;
}

export interface WorkflowResult {
  workflowId: string | null;
  currentLevel: number;
  requiredApprovers: string[]; // user IDs
  isComplete: boolean;
  nextLevel?: number;
  fallbackToLegacy: boolean;
  selfApprovalRequired?: boolean; // Flag for self-approval deadlock scenarios
}

export interface ApprovalAction {
  approverId: string;
  action: 'approve' | 'reject';
  comments?: string;
  timestamp: Date;
}

export class WorkflowEngine {
  private workflowCache = new Map<string, Workflow[]>();
  private assignmentCache = new Map<string, (WorkflowAssignment & { workflow: Workflow })[]>();
  private lastCacheTime = 0;
  private readonly cacheTimeout = 30000; // 30 seconds

  constructor(private storage: IStorage) {}

  /**
   * OPTIMIZED: Bulk workflow determination for multiple contexts
   * Loads workflows and assignments once, then processes all contexts
   */
  async bulkDetermineWorkflows(contexts: WorkflowContext[]): Promise<Map<string, Workflow | null>> {
    const results = new Map<string, Workflow | null>();
    
    if (contexts.length === 0) return results;

    // Get all unique company IDs and process types
    const companyIds = [...new Set(contexts.map(ctx => ctx.companyId))];
    const processTypes = [...new Set(contexts.map(ctx => ctx.processType))];
    
    // Bulk load workflows and assignments for all companies and process types
    await this.loadWorkflowCache(companyIds, processTypes);
    
    // Process each context using cached data
    for (const context of contexts) {
      const contextKey = this.getContextKey(context);
      const workflow = await this.determineWorkflowFromCache(context);
      results.set(contextKey, workflow);
    }
    
    return results;
  }

  /**
   * OPTIMIZED: Load and cache workflows and assignments for bulk operations
   */
  private async loadWorkflowCache(companyIds: string[], processTypes: string[]): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheTime < this.cacheTimeout && this.workflowCache.size > 0) {
      return; // Use existing cache
    }

    console.log(`🚀 Loading workflow cache for ${companyIds.length} companies and ${processTypes.length} process types`);
    
    // Bulk load all workflows
    const allWorkflows = await this.storage.getWorkflows({ isActive: true });
    
    // Group workflows by company
    for (const companyId of companyIds) {
      const companyWorkflows = allWorkflows.filter(w => 
        w.companyId === companyId || w.companyId === null
      );
      this.workflowCache.set(companyId, companyWorkflows);
    }
    
    // Bulk load all assignments  
    for (const processType of processTypes) {
      const assignments = await this.storage.getWorkflowAssignments({ processType });
      this.assignmentCache.set(processType, assignments);
    }
    
    this.lastCacheTime = now;
    console.log(`✅ Workflow cache loaded: ${this.workflowCache.size} company caches, ${this.assignmentCache.size} assignment caches`);
  }

  private getContextKey(context: WorkflowContext): string {
    return `${context.companyId}:${context.processType}:${context.vendorId || ''}:${context.expenseHeadId || ''}`;
  }

  private async determineWorkflowFromCache(context: WorkflowContext): Promise<Workflow | null> {
    try {
      // Step 1: Try cached assignments
      const assignments = this.assignmentCache.get(context.processType) || [];
      
      const tenantAssignments = assignments.filter(assignment => 
        assignment.workflow.companyId === context.companyId
      );
      const globalAssignments = assignments.filter(assignment => 
        assignment.workflow.companyId === null
      );
      const companyAssignments = tenantAssignments.length > 0 ? tenantAssignments : globalAssignments;
      
      // Find the most specific matching assignment
      const relevantAssignments = companyAssignments.sort((a, b) => a.priority - b.priority);
      
      for (const assignment of relevantAssignments) {
        // Check for exact vendor match
        if (context.vendorId && assignment.vendorId === context.vendorId) {
          return assignment.workflow;
        }
        
        // Check for exact expense category match
        if (context.expenseHeadId && assignment.expenseHeadId === context.expenseHeadId) {
          return assignment.workflow;
        }
        
        // Check for default assignment
        if (!assignment.vendorId && !assignment.expenseHeadId && assignment.isDefault) {
          return assignment.workflow;
        }
      }

      // Step 2: Fallback to cached workflows
      const companyWorkflows = this.workflowCache.get(context.companyId) || [];
      const tenantWorkflows = companyWorkflows.filter(w => w.companyId === context.companyId);
      const globalWorkflows = companyWorkflows.filter(w => w.companyId === null);
      const workflowsToCheck = tenantWorkflows.length > 0 ? tenantWorkflows : globalWorkflows;
      
      const matchingWorkflow = workflowsToCheck.find(workflow => 
        workflow.processTypes?.includes(context.processType)
      );
      
      return matchingWorkflow || null;

    } catch (error) {
      console.error('Error determining workflow from cache:', error);
      return null;
    }
  }

  /**
   * Determines the applicable workflow for a given context
   * Returns null if no workflow is found (fallback to legacy)
   */
  async determineWorkflow(context: WorkflowContext): Promise<Workflow | null> {
    try {
      // Step 1: Try existing assignment-based logic (may be empty)
      const assignments = await this.storage.getWorkflowAssignments({ processType: context.processType });
      
      // SECURITY: Prefer tenant-specific assignments, fall back to global (null companyId)
      const tenantAssignments = assignments.filter(assignment => 
        assignment.workflow.companyId === context.companyId
      );
      const globalAssignments = assignments.filter(assignment => 
        assignment.workflow.companyId === null
      );
      const companyAssignments = tenantAssignments.length > 0 ? tenantAssignments : globalAssignments;
      
      console.log(`🔍 Assignment scope: ${tenantAssignments.length} tenant-specific, ${globalAssignments.length} global, using ${companyAssignments.length} assignments`);
      
      // Filter and sort assignments by priority
      const relevantAssignments = companyAssignments
        .sort((a, b) => a.priority - b.priority); // Lower priority number = higher precedence

      // Find the most specific matching assignment
      let selectedAssignment: (WorkflowAssignment & { workflow: Workflow }) | null = null;

      for (const assignment of relevantAssignments) {
        // Check for exact vendor match
        if (context.vendorId && assignment.vendorId === context.vendorId) {
          selectedAssignment = assignment;
          break;
        }
        
        // Check for exact expense category match
        if (context.expenseHeadId && assignment.expenseHeadId === context.expenseHeadId) {
          selectedAssignment = assignment;
          break;
        }
        
        // Check for default assignment (no vendor or category specified)
        if (!assignment.vendorId && !assignment.expenseHeadId && assignment.isDefault) {
          selectedAssignment = assignment;
          // Continue to check for more specific matches
        }
      }

      if (selectedAssignment) {
        return selectedAssignment.workflow;
      }

      // Step 2: FALLBACK - Look for active workflows by process_type when no assignments exist
      console.log(`No workflow assignment found for ${context.processType}, trying fallback lookup`);
      
      let processTypesToCheck = [context.processType];
      
      // REMOVED FALLBACK: Claims should only use workflows that explicitly support 'claim' process type
      // The old fallback logic was incorrect - it allowed claims to use request-only workflows
      // Claims should only match workflows that explicitly include 'claim' in their processTypes

      const workflows = await this.storage.getWorkflows({ 
        isActive: true 
      });
      
      // SECURITY: Prefer tenant-specific workflows, fall back to global (null companyId)
      const tenantWorkflows = workflows.filter(workflow => 
        workflow.companyId === context.companyId
      );
      const globalWorkflows = workflows.filter(workflow => 
        workflow.companyId === null
      );
      const companyWorkflows = tenantWorkflows.length > 0 ? tenantWorkflows : globalWorkflows;
      
      console.log(`🔍 Fallback scope: ${tenantWorkflows.length} tenant-specific, ${globalWorkflows.length} global, using ${companyWorkflows.length} workflows`);

      for (const processType of processTypesToCheck) {
        const matchingWorkflow = companyWorkflows.find(workflow => 
          workflow.processTypes?.includes(processType)
        );
        
        if (matchingWorkflow) {
          console.log(`✅ Fallback workflow found: ${matchingWorkflow.id} for process type: ${processType}`);
          return matchingWorkflow;
        }
      }

      console.log(`❌ No workflow found for process types: ${processTypesToCheck.join(', ')}`);
      return null; // No applicable workflow found

    } catch (error) {
      console.error('Error determining workflow:', error);
      return null; // Fallback to legacy on error
    }
  }

  /**
   * OPTIMIZED: Bulk get approvers for multiple workflow levels
   * Loads users once, then processes all approver requests
   */
  async bulkGetApproversForLevels(
    requests: Array<{ workflowId: string; level: number; context: WorkflowContext }>
  ): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();
    
    if (requests.length === 0) return results;

    // Get all unique workflow IDs and company IDs
    const workflowIds = [...new Set(requests.map(r => r.workflowId))];
    const companyIds = [...new Set(requests.map(r => r.context.companyId))];
    
    // Bulk load all workflow levels and users
    const [allLevels, allUsers] = await Promise.all([
      Promise.all(workflowIds.map(async workflowId => ({
        workflowId,
        levels: await this.storage.getWorkflowLevels(workflowId)
      }))),
      this.storage.getUsers()
    ]);
    
    // Create lookup maps
    const levelMap = new Map<string, any[]>();
    allLevels.forEach(({ workflowId, levels }) => {
      levelMap.set(workflowId, levels);
    });
    
    // Process each request using cached data
    for (const request of requests) {
      const requestKey = `${request.workflowId}:${request.level}:${request.context.submitterId}`;
      const approvers = this.getApproversFromCache(
        request.workflowId,
        request.level,
        request.context,
        levelMap,
        allUsers
      );
      results.set(requestKey, approvers);
    }
    
    return results;
  }

  private getApproversFromCache(
    workflowId: string,
    level: number,
    context: WorkflowContext,
    levelMap: Map<string, any[]>,
    allUsers: any[]
  ): string[] {
    try {
      const levels = levelMap.get(workflowId) || [];
      const workflowLevel = levels.find(l => l.level === level);
      
      if (!workflowLevel || !workflowLevel.role) {
        return [];
      }

      // Filter users by company and role, excluding submitter
      const approvers = allUsers.filter(user => 
        user.companyId === context.companyId && 
        user.role?.toLowerCase() === workflowLevel.role.name?.toLowerCase() && 
        user.id !== context.submitterId
      );
      
      // Apply amount-based filtering if applicable
      if (context.amount && workflowLevel.minAmount) {
        const minAmount = parseFloat(workflowLevel.minAmount);
        if (context.amount < minAmount) {
          return [];
        }
      }
      if (context.amount && workflowLevel.maxAmount) {
        const maxAmount = parseFloat(workflowLevel.maxAmount);
        if (context.amount > maxAmount) {
          return [];
        }
      }

      return approvers.map(user => user.id);

    } catch (error) {
      console.error('Error getting approvers from cache:', error);
      return [];
    }
  }

  /**
   * Gets the required approvers for a specific workflow level
   */
  async getApproversForLevel(
    workflowId: string, 
    level: number, 
    context: WorkflowContext
  ): Promise<string[]> {
    try {
      // Get workflow levels
      const levels = await this.storage.getWorkflowLevels(workflowId);
      const workflowLevel = levels.find(l => l.level === level);
      
      if (!workflowLevel) {
        return [];
      }

      // The role is already included in the workflow level from getWorkflowLevels
      const role = workflowLevel.role;
      if (!role) {
        return [];
      }

      // Get all users in the company with this role
      const users = await this.storage.getUsers();
      const approvers = users.filter((user: User) => 
        user.companyId === context.companyId && 
        user.role?.toLowerCase() === role.name?.toLowerCase() && // Case-insensitive role matching
        user.id !== context.submitterId // Don't include the submitter as approver
      );
      
      // Apply amount-based filtering if workflow level supports min/max amounts
      if (context.amount && workflowLevel.minAmount) {
        const minAmount = parseFloat(workflowLevel.minAmount);
        if (context.amount < minAmount) {
          return [];
        }
      }
      if (context.amount && workflowLevel.maxAmount) {
        const maxAmount = parseFloat(workflowLevel.maxAmount);
        if (context.amount > maxAmount) {
          return [];
        }
      }

      return approvers.map((user: User) => user.id);

    } catch (error) {
      console.error('Error getting approvers for level:', error);
      return [];
    }
  }

  /**
   * Initializes a workflow for a new request/claim/payment
   */
  async initializeWorkflow(context: WorkflowContext): Promise<WorkflowResult> {
    const workflow = await this.determineWorkflow(context);
    
    if (!workflow) {
      // For claims AND requests: If no workflow is configured, AUTO-APPROVE
      if (context.processType === 'claim' || context.processType === 'request') {
        console.log(`✅ Auto-approve: No workflow configured for ${context.processType}, auto-approving`);
        return {
          workflowId: null,
          currentLevel: 0,
          requiredApprovers: [],
          isComplete: true, // Auto-approve the claim/request
          fallbackToLegacy: false
        };
      }
      
      return {
        workflowId: null,
        currentLevel: 0,
        requiredApprovers: [],
        isComplete: false,
        fallbackToLegacy: true
      };
    }

    // Auto-advance logic: find the first level with valid approvers
    const result = await this.findFirstValidLevel(workflow.id, context);
    return result;
  }

  /**
   * Auto-advance helper: Finds the first level with valid approvers
   * This prevents self-approval deadlocks when submitter is the only approver at early levels
   */
  private async findFirstValidLevel(workflowId: string, context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const levels = await this.storage.getWorkflowLevels(workflowId);
      const sortedLevels = levels.sort((a, b) => a.level - b.level);
      
      console.log(`🔍 Auto-advance: Checking ${sortedLevels.length} levels for workflow ${workflowId}`);
      
      for (const levelInfo of sortedLevels) {
        const level = levelInfo.level;
        const approvers = await this.getApproversForLevel(workflowId, level, context);
        
        console.log(`🔍 Level ${level}: Found ${approvers.length} approvers (excluding submitter ${context.submitterId})`);
        
        if (approvers.length > 0) {
          // Found a level with valid approvers
          console.log(`✅ Auto-advance: Starting workflow at level ${level} with ${approvers.length} approvers`);
          return {
            workflowId,
            currentLevel: level,
            requiredApprovers: approvers,
            isComplete: false,
            nextLevel: level + 1,
            fallbackToLegacy: false
          };
        }
        
        console.log(`⏭️ Auto-advance: Level ${level} has no valid approvers, checking next level`);
      }
      
      // Check if this is a self-approval deadlock (submitter is the only potential approver)
      const isSelfApprovalDeadlock = await this.checkSelfApprovalDeadlock(workflowId, context);
      
      if (isSelfApprovalDeadlock) {
        console.log(`⚠️ Self-approval deadlock detected: submitter ${context.submitterId} is the only approver`);
        return {
          workflowId,
          currentLevel: 1, // Start at level 1
          requiredApprovers: [context.submitterId], // Allow submitter to approve
          isComplete: false,
          nextLevel: 2,
          fallbackToLegacy: false,
          selfApprovalRequired: true // Special flag for self-approval
        };
      }
      
      // If we reach here, no level has valid approvers and it's not a self-approval case
      console.log(`❌ Auto-advance: No valid approvers found in any level, auto-completing workflow`);
      return {
        workflowId,
        currentLevel: sortedLevels[sortedLevels.length - 1]?.level || 1,
        requiredApprovers: [],
        isComplete: true, // Auto-complete if no valid approvers exist
        fallbackToLegacy: false
      };
      
    } catch (error) {
      console.error('Error in auto-advance logic:', error);
      return {
        workflowId: null,
        currentLevel: 0,
        requiredApprovers: [],
        isComplete: false,
        fallbackToLegacy: true
      };
    }
  }

  /**
   * Check if we have a self-approval deadlock scenario
   * This happens when the submitter is the only person who could approve at any level
   */
  async checkSelfApprovalDeadlock(workflowId: string, context: WorkflowContext): Promise<boolean> {
    try {
      const levels = await this.storage.getWorkflowLevels(workflowId);
      
      for (const levelInfo of levels) {
        // Get approvers WITHOUT excluding the submitter
        const allPotentialApprovers = await this.getApproversForLevel(workflowId, levelInfo.level, {
          ...context,
          submitterId: '', // Don't exclude anyone to see who COULD approve
        });
        
        // Check if submitter is in the potential approvers
        const submitterCanApprove = allPotentialApprovers.includes(context.submitterId);
        const otherApprovers = allPotentialApprovers.filter(id => id !== context.submitterId);
        
        if (submitterCanApprove && otherApprovers.length === 0) {
          // Submitter is the only potential approver at this level
          console.log(`🎯 Self-approval deadlock at level ${levelInfo.level}: only submitter ${context.submitterId} can approve`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking self-approval deadlock:', error);
      return false;
    }
  }

  /**
   * Auto-advance helper for post-approval: Finds the next valid level starting from a specific level
   * Used after approvals to skip levels with no approvers due to submitter exclusion
   */
  private async findNextValidLevel(workflowId: string, startLevel: number, context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const levels = await this.storage.getWorkflowLevels(workflowId);
      const sortedLevels = levels
        .filter(l => l.level >= startLevel)
        .sort((a, b) => a.level - b.level);
      
      console.log(`🔍 Post-approval auto-advance: Checking ${sortedLevels.length} levels starting from ${startLevel}`);
      
      for (const levelInfo of sortedLevels) {
        const level = levelInfo.level;
        const approvers = await this.getApproversForLevel(workflowId, level, context);
        
        console.log(`🔍 Post-approval Level ${level}: Found ${approvers.length} approvers (excluding submitter ${context.submitterId})`);
        
        if (approvers.length > 0) {
          // Found a level with valid approvers
          console.log(`✅ Post-approval auto-advance: Moving to level ${level} with ${approvers.length} approvers`);
          return {
            workflowId,
            currentLevel: level,
            requiredApprovers: approvers,
            isComplete: false,
            nextLevel: level + 1,
            fallbackToLegacy: false
          };
        }
        
        console.log(`⏭️ Post-approval auto-advance: Level ${level} has no valid approvers, checking next level`);
      }
      
      // If we reach here, no remaining level has valid approvers
      console.log(`✅ Post-approval auto-advance: No more valid approvers found, completing workflow`);
      return {
        workflowId,
        currentLevel: startLevel - 1, // Stay at the level that was just approved
        requiredApprovers: [],
        isComplete: true,
        fallbackToLegacy: false
      };
      
    } catch (error) {
      console.error('Error in post-approval auto-advance logic:', error);
      return {
        workflowId,
        currentLevel: startLevel - 1,
        requiredApprovers: [],
        isComplete: false,
        fallbackToLegacy: true
      };
    }
  }

  /**
   * Processes an approval action and determines next steps
   */
  async processApproval(
    workflowId: string,
    currentLevel: number,
    action: ApprovalAction,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    try {
      // CRITICAL: Validate that the approver is authorized for this level
      const isAuthorized = await this.canUserApprove(
        action.approverId, 
        workflowId, 
        currentLevel, 
        context
      );
      
      if (!isAuthorized) {
        throw new Error(`User ${action.approverId} is not authorized to approve at level ${currentLevel}`);
      }

      if (action.action === 'reject') {
        // Rejection ends the workflow
        return {
          workflowId,
          currentLevel,
          requiredApprovers: [],
          isComplete: true,
          fallbackToLegacy: false
        };
      }

      // Check if there are more levels
      const levels = await this.storage.getWorkflowLevels(workflowId);
      const nextLevel = currentLevel + 1;
      const hasNextLevel = levels.some(l => l.level === nextLevel);

      if (!hasNextLevel) {
        // Workflow is complete
        return {
          workflowId,
          currentLevel,
          requiredApprovers: [],
          isComplete: true,
          fallbackToLegacy: false
        };
      }

      // Auto-advance logic for post-approval: find next valid level starting from nextLevel
      const result = await this.findNextValidLevel(workflowId, nextLevel, context);
      return result;

    } catch (error) {
      console.error('Error processing approval:', error);
      // SECURITY: Never auto-complete on error - maintain current state and signal fallback
      return {
        workflowId,
        currentLevel,
        requiredApprovers: [],
        isComplete: false,
        fallbackToLegacy: true
      };
    }
  }

  /**
   * Validates if a user can approve at a specific level
   */
  async canUserApprove(
    userId: string, 
    workflowId: string, 
    level: number, 
    context: WorkflowContext
  ): Promise<boolean> {
    try {
      const approvers = await this.getApproversForLevel(workflowId, level, context);
      return approvers.includes(userId);
    } catch (error) {
      console.error('Error validating user approval permission:', error);
      return false;
    }
  }

  /**
   * Gets workflow summary for display purposes
   */
  async getWorkflowSummary(workflowId: string): Promise<{
    name: string;
    levels: Array<{ level: number; roleName: string; }>;
  } | null> {
    try {
      const workflows = await this.storage.getWorkflows({ isActive: true });
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return null;
      
      // Security check: Only return summary for workflows within the same company context
      // Note: We don't have context here, so we return the summary but callers should validate

      const levels = await this.storage.getWorkflowLevels(workflowId);
      const levelSummaries = [];

      for (const level of levels.sort((a, b) => a.level - b.level)) {
        levelSummaries.push({
          level: level.level,
          roleName: level.role?.name || 'Unknown Role'
        });
      }

      return {
        name: workflow.name,
        levels: levelSummaries
      };

    } catch (error) {
      console.error('Error getting workflow summary:', error);
      return null;
    }
  }

  /**
   * Legacy compatibility helper
   * Determines if an expense should use legacy approval logic
   */
  isLegacyApprovalRequired(result: WorkflowResult): boolean {
    return result.fallbackToLegacy;
  }

  /**
   * Helper to check if workflow is configured for a process type
   */
  async hasWorkflowForProcess(processType: string, companyId: string): Promise<boolean> {
    try {
      const assignments = await this.storage.getWorkflowAssignments({ processType });
      // Filter by company to ensure proper multi-tenant isolation
      const companyAssignments = assignments.filter(assignment => 
        assignment.workflow.companyId === companyId
      );
      return companyAssignments.length > 0;
    } catch (error) {
      console.error('Error checking workflow availability:', error);
      return false;
    }
  }
}

// Export a singleton instance
let workflowEngineInstance: WorkflowEngine | null = null;

export function getWorkflowEngine(storage: IStorage): WorkflowEngine {
  if (!workflowEngineInstance) {
    workflowEngineInstance = new WorkflowEngine(storage);
  }
  return workflowEngineInstance;
}