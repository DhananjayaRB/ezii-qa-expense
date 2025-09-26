import {
  users,
  companies,
  expenseCategories,
  expenseClaims,
  expenseItems,
  directExpenses,
  expenseRequests,
  receipts,
  advancePayments,
  paymentBatches,
  paymentBatchItems,
  cardStatements,
  cardTransactions,
  cardPayments,
  bankAdvice,
  bankAdviceItems,
  banks,
  pettyCashReceipts,
  cashboxes,
  ledgerEntries,
  pettyCashTransactions,
  approvalHistory,
  parties,
  vendors,
  vendorOnboardingRequests,
  vendorDocuments,
  vendorPaymentHistory,
  costCentreConfigs,
  costDistributions,
  expenseGroups,
  expenseHeads,
  expensePolicies,
  tdsMaster,
  contracts,
  notifications,
  automatedTasks,
  agentConversations,
  agentMessages,
  billMasterTypes,
  billMasterFields,
  dashboardWidgets,
  customReports,
  type User,
  type UpsertUser,
  type ApprovalHistory,
  type InsertApprovalHistory,
  type Company,
  type InsertCompany,
  type ExpenseCategory,
  type InsertExpenseCategory,
  type ExpenseClaim,
  type InsertExpenseClaim,
  type ExpenseItem,
  type InsertExpenseItem,
  type DirectExpense,
  type InsertDirectExpense,
  type ExpenseRequest,
  type InsertExpenseRequest,
  type AdvancePayment,
  type InsertAdvancePayment,
  type Receipt,
  type InsertReceipt,
  type PaymentBatch,
  type InsertPaymentBatch,
  type PaymentBatchItem,
  type InsertPaymentBatchItem,
  type CardStatement,
  type InsertCardStatement,
  type CardTransaction,
  type InsertCardTransaction,
  type CardPayment,
  type InsertCardPayment,
  type BankAdvice,
  type InsertBankAdvice,
  type BankAdviceItem,
  type InsertBankAdviceItem,
  type Bank,
  type InsertBank,
  type PettyCashReceipt,
  type InsertPettyCashReceipt,
  type Cashbox,
  type InsertCashbox,
  type LedgerEntry,
  type InsertLedgerEntry,
  type PettyCashTransaction,
  type InsertPettyCashTransaction,
  type Party,
  type InsertParty,
  type Vendor,
  type InsertVendor,
  type VendorOnboardingRequest,
  type InsertVendorOnboardingRequest,
  type VendorDocument,
  type InsertVendorDocument,
  type VendorPaymentHistory,
  type InsertVendorPaymentHistory,
  type CostCentreConfig,
  type InsertCostCentreConfig,
  type CostDistribution,
  type InsertCostDistribution,
  type ExpenseGroup,
  type InsertExpenseGroup,
  type ExpenseHead,
  type InsertExpenseHead,
  type ExpensePolicy,
  type InsertExpensePolicy,
  type TdsMaster,
  type InsertTdsMaster,
  type Contract,
  type InsertContract,
  type Notification,
  type InsertNotification,
  type AutomatedTask,
  type InsertAutomatedTask,
  type AgentConversation,
  type InsertAgentConversation,
  type AgentMessage,
  type InsertAgentMessage,
  type BillMasterType,
  type InsertBillMasterType,
  type BillMasterField,
  type InsertBillMasterField,
  type DashboardWidget,
  type InsertDashboardWidget,
  type CustomReport,
  type InsertCustomReport,
  type WorkflowRole,
  type InsertWorkflowRole,
  type Workflow,
  type InsertWorkflow,
  type WorkflowLevel,
  type InsertWorkflowLevel,
  type WorkflowAssignment,
  type InsertWorkflowAssignment,
  type WorkflowInstance,
  type InsertWorkflowInstance,
  workflowRoles,
  workflows,
  workflowLevels,
  workflowAssignments,
  workflowInstances,
  processMaster,
  type ProcessMaster,
  type InsertProcessMaster,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, ilike, sql, inArray, or, isNotNull, isNull, ne } from "drizzle-orm";
import { getWorkflowEngine, type WorkflowContext, type WorkflowResult, type ApprovalAction } from './workflowEngine.js';

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  
  // Expense category operations
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  getExpenseCategories(companyId?: string): Promise<ExpenseCategory[]>;
  updateExpenseCategory(id: string, updates: Partial<ExpenseCategory>): Promise<ExpenseCategory | undefined>;
  deleteExpenseCategory(id: string): Promise<void>;
  
  // Expense group operations
  createExpenseGroup(group: InsertExpenseGroup): Promise<ExpenseGroup>;
  getExpenseGroups(): Promise<ExpenseGroup[]>;
  updateExpenseGroup(id: string, updates: Partial<ExpenseGroup>): Promise<ExpenseGroup | undefined>;
  deleteExpenseGroup(id: string): Promise<void>;
  
  // Expense head operations
  createExpenseHead(head: InsertExpenseHead): Promise<ExpenseHead>;
  getExpenseHeads(groupId?: string): Promise<ExpenseHead[]>;
  updateExpenseHead(id: string, updates: Partial<ExpenseHead>): Promise<ExpenseHead | undefined>;
  deleteExpenseHead(id: string): Promise<void>;
  
  // Expense policy operations
  createExpensePolicy(policy: InsertExpensePolicy): Promise<ExpensePolicy>;
  getExpensePolicies(companyId?: string): Promise<ExpensePolicy[]>;
  getExpensePolicyById(id: string): Promise<ExpensePolicy | undefined>;
  updateExpensePolicy(id: string, updates: Partial<ExpensePolicy>): Promise<ExpensePolicy | undefined>;
  deleteExpensePolicy(id: string): Promise<void>;
  
  // Expense claim operations
  createExpenseClaim(claim: InsertExpenseClaim, costDistributions?: InsertCostDistribution[]): Promise<ExpenseClaim>;
  getExpenseClaims(filters?: {
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    orgId?: string;
    title?: string;
  }): Promise<(ExpenseClaim & { user: User; items: ExpenseItem[] })[]>;
  getExpenseClaim(id: string): Promise<(ExpenseClaim & { user: User; items: ExpenseItem[] }) | undefined>;
  updateExpenseClaimStatus(id: string, status: string, approvedBy?: string): Promise<ExpenseClaim>;
  updateExpenseClaim(id: string, updates: Partial<ExpenseClaim>): Promise<ExpenseClaim | undefined>;
  deleteExpenseClaim(id: string): Promise<void>;
  
  // Cost Distribution operations
  getCostDistributions(claimId: string): Promise<CostDistribution[]>;
  updateCostDistribution(id: string, updates: Partial<CostDistribution>): Promise<CostDistribution | undefined>;
  
  // Approval workflow operations
  createApprovalHistory(approval: InsertApprovalHistory): Promise<ApprovalHistory>;
  getApprovalHistory(claimId: string): Promise<(ApprovalHistory & { approver: User })[]>;
  processApprovalWorkflow(claimId: string, approverId: string, action: 'approve' | 'reject' | 'return', remarks?: string): Promise<{ claim: ExpenseClaim; nextApprover?: User }>;
  getNextApprover(currentLevel: string): Promise<User | undefined>;
  updateClaimApprovalStatus(claimId: string, newStatus: string, currentLevel: string, pendingWith?: string): Promise<ExpenseClaim>;
  
  // Payment processing operations
  getApprovedClaims(): Promise<(ExpenseClaim & { user: User; items: ExpenseItem[] })[]>;
  processPayment(claimId: string, utrNumber: string, paymentDate: Date, processedBy: string): Promise<ExpenseClaim>;
  getProcessedPayments(filters?: { startDate?: Date; endDate?: Date }): Promise<(ExpenseClaim & { user: User; processedByUser: User })[]>;
  
  // Expense item operations
  createExpenseItem(item: InsertExpenseItem): Promise<ExpenseItem>;
  getExpenseItems(claimId: string): Promise<ExpenseItem[]>;
  updateExpenseItem(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem | undefined>;
  deleteExpenseItem(id: string): Promise<void>;
  
  // Direct expense operations
  createDirectExpense(expense: InsertDirectExpense): Promise<DirectExpense>;
  getDirectExpenses(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(DirectExpense & { creator: User; category?: ExpenseCategory })[]>;
  updateDirectExpense(id: string, updates: Partial<DirectExpense>): Promise<DirectExpense | undefined>;
  deleteDirectExpense(id: string): Promise<void>;
  processDirectExpensePayment(expenseId: string, utrNumber: string, paymentDate: Date, processedBy: string): Promise<DirectExpense>;
  
  // Expense request operations
  createExpenseRequest(request: InsertExpenseRequest): Promise<ExpenseRequest>;
  getExpenseRequests(filters?: {
    userId?: string;
    status?: string;
    type?: string;
  }): Promise<(ExpenseRequest & { user: User })[]>;
  updateExpenseRequestStatus(id: string, status: string, approvedBy?: string): Promise<ExpenseRequest>;
  updateExpenseRequest(id: string, updates: Partial<ExpenseRequest>): Promise<ExpenseRequest | undefined>;
  deleteExpenseRequest(id: string): Promise<void>;
  
  // Advance payment operations
  createAdvancePayment(advance: InsertAdvancePayment): Promise<AdvancePayment>;
  getAdvancePayments(filters?: {
    userId?: string;
    isSettled?: boolean;
  }): Promise<(AdvancePayment & { request: ExpenseRequest; user: User })[]>;
  markAdvanceAsSettled(advanceId: string): Promise<AdvancePayment>;
  getApprovedAdvancesByUser(userId: string): Promise<(AdvancePayment & { request: ExpenseRequest })[]>;
  updateAdvancePayment(id: string, updates: Partial<AdvancePayment>): Promise<AdvancePayment | undefined>;
  deleteAdvancePayment(id: string): Promise<void>;
  
  // Receipt operations
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipts(userId?: string): Promise<Receipt[]>;
  attachReceipt(receiptId: string, attachedToId: string, attachedToType: string): Promise<Receipt>;
  updateReceipt(id: string, updates: Partial<Receipt>): Promise<Receipt | undefined>;
  deleteReceipt(id: string): Promise<void>;
  
  // Workflow operations
  processAdvancePayment(requestId: string, approvedAmount: number): Promise<AdvancePayment>;
  
  // Dashboard operations
  getDashboardMetrics(userId?: string): Promise<{
    totalExpenses: number;
    pendingApproval: number;
    settled: number;
    openAdvances: number;
  }>;

  // Payment Batch operations
  getPaymentBatches(): Promise<PaymentBatch[]>;
  getPaymentBatch(id: string): Promise<PaymentBatch | undefined>;
  createPaymentBatch(batch: InsertPaymentBatch): Promise<PaymentBatch>;
  updatePaymentBatch(id: string, updates: Partial<PaymentBatch>): Promise<PaymentBatch | undefined>;
  deletePaymentBatch(id: string): Promise<void>;
  releaseBills(batchId: string, releasedBy: string): Promise<PaymentBatch | undefined>;
  
  // Payment batch approval workflow
  getPaymentBatchesForApproval(userRole: string): Promise<PaymentBatch[]>;
  processPaymentBatchApproval(batchId: string, approverId: string, action: 'approve' | 'reject' | 'return', remarks?: string): Promise<{ batch: PaymentBatch; nextApprover?: User }>;
  getPaymentBatchApprovalHistory(batchId: string): Promise<(ApprovalHistory & { approver: User })[]>;
  getApprovedPaymentBatches(): Promise<PaymentBatch[]>;

  // Payment Batch Items operations
  getPaymentBatchItems(batchId: string): Promise<PaymentBatchItem[]>;
  createPaymentBatchItem(item: InsertPaymentBatchItem): Promise<PaymentBatchItem>;
  updatePaymentBatchItem(id: string, updates: Partial<PaymentBatchItem>): Promise<PaymentBatchItem | undefined>;
  deletePaymentBatchItem(id: string): Promise<void>;

  // Card Statement operations
  getCardStatements(): Promise<CardStatement[]>;
  getCardStatement(id: string): Promise<CardStatement | undefined>;
  createCardStatement(statement: InsertCardStatement): Promise<CardStatement>;
  updateCardStatement(id: string, updates: Partial<CardStatement>): Promise<CardStatement | undefined>;
  deleteCardStatement(id: string): Promise<void>;

  // Card Transaction operations
  getCardTransactions(statementId: string): Promise<CardTransaction[]>;
  createCardTransaction(transaction: InsertCardTransaction): Promise<CardTransaction>;
  updateCardTransaction(id: string, updates: Partial<CardTransaction>): Promise<CardTransaction | undefined>;
  deleteCardTransaction(id: string): Promise<void>;

  // Card Payment operations
  getCardPayments(): Promise<CardPayment[]>;
  getCardPaymentsByStatement(statementId: string): Promise<CardPayment[]>;
  createCardPayment(payment: InsertCardPayment): Promise<CardPayment>;
  updateCardPayment(id: string, updates: Partial<CardPayment>): Promise<CardPayment | undefined>;
  deleteCardPayment(id: string): Promise<void>;

  // Bank Advice operations
  getBankAdvice(type?: string): Promise<BankAdvice[]>;
  getBankAdviceById(id: string): Promise<BankAdvice | undefined>;
  createBankAdvice(advice: InsertBankAdvice): Promise<BankAdvice>;
  updateBankAdvice(id: string, updates: Partial<BankAdvice>): Promise<BankAdvice | undefined>;
  deleteBankAdvice(id: string): Promise<void>;

  // Bank Advice Items operations
  getBankAdviceItems(adviceId: string): Promise<BankAdviceItem[]>;
  createBankAdviceItem(item: InsertBankAdviceItem): Promise<BankAdviceItem>;
  updateBankAdviceItem(id: string, updates: Partial<BankAdviceItem>): Promise<BankAdviceItem | undefined>;
  deleteBankAdviceItem(id: string): Promise<void>;

  // Generate Bank Advice Reports
  generateEmployeeBankAdvice(paymentBatchId: string, paymentDate: Date, generatedBy: string): Promise<BankAdvice>;
  generateVendorBankAdvice(paymentBatchId: string, paymentDate: Date, generatedBy: string): Promise<BankAdvice>;
  
  // Bank operations
  getBanks(): Promise<Bank[]>;
  createBank(bank: InsertBank): Promise<Bank>;
  updateBank(id: string, updates: Partial<Bank>): Promise<Bank | undefined>;
  deleteBank(id: string): Promise<void>;
  
  // Petty Cash Receipt operations
  getPettyCashReceipts(): Promise<(PettyCashReceipt & { receivedFrom?: User; bank?: Bank; recordedBy: User })[]>;
  getPettyCashReceipt(id: string): Promise<(PettyCashReceipt & { receivedFrom?: User; bank?: Bank; recordedBy: User }) | undefined>;
  createPettyCashReceipt(receipt: InsertPettyCashReceipt): Promise<PettyCashReceipt>;
  updatePettyCashReceipt(id: string, updates: Partial<PettyCashReceipt>): Promise<PettyCashReceipt | undefined>;
  deletePettyCashReceipt(id: string): Promise<void>;

  // User Reports operations
  getUserReports(userId?: string): Promise<any>;

  // ========== PETTY CASH MANAGEMENT SYSTEM ==========
  
  // Party operations
  getParties(): Promise<Party[]>;
  getParty(id: string): Promise<Party | undefined>;
  createParty(party: InsertParty): Promise<Party>;
  updateParty(id: string, updates: Partial<Party>): Promise<Party | undefined>;
  deleteParty(id: string): Promise<void>;
  
  // ========== VENDOR MANAGEMENT OPERATIONS ==========
  
  // Vendor operations
  getVendors(filters?: { status?: string; searchTerm?: string }): Promise<(Vendor & { createdBy: User })[]>;
  getVendor(id: string): Promise<(Vendor & { createdBy: User }) | undefined>;
  getActiveVendors(): Promise<Vendor[]>; // For expense claim linking
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<void>;
  
  // Vendor Onboarding Requests operations
  getVendorOnboardingRequests(filters?: { status?: string; requestedBy?: string }): Promise<(VendorOnboardingRequest & { requester: User; documents: VendorDocument[] })[]>;
  getVendorOnboardingRequest(id: string): Promise<(VendorOnboardingRequest & { requester: User; documents: VendorDocument[] }) | undefined>;
  createVendorOnboardingRequest(request: InsertVendorOnboardingRequest): Promise<VendorOnboardingRequest>;
  updateVendorOnboardingRequest(id: string, updates: Partial<VendorOnboardingRequest>): Promise<VendorOnboardingRequest | undefined>;
  deleteVendorOnboardingRequest(id: string): Promise<void>;
  
  // Vendor onboarding approval workflow
  processVendorOnboardingApproval(requestId: string, approverId: string, action: 'approve' | 'reject', remarks?: string): Promise<{ request: VendorOnboardingRequest; vendor?: Vendor }>;
  getVendorOnboardingRequestsForApproval(userRole: string): Promise<VendorOnboardingRequest[]>;
  
  // Vendor Documents operations
  getVendorDocuments(onboardingRequestId?: string, vendorId?: string): Promise<(VendorDocument & { uploadedBy: User })[]>;
  getVendorDocument(id: string): Promise<(VendorDocument & { uploadedBy: User }) | undefined>;
  createVendorDocument(document: InsertVendorDocument): Promise<VendorDocument>;
  updateVendorDocument(id: string, updates: Partial<VendorDocument>): Promise<VendorDocument | undefined>;
  deleteVendorDocument(id: string): Promise<void>;
  verifyVendorDocument(id: string, verifiedBy: string): Promise<VendorDocument>;
  
  // Vendor Payment History operations
  getVendorPaymentHistory(vendorId?: string, filters?: { startDate?: Date; endDate?: Date }): Promise<(VendorPaymentHistory & { vendor: Vendor; processedBy: User })[]>;
  getVendorPaymentHistoryItem(id: string): Promise<(VendorPaymentHistory & { vendor: Vendor; processedBy: User }) | undefined>;
  createVendorPaymentHistory(payment: InsertVendorPaymentHistory): Promise<VendorPaymentHistory>;
  updateVendorPaymentHistory(id: string, updates: Partial<VendorPaymentHistory>): Promise<VendorPaymentHistory | undefined>;
  deleteVendorPaymentHistory(id: string): Promise<void>;
  
  // Vendor reconciliation and reporting
  getVendorPaymentSummary(vendorId: string): Promise<{ totalPaid: number; lastPaymentDate?: Date; pendingPayments: number }>;
  updateVendorPaymentTotals(vendorId: string): Promise<Vendor>; // Recalculate totals
  getVendorClaimsAndInvoices(vendorId: string): Promise<{ claims: ExpenseClaim[]; directExpenses: DirectExpense[] }>;
  
  // Cashbox operations
  getCashboxes(): Promise<(Cashbox & { cashier: User })[]>;
  getCashbox(id: string): Promise<(Cashbox & { cashier: User }) | undefined>;
  createCashbox(cashbox: InsertCashbox): Promise<Cashbox>;
  updateCashbox(id: string, updates: Partial<Cashbox>): Promise<Cashbox | undefined>;
  deleteCashbox(id: string): Promise<void>;
  
  // Transaction operations
  createPettyCashTransaction(transaction: InsertPettyCashTransaction): Promise<PettyCashTransaction>;
  getPettyCashTransactions(filters?: {
    cashboxId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(PettyCashTransaction & { cashier: User; payeeUser?: User })[]>;
  updatePettyCashTransaction(id: string, updates: Partial<PettyCashTransaction>): Promise<PettyCashTransaction | undefined>;
  deletePettyCashTransaction(id: string): Promise<void>;
  
  // Ledger operations
  getLedgerEntries(cashboxId: string, startDate?: Date, endDate?: Date): Promise<LedgerEntry[]>;
  getLedgerEntry(cashboxId: string, date: Date): Promise<LedgerEntry | undefined>;
  createOrUpdateLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  
  // Business logic operations
  initializeCashbox(cashboxId: string, initialAmount: number, recordedBy: string): Promise<{ cashbox: Cashbox; transaction: PettyCashTransaction; ledger: LedgerEntry }>;
  recordCashReceipt(cashboxId: string, amount: number, description: string, payee: string, recordedBy: string, receiptUrl?: string): Promise<PettyCashTransaction>;
  recordCashPayment(cashboxId: string, amount: number, description: string, payee: string, recordedBy: string, receiptUrl?: string): Promise<PettyCashTransaction>;
  recordFundTransfer(fromCashboxId: string, toCashboxId: string, amount: number, description: string, recordedBy: string): Promise<{ fromTransaction: PettyCashTransaction; toTransaction: PettyCashTransaction }>;
  recordIouTake(cashboxId: string, amount: number, description: string, payeeId: string, recordedBy: string): Promise<PettyCashTransaction>;
  recordIouRepay(originalIouId: string, amount: number, recordedBy: string): Promise<PettyCashTransaction>;
  getCurrentBalance(cashboxId: string): Promise<number>;
  recalculateLedgerFromDate(cashboxId: string, fromDate: Date): Promise<void>;

  // Cost Centre Configuration operations
  getCostCentreConfig(orgId: string): Promise<CostCentreConfig | null>;
  saveCostCentreConfig(configData: InsertCostCentreConfig): Promise<CostCentreConfig>;
  
  // TDS Master operations
  createTdsMaster(tdsMaster: InsertTdsMaster): Promise<TdsMaster>;
  getTdsMaster(): Promise<TdsMaster[]>;
  getTdsMasterByCategory(category: string): Promise<TdsMaster | undefined>;
  updateTdsMaster(id: string, updates: Partial<TdsMaster>): Promise<TdsMaster | undefined>;
  deleteTdsMaster(id: string): Promise<void>;

  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getContracts(filters?: { orgId?: string }): Promise<any[]>;
  getContract(id: string): Promise<any>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<void>;
  
  // Workflow System operations
  // Workflow Roles CRUD
  createWorkflowRole(role: InsertWorkflowRole): Promise<WorkflowRole>;
  getWorkflowRoles(filters?: { isActive?: boolean; companyId?: string }): Promise<WorkflowRole[]>;
  updateWorkflowRole(id: string, updates: Partial<WorkflowRole>): Promise<WorkflowRole | undefined>;
  deleteWorkflowRole(id: string): Promise<void>;
  
  // Workflows CRUD  
  createWorkflow(workflow: InsertWorkflow, levels: InsertWorkflowLevel[]): Promise<Workflow>;
  getWorkflows(filters?: { processTypes?: string[]; isActive?: boolean }): Promise<(Workflow & { levels: (WorkflowLevel & { role: WorkflowRole })[] })[]>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<void>;
  
  // Workflow Levels CRUD
  createWorkflowLevel(level: InsertWorkflowLevel): Promise<WorkflowLevel>;
  getWorkflowLevels(workflowId: string): Promise<(WorkflowLevel & { role: WorkflowRole })[]>;
  updateWorkflowLevel(id: string, updates: Partial<WorkflowLevel>): Promise<WorkflowLevel | undefined>;
  deleteWorkflowLevel(id: string): Promise<void>;
  
  // Workflow Assignments CRUD
  createWorkflowAssignment(assignment: InsertWorkflowAssignment): Promise<WorkflowAssignment>;
  getWorkflowAssignments(filters?: { processType?: string; vendorId?: string; expenseHeadId?: string }): Promise<(WorkflowAssignment & { workflow: Workflow })[]>;
  updateWorkflowAssignment(id: string, updates: Partial<WorkflowAssignment>): Promise<WorkflowAssignment | undefined>;
  deleteWorkflowAssignment(id: string): Promise<void>;
  
  // Workflow Engine operations
  getDefaultWorkflow(processType: string): Promise<(Workflow & { levels: (WorkflowLevel & { role: WorkflowRole })[] }) | undefined>;
  getWorkflowForContext(processType: string, context: { vendorId?: string; expenseHeadId?: string; amount?: number }): Promise<(Workflow & { levels: (WorkflowLevel & { role: WorkflowRole })[] }) | undefined>;
  
  // Workflow Instance operations
  createWorkflowInstance(instance: InsertWorkflowInstance): Promise<WorkflowInstance>;
  getWorkflowInstance(entityId: string, entityType: string): Promise<WorkflowInstance | undefined>;
  updateWorkflowInstance(id: string, updates: Partial<WorkflowInstance>): Promise<WorkflowInstance | undefined>;
  
  // Process Master operations - Manages workflow routing for different process types
  createProcessMaster(process: InsertProcessMaster): Promise<ProcessMaster>;
  getProcessMaster(processType: string): Promise<ProcessMaster | undefined>;
  getProcessMasters(): Promise<ProcessMaster[]>;
  updateProcessMaster(id: string, updates: Partial<ProcessMaster>): Promise<ProcessMaster | undefined>;
  
  // Agent Conversation operations
  createConversation(conversation: InsertAgentConversation): Promise<AgentConversation>;
  getConversations(userId: string): Promise<AgentConversation[]>;
  getConversation(id: string): Promise<(AgentConversation & { messages: AgentMessage[] }) | undefined>;
  updateConversation(id: string, updates: Partial<AgentConversation>): Promise<AgentConversation | undefined>;
  deleteConversation(id: string): Promise<void>;
  
  // Agent Message operations
  createMessage(message: InsertAgentMessage): Promise<AgentMessage>;
  getMessages(conversationId: string): Promise<AgentMessage[]>;
  deleteMessage(id: string): Promise<void>;
  
  // Bill Master operations
  createBillMasterType(billType: InsertBillMasterType): Promise<BillMasterType>;
  getBillMasterTypes(includeInactive?: boolean): Promise<(BillMasterType & { fields: BillMasterField[] })[]>;
  getBillMasterType(id: string): Promise<(BillMasterType & { fields: BillMasterField[] }) | undefined>;
  updateBillMasterType(id: string, updates: Partial<BillMasterType>): Promise<BillMasterType | undefined>;
  deleteBillMasterType(id: string): Promise<void>;
  
  // Bill Master Field operations
  createBillMasterField(field: InsertBillMasterField): Promise<BillMasterField>;
  getBillMasterFields(billTypeId: string): Promise<BillMasterField[]>;
  updateBillMasterField(id: string, updates: Partial<BillMasterField>): Promise<BillMasterField | undefined>;
  deleteBillMasterField(id: string): Promise<void>;
  reorderBillMasterFields(billTypeId: string, fieldOrders: { id: string; order: number }[]): Promise<void>;

  // Dashboard widgets operations
  getDashboardWidgets(userId: string): Promise<DashboardWidget[]>;
  createDashboardWidget(widgetData: InsertDashboardWidget): Promise<DashboardWidget>;
  updateDashboardWidget(id: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined>;
  deleteDashboardWidget(id: string): Promise<void>;
  getDashboardAnalytics(userId: string, role?: string, orgId?: string): Promise<{
    totalExpenses: number;
    pendingApprovals: number;
    recentClaims: any[];
    monthlyTrends: any[];
    categoryBreakdown: any[];
    vendorSpending: any[];
    avgProcessingTime: number;
  }>;

}

export class DatabaseStorage implements IStorage {
  // 403 Forbidden error helper
  private throwForbidden(message: string = 'Access denied'): never {
    const error = new Error(message);
    (error as any).statusCode = 403;
    throw error;
  }

  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName, users.lastName);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  // Expense category operations
  async createExpenseCategory(categoryData: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [category] = await db.insert(expenseCategories).values(categoryData).returning();
    return category;
  }

  async getExpenseCategories(companyId?: string): Promise<ExpenseCategory[]> {
    const query = db.select().from(expenseCategories);
    if (companyId) {
      return await query.where(eq(expenseCategories.companyId, companyId));
    }
    return await query;
  }

  // Expense claim operations
  async createExpenseClaim(claimData: InsertExpenseClaim, distributionData?: InsertCostDistribution[]): Promise<ExpenseClaim> {
    const [claim] = await db.insert(expenseClaims).values(claimData).returning();
    
    // If cost distributions are provided, save them
    if (distributionData && distributionData.length > 0) {
      const distributionsToInsert = distributionData
        .filter(dist => dist && dist.costCenterId) // Filter out undefined/invalid distributions
        .map(dist => ({
          ...dist,
          expenseClaimId: claim.id,
        }));
      
      if (distributionsToInsert.length > 0) {
        await db.insert(costDistributions).values(distributionsToInsert);
      }
    }
    
    return claim;
  }

  async getExpenseClaims(filters?: {
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    orgId?: string;
    title?: string;
  }): Promise<(ExpenseClaim & { user: User; items: ExpenseItem[] })[]> {
    console.log(`🔍 Storage: getExpenseClaims called with filters:`, filters);
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(expenseClaims.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(expenseClaims.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }
    // Add orgId filtering for security - filter by user's company
    if (filters?.orgId) {
      console.log(`🔍 Storage: Adding orgId filter for: ${filters.orgId}`);
      conditions.push(eq(users.companyId, filters.orgId));
    }
    // Add title filtering for reports
    if (filters?.title) {
      console.log(`🔍 Storage: Adding title filter for: ${filters.title}`);
      conditions.push(eq(expenseClaims.title, filters.title));
    }

    const query = db
      .select({
        id: expenseClaims.id,
        title: expenseClaims.title,
        description: expenseClaims.description,
        totalAmount: expenseClaims.totalAmount,
        balancePayment: expenseClaims.balancePayment,
        status: expenseClaims.status,
        vendorId: expenseClaims.vendorId,
        vendorDueDate: expenseClaims.vendorDueDate,
        vendorInvoiceNumber: expenseClaims.vendorInvoiceNumber,
        submittedAt: expenseClaims.submittedAt,
        approvedAt: expenseClaims.approvedAt,
        paidAt: expenseClaims.paidAt,
        createdAt: expenseClaims.createdAt,
        updatedAt: expenseClaims.updatedAt,
        userId: expenseClaims.userId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        employerName: expenseClaims.employerName,
        employeeNumber: expenseClaims.employeeNumber,
        employeeEmail: expenseClaims.employeeEmail,
      })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .orderBy(desc(expenseClaims.createdAt))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const results = await query;
    
    // Get items for each claim
    const claimsWithItems = await Promise.all(
      results.map(async (result) => {
        const items = await this.getExpenseItems(result.id);
        return {
          ...result,
          user: {
            id: result.userId,
            name: result.userFirstName && result.userLastName 
              ? `${result.userFirstName} ${result.userLastName}` 
              : 'Unknown User',
          },
          items,
        };
      })
    );

    return claimsWithItems;
  }

  async getExpenseClaim(id: string): Promise<(ExpenseClaim & { user: User; items: ExpenseItem[] }) | undefined> {
    const [result] = await db
      .select()
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(eq(expenseClaims.id, id));

    if (!result) return undefined;

    const items = await this.getExpenseItems(id);
    return {
      ...result.expense_claims,
      user: result.users!,
      items,
    };
  }

  async updateExpenseClaimStatus(id: string, status: string, approvedBy?: string): Promise<ExpenseClaim> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === "approved" && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    
    if (status === "paid") {
      updateData.paidAt = new Date();
    }

    const [claim] = await db
      .update(expenseClaims)
      .set(updateData)
      .where(eq(expenseClaims.id, id))
      .returning();
    
    return claim;
  }

  // Approval workflow operations
  async createApprovalHistory(approvalData: InsertApprovalHistory): Promise<ApprovalHistory> {
    const [approval] = await db.insert(approvalHistory).values(approvalData).returning();
    return approval;
  }

  async getApprovalHistory(claimId: string): Promise<(ApprovalHistory & { approver: User })[]> {
    const results = await db
      .select()
      .from(approvalHistory)
      .leftJoin(users, eq(approvalHistory.approverId, users.id))
      .where(eq(approvalHistory.claimId, claimId))
      .orderBy(approvalHistory.processedAt);

    return results.map(result => ({
      ...result.approval_history,
      approver: result.users!,
    }));
  }

  async processApprovalWorkflow(
    claimId: string, 
    approverId: string, 
    action: 'approve' | 'reject' | 'return', 
    remarks?: string
  ): Promise<{ claim: ExpenseClaim; nextApprover?: User }> {
    // Get current claim
    const [currentClaim] = await db.select().from(expenseClaims).where(eq(expenseClaims.id, claimId));
    if (!currentClaim) {
      throw new Error('Claim not found');
    }

    // Get approver info
    const approver = await this.getUser(approverId);
    if (!approver) {
      throw new Error('Approver not found');
    }

    // Get claim submitter info for proper company context
    const claimSubmitter = await this.getUser(currentClaim.userId);
    if (!claimSubmitter) {
      throw new Error('Claim submitter not found');
    }

    const previousStatus = currentClaim.status;

    // Helper function to translate workflow level to legacy role for backward compatibility
    const translateWorkflowLevelToRole = (level: number): string => {
      // Default mapping - can be customized based on workflow configuration
      const levelRoleMap: Record<number, string> = {
        1: 'manager',
        2: 'admin', 
        3: 'head',
        4: 'accountant'
      };
      return levelRoleMap[level] || `level_${level}`;
    };

    // TRY WORKFLOW ENGINE FIRST - Check if workflows are configured for expense claims
    const workflowEngine = getWorkflowEngine(this);
    
    try {
      // CRITICAL FIX: Use claim submitter's company ID instead of approver's company ID
      const claimCompanyId = claimSubmitter.companyId || approver.companyId || '';
      const hasWorkflows = await workflowEngine.hasWorkflowForProcess('claim', claimCompanyId);
      
      if (hasWorkflows) {
        // Use the new workflow engine
        console.log('Using workflow engine for expense claim approval');
        
        // Create workflow context using claim submitter's company
        const context: WorkflowContext = {
          processType: 'claim',
          amount: parseFloat(currentClaim.totalAmount),
          submitterId: currentClaim.userId,
          companyId: claimCompanyId,
          // TODO: Add vendor/expense category from claim items if available
        };

        // Handle 'return' action outside workflow engine to maintain semantic consistency
        if (action === 'return') {
          // Return action: send back to previous level or submitter
          // CRITICAL FIX: Ensure currentLevel is always role-based for backward compatibility
          let currentLevel = currentClaim.currentApprovalLevel || 'manager';
          
          // If currentApprovalLevel is numeric (from workflow engine), translate to role
          if (/^\d+$/.test(currentLevel)) {
            currentLevel = translateWorkflowLevelToRole(parseInt(currentLevel));
          }
          
          const newStatus = 'returned';
          const nextLevel = currentLevel; // Stay at current level for re-submission
          
          // Update claim status
          const updatedClaim = await this.updateClaimApprovalStatus(
            claimId, 
            newStatus, 
            nextLevel, 
            currentClaim.userId // Return to submitter
          );

          // Create approval history entry with role-based approverRole
          await this.createApprovalHistory({
            claimId,
            approverId,
            approverRole: currentLevel, // Use role name, not level number
            approverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown',
            action: 'return',
            remarks: remarks || '',
            previousStatus,
            newStatus,
            nextApprovalLevel: nextLevel,
          });

          console.log(`Workflow engine: Returned claim ${claimId} to submitter`);
          return { claim: updatedClaim };
        }

        // Get current workflow instance or initialize new one for approve/reject actions
        let workflowResult: WorkflowResult;
        
        if (!currentClaim.workflowId || !currentClaim.currentApprovalLevel) {
          // Initialize workflow for this claim
          workflowResult = await workflowEngine.initializeWorkflow(context);
          
          if (workflowResult.fallbackToLegacy) {
            throw new Error('Workflow initialization failed, falling back to legacy');
          }
          
          // CRITICAL FIX: Apply role translation during initialization for backward compatibility
          const roleBasedLevel = translateWorkflowLevelToRole(workflowResult.currentLevel);
          
          // Update claim with workflow info using role-based level
          await db.update(expenseClaims)
            .set({
              workflowId: workflowResult.workflowId,
              currentApprovalLevel: roleBasedLevel, // Use role name, not numeric string
              pendingWith: workflowResult.requiredApprovers[0] || null,
              updatedAt: new Date()
            })
            .where(eq(expenseClaims.id, claimId));
            
          // Update the in-memory claim object for consistency
          currentClaim.currentApprovalLevel = roleBasedLevel;
            
        } else {
          // Process approval action (only approve/reject go through workflow engine)
          const approvalAction: ApprovalAction = {
            approverId,
            action: action, // Now only 'approve' or 'reject' reach here
            comments: remarks,
            timestamp: new Date()
          };
          
          // CRITICAL FIX: Handle numeric vs role-based currentApprovalLevel consistently
          let numericLevel: number;
          if (/^\d+$/.test(currentClaim.currentApprovalLevel || '')) {
            // Already numeric from workflow engine
            numericLevel = parseInt(currentClaim.currentApprovalLevel || '1');
          } else {
            // Legacy role-based level, reverse-map to numeric
            const roleToLevelMap: Record<string, number> = {
              'manager': 1,
              'admin': 2,
              'head': 3,
              'accountant': 4
            };
            numericLevel = roleToLevelMap[currentClaim.currentApprovalLevel || 'manager'] || 1;
          }
          
          workflowResult = await workflowEngine.processApproval(
            currentClaim.workflowId!,
            numericLevel,
            approvalAction,
            context
          );
          
          if (workflowResult.fallbackToLegacy) {
            throw new Error('Workflow processing failed, falling back to legacy');
          }
        }

        // Determine new status based on workflow result - maintain backward compatibility
        let newStatus: string;
        let nextLevel: string;
        let nextApprover: User | undefined;

        if (action === 'reject') {
          newStatus = 'rejected';
          nextLevel = 'none';
        } else if (action === 'return') {
          // This should not happen here since return is handled above, but defensive coding
          newStatus = 'returned';
          nextLevel = translateWorkflowLevelToRole(workflowResult.currentLevel);
        } else if (workflowResult.isComplete) {
          newStatus = 'approved';
          nextLevel = 'completed';
        } else {
          // CRITICAL FIX: Maintain backward compatibility with legacy status format
          const roleName = translateWorkflowLevelToRole(workflowResult.currentLevel);
          newStatus = `pending_${roleName}`;
          nextLevel = roleName; // Use role name for backward compatibility
          
          // Get next approver from workflow result
          if (workflowResult.requiredApprovers.length > 0) {
            nextApprover = await this.getUser(workflowResult.requiredApprovers[0]);
          }
        }

        // Update claim status
        const updatedClaim = await this.updateClaimApprovalStatus(
          claimId, 
          newStatus, 
          nextLevel, 
          nextApprover?.id
        );

        // CRITICAL FIX: Create approval history entry with proper role name for backward compatibility
        const currentRoleName = translateWorkflowLevelToRole(workflowResult.currentLevel);
        await this.createApprovalHistory({
          claimId,
          approverId,
          approverRole: currentRoleName, // Use role name, not "Level X" for backward compatibility
          approverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown',
          action,
          remarks: remarks || '',
          previousStatus,
          newStatus,
          nextApprovalLevel: nextLevel !== 'none' && nextLevel !== 'completed' ? nextLevel : undefined,
        });

        console.log(`Workflow engine processed claim ${claimId}: ${newStatus}`);
        return { claim: updatedClaim, nextApprover };
      }
    } catch (error) {
      console.log('Workflow engine failed, falling back to legacy approval logic:', error);
      // Fall through to legacy logic
    }

    // LEGACY APPROVAL LOGIC - Fallback when workflows are not configured
    console.log('Using legacy approval logic for expense claim');
    
    const currentLevel = currentClaim.currentApprovalLevel || 'manager';
    
    // Define legacy workflow logic
    const workflowMap: Record<string, string> = {
      manager: 'admin',
      admin: 'head', 
      head: 'accountant',
      accountant: 'completed'
    };

    let newStatus: string;
    let nextLevel: string;
    let nextApprover: User | undefined;

    if (action === 'reject') {
      newStatus = 'rejected';
      nextLevel = 'none';
    } else if (action === 'return') {
      newStatus = 'returned';
      nextLevel = currentLevel; // Stay at same level
    } else {
      // Approved
      nextLevel = workflowMap[currentLevel] || 'completed';
      
      if (nextLevel === 'completed') {
        newStatus = 'approved';
      } else {
        newStatus = `pending_${nextLevel}`;
        nextApprover = await this.getNextApprover(nextLevel);
      }
    }

    // Update claim status
    const updatedClaim = await this.updateClaimApprovalStatus(
      claimId, 
      newStatus, 
      nextLevel, 
      nextApprover?.id
    );

    // Create approval history entry
    await this.createApprovalHistory({
      claimId,
      approverId,
      approverRole: currentLevel,
      approverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown',
      action,
      remarks: remarks || '',
      previousStatus,
      newStatus,
      nextApprovalLevel: nextLevel !== 'none' ? nextLevel : undefined,
    });

    return { claim: updatedClaim, nextApprover };
  }

  async getNextApprover(role: string): Promise<User | undefined> {
    // For now, get any user with the required role
    // In production, this would have more sophisticated logic
    const roleMapping = {
      'manager': 'admin,manager,accountant,head',
      'admin': 'admin,manager,accountant,head', 
      'head': 'admin,manager,accountant,head',
      'accountant': 'admin,manager,accountant,head'
    };

    const allowedRoles = roleMapping[role as keyof typeof roleMapping];
    if (!allowedRoles) return undefined;

    const [user] = await db
      .select()
      .from(users)
      .where(like(users.role, `%${role}%`))
      .limit(1);

    return user;
  }

  async updateClaimApprovalStatus(
    claimId: string, 
    newStatus: string, 
    currentLevel: string, 
    pendingWith?: string
  ): Promise<ExpenseClaim> {
    const updateData: any = {
      status: newStatus,
      currentApprovalLevel: currentLevel,
      updatedAt: new Date(),
    };

    if (pendingWith) {
      updateData.pendingWith = pendingWith;
    }

    if (newStatus === 'approved') {
      updateData.approvedAt = new Date();
    }

    const [claim] = await db
      .update(expenseClaims)
      .set(updateData)
      .where(eq(expenseClaims.id, claimId))
      .returning();

    return claim;
  }

  // Payment processing operations
  async getApprovedClaims(): Promise<(ExpenseClaim & { user: User; items: ExpenseItem[] })[]> {
    const query = db
      .select()
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(eq(expenseClaims.status, 'approved'))
      .orderBy(desc(expenseClaims.approvedAt));

    const results = await query;
    
    // Get items for each claim
    const claims = await Promise.all(results.map(async (result) => {
      const items = await this.getExpenseItems(result.expense_claims.id);
      return {
        ...result.expense_claims,
        user: result.users!,
        items,
      };
    }));

    return claims;
  }

  async processPayment(
    claimId: string, 
    utrNumber: string, 
    paymentDate: Date, 
    processedBy: string
  ): Promise<ExpenseClaim> {
    const [claim] = await db
      .update(expenseClaims)
      .set({
        status: 'paid',
        utrNumber,
        paymentDate,
        processedBy,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, claimId))
      .returning();

    // Create approval history entry for payment processing
    await this.createApprovalHistory({
      claimId,
      approverId: processedBy,
      approverRole: 'accountant',
      approverName: 'Payment Processor',
      action: 'approve',
      remarks: `Payment processed with UTR: ${utrNumber}`,
      previousStatus: 'approved',
      newStatus: 'paid',
    });

    return claim;
  }

  async getProcessedPayments(filters?: { 
    startDate?: Date; 
    endDate?: Date 
  }): Promise<(ExpenseClaim & { user: User; processedByUser: User })[]> {
    const conditions = [eq(expenseClaims.status, 'paid')];
    
    if (filters?.startDate) {
      conditions.push(gte(expenseClaims.processedAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenseClaims.processedAt, filters.endDate));
    }

    const userTable = users;
    const processedByTable = users;

    const query = db
      .select({
        claim: expenseClaims,
        user: userTable,
        processedByUser: processedByTable,
      })
      .from(expenseClaims)
      .leftJoin(userTable, eq(expenseClaims.userId, userTable.id))
      .leftJoin(processedByTable, eq(expenseClaims.processedBy, processedByTable.id))
      .where(and(...conditions))
      .orderBy(desc(expenseClaims.processedAt));

    const results = await query;
    return results.map(result => ({
      ...result.claim,
      user: result.user!,
      processedByUser: result.processedByUser!,
    }));
  }

  // Expense item operations
  async createExpenseItem(itemData: InsertExpenseItem): Promise<ExpenseItem> {
    const [item] = await db.insert(expenseItems).values(itemData).returning();
    return item;
  }

  async getExpenseItems(claimId: string): Promise<ExpenseItem[]> {
    return await db.select().from(expenseItems).where(eq(expenseItems.claimId, claimId));
  }

  // Direct expense operations
  async createDirectExpense(expenseData: InsertDirectExpense): Promise<DirectExpense> {
    const [expense] = await db.insert(directExpenses).values(expenseData).returning();
    return expense;
  }

  async getDirectExpenses(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(DirectExpense & { creator: User; category?: ExpenseCategory })[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(directExpenses.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(directExpenses.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(directExpenses.date, filters.endDate));
    }

    const query = db
      .select()
      .from(directExpenses)
      .leftJoin(users, eq(directExpenses.createdBy, users.id))
      .leftJoin(expenseCategories, eq(directExpenses.categoryId, expenseCategories.id))
      .orderBy(desc(directExpenses.createdAt))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const results = await query;
    return results.map(result => ({
      ...result.direct_expenses,
      creator: result.users!,
      category: result.expense_categories || undefined,
    }));
  }

  // Expense request operations
  async createExpenseRequest(requestData: InsertExpenseRequest): Promise<ExpenseRequest> {
    const [request] = await db.insert(expenseRequests).values(requestData).returning();
    return request;
  }

  async getExpenseRequests(filters?: {
    userId?: string;
    status?: string;
    type?: string;
  }): Promise<(ExpenseRequest & { user: User })[]> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(expenseRequests.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(expenseRequests.status, filters.status));
    }
    if (filters?.type) {
      conditions.push(eq(expenseRequests.type, filters.type));
    }

    const query = db
      .select()
      .from(expenseRequests)
      .leftJoin(users, eq(expenseRequests.userId, users.id))
      .orderBy(desc(expenseRequests.createdAt))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const results = await query;
    return results.map(result => ({
      ...result.expense_requests,
      user: result.users!,
    }));
  }

  async updateExpenseRequestStatus(id: string, status: string, approvedBy?: string): Promise<ExpenseRequest> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === "approved" && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }

    const [request] = await db
      .update(expenseRequests)
      .set(updateData)
      .where(eq(expenseRequests.id, id))
      .returning();
    
    return request;
  }

  // Receipt operations
  async createReceipt(receiptData: InsertReceipt): Promise<Receipt> {
    const [receipt] = await db.insert(receipts).values(receiptData).returning();
    return receipt;
  }

  async getReceipts(userId?: string): Promise<Receipt[]> {
    const query = db.select().from(receipts).orderBy(desc(receipts.createdAt));
    
    if (userId) {
      return await query.where(eq(receipts.userId, userId));
    }
    
    return await query;
  }

  async attachReceipt(receiptId: string, attachedToId: string, attachedToType: string): Promise<Receipt> {
    const [receipt] = await db
      .update(receipts)
      .set({
        isAttached: true,
        attachedToId,
        attachedToType,
      })
      .where(eq(receipts.id, receiptId))
      .returning();
    
    return receipt;
  }

  // Advance payment operations
  async createAdvancePayment(advanceData: InsertAdvancePayment): Promise<AdvancePayment> {
    const [advance] = await db.insert(advancePayments).values(advanceData).returning();
    return advance;
  }

  async getAdvancePayments(filters?: {
    userId?: string;
    isSettled?: boolean;
  }): Promise<(AdvancePayment & { request: ExpenseRequest; user: User })[]> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(advancePayments.userId, filters.userId));
    }
    if (filters?.isSettled !== undefined) {
      conditions.push(eq(advancePayments.isSettled, filters.isSettled));
    }

    const query = db
      .select()
      .from(advancePayments)
      .leftJoin(expenseRequests, eq(advancePayments.requestId, expenseRequests.id))
      .leftJoin(users, eq(advancePayments.userId, users.id))
      .orderBy(desc(advancePayments.createdAt))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const results = await query;
    return results.map(result => ({
      ...result.advance_payments,
      request: result.expense_requests!,
      user: result.users!,
    }));
  }

  async markAdvanceAsSettled(advanceId: string): Promise<AdvancePayment> {
    const [advance] = await db
      .update(advancePayments)
      .set({ isSettled: true })
      .where(eq(advancePayments.id, advanceId))
      .returning();
    return advance;
  }

  async getApprovedAdvancesByUser(userId: string): Promise<(AdvancePayment & { request: ExpenseRequest })[]> {
    const results = await db
      .select()
      .from(advancePayments)
      .leftJoin(expenseRequests, eq(advancePayments.requestId, expenseRequests.id))
      .where(
        and(
          eq(advancePayments.userId, userId),
          eq(advancePayments.isSettled, false),
          eq(advancePayments.paymentStatus, 'paid')
        )
      )
      .orderBy(desc(advancePayments.createdAt));

    return results.map(result => ({
      ...result.advance_payments,
      request: result.expense_requests!,
    }));
  }

  async processAdvancePayment(requestId: string, approvedAmount: number): Promise<AdvancePayment> {
    // Get the request to get user ID
    const [request] = await db.select().from(expenseRequests).where(eq(expenseRequests.id, requestId));
    if (!request) {
      throw new Error('Expense request not found');
    }

    // Create advance payment record
    const [advance] = await db
      .insert(advancePayments)
      .values({
        requestId,
        userId: request.userId,
        approvedAmount: approvedAmount.toString(),
        paymentStatus: 'paid', // Simulate immediate payment
        paymentDate: new Date(),
      })
      .returning();

    // Update request status to paid
    await db
      .update(expenseRequests)
      .set({
        status: 'paid',
        paidAt: new Date(),
      })
      .where(eq(expenseRequests.id, requestId));

    return advance;
  }

  // Dashboard operations
  async getDashboardMetrics(userId?: string): Promise<{
    totalExpenses: number;
    pendingApproval: number;
    settled: number;
    openAdvances: number;
  }> {
    const conditions = userId ? [eq(expenseClaims.userId, userId)] : [];
    
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenseClaims)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Count pending expense claims - include explicit statuses + any status containing "pending" + submitted
    const pendingStatuses = ['pending', 'submitted', 'pending_admin', 'pending_manager', 'pending admin', 'pending manager'];
    const [pendingClaimsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenseClaims)
      .where(and(
        or(
          inArray(expenseClaims.status, pendingStatuses),
          sql`LOWER(${expenseClaims.status}) LIKE '%pending%'`,
          sql`LOWER(${expenseClaims.status}) = 'submitted'`
        ),
        ...(conditions.length > 0 ? conditions : [])
      ));

    // Count pending expense requests - include explicit statuses + any status containing "pending" + submitted
    const [pendingRequestsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenseRequests)
      .where(and(
        or(
          inArray(expenseRequests.status, pendingStatuses),
          sql`LOWER(${expenseRequests.status}) LIKE '%pending%'`,
          sql`LOWER(${expenseRequests.status}) = 'submitted'`
        ),
        ...(userId ? [eq(expenseRequests.userId, userId)] : [])
      ));

    const [settledResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenseClaims)
      .where(and(
        eq(expenseClaims.status, "paid"),
        ...(conditions.length > 0 ? conditions : [])
      ));

    const [advancesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenseRequests)
      .where(and(
        eq(expenseRequests.type, "cash_advance"),
        eq(expenseRequests.status, "approved"),
        ...(userId ? [eq(expenseRequests.userId, userId)] : [])
      ));

    return {
      totalExpenses: Number(totalResult?.count || 0),
      pendingApproval: Number(pendingClaimsResult?.count || 0) + Number(pendingRequestsResult?.count || 0),
      settled: Number(settledResult?.count || 0),
      openAdvances: Number(advancesResult?.count || 0),
    };
  }

  // ========== COMPREHENSIVE USER REPORTS ==========
  
  async getUserReports(userId?: string): Promise<{
    pendingApproval: {
      requests: { count: number; value: number };
      advances: { count: number; value: number };
      claims: { count: number; value: number };
      bills: { count: number; value: number };
    };
    approved: {
      requests: { count: number; value: number };
      advances: { count: number; value: number };
      claims: { count: number; value: number };
      bills: { count: number; value: number };
    };
    pendingPayments: {
      requests: { count: number; value: number };
      advances: { count: number; value: number };
      claims: { count: number; value: number };
      bills: { count: number; value: number };
    };
    paid: {
      requests: { count: number; value: number };
      advances: { count: number; value: number };
      claims: { count: number; value: number };
      bills: { count: number; value: number };
    };
    watchList: {
      myOpenAdvances: { count: number; value: number };
      advancesOverDue: { count: number; value: number };
      claimsWithPolicyExceptions: { count: number; value: number };
      claimsWithoutSupportings: { count: number; value: number };
      myRejectedApplications: { count: number; value: number };
    };
    expenseAnalysis: {
      myCardStatements: { count: number; value: number };
      myExpenseBreakup: { categories: Array<{ category: string; value: number }> };
      myMajorExpenses: { count: number; value: number };
      myCostDimension: { departments: Array<{ department: string; value: number }> };
    };
  }> {
    const userCondition = userId ? eq(expenseRequests.userId, userId) : undefined;
    const claimUserCondition = userId ? eq(expenseClaims.userId, userId) : undefined;
    const billUserCondition = userId ? eq(directExpenses.createdBy, userId) : undefined;

    // Pending Approval Reports
    const [pendingRequests] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(estimated_amount as decimal)), 0)`
      })
      .from(expenseRequests)
      .where(and(
        eq(expenseRequests.status, "pending"),
        userCondition
      ));

    const [pendingAdvances] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(approved_amount as decimal)), 0)`
      })
      .from(advancePayments)
      .leftJoin(expenseRequests, eq(advancePayments.requestId, expenseRequests.id))
      .where(and(
        eq(expenseRequests.status, "pending"),
        eq(expenseRequests.type, "cash_advance"),
        userCondition
      ));

    const [pendingClaims] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`
      })
      .from(expenseClaims)
      .where(and(
        eq(expenseClaims.status, "pending"),
        claimUserCondition
      ));

    const [pendingBills] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(amount as decimal)), 0)`
      })
      .from(directExpenses)
      .where(and(
        eq(directExpenses.status, "pending"),
        billUserCondition
      ));

    // Approved Reports
    const [approvedRequests] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(estimated_amount as decimal)), 0)`
      })
      .from(expenseRequests)
      .where(and(
        eq(expenseRequests.status, "approved"),
        userCondition
      ));

    const [approvedAdvances] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(approved_amount as decimal)), 0)`
      })
      .from(advancePayments)
      .leftJoin(expenseRequests, eq(advancePayments.requestId, expenseRequests.id))
      .where(and(
        eq(expenseRequests.status, "approved"),
        eq(expenseRequests.type, "cash_advance"),
        userCondition
      ));

    const [approvedClaims] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`
      })
      .from(expenseClaims)
      .where(and(
        eq(expenseClaims.status, "approved"),
        claimUserCondition
      ));

    const [approvedBills] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(amount as decimal)), 0)`
      })
      .from(directExpenses)
      .where(and(
        eq(directExpenses.status, "approved"),
        billUserCondition
      ));

    // Pending Payments (approved but not paid)
    const [pendingPaymentClaims] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`
      })
      .from(expenseClaims)
      .where(and(
        eq(expenseClaims.status, "approved"),
        claimUserCondition
      ));

    const [pendingPaymentBills] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(amount as decimal)), 0)`
      })
      .from(directExpenses)
      .where(and(
        eq(directExpenses.status, "approved"),
        billUserCondition
      ));

    // Paid Reports
    const [paidClaims] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`
      })
      .from(expenseClaims)
      .where(and(
        eq(expenseClaims.status, "paid"),
        claimUserCondition
      ));

    const [paidBills] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(amount as decimal)), 0)`
      })
      .from(directExpenses)
      .where(and(
        eq(directExpenses.status, "paid"),
        billUserCondition
      ));

    // Watch List Reports
    const [openAdvances] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(approved_amount as decimal)), 0)`
      })
      .from(advancePayments)
      .leftJoin(expenseRequests, eq(advancePayments.requestId, expenseRequests.id))
      .where(and(
        eq(advancePayments.isSettled, false),
        userCondition
      ));

    const [rejectedApplications] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(estimated_amount as decimal)), 0)`
      })
      .from(expenseRequests)
      .where(and(
        eq(expenseRequests.status, "rejected"),
        userCondition
      ));

    // Expense Analysis
    const [cardStatementsData] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(total_spent as decimal)), 0)`
      })
      .from(cardStatements);

    // Expense breakdown by category
    const expenseBreakup = await db
      .select({
        category: expenseCategories.name,
        totalAmount: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`
      })
      .from(expenseClaims)
      .leftJoin(expenseItems, eq(expenseClaims.id, expenseItems.claimId))
      .leftJoin(expenseCategories, eq(expenseItems.categoryId, expenseCategories.id))
      .where(claimUserCondition)
      .groupBy(expenseCategories.name);

    // Major expenses (top expenses over certain threshold)
    const [majorExpenses] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`
      })
      .from(expenseClaims)
      .where(and(
        sql`cast(total_amount as decimal) > 10000`,
        claimUserCondition
      ));

    return {
      pendingApproval: {
        requests: { count: Number(pendingRequests?.count || 0), value: Number(pendingRequests?.totalAmount || 0) },
        advances: { count: Number(pendingAdvances?.count || 0), value: Number(pendingAdvances?.totalAmount || 0) },
        claims: { count: Number(pendingClaims?.count || 0), value: Number(pendingClaims?.totalAmount || 0) },
        bills: { count: Number(pendingBills?.count || 0), value: Number(pendingBills?.totalAmount || 0) },
      },
      approved: {
        requests: { count: Number(approvedRequests?.count || 0), value: Number(approvedRequests?.totalAmount || 0) },
        advances: { count: Number(approvedAdvances?.count || 0), value: Number(approvedAdvances?.totalAmount || 0) },
        claims: { count: Number(approvedClaims?.count || 0), value: Number(approvedClaims?.totalAmount || 0) },
        bills: { count: Number(approvedBills?.count || 0), value: Number(approvedBills?.totalAmount || 0) },
      },
      pendingPayments: {
        requests: { count: 0, value: 0 }, // Requests don't have pending payments
        advances: { count: 0, value: 0 }, // Advances are either settled or not
        claims: { count: Number(pendingPaymentClaims?.count || 0), value: Number(pendingPaymentClaims?.totalAmount || 0) },
        bills: { count: Number(pendingPaymentBills?.count || 0), value: Number(pendingPaymentBills?.totalAmount || 0) },
      },
      paid: {
        requests: { count: 0, value: 0 }, // Requests don't get paid directly
        advances: { count: 0, value: 0 }, // Advances are settled, not paid
        claims: { count: Number(paidClaims?.count || 0), value: Number(paidClaims?.totalAmount || 0) },
        bills: { count: Number(paidBills?.count || 0), value: Number(paidBills?.totalAmount || 0) },
      },
      watchList: {
        myOpenAdvances: { count: Number(openAdvances?.count || 0), value: Number(openAdvances?.totalAmount || 0) },
        advancesOverDue: { count: 0, value: 0 }, // Would need due date logic
        claimsWithPolicyExceptions: { count: 0, value: 0 }, // Would need policy validation logic
        claimsWithoutSupportings: { count: 0, value: 0 }, // Would need receipt validation logic
        myRejectedApplications: { count: Number(rejectedApplications?.count || 0), value: Number(rejectedApplications?.totalAmount || 0) },
      },
      expenseAnalysis: {
        myCardStatements: { count: Number(cardStatementsData?.count || 0), value: Number(cardStatementsData?.totalAmount || 0) },
        myExpenseBreakup: {
          categories: expenseBreakup.map(item => ({
            category: item.category || 'Uncategorized',
            value: Number(item.totalAmount || 0)
          }))
        },
        myMajorExpenses: { count: Number(majorExpenses?.count || 0), value: Number(majorExpenses?.totalAmount || 0) },
        myCostDimension: { departments: [] }, // Would need department logic
      },
    };
  }

  // ========== PAYMENT MODULE IMPLEMENTATIONS ==========

  // Payment Batch operations
  async getPaymentBatches(): Promise<PaymentBatch[]> {
    return await db.select().from(paymentBatches).orderBy(desc(paymentBatches.createdAt));
  }

  async getPaymentBatch(id: string): Promise<PaymentBatch | undefined> {
    const [batch] = await db.select().from(paymentBatches).where(eq(paymentBatches.id, id));
    return batch;
  }

  async createPaymentBatch(batch: InsertPaymentBatch): Promise<PaymentBatch> {
    // Generate batch number
    const batchNumber = `PB${Date.now()}`;
    
    const [newBatch] = await db
      .insert(paymentBatches)
      .values({
        ...batch,
        batchNumber,
      })
      .returning();
    return newBatch;
  }

  async updatePaymentBatch(id: string, updates: Partial<PaymentBatch>): Promise<PaymentBatch | undefined> {
    const [updated] = await db
      .update(paymentBatches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentBatches.id, id))
      .returning();
    return updated;
  }

  async deletePaymentBatch(id: string): Promise<void> {
    await db.delete(paymentBatches).where(eq(paymentBatches.id, id));
  }

  async releaseBills(batchId: string, releasedBy: string): Promise<PaymentBatch | undefined> {
    const [released] = await db
      .update(paymentBatches)
      .set({
        status: "released",
        releasedBy,
        releasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentBatches.id, batchId))
      .returning();
    return released;
  }

  // Payment batch approval workflow methods
  async getPaymentBatchesForApproval(userRole: string): Promise<PaymentBatch[]> {
    // Get payment batches pending approval for this user's role
    const statusFilters = {
      'manager': ['initiated', 'pending_manager'],
      'admin': ['pending_admin', 'initiated', 'pending_manager'], // Admin can see all
      'head': ['pending_head', 'initiated', 'pending_manager', 'pending_admin'], // Head can see all 
      'accountant': ['pending_accountant', 'initiated', 'pending_manager', 'pending_admin', 'pending_head'] // Accountant can see all
    };

    // Handle multiple roles (comma-separated)
    const userRoles = userRole.split(',').map(role => role.trim());
    const allAllowedStatuses = new Set<string>();
    
    // Collect all allowed statuses for user's roles
    for (const role of userRoles) {
      const roleStatuses = statusFilters[role as keyof typeof statusFilters];
      if (roleStatuses) {
        roleStatuses.forEach(status => allAllowedStatuses.add(status));
      }
    }

    if (allAllowedStatuses.size === 0) return [];

    const statusArray = Array.from(allAllowedStatuses);
    
    // Use Drizzle's inArray for proper SQL generation
    return await db
      .select()
      .from(paymentBatches)
      .where(inArray(paymentBatches.status, statusArray))
      .orderBy(desc(paymentBatches.createdAt));
  }

  async processPaymentBatchApproval(
    batchId: string, 
    approverId: string, 
    action: 'approve' | 'reject' | 'return', 
    remarks?: string
  ): Promise<{ batch: PaymentBatch; nextApprover?: User }> {
    // Get current payment batch
    const batch = await this.getPaymentBatch(batchId);
    if (!batch) {
      throw new Error('Payment batch not found');
    }

    const approver = await this.getUser(approverId);
    if (!approver) {
      throw new Error('Approver not found');
    }

    // Get batch creator info for proper company context
    const batchCreator = await this.getUser(batch.createdBy);
    if (!batchCreator) {
      throw new Error('Payment batch creator not found');
    }

    const previousStatus = batch.status;

    // Helper function to translate workflow level to legacy role for backward compatibility
    const translateWorkflowLevelToRole = (level: number): string => {
      // Default mapping - can be customized based on workflow configuration
      const levelRoleMap: Record<number, string> = {
        1: 'manager',
        2: 'admin', 
        3: 'head',
        4: 'accountant'
      };
      return levelRoleMap[level] || `level_${level}`;
    };

    // TRY WORKFLOW ENGINE FIRST - Check if workflows are configured for payment batches
    const workflowEngine = getWorkflowEngine(this);
    
    try {
      // CRITICAL FIX: Use batch creator's company ID instead of approver's company ID
      const batchCompanyId = batchCreator.companyId || approver.companyId || '';
      const hasWorkflows = await workflowEngine.hasWorkflowForProcess('payment', batchCompanyId);
      
      if (hasWorkflows) {
        // Use the new workflow engine
        console.log('Using workflow engine for payment batch approval');
        
        // Create workflow context using batch creator's company
        const context: WorkflowContext = {
          processType: 'payment',
          amount: parseFloat(batch.totalAmount),
          submitterId: batch.createdBy,
          companyId: batchCompanyId,
          // TODO: Add vendor/expense category from batch items if available
        };

        // Handle 'return' action outside workflow engine to maintain semantic consistency
        if (action === 'return') {
          // Return action: send back to previous level or submitter
          // CRITICAL FIX: Ensure currentLevel is always role-based for backward compatibility
          let currentLevel = batch.currentApprovalLevel || 'manager';
          
          // If currentApprovalLevel is numeric (from workflow engine), translate to role
          if (/^\d+$/.test(currentLevel)) {
            currentLevel = translateWorkflowLevelToRole(parseInt(currentLevel));
          }
          
          const newStatus = 'initiated';
          const nextLevel = 'manager'; // Payment batches reset to manager level on return
          
          // Update batch status
          const updatedBatch = await this.updatePaymentBatchApprovalStatus(
            batchId, 
            newStatus, 
            nextLevel, 
            batchCreator.id // Return to batch creator/manager
          );

          // Create approval history entry with role-based approverRole
          await this.createApprovalHistory({
            paymentBatchId: batchId,
            approverId,
            approverRole: currentLevel, // Use role name, not level number
            approverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown',
            action: 'return',
            remarks: remarks || '',
            previousStatus,
            newStatus,
            nextApprovalLevel: nextLevel,
          });

          console.log(`Workflow engine: Returned payment batch ${batchId} to manager`);
          return { batch: updatedBatch };
        }

        // Get current workflow instance or initialize new one for approve/reject actions
        let workflowResult: WorkflowResult;
        
        if (!batch.workflowId || !batch.currentApprovalLevel) {
          // Initialize workflow for this payment batch
          workflowResult = await workflowEngine.initializeWorkflow(context);
          
          if (workflowResult.fallbackToLegacy) {
            throw new Error('Workflow initialization failed, falling back to legacy');
          }
          
          // CRITICAL FIX: Apply role translation during initialization for backward compatibility
          const roleBasedLevel = translateWorkflowLevelToRole(workflowResult.currentLevel);
          
          // Update batch with workflow info using role-based level
          await db.update(paymentBatches)
            .set({
              workflowId: workflowResult.workflowId,
              currentApprovalLevel: roleBasedLevel, // Use role name, not numeric string
              pendingWith: workflowResult.requiredApprovers[0] || null,
              updatedAt: new Date()
            })
            .where(eq(paymentBatches.id, batchId));
            
          // Update the in-memory batch object for consistency
          batch.currentApprovalLevel = roleBasedLevel;
            
        } else {
          // Process approval action (only approve/reject go through workflow engine)
          const approvalAction: ApprovalAction = {
            approverId,
            action: action, // Now only 'approve' or 'reject' reach here
            comments: remarks,
            timestamp: new Date()
          };
          
          // CRITICAL FIX: Handle numeric vs role-based currentApprovalLevel consistently
          let numericLevel: number;
          if (/^\d+$/.test(batch.currentApprovalLevel || '')) {
            // Already numeric from workflow engine
            numericLevel = parseInt(batch.currentApprovalLevel || '1');
          } else {
            // Legacy role-based level, reverse-map to numeric
            const roleToLevelMap: Record<string, number> = {
              'manager': 1,
              'admin': 2,
              'head': 3,
              'accountant': 4
            };
            numericLevel = roleToLevelMap[batch.currentApprovalLevel || 'manager'] || 1;
          }
          
          workflowResult = await workflowEngine.processApproval(
            batch.workflowId!,
            numericLevel,
            approvalAction,
            context
          );
          
          if (workflowResult.fallbackToLegacy) {
            throw new Error('Workflow processing failed, falling back to legacy');
          }
        }

        // Determine new status based on workflow result - maintain backward compatibility
        let newStatus: string;
        let nextLevel: string;
        let nextApprover: User | undefined;

        if (action === 'reject') {
          newStatus = 'rejected';
          nextLevel = 'none';
        } else if (action === 'return') {
          // This should not happen here since return is handled above, but defensive coding
          newStatus = 'initiated';
          nextLevel = 'manager';
        } else if (workflowResult.isComplete) {
          newStatus = 'approved';
          nextLevel = 'completed';
        } else {
          // CRITICAL FIX: Maintain backward compatibility with legacy status format
          const roleName = translateWorkflowLevelToRole(workflowResult.currentLevel);
          newStatus = `pending_${roleName}`;
          nextLevel = roleName; // Use role name for backward compatibility
          
          // Get next approver from workflow result
          if (workflowResult.requiredApprovers.length > 0) {
            nextApprover = await this.getUser(workflowResult.requiredApprovers[0]);
          }
        }

        // Update batch status
        const updatedBatch = await this.updatePaymentBatchApprovalStatus(
          batchId, 
          newStatus, 
          nextLevel === 'completed' || nextLevel === 'none' ? batch.currentApprovalLevel || 'manager' : nextLevel,
          nextApprover?.id
        );

        // CRITICAL FIX: Create approval history entry with proper role name for backward compatibility
        const currentRoleName = translateWorkflowLevelToRole(workflowResult.currentLevel);
        await this.createApprovalHistory({
          paymentBatchId: batchId,
          approverId,
          approverRole: currentRoleName, // Use role name, not "Level X" for backward compatibility
          approverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown',
          action,
          remarks: remarks || '',
          previousStatus,
          newStatus,
          nextApprovalLevel: nextLevel !== 'none' && nextLevel !== 'completed' ? nextLevel : undefined,
        });

        console.log(`Workflow engine processed payment batch ${batchId}: ${newStatus}`);
        return { batch: updatedBatch, nextApprover };
      }
    } catch (error) {
      console.log('Workflow engine failed, falling back to legacy payment batch approval logic:', error);
      // Fall through to legacy logic
    }

    // LEGACY APPROVAL LOGIC - Fallback when workflows are not configured
    console.log('Using legacy approval logic for payment batch');
    
    const currentLevel = batch.currentApprovalLevel || 'manager';
    
    // Define legacy workflow logic for payment batches
    const workflowMap: Record<string, string> = {
      manager: 'admin',
      admin: 'head', 
      head: 'accountant',
      accountant: 'completed'
    };

    let newStatus: string;
    let nextLevel: string;
    let nextApprover: User | undefined;

    if (action === 'reject') {
      newStatus = 'rejected';
      nextLevel = 'none';
    } else if (action === 'return') {
      newStatus = 'initiated';
      nextLevel = 'manager'; // Payment batches reset to manager level on return
    } else {
      // Approved
      nextLevel = workflowMap[currentLevel] || 'completed';
      
      if (nextLevel === 'completed') {
        newStatus = 'approved';
      } else {
        newStatus = `pending_${nextLevel}`;
        nextApprover = await this.getNextApprover(nextLevel);
      }
    }

    // Update batch status
    const updatedBatch = await this.updatePaymentBatchApprovalStatus(
      batchId, 
      newStatus, 
      nextLevel === 'completed' || nextLevel === 'none' ? currentLevel : nextLevel,
      nextApprover?.id
    );

    // Create approval history entry
    await this.createApprovalHistory({
      paymentBatchId: batchId,
      approverId,
      approverRole: currentLevel,
      approverName: `${approver.firstName || ''} ${approver.lastName || ''}`.trim() || approver.email || 'Unknown',
      action,
      remarks: remarks || '',
      previousStatus,
      newStatus,
      nextApprovalLevel: nextLevel !== 'none' && nextLevel !== 'completed' ? nextLevel : undefined,
    });

    return { batch: updatedBatch, nextApprover };
  }

  async getPaymentBatchApprovalHistory(batchId: string): Promise<(ApprovalHistory & { approver: User })[]> {
    const query = db
      .select()
      .from(approvalHistory)
      .leftJoin(users, eq(approvalHistory.approverId, users.id))
      .where(eq(approvalHistory.paymentBatchId, batchId))
      .orderBy(desc(approvalHistory.processedAt));

    const results = await query;
    return results.map(result => ({
      ...result.approval_history,
      approver: result.users!,
    }));
  }

  async getApprovedPaymentBatches(): Promise<PaymentBatch[]> {
    return await db
      .select()
      .from(paymentBatches)
      .where(eq(paymentBatches.status, 'approved'))
      .orderBy(desc(paymentBatches.approvedAt));
  }

  async updatePaymentBatchApprovalStatus(
    batchId: string, 
    newStatus: string, 
    currentLevel: string, 
    pendingWith?: string
  ): Promise<PaymentBatch> {
    const updateData: any = {
      status: newStatus,
      currentApprovalLevel: currentLevel,
      updatedAt: new Date(),
    };

    if (pendingWith) {
      updateData.pendingWith = pendingWith;
    }

    if (newStatus === 'approved') {
      updateData.approvedAt = new Date();
    }

    const [batch] = await db
      .update(paymentBatches)
      .set(updateData)
      .where(eq(paymentBatches.id, batchId))
      .returning();

    return batch;
  }

  // Payment Batch Items operations
  async getPaymentBatchItems(batchId: string): Promise<PaymentBatchItem[]> {
    return await db
      .select()
      .from(paymentBatchItems)
      .where(eq(paymentBatchItems.batchId, batchId))
      .orderBy(paymentBatchItems.createdAt);
  }

  async createPaymentBatchItem(item: InsertPaymentBatchItem): Promise<PaymentBatchItem> {
    const [newItem] = await db
      .insert(paymentBatchItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Card Statement operations
  async getCardStatements(): Promise<CardStatement[]> {
    return await db.select().from(cardStatements).orderBy(desc(cardStatements.createdAt));
  }

  async getCardStatement(id: string): Promise<CardStatement | undefined> {
    const [statement] = await db.select().from(cardStatements).where(eq(cardStatements.id, id));
    return statement;
  }

  async createCardStatement(statement: InsertCardStatement): Promise<CardStatement> {
    const [newStatement] = await db
      .insert(cardStatements)
      .values(statement)
      .returning();
    return newStatement;
  }

  async updateCardStatement(id: string, updates: Partial<CardStatement>): Promise<CardStatement | undefined> {
    const [updated] = await db
      .update(cardStatements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cardStatements.id, id))
      .returning();
    return updated;
  }

  async deleteCardStatement(id: string): Promise<void> {
    await db.delete(cardStatements).where(eq(cardStatements.id, id));
  }

  // Card Transaction operations
  async getCardTransactions(statementId: string): Promise<CardTransaction[]> {
    return await db
      .select()
      .from(cardTransactions)
      .where(eq(cardTransactions.statementId, statementId))
      .orderBy(cardTransactions.transactionDate);
  }

  async createCardTransaction(transaction: InsertCardTransaction): Promise<CardTransaction> {
    const [newTransaction] = await db
      .insert(cardTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateCardTransaction(id: string, updates: Partial<CardTransaction>): Promise<CardTransaction | undefined> {
    const [updated] = await db
      .update(cardTransactions)
      .set(updates)
      .where(eq(cardTransactions.id, id))
      .returning();
    return updated;
  }

  // Card Payment operations
  async getCardPayments(): Promise<CardPayment[]> {
    return await db.select().from(cardPayments).orderBy(desc(cardPayments.createdAt));
  }

  async getCardPaymentsByStatement(statementId: string): Promise<CardPayment[]> {
    return await db
      .select()
      .from(cardPayments)
      .where(eq(cardPayments.statementId, statementId))
      .orderBy(cardPayments.paymentDate);
  }

  async createCardPayment(payment: InsertCardPayment): Promise<CardPayment> {
    const [newPayment] = await db
      .insert(cardPayments)
      .values(payment)
      .returning();

    // Update card statement status to paid
    await db
      .update(cardStatements)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(cardStatements.id, payment.statementId));

    return newPayment;
  }

  async updateCardPayment(id: string, updates: Partial<CardPayment>): Promise<CardPayment | undefined> {
    const [updated] = await db
      .update(cardPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cardPayments.id, id))
      .returning();
    return updated;
  }

  async deleteCardPayment(id: string): Promise<void> {
    await db.delete(cardPayments).where(eq(cardPayments.id, id));
  }

  // Bank Advice operations
  async getBankAdvice(type?: string): Promise<BankAdvice[]> {
    const conditions = type ? [eq(bankAdvice.adviceType, type)] : [];
    return await db
      .select()
      .from(bankAdvice)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bankAdvice.createdAt));
  }

  async getBankAdviceById(id: string): Promise<BankAdvice | undefined> {
    const [advice] = await db.select().from(bankAdvice).where(eq(bankAdvice.id, id));
    return advice;
  }

  async createBankAdvice(advice: InsertBankAdvice): Promise<BankAdvice> {
    // Generate advice number
    const adviceNumber = `BA${Date.now()}`;
    
    const [newAdvice] = await db
      .insert(bankAdvice)
      .values({
        ...advice,
        adviceNumber,
      })
      .returning();
    return newAdvice;
  }

  async updateBankAdvice(id: string, updates: Partial<BankAdvice>): Promise<BankAdvice | undefined> {
    const [updated] = await db
      .update(bankAdvice)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bankAdvice.id, id))
      .returning();
    return updated;
  }

  async deleteBankAdvice(id: string): Promise<void> {
    await db.delete(bankAdvice).where(eq(bankAdvice.id, id));
  }

  // Bank Advice Items operations
  async getBankAdviceItems(adviceId: string): Promise<BankAdviceItem[]> {
    return await db
      .select()
      .from(bankAdviceItems)
      .where(eq(bankAdviceItems.adviceId, adviceId))
      .orderBy(bankAdviceItems.createdAt);
  }

  async createBankAdviceItem(item: InsertBankAdviceItem): Promise<BankAdviceItem> {
    const [newItem] = await db
      .insert(bankAdviceItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Generate Bank Advice Reports
  async generateEmployeeBankAdvice(paymentBatchId: string, paymentDate: Date, generatedBy: string): Promise<BankAdvice> {
    // Get all employee expense claims from the payment batch
    const batchItems = await db
      .select({
        paymentBatchItem: paymentBatchItems,
        expenseClaim: expenseClaims,
        user: users,
      })
      .from(paymentBatchItems)
      .leftJoin(expenseClaims, eq(paymentBatchItems.expenseClaimId, expenseClaims.id))
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(and(
        eq(paymentBatchItems.batchId, paymentBatchId),
        eq(paymentBatchItems.payeeType, "employee")
      ));

    if (batchItems.length === 0) {
      throw new Error("No employee payments found in this batch");
    }

    // Calculate total amount
    const totalAmount = batchItems.reduce((sum, item) => 
      sum + parseFloat(item.paymentBatchItem.amount), 0);

    // Generate unique advice number
    const adviceNumber = `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create bank advice
    const advice = await this.createBankAdvice({
      adviceNumber,
      adviceType: "employee",
      totalAmount: totalAmount.toString(),
      paymentDate,
      batchId: paymentBatchId,
      generatedBy,
    });

    // Create bank advice items for each employee payment
    for (const item of batchItems) {
      if (item.user && item.expenseClaim) {
        await this.createBankAdviceItem({
          adviceId: advice.id,
          payeeId: item.user.id,
          payeeName: `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.email || 'Unknown',
          payeeType: "employee",
          amount: item.paymentBatchItem.amount,
          accountNumber: item.paymentBatchItem.bankAccount || "Unknown",
          ifscCode: item.paymentBatchItem.ifscCode || "Unknown",
          purpose: `Expense reimbursement - ${item.expenseClaim.title}`,
          expenseClaimId: item.expenseClaim.id,
        });
      }
    }

    return advice;
  }

  async generateVendorBankAdvice(paymentBatchId: string, paymentDate: Date, generatedBy: string): Promise<BankAdvice> {
    // Get all vendor direct expenses from the payment batch
    const batchItems = await db
      .select({
        paymentBatchItem: paymentBatchItems,
        directExpense: directExpenses,
        creator: users,
      })
      .from(paymentBatchItems)
      .leftJoin(directExpenses, eq(paymentBatchItems.directExpenseId, directExpenses.id))
      .leftJoin(users, eq(directExpenses.createdBy, users.id))
      .where(and(
        eq(paymentBatchItems.batchId, paymentBatchId),
        eq(paymentBatchItems.payeeType, "vendor")
      ));

    if (batchItems.length === 0) {
      throw new Error("No vendor payments found in this batch");
    }

    // Calculate total amount
    const totalAmount = batchItems.reduce((sum, item) => 
      sum + parseFloat(item.paymentBatchItem.amount), 0);

    // Generate unique advice number
    const adviceNumber = `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create bank advice
    const advice = await this.createBankAdvice({
      adviceNumber,
      adviceType: "vendor",
      totalAmount: totalAmount.toString(),
      paymentDate,
      batchId: paymentBatchId,
      generatedBy,
    });

    // Create bank advice items for each vendor payment
    for (const item of batchItems) {
      if (item.directExpense) {
        await this.createBankAdviceItem({
          adviceId: advice.id,
          payeeName: item.directExpense.vendorName || item.paymentBatchItem.payeeName,
          payeeType: "vendor",
          amount: item.paymentBatchItem.amount,
          accountNumber: item.paymentBatchItem.bankAccount || "Unknown",
          ifscCode: item.paymentBatchItem.ifscCode || "Unknown",
          purpose: `Vendor payment - ${item.directExpense.description}`,
          directExpenseId: item.directExpense.id,
        });
      }
    }

    return advice;
  }

  // Bank operations
  async getBanks(): Promise<Bank[]> {
    return await db.select().from(banks).where(eq(banks.isActive, true));
  }

  async createBank(bank: InsertBank): Promise<Bank> {
    const [newBank] = await db.insert(banks).values(bank).returning();
    return newBank;
  }

  // Petty Cash Receipt operations
  async getPettyCashReceipts(): Promise<(PettyCashReceipt & { receivedFrom?: User; bank?: Bank; recordedBy: User })[]> {
    const receipts = await db
      .select()
      .from(pettyCashReceipts)
      .leftJoin(users, eq(pettyCashReceipts.receivedFromId, users.id))
      .leftJoin(banks, eq(pettyCashReceipts.bankId, banks.id))
      .orderBy(desc(pettyCashReceipts.createdAt));

    // Fetch recordedBy users separately
    const enrichedReceipts = [];
    for (const row of receipts) {
      const recordedBy = await this.getUser(row.petty_cash_receipts.recordedBy);
      enrichedReceipts.push({
        ...row.petty_cash_receipts,
        receivedFrom: row.users || undefined,
        bank: row.banks || undefined,
        recordedBy: recordedBy!,
      });
    }

    return enrichedReceipts as (PettyCashReceipt & { receivedFrom?: User; bank?: Bank; recordedBy: User })[];
  }

  async getPettyCashReceipt(id: string): Promise<(PettyCashReceipt & { receivedFrom?: User; bank?: Bank; recordedBy: User }) | undefined> {
    const [receipt] = await db
      .select()
      .from(pettyCashReceipts)
      .leftJoin(users, eq(pettyCashReceipts.receivedFromId, users.id))
      .leftJoin(banks, eq(pettyCashReceipts.bankId, banks.id))
      .where(eq(pettyCashReceipts.id, id));

    if (!receipt) return undefined;

    const recordedBy = await this.getUser(receipt.petty_cash_receipts.recordedBy);

    return {
      ...receipt.petty_cash_receipts,
      receivedFrom: receipt.users || undefined,
      bank: receipt.banks || undefined,
      recordedBy: recordedBy!,
    } as PettyCashReceipt & { receivedFrom?: User; bank?: Bank; recordedBy: User };
  }

  async createPettyCashReceipt(receipt: InsertPettyCashReceipt): Promise<PettyCashReceipt> {
    const [newReceipt] = await db.insert(pettyCashReceipts).values(receipt).returning();
    return newReceipt;
  }

  async updatePettyCashReceipt(id: string, updates: Partial<PettyCashReceipt>): Promise<PettyCashReceipt | undefined> {
    const [updated] = await db
      .update(pettyCashReceipts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(pettyCashReceipts.id, id))
      .returning();
    return updated;
  }

  async deletePettyCashReceipt(id: string): Promise<void> {
    await db.delete(pettyCashReceipts).where(eq(pettyCashReceipts.id, id));
  }

  // Expense Category CRUD operations
  async updateExpenseCategory(id: string, updates: Partial<ExpenseCategory>): Promise<ExpenseCategory | undefined> {
    const [updated] = await db
      .update(expenseCategories)
      .set(updates)
      .where(eq(expenseCategories.id, id))
      .returning();
    return updated;
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
  }

  // Expense group operations
  async createExpenseGroup(groupData: InsertExpenseGroup): Promise<ExpenseGroup> {
    const [group] = await db.insert(expenseGroups).values(groupData).returning();
    return group;
  }

  async getExpenseGroups(): Promise<ExpenseGroup[]> {
    return await db.select().from(expenseGroups).orderBy(expenseGroups.name);
  }

  async updateExpenseGroup(id: string, updates: Partial<ExpenseGroup>): Promise<ExpenseGroup | undefined> {
    const [group] = await db.update(expenseGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expenseGroups.id, id))
      .returning();
    return group;
  }

  async deleteExpenseGroup(id: string): Promise<void> {
    await db.delete(expenseGroups).where(eq(expenseGroups.id, id));
  }

  // Expense head operations
  async createExpenseHead(headData: InsertExpenseHead): Promise<ExpenseHead> {
    const [head] = await db.insert(expenseHeads).values(headData).returning();
    return head;
  }

  async getExpenseHeads(groupId?: string): Promise<ExpenseHead[]> {
    const query = db.select().from(expenseHeads).orderBy(expenseHeads.name);
    if (groupId) {
      return await query.where(eq(expenseHeads.expenseGroupId, groupId));
    }
    return await query;
  }

  async updateExpenseHead(id: string, updates: Partial<ExpenseHead>): Promise<ExpenseHead | undefined> {
    const [head] = await db.update(expenseHeads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expenseHeads.id, id))
      .returning();
    return head;
  }

  async deleteExpenseHead(id: string): Promise<void> {
    await db.delete(expenseHeads).where(eq(expenseHeads.id, id));
  }

  // Expense policy operations
  async createExpensePolicy(policyData: InsertExpensePolicy): Promise<ExpensePolicy> {
    const [policy] = await db.insert(expensePolicies).values(policyData).returning();
    return policy;
  }

  async getExpensePolicies(companyId?: string): Promise<ExpensePolicy[]> {
    if (companyId) {
      return await db.select().from(expensePolicies)
        .where(eq(expensePolicies.companyId, companyId))
        .orderBy(expensePolicies.createdAt);
    }
    return await db.select().from(expensePolicies).orderBy(expensePolicies.createdAt);
  }

  async getExpensePolicyById(id: string): Promise<ExpensePolicy | undefined> {
    const [policy] = await db.select().from(expensePolicies).where(eq(expensePolicies.id, id));
    return policy;
  }

  async updateExpensePolicy(id: string, updates: Partial<ExpensePolicy>): Promise<ExpensePolicy | undefined> {
    const [policy] = await db.update(expensePolicies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expensePolicies.id, id))
      .returning();
    return policy;
  }

  async deleteExpensePolicy(id: string): Promise<void> {
    await db.delete(expensePolicies).where(eq(expensePolicies.id, id));
  }

  // Expense Claim CRUD operations
  async updateExpenseClaim(id: string, updates: Partial<ExpenseClaim>): Promise<ExpenseClaim | undefined> {
    const [updated] = await db
      .update(expenseClaims)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, id))
      .returning();
    return updated;
  }

  async deleteExpenseClaim(id: string): Promise<void> {
    // First delete related expense items
    await db.delete(expenseItems).where(eq(expenseItems.claimId, id));
    // Then delete the claim
    await db.delete(expenseClaims).where(eq(expenseClaims.id, id));
  }

  // Expense Item CRUD operations
  async updateExpenseItem(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem | undefined> {
    const [updated] = await db
      .update(expenseItems)
      .set(updates)
      .where(eq(expenseItems.id, id))
      .returning();
    return updated;
  }

  async deleteExpenseItem(id: string): Promise<void> {
    await db.delete(expenseItems).where(eq(expenseItems.id, id));
  }

  // Direct Expense CRUD operations
  async updateDirectExpense(id: string, updates: Partial<DirectExpense>): Promise<DirectExpense | undefined> {
    const [updated] = await db
      .update(directExpenses)
      .set(updates)
      .where(eq(directExpenses.id, id))
      .returning();
    return updated;
  }

  async deleteDirectExpense(id: string): Promise<void> {
    await db.delete(directExpenses).where(eq(directExpenses.id, id));
  }

  // Expense Request CRUD operations
  async updateExpenseRequest(id: string, updates: Partial<ExpenseRequest>): Promise<ExpenseRequest | undefined> {
    const [updated] = await db
      .update(expenseRequests)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(expenseRequests.id, id))
      .returning();
    return updated;
  }

  async deleteExpenseRequest(id: string): Promise<void> {
    await db.delete(expenseRequests).where(eq(expenseRequests.id, id));
  }

  // Advance Payment CRUD operations
  async updateAdvancePayment(id: string, updates: Partial<AdvancePayment>): Promise<AdvancePayment | undefined> {
    const [updated] = await db
      .update(advancePayments)
      .set(updates)
      .where(eq(advancePayments.id, id))
      .returning();
    return updated;
  }

  async deleteAdvancePayment(id: string): Promise<void> {
    await db.delete(advancePayments).where(eq(advancePayments.id, id));
  }

  // Receipt CRUD operations
  async updateReceipt(id: string, updates: Partial<Receipt>): Promise<Receipt | undefined> {
    const [updated] = await db
      .update(receipts)
      .set(updates)
      .where(eq(receipts.id, id))
      .returning();
    return updated;
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  // Payment Batch Item CRUD operations
  async updatePaymentBatchItem(id: string, updates: Partial<PaymentBatchItem>): Promise<PaymentBatchItem | undefined> {
    const [updated] = await db
      .update(paymentBatchItems)
      .set(updates)
      .where(eq(paymentBatchItems.id, id))
      .returning();
    return updated;
  }

  async deletePaymentBatchItem(id: string): Promise<void> {
    await db.delete(paymentBatchItems).where(eq(paymentBatchItems.id, id));
  }

  // Card Transaction CRUD operations
  async deleteCardTransaction(id: string): Promise<void> {
    await db.delete(cardTransactions).where(eq(cardTransactions.id, id));
  }

  // Bank Advice Item CRUD operations
  async updateBankAdviceItem(id: string, updates: Partial<BankAdviceItem>): Promise<BankAdviceItem | undefined> {
    const [updated] = await db
      .update(bankAdviceItems)
      .set(updates)
      .where(eq(bankAdviceItems.id, id))
      .returning();
    return updated;
  }

  async deleteBankAdviceItem(id: string): Promise<void> {
    await db.delete(bankAdviceItems).where(eq(bankAdviceItems.id, id));
  }

  // Bank CRUD operations
  async updateBank(id: string, updates: Partial<Bank>): Promise<Bank | undefined> {
    const [updated] = await db
      .update(banks)
      .set(updates)
      .where(eq(banks.id, id))
      .returning();
    return updated;
  }

  async deleteBank(id: string): Promise<void> {
    await db.delete(banks).where(eq(banks.id, id));
  }

  // ========== PETTY CASH MANAGEMENT SYSTEM IMPLEMENTATION ==========

  // Party operations
  async getParties(): Promise<Party[]> {
    return await db.select().from(parties).orderBy(desc(parties.createdAt));
  }

  async getParty(id: string): Promise<Party | undefined> {
    const [party] = await db.select().from(parties).where(eq(parties.id, id));
    return party;
  }

  async createParty(partyData: InsertParty): Promise<Party> {
    const [party] = await db.insert(parties).values(partyData).returning();
    return party;
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | undefined> {
    const [updated] = await db
      .update(parties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(parties.id, id))
      .returning();
    return updated;
  }

  async deleteParty(id: string): Promise<void> {
    await db.delete(parties).where(eq(parties.id, id));
  }

  // ========== VENDOR MANAGEMENT OPERATIONS IMPLEMENTATION ==========

  // Vendor operations
  async getVendors(filters?: { status?: string; searchTerm?: string }): Promise<(Vendor & { createdBy: User })[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(vendors.status, filters.status));
    }
    if (filters?.searchTerm) {
      conditions.push(ilike(vendors.name, `%${filters.searchTerm}%`));
    }

    const results = await db
      .select()
      .from(vendors)
      .leftJoin(users, eq(vendors.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendors.createdAt));

    return results.map(result => ({
      ...result.vendors,
      createdBy: result.users!,
    })) as (Vendor & { createdBy: User })[];
  }

  async getVendor(id: string): Promise<(Vendor & { createdBy: User }) | undefined> {
    const [result] = await db
      .select()
      .from(vendors)
      .leftJoin(users, eq(vendors.createdBy, users.id))
      .where(eq(vendors.id, id));

    if (!result) return undefined;

    return {
      ...result.vendors,
      createdBy: result.users!,
    } as Vendor & { createdBy: User };
  }

  async getActiveVendors(): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.status, 'active'))
      .orderBy(vendors.name);
  }

  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const [updated] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Vendor Onboarding Requests operations
  async getVendorOnboardingRequests(filters?: { status?: string; requestedBy?: string }): Promise<(VendorOnboardingRequest & { requester: User; documents: VendorDocument[] })[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(vendorOnboardingRequests.status, filters.status));
    }
    if (filters?.requestedBy) {
      conditions.push(eq(vendorOnboardingRequests.requestedBy, filters.requestedBy));
    }

    const results = await db
      .select()
      .from(vendorOnboardingRequests)
      .leftJoin(users, eq(vendorOnboardingRequests.requestedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorOnboardingRequests.createdAt));

    // Get documents for each request
    const requestsWithDocuments = await Promise.all(
      results.map(async (result) => {
        const documents = await this.getVendorDocuments(result.vendor_onboarding_requests.id);
        return {
          ...result.vendor_onboarding_requests,
          requester: result.users!,
          documents,
        };
      })
    );

    return requestsWithDocuments;
  }

  async getVendorOnboardingRequest(id: string): Promise<(VendorOnboardingRequest & { requester: User; documents: VendorDocument[] }) | undefined> {
    const [result] = await db
      .select()
      .from(vendorOnboardingRequests)
      .leftJoin(users, eq(vendorOnboardingRequests.requestedBy, users.id))
      .where(eq(vendorOnboardingRequests.id, id));

    if (!result) return undefined;

    const documents = await this.getVendorDocuments(id);
    return {
      ...result.vendor_onboarding_requests,
      requester: result.users!,
      documents,
    };
  }

  async createVendorOnboardingRequest(requestData: InsertVendorOnboardingRequest): Promise<VendorOnboardingRequest> {
    const [request] = await db.insert(vendorOnboardingRequests).values(requestData).returning();
    return request;
  }

  async updateVendorOnboardingRequest(id: string, updates: Partial<VendorOnboardingRequest>): Promise<VendorOnboardingRequest | undefined> {
    const [updated] = await db
      .update(vendorOnboardingRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorOnboardingRequests.id, id))
      .returning();
    return updated;
  }

  async deleteVendorOnboardingRequest(id: string): Promise<void> {
    await db.delete(vendorOnboardingRequests).where(eq(vendorOnboardingRequests.id, id));
  }

  // ========== DASHBOARD WIDGETS OPERATIONS ==========

  async getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
    return await db
      .select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.userId, userId))
      .orderBy(dashboardWidgets.createdAt);
  }

  async createDashboardWidget(widgetData: InsertDashboardWidget): Promise<DashboardWidget> {
    const [widget] = await db.insert(dashboardWidgets).values(widgetData).returning();
    return widget;
  }

  async updateDashboardWidget(id: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined> {
    const [updated] = await db
      .update(dashboardWidgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dashboardWidgets.id, id))
      .returning();
    return updated;
  }

  async deleteDashboardWidget(id: string): Promise<void> {
    await db.delete(dashboardWidgets).where(eq(dashboardWidgets.id, id));
  }

  async getDashboardAnalytics(userId: string, role: string = 'Employee', orgId?: string): Promise<{
    totalExpenses: number;
    pendingApprovals: number;
    recentClaims: any[];
    monthlyTrends: any[];
    categoryBreakdown: any[];
    vendorSpending: any[];
    avgProcessingTime: number;
  }> {
    // Determine if we should filter by user or show company-wide data
    const isEmployeeView = role === 'Employee' || !role;
    
    // Build base conditions - always filter by organization if provided
    const baseConditions = [];
    if (isEmployeeView) {
      baseConditions.push(eq(expenseClaims.userId, userId));
    } else if (orgId) {
      // For admin view, filter by organization via user join
      baseConditions.push(eq(users.companyId, orgId));
    }
    
    // Get total expenses - join with users to filter by organization
    const totalExpensesQuery = db
      .select({ amount: expenseClaims.totalAmount })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(baseConditions.length > 0 ? and(...baseConditions) : undefined);
    
    const totalExpensesResults = await totalExpensesQuery;
    const totalExpensesResult = { 
      total: totalExpensesResults.reduce((sum, claim) => sum + parseFloat(claim.amount || '0'), 0) 
    };

    // Get pending approvals count
    const pendingConditions = [eq(expenseClaims.status, 'pending')];
    if (isEmployeeView) {
      pendingConditions.push(eq(expenseClaims.userId, userId));
    } else if (orgId) {
      pendingConditions.push(eq(users.companyId, orgId));
    }
    const pendingApprovalsResults = await db
      .select({ id: expenseClaims.id })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(and(...pendingConditions));
    
    const pendingApprovalsResult = { count: pendingApprovalsResults.length };

    // Get recent claims (last 5)
    const recentClaims = await db
      .select({
        id: expenseClaims.id,
        title: expenseClaims.title,
        totalAmount: expenseClaims.totalAmount,
        status: expenseClaims.status,
        createdAt: expenseClaims.createdAt,
      })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(baseConditions.length > 0 ? and(...baseConditions) : undefined)
      .orderBy(desc(expenseClaims.createdAt))
      .limit(5);

    // Get monthly trends (last 6 months) - simplified for now
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trendsConditions = [gte(expenseClaims.createdAt, sixMonthsAgo)];
    if (isEmployeeView) {
      trendsConditions.push(eq(expenseClaims.userId, userId));
    } else if (orgId) {
      trendsConditions.push(eq(users.companyId, orgId));
    }
    
    const trendsResults = await db
      .select({
        totalAmount: expenseClaims.totalAmount,
        createdAt: expenseClaims.createdAt,
        userId: expenseClaims.userId, // Add userId to track unique users
      })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(and(...trendsConditions));
    
    // Process monthly trends in JavaScript with unique user counting
    const monthlyTrends = trendsResults.reduce((acc: any[], claim) => {
      const month = claim.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.total += parseFloat(claim.totalAmount || '0');
        existing.count += 1;
        // Track unique users
        if (!existing.uniqueUsers.includes(claim.userId)) {
          existing.uniqueUsers.push(claim.userId);
        }
      } else {
        acc.push({
          month,
          total: parseFloat(claim.totalAmount || '0'),
          count: 1,
          uniqueUsers: [claim.userId], // Track unique users per month
          userCount: 1, // Initialize user count
          avgPerUser: parseFloat(claim.totalAmount || '0') // Initialize average per user
        });
      }
      return acc;
    }, []);

    // Calculate final metrics for each month
    monthlyTrends.forEach(trend => {
      trend.userCount = trend.uniqueUsers.length;
      trend.avgPerUser = trend.userCount > 0 ? trend.total / trend.userCount : 0;
      // Remove the uniqueUsers array from final response to avoid sending unnecessary data
      delete trend.uniqueUsers;
    });

    // Get category breakdown (regular expense items only)
    const categoryConditions = [
      // Exclude vendor claims from regular category breakdown
      isNull(expenseClaims.vendorId)
    ];
    if (isEmployeeView) {
      categoryConditions.push(eq(expenseClaims.userId, userId));
    } else if (orgId) {
      categoryConditions.push(eq(users.companyId, orgId));
    }
    
    const categoryResults = await db
      .select({
        categoryId: expenseItems.categoryId,
        categoryName: expenseHeads.name,
        amount: expenseItems.amount,
      })
      .from(expenseItems)
      .leftJoin(expenseClaims, eq(expenseItems.claimId, expenseClaims.id))
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .leftJoin(expenseHeads, eq(expenseItems.categoryId, expenseHeads.id))
      .where(and(...categoryConditions));
    
    // Process category breakdown in JavaScript
    const categoryBreakdown = Object.values(
      categoryResults.reduce((acc: any, item) => {
        const key = item.categoryId || 'unknown';
        if (!acc[key]) {
          acc[key] = {
            categoryId: item.categoryId,
            categoryName: item.categoryName || 'Unknown Category',
            total: 0,
            count: 0
          };
        }
        acc[key].total += parseFloat(item.amount || '0');
        acc[key].count += 1;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.total - a.total).slice(0, 10);

    // Get vendor claims total for category breakdown
    const vendorClaimsResults = await db
      .select({
        totalAmount: expenseClaims.totalAmount
      })
      .from(expenseClaims)
      .where(and(
        isNotNull(expenseClaims.vendorId), // Vendor claims have vendorId
        inArray(expenseClaims.status, ['submitted', 'approved', 'paid']),
        isEmployeeView ? eq(expenseClaims.userId, userId) : undefined
      ));
    
    const vendorClaimsTotal = {
      total: vendorClaimsResults.reduce((sum, claim) => sum + parseFloat(claim.totalAmount || '0'), 0),
      count: vendorClaimsResults.length
    };

    // Add vendor claims to category breakdown if there are any
    const finalCategoryBreakdown = [...categoryBreakdown];
    if (vendorClaimsTotal && Number(vendorClaimsTotal.total) > 0) {
      finalCategoryBreakdown.push({
        categoryId: 'vendor_dues',
        categoryName: 'Vendor Payments',
        total: Number(vendorClaimsTotal.total),
        count: Number(vendorClaimsTotal.count)
      });
    }

    // Sort final breakdown by total amount
    finalCategoryBreakdown.sort((a, b) => b.total - a.total);

    // Get vendor spending (from expense claims with vendors)
    const vendorConditions = [isNotNull(expenseClaims.vendorId)];
    if (isEmployeeView) {
      vendorConditions.push(eq(expenseClaims.userId, userId));
    }
    const vendorSpendingResults = await db
      .select({
        vendorId: expenseClaims.vendorId,
        vendorName: vendors.name,
        totalAmount: expenseClaims.totalAmount,
      })
      .from(expenseClaims)
      .leftJoin(vendors, eq(expenseClaims.vendorId, vendors.id))
      .where(and(...vendorConditions));
    
    // Process vendor spending in JavaScript
    const vendorSpending = Object.values(
      vendorSpendingResults.reduce((acc: any, item) => {
        const key = item.vendorId || 'unknown';
        if (!acc[key]) {
          acc[key] = {
            vendorId: item.vendorId,
            vendorName: item.vendorName || 'Unknown Vendor',
            total: 0,
            count: 0
          };
        }
        acc[key].total += parseFloat(item.totalAmount || '0');
        acc[key].count += 1;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.total - a.total).slice(0, 5);

    // Calculate average processing time (in days) - simplified for now
    const avgConditions = [isNotNull(expenseClaims.approvedAt)];
    if (isEmployeeView) {
      avgConditions.push(eq(expenseClaims.userId, userId));
    }
    const avgProcessingResults = await db
      .select({
        createdAt: expenseClaims.createdAt,
        approvedAt: expenseClaims.approvedAt,
      })
      .from(expenseClaims)
      .where(and(...avgConditions));
    
    // Calculate average processing time in JavaScript
    let avgDays = 0;
    if (avgProcessingResults.length > 0) {
      const totalDays = avgProcessingResults.reduce((total, result) => {
        if (result.approvedAt && result.createdAt) {
          const diffTime = new Date(result.approvedAt).getTime() - new Date(result.createdAt).getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return total + diffDays;
        }
        return total;
      }, 0);
      avgDays = totalDays / avgProcessingResults.length;
    }
    
    const avgProcessingResult = { avgDays };

    return {
      totalExpenses: totalExpensesResult?.total || 0,
      pendingApprovals: pendingApprovalsResult?.count || 0,
      recentClaims,
      monthlyTrends,
      categoryBreakdown: finalCategoryBreakdown,
      vendorSpending,
      avgProcessingTime: avgProcessingResult?.avgDays || 0,
    };
  }

  // Vendor onboarding approval workflow
  async processVendorOnboardingApproval(requestId: string, approverId: string, action: 'approve' | 'reject', remarks?: string): Promise<{ request: VendorOnboardingRequest; vendor?: Vendor }> {
    const [currentRequest] = await db.select().from(vendorOnboardingRequests).where(eq(vendorOnboardingRequests.id, requestId));
    if (!currentRequest) {
      throw new Error('Onboarding request not found');
    }

    const approver = await this.getUser(approverId);
    if (!approver) {
      throw new Error('Approver not found');
    }

    const currentLevel = currentRequest.currentApprovalLevel || 'admin';
    
    let newStatus: string;
    let nextLevel: string;
    let vendor: Vendor | undefined;

    if (action === 'reject') {
      newStatus = 'rejected';
      nextLevel = 'none';
      await this.updateVendorOnboardingRequest(requestId, {
        status: newStatus,
        rejectedBy: approverId,
        rejectedAt: new Date(),
        rejectionReason: remarks,
      });
    } else {
      // Approved
      if (currentLevel === 'admin') {
        newStatus = 'finance_approved';
        nextLevel = 'finance';
      } else if (currentLevel === 'finance') {
        newStatus = 'approved';
        nextLevel = 'completed';
        
        // Create vendor record
        vendor = await this.createVendor({
          name: currentRequest.vendorName,
          address: currentRequest.address,
          contactPerson: currentRequest.contactPerson,
          phone: currentRequest.phone,
          email: currentRequest.email,
          accountNumber: currentRequest.accountNumber,
          ifscCode: currentRequest.ifscCode,
          bankName: currentRequest.bankName,
          bankBranch: currentRequest.bankBranch,
          gstin: currentRequest.gstin,
          pan: currentRequest.pan,
          tdsCategory: currentRequest.tdsCategory,
          msmeStatus: currentRequest.msmeStatus,
          msmeNumber: currentRequest.msmeNumber,
        });

        // Link vendor to request
        await this.updateVendorOnboardingRequest(requestId, {
          status: newStatus,
          approvedBy: approverId,
          approvedAt: new Date(),
          vendorId: vendor.id,
        });
      } else {
        newStatus = 'admin_approved';
        nextLevel = 'finance';
        await this.updateVendorOnboardingRequest(requestId, {
          status: newStatus,
          currentApprovalLevel: nextLevel,
        });
      }
    }

    const updatedRequest = await this.getVendorOnboardingRequest(requestId);
    return { request: updatedRequest!, vendor };
  }

  async getVendorOnboardingRequestsForApproval(userRole: string): Promise<VendorOnboardingRequest[]> {
    let statusCondition;
    if (userRole === 'admin') {
      statusCondition = eq(vendorOnboardingRequests.status, 'pending');
    } else if (userRole === 'accountant') {
      statusCondition = eq(vendorOnboardingRequests.status, 'admin_approved');
    } else {
      return [];
    }

    return await db
      .select()
      .from(vendorOnboardingRequests)
      .where(statusCondition)
      .orderBy(vendorOnboardingRequests.requestedAt);
  }

  // Vendor Documents operations
  async getVendorDocuments(onboardingRequestId?: string, vendorId?: string): Promise<(VendorDocument & { uploadedBy: User })[]> {
    const conditions = [];
    if (onboardingRequestId) {
      conditions.push(eq(vendorDocuments.onboardingRequestId, onboardingRequestId));
    }
    if (vendorId) {
      conditions.push(eq(vendorDocuments.vendorId, vendorId));
    }

    const results = await db
      .select()
      .from(vendorDocuments)
      .leftJoin(users, eq(vendorDocuments.uploadedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(vendorDocuments.uploadedAt);

    return results.map(result => ({
      ...result.vendor_documents,
      uploadedBy: result.users!,
    })) as (VendorDocument & { uploadedBy: User })[];
  }

  async getVendorDocument(id: string): Promise<(VendorDocument & { uploadedBy: User }) | undefined> {
    const [result] = await db
      .select()
      .from(vendorDocuments)
      .leftJoin(users, eq(vendorDocuments.uploadedBy, users.id))
      .where(eq(vendorDocuments.id, id));

    if (!result) return undefined;

    return {
      ...result.vendor_documents,
      uploadedBy: result.users!,
    } as VendorDocument & { uploadedBy: User };
  }

  async createVendorDocument(documentData: InsertVendorDocument): Promise<VendorDocument> {
    const [document] = await db.insert(vendorDocuments).values(documentData).returning();
    return document;
  }

  async updateVendorDocument(id: string, updates: Partial<VendorDocument>): Promise<VendorDocument | undefined> {
    const [updated] = await db
      .update(vendorDocuments)
      .set(updates)
      .where(eq(vendorDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteVendorDocument(id: string): Promise<void> {
    await db.delete(vendorDocuments).where(eq(vendorDocuments.id, id));
  }

  async verifyVendorDocument(id: string, verifiedBy: string): Promise<VendorDocument> {
    const [verified] = await db
      .update(vendorDocuments)
      .set({
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      })
      .where(eq(vendorDocuments.id, id))
      .returning();
    return verified;
  }

  // Vendor Payment History operations
  async getVendorPaymentHistory(vendorId?: string, filters?: { startDate?: Date; endDate?: Date }): Promise<(VendorPaymentHistory & { vendor: Vendor; processedBy: User })[]> {
    const conditions = [];
    if (vendorId) {
      conditions.push(eq(vendorPaymentHistory.vendorId, vendorId));
    }
    if (filters?.startDate) {
      conditions.push(gte(vendorPaymentHistory.paymentDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(vendorPaymentHistory.paymentDate, filters.endDate));
    }

    const results = await db
      .select()
      .from(vendorPaymentHistory)
      .leftJoin(vendors, eq(vendorPaymentHistory.vendorId, vendors.id))
      .leftJoin(users, eq(vendorPaymentHistory.processedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorPaymentHistory.paymentDate));

    return results.map(result => ({
      ...result.vendor_payment_history,
      vendor: result.vendors!,
      processedBy: result.users!,
    })) as (VendorPaymentHistory & { vendor: Vendor; processedBy: User })[];
  }

  async getVendorPaymentHistoryItem(id: string): Promise<(VendorPaymentHistory & { vendor: Vendor; processedBy: User }) | undefined> {
    const [result] = await db
      .select()
      .from(vendorPaymentHistory)
      .leftJoin(vendors, eq(vendorPaymentHistory.vendorId, vendors.id))
      .leftJoin(users, eq(vendorPaymentHistory.processedBy, users.id))
      .where(eq(vendorPaymentHistory.id, id));

    if (!result) return undefined;

    return {
      ...result.vendor_payment_history,
      vendor: result.vendors!,
      processedBy: result.users!,
    } as VendorPaymentHistory & { vendor: Vendor; processedBy: User };
  }

  async createVendorPaymentHistory(paymentData: InsertVendorPaymentHistory): Promise<VendorPaymentHistory> {
    const [payment] = await db.insert(vendorPaymentHistory).values(paymentData).returning();
    
    // Update vendor payment totals
    await this.updateVendorPaymentTotals(payment.vendorId);
    
    return payment;
  }

  async updateVendorPaymentHistory(id: string, updates: Partial<VendorPaymentHistory>): Promise<VendorPaymentHistory | undefined> {
    const [updated] = await db
      .update(vendorPaymentHistory)
      .set(updates)
      .where(eq(vendorPaymentHistory.id, id))
      .returning();
    return updated;
  }

  async deleteVendorPaymentHistory(id: string): Promise<void> {
    await db.delete(vendorPaymentHistory).where(eq(vendorPaymentHistory.id, id));
  }

  // Vendor reconciliation and reporting
  async getVendorPaymentSummary(vendorId: string): Promise<{ totalPaid: number; lastPaymentDate?: Date; pendingPayments: number }> {
    // Get total paid amount
    const [paidResult] = await db
      .select({
        totalPaid: sql<number>`COALESCE(SUM(${vendorPaymentHistory.amount}), 0)`,
        lastPaymentDate: sql<Date>`MAX(${vendorPaymentHistory.paymentDate})`,
      })
      .from(vendorPaymentHistory)
      .where(eq(vendorPaymentHistory.vendorId, vendorId));

    // Get pending payments (approved claims not yet paid for this vendor)
    const [pendingResult] = await db
      .select({
        pendingAmount: sql<number>`COALESCE(SUM(${expenseClaims.totalAmount}), 0)`,
      })
      .from(expenseClaims)
      .where(
        and(
          eq(expenseClaims.vendorId, vendorId),
          eq(expenseClaims.status, 'approved')
        )
      );

    return {
      totalPaid: Number(paidResult?.totalPaid || 0),
      lastPaymentDate: paidResult?.lastPaymentDate || undefined,
      pendingPayments: Number(pendingResult?.pendingAmount || 0),
    };
  }

  async updateVendorPaymentTotals(vendorId: string): Promise<Vendor> {
    const summary = await this.getVendorPaymentSummary(vendorId);
    
    const [updated] = await db
      .update(vendors)
      .set({
        totalPaid: summary.totalPaid.toString(),
        lastPaymentDate: summary.lastPaymentDate,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId))
      .returning();
      
    return updated;
  }

  async getVendorClaimsAndInvoices(vendorId: string): Promise<{ claims: ExpenseClaim[]; directExpenses: DirectExpense[] }> {
    // Get expense claims for this vendor
    const claims = await db
      .select()
      .from(expenseClaims)
      .where(eq(expenseClaims.vendorId, vendorId))
      .orderBy(desc(expenseClaims.createdAt));

    // Get direct expenses (invoices) for this vendor  
    const directExpensesData = await db
      .select()
      .from(directExpenses)
      .where(eq(directExpenses.vendorName, vendorId))
      .orderBy(desc(directExpenses.createdAt));

    return { claims, directExpenses: directExpensesData };
  }

  // ========== VENDOR REPORTS AND ANALYTICS ==========

  async getVendorExpenseReport(filters: {
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
    period?: 'monthly' | 'quarterly' | 'yearly';
  }): Promise<any[]> {
    const conditions = [];
    
    if (filters.vendorId) {
      conditions.push(eq(expenseClaims.vendorId, filters.vendorId));
    }
    if (filters.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }

    const claims = await db
      .select({
        vendorId: expenseClaims.vendorId,
        vendorName: vendors.name,
        amount: expenseClaims.totalAmount,
        submittedAt: expenseClaims.submittedAt,
        status: expenseClaims.status,
        title: expenseClaims.title,
      })
      .from(expenseClaims)
      .leftJoin(vendors, eq(expenseClaims.vendorId, vendors.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expenseClaims.submittedAt));

    // Group by period if specified
    if (filters.period) {
      const grouped = claims.reduce((acc, claim) => {
        if (!claim.submittedAt) return acc;
        
        const date = new Date(claim.submittedAt);
        let periodKey = '';
        
        switch (filters.period) {
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          case 'yearly':
            periodKey = `${date.getFullYear()}`;
            break;
        }
        
        if (!acc[periodKey]) {
          acc[periodKey] = {
            period: periodKey,
            totalAmount: 0,
            claimCount: 0,
            vendors: new Set(),
            claims: []
          };
        }
        
        acc[periodKey].totalAmount += parseFloat(claim.amount);
        acc[periodKey].claimCount += 1;
        acc[periodKey].vendors.add(claim.vendorName);
        acc[periodKey].claims.push(claim);
        
        return acc;
      }, {} as any);
      
      return Object.values(grouped).map((group: any) => ({
        ...group,
        vendorCount: group.vendors.size,
        vendors: undefined // Remove the Set
      }));
    }

    return claims;
  }

  async getTopVendorsBySpend(filters: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    const conditions = [];
    
    if (filters.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }

    const result = await db
      .select({
        vendorId: expenseClaims.vendorId,
        vendorName: vendors.name,
        totalSpend: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
        claimCount: sql<number>`COUNT(${expenseClaims.id})`,
        avgAmount: sql<number>`COALESCE(AVG(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
        lastPayment: sql<Date>`MAX(${expenseClaims.submittedAt})`,
      })
      .from(expenseClaims)
      .leftJoin(vendors, eq(expenseClaims.vendorId, vendors.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(expenseClaims.vendorId, vendors.name)
      .orderBy(sql`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0) DESC`)
      .limit(filters.limit || 10);

    return result;
  }

  async getPendingVsClearedInvoices(filters: {
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    pending: any[];
    cleared: any[];
    summary: {
      pendingCount: number;
      pendingAmount: number;
      clearedCount: number;
      clearedAmount: number;
    };
  }> {
    const conditions = [];
    
    if (filters.vendorId) {
      conditions.push(eq(expenseClaims.vendorId, filters.vendorId));
    }
    if (filters.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }

    const allClaims = await db
      .select({
        id: expenseClaims.id,
        vendorId: expenseClaims.vendorId,
        vendorName: vendors.name,
        title: expenseClaims.title,
        amount: expenseClaims.totalAmount,
        status: expenseClaims.status,
        submittedAt: expenseClaims.submittedAt,
        approvedAt: expenseClaims.approvedAt,
      })
      .from(expenseClaims)
      .leftJoin(vendors, eq(expenseClaims.vendorId, vendors.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expenseClaims.submittedAt));

    const pending = allClaims.filter(claim => 
      claim.status === 'pending' || claim.status === 'approved'
    );
    
    const cleared = allClaims.filter(claim => 
      claim.status === 'paid' || claim.status === 'completed'
    );

    const summary = {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, claim) => sum + parseFloat(claim.amount), 0),
      clearedCount: cleared.length,
      clearedAmount: cleared.reduce((sum, claim) => sum + parseFloat(claim.amount), 0),
    };

    return { pending, cleared, summary };
  }

  async getVendorGSTTDSSummary(filters: {
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
    financialYear?: string;
  }): Promise<any[]> {
    const conditions = [];
    
    if (filters.vendorId) {
      conditions.push(eq(expenseClaims.vendorId, filters.vendorId));
    }
    if (filters.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }

    const result = await db
      .select({
        vendorId: expenseClaims.vendorId,
        vendorName: vendors.name,
        vendorPAN: vendors.pan,
        vendorGSTIN: vendors.gstin,
        tdsCategory: vendors.tdsCategory,
        totalAmount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
        claimCount: sql<number>`COUNT(${expenseClaims.id})`,
        // Calculate estimated GST and TDS amounts (these would typically come from expense items)
        estimatedGST: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)) * 0.18, 0)`, // 18% GST estimate
        estimatedTDS: sql<number>`
          CASE 
            WHEN ${vendors.tdsCategory} = 'professional' THEN COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)) * 0.10, 0)
            WHEN ${vendors.tdsCategory} = 'contractor' THEN COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)) * 0.02, 0)
            WHEN ${vendors.tdsCategory} = 'commission' THEN COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)) * 0.05, 0)
            ELSE COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)) * 0.01, 0)
          END
        `,
        firstTransaction: sql<Date>`MIN(${expenseClaims.submittedAt})`,
        lastTransaction: sql<Date>`MAX(${expenseClaims.submittedAt})`,
      })
      .from(expenseClaims)
      .leftJoin(vendors, eq(expenseClaims.vendorId, vendors.id))
      .where(and(
        ...(conditions.length > 0 ? conditions : []),
        eq(expenseClaims.status, 'approved') // Only approved claims for compliance
      ))
      .groupBy(expenseClaims.vendorId, vendors.name, vendors.pan, vendors.gstin, vendors.tdsCategory)
      .orderBy(sql`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0) DESC`);

    return result;
  }

  async getVendorAnalyticsDashboard(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    overview: {
      totalVendors: number;
      activeVendors: number;
      totalSpend: number;
      pendingPayments: number;
      avgPaymentCycle: number;
    };
    topCategories: any[];
    monthlyTrends: any[];
    complianceAlerts: any[];
  }> {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }

    // Overview metrics
    const [totalVendorsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vendors);

    const [activeVendorsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vendors)
      .where(eq(vendors.status, 'active'));

    const [totalSpendResult] = await db
      .select({ 
        amount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(expenseClaims)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const [pendingPaymentsResult] = await db
      .select({ 
        amount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(expenseClaims)
      .where(and(
        ...(conditions.length > 0 ? conditions : []),
        eq(expenseClaims.status, 'approved')
      ));

    // Monthly trends (last 12 months)
    const monthlyTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${expenseClaims.submittedAt}, 'YYYY-MM')`,
        totalAmount: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
        claimCount: sql<number>`COUNT(${expenseClaims.id})`,
        vendorCount: sql<number>`COUNT(DISTINCT ${expenseClaims.vendorId})`,
      })
      .from(expenseClaims)
      .where(gte(expenseClaims.submittedAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`TO_CHAR(${expenseClaims.submittedAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${expenseClaims.submittedAt}, 'YYYY-MM')`);

    // Compliance alerts (vendors missing PAN/GSTIN)
    const complianceAlerts = await db
      .select({
        vendorId: vendors.id,
        vendorName: vendors.name,
        missingPAN: sql<boolean>`${vendors.pan} IS NULL OR ${vendors.pan} = ''`,
        missingGSTIN: sql<boolean>`${vendors.gstin} IS NULL OR ${vendors.gstin} = ''`,
        totalSpend: sql<number>`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0)`,
      })
      .from(vendors)
      .leftJoin(expenseClaims, eq(vendors.id, expenseClaims.vendorId))
      .where(
        or(
          sql`${vendors.pan} IS NULL OR ${vendors.pan} = ''`,
          sql`${vendors.gstin} IS NULL OR ${vendors.gstin} = ''`
        )
      )
      .groupBy(vendors.id, vendors.name, vendors.pan, vendors.gstin)
      .having(sql`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0) > 0`)
      .orderBy(sql`COALESCE(SUM(CAST(${expenseClaims.totalAmount} AS DECIMAL)), 0) DESC`);

    return {
      overview: {
        totalVendors: totalVendorsResult.count,
        activeVendors: activeVendorsResult.count,
        totalSpend: totalSpendResult.amount,
        pendingPayments: pendingPaymentsResult.amount,
        avgPaymentCycle: 15 // This would need actual payment cycle calculation
      },
      topCategories: [], // Would need expense category analysis
      monthlyTrends,
      complianceAlerts
    };
  }

  // Cashbox operations
  async getCashboxes(): Promise<(Cashbox & { cashier: User })[]> {
    const results = await db
      .select()
      .from(cashboxes)
      .leftJoin(users, eq(cashboxes.cashierId, users.id))
      .orderBy(desc(cashboxes.createdAt));

    return results.map(result => ({
      ...result.cashboxes,
      cashier: result.users!,
    }));
  }

  async getCashbox(id: string): Promise<(Cashbox & { cashier: User }) | undefined> {
    const [result] = await db
      .select()
      .from(cashboxes)
      .leftJoin(users, eq(cashboxes.cashierId, users.id))
      .where(eq(cashboxes.id, id));

    if (!result) return undefined;

    return {
      ...result.cashboxes,
      cashier: result.users!,
    };
  }

  async createCashbox(cashboxData: InsertCashbox): Promise<Cashbox> {
    const [cashbox] = await db.insert(cashboxes).values(cashboxData).returning();
    return cashbox;
  }

  async updateCashbox(id: string, updates: Partial<Cashbox>): Promise<Cashbox | undefined> {
    const [updated] = await db
      .update(cashboxes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cashboxes.id, id))
      .returning();
    return updated;
  }

  async deleteCashbox(id: string): Promise<void> {
    await db.delete(cashboxes).where(eq(cashboxes.id, id));
  }

  // Transaction operations
  async createPettyCashTransaction(transactionData: InsertPettyCashTransaction): Promise<PettyCashTransaction> {
    const [transaction] = await db.insert(pettyCashTransactions).values(transactionData).returning();
    
    // Update ledger entry after creating transaction
    await this.updateLedgerEntryForTransaction(transaction);
    
    // Update cashbox current balance
    const newBalance = await this.getCurrentBalance(transaction.cashboxId);
    await db
      .update(cashboxes)
      .set({ currentBalance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(cashboxes.id, transaction.cashboxId));

    return transaction;
  }

  async getPettyCashTransactions(filters?: {
    cashboxId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(PettyCashTransaction & { cashier: User; payeeUser?: User })[]> {
    const conditions = [];
    if (filters?.cashboxId) {
      conditions.push(eq(pettyCashTransactions.cashboxId, filters.cashboxId));
    }
    if (filters?.type) {
      conditions.push(eq(pettyCashTransactions.type, filters.type));
    }
    if (filters?.startDate) {
      conditions.push(gte(pettyCashTransactions.transactionDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(pettyCashTransactions.transactionDate, filters.endDate));
    }

    const results = await db
      .select({
        transaction: pettyCashTransactions,
        cashier: users,
      })
      .from(pettyCashTransactions)
      .leftJoin(users, eq(pettyCashTransactions.recordedBy, users.id))
      .orderBy(desc(pettyCashTransactions.transactionDate))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // For payee users, we need a separate query since we can't join twice on the same alias
    const transactionsWithPayees = await Promise.all(
      results.map(async (result) => {
        let payeeUser = undefined;
        if (result.transaction.payeeId) {
          const [payee] = await db
            .select()
            .from(users)
            .where(eq(users.id, result.transaction.payeeId));
          payeeUser = payee;
        }
        
        return {
          ...result.transaction,
          cashier: result.cashier!,
          payeeUser,
        };
      })
    );

    return transactionsWithPayees;
  }

  async updatePettyCashTransaction(id: string, updates: Partial<PettyCashTransaction>): Promise<PettyCashTransaction | undefined> {
    const [updated] = await db
      .update(pettyCashTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pettyCashTransactions.id, id))
      .returning();
      
    if (updated && (updates.amount || updates.transactionDate)) {
      // Recalculate ledger entries from the transaction date
      await this.updateLedgerEntryForTransaction(updated);
      const fromDate = new Date(updates.transactionDate || updated.transactionDate);
      await this.recalculateLedgerFromDate(updated.cashboxId, fromDate);
    }
    
    return updated;
  }

  async deletePettyCashTransaction(id: string): Promise<void> {
    // Get transaction details before deleting for ledger recalculation
    const [transaction] = await db
      .select()
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.id, id));
    
    await db.delete(pettyCashTransactions).where(eq(pettyCashTransactions.id, id));
    
    if (transaction) {
      // Recalculate ledger from transaction date
      await this.recalculateLedgerFromDate(transaction.cashboxId, transaction.transactionDate);
    }
  }

  // Ledger operations
  async getLedgerEntries(cashboxId: string, startDate?: Date, endDate?: Date): Promise<LedgerEntry[]> {
    const conditions = [eq(ledgerEntries.cashboxId, cashboxId)];
    if (startDate) {
      conditions.push(gte(ledgerEntries.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(ledgerEntries.date, endDate));
    }

    return await db
      .select()
      .from(ledgerEntries)
      .where(and(...conditions))
      .orderBy(ledgerEntries.date);
  }

  async getLedgerEntry(cashboxId: string, date: Date): Promise<LedgerEntry | undefined> {
    const [entry] = await db
      .select()
      .from(ledgerEntries)
      .where(and(
        eq(ledgerEntries.cashboxId, cashboxId),
        eq(ledgerEntries.date, date)
      ));
    return entry;
  }

  async createOrUpdateLedgerEntry(entryData: InsertLedgerEntry): Promise<LedgerEntry> {
    const [entry] = await db
      .insert(ledgerEntries)
      .values(entryData)
      .onConflictDoUpdate({
        target: [ledgerEntries.cashboxId, ledgerEntries.date],
        set: {
          openingBalance: entryData.openingBalance,
          debit: entryData.debit,
          credit: entryData.credit,
          closingBalance: entryData.closingBalance,
          updatedAt: new Date(),
        },
      })
      .returning();
    return entry;
  }

  // Business logic operations
  async initializeCashbox(cashboxId: string, initialAmount: number, recordedBy: string): Promise<{ cashbox: Cashbox; transaction: PettyCashTransaction; ledger: LedgerEntry }> {
    const today = new Date();
    const dateStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Create initial fund transaction
    const transaction = await db.insert(pettyCashTransactions).values({
      cashboxId,
      type: 'initial_fund',
      amount: initialAmount.toString(),
      description: `Initial fund setup`,
      transactionDate: today,
      recordedBy,
    }).returning().then(results => results[0]);

    // Create initial ledger entry
    const ledger = await this.createOrUpdateLedgerEntry({
      cashboxId,
      date: dateStart,
      openingBalance: "0",
      debit: initialAmount.toString(),
      credit: "0",
      closingBalance: initialAmount.toString(),
    });

    // Update cashbox balance
    const cashbox = await this.updateCashbox(cashboxId, { 
      currentBalance: initialAmount.toString() 
    });

    return { cashbox: cashbox!, transaction, ledger };
  }

  async recordCashReceipt(cashboxId: string, amount: number, description: string, payee: string, recordedBy: string, receiptUrl?: string): Promise<PettyCashTransaction> {
    const transactionData: InsertPettyCashTransaction = {
      cashboxId,
      type: 'receipt',
      amount: amount.toString(),
      description,
      payee,
      receiptUrl,
      transactionDate: new Date(),
      recordedBy,
    };

    return await this.createPettyCashTransaction(transactionData);
  }

  async recordCashPayment(cashboxId: string, amount: number, description: string, payee: string, recordedBy: string, receiptUrl?: string): Promise<PettyCashTransaction> {
    const transactionData: InsertPettyCashTransaction = {
      cashboxId,
      type: 'payment',
      amount: amount.toString(),
      description,
      payee,
      receiptUrl,
      transactionDate: new Date(),
      recordedBy,
    };

    return await this.createPettyCashTransaction(transactionData);
  }

  async recordFundTransfer(fromCashboxId: string, toCashboxId: string, amount: number, description: string, recordedBy: string): Promise<{ fromTransaction: PettyCashTransaction; toTransaction: PettyCashTransaction }> {
    const today = new Date();
    
    // Create outgoing transaction
    const fromTransaction = await this.createPettyCashTransaction({
      cashboxId: fromCashboxId,
      type: 'fund_transfer_out',
      amount: amount.toString(),
      description,
      transferToCashboxId: toCashboxId,
      transactionDate: today,
      recordedBy,
    });

    // Create incoming transaction
    const toTransaction = await this.createPettyCashTransaction({
      cashboxId: toCashboxId,
      type: 'fund_transfer_in',
      amount: amount.toString(),
      description,
      transferFromCashboxId: fromCashboxId,
      transactionDate: today,
      recordedBy,
    });

    return { fromTransaction, toTransaction };
  }

  async recordIouTake(cashboxId: string, amount: number, description: string, payeeId: string, recordedBy: string): Promise<PettyCashTransaction> {
    const transactionData: InsertPettyCashTransaction = {
      cashboxId,
      type: 'iou_take',
      amount: amount.toString(),
      description,
      payeeId,
      payeeType: 'employee',
      iouStatus: 'outstanding',
      transactionDate: new Date(),
      recordedBy,
    };

    return await this.createPettyCashTransaction(transactionData);
  }

  async recordIouRepay(originalIouId: string, amount: number, recordedBy: string): Promise<PettyCashTransaction> {
    // Get original IOU transaction
    const [originalIou] = await db
      .select()
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.id, originalIouId));

    if (!originalIou || originalIou.type !== 'iou_take') {
      throw new Error('Invalid IOU transaction');
    }

    // Create repayment transaction
    const repayment = await this.createPettyCashTransaction({
      cashboxId: originalIou.cashboxId,
      type: 'iou_repay',
      amount: amount.toString(),
      description: `IOU repayment: ${originalIou.description}`,
      payeeId: originalIou.payeeId,
      payeeType: 'employee',
      linkedIouId: originalIouId,
      transactionDate: new Date(),
      recordedBy,
    });

    // Update original IOU status if fully repaid
    const originalAmount = parseFloat(originalIou.amount);
    if (amount >= originalAmount) {
      await db
        .update(pettyCashTransactions)
        .set({ iouStatus: 'repaid', updatedAt: new Date() })
        .where(eq(pettyCashTransactions.id, originalIouId));
    }

    return repayment;
  }

  async getCurrentBalance(cashboxId: string): Promise<number> {
    // Get the most recent ledger entry
    const [latestEntry] = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.cashboxId, cashboxId))
      .orderBy(desc(ledgerEntries.date))
      .limit(1);

    return latestEntry ? parseFloat(latestEntry.closingBalance) : 0;
  }

  async recalculateLedgerFromDate(cashboxId: string, fromDate: Date): Promise<void> {
    const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    
    // Get all ledger entries from the start date onwards
    const entries = await this.getLedgerEntries(cashboxId, startDate);
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryDate = new Date(entry.date);
      
      // Get opening balance (previous day's closing balance)
      let openingBalance = 0;
      if (i === 0) {
        // For first entry, get previous day's closing balance
        const previousDate = new Date(entryDate);
        previousDate.setDate(previousDate.getDate() - 1);
        
        const [prevEntry] = await db
          .select()
          .from(ledgerEntries)
          .where(and(
            eq(ledgerEntries.cashboxId, cashboxId),
            lte(ledgerEntries.date, previousDate)
          ))
          .orderBy(desc(ledgerEntries.date))
          .limit(1);
          
        openingBalance = prevEntry ? parseFloat(prevEntry.closingBalance) : 0;
      } else {
        openingBalance = parseFloat(entries[i - 1].closingBalance);
      }

      // Calculate totals for this date
      const transactionsForDate = await db
        .select()
        .from(pettyCashTransactions)
        .where(and(
          eq(pettyCashTransactions.cashboxId, cashboxId),
          gte(pettyCashTransactions.transactionDate, entryDate),
          lte(pettyCashTransactions.transactionDate, new Date(entryDate.getTime() + 24 * 60 * 60 * 1000 - 1))
        ));

      let totalDebit = 0;
      let totalCredit = 0;

      for (const trans of transactionsForDate) {
        const amount = parseFloat(trans.amount);
        if (trans.type === 'receipt' || trans.type === 'fund_transfer_in' || trans.type === 'initial_fund' || trans.type === 'iou_repay') {
          totalDebit += amount;
        } else if (trans.type === 'payment' || trans.type === 'fund_transfer_out' || trans.type === 'iou_take') {
          totalCredit += amount;
        }
      }

      const closingBalance = openingBalance + totalDebit - totalCredit;

      // Update the ledger entry
      await this.createOrUpdateLedgerEntry({
        cashboxId,
        date: entryDate,
        openingBalance: openingBalance.toString(),
        debit: totalDebit.toString(),
        credit: totalCredit.toString(),
        closingBalance: closingBalance.toString(),
      });

      // Update entries array for next iteration
      entries[i] = {
        ...entry,
        openingBalance: openingBalance.toString(),
        debit: totalDebit.toString(),
        credit: totalCredit.toString(),
        closingBalance: closingBalance.toString(),
      };
    }

    // Update cashbox current balance
    const currentBalance = entries.length > 0 
      ? parseFloat(entries[entries.length - 1].closingBalance) 
      : 0;
      
    await db
      .update(cashboxes)
      .set({ 
        currentBalance: currentBalance.toString(), 
        updatedAt: new Date() 
      })
      .where(eq(cashboxes.id, cashboxId));
  }

  // Private helper method to update ledger entry for a transaction
  private async updateLedgerEntryForTransaction(transaction: PettyCashTransaction): Promise<void> {
    const transactionDate = new Date(transaction.transactionDate);
    const dateStart = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
    
    // Get existing ledger entry for this date
    let ledgerEntry = await this.getLedgerEntry(transaction.cashboxId, dateStart);
    
    if (!ledgerEntry) {
      // Create new ledger entry
      // Get previous day's closing balance as opening balance
      const previousDate = new Date(dateStart);
      previousDate.setDate(previousDate.getDate() - 1);
      
      const previousEntries = await this.getLedgerEntries(
        transaction.cashboxId,
        undefined,
        previousDate
      );
      
      const openingBalance = previousEntries.length > 0 
        ? parseFloat(previousEntries[previousEntries.length - 1].closingBalance)
        : 0;

      ledgerEntry = await this.createOrUpdateLedgerEntry({
        cashboxId: transaction.cashboxId,
        date: dateStart,
        openingBalance: openingBalance.toString(),
        debit: "0",
        credit: "0",
        closingBalance: openingBalance.toString(),
      });
    }

    // Calculate total debits and credits for this date
    const transactionsForDate = await db
      .select()
      .from(pettyCashTransactions)
      .where(and(
        eq(pettyCashTransactions.cashboxId, transaction.cashboxId),
        gte(pettyCashTransactions.transactionDate, dateStart),
        lte(pettyCashTransactions.transactionDate, new Date(dateStart.getTime() + 24 * 60 * 60 * 1000 - 1))
      ));

    let totalDebit = 0;
    let totalCredit = 0;

    for (const trans of transactionsForDate) {
      const amount = parseFloat(trans.amount);
      if (trans.type === 'receipt' || trans.type === 'fund_transfer_in' || trans.type === 'initial_fund' || trans.type === 'iou_repay') {
        totalDebit += amount;
      } else if (trans.type === 'payment' || trans.type === 'fund_transfer_out' || trans.type === 'iou_take') {
        totalCredit += amount;
      }
    }

    // Update ledger entry
    const openingBalance = parseFloat(ledgerEntry.openingBalance);
    const closingBalance = openingBalance + totalDebit - totalCredit;

    await this.createOrUpdateLedgerEntry({
      cashboxId: transaction.cashboxId,
      date: dateStart,
      openingBalance: openingBalance.toString(),
      debit: totalDebit.toString(),
      credit: totalCredit.toString(),
      closingBalance: closingBalance.toString(),
    });
  }

  // Cost Centre Configuration operations
  async getCostCentreConfig(orgId: string): Promise<CostCentreConfig | null> {
    const [config] = await db.select().from(costCentreConfigs).where(eq(costCentreConfigs.orgId, orgId));
    return config || null;
  }

  async saveCostCentreConfig(configData: InsertCostCentreConfig): Promise<CostCentreConfig> {
    // Check if config exists for this org
    const existingConfig = await this.getCostCentreConfig(configData.orgId);
    
    if (existingConfig) {
      // Update existing config
      const [updated] = await db
        .update(costCentreConfigs)
        .set({ ...configData, updatedAt: new Date() })
        .where(eq(costCentreConfigs.orgId, configData.orgId))
        .returning();
      return updated;
    } else {
      // Create new config
      const [created] = await db.insert(costCentreConfigs).values(configData).returning();
      return created;
    }
  }
  // Cost Distribution operations
  async getCostDistributions(claimId: string): Promise<CostDistribution[]> {
    return await db.select().from(costDistributions).where(eq(costDistributions.expenseClaimId, claimId));
  }

  async updateCostDistribution(id: string, updates: Partial<CostDistribution>): Promise<CostDistribution | undefined> {
    const [updated] = await db
      .update(costDistributions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(costDistributions.id, id))
      .returning();
    return updated;
  }

  // Process payment for direct expense
  async processDirectExpensePayment(expenseId: string, utrNumber: string, paymentDate: Date, processedBy: string): Promise<DirectExpense> {
    const [expense] = await db
      .update(directExpenses)
      .set({
        status: 'paid',
        // Note: Direct expenses don't have UTR fields in schema, could be added in future
      })
      .where(eq(directExpenses.id, expenseId))
      .returning();

    if (!expense) {
      throw new Error('Direct expense not found');
    }

    return expense;
  }

  // TDS Master operations
  async createTdsMaster(tdsMasterData: InsertTdsMaster): Promise<TdsMaster> {
    // Ensure defaultRate is a string for decimal field
    const dataToInsert = {
      ...tdsMasterData,
      defaultRate: typeof tdsMasterData.defaultRate === 'number' ? tdsMasterData.defaultRate.toString() : tdsMasterData.defaultRate
    };
    const [created] = await db.insert(tdsMaster).values(dataToInsert).returning();
    return created;
  }

  async getTdsMaster(): Promise<TdsMaster[]> {
    return await db.select().from(tdsMaster).where(eq(tdsMaster.isActive, true)).orderBy(tdsMaster.categoryName);
  }

  async getTdsMasterByCategory(category: string): Promise<TdsMaster | undefined> {
    const [tds] = await db.select().from(tdsMaster).where(and(eq(tdsMaster.category, category), eq(tdsMaster.isActive, true)));
    return tds;
  }

  async updateTdsMaster(id: string, updates: Partial<TdsMaster>): Promise<TdsMaster | undefined> {
    const [updated] = await db
      .update(tdsMaster)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tdsMaster.id, id))
      .returning();
    return updated;
  }

  async deleteTdsMaster(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await db
      .update(tdsMaster)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tdsMaster.id, id));
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    // Ensure amount is a string for decimal field
    const dataToInsert = {
      ...contract,
      amount: typeof contract.amount === 'number' ? contract.amount.toString() : contract.amount
    };
    const [newContract] = await db.insert(contracts).values(dataToInsert).returning();
    return newContract;
  }

  async getContracts(filters?: { orgId?: string }): Promise<any[]> {
    const conditions = [];
    
    // Add orgId filtering for security - filter by company
    if (filters?.orgId) {
      conditions.push(eq(contracts.companyId, filters.orgId));
    }
    
    const result = await db
      .select({
        id: contracts.id,
        title: contracts.title,
        vendorId: contracts.vendorId,
        vendorName: contracts.vendorName,
        companyId: contracts.companyId,
        agreementReference: contracts.agreementReference,
        expenseType: contracts.expenseType,
        agreementStartDate: contracts.agreementStartDate,
        agreementEndDate: contracts.agreementEndDate,
        dueDate: contracts.dueDate,
        amount: contracts.amount,
        frequency: contracts.frequency,
        supportingDocuments: contracts.supportingDocuments,
        status: contracts.status,
        isAutoPopulated: contracts.isAutoPopulated,
        expenseClaimId: contracts.expenseClaimId,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
        enableReminders: contracts.enableReminders,
        reminderDaysBefore: contracts.reminderDaysBefore,
        autoGenerateVendorClaim: contracts.autoGenerateVendorClaim,
        lastReminderSent: contracts.lastReminderSent,
        nextDueDate: contracts.nextDueDate,
        lastVendorClaimGenerated: contracts.lastVendorClaimGenerated,
        vendorNameFromVendor: vendors.name,
      })
      .from(contracts)
      .leftJoin(vendors, eq(contracts.vendorId, vendors.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contracts.createdAt));

    return result.map(contract => ({
      ...contract,
      vendor: {
        name: contract.vendorNameFromVendor || contract.vendorName || 'Unknown Vendor'
      }
    }));
  }

  async getContract(id: string): Promise<any> {
    const [result] = await db
      .select({
        id: contracts.id,
        title: contracts.title,
        vendorId: contracts.vendorId,
        vendorName: contracts.vendorName,
        companyId: contracts.companyId,
        agreementReference: contracts.agreementReference,
        expenseType: contracts.expenseType,
        agreementStartDate: contracts.agreementStartDate,
        agreementEndDate: contracts.agreementEndDate,
        dueDate: contracts.dueDate,
        amount: contracts.amount,
        frequency: contracts.frequency,
        supportingDocuments: contracts.supportingDocuments,
        status: contracts.status,
        isAutoPopulated: contracts.isAutoPopulated,
        expenseClaimId: contracts.expenseClaimId,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
        enableReminders: contracts.enableReminders,
        reminderDaysBefore: contracts.reminderDaysBefore,
        autoGenerateVendorClaim: contracts.autoGenerateVendorClaim,
        lastReminderSent: contracts.lastReminderSent,
        nextDueDate: contracts.nextDueDate,
        lastVendorClaimGenerated: contracts.lastVendorClaimGenerated,
        vendorNameFromVendor: vendors.name,
      })
      .from(contracts)
      .leftJoin(vendors, eq(contracts.vendorId, vendors.id))
      .where(eq(contracts.id, id));

    if (!result) return undefined;
    
    return {
      ...result,
      vendor: {
        name: result.vendorNameFromVendor || result.vendorName || 'Unknown Vendor'
      }
    };
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const [updated] = await db
      .update(contracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    
    return updated;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // ===== WORKFLOW SYSTEM IMPLEMENTATIONS =====

  // Workflow Roles CRUD
  async createWorkflowRole(roleData: InsertWorkflowRole): Promise<WorkflowRole> {
    const [role] = await db.insert(workflowRoles).values(roleData).returning();
    return role;
  }

  async getWorkflowRoles(filters?: { isActive?: boolean; companyId?: string }): Promise<WorkflowRole[]> {
    let query = db.select().from(workflowRoles);
    const conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(workflowRoles.isActive, filters.isActive));
    }
    
    if (filters?.companyId) {
      conditions.push(eq(workflowRoles.companyId, filters.companyId));
    }
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    return await query.orderBy(workflowRoles.name);
  }

  async updateWorkflowRole(id: string, updates: Partial<WorkflowRole>): Promise<WorkflowRole | undefined> {
    const [updated] = await db
      .update(workflowRoles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workflowRoles.id, id))
      .returning();
    
    return updated;
  }

  async deleteWorkflowRole(id: string): Promise<void> {
    await db.delete(workflowRoles).where(eq(workflowRoles.id, id));
  }

  // Workflows CRUD
  async createWorkflow(workflowData: InsertWorkflow, levels: InsertWorkflowLevel[]): Promise<Workflow> {
    return await db.transaction(async (tx) => {
      // Create workflow first
      const [workflow] = await tx.insert(workflows).values(workflowData).returning();
      
      // Create levels for the workflow
      if (levels.length > 0) {
        const levelsWithWorkflowId = levels.map((level, index) => ({
          ...level,
          workflowId: workflow.id,
          level: index + 1, // Ensure sequential levels
        }));
        
        await tx.insert(workflowLevels).values(levelsWithWorkflowId);
      }
      
      return workflow;
    });
  }

  async getWorkflows(filters?: { processTypes?: string[]; isActive?: boolean }): Promise<(Workflow & { levels: (WorkflowLevel & { role: WorkflowRole })[] })[]> {
    let query = db
      .select({
        // Workflow fields
        id: workflows.id,
        name: workflows.name,
        companyId: workflows.companyId,
        description: workflows.description,
        processTypes: workflows.processTypes,
        approvalConditionType: workflows.approvalConditionType,
        isActive: workflows.isActive,
        isDefault: workflows.isDefault,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt,
      })
      .from(workflows);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(workflows.isActive, filters.isActive));
    }
    
    const workflowResults = await query.orderBy(workflows.name);
    
    // Get levels for each workflow
    const workflowsWithLevels = await Promise.all(
      workflowResults.map(async (workflow) => {
        const levels = await this.getWorkflowLevels(workflow.id);
        return {
          ...workflow,
          levels,
        };
      })
    );
    
    return workflowsWithLevels;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const [updated] = await db
      .update(workflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    
    return updated;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete workflow instances that reference this workflow first
      await tx.delete(workflowInstances).where(eq(workflowInstances.workflowId, id));
      
      // Delete workflow assignments that reference this workflow
      await tx.delete(workflowAssignments).where(eq(workflowAssignments.workflowId, id));
      
      // Clear process_master references to this workflow (set to null)
      await tx.update(processMaster)
        .set({ defaultWorkflowId: null })
        .where(eq(processMaster.defaultWorkflowId, id));
      
      // Delete workflow levels
      await tx.delete(workflowLevels).where(eq(workflowLevels.workflowId, id));
      
      // Delete the workflow itself
      await tx.delete(workflows).where(eq(workflows.id, id));
    });
  }

  // Workflow Levels CRUD
  async createWorkflowLevel(levelData: InsertWorkflowLevel): Promise<WorkflowLevel> {
    const [level] = await db.insert(workflowLevels).values(levelData).returning();
    return level;
  }

  async getWorkflowLevels(workflowId: string): Promise<(WorkflowLevel & { role: WorkflowRole })[]> {
    const results = await db
      .select({
        // WorkflowLevel fields
        id: workflowLevels.id,
        workflowId: workflowLevels.workflowId,
        level: workflowLevels.level,
        roleId: workflowLevels.roleId,
        minAmount: workflowLevels.minAmount,
        maxAmount: workflowLevels.maxAmount,
        isRequired: workflowLevels.isRequired,
        createdAt: workflowLevels.createdAt,
        // Role fields - include companyId to match interface expectations
        role: {
          id: workflowRoles.id,
          name: workflowRoles.name,
          companyId: workflowRoles.companyId,
          description: workflowRoles.description,
          menuKeys: workflowRoles.menuKeys,
          isActive: workflowRoles.isActive,
          createdAt: workflowRoles.createdAt,
          updatedAt: workflowRoles.updatedAt,
        },
      })
      .from(workflowLevels)
      .leftJoin(workflowRoles, eq(workflowLevels.roleId, workflowRoles.id))
      .where(eq(workflowLevels.workflowId, workflowId))
      .orderBy(workflowLevels.level);

    return results.map(result => ({
      ...result,
      role: result.role ? {
        id: result.role.id,
        name: result.role.name,
        companyId: result.role.companyId,
        description: result.role.description,
        menuKeys: result.role.menuKeys,
        isActive: result.role.isActive,
        createdAt: result.role.createdAt,
        updatedAt: result.role.updatedAt,
      } : {
        id: '',
        name: 'Unknown Role',
        companyId: '',
        description: null,
        menuKeys: null,
        isActive: false,
        createdAt: null,
        updatedAt: null,
      }
    }));
  }

  async updateWorkflowLevel(id: string, updates: Partial<WorkflowLevel>): Promise<WorkflowLevel | undefined> {
    const [updated] = await db
      .update(workflowLevels)
      .set(updates)
      .where(eq(workflowLevels.id, id))
      .returning();
    
    return updated;
  }

  async deleteWorkflowLevel(id: string): Promise<void> {
    await db.delete(workflowLevels).where(eq(workflowLevels.id, id));
  }

  // Workflow Assignments CRUD
  async createWorkflowAssignment(assignmentData: InsertWorkflowAssignment): Promise<WorkflowAssignment> {
    const [assignment] = await db.insert(workflowAssignments).values(assignmentData).returning();
    return assignment;
  }

  async getWorkflowAssignments(filters?: { processType?: string; vendorId?: string; expenseHeadId?: string }): Promise<(WorkflowAssignment & { workflow: Workflow })[]> {
    let query = db
      .select({
        // WorkflowAssignment fields
        id: workflowAssignments.id,
        workflowId: workflowAssignments.workflowId,
        processType: workflowAssignments.processType,
        vendorId: workflowAssignments.vendorId,
        expenseHeadId: workflowAssignments.expenseHeadId,
        companyId: workflowAssignments.companyId,
        isDefault: workflowAssignments.isDefault,
        priority: workflowAssignments.priority,
        createdAt: workflowAssignments.createdAt,
        // Workflow fields
        workflow: {
          id: workflows.id,
          name: workflows.name,
          description: workflows.description,
          processTypes: workflows.processTypes,
          companyId: workflows.companyId,
          isActive: workflows.isActive,
          isDefault: workflows.isDefault,
          createdAt: workflows.createdAt,
          updatedAt: workflows.updatedAt,
        },
      })
      .from(workflowAssignments)
      .leftJoin(workflows, eq(workflowAssignments.workflowId, workflows.id));

    if (filters?.processType) {
      query = query.where(eq(workflowAssignments.processType, filters.processType));
    }
    if (filters?.vendorId) {
      query = query.where(eq(workflowAssignments.vendorId, filters.vendorId));
    }
    if (filters?.expenseHeadId) {
      query = query.where(eq(workflowAssignments.expenseHeadId, filters.expenseHeadId));
    }

    const results = await query.orderBy(workflowAssignments.priority);

    return results.map(result => ({
      ...result,
      workflow: result.workflow!,
    }));
  }

  async updateWorkflowAssignment(id: string, updates: Partial<WorkflowAssignment>): Promise<WorkflowAssignment | undefined> {
    const [updated] = await db
      .update(workflowAssignments)
      .set(updates)
      .where(eq(workflowAssignments.id, id))
      .returning();
    
    return updated;
  }

  async deleteWorkflowAssignment(id: string): Promise<void> {
    await db.delete(workflowAssignments).where(eq(workflowAssignments.id, id));
  }

  // Workflow Engine operations
  async getDefaultWorkflow(processType: string): Promise<(Workflow & { levels: (WorkflowLevel & { role: WorkflowRole })[] }) | undefined> {
    // First try to get a workflow marked as default for this process type
    const [defaultWorkflow] = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.isDefault, true),
          eq(workflows.isActive, true),
          sql`${workflows.processTypes}::text LIKE ${'%"' + processType + '"%'}`
        )
      )
      .limit(1);

    if (defaultWorkflow) {
      const levels = await this.getWorkflowLevels(defaultWorkflow.id);
      return { ...defaultWorkflow, levels };
    }

    // Fallback to any active workflow that supports this process type
    const [fallbackWorkflow] = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.isActive, true),
          sql`${workflows.processTypes}::text LIKE ${'%"' + processType + '"%'}`
        )
      )
      .limit(1);

    if (fallbackWorkflow) {
      const levels = await this.getWorkflowLevels(fallbackWorkflow.id);
      return { ...fallbackWorkflow, levels };
    }

    return undefined;
  }

  async getWorkflowForContext(processType: string, context: { vendorId?: string; expenseHeadId?: string; amount?: number }): Promise<(Workflow & { levels: (WorkflowLevel & { role: WorkflowRole })[] }) | undefined> {
    // First try specific vendor assignment
    if (context.vendorId) {
      const [vendorAssignment] = await db
        .select()
        .from(workflowAssignments)
        .leftJoin(workflows, eq(workflowAssignments.workflowId, workflows.id))
        .where(
          and(
            eq(workflowAssignments.processType, processType),
            eq(workflowAssignments.vendorId, context.vendorId),
            eq(workflows.isActive, true)
          )
        )
        .orderBy(workflowAssignments.priority)
        .limit(1);

      if (vendorAssignment?.workflows) {
        const levels = await this.getWorkflowLevels(vendorAssignment.workflows.id);
        return { ...vendorAssignment.workflows, levels };
      }
    }

    // Try specific expense head assignment
    if (context.expenseHeadId) {
      const [expenseHeadAssignment] = await db
        .select()
        .from(workflowAssignments)
        .leftJoin(workflows, eq(workflowAssignments.workflowId, workflows.id))
        .where(
          and(
            eq(workflowAssignments.processType, processType),
            eq(workflowAssignments.expenseHeadId, context.expenseHeadId),
            eq(workflows.isActive, true)
          )
        )
        .orderBy(workflowAssignments.priority)
        .limit(1);

      if (expenseHeadAssignment?.workflows) {
        const levels = await this.getWorkflowLevels(expenseHeadAssignment.workflows.id);
        return { ...expenseHeadAssignment.workflows, levels };
      }
    }

    // Fallback to default workflow for process type
    return await this.getDefaultWorkflow(processType);
  }

  // Workflow Instance operations
  async createWorkflowInstance(instanceData: InsertWorkflowInstance): Promise<WorkflowInstance> {
    const [instance] = await db.insert(workflowInstances).values(instanceData).returning();
    return instance;
  }

  async getWorkflowInstance(entityId: string, entityType: string): Promise<WorkflowInstance | undefined> {
    const [instance] = await db
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.entityId, entityId),
          eq(workflowInstances.entityType, entityType)
        )
      );
    
    return instance;
  }

  async updateWorkflowInstance(id: string, updates: Partial<WorkflowInstance>): Promise<WorkflowInstance | undefined> {
    const [updated] = await db
      .update(workflowInstances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workflowInstances.id, id))
      .returning();
    
    return updated;
  }

  // Agent Conversation operations
  async createConversation(conversationData: InsertAgentConversation): Promise<AgentConversation> {
    const [conversation] = await db
      .insert(agentConversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async getConversations(userId: string): Promise<AgentConversation[]> {
    return await db
      .select()
      .from(agentConversations)
      .where(eq(agentConversations.userId, userId))
      .orderBy(desc(agentConversations.updatedAt));
  }

  async getConversation(id: string): Promise<(AgentConversation & { messages: AgentMessage[] }) | undefined> {
    const [conversation] = await db
      .select()
      .from(agentConversations)
      .where(eq(agentConversations.id, id));

    if (!conversation) return undefined;

    const messages = await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, id))
      .orderBy(agentMessages.createdAt);

    return { ...conversation, messages };
  }

  async updateConversation(id: string, updates: Partial<AgentConversation>): Promise<AgentConversation | undefined> {
    const [updated] = await db
      .update(agentConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentConversations.id, id))
      .returning();
    
    return updated;
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete all messages first (cascade delete)
    await db.delete(agentMessages).where(eq(agentMessages.conversationId, id));
    // Then delete the conversation
    await db.delete(agentConversations).where(eq(agentConversations.id, id));
  }

  // Agent Message operations
  async createMessage(messageData: InsertAgentMessage): Promise<AgentMessage> {
    const [message] = await db
      .insert(agentMessages)
      .values(messageData)
      .returning();
    
    // Update conversation's updatedAt timestamp
    await db
      .update(agentConversations)
      .set({ updatedAt: new Date() })
      .where(eq(agentConversations.id, messageData.conversationId));
    
    return message;
  }

  async getMessages(conversationId: string): Promise<AgentMessage[]> {
    return await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId))
      .orderBy(agentMessages.createdAt);
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(agentMessages).where(eq(agentMessages.id, id));
  }

  // Bill Master Type operations
  async createBillMasterType(billType: InsertBillMasterType): Promise<BillMasterType> {
    const [newBillType] = await db.insert(billMasterTypes).values(billType).returning();
    return newBillType;
  }

  async getBillMasterTypes(includeInactive = false): Promise<(BillMasterType & { fields: BillMasterField[] })[]> {
    const whereClause = includeInactive ? undefined : eq(billMasterTypes.isActive, true);
    
    const types = await db
      .select()
      .from(billMasterTypes)
      .where(whereClause)
      .orderBy(billMasterTypes.displayOrder, billMasterTypes.name);

    const result = [];
    for (const type of types) {
      const fields = await this.getBillMasterFields(type.id);
      result.push({ ...type, fields });
    }
    
    return result;
  }

  async getBillMasterType(id: string): Promise<(BillMasterType & { fields: BillMasterField[] }) | undefined> {
    const [type] = await db.select().from(billMasterTypes).where(eq(billMasterTypes.id, id));
    if (!type) return undefined;
    
    const fields = await this.getBillMasterFields(id);
    return { ...type, fields };
  }

  async updateBillMasterType(id: string, updates: Partial<BillMasterType>): Promise<BillMasterType | undefined> {
    const [updated] = await db
      .update(billMasterTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billMasterTypes.id, id))
      .returning();
    return updated;
  }

  async deleteBillMasterType(id: string): Promise<void> {
    // First delete all fields, then the type (cascade should handle this)
    await db.delete(billMasterFields).where(eq(billMasterFields.billTypeId, id));
    await db.delete(billMasterTypes).where(eq(billMasterTypes.id, id));
  }

  // Bill Master Field operations
  async createBillMasterField(field: InsertBillMasterField): Promise<BillMasterField> {
    const [newField] = await db.insert(billMasterFields).values(field).returning();
    return newField;
  }

  async getBillMasterFields(billTypeId: string): Promise<BillMasterField[]> {
    return await db
      .select()
      .from(billMasterFields)
      .where(eq(billMasterFields.billTypeId, billTypeId))
      .orderBy(billMasterFields.fieldOrder, billMasterFields.fieldName);
  }

  async updateBillMasterField(id: string, updates: Partial<BillMasterField>): Promise<BillMasterField | undefined> {
    const [updated] = await db
      .update(billMasterFields)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billMasterFields.id, id))
      .returning();
    return updated;
  }

  async deleteBillMasterField(id: string): Promise<void> {
    await db.delete(billMasterFields).where(eq(billMasterFields.id, id));
  }

  async reorderBillMasterFields(billTypeId: string, fieldOrders: { id: string; order: number }[]): Promise<void> {
    for (const { id, order } of fieldOrders) {
      await db
        .update(billMasterFields)
        .set({ fieldOrder: order, updatedAt: new Date() })
        .where(and(eq(billMasterFields.id, id), eq(billMasterFields.billTypeId, billTypeId)));
    }
  }

  // Vendor Due Reports - Dynamic reports based on bill types
  async getVendorDueReports(filters: {
    startDate?: Date;
    endDate?: Date;
    billType?: string;
    vendorId?: string;
  }): Promise<any[]> {
    const conditions = [];
    
    // Always ensure we only get claims with vendors (vendor due reports)
    conditions.push(isNotNull(expenseClaims.vendorId));
    
    if (filters.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }
    if (filters.vendorId) {
      conditions.push(eq(expenseClaims.vendorId, filters.vendorId));
    }
    if (filters.billType) {
      conditions.push(eq(expenseClaims.billType, filters.billType));
    }

    console.log("Vendor due reports query filters:", filters);
    console.log("Generated conditions count:", conditions.length);

    // Simplified query to avoid Drizzle orderSelectedFields issues
    const baseQuery = db
      .select()
      .from(expenseClaims)
      .where(and(...conditions))
      .orderBy(desc(expenseClaims.submittedAt));

    const claims = await baseQuery;
    console.log("Found vendor claims:", claims.length);

    // Get vendor details separately to avoid join issues
    const vendorIds = [...new Set(claims.map(claim => claim.vendorId).filter(Boolean))];
    const vendorsMap = new Map();
    
    if (vendorIds.length > 0) {
      const vendorsList = await db.select().from(vendors).where(inArray(vendors.id, vendorIds));
      vendorsList.forEach(vendor => vendorsMap.set(vendor.id, vendor));
    }

    // For default bill types, we might have hardcoded fields
    // For custom bill types, we rely on the customFields JSON
    return claims.map(claim => ({
      ...claim,
      vendorName: vendorsMap.get(claim.vendorId)?.name || 'Unknown Vendor',
      // Parse customFields if it's a string
      customFields: typeof claim.customFields === 'string' 
        ? JSON.parse(claim.customFields) 
        : claim.customFields,
    }));
  }

  // Vendor Claims Management - CRUD Operations
  async getVendorClaims(filters: {
    orgId?: string;
    userId?: string;
    vendorId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    hasVendor?: boolean;
  }): Promise<any[]> {
    const conditions = [];
    
    // Filter by company ID through users table (not orgId directly on claims)
    if (filters.orgId) {
      conditions.push(eq(users.companyId, filters.orgId));
    }
    if (filters.userId) {
      conditions.push(eq(expenseClaims.userId, filters.userId));
    }
    if (filters.vendorId) {
      conditions.push(eq(expenseClaims.vendorId, filters.vendorId));
    }
    if (filters.status) {
      conditions.push(eq(expenseClaims.status, filters.status));
    }
    if (filters.startDate) {
      conditions.push(gte(expenseClaims.submittedAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(expenseClaims.submittedAt, filters.endDate));
    }
    // Only get claims with vendor IDs (vendor claims)
    if (filters.hasVendor) {
      conditions.push(isNotNull(expenseClaims.vendorId));
    }

    const claims = await db
      .select({
        id: expenseClaims.id,
        title: expenseClaims.title,
        description: expenseClaims.description,
        vendorId: expenseClaims.vendorId,
        vendorNameFromVendor: vendors.name,
        userId: expenseClaims.userId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        totalAmount: expenseClaims.totalAmount,
        balancePayment: expenseClaims.balancePayment,
        status: expenseClaims.status,
        submittedAt: expenseClaims.submittedAt,
        approvedAt: expenseClaims.approvedAt,
        paidAt: expenseClaims.paidAt,
        vendorDueDate: expenseClaims.vendorDueDate,
        vendorInvoiceNumber: expenseClaims.vendorInvoiceNumber,
        currentApprovalLevel: expenseClaims.currentApprovalLevel,
      })
      .from(expenseClaims)
      .leftJoin(vendors, eq(expenseClaims.vendorId, vendors.id))
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expenseClaims.submittedAt));

    return claims.map(claim => ({
      ...claim,
      vendorName: claim.vendorNameFromVendor || 'Unknown Vendor',
      userName: claim.userFirstName && claim.userLastName 
        ? `${claim.userFirstName} ${claim.userLastName}` 
        : 'Unknown User',
      // Map vendorDueDate to dueDate for backwards compatibility
      dueDate: claim.vendorDueDate,
      invoiceNumber: claim.vendorInvoiceNumber,
    }));
  }

  // ========== PROCESS MASTER OPERATIONS ==========
  
  async createProcessMaster(processData: InsertProcessMaster): Promise<ProcessMaster> {
    const [process] = await db.insert(processMaster).values(processData).returning();
    return process;
  }

  async getProcessMaster(processType: string): Promise<ProcessMaster | undefined> {
    const [process] = await db
      .select()
      .from(processMaster)
      .where(eq(processMaster.processType, processType));
    return process;
  }

  async getProcessMasters(): Promise<ProcessMaster[]> {
    return await db.select().from(processMaster);
  }

  async updateProcessMaster(id: string, updates: Partial<ProcessMaster>): Promise<ProcessMaster | undefined> {
    const [updated] = await db
      .update(processMaster)
      .set(updates)
      .where(eq(processMaster.id, id))
      .returning();
    return updated;
  }

  // ========== COST TO COMPANY BREAKDOWN ==========
  
  async getCostToCompanyBreakdown(userId?: string, role?: string, orgId?: string, options?: { period?: string }): Promise<{
    employeeClaims: { total: number; count: number };
    directExpenses: { total: number; count: number };
    vendorPayments: { total: number; count: number };
    corporateCard: { total: number; count: number };
  }> {
    const isEmployeeView = role === 'Employee' && userId;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (options?.period) {
      case 'thismonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastmonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'last3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lastyear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); // default last 6 months
    }
    
    // 1. Employee Claims (paid claims only)
    const [employeeClaimsResult] = await db
      .select({
        total: sql<number>`COALESCE(sum(cast(expense_items.amount as decimal)), 0)`,
        count: sql<number>`count(distinct expense_claims.id)`,
      })
      .from(expenseItems)
      .leftJoin(expenseClaims, eq(expenseItems.claimId, expenseClaims.id))
      .where(and(
        eq(expenseClaims.status, 'paid'), // Only paid claims
        gte(expenseClaims.createdAt, startDate),
        isEmployeeView ? eq(expenseClaims.userId, userId) : undefined
      ));
    
    // 2. Direct Company Expenses (paid expenses only)
    const [directExpensesResult] = await db
      .select({
        total: sql<number>`COALESCE(sum(cast(amount as decimal)), 0)`,
        count: sql<number>`count(*)`
      })
      .from(directExpenses)
      .where(and(
        eq(directExpenses.status, 'paid'), // Only paid expenses
        gte(directExpenses.date, startDate)
      ));
    
    // 3. Vendor Payments (from vendor claims - submitted, approved, and paid)
    const [vendorPaymentsResult] = await db
      .select({
        total: sql<number>`COALESCE(sum(cast(total_amount as decimal)), 0)`,
        count: sql<number>`count(*)`
      })
      .from(expenseClaims)
      .where(and(
        isNotNull(expenseClaims.vendorId), // Vendor claims have vendorId
        inArray(expenseClaims.status, ['submitted', 'approved', 'paid']), // All active statuses
        gte(expenseClaims.submittedAt, startDate),
        isEmployeeView ? eq(expenseClaims.userId, userId) : undefined
      ));
    
    // 4. Corporate Card Expenses (if any card transactions exist)
    // For now, setting to 0 as card transactions table structure needs to be checked
    const corporateCardResult = { total: 0, count: 0 };
    
    return {
      employeeClaims: {
        total: Number(employeeClaimsResult?.total || 0),
        count: Number(employeeClaimsResult?.count || 0)
      },
      directExpenses: {
        total: Number(directExpensesResult?.total || 0),
        count: Number(directExpensesResult?.count || 0)
      },
      vendorPayments: {
        total: Number(vendorPaymentsResult?.total || 0),
        count: Number(vendorPaymentsResult?.count || 0)
      },
      corporateCard: corporateCardResult
    };
  }

  // ===================== CUSTOM REPORTS =====================

  async saveCustomReport(report: InsertCustomReport): Promise<CustomReport> {
    const [savedReport] = await db
      .insert(customReports)
      .values(report)
      .returning();
    return savedReport;
  }

  async getCustomReports(filters?: {
    ownerId?: string;
    orgId?: string;
    process?: string;
    visibility?: string;
  }): Promise<CustomReport[]> {
    const conditions = [];
    
    if (filters?.ownerId) {
      conditions.push(eq(customReports.ownerId, filters.ownerId));
    }
    if (filters?.orgId) {
      conditions.push(eq(customReports.orgId, filters.orgId));
    }
    if (filters?.process) {
      conditions.push(eq(customReports.process, filters.process));
    }
    if (filters?.visibility) {
      conditions.push(eq(customReports.visibility, filters.visibility));
    }

    return await db
      .select()
      .from(customReports)
      .where(and(...conditions))
      .orderBy(desc(customReports.createdAt));
  }

  async getCustomReport(reportId: string): Promise<CustomReport | null> {
    const [report] = await db
      .select()
      .from(customReports)
      .where(eq(customReports.id, reportId));
    return report || null;
  }

  async updateCustomReport(reportId: string, updates: Partial<InsertCustomReport>): Promise<CustomReport | null> {
    const [updatedReport] = await db
      .update(customReports)
      .set({ 
        ...updates, 
        updatedAt: sql`now()` 
      })
      .where(eq(customReports.id, reportId))
      .returning();
    return updatedReport || null;
  }

  async deleteCustomReport(reportId: string): Promise<boolean> {
    const [deletedReport] = await db
      .delete(customReports)
      .where(eq(customReports.id, reportId))
      .returning();
    return !!deletedReport;
  }


}

export const storage = new DatabaseStorage();
