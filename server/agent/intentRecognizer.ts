export interface Intent {
  type: 'query' | 'execute';
  action: string;
  target: string;
  parameters: Record<string, any>;
  confidence: number;
}

export class IntentRecognizer {
  private patterns = {
    // Query patterns
    query: [
      {
        pattern: /show|what|how many|get|list|display/i,
        targets: {
          'pending claims|claims pending': { target: 'claims', filters: { status: 'pending' } },
          'pending requests|requests pending|pending expense requests|expense requests pending|my pending requests': { target: 'pending_approvals' },
          'approved claims|claims approved': { target: 'claims', filters: { status: 'approved' } },
          'my expenses|my spending|expense status': { target: 'user_expenses' },
          'cashbox balance|cash balance|cashbox|balance|petty cashbox|petty cash balance|petty cashbox balance|show cashbox|cashbox status': { target: 'cashbox' },
          'petty cash|petty cash transactions|petty transactions': { target: 'petty_cash' },
          'direct expenses|direct expense list|company expenses': { target: 'direct_expenses' },
          'advance payments|advances|advance list|approved advances': { target: 'advance_payments' },
          'contracts|contract list|contract summary|agreements': { target: 'contracts' },
          'party master|party list|parties': { target: 'party_master' },
          'payment processing|payment queue|payment status': { target: 'payment_processing' },
          'fund transfers|fund transfer history|transfers': { target: 'fund_transfers' },
          'vendors|vendor list|vendor summary': { target: 'vendors' },
          'payment batches|batches|batch status': { target: 'batches' },
          'pending payments|payments due|payment queue': { target: 'payments', filters: { status: 'pending' } },
          'receipts|my receipts|uploaded receipts': { target: 'receipts' },
          'requests|my requests|expense requests': { target: 'requests' },
          'dashboard|summary|overview': { target: 'dashboard' },
          'reports|expense reports|spending reports': { target: 'reports' },
          'users|user list|employees': { target: 'users' },
          'compliance|gst|tds|tax summary': { target: 'compliance' },
          'tds rates|tds master|tds categories|tax rates': { target: 'tds_rates' },
          'expense policies|policies|expense rules|policy limits': { target: 'expense_policies' },
          'cost centers|cost centre|cost center config|cost configuration': { target: 'cost_centers' },
          'expense groups|expense group list|group categories': { target: 'expense_groups' },
          'expense heads|expense head list|expense categories': { target: 'expense_heads' },
          'workflows|workflow config|approval workflows|workflow list': { target: 'workflows' },
          'vendor onboarding|vendor requests|vendor approvals|pending vendor approvals': { target: 'vendor_onboarding' },
          'vendor documents|vendor verification|document verification': { target: 'vendor_documents' },
          'vendor reports|vendor analytics|vendor dashboard': { target: 'vendor_reports' },
          'cost center config|cost configuration|cost categories': { target: 'cost_center_config' },
          'filter data|location data|department data|cost trends': { target: 'filter_data' },
          'payment history|vendor payment history|payment tracking': { target: 'payment_history' },
          'validation rules|policy restrictions|expense restrictions|claim restrictions': { target: 'validation_rules' },
          'bill master|bill types|custom bill types|bill configuration|bill forms': { target: 'bill_master' },
          'bill fields|form fields|custom fields|bill form fields|field configuration': { target: 'bill_fields' },
          // NEW: OCR and Receipt Processing Features
          'ocr results|receipt processing|scanned receipts|ocr status|text extraction': { target: 'ocr_results' },
          'ocr confidence|processing confidence|scan quality|extraction accuracy': { target: 'ocr_confidence' },
          'my receipts|uploaded receipts|processed receipts|receipt history': { target: 'receipt_history' },
          // NEW: Tutorial and Help System
          'tutorials|help guides|user guides|training materials|how to guides': { target: 'tutorials' },
          'tutorial steps|workflow guide|process guide|step by step guide': { target: 'tutorial_workflows' },
          // NEW: Product Information
          'available products|enabled products|product list|applications|modules': { target: 'organization_products' },
          'product status|application access|module availability': { target: 'product_access' }
        }
      },
      {
        pattern: /where|navigate|access|find|go to|how to get to|how to reach|how to access/i,
        targets: {
          'report builder|reports builder|custom reports builder|builder': { target: 'navigation', destination: '/config/report-builder' },
          'custom reports|reports page|my reports|report list': { target: 'navigation', destination: '/reports/custom' },
          'dashboard|home|main page|home page': { target: 'navigation', destination: '/dashboard' },
          'pending approvals|approval page|approvals': { target: 'navigation', destination: '/dashboard' },
          'expense claims|claims page|claims|claims list': { target: 'navigation', destination: '/claims' },
          'expense requests|requests page|requests|request list': { target: 'navigation', destination: '/requests' },
          'direct expenses|direct expense page|company expenses': { target: 'navigation', destination: '/direct-expenses' },
          'vendor master|vendors|vendor management|vendor list': { target: 'navigation', destination: '/vendor-master' },
          'users|user management|team|employee list': { target: 'navigation', destination: '/users' },
          'settings|configuration|admin settings|admin panel': { target: 'navigation', destination: '/admin/settings' },
          // NEW: Product Switching Navigation
          'payroll|payroll app|payroll system|payroll module': { target: 'product_switch', product: 'payroll' },
          'leave|leave management|leave app|leave system': { target: 'product_switch', product: 'leave' },
          'attendance|attendance app|attendance system': { target: 'product_switch', product: 'attendance' },
          'core|core master|core app|core system': { target: 'product_switch', product: 'core' },
          'expense|expense app|expense system|expense management': { target: 'product_switch', product: 'expense' },
          // NEW: Tutorial Navigation
          'tutorials|help|user guide|training|guides': { target: 'navigation', destination: '/tutorials' },
          'help center|tutorial center|learning center': { target: 'navigation', destination: '/help' }
        }
      }
    ],

    // Execute patterns  
    execute: [
      {
        pattern: /approve|accept|confirm/i,
        targets: {
          'all pending requests|all pending|pending requests|all requests|pending approvals': { target: 'approve_all_pending', bulk: true },
          'all claims|all pending claims|pending claims': { target: 'approve_claims', bulk: true },
          'claims under|claims below|claims which are below|claims that are under|all under|all below': { target: 'approve_claims', extractAmount: true },
          'claim|expense claim': { target: 'approve_claim', extractId: true },
          'request|expense request': { target: 'approve_request', extractId: true },
          'batch|payment batch': { target: 'approve_batch', extractId: true },
          'all batches|pending batches': { target: 'approve_batches', bulk: true },
          'vendor onboarding|vendor request': { target: 'approve_vendor_onboarding', extractId: true },
          'vendor document|document verification': { target: 'approve_vendor_document', extractId: true },
          // NEW: OCR and Receipt Processing Actions
          'receipt|receipt processing|ocr processing|scan receipt': { target: 'process_receipt', extractFile: true },
          'ocr result|processing result|scan result': { target: 'confirm_ocr_result', extractId: true }
        }
      },
      {
        pattern: /reject|deny|decline/i,
        targets: {
          'claim|expense claim': { target: 'reject_claim', extractId: true },
          'batch|payment batch': { target: 'reject_batch', extractId: true }
        }
      },
      {
        pattern: /process|pay|execute|run/i,
        targets: {
          'payments|payment queue|pending payments': { target: 'process_payments' },
          'batch|payment batch': { target: 'process_batch', extractId: true }
        }
      },
      {
        pattern: /explain|why|check|validate|reason/i,
        targets: {
          'restriction|limit|policy|rule|amount limit|claim restriction': { target: 'explain_restriction', extractAmount: true },
          'validation|policy rule|expense rule': { target: 'explain_validation' },
          'cost trend|location restriction|department rule': { target: 'explain_location_rule' }
        }
      },
      {
        pattern: /create|add|new|make/i,
        targets: {
          'expense|claim|expense claim': { target: 'create_claim', extractAmount: true, extractDescription: true },
          'request|expense request|advance request': { target: 'create_request', extractAmount: true },
          'batch|payment batch': { target: 'create_batch' },
          'vendor': { target: 'create_vendor', extractName: true },
          'direct expense|company expense': { target: 'create_direct_expense', extractAmount: true, extractDescription: true },
          'advance payment|advance': { target: 'create_advance', extractAmount: true },
          'contract|agreement': { target: 'create_contract', extractName: true },
          'petty cash transaction': { target: 'create_petty_transaction', extractAmount: true, extractDescription: true },
          'vendor onboarding|vendor request': { target: 'create_vendor_onboarding', extractName: true },
          'policy rule|expense rule|validation rule': { target: 'create_policy_rule', extractAmount: true }
        }
      }
    ]
  };

  parseCommand(text: string, userRole: string): Intent | null {
    const normalizedText = text.toLowerCase().trim();

    // Try query patterns first
    for (const queryPattern of this.patterns.query) {
      if (queryPattern.pattern.test(normalizedText)) {
        for (const [targetPattern, config] of Object.entries(queryPattern.targets)) {
          if (this.matchesPattern(normalizedText, targetPattern)) {
            return {
              type: 'query',
              action: 'query',
              target: config.target,
              parameters: { filters: (config as any).filters || {} },
              confidence: 0.8
            };
          }
        }
      }
    }

    // Try execute patterns
    for (const executePattern of this.patterns.execute) {
      if (executePattern.pattern.test(normalizedText)) {
        for (const [targetPattern, config] of Object.entries(executePattern.targets)) {
          if (this.matchesPattern(normalizedText, targetPattern)) {
            const parameters: Record<string, any> = {};
            
            // Extract amount if needed
            if (config.extractAmount) {
              const amount = this.extractAmount(normalizedText);
              if (amount) parameters.amount = amount;
            }

            // Extract ID if needed
            if (config.extractId) {
              const id = this.extractId(normalizedText);
              if (id) parameters.id = id;
            }

            // Extract description if needed
            if (config.extractDescription) {
              const description = this.extractDescription(normalizedText);
              if (description) parameters.description = description;
            }

            // Extract name if needed
            if (config.extractName) {
              const name = this.extractName(normalizedText);
              if (name) parameters.name = name;
            }

            return {
              type: 'execute',
              action: 'execute',
              target: config.target,
              parameters,
              confidence: 0.8
            };
          }
        }
      }
    }

    return null;
  }

  private matchesPattern(text: string, pattern: string): boolean {
    const alternatives = pattern.split('|');
    return alternatives.some(alt => text.includes(alt.trim()));
  }

  private extractAmount(text: string): number | null {
    // Extract numbers that look like amounts
    const amountPatterns = [
      /₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*rupees?/i,
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*rs/i,
      /under\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /below\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /are\s+below\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /which\s+are\s+below\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /that\s+are\s+under\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d+(?:,\d+)*(?:\.\d+)?)/
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numberStr = match[1].replace(/,/g, '');
        return parseFloat(numberStr);
      }
    }
    return null;
  }

  private extractId(text: string): string | null {
    // Extract IDs that look like claim IDs, batch IDs, etc.
    const idPatterns = [
      /#([A-Za-z0-9-]+)/,
      /id\s+([A-Za-z0-9-]+)/i,
      /claim\s+([A-Za-z0-9-]+)/i,
      /batch\s+([A-Za-z0-9-]+)/i
    ];

    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  private extractDescription(text: string): string | null {
    // Extract description after "for" keyword
    const descPatterns = [
      /for\s+(.+?)(?:\s+₹|\s+rs|\s+rupees?|$)/i,
      /expense\s+(.+?)(?:\s+₹|\s+rs|\s+rupees?|$)/i
    ];

    for (const pattern of descPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  private extractName(text: string): string | null {
    // Extract names after certain keywords
    const namePatterns = [
      /vendor\s+(.+?)(?:\s|$)/i,
      /for\s+(.+?)(?:\s|$)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }
}

export const intentRecognizer = new IntentRecognizer();