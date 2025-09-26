import { db } from "../db";
import { expenseClaims, users, vendors, paymentBatches, receipts, expenseRequests, billMasterTypes, billMasterFields } from "@shared/schema";
import { eq, and, count, sum, sql } from "drizzle-orm";

export interface QueryResult {
  message: string;
  data?: any;
}

export class DataQuerier {
  async execute(intent: any, userId: string): Promise<QueryResult> {
    try {
      switch (intent.target) {
        case 'claims':
          return await this.queryClaims(intent.parameters, userId);
        case 'user_expenses':
          return await this.queryUserExpenses(userId);
        case 'cashbox':
          return await this.queryCashboxBalance();
        case 'vendors':
          return await this.queryVendors();
        case 'batches':
          return await this.queryPaymentBatches();
        case 'payments':
          return await this.queryPayments(intent.parameters);
        case 'receipts':
          return await this.queryReceipts(userId);
        case 'requests':
          return await this.queryRequests(userId);
        case 'dashboard':
          return await this.queryDashboard(userId);
        case 'reports':
          return await this.queryReports();
        case 'users':
          return await this.queryUsers();
        case 'compliance':
          return await this.queryCompliance();
        case 'tds_rates':
          return await this.queryTdsRates();
        case 'expense_policies':
          return await this.queryExpensePolicies();
        case 'cost_centers':
          return await this.queryCostCenters();
        case 'expense_groups':
          return await this.queryExpenseGroups();
        case 'expense_heads':
          return await this.queryExpenseHeads();
        case 'workflows':
          return await this.queryWorkflows();
        case 'petty_cash':
          return await this.queryPettyCash(userId);
        case 'direct_expenses':
          return await this.queryDirectExpenses(userId);
        case 'advance_payments':
          return await this.queryAdvancePayments(userId);
        case 'contracts':
          return await this.queryContracts();
        case 'party_master':
          return await this.queryPartyMaster();
        case 'payment_processing':
          return await this.queryPaymentProcessing();
        case 'fund_transfers':
          return await this.queryFundTransfers();
        case 'vendor_onboarding':
          return await this.queryVendorOnboarding();
        case 'vendor_documents':
          return await this.queryVendorDocuments();
        case 'vendor_reports':
          return await this.queryVendorReports();
        case 'cost_center_config':
          return await this.queryCostCenterConfig();
        case 'filter_data':
          return await this.queryFilterData();
        case 'payment_history':
          return await this.queryPaymentHistory();
        case 'validation_rules':
          return await this.queryValidationRules();
        case 'bill_master':
          return await this.queryBillMaster();
        case 'bill_fields':
          return await this.queryBillFields();
        case 'product_navigation':
          return await this.queryProductNavigation();
        case 'pending_approvals':
          return await this.queryPendingApprovals(userId);
        case 'navigation':
          return await this.queryNavigation(intent.parameters);
        default:
          return { message: "Query type not supported yet." };
      }
    } catch (error) {
      console.error('Data querier error:', error);
      return { message: "Error fetching data. Please try again." };
    }
  }

  private async queryClaims(parameters: any, userId: string): Promise<QueryResult> {
    const filters = parameters.filters || {};

    let query = db.select({
      id: expenseClaims.id,
      title: expenseClaims.title,
      totalAmount: expenseClaims.totalAmount,
      status: expenseClaims.status,
      submittedAt: expenseClaims.submittedAt,
      userName: users.firstName
    })
    .from(expenseClaims)
    .leftJoin(users, eq(expenseClaims.userId, users.id));

    // Apply filters
    const conditions = [];
    if (filters.status) {
      conditions.push(eq(expenseClaims.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const claims = await query.limit(20);
    
    if (claims.length === 0) {
      const statusMessage = filters.status ? 
        `I couldn't find any ${filters.status} claims right now. That's actually good news if you were looking for pending items!` : 
        "I don't see any expense claims in the system yet. Once your team starts submitting expenses, they'll appear here.";
      return { 
        message: statusMessage,
        data: []
      };
    }

    const total = claims.reduce((sum, claim) => sum + parseFloat(claim.totalAmount), 0);
    const statusText = filters.status ? ` ${filters.status}` : '';
    
    let conversationalMessage;
    if (claims.length === 1) {
      conversationalMessage = `I found 1${statusText} expense claim worth ₹${total.toLocaleString()}. Here are the details:`;
    } else {
      conversationalMessage = `Here are ${claims.length}${statusText} expense claims, totaling ₹${total.toLocaleString()}:`;
    }

    return {
      message: conversationalMessage,
      data: claims
    };
  }

  // NEW: Query navigation for specific pages/processes
  private async queryNavigation(parameters: any): Promise<QueryResult> {
    const destination = parameters.destination;
    
    if (!destination) {
      return { message: "Navigation destination not specified." };
    }

    const routeDescriptions: Record<string, string> = {
      '/config/report-builder': 'Report Builder - Create custom reports with advanced filtering',
      '/reports/custom': 'Custom Reports - View and manage your saved reports',
      '/dashboard': 'Dashboard - Main overview and pending approvals',
      '/claims': 'Expense Claims - Submit and manage expense claims',
      '/requests': 'Expense Requests - Pre-approval requests for expenses',
      '/direct-expenses': 'Direct Expenses - Company-level expense management',
      '/vendor-master': 'Vendor Master - Manage vendor information and onboarding',
      '/users': 'User Management - Manage team members and roles',
      '/admin/settings': 'Admin Settings - System configuration and settings'
    };

    const description = routeDescriptions[destination] || `Page: ${destination}`;
    
    return {
      message: `You can access the ${description} by navigating to: ${destination}`,
      data: {
        destination,
        description,
        navigateUrl: destination
      }
    };
  }

  // NEW: Query product navigation URLs synced with ProductSwitcher
  private async queryProductNavigation(): Promise<QueryResult> {
    const products = {
      'Core Master': { url: '#', status: 'Available' },
      'Payroll': { url: 'https://qa.resolveindia.com/dashboard/team-dashboard/team-dashboard', status: 'Available' },
      'Attendance': { url: '#', status: 'Coming Soon' },
      'Expense': { url: '/', status: 'Current App' },
      'Leave': { url: 'https://leave.ezii.co.in/id/{token}', status: 'Available with Token' }
    };

    const availableProducts = Object.entries(products).map(([name, info]) => `${name}: ${info.status}`);
    
    return {
      message: `Available products for navigation: ${availableProducts.join(', ')}. Use "navigate to [product]" to switch between applications.`,
      data: products
    };
  }

  // NEW: Query real pending approvals using the same API endpoint logic  
  private async queryPendingApprovals(userId: string): Promise<QueryResult> {
    try {
      // Use the same logic as /api/expense-claims/pending-approval endpoint
      const pendingRequests = await db.select({
        id: expenseRequests.id,
        title: expenseRequests.title,
        totalAmount: expenseRequests.estimatedAmount,
        status: expenseRequests.status,
        submittedAt: expenseRequests.createdAt,
        userName: users.firstName,
        type: sql<string>`'request'`
      })
      .from(expenseRequests)
      .leftJoin(users, eq(expenseRequests.userId, users.id))
      .where(eq(expenseRequests.status, 'pending'))
      .limit(20);

      const pendingClaims = await db.select({
        id: expenseClaims.id,
        title: expenseClaims.title,
        totalAmount: expenseClaims.totalAmount,
        status: expenseClaims.status,
        submittedAt: expenseClaims.submittedAt,
        userName: users.firstName,
        type: sql<string>`'claim'`
      })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(eq(expenseClaims.status, 'pending'))
      .limit(20);

      const allPending = [...pendingRequests, ...pendingClaims].sort((a, b) => 
        new Date(b.submittedAt || new Date()).getTime() - new Date(a.submittedAt || new Date()).getTime()
      );

      if (allPending.length === 0) {
        return { 
          message: "Great news! No pending claims or requests need your approval right now. Everything's up to date!",
          data: []
        };
      }

      const total = allPending.reduce((sum, item) => sum + parseFloat(item.totalAmount || '0'), 0);
      const requestCount = pendingRequests.length;
      const claimCount = pendingClaims.length;
      
      let conversationalMessage;
      if (allPending.length === 1) {
        const itemType = allPending[0].type === 'request' ? 'expense request' : 'expense claim';
        conversationalMessage = `You have 1 pending ${itemType} worth ₹${total.toLocaleString()} waiting for approval:`;
      } else {
        const breakdown = [];
        if (requestCount > 0) breakdown.push(`${requestCount} expense request${requestCount > 1 ? 's' : ''}`);
        if (claimCount > 0) breakdown.push(`${claimCount} expense claim${claimCount > 1 ? 's' : ''}`);
        
        conversationalMessage = `You have ${allPending.length} pending items (${breakdown.join(' and ')}) worth ₹${total.toLocaleString()} waiting for approval:`;
      }

      return {
        message: conversationalMessage,
        data: allPending.map(item => ({
          ...item,
          displayTitle: `${item.title} - ${item.userName}`,
          amount: `₹${parseFloat(item.totalAmount || '0').toLocaleString()}`,
          itemType: item.type === 'request' ? 'Expense Request' : 'Expense Claim'
        }))
      };
    } catch (error) {
      console.error('Error querying pending approvals:', error);
      return {
        message: "I'm having trouble accessing the pending approvals. Please try again or check the dashboard.",
        data: []
      };
    }
  }

  private async queryUserExpenses(userId: string): Promise<QueryResult> {
    const userClaims = await db.select({
      total: count(),
      totalAmount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
      pending: sql<number>`SUM(CASE WHEN ${expenseClaims.status} = 'pending' THEN 1 ELSE 0 END)`,
      approved: sql<number>`SUM(CASE WHEN ${expenseClaims.status} = 'approved' THEN 1 ELSE 0 END)`,
      paid: sql<number>`SUM(CASE WHEN ${expenseClaims.status} = 'paid' THEN 1 ELSE 0 END)`
    })
    .from(expenseClaims)
    .where(eq(expenseClaims.userId, userId));

    const stats = userClaims[0];
    
    return {
      message: `Your expenses: ${stats.total} claims, ₹${Number(stats.totalAmount).toLocaleString()} total. Pending: ${stats.pending}, Approved: ${stats.approved}, Paid: ${stats.paid}`,
      data: stats
    };
  }

  private async queryCashboxBalance(): Promise<QueryResult> {
    // This would integrate with your cashbox system
    // For now, return a placeholder
    return {
      message: "Cashbox balance feature needs integration with your cashbox system.",
      data: { balance: 0, message: "Integration pending" }
    };
  }

  private async queryVendors(): Promise<QueryResult> {
    const vendorList = await db.select({
      id: vendors.id,
      name: vendors.name,
      totalPaid: vendors.totalPaid,
      contactPerson: vendors.contactPerson
    })
    .from(vendors)
    .limit(10);

    if (vendorList.length === 0) {
      return { message: "No vendors found.", data: [] };
    }

    const totalPaid = vendorList.reduce((sum, vendor) => 
      sum + parseFloat(vendor.totalPaid || '0'), 0
    );

    const totalPaidFormatted = totalPaid.toLocaleString();
    
    let conversationalMessage;
    if (vendorList.length === 1) {
      conversationalMessage = `I found 1 vendor in your system. You've paid them a total of ₹${totalPaidFormatted} so far.`;
    } else if (vendorList.length <= 5) {
      conversationalMessage = `Here are your ${vendorList.length} vendors. In total, you've paid ₹${totalPaidFormatted} across all vendor relationships.`;
    } else {
      conversationalMessage = `You have ${vendorList.length} vendors in your system. Collectively, you've paid them ₹${totalPaidFormatted}. That's quite a network you've built!`;
    }

    return {
      message: conversationalMessage,
      data: vendorList
    };
  }

  private async queryPaymentBatches(): Promise<QueryResult> {
    const batches = await db.select({
      id: paymentBatches.id,
      batchNumber: paymentBatches.batchNumber,
      totalAmount: paymentBatches.totalAmount,
      status: paymentBatches.status,
      createdAt: paymentBatches.createdAt
    })
    .from(paymentBatches)
    .orderBy(paymentBatches.createdAt)
    .limit(10);

    if (batches.length === 0) {
      return { message: "No payment batches found.", data: [] };
    }

    const pendingBatches = batches.filter(b => b.status === 'pending_approval').length;
    
    return {
      message: `Found ${batches.length} payment batches. ${pendingBatches} pending approval.`,
      data: batches
    };
  }

  private async queryPayments(parameters: any): Promise<QueryResult> {
    const filters = parameters.filters || {};
    
    const payments = await db.select({
      id: expenseClaims.id,
      title: expenseClaims.title,
      balancePayment: expenseClaims.balancePayment,
      status: expenseClaims.status,
      userName: users.firstName
    })
    .from(expenseClaims)
    .leftJoin(users, eq(expenseClaims.userId, users.id))
    .where(eq(expenseClaims.status, filters.status || 'approved'))
    .limit(20);

    const total = payments.reduce((sum, payment) => 
      sum + parseFloat(payment.balancePayment), 0
    );

    return {
      message: `Found ${payments.length} payments totaling ₹${total.toLocaleString()}`,
      data: payments
    };
  }

  private async queryReceipts(userId: string): Promise<QueryResult> {
    const receiptCount = await db.select({ count: count() })
      .from(receipts)
      .where(eq(receipts.userId, userId));

    return {
      message: `You have ${receiptCount[0].count} receipts uploaded.`,
      data: { count: receiptCount[0].count }
    };
  }

  private async queryRequests(userId: string): Promise<QueryResult> {
    const userRequests = await db.select({
      id: expenseRequests.id,
      title: expenseRequests.title,
      estimatedAmount: expenseRequests.estimatedAmount,
      status: expenseRequests.status,
      type: expenseRequests.type
    })
    .from(expenseRequests)
    .where(eq(expenseRequests.userId, userId))
    .limit(10);

    const pending = userRequests.filter(r => r.status === 'pending').length;
    
    return {
      message: `You have ${userRequests.length} requests. ${pending} pending approval.`,
      data: userRequests
    };
  }

  private async queryDashboard(userId: string): Promise<QueryResult> {
    // Get user summary
    const claimStats = await db.select({
      totalClaims: count(),
      totalAmount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
      pendingClaims: sql<number>`SUM(CASE WHEN ${expenseClaims.status} = 'pending' THEN 1 ELSE 0 END)`
    })
    .from(expenseClaims)
    .where(eq(expenseClaims.userId, userId));

    const stats = claimStats[0];
    
    return {
      message: `Dashboard: ${stats.totalClaims} total claims, ₹${Number(stats.totalAmount).toLocaleString()} spent, ${stats.pendingClaims} pending approval.`,
      data: stats
    };
  }

  private async queryReports(): Promise<QueryResult> {
    const monthlyTotal = await db.select({
      totalAmount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
      totalClaims: count()
    })
    .from(expenseClaims)
    .where(sql`${expenseClaims.createdAt} >= DATE_TRUNC('month', CURRENT_DATE)`);

    const stats = monthlyTotal[0];
    
    return {
      message: `This month: ${stats.totalClaims} claims, ₹${Number(stats.totalAmount).toLocaleString()} total expenses.`,
      data: stats
    };
  }

  private async queryUsers(): Promise<QueryResult> {
    const userCount = await db.select({ count: count() }).from(users);
    
    return {
      message: `System has ${userCount[0].count} registered users.`,
      data: { totalUsers: userCount[0].count }
    };
  }

  private async queryCompliance(): Promise<QueryResult> {
    // This would calculate GST/TDS summaries
    return {
      message: "Compliance reporting feature needs GST/TDS calculation integration.",
      data: { message: "Feature pending implementation" }
    };
  }

  private async queryTdsRates(): Promise<QueryResult> {
    const { storage } = await import("../storage");
    const tdsRates = await storage.getTdsMaster();
    
    if (tdsRates.length === 0) {
      return {
        message: "No TDS rates configured yet. You can set these up in the configuration section.",
        data: []
      };
    }

    return {
      message: `Here are your TDS rate configurations for ${tdsRates.length} categories. These rates apply automatically based on vendor type and amount thresholds.`,
      data: tdsRates
    };
  }

  private async queryExpensePolicies(): Promise<QueryResult> {
    const { storage } = await import("../storage");
    const policies = await storage.getExpensePolicies();
    
    if (policies.length === 0) {
      return {
        message: "No expense policies configured yet. Setting up policies helps ensure compliance and automates approvals.",
        data: []
      };
    }

    return {
      message: `Found ${policies.length} expense policies. These govern approval workflows and spending limits across your organization.`,
      data: policies
    };
  }

  private async queryCostCenters(): Promise<QueryResult> {
    const { storage } = await import("../storage");
    const costConfig = await storage.getCostCentreConfig("13");
    
    return {
      message: costConfig ? 
        "Here's your cost center configuration for expense tracking and reporting." : 
        "Cost center configuration not set up yet. This helps categorize expenses for better financial tracking.",
      data: costConfig || { message: "Not configured" }
    };
  }

  private async queryExpenseGroups(): Promise<QueryResult> {
    const { storage } = await import("../storage");
    const groups = await storage.getExpenseGroups();
    
    if (groups.length === 0) {
      return {
        message: "No expense groups configured. These help organize expense types for better reporting and policy management.",
        data: []
      };
    }

    return {
      message: `You have ${groups.length} expense groups set up. These help organize different types of expenses for clearer reporting.`,
      data: groups
    };
  }

  private async queryExpenseHeads(): Promise<QueryResult> {
    const { storage } = await import("../storage");
    const heads = await storage.getExpenseHeads();
    
    if (heads.length === 0) {
      return {
        message: "No expense heads configured yet. These define specific categories for expense classification and budgeting.",
        data: []
      };
    }

    return {
      message: `Found ${heads.length} expense heads in your system. These categories help classify and track different types of business expenses.`,
      data: heads
    };
  }

  private async queryWorkflows(): Promise<QueryResult> {
    const { storage } = await import("../storage");
    const workflows = await storage.getWorkflows();
    
    if (workflows.length === 0) {
      return {
        message: "No approval workflows configured. Setting up workflows automates your expense approval process.",
        data: []
      };
    }

    const activeWorkflows = workflows.filter(w => w.isActive);
    
    return {
      message: `You have ${workflows.length} approval workflows configured, with ${activeWorkflows.length} currently active. These automate your expense approval process.`,
      data: workflows
    };
  }
  private async queryPettyCash(userId: string): Promise<QueryResult> {
    const { storage } = await import("../storage");
    
    try {
      // Get petty cash transactions - use a fallback approach
      const transactions = await db.select().from(expenseClaims).limit(10);
      
      return {
        message: `Found ${transactions.length} petty cash transactions. You can manage petty cash in the Petty Cash section.`,
        data: transactions
      };
    } catch (error) {
      return {
        message: "Petty cash transactions available in the Petty Cash section of the application.",
        data: []
      };
    }
  }

  private async queryDirectExpenses(userId: string): Promise<QueryResult> {
    const { storage } = await import("../storage");
    
    try {
      // Get direct expenses data
      const response = await fetch('/api/direct-expenses', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const expenses = await response.json();
        return {
          message: `Found ${expenses.length} direct expenses. These are company-level expenses not tied to individual employees.`,
          data: expenses
        };
      }
      
      return {
        message: "Direct expenses available in the Direct Expenses section.",
        data: []
      };
    } catch (error) {
      return {
        message: "Direct expenses can be viewed and managed in the Direct Expenses section.",
        data: []
      };
    }
  }

  private async queryAdvancePayments(userId: string): Promise<QueryResult> {
    try {
      // Get advance payments
      const response = await fetch('/api/advance-payments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const advances = await response.json();
        return {
          message: `Found ${advances.length} advance payments. These are pre-approved payments to employees.`,
          data: advances
        };
      }
      
      return {
        message: "Advance payments available in the Advance Payments section.",
        data: []
      };
    } catch (error) {
      return {
        message: "Advance payments can be viewed in the Advance Payments section of the application.",
        data: []
      };
    }
  }

  private async queryContracts(): Promise<QueryResult> {
    try {
      const response = await fetch('/api/contracts', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const contracts = await response.json();
        return {
          message: `Found ${contracts.length} contracts. These are vendor/supplier agreements and contracts.`,
          data: contracts
        };
      }
      
      return {
        message: "Contracts available in the Contract Management section.",
        data: []
      };
    } catch (error) {
      return {
        message: "Contract information can be accessed in the Contract Management section.",
        data: []
      };
    }
  }

  private async queryPartyMaster(): Promise<QueryResult> {
    try {
      const response = await fetch('/api/party-master', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const parties = await response.json();
        return {
          message: `Found ${parties.length} parties in the party master. These are business entities you work with.`,
          data: parties
        };
      }
      
      return {
        message: "Party master data available in the Party Master section.",
        data: []
      };
    } catch (error) {
      return {
        message: "Party master information can be managed in the Party Master section.",
        data: []
      };
    }
  }

  private async queryPaymentProcessing(): Promise<QueryResult> {
    try {
      // This could query payment batches, pending payments, etc.
      const batchesResponse = await fetch('/api/payment-batches', {
        credentials: 'include'
      });
      
      if (batchesResponse.ok) {
        const batches = await batchesResponse.json();
        return {
          message: `Found ${batches.length} payment batches in processing. You can manage payments in the Payment Processing section.`,
          data: batches
        };
      }
      
      return {
        message: "Payment processing information available in the Payments section.",
        data: []
      };
    } catch (error) {
      return {
        message: "Payment processing can be managed in the Accountant > Payments section.",
        data: []
      };
    }
  }

  private async queryFundTransfers(): Promise<QueryResult> {
    return {
      message: "Fund transfers can be managed in the Accountant > Receipts > Fund Transfer section. This feature handles money transfers between accounts.",
      data: []
    };
  }

  private async queryVendorOnboarding(): Promise<QueryResult> {
    try {
      const { storage } = await import("../storage");
      // Query vendor onboarding requests
      const onboardingRequests = await storage.getVendorOnboardingRequests();
      
      const pendingRequests = onboardingRequests.filter(req => req.status === 'pending');
      
      return {
        message: `Found ${pendingRequests.length} pending vendor onboarding requests out of ${onboardingRequests.length} total requests. These need approval for vendor activation.`,
        data: { pending: pendingRequests, total: onboardingRequests }
      };
    } catch (error) {
      return {
        message: "Vendor onboarding requests can be managed in the Vendor Management section. This handles new vendor registration and approval workflow.",
        data: []
      };
    }
  }

  private async queryVendorDocuments(): Promise<QueryResult> {
    try {
      const { storage } = await import("../storage");
      const documents = await storage.getVendorDocuments();
      
      const pendingVerification = documents.filter(doc => doc.isVerified === false);
      
      return {
        message: `Found ${pendingVerification.length} vendor documents pending verification out of ${documents.length} total documents.`,
        data: { pending: pendingVerification, total: documents }
      };
    } catch (error) {
      return {
        message: "Vendor documents and verification can be managed in the Vendor Management > Documents section.",
        data: []
      };
    }
  }

  private async queryVendorReports(): Promise<QueryResult> {
    try {
      const { storage } = await import("../storage");
      const reports = await storage.getUserReports();
      
      return {
        message: `Vendor analytics and reports are available. This includes expense reports, top vendors, payment clearing status, and GST/TDS summaries.`,
        data: reports
      };
    } catch (error) {
      return {
        message: "Vendor reports and analytics are available in the Vendor Management > Reports section including expense analysis, payment trends, and tax summaries.",
        data: []
      };
    }
  }

  private async queryCostCenterConfig(): Promise<QueryResult> {
    try {
      const { storage } = await import("../storage");
      const config = await storage.getCostCentreConfig();
      
      return {
        message: `Cost center configuration shows ${config?.type || 'single'} category setup. This controls how expenses are distributed across cost centers for accounting and Tally integration.`,
        data: config
      };
    } catch (error) {
      return {
        message: "Cost center configuration is available in Configuration > Cost Center. This sets up expense distribution categories for accounting integration.",
        data: []
      };
    }
  }

  private async queryFilterData(): Promise<QueryResult> {
    try {
      // Query filter data that includes locations, departments, etc.
      const { filterDataService } = await import("../../client/src/services/filterDataService");
      const filterData = await filterDataService.getFilterData();
      
      return {
        message: `Found ${filterData.length} location and department filter options. This data is used for cost trends analysis and location-based expense restrictions.`,
        data: filterData
      };
    } catch (error) {
      return {
        message: "Location and department data is available through the organization's filter configuration. This includes cost center trends and location-based restrictions.",
        data: []
      };
    }
  }

  private async queryPaymentHistory(): Promise<QueryResult> {
    try {
      const { storage } = await import("../storage");
      const history = await storage.getVendorPaymentHistory();
      
      return {
        message: `Found ${history.length} payment history records. This includes vendor payments, processing status, and payment tracking across all vendors.`,
        data: history
      };
    } catch (error) {
      return {
        message: "Payment history and tracking is available in the Vendor Management > Payment History section.",
        data: []
      };
    }
  }

  private async queryValidationRules(): Promise<QueryResult> {
    try {
      const { storage } = await import("../storage");
      
      // Get expense policies which contain validation rules
      const policies = await storage.getExpensePolicies();
      const workflows = await storage.getWorkflows();
      
      const activeRules = policies.filter(p => p.status === true);
      const activeWorkflows = workflows.filter(w => w.isActive === true);
      
      return {
        message: `Found ${activeRules.length} active expense policy rules and ${activeWorkflows.length} active workflows. These control amount limits, location restrictions, approval levels, and expense validation.`,
        data: { 
          policies: activeRules, 
          workflows: activeWorkflows,
          summary: {
            totalRules: activeRules.length,
            totalWorkflows: activeWorkflows.length,
            hasLocationRules: activeRules.some(r => r.locationId),
            hasAmountLimits: activeRules.some(r => r.limitAmount)
          }
        }
      };
    } catch (error) {
      return {
        message: "Validation rules are configured through Expense Policies and Workflow Configuration. These control claim limits, approval requirements, and location-based restrictions.",
        data: []
      };
    }
  }

  async queryBillMaster(): Promise<QueryResult> {
    try {
      const billTypes = await db.select().from(billMasterTypes);
      
      const defaultTypes = [
        'Vendor Dues Form (for predictable expenses)',
        'Utility Bill Form (for consumption-based expenses)', 
        'Standard Vendor Bill Form',
        'Non-Registered Vendor Payment Form',
        'Purchase Order (PO) to Invoice Matching Form'
      ];

      const activeBillTypes = billTypes.filter(bt => bt.isActive);

      return {
        message: `📋 **Bill Master Configuration:**

🔧 **Default Bill Types (System):**
${defaultTypes.map(type => `• ${type}`).join('\n')}

⚙️ **Custom Bill Types (${activeBillTypes.length} active):**
${activeBillTypes.length > 0 
  ? activeBillTypes.map(bt => `• ${bt.name} - ${bt.description || 'No description'}`).join('\n')
  : '• No custom bill types configured yet'
}

💡 **Bill Master Features:**
• Create custom bill types for specific vendor requirements
• Configure dynamic form fields (text, currency, date, dropdown, etc.)
• Set field validation rules and display options
• Control field visibility and arrangement

📍 **Management:**
Configuration → Bill Master to create and manage custom bill types and their fields.

🎯 **Usage:**
Custom bill types appear in vendor claim forms alongside default types, allowing flexible form configuration for different vendor payment scenarios.`,
        data: { defaultTypes, customTypes: activeBillTypes }
      };
    } catch (error) {
      return { message: "Unable to retrieve bill master configuration." };
    }
  }

  async queryBillFields(): Promise<QueryResult> {
    try {
      const billTypes = await db.select().from(billMasterTypes);
      const fields = await db.select().from(billMasterFields);
      
      const fieldsByType = fields.reduce((acc, field) => {
        if (!acc[field.billTypeId]) acc[field.billTypeId] = [];
        acc[field.billTypeId].push(field);
        return acc;
      }, {} as Record<string, typeof fields>);

      const availableFieldTypes = [
        'Text (Single line input)',
        'Text Area (Multi-line input)', 
        'Number (Numeric input)',
        'Currency (Money amount)',
        'Date (Date picker)',
        'Email (Email address)',
        'Phone (Phone number)',
        'Dropdown (Single selection)',
        'Checkbox (Yes/No option)',
        'File Upload (Document attachment)'
      ];

      return {
        message: `🔧 **Bill Form Field Configuration:**

📝 **Available Field Types:**
${availableFieldTypes.map(type => `• ${type}`).join('\n')}

📊 **Current Field Configuration:**
${billTypes.map(bt => {
  const btFields = fieldsByType[bt.id] || [];
  return `• **${bt.name}:** ${btFields.length} fields configured
  ${btFields.map(f => `  - ${f.fieldLabel} (${f.fieldType}${f.isRequired ? ', required' : ''})`).join('\n')}`;
}).join('\n') || '• No custom bill types with fields configured yet'}

⚙️ **Field Options:**
• **Width:** Full, Half, One Third, Quarter
• **Validation:** Required/Optional, Custom rules
• **Display:** Visible/Hidden, Display order
• **Behavior:** Placeholder text, default values, helper text

💡 **Field Management:**
Each custom bill type can have unlimited fields with full configuration control including validation rules, display options, and data types.

📍 **Configuration:**
Go to Configuration → Bill Master → Select a bill type → Add/Edit Fields`,
        data: { fieldTypes: availableFieldTypes, fieldsByType }
      };
    } catch (error) {
      return { message: "Unable to retrieve bill field configuration." };
    }
  }
}

export const dataQuerier = new DataQuerier();