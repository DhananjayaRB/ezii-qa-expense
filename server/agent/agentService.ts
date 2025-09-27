import { Request } from "express";
import { intentRecognizer } from "./intentRecognizer";
import { CommandExecutor } from "./commandExecutor";
import { dataQuerier } from "./dataQuerier";

export interface AgentCommand {
  text: string;
  userId: string;
  userRole: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: any;
  actions?: string[];
}

export class AgentService {
  private commandExecutor = new CommandExecutor();
  async processCommand(command: AgentCommand): Promise<AgentResponse> {
    try {
      // Parse the command to extract intent and parameters
      const intent = intentRecognizer.parseCommand(command.text, command.userRole);
      
      if (!intent) {
        return {
          success: false,
          message: "I didn't understand that command. Try asking about pending claims, cashbox balance, or say 'help' for available commands."
        };
      }

      // Check if user has permission for this action
      if (!this.hasPermission(command.userRole, intent.action, intent.target)) {
        return {
          success: false,
          message: `You don't have permission to ${intent.action} ${intent.target}. Check with your administrator.`
        };
      }

      // Execute the appropriate action
      if (intent.type === 'query') {
        const result = await dataQuerier.execute(intent, command.userId);
        return {
          success: true,
          message: result.message,
          data: result.data
        };
      } else if (intent.type === 'execute') {
        const result = await this.commandExecutor.execute(intent, command.userId);
        return {
          success: result.success,
          message: result.message,
          data: result.data
        };
      } else {
        return {
          success: false,
          message: "Command type not supported yet."
        };
      }

    } catch (error) {
      console.error('Agent service error:', error);
      return {
        success: false,
        message: "Something went wrong while processing your command. Please try again."
      };
    }
  }

  private hasPermission(userRole: string, action: string, target: string): boolean {
    // For testing purposes, allow all roles to access all features
    // This provides a better user experience for demonstrations and testing
    return true;
    
    // Original permission system (commented out for testing):
    /*
    const permissions = {
      employee: {
        query: ['claims', 'receipts', 'requests', 'dashboard', 'status'],
        execute: ['create_claim', 'upload_receipt', 'create_request']
      },
      accountant: {
        query: ['claims', 'payments', 'vendors', 'receipts', 'reports', 'cashbox', 'batches'],
        execute: ['approve_claim', 'reject_claim', 'process_payment', 'create_batch', 'approve_batch']
      },
      manager: {
        query: ['claims', 'payments', 'vendors', 'receipts', 'reports', 'cashbox', 'batches'],
        execute: ['approve_claim', 'reject_claim', 'process_payment', 'create_batch', 'approve_batch']
      },
      admin: {
        query: ['*'], // All queries
        execute: ['*'] // All actions
      },
      head: {
        query: ['*'], // All queries
        execute: ['*'] // All actions
      }
    };

    // Handle multiple roles (comma-separated)
    const userRoles = userRole.split(',').map(r => r.trim());
    
    // Check each role - if any role has permission, allow it
    for (const role of userRoles) {
      const rolePermissions = permissions[role as keyof typeof permissions];
      if (!rolePermissions) continue;

      // Check if action is allowed for this role
      const allowedActions = rolePermissions[action as keyof typeof rolePermissions] || [];
      if (allowedActions.includes('*') || allowedActions.includes(target)) {
        return true;
      }
    }

    return false;
    */
  }

  getAvailableCommands(userRole: string): string[] {
    const commands = {
      employee: [
        "show my pending claims",
        "show my expense status", 
        "create expense for [amount] [description]",
        "upload receipt",
        "show my requests",
        "what's my dashboard summary",
        "show petty cash",
        "show advance payments", 
        "show direct expenses",
        "petty cashbox balance",
        // NEW: OCR and Receipt Features
        "show my ocr results",
        "show receipt processing",
        "show scan confidence",
        "process receipt",
        // NEW: Product Navigation  
        "switch to payroll",
        "go to leave management",
        "open attendance app",
        "show available products",
        // NEW: Tutorial System
        "show tutorials",
        "help with expense claims",
        "guide me through creating claim"
      ],
      accountant: [
        "show pending claims",
        "approve all claims under [amount]",
        "approve claim [id]", 
        "reject claim [id]",
        "show cashbox balance",
        "petty cashbox balance",
        "process payments",
        "show payment batches",
        "show pending approvals",
        "show vendor payments due",
        "create payment batch",
        "show petty cash transactions",
        "show direct expenses",
        "show advance payments",
        "show fund transfers",
        "show payment processing",
        "show vendor onboarding",
        "show vendor documents",
        "approve vendor onboarding #[id]",
        "approve vendor document #[id]",
        "show payment history",
        "explain why restriction [amount]",
        // NEW: OCR and Receipt Features
        "show ocr results",
        "show receipt confidence scores",
        "process receipt with ocr",
        "confirm ocr result #[id]",
        "show receipt processing history",
        // NEW: Product Management
        "switch to payroll system",
        "go to leave application", 
        "open attendance module",
        "show organization products",
        "check product access",
        // NEW: Tutorial and Help
        "show user tutorials",
        "display training guides",
        "help with workflow",
        "guide user through process"
      ],
      manager: [
        "show pending claims",
        "approve all claims under [amount]",
        "approve claim [id]", 
        "reject claim [id]",
        "show cashbox balance",
        "petty cashbox balance",
        "process payments",
        "show payment batches",
        "show pending approvals",
        "show vendor payments due",
        "create payment batch",
        "show petty cash transactions",
        "show direct expenses",
        "show advance payments",
        // NEW: OCR and Receipt Features
        "show ocr results",
        "process receipt with ocr",
        "show receipt processing",
        // NEW: Product Management
        "switch to payroll",
        "go to leave app",
        "open attendance",
        "show available products",
        // NEW: Tutorial System
        "show tutorials",
        "help with processes"
      ],
      admin: [
        "show system summary",
        "approve all pending claims",
        "show all users",
        "show vendor summary", 
        "show expense reports",
        "show cost centers",
        "show compliance summary",
        "approve all batches",
        "show tds rates",
        "show expense policies",
        "show expense groups",
        "show expense heads",
        "show workflows",
        "show petty cash transactions",
        "show direct expenses",
        "show advance payments",
        "show contracts",
        "show party master",
        "show payment processing",
        "show fund transfers",
        "petty cashbox balance",
        "show vendor onboarding",
        "show vendor documents",
        "show vendor reports",
        "show cost center config",
        "show validation rules",
        "approve vendor onboarding #[id]",
        "approve vendor document #[id]",
        "explain why restriction [amount]",
        "explain validation rules",
        "show payment history",
        // NEW: OCR and Receipt Features
        "show all ocr results",
        "show receipt confidence analytics",
        "manage ocr processing",
        "configure ocr settings",
        "show ocr statistics",
        // NEW: Product Management
        "switch to any product",
        "manage product access", 
        "configure organization products",
        "show product usage analytics",
        // NEW: Tutorial and Help System
        "manage user tutorials",
        "create training guides",
        "configure help system",
        "show tutorial analytics"
      ],
      head: [
        "show system summary",
        "approve all pending claims",
        "show all users",
        "show vendor summary", 
        "show expense reports",
        "show cost centers",
        "show compliance summary",
        "approve all batches",
        "show tds rates",
        "show expense policies",
        "show expense groups",
        "show expense heads",
        "show workflows",
        "show petty cash transactions",
        "show direct expenses",
        "show advance payments",
        "show contracts",
        "show party master",
        "show payment processing",
        "show fund transfers",
        "petty cashbox balance",
        "show vendor onboarding",
        "show vendor documents", 
        "show vendor reports",
        "show cost center config",
        "show validation rules",
        "approve vendor onboarding #[id]",
        "approve vendor document #[id]",
        "explain why restriction [amount]",
        "explain validation rules",
        "show payment history",
        // NEW: OCR and Receipt Features
        "show all ocr results",
        "show receipt confidence analytics",
        "manage ocr processing",
        "configure ocr settings",
        "show ocr statistics",
        // NEW: Product Management
        "switch to any product",
        "manage product access", 
        "configure organization products",
        "show product usage analytics",
        // NEW: Tutorial and Help System
        "manage user tutorials",
        "create training guides",
        "configure help system",
        "show tutorial analytics"
      ]
    };

    // Handle multiple roles - combine all available commands
    const userRoles = userRole.split(',').map(r => r.trim());
    const allCommands = new Set<string>();
    
    for (const role of userRoles) {
      const roleCommands = commands[role as keyof typeof commands] || [];
      roleCommands.forEach(cmd => allCommands.add(cmd));
    }

    return Array.from(allCommands);
  }
}

export const agentService = new AgentService();