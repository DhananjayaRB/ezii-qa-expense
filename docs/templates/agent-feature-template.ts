/**
 * Agent Feature Integration Template
 * 
 * Copy this template and replace placeholders with your feature details:
 * - FEATURE_NAME: The name of your feature (e.g., "budget", "invoice")
 * - FEATURE_TARGET: Snake case target name (e.g., "budget_reports", "invoice_status")
 * - FEATURE_ACTION: Action name (e.g., "approve_budget", "create_invoice")
 * - USER_FRIENDLY_NAME: Human readable name (e.g., "Budget Reports", "Invoice Management")
 */

// =============================================================================
// 1. INTENT PATTERNS (server/agent/intentRecognizer.ts)
// =============================================================================

// Add to patterns.query[0].targets for READ operations:
'FEATURE_NAME|FEATURE_NAME list|FEATURE_NAME summary|FEATURE_NAME status': { 
  target: 'FEATURE_TARGET' 
},

// Add with filters if needed:
'pending FEATURE_NAME|active FEATURE_NAME': { 
  target: 'FEATURE_TARGET', 
  filters: { status: 'pending' } 
},

// Add to appropriate execute pattern for WRITE operations:
'approve FEATURE_NAME|accept FEATURE_NAME': { 
  target: 'FEATURE_ACTION', 
  extractId: true 
},

'create FEATURE_NAME|new FEATURE_NAME': { 
  target: 'FEATURE_ACTION', 
  extractAmount: true, 
  extractDescription: true 
},

// =============================================================================
// 2. DATA QUERIER METHOD (server/agent/dataQuerier.ts)
// =============================================================================

// Add to switch statement in execute method:
case 'FEATURE_TARGET':
  return await this.queryFEATURE_NAME(intent.parameters, userId);

// Implement the query method:
private async queryFEATURE_NAME(parameters: any, userId: string): Promise<QueryResult> {
  const { storage } = await import("../storage");
  
  // Apply filters if any
  const filters = parameters.filters || {};
  
  try {
    const data = await storage.getFEATURE_NAMEData({
      ...filters,
      // Add userId filter if this is user-specific data
      userId: parameters.userSpecific ? userId : undefined
    });
    
    if (data.length === 0) {
      return {
        message: "No FEATURE_NAME data found. You can add items in the USER_FRIENDLY_NAME section.",
        data: []
      };
    }

    // Provide contextual information
    const statusInfo = filters.status ? ` with status '${filters.status}'` : '';
    
    return {
      message: `Found ${data.length} FEATURE_NAME items${statusInfo}. Here's your USER_FRIENDLY_NAME summary.`,
      data: data
    };
    
  } catch (error) {
    console.error('FEATURE_NAME query error:', error);
    return {
      message: "Error fetching FEATURE_NAME data. Please try again.",
      data: []
    };
  }
}

// =============================================================================
// 3. ACTION EXECUTOR METHOD (server/agent/actionExecutor.ts)
// =============================================================================

// Add to switch statement in execute method:
case 'FEATURE_ACTION':
  return await this.executeFEATURE_ACTION(intent.parameters, userId);

// Implement the action method:
private async executeFEATURE_ACTION(parameters: any, userId: string): Promise<ExecuteResult> {
  const { storage } = await import("../storage");
  
  try {
    // Validate required parameters
    if (parameters.id && !parameters.id) {
      return {
        message: "Please specify which FEATURE_NAME to work with. Example: 'approve FEATURE_NAME #123'"
      };
    }
    
    // Execute the action
    const result = await storage.performFEATURE_ACTION({
      ...parameters,
      userId,
      timestamp: new Date()
    });
    
    return {
      message: `Successfully performed action on FEATURE_NAME. [Add specific success message here]`,
      data: result,
      actions: [`FEATURE_ACTION completed for ${parameters.id || 'item'}`]
    };
    
  } catch (error) {
    console.error('FEATURE_ACTION execution error:', error);
    return {
      message: "Error performing action on FEATURE_NAME. Please check permissions and try again."
    };
  }
}

// =============================================================================
// 4. AVAILABLE COMMANDS (server/agent/agentService.ts)
// =============================================================================

// Add to appropriate role arrays in getAvailableCommands:

// For employees:
"show my FEATURE_NAME",
"create FEATURE_NAME for [amount] [description]",

// For managers/accountants:
"show pending FEATURE_NAME", 
"approve FEATURE_NAME [id]",
"reject FEATURE_NAME [id]",

// For admin/head:
"show all FEATURE_NAME",
"show FEATURE_NAME summary",
"approve all FEATURE_NAME under [amount]",

// =============================================================================
// 5. PERMISSION CONFIGURATION (if needed)
// =============================================================================

// If your feature requires special permissions, update hasPermission method:
// Add to rolePermissions object:

employee: { 
  query: ['user_expenses', 'my_FEATURE_TARGET'], 
  execute: ['create_FEATURE_ACTION'] 
},
manager: { 
  query: ['*'], 
  execute: ['approve_FEATURE_ACTION', 'reject_FEATURE_ACTION'] 
},

// =============================================================================
// 6. STORAGE INTERFACE (server/storage.ts)
// =============================================================================

// Add to IStorage interface:
getFEATURE_NAMEData(filters?: { status?: string; userId?: string }): Promise<FEATURE_NAMEType[]>;
performFEATURE_ACTION(params: any): Promise<FEATURE_NAMEType>;

// Implement in DatabaseStorage class:
async getFEATURE_NAMEData(filters: any = {}): Promise<FEATURE_NAMEType[]> {
  let query = db.select().from(FEATURE_NAME_table);
  
  if (filters.status) {
    query = query.where(eq(FEATURE_NAME_table.status, filters.status));
  }
  
  if (filters.userId) {
    query = query.where(eq(FEATURE_NAME_table.userId, filters.userId));
  }
  
  return await query.orderBy(desc(FEATURE_NAME_table.updatedAt));
}

async performFEATURE_ACTION(params: any): Promise<FEATURE_NAMEType> {
  // Implement your action logic here
  const [result] = await db
    .update(FEATURE_NAME_table)
    .set({ status: 'approved', approvedBy: params.userId, approvedAt: new Date() })
    .where(eq(FEATURE_NAME_table.id, params.id))
    .returning();
    
  return result;
}

// =============================================================================
// 7. TESTING COMMANDS
// =============================================================================

/*
Test your integration with these natural language commands:

Query Commands:
- "show FEATURE_NAME"
- "what's my FEATURE_NAME status"
- "list all FEATURE_NAME"
- "show pending FEATURE_NAME"

Execute Commands:
- "approve FEATURE_NAME #123"
- "create FEATURE_NAME for 5000 description here"
- "reject FEATURE_NAME #456"

Edge Cases:
- Test with different user roles
- Test with missing permissions
- Test with invalid IDs
- Test with empty datasets
*/