# Agent Feature Sync Guide

This guide explains how to sync new application features with the AI agent system to ensure users can interact with them through natural language commands.

## Quick Checklist

When adding a new feature to the application, follow this checklist to sync it with the agent:

- [ ] 1. **Add Intent Patterns** in `server/agent/intentRecognizer.ts`
- [ ] 2. **Implement Query/Action Methods** in `server/agent/dataQuerier.ts` or `server/agent/actionExecutor.ts`
- [ ] 3. **Update Switch Cases** in the execute methods
- [ ] 4. **Update Available Commands** in `server/agent/agentService.ts`
- [ ] 5. **Test with Natural Language** using the agent interface
- [ ] 6. **Update Role Permissions** if needed

## Step-by-Step Integration Process

### 1. Identify Feature Type

**Query Features** (Read-only operations):
- Viewing data, reports, summaries
- Checking status, balances, counts
- Listing items, users, configurations

**Execute Features** (Actions that change data):
- Creating, updating, deleting items
- Approving, rejecting requests
- Processing payments, workflows

### 2. Add Intent Patterns

**Location**: `server/agent/intentRecognizer.ts`

#### For Query Features:
```typescript
// Add to patterns.query[0].targets
'new feature|feature name|feature alias': { target: 'new_feature_target' },
```

#### For Execute Features:
```typescript
// Add to appropriate execute pattern based on action type
'new action|action alias': { target: 'new_action_target', extractId: true },
```

**Pattern Examples**:
```typescript
// Query patterns
'budget reports|budget summary|budget status': { target: 'budget_reports' },
'invoice status|invoice list|pending invoices': { target: 'invoices', filters: { status: 'pending' } },

// Execute patterns  
'approve invoice|accept invoice': { target: 'approve_invoice', extractId: true },
'create budget|new budget': { target: 'create_budget', extractAmount: true },
```

### 3. Implement Methods

#### For Query Features in `server/agent/dataQuerier.ts`:

```typescript
// Add to switch statement in execute method
case 'new_feature_target':
  return await this.queryNewFeature(intent.parameters, userId);

// Implement the method
private async queryNewFeature(parameters: any, userId: string): Promise<QueryResult> {
  const { storage } = await import("../storage");
  const data = await storage.getNewFeatureData(userId);
  
  if (data.length === 0) {
    return {
      message: "No data found. You can add items in the [Feature] section.",
      data: []
    };
  }

  return {
    message: `Found ${data.length} items. Here's your [feature] summary.`,
    data: data
  };
}
```

#### For Execute Features in `server/agent/actionExecutor.ts`:

```typescript
// Add to switch statement in execute method
case 'new_action_target':
  return await this.executeNewAction(intent.parameters, userId);

// Implement the method
private async executeNewAction(parameters: any, userId: string): Promise<ExecuteResult> {
  const { storage } = await import("../storage");
  
  try {
    const result = await storage.performNewAction(parameters, userId);
    
    return {
      message: `Successfully [action description]. [Result details].`,
      data: result,
      actions: [`[Action completed]`]
    };
  } catch (error) {
    return {
      message: "Error performing action. Please try again or check permissions."
    };
  }
}
```

### 4. Update Available Commands

**Location**: `server/agent/agentService.ts` - `getAvailableCommands` method

Add user-friendly command examples to appropriate role arrays:

```typescript
// For admin/head roles
"show [feature] summary",
"create [item] for [amount]",
"approve [item] [id]",

// For employee roles  
"show my [items]",
"create [item]",

// For manager/accountant roles
"show pending [items]",
"approve [items] under [amount]",
```

### 5. Permission Configuration

Update the `hasPermission` method in `agentService.ts` if needed:

```typescript
private hasPermission(userRole: string, action: string, target: string): boolean {
  const rolePermissions = {
    employee: { query: ['user_*', 'my_*'], execute: ['create_*'] },
    accountant: { query: ['*'], execute: ['approve_*', 'process_*'] },
    manager: { query: ['*'], execute: ['approve_*'] },
    admin: { query: ['*'], execute: ['*'] },
    head: { query: ['*'], execute: ['*'] }
  };
  // Implementation logic...
}
```

## Testing Your Integration

1. **Test with the Agent Interface**:
   - Try various phrasings: "show [feature]", "list [items]", "what's my [status]"
   - Test with different user roles
   - Verify error handling for edge cases

2. **Test Natural Language Variations**:
   ```
   "show budget reports"
   "what's my budget status"
   "list all budgets"
   "display budget summary"
   ```

3. **Test Permissions**:
   - Verify role-based access works correctly
   - Test unauthorized access returns appropriate messages

## Best Practices

### Intent Patterns
- **Use synonyms**: Include multiple ways users might phrase the same request
- **Be specific**: Avoid overly broad patterns that could conflict
- **Include natural variations**: "show", "list", "display", "what's my"

### Method Implementation
- **Consistent error handling**: Always return user-friendly error messages
- **Informative responses**: Include counts, status information, and guidance
- **Performance**: Use efficient queries and consider pagination for large datasets

### User Experience
- **Conversational responses**: Write responses as if talking to a human
- **Helpful guidance**: Suggest next steps or related actions
- **Clear feedback**: Confirm what action was taken

## Common Patterns

### Configuration Features
```typescript
// Intent
'feature config|feature settings|feature setup': { target: 'feature_config' },

// Response pattern
return {
  message: config ? 
    "Here's your [feature] configuration. These settings control [behavior]." : 
    "[Feature] not configured yet. You can set this up in the [section] to [benefit].",
  data: config || { message: "Not configured" }
};
```

### List Features with Filters
```typescript
// Intent with filters
'active items|inactive items': { target: 'items', filters: { status: 'active' } },

// Implementation
const items = await storage.getItems({ 
  ...parameters.filters,
  userId: intent.target.includes('my') ? userId : undefined 
});
```

### Bulk Actions
```typescript
// Intent
'approve all items under [amount]': { target: 'approve_items', extractAmount: true, bulk: true },

// Implementation with safety limits
const items = await storage.getItems({ status: 'pending' });
if (parameters.amount) {
  items = items.filter(item => item.amount < parameters.amount);
}
const itemsToProcess = items.slice(0, 50); // Safety limit
```

## Feature Categories Reference

### Common Query Targets
- `dashboard` - User or system dashboards
- `reports` - Various reports and analytics
- `config` - Configuration and settings
- `status` - Status checks and summaries
- `list_*` - List views of items

### Common Execute Targets
- `create_*` - Creating new items
- `approve_*` - Approval actions
- `reject_*` - Rejection actions
- `process_*` - Processing and workflow actions
- `update_*` - Updating existing items

## Troubleshooting

### Intent Not Recognized
- Check pattern regex matches your phrasing
- Verify target string exactly matches switch case
- Add more synonym variations

### Permission Denied
- Check user role has permission for the target
- Verify hasPermission method includes your target
- Test with admin role first

### Method Not Found
- Ensure method is implemented in correct class (DataQuerier vs ActionExecutor)
- Check switch case includes your target
- Verify method name matches the call

### Data Not Loading
- Check storage method exists and works
- Verify database queries are correct
- Test storage method independently

## Future Automation Ideas

This system could be extended with:
- **Code generators** to create boilerplate method templates
- **Validation tools** to check integration completeness
- **Test generators** for automated testing of new features
- **Documentation generators** to update help text automatically

---

For questions or issues with agent integration, refer to existing implementations in the codebase or create detailed examples following these patterns.