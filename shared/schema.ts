import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
  uniqueIndex,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // employee, accountant, admin
  companyId: varchar("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  companyId: varchar("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseClaims = pgTable("expense_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestId: varchar("request_id").references(() => expenseRequests.id), // Link to original expense request
  title: varchar("title").notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  originalRequestAmount: decimal("original_request_amount", { precision: 10, scale: 2 }).default("0"), // Original requested amount
  extraAmount: decimal("extra_amount", { precision: 10, scale: 2 }).default("0"), // Amount exceeding original request
  currency: varchar("currency").notNull().default("INR"),
  advancePaymentId: varchar("advance_payment_id").references(() => advancePayments.id), // Link to advance
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).default("0"), // Amount from advance
  balancePayment: decimal("balance_payment", { precision: 10, scale: 2 }).notNull(), // Calculated: totalAmount - advanceAmount
  
  // Vendor integration for expense claims
  vendorId: varchar("vendor_id").references(() => vendors.id), // Link to vendor if claim is for vendor payment
  vendorInvoiceNumber: varchar("vendor_invoice_number"), // Vendor's invoice/bill number
  
  // Due date automation for vendor claims
  vendorDueDate: timestamp("vendor_due_date"), // Due date for vendor payment
  enableDueDateReminder: boolean("enable_due_date_reminder").default(false), // Enable automatic due date reminders
  dueDateReminderDays: integer("due_date_reminder_days").default(3), // Days before due date to send reminder
  lastDueDateReminderSent: timestamp("last_due_date_reminder_sent"), // Track when last due date reminder was sent
  
  // Multi-level approval workflow fields
  status: varchar("status").notNull().default("submitted"), // submitted, pending_manager, pending_admin, pending_head, pending_accounting, approved, rejected, payment_submitted, paid, processed
  currentApprovalLevel: varchar("current_approval_level").default("manager"), // manager, admin, head, accountant
  pendingWith: varchar("pending_with").references(() => users.id), // Current approver user ID
  workflowId: varchar("workflow_id").references(() => workflows.id), // Reference to the workflow being used
  
  // Payment processing fields
  utrNumber: varchar("utr_number"), // UTR number for payment tracking
  paymentDate: timestamp("payment_date"), // Actual payment date
  processedBy: varchar("processed_by").references(() => users.id), // Who processed the payment
  processedAt: timestamp("processed_at"), // When payment was processed
  
  // Audit trail fields
  submittedAt: timestamp("submitted_at").defaultNow(),
  approvedAt: timestamp("approved_at"), // Final approval timestamp
  paidAt: timestamp("paid_at"), // Legacy field for backward compatibility
  approvedBy: varchar("approved_by").references(() => users.id), // Final approver (accounting)
  
  // Employee profile data from external API
  employerName: varchar("employer_name"), // Employee initiated (for reports)
  employeeNumber: varchar("employee_number"), // Employee number (for reports)  
  employeeEmail: varchar("employee_email"), // Email (for reports)
  
  // OCR Bill Details - stores processed OCR data as JSON
  billDetails: jsonb("bill_details"), // Stores OCR extracted data (bill no, amount, date, vendor, etc.)
  
  // Azure Blob File Attachments - for expense claim supporting documents
  attachmentUrls: json("attachment_urls"), // Array of Azure Blob URLs for supporting documents
  attachmentCount: integer("attachment_count").default(0), // Count of attached files
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Approval History - tracks complete audit trail for multi-level approval workflow
export const approvalHistory = pgTable("approval_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").references(() => expenseClaims.id),
  paymentBatchId: varchar("payment_batch_id").references(() => paymentBatches.id), // Support payment batch approvals
  approverId: varchar("approver_id").notNull().references(() => users.id),
  approverRole: varchar("approver_role").notNull(), // manager, admin, head, accountant
  approverName: varchar("approver_name").notNull(), // Store name for transparency
  action: varchar("action").notNull(), // approved, rejected, returned, pending
  remarks: text("remarks"), // Comments/notes from approver
  previousStatus: varchar("previous_status"), // Status before this action
  newStatus: varchar("new_status"), // Status after this action  
  nextApprovalLevel: varchar("next_approval_level"), // Who's next in workflow
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseItems = pgTable("expense_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => expenseClaims.id),
  categoryId: varchar("category_id").references(() => expenseHeads.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  date: timestamp("date").notNull(),
  receiptUrl: varchar("receipt_url"),
  receiptFileName: varchar("receipt_file_name"),
  
  // Bill Information - extracted from OCR or manually entered
  billNo: varchar("bill_no"),
  billDate: timestamp("bill_date"),
  billAmount: decimal("bill_amount", { precision: 10, scale: 2 }),
  
  // Enhanced Bill Details for OCR data
  vendorName: varchar("vendor_name"), // Client/Vendor name from bill
  vendorAddress: text("vendor_address"), // Full vendor address
  vendorPan: varchar("vendor_pan"), // PAN number
  vendorGstin: varchar("vendor_gstin"), // GST number
  invoiceNumber: varchar("invoice_number"), // Full invoice number
  
  // GST breakdown fields
  cgstAmount: decimal("cgst_amount", { precision: 10, scale: 2 }),
  sgstAmount: decimal("sgst_amount", { precision: 10, scale: 2 }),
  igstAmount: decimal("igst_amount", { precision: 10, scale: 2 }),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }), // Total GST amount
  
  // Additional OCR extracted fields
  billDescription: text("bill_description"), // Description from bill
  cityPlace: varchar("city_place"), // City/Place from bill
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const directExpenses = pgTable("direct_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => expenseHeads.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  date: timestamp("date").notNull(),
  vendorName: varchar("vendor_name"),
  invoiceNumber: varchar("invoice_number"),
  receiptUrl: varchar("receipt_url"),
  status: varchar("status").notNull().default("pending"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  // Employee profile data from external API  
  employerName: varchar("employer_name"), // Employee initiated (for reports)
  employeeNumber: varchar("employee_number"), // Employee number (for reports)  
  employeeEmail: varchar("employee_email"), // Email (for reports)
  
  // Azure Blob File Attachments - for direct expense supporting documents
  attachmentUrls: json("attachment_urls"), // Array of Azure Blob URLs for supporting documents
  attachmentCount: integer("attachment_count").default(0), // Count of attached files
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseRequests = pgTable("expense_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // travel, cash_advance, advance_payment
  title: varchar("title").notNull(),
  description: text("description"),
  estimatedAmount: decimal("estimated_amount", { precision: 10, scale: 2 }),
  currency: varchar("currency").notNull().default("INR"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status").notNull().default("submitted"), // submitted, pending_manager, pending_admin, pending_head, pending_accountant, approved, rejected, paid
  
  // Workflow fields  
  currentApprovalLevel: varchar("current_approval_level").default("manager"), // manager, admin, head, accountant
  pendingWith: varchar("pending_with").references(() => users.id), // Current approver user ID
  workflowId: varchar("workflow_id").references(() => workflows.id), // Reference to the workflow being used
  
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  
  // Employee profile data from external API
  employerName: varchar("employer_name"), // Employee initiated (for reports)
  employeeNumber: varchar("employee_number"), // Employee number (for reports)  
  employeeEmail: varchar("employee_email"), // Email (for reports)
  
  // Azure Blob File Attachments - for expense request supporting documents
  attachmentUrls: json("attachment_urls"), // Array of Azure Blob URLs for supporting documents
  attachmentCount: integer("attachment_count").default(0), // Count of attached files
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for tracking advance payments
export const advancePayments = pgTable("advance_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => expenseRequests.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  paymentStatus: varchar("payment_status").notNull().default("pending"), // pending, paid
  paymentDate: timestamp("payment_date"),
  isSettled: boolean("is_settled").default(false), // true when linked to an expense claim
  createdAt: timestamp("created_at").defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  isAttached: boolean("is_attached").default(false),
  attachedToId: varchar("attached_to_id"), // can be expense_items.id or direct_expenses.id
  attachedToType: varchar("attached_to_type"), // 'expense_item' or 'direct_expense'
  createdAt: timestamp("created_at").defaultNow(),
});

// Banks for payment option selection
export const banks = pgTable("banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  accountNumber: varchar("account_number"),
  ifscCode: varchar("ifsc_code"),
  branchName: varchar("branch_name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== PARTY MASTER SYSTEM ==========

// Party Master - Vendor/Customer management
export const parties = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Information
  name: varchar("name").notNull(),
  partyType: varchar("party_type").notNull(), // vendor, customer, employee, etc.
  legalEntity: varchar("legal_entity"),
  keyContactPerson: varchar("key_contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  accountingLedger: varchar("accounting_ledger"),
  accountingCode: varchar("accounting_code"),
  linkToClaim: boolean("link_to_claim").default(false),
  isActive: boolean("is_active").default(true),
  
  // Tax Information
  pan: varchar("pan"),
  registerUnderMsme: boolean("register_under_msme").default(false),
  msmeNo: varchar("msme_no"),
  vendorTradeName: varchar("vendor_trade_name"),
  gstRegistrationType: varchar("gst_registration_type"),
  gstNo: varchar("gst_no"),
  state: varchar("state"),
  shippedFrom: varchar("shipped_from"),
  
  // Bank Details
  bankPartyName: varchar("bank_party_name"), // Party name according to bank
  bankName: varchar("bank_name"),
  bankAccountNumber: varchar("bank_account_number"),
  branchName: varchar("branch_name"),
  ifscCode: varchar("ifsc_code"),
  preferredPaymentMode: varchar("preferred_payment_mode"),
  preferredPaymentDispatchMode: varchar("preferred_payment_dispatch_mode"),
  bankAccountType: varchar("bank_account_type"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== TDS MASTER CONFIGURATION ==========

// TDS Master - Category wise TDS rates
export const tdsMaster = pgTable("tds_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull().unique(), // individual, company, contractor, professional, etc.
  categoryName: varchar("category_name").notNull(), // Display name
  defaultRate: decimal("default_rate", { precision: 5, scale: 2 }).notNull(), // Default TDS rate percentage
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== VENDOR MANAGEMENT SYSTEM ==========

// Vendors - Master vendor database
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Information
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email").notNull(),
  
  // Bank Details
  accountNumber: varchar("account_number").notNull(),
  ifscCode: varchar("ifsc_code").notNull(),
  bankName: varchar("bank_name").notNull(),
  bankBranch: varchar("bank_branch").notNull(),
  
  // Tax Details
  gstin: varchar("gstin"),
  pan: varchar("pan").notNull(),
  tdsCategory: varchar("tds_category"),
  msmeStatus: varchar("msme_status"), // msme, non_msme
  msmeNumber: varchar("msme_number"),
  
  // TDS Rate Configuration
  tdsRate: decimal("tds_rate", { precision: 5, scale: 2 }), // Current TDS rate (from master or custom)
  isLessRates: boolean("is_less_rates").default(false), // Toggle for custom rates
  customTdsRate: decimal("custom_tds_rate", { precision: 5, scale: 2 }), // Custom rate when is_less_rates is true
  tdsRateFromDate: timestamp("tds_rate_from_date"), // Custom rate validity from date
  tdsRateToDate: timestamp("tds_rate_to_date"), // Custom rate validity to date
  
  // Status and metadata
  status: varchar("status").notNull().default("active"), // active, inactive
  createdBy: varchar("created_by").references(() => users.id),
  
  // Payment tracking
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  lastPaymentDate: timestamp("last_payment_date"),
  lastPaymentUtr: varchar("last_payment_utr"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor Onboarding Requests - for approval workflow
export const vendorOnboardingRequests = pgTable("vendor_onboarding_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Vendor Information
  vendorName: varchar("vendor_name").notNull(),
  address: text("address").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email").notNull(),
  
  // Bank Details
  accountNumber: varchar("account_number").notNull(),
  ifscCode: varchar("ifsc_code").notNull(),
  bankName: varchar("bank_name").notNull(),
  bankBranch: varchar("bank_branch").notNull(),
  
  // Tax Details
  gstin: varchar("gstin"),
  pan: varchar("pan").notNull(),
  tdsCategory: varchar("tds_category"),
  msmeStatus: varchar("msme_status"), // msme, non_msme
  msmeNumber: varchar("msme_number"),
  
  // TDS Rate Configuration
  tdsRate: decimal("tds_rate", { precision: 5, scale: 2 }), // Current TDS rate (from master or custom)
  isLessRates: boolean("is_less_rates").default(false), // Toggle for custom rates
  customTdsRate: decimal("custom_tds_rate", { precision: 5, scale: 2 }), // Custom rate when is_less_rates is true
  tdsRateFromDate: timestamp("tds_rate_from_date"), // Custom rate validity from date
  tdsRateToDate: timestamp("tds_rate_to_date"), // Custom rate validity to date
  
  // Workflow fields
  status: varchar("status").notNull().default("pending"), // pending, admin_approved, finance_approved, approved, rejected
  currentApprovalLevel: varchar("current_approval_level").default("admin"), // admin, finance
  pendingWith: varchar("pending_with").references(() => users.id),
  
  // Request metadata
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Link to final vendor record
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Employee profile data from external API (for requester)
  employerName: varchar("employer_name"), // Employee initiated (for reports)
  employeeNumber: varchar("employee_number"), // Employee number (for reports)  
  employeeEmail: varchar("employee_email"), // Email (for reports)
  
  // Azure Blob File Attachments - for vendor onboarding supporting documents
  attachmentUrls: json("attachment_urls"), // Array of Azure Blob URLs for supporting documents
  attachmentCount: integer("attachment_count").default(0), // Count of attached files
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor Documents - for onboarding document uploads
export const vendorDocuments = pgTable("vendor_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  onboardingRequestId: varchar("onboarding_request_id").references(() => vendorOnboardingRequests.id),
  vendorId: varchar("vendor_id").references(() => vendors.id), // For existing vendors uploading new docs
  
  documentType: varchar("document_type").notNull(), // pan_card, gst_certificate, cancelled_cheque, contract_agreement, msme_certificate
  documentName: varchar("document_name").notNull(),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendor Payment History - detailed payment tracking
export const vendorPaymentHistory = pgTable("vendor_payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  paymentDate: timestamp("payment_date").notNull(),
  utrNumber: varchar("utr_number"),
  paymentMethod: varchar("payment_method").notNull(), // bank_transfer, check, cash
  
  // Linked to expense/invoice
  expenseClaimId: varchar("expense_claim_id").references(() => expenseClaims.id),
  directExpenseId: varchar("direct_expense_id").references(() => directExpenses.id),
  paymentBatchId: varchar("payment_batch_id").references(() => paymentBatches.id),
  
  // Payment processing
  processedBy: varchar("processed_by").notNull().references(() => users.id),
  status: varchar("status").notNull().default("paid"), // paid, pending, failed
  
  description: text("description"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== PETTY CASH MANAGEMENT SYSTEM ==========

// Cashboxes - Digital petty cash funds
export const cashboxes = pgTable("cashboxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  cashierId: varchar("cashier_id").notNull().references(() => users.id),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  openingBalanceDate: timestamp("opening_balance_date"),
  accountingCode: varchar("accounting_code"),
  accountingLedger: varchar("accounting_ledger"),
  currency: varchar("currency").notNull().default("INR"),
  status: varchar("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ledger Entries - Daily balance records for audit trail
export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cashboxId: varchar("cashbox_id").notNull().references(() => cashboxes.id),
  date: timestamp("date").notNull(),
  openingBalance: decimal("opening_balance", { precision: 10, scale: 2 }).notNull(),
  debit: decimal("debit", { precision: 10, scale: 2 }).notNull().default("0"), // Money added
  credit: decimal("credit", { precision: 10, scale: 2 }).notNull().default("0"), // Money removed
  closingBalance: decimal("closing_balance", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint: one ledger entry per cashbox per date
  uniqueIndex("unique_cashbox_date").on(table.cashboxId, table.date)
]);

// Petty Cash Transactions - All events that change cashbox balance
export const pettyCashTransactions = pgTable("petty_cash_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cashboxId: varchar("cashbox_id").notNull().references(() => cashboxes.id),
  type: varchar("type").notNull(), // receipt, payment, fund_transfer_in, fund_transfer_out, initial_fund, iou_take, iou_repay
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  description: text("description").notNull(),
  payee: varchar("payee"), // Name of person/entity
  payeeType: varchar("payee_type"), // employee, vendor, party
  payeeId: varchar("payee_id").references(() => users.id), // If payee is an employee
  category: varchar("category"), // Office supplies, transport, etc.
  receiptUrl: varchar("receipt_url"), // Supporting document
  receiptFileName: varchar("receipt_file_name"),
  
  // For fund transfers
  transferToCashboxId: varchar("transfer_to_cashbox_id").references(() => cashboxes.id),
  transferFromCashboxId: varchar("transfer_from_cashbox_id").references(() => cashboxes.id),
  
  // For IOUs
  iouStatus: varchar("iou_status"), // outstanding, repaid (for type = iou_take)
  linkedIouId: varchar("linked_iou_id"), // Links iou_repay to iou_take - self reference resolved later
  
  transactionDate: timestamp("transaction_date").notNull(),
  recordedBy: varchar("recorded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Petty Cash Receipts - for Receipt Entry functionality
export const pettyCashReceipts = pgTable("petty_cash_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  receiptType: varchar("receipt_type").notNull(), // party, employee
  receivedFromId: varchar("received_from_id"), // references users.id for employees or null for parties
  receivedFromName: varchar("received_from_name").notNull(), // name of party or employee
  openAdvanceId: varchar("open_advance_id").references(() => advancePayments.id),
  remainingAdvance: decimal("remaining_advance", { precision: 10, scale: 2 }).default("0"),
  purpose: text("purpose"),
  amountReceived: decimal("amount_received", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  paymentOption: varchar("payment_option").notNull(), // bank, cashbox
  bankId: varchar("bank_id").references(() => banks.id), // required if paymentOption = bank
  documentUrl: varchar("document_url"), // uploaded supporting document
  documentFileName: varchar("document_file_name"),
  documentFileSize: integer("document_file_size"),
  recordedBy: varchar("recorded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Batches - for Initiate Payments functionality
export const paymentBatches = pgTable("payment_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: varchar("batch_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  status: varchar("status").notNull().default("initiated"), // initiated, pending_manager, pending_admin, pending_head, pending_accountant, approved, released, completed, cancelled, rejected
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  // Multi-level approval workflow fields
  currentApprovalLevel: varchar("current_approval_level").default("manager"), // manager, admin, head, accountant
  pendingWith: varchar("pending_with").references(() => users.id), // Current approver user ID
  
  // Payment processing fields  
  releasedBy: varchar("released_by").references(() => users.id),
  releasedAt: timestamp("released_at"),
  approvedBy: varchar("approved_by").references(() => users.id), // Final approver
  approvedAt: timestamp("approved_at"), // Final approval timestamp
  
  paymentMethod: varchar("payment_method").notNull(), // bank_transfer, check, cash
  bankDetails: text("bank_details"), // JSON string with bank details
  notes: text("notes"),
  
  // Azure Blob File Attachments - for payment processing documents and receipts
  attachmentUrls: json("attachment_urls"), // Array of Azure Blob URLs for payment documents
  attachmentCount: integer("attachment_count").default(0), // Count of attached files
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Batch Items - links expense claims to payment batches
export const paymentBatchItems = pgTable("payment_batch_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id").notNull().references(() => paymentBatches.id),
  expenseClaimId: varchar("expense_claim_id").references(() => expenseClaims.id),
  directExpenseId: varchar("direct_expense_id").references(() => directExpenses.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payeeType: varchar("payee_type").notNull(), // employee, vendor
  payeeName: varchar("payee_name").notNull(),
  bankAccount: varchar("bank_account"),
  ifscCode: varchar("ifsc_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Card Statements - for Add Card Statement functionality
export const cardStatements = pgTable("card_statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: varchar("card_number").notNull(), // last 4 digits only
  cardType: varchar("card_type").notNull(), // credit, debit
  bankName: varchar("bank_name").notNull(),
  statementMonth: integer("statement_month").notNull(), // 1-12
  statementYear: integer("statement_year").notNull(),
  openingBalance: decimal("opening_balance", { precision: 10, scale: 2 }).default("0"),
  closingBalance: decimal("closing_balance", { precision: 10, scale: 2 }).notNull(),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status").notNull().default("uploaded"), // uploaded, reconciled, paid
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  statementFile: varchar("statement_file"), // file path
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card Transactions - individual transactions from card statements
export const cardTransactions = pgTable("card_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  statementId: varchar("statement_id").notNull().references(() => cardStatements.id),
  transactionDate: timestamp("transaction_date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category"),
  merchantName: varchar("merchant_name"),
  isReconciled: boolean("is_reconciled").default(false),
  matchedExpenseId: varchar("matched_expense_id"), // links to expense_items or direct_expenses
  matchedExpenseType: varchar("matched_expense_type"), // expense_item, direct_expense
  createdAt: timestamp("created_at").defaultNow(),
});

// Card Payments - for paying credit card bills
export const cardPayments = pgTable("card_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  statementId: varchar("statement_id").notNull().references(() => cardStatements.id),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: varchar("payment_method").notNull(), // online, check, bank_transfer
  referenceNumber: varchar("reference_number"),
  bankAccount: varchar("bank_account"), // company bank account used
  status: varchar("status").notNull().default("pending"), // pending, completed, failed
  processedBy: varchar("processed_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank Advice - for Employee and Vendor Bank Advice reports
export const bankAdvice = pgTable("bank_advice", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adviceNumber: varchar("advice_number").notNull().unique(),
  adviceType: varchar("advice_type").notNull(), // employee, vendor
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("INR"),
  paymentDate: timestamp("payment_date").notNull(),
  batchId: varchar("batch_id").references(() => paymentBatches.id), // optional link to payment batch
  status: varchar("status").notNull().default("generated"), // generated, sent_to_bank, processed
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  fileUrl: varchar("file_url"), // generated report file
  bankDetails: text("bank_details"), // JSON with bank processing details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank Advice Items - individual payment instructions
export const bankAdviceItems = pgTable("bank_advice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adviceId: varchar("advice_id").notNull().references(() => bankAdvice.id),
  payeeId: varchar("payee_id").references(() => users.id), // for employees
  payeeName: varchar("payee_name").notNull(),
  payeeType: varchar("payee_type").notNull(), // employee, vendor
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  accountNumber: varchar("account_number").notNull(),
  ifscCode: varchar("ifsc_code").notNull(),
  bankName: varchar("bank_name"),
  purpose: text("purpose").notNull(),
  expenseClaimId: varchar("expense_claim_id").references(() => expenseClaims.id),
  directExpenseId: varchar("direct_expense_id").references(() => directExpenses.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  expenseClaims: many(expenseClaims),
  expenseRequests: many(expenseRequests),
  receipts: many(receipts),
  directExpenses: many(directExpenses),
  advancePayments: many(advancePayments),
  paymentBatches: many(paymentBatches),
  cardStatements: many(cardStatements),
  cardPayments: many(cardPayments),
  bankAdvice: many(bankAdvice),
  pettyCashReceipts: many(pettyCashReceipts),
  managedCashboxes: many(cashboxes, { relationName: "cashier" }),
  pettyCashTransactions: many(pettyCashTransactions),
  dashboardWidgets: many(dashboardWidgets),
}));

export const banksRelations = relations(banks, ({ many }) => ({
  pettyCashReceipts: many(pettyCashReceipts),
}));

export const pettyCashReceiptsRelations = relations(pettyCashReceipts, ({ one }) => ({
  receivedFrom: one(users, {
    fields: [pettyCashReceipts.receivedFromId],
    references: [users.id],
  }),
  openAdvance: one(advancePayments, {
    fields: [pettyCashReceipts.openAdvanceId],
    references: [advancePayments.id],
  }),
  bank: one(banks, {
    fields: [pettyCashReceipts.bankId],
    references: [banks.id],
  }),
  recordedBy: one(users, {
    fields: [pettyCashReceipts.recordedBy],
    references: [users.id],
  }),
}));

export const expenseClaimsRelations = relations(expenseClaims, ({ one, many }) => ({
  user: one(users, {
    fields: [expenseClaims.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [expenseClaims.approvedBy],
    references: [users.id],
  }),
  request: one(expenseRequests, {
    fields: [expenseClaims.requestId],
    references: [expenseRequests.id],
  }),
  advancePayment: one(advancePayments, {
    fields: [expenseClaims.advancePaymentId],
    references: [advancePayments.id],
  }),
  items: many(expenseItems),
  paymentBatchItems: many(paymentBatchItems),
  bankAdviceItems: many(bankAdviceItems),
}));

export const expenseItemsRelations = relations(expenseItems, ({ one }) => ({
  claim: one(expenseClaims, {
    fields: [expenseItems.claimId],
    references: [expenseClaims.id],
  }),
  category: one(expenseCategories, {
    fields: [expenseItems.categoryId],
    references: [expenseCategories.id],
  }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [expenseCategories.companyId],
    references: [companies.id],
  }),
  expenseItems: many(expenseItems),
  directExpenses: many(directExpenses),
}));

export const expenseRequestsRelations = relations(expenseRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [expenseRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [expenseRequests.approvedBy],
    references: [users.id],
  }),
  advancePayments: many(advancePayments),
}));

export const advancePaymentsRelations = relations(advancePayments, ({ one, many }) => ({
  request: one(expenseRequests, {
    fields: [advancePayments.requestId],
    references: [expenseRequests.id],
  }),
  user: one(users, {
    fields: [advancePayments.userId],
    references: [users.id],
  }),
  expenseClaims: many(expenseClaims),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
}));

export const directExpensesRelations = relations(directExpenses, ({ one, many }) => ({
  category: one(expenseCategories, {
    fields: [directExpenses.categoryId],
    references: [expenseCategories.id],
  }),
  creator: one(users, {
    fields: [directExpenses.createdBy],
    references: [users.id],
  }),
  paymentBatchItems: many(paymentBatchItems),
  bankAdviceItems: many(bankAdviceItems),
}));

// Payment module relations
export const paymentBatchesRelations = relations(paymentBatches, ({ one, many }) => ({
  creator: one(users, {
    fields: [paymentBatches.createdBy],
    references: [users.id],
  }),
  releaser: one(users, {
    fields: [paymentBatches.releasedBy],
    references: [users.id],
  }),
  items: many(paymentBatchItems),
  bankAdvice: many(bankAdvice),
}));

export const paymentBatchItemsRelations = relations(paymentBatchItems, ({ one }) => ({
  batch: one(paymentBatches, {
    fields: [paymentBatchItems.batchId],
    references: [paymentBatches.id],
  }),
  expenseClaim: one(expenseClaims, {
    fields: [paymentBatchItems.expenseClaimId],
    references: [expenseClaims.id],
  }),
  directExpense: one(directExpenses, {
    fields: [paymentBatchItems.directExpenseId],
    references: [directExpenses.id],
  }),
}));

export const cardStatementsRelations = relations(cardStatements, ({ one, many }) => ({
  uploader: one(users, {
    fields: [cardStatements.uploadedBy],
    references: [users.id],
  }),
  transactions: many(cardTransactions),
  payments: many(cardPayments),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  statement: one(cardStatements, {
    fields: [cardTransactions.statementId],
    references: [cardStatements.id],
  }),
}));

export const cardPaymentsRelations = relations(cardPayments, ({ one }) => ({
  statement: one(cardStatements, {
    fields: [cardPayments.statementId],
    references: [cardStatements.id],
  }),
  processor: one(users, {
    fields: [cardPayments.processedBy],
    references: [users.id],
  }),
}));

export const bankAdviceRelations = relations(bankAdvice, ({ one, many }) => ({
  generator: one(users, {
    fields: [bankAdvice.generatedBy],
    references: [users.id],
  }),
  batch: one(paymentBatches, {
    fields: [bankAdvice.batchId],
    references: [paymentBatches.id],
  }),
  items: many(bankAdviceItems),
}));

export const bankAdviceItemsRelations = relations(bankAdviceItems, ({ one }) => ({
  advice: one(bankAdvice, {
    fields: [bankAdviceItems.adviceId],
    references: [bankAdvice.id],
  }),
  payee: one(users, {
    fields: [bankAdviceItems.payeeId],
    references: [users.id],
  }),
  expenseClaim: one(expenseClaims, {
    fields: [bankAdviceItems.expenseClaimId],
    references: [expenseClaims.id],
  }),
  directExpense: one(directExpenses, {
    fields: [bankAdviceItems.directExpenseId],
    references: [directExpenses.id],
  }),
}));

// Petty Cash Management Relations
export const cashboxesRelations = relations(cashboxes, ({ one, many }) => ({
  cashier: one(users, {
    fields: [cashboxes.cashierId],
    references: [users.id],
    relationName: "cashier",
  }),
  ledgerEntries: many(ledgerEntries),
  transactions: many(pettyCashTransactions),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  cashbox: one(cashboxes, {
    fields: [ledgerEntries.cashboxId],
    references: [cashboxes.id],
  }),
}));

export const pettyCashTransactionsRelations = relations(pettyCashTransactions, ({ one }) => ({
  cashbox: one(cashboxes, {
    fields: [pettyCashTransactions.cashboxId],
    references: [cashboxes.id],
  }),
  payeeUser: one(users, {
    fields: [pettyCashTransactions.payeeId],
    references: [users.id],
  }),
  recorder: one(users, {
    fields: [pettyCashTransactions.recordedBy],
    references: [users.id],
  }),
  transferToCashbox: one(cashboxes, {
    fields: [pettyCashTransactions.transferToCashboxId],
    references: [cashboxes.id],
    relationName: "transferTo",
  }),
  transferFromCashbox: one(cashboxes, {
    fields: [pettyCashTransactions.transferFromCashboxId],
    references: [cashboxes.id],
    relationName: "transferFrom",
  }),
  linkedIou: one(pettyCashTransactions, {
    fields: [pettyCashTransactions.linkedIouId],
    references: [pettyCashTransactions.id],
    relationName: "iouLink",
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Approval History Types
export type ApprovalHistory = typeof approvalHistory.$inferSelect;
export type InsertApprovalHistory = typeof approvalHistory.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

// Expense category insert schema
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true,
});
export type ExpenseClaim = typeof expenseClaims.$inferSelect;
export type InsertExpenseClaim = typeof expenseClaims.$inferInsert;
export type ExpenseItem = typeof expenseItems.$inferSelect;
export type InsertExpenseItem = typeof expenseItems.$inferInsert;
export type DirectExpense = typeof directExpenses.$inferSelect;
export type InsertDirectExpense = typeof directExpenses.$inferInsert;
export type ExpenseRequest = typeof expenseRequests.$inferSelect;
export type InsertExpenseRequest = typeof expenseRequests.$inferInsert;
export type AdvancePayment = typeof advancePayments.$inferSelect;
export type InsertAdvancePayment = typeof advancePayments.$inferInsert;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;
export type Bank = typeof banks.$inferSelect;
export type InsertBank = typeof banks.$inferInsert;
export type PettyCashReceipt = typeof pettyCashReceipts.$inferSelect;
export type InsertPettyCashReceipt = typeof pettyCashReceipts.$inferInsert;

// Payment module types
export type PaymentBatch = typeof paymentBatches.$inferSelect;
export type InsertPaymentBatch = typeof paymentBatches.$inferInsert;
export type PaymentBatchItem = typeof paymentBatchItems.$inferSelect;
export type InsertPaymentBatchItem = typeof paymentBatchItems.$inferInsert;
export type CardStatement = typeof cardStatements.$inferSelect;
export type InsertCardStatement = typeof cardStatements.$inferInsert;
export type CardTransaction = typeof cardTransactions.$inferSelect;
export type InsertCardTransaction = typeof cardTransactions.$inferInsert;
export type CardPayment = typeof cardPayments.$inferSelect;
export type InsertCardPayment = typeof cardPayments.$inferInsert;
export type BankAdvice = typeof bankAdvice.$inferSelect;
export type InsertBankAdvice = typeof bankAdvice.$inferInsert;
export type BankAdviceItem = typeof bankAdviceItems.$inferSelect;
export type InsertBankAdviceItem = typeof bankAdviceItems.$inferInsert;

// Petty Cash Management Types
export type Cashbox = typeof cashboxes.$inferSelect;
export type InsertCashbox = typeof cashboxes.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = typeof ledgerEntries.$inferInsert;
export type PettyCashTransaction = typeof pettyCashTransactions.$inferSelect;
export type InsertPettyCashTransaction = typeof pettyCashTransactions.$inferInsert;

// Schemas
export const insertExpenseClaimSchema = createInsertSchema(expenseClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalAmount: z.coerce.number(),
  originalRequestAmount: z.coerce.number().optional(),
  extraAmount: z.coerce.number().optional(),
  advanceAmount: z.coerce.number().optional(),
  balancePayment: z.coerce.number(),
});

export const insertExpenseItemSchema = createInsertSchema(expenseItems).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number(),
  date: z.coerce.date(),
  billDate: z.coerce.date().optional(),
  billAmount: z.coerce.number().optional(),
  cgstAmount: z.coerce.number().optional(),
  sgstAmount: z.coerce.number().optional(),
  igstAmount: z.coerce.number().optional(),
  gstAmount: z.coerce.number().optional(),
});

export const insertDirectExpenseSchema = createInsertSchema(directExpenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number(),
  date: z.coerce.date(),
  categoryId: z.string().optional(),
});

export const insertExpenseRequestSchema = createInsertSchema(expenseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estimatedAmount: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const insertAdvancePaymentSchema = createInsertSchema(advancePayments).omit({
  id: true,
  createdAt: true,
}).extend({
  approvedAmount: z.coerce.number(),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
}).extend({
  fileSize: z.coerce.number().optional(),
});

export const insertBankSchema = createInsertSchema(banks).omit({
  id: true,
  createdAt: true,
});

export const insertPettyCashReceiptSchema = createInsertSchema(pettyCashReceipts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amountReceived: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  remainingAdvance: z.coerce.number().optional(),
  documentFileSize: z.coerce.number().optional(),
});

// Approval History Schema
export const insertApprovalHistorySchema = createInsertSchema(approvalHistory).omit({
  id: true,
  createdAt: true,
});

// Payment module schemas
export const insertPaymentBatchSchema = createInsertSchema(paymentBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalAmount: z.coerce.number(),
});

export const insertPaymentBatchItemSchema = createInsertSchema(paymentBatchItems).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number(),
});

export const insertCardStatementSchema = createInsertSchema(cardStatements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  openingBalance: z.coerce.number().optional(),
  closingBalance: z.coerce.number(),
  totalSpent: z.coerce.number(),
  statementMonth: z.coerce.number().min(1).max(12),
  statementYear: z.coerce.number(),
  dueDate: z.coerce.date(),
});

export const insertCardTransactionSchema = createInsertSchema(cardTransactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number(),
  transactionDate: z.coerce.date(),
});

export const insertCardPaymentSchema = createInsertSchema(cardPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  paymentAmount: z.coerce.number(),
  paymentDate: z.coerce.date(),
});

export const insertBankAdviceSchema = createInsertSchema(bankAdvice).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalAmount: z.coerce.number(),
  paymentDate: z.coerce.date(),
});

export const insertBankAdviceItemSchema = createInsertSchema(bankAdviceItems).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number(),
});

// Petty Cash Management Schemas
export const insertCashboxSchema = createInsertSchema(cashboxes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentBalance: z.coerce.number(),
  openingBalanceDate: z.coerce.date().optional(),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  openingBalance: z.coerce.number(),
  debit: z.coerce.number(),
  credit: z.coerce.number(),
  closingBalance: z.coerce.number(),
  date: z.coerce.date(),
});

export const insertPettyCashTransactionSchema = createInsertSchema(pettyCashTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.coerce.number(),
  transactionDate: z.coerce.date(),
});

// Party Master Schemas
export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Transform empty strings to null for optional fields
  legalEntity: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  keyContactPerson: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  email: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  phone: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  address: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  accountingLedger: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  accountingCode: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  pan: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  msmeNo: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  vendorTradeName: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  gstRegistrationType: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  gstNo: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  state: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  shippedFrom: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  bankPartyName: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  bankName: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  bankAccountNumber: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  branchName: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  ifscCode: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  preferredPaymentMode: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  preferredPaymentDispatchMode: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  bankAccountType: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
});

// Payment module schema types
export type InsertPaymentBatchSchema = z.infer<typeof insertPaymentBatchSchema>;
export type InsertPaymentBatchItemSchema = z.infer<typeof insertPaymentBatchItemSchema>;
export type InsertCardStatementSchema = z.infer<typeof insertCardStatementSchema>;
export type InsertCardTransactionSchema = z.infer<typeof insertCardTransactionSchema>;
export type InsertCardPaymentSchema = z.infer<typeof insertCardPaymentSchema>;
export type InsertBankAdviceSchema = z.infer<typeof insertBankAdviceSchema>;
export type InsertBankAdviceItemSchema = z.infer<typeof insertBankAdviceItemSchema>;

// Party Master types
export type Party = typeof parties.$inferSelect;
export type InsertParty = z.infer<typeof insertPartySchema>;

// Vendor Management schema exports
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorOnboardingRequestSchema = createInsertSchema(vendorOnboardingRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorDocumentSchema = createInsertSchema(vendorDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertVendorPaymentHistorySchema = createInsertSchema(vendorPaymentHistory).omit({
  id: true,
  createdAt: true,
});

//Cost Centre Configuration table
export const costCentreConfigs = pgTable("cost_centre_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull(), // From token
  type: varchar("type").notNull().default("single"), // single, multiple
  
  // Cost Categories
  costCategory1Id: varchar("cost_category_1_id"),
  costCategory1Name: varchar("cost_category_1_name"),
  costCategory1TallyIntegration: boolean("cost_category_1_tally_integration").default(false),
  
  costCategory2Id: varchar("cost_category_2_id"),
  costCategory2Name: varchar("cost_category_2_name"),
  costCategory2TallyIntegration: boolean("cost_category_2_tally_integration").default(false),
  
  costCategory3Id: varchar("cost_category_3_id"),
  costCategory3Name: varchar("cost_category_3_name"),
  costCategory3TallyIntegration: boolean("cost_category_3_tally_integration").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCostCentreConfigSchema = createInsertSchema(costCentreConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========== OCR FEATURE TABLES ==========

// OCR Results - Store extracted data from receipts/bills with confirmation status
export const ocrResults = pgTable("ocr_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Link to the source file/document
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type").notNull(), // image/jpeg, image/png, application/pdf
  fileSize: integer("file_size"), // File size in bytes
  
  // OCR processing status
  status: varchar("status").notNull().default("processing"), // processing, completed, failed, confirmed
  processingStartedAt: timestamp("processing_started_at").defaultNow(),
  processingCompletedAt: timestamp("processing_completed_at"),
  errorMessage: text("error_message"), // Error details if processing failed
  
  // Extracted data fields (flexible JSON structure)
  extractedData: jsonb("extracted_data"), // Raw extracted data from OCR
  confirmedData: jsonb("confirmed_data"), // User-confirmed/edited data
  
  // Processing details
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }), // OCR confidence score
  processingMethod: varchar("processing_method").notNull().default("tesseract"), // tesseract, openai, etc.
  processingTimeMs: integer("processing_time_ms").notNull().default(0), // Time taken to process
  tokensUsed: integer("tokens_used"), // Tokens used for AI-based OCR
  
  // Common extracted fields (for easy querying)
  amount: decimal("amount", { precision: 10, scale: 2 }), // Extracted amount
  date: timestamp("date"), // Extracted date
  vendorName: varchar("vendor_name"), // Extracted vendor/merchant name
  invoiceNumber: varchar("invoice_number"), // Extracted invoice/bill number
  description: text("description"), // Extracted description/items
  
  // User confirmation tracking
  isConfirmed: boolean("is_confirmed").default(false),
  confirmedBy: varchar("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  
  // Claim title mapping for pre-saved OCR data
  claimTitle: varchar("claim_title"), // Title to map OCR data to expense forms
  
  // Link to created records (after confirmation)
  expenseClaimId: varchar("expense_claim_id").references(() => expenseClaims.id),
  directExpenseId: varchar("direct_expense_id").references(() => directExpenses.id),
  billMasterId: varchar("bill_master_id"), // For bill master entries
  
  // Metadata
  userId: varchar("user_id").notNull().references(() => users.id),
  orgId: varchar("org_id").notNull(), // Organization context
  module: varchar("module").notNull(), // employee_claim, vendor_claim, direct_expense, bills
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OCR Field Mapping - Store field mapping configurations for different document types
export const ocrFieldMappings = pgTable("ocr_field_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  orgId: varchar("org_id").notNull(),
  module: varchar("module").notNull(), // employee_claim, vendor_claim, direct_expense, bills
  documentType: varchar("document_type").notNull(), // receipt, invoice, bill, etc.
  
  // Field mapping rules (JSON structure defining how to extract and map fields)
  mappingRules: jsonb("mapping_rules").notNull(),
  
  // Configuration
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // Higher priority mappings are tried first
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OCR Processing Logs - Track OCR processing attempts and performance
export const ocrProcessingLogs = pgTable("ocr_processing_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  ocrResultId: varchar("ocr_result_id").notNull().references(() => ocrResults.id),
  
  // Processing details
  processor: varchar("processor").notNull().default("openai"), // openai, google_vision, etc.
  model: varchar("model"), // gpt-5, etc.
  processingTimeMs: integer("processing_time_ms"), // Processing duration
  
  // API response details
  rawResponse: jsonb("raw_response"), // Full API response for debugging
  confidence: decimal("confidence", { precision: 5, scale: 4 }), // Confidence score if available
  tokensUsed: integer("tokens_used"), // For cost tracking
  
  // Status
  success: boolean("success").notNull(),
  errorCode: varchar("error_code"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for OCR tables
export const ocrResultsRelations = relations(ocrResults, ({ one, many }) => ({
  uploadedByUser: one(users, {
    fields: [ocrResults.userId],
    references: [users.id],
  }),
  confirmedByUser: one(users, {
    fields: [ocrResults.confirmedBy],
    references: [users.id],
  }),
  expenseClaim: one(expenseClaims, {
    fields: [ocrResults.expenseClaimId],
    references: [expenseClaims.id],
  }),
  directExpense: one(directExpenses, {
    fields: [ocrResults.directExpenseId],
    references: [directExpenses.id],
  }),
  processingLogs: many(ocrProcessingLogs),
}));

export const ocrFieldMappingsRelations = relations(ocrFieldMappings, ({ one }) => ({
  createdByUser: one(users, {
    fields: [ocrFieldMappings.createdBy],
    references: [users.id],
  }),
}));

export const ocrProcessingLogsRelations = relations(ocrProcessingLogs, ({ one }) => ({
  ocrResult: one(ocrResults, {
    fields: [ocrProcessingLogs.ocrResultId],
    references: [ocrResults.id],
  }),
}));

// Schema types for OCR
export const insertOcrResultSchema = createInsertSchema(ocrResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOcrFieldMappingSchema = createInsertSchema(ocrFieldMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOcrProcessingLogSchema = createInsertSchema(ocrProcessingLogs).omit({
  id: true,
  createdAt: true,
});

export type OcrResult = typeof ocrResults.$inferSelect;
export type InsertOcrResult = z.infer<typeof insertOcrResultSchema>;
export type OcrFieldMapping = typeof ocrFieldMappings.$inferSelect;
export type InsertOcrFieldMapping = z.infer<typeof insertOcrFieldMappingSchema>;
export type OcrProcessingLog = typeof ocrProcessingLogs.$inferSelect;
export type InsertOcrProcessingLog = z.infer<typeof insertOcrProcessingLogSchema>;

// Vendor Management types
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type VendorOnboardingRequest = typeof vendorOnboardingRequests.$inferSelect;
export type InsertVendorOnboardingRequest = z.infer<typeof insertVendorOnboardingRequestSchema>;
export type VendorDocument = typeof vendorDocuments.$inferSelect;
export type InsertVendorDocument = z.infer<typeof insertVendorDocumentSchema>;
export type VendorPaymentHistory = typeof vendorPaymentHistory.$inferSelect;
export type InsertVendorPaymentHistory = z.infer<typeof insertVendorPaymentHistorySchema>;

// Cost Distributions table for expense claims
export const costDistributions = pgTable("cost_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseClaimId: varchar("expense_claim_id").notNull().references(() => expenseClaims.id, { onDelete: "cascade" }),
  costCenterId: varchar("cost_center_id").notNull(), // The ID from external API (location id, department id, etc.)
  costCenterName: varchar("cost_center_name").notNull(), // Display name (location name, department name, etc.)
  costCenterType: varchar("cost_center_type").notNull(), // Type: location, department, project, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }), // Store original amount if modified by approver
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCostDistributionSchema = createInsertSchema(costDistributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  originalAmount: true, // This is set by the approver, not during creation
});

// Cost Centre Config types
export type CostCentreConfig = typeof costCentreConfigs.$inferSelect;
export type InsertCostCentreConfig = z.infer<typeof insertCostCentreConfigSchema>;

// Cost Distribution types
export type CostDistribution = typeof costDistributions.$inferSelect;
export type InsertCostDistribution = z.infer<typeof insertCostDistributionSchema>;

// ===== WORKFLOW SYSTEM TABLES =====

// Roles - Configurable roles for workflow management
export const workflowRoles = pgTable("workflow_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Manager", "Finance Head", "Admin" - NOT unique due to multi-tenancy
  description: text("description"),
  menuKeys: text("menu_keys"), // JSON array of menu keys this role can access
  companyId: varchar("company_id").notNull().references(() => companies.id), // Multi-tenant security
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflows - Configurable approval workflows
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Standard Expense Approval", "High Value Payment Approval"
  description: text("description"),
  processTypes: text("process_types").notNull(), // JSON array: ["request", "claim", "payment", "vendor"]
  approvalConditionType: varchar("approval_condition_type").notNull().default("process-based"), // "process-based", "monetary-threshold", "combined"
  companyId: varchar("company_id").notNull().references(() => companies.id), // Multi-tenant security
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Default workflow for process types
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Levels - Multi-level approval structure
export const workflowLevels = pgTable("workflow_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  level: integer("level").notNull(), // 1, 2, 3... (Level 1, Level 2, etc.)
  roleId: varchar("role_id").notNull().references(() => workflowRoles.id),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }), // Optional amount thresholds
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  isRequired: boolean("is_required").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow Assignments - Map workflows to specific processes/vendors/expense heads
// Bill Master Configuration
export const billMasterTypes = pgTable("bill_master_types", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const billMasterFields = pgTable("bill_master_fields", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  billTypeId: varchar("bill_type_id", { length: 255 }).references(() => billMasterTypes.id, { onDelete: "cascade" }).notNull(),
  fieldName: varchar("field_name", { length: 255 }).notNull(),
  fieldLabel: varchar("field_label", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(), // text, number, date, select, checkbox, textarea, file, email, phone, currency
  isRequired: boolean("is_required").default(false),
  isVisible: boolean("is_visible").default(true),
  fieldOrder: integer("field_order").default(1),
  placeholder: varchar("placeholder", { length: 255 }),
  helperText: text("helper_text"),
  defaultValue: text("default_value"),
  validationRules: json("validation_rules"), // JSON object for validation like min, max, pattern
  fieldOptions: json("field_options"), // For select fields, checkboxes
  width: varchar("width", { length: 20 }).default("full"), // full, half, third, quarter
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const workflowAssignments = pgTable("workflow_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  processType: varchar("process_type").notNull(), // "request", "claim", "payment", "vendor"
  vendorId: varchar("vendor_id").references(() => vendors.id), // Optional: specific vendor
  expenseHeadId: varchar("expense_head_id").references(() => expenseCategories.id), // Optional: specific expense category
  companyId: varchar("company_id").notNull().references(() => companies.id), // Multi-tenant security
  isDefault: boolean("is_default").notNull().default(false), // Default for this process type
  priority: integer("priority").notNull().default(0), // Higher priority = higher precedence
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced approval tracking for workflow system
export const workflowInstances = pgTable("workflow_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull(), // ID of claim/request/payment/vendor
  entityType: varchar("entity_type").notNull(), // "claim", "request", "payment", "vendor"
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id),
  currentLevel: integer("current_level").notNull().default(1),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected, returned
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== WORKFLOW SCHEMA EXPORTS =====

export const insertWorkflowRoleSchema = createInsertSchema(workflowRoles).omit({
  id: true,
  companyId: true, // Automatically set by backend based on user's company
  createdAt: true,
  updatedAt: true,
}).extend({
  menuKeys: z.string().optional().refine((val) => {
    if (!val) return true; // Allow empty/null
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.every(key => typeof key === 'string');
    } catch {
      return false;
    }
  }, {
    message: "menuKeys must be a valid JSON array of strings"
  })
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  companyId: true, // Automatically set by backend based on user's company
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowLevelSchema = createInsertSchema(workflowLevels).omit({
  id: true,
  workflowId: true, // Automatically set by backend when creating workflow
  createdAt: true,
});

export const insertWorkflowAssignmentSchema = createInsertSchema(workflowAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WorkflowRole = typeof workflowRoles.$inferSelect;
export type InsertWorkflowRole = z.infer<typeof insertWorkflowRoleSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowLevel = typeof workflowLevels.$inferSelect;
export type InsertWorkflowLevel = z.infer<typeof insertWorkflowLevelSchema>;

export type WorkflowAssignment = typeof workflowAssignments.$inferSelect;
export type InsertWorkflowAssignment = z.infer<typeof insertWorkflowAssignmentSchema>;

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = z.infer<typeof insertWorkflowInstanceSchema>;

// Process Master - Define all available process types for workflow mapping
export const processMaster = pgTable("process_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processType: varchar("process_type").notNull().unique(), // "request", "claim", "payment", "vendor", etc.
  displayName: varchar("display_name").notNull(), // "Expense Request", "Expense Claim", etc.
  description: text("description"),
  defaultWorkflowId: varchar("default_workflow_id").references(() => workflows.id), // Default workflow for this process type
  autoApproveWhenNoWorkflow: boolean("auto_approve_when_no_workflow").notNull().default(true), // Case 2: Auto-approve when no workflow
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProcessMasterSchema = createInsertSchema(processMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProcessMaster = typeof processMaster.$inferSelect;
export type InsertProcessMaster = z.infer<typeof insertProcessMasterSchema>;

// Expense Groups table
export const expenseGroups = pgTable("expense_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpenseGroupSchema = createInsertSchema(expenseGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Expense Heads table
export const expenseHeads = pgTable("expense_heads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  expenseGroupId: varchar("expense_group_id").notNull().references(() => expenseGroups.id),
  accountingCode: varchar("accounting_code"),
  accountingLedger: varchar("accounting_ledger"),
  status: boolean("status").notNull().default(true),
  supportingRequired: boolean("supporting_required").notNull().default(false),
  claimForm: varchar("claim_form").notNull().default("expense"), // ticket, accommodation, conveyance, expense
  applicableFor: varchar("applicable_for").notNull().default("both"), // employee_only, vendor_only, both
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpenseHeadSchema = createInsertSchema(expenseHeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Expense Master types
export type ExpenseGroup = typeof expenseGroups.$inferSelect;
export type InsertExpenseGroup = z.infer<typeof insertExpenseGroupSchema>;
export type ExpenseHead = typeof expenseHeads.$inferSelect;
export type InsertExpenseHead = z.infer<typeof insertExpenseHeadSchema>;

// Expense Policy table
export const expensePolicies = pgTable("expense_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseHeadId: varchar("expense_head_id").notNull().references(() => expenseHeads.id),
  ruleType: varchar("rule_type").notNull().default("fixed"), // fixed, criteria_based
  class: varchar("class"),
  dayLimitPerTransaction: boolean("day_limit_per_transaction").notNull().default(false),
  isRestricted: boolean("is_restricted").notNull().default(false),
  status: boolean("status").notNull().default(true),
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }),
  limitCurrency: varchar("limit_currency").notNull().default("INR"),
  
  // Criteria-based rule fields (populated from external API)
  locationId: varchar("location_id"), // External API ID
  locationName: varchar("location_name"), // Display name from API
  departmentId: varchar("department_id"), // External API ID
  departmentName: varchar("department_name"), // Display name from API
  divisionId: varchar("division_id"), // External API ID
  divisionName: varchar("division_name"), // Display name from API
  levelId: varchar("level_id"), // External API ID
  levelName: varchar("level_name"), // Display name from API
  programId: varchar("program_id"), // External API ID
  programName: varchar("program_name"), // Display name from API
  projectId: varchar("project_id"), // External API ID
  projectName: varchar("project_name"), // Display name from API
  
  companyId: varchar("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpensePolicySchema = createInsertSchema(expensePolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ExpensePolicy = typeof expensePolicies.$inferSelect;
export type InsertExpensePolicy = z.infer<typeof insertExpensePolicySchema>;

// Contract Master table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  vendorName: varchar("vendor_name").notNull(),
  companyId: varchar("company_id").notNull().references(() => companies.id), // Added for tenant isolation
  agreementReference: varchar("agreement_reference"),
  expenseType: varchar("expense_type").notNull(), // rent, lease, subscription_fee
  agreementStartDate: timestamp("agreement_start_date").notNull(),
  agreementEndDate: timestamp("agreement_end_date"), // Optional
  dueDate: timestamp("due_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: varchar("frequency").notNull(), // monthly, quarterly, annually
  supportingDocuments: jsonb("supporting_documents").default([]), // Array of uploaded documents
  status: varchar("status").notNull().default("active"), // active, inactive, expired
  isAutoPopulated: boolean("is_auto_populated").default(false), // True if created from vendor claim
  expenseClaimId: varchar("expense_claim_id").references(() => expenseClaims.id), // Link to original expense claim if auto-populated
  
  // Automation fields for reminders and notifications
  enableReminders: boolean("enable_reminders").default(true), // Enable/disable automated reminders
  reminderDaysBefore: integer("reminder_days_before").default(7), // Days before due date to send reminder
  autoGenerateVendorClaim: boolean("auto_generate_vendor_claim").default(true), // Auto-create vendor claims on due dates
  lastReminderSent: timestamp("last_reminder_sent"), // Track when last reminder was sent
  nextDueDate: timestamp("next_due_date"), // Calculated next due date based on frequency
  lastVendorClaimGenerated: timestamp("last_vendor_claim_generated"), // Track last auto-generated claim
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastReminderSent: true,
  nextDueDate: true,
  lastVendorClaimGenerated: true,
}).extend({
  amount: z.coerce.number().min(0),
  agreementStartDate: z.coerce.date(),
  agreementEndDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  reminderDaysBefore: z.coerce.number().min(1).max(30).optional(),
});

// Notifications and Reminders System
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // contract_reminder, vendor_claim_due, vendor_claim_generated
  entityType: varchar("entity_type").notNull(), // contract, expense_claim
  entityId: varchar("entity_id").notNull(), // ID of related contract/claim
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  recipientEmails: jsonb("recipient_emails").notNull(), // Array of email addresses
  scheduledFor: timestamp("scheduled_for").notNull(), // When to send
  status: varchar("status").notNull().default("pending"), // pending, sent, failed, cancelled
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  
  // Email tracking
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional data (contract details, amounts, etc.)
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Automated Tasks Queue
export const automatedTasks = pgTable("automated_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskType: varchar("task_type").notNull(), // generate_vendor_claim, send_reminder, calculate_due_dates
  entityType: varchar("entity_type").notNull(), // contract, expense_claim
  entityId: varchar("entity_id").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed, cancelled
  
  // Task payload and results
  taskData: jsonb("task_data"), // Input data for the task
  resultData: jsonb("result_data"), // Output/result after task completion
  errorMessage: text("error_message"),
  
  // Processing tracking
  processedAt: timestamp("processed_at"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  retryCount: true,
}).extend({
  scheduledFor: z.coerce.date(),
  recipientEmails: z.array(z.string().email()).min(1),
});

export const insertAutomatedTaskSchema = createInsertSchema(automatedTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
  retryCount: true,
}).extend({
  scheduledFor: z.coerce.date(),
});

// TDS Master insert schema and types
export const insertTdsMasterSchema = createInsertSchema(tdsMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  defaultRate: z.coerce.number().min(0).max(100), // TDS rate percentage 0-100%
});

export type TdsMaster = typeof tdsMaster.$inferSelect;
export type InsertTdsMaster = z.infer<typeof insertTdsMasterSchema>;

// Contract Master types
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

// Notification system types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AutomatedTask = typeof automatedTasks.$inferSelect;
export type InsertAutomatedTask = z.infer<typeof insertAutomatedTaskSchema>;

// Agent Conversations - for storing AI agent conversation sessions
export const agentConversations = pgTable("agent_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull().default("New Conversation"), // Auto-generated or user-provided title
  isActive: boolean("is_active").notNull().default(true), // Whether conversation is still being used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Messages - for storing individual messages in conversations
export const agentMessages = pgTable("agent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => agentConversations.id),
  type: varchar("type").notNull(), // 'user' or 'agent'
  content: text("content").notNull(), // The message content
  success: boolean("success"), // For agent messages, whether the command was successful
  data: jsonb("data"), // Any structured data returned by the agent
  actions: jsonb("actions"), // Actions that were executed by the agent
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for agent conversations and messages
export const agentConversationsRelations = relations(agentConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [agentConversations.userId],
    references: [users.id],
  }),
  messages: many(agentMessages),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [agentMessages.conversationId],
    references: [agentConversations.id],
  }),
}));

// Agent conversation schemas and types
export const insertAgentConversationSchema = createInsertSchema(agentConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentMessageSchema = createInsertSchema(agentMessages).omit({
  id: true,
  createdAt: true,
});

export type AgentConversation = typeof agentConversations.$inferSelect;
export type InsertAgentConversation = z.infer<typeof insertAgentConversationSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;

// Bill master relations
export const billMasterTypesRelations = relations(billMasterTypes, ({ many }) => ({
  fields: many(billMasterFields),
}));

export const billMasterFieldsRelations = relations(billMasterFields, ({ one }) => ({
  billType: one(billMasterTypes, {
    fields: [billMasterFields.billTypeId],
    references: [billMasterTypes.id],
  }),
}));

// Bill master schemas and types
export const insertBillMasterTypeSchema = createInsertSchema(billMasterTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillMasterFieldSchema = createInsertSchema(billMasterFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BillMasterType = typeof billMasterTypes.$inferSelect;
export type InsertBillMasterType = z.infer<typeof insertBillMasterTypeSchema>;
export type BillMasterField = typeof billMasterFields.$inferSelect;
export type InsertBillMasterField = z.infer<typeof insertBillMasterFieldSchema>;

// Dashboard Widgets table
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  widgetType: varchar("widget_type").notNull(), // 'expense_trends', 'pending_approvals', 'recent_claims', etc.
  position: jsonb("position").notNull(), // { x: number, y: number, width: number, height: number }
  config: jsonb("config").default(sql`'{}'::jsonb`), // Widget-specific configuration
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertDashboardWidget = createInsertSchema(dashboardWidgets).omit({ id: true });
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidget>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;

// Dashboard widget relations
export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  user: one(users, {
    fields: [dashboardWidgets.userId],
    references: [users.id],
  }),
}));

// Custom Reports table for saved/published reports
export const customReports = pgTable("custom_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  process: varchar("process").notNull(), // 'claim', 'request', 'payment', 'vendor'
  selectedColumns: jsonb("selected_columns").notNull().default(sql`'[]'::jsonb`),
  filters: jsonb("filters").notNull().default(sql`'[]'::jsonb`),
  sorts: jsonb("sorts").notNull().default(sql`'[]'::jsonb`),
  groupBy: jsonb("group_by").notNull().default(sql`'[]'::jsonb`),
  visibility: varchar("visibility").notNull().default("private"), // 'private', 'public', 'shared'
  sharedRoles: jsonb("shared_roles").default(sql`'[]'::jsonb`),
  sharedUsers: jsonb("shared_users").default(sql`'[]'::jsonb`),
  orgId: varchar("org_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertCustomReportSchema = createInsertSchema(customReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomReport = typeof customReports.$inferSelect;
export type InsertCustomReport = z.infer<typeof insertCustomReportSchema>;

// Custom report relations
export const customReportsRelations = relations(customReports, ({ one }) => ({
  owner: one(users, {
    fields: [customReports.ownerId],
    references: [users.id],
  }),
}));

// User Tutorials table for tracking tutorial progress
export const userTutorials = pgTable("user_tutorials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  orgId: varchar("org_id").notNull(),
  tutorialName: varchar("tutorial_name").notNull(), // e.g., 'onboarding', 'dashboard', 'expense-claim'
  stepId: varchar("step_id").notNull(), // e.g., 'step-1', 'step-2', 'welcome'
  isCompleted: boolean("is_completed").notNull().default(false),
  isSkipped: boolean("is_skipped").notNull().default(false),
  allTutorialsDisabled: boolean("all_tutorials_disabled").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertUserTutorialSchema = createInsertSchema(userTutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserTutorial = typeof userTutorials.$inferSelect;
export type InsertUserTutorial = z.infer<typeof insertUserTutorialSchema>;

// User tutorial relations
export const userTutorialsRelations = relations(userTutorials, ({ one }) => ({
  user: one(users, {
    fields: [userTutorials.userId],
    references: [users.id],
  }),
}));

// Utility Categories Master - for utility bill types like Electricity, Water, Gas, etc.
export const utilityCategories = pgTable("utility_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  orgId: varchar("org_id").notNull(),
  isCustom: boolean("is_custom").notNull().default(false), // User-created custom categories
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertUtilityCategorySchema = createInsertSchema(utilityCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UtilityCategory = typeof utilityCategories.$inferSelect;
export type InsertUtilityCategory = z.infer<typeof insertUtilityCategorySchema>;

// Units of Measurement Master - linked to utility categories
export const unitsOfMeasurement = pgTable("units_of_measurement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  abbreviation: varchar("abbreviation").notNull(),
  utilityCategoryId: varchar("utility_category_id").references(() => utilityCategories.id),
  orgId: varchar("org_id").notNull(),
  isCustom: boolean("is_custom").notNull().default(false), // User-created custom units
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertUnitsOfMeasurementSchema = createInsertSchema(unitsOfMeasurement).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UnitsOfMeasurement = typeof unitsOfMeasurement.$inferSelect;
export type InsertUnitsOfMeasurement = z.infer<typeof insertUnitsOfMeasurementSchema>;

// Utility category relations  
export const utilityCategoriesRelations = relations(utilityCategories, ({ many }) => ({
  unitsOfMeasurement: many(unitsOfMeasurement),
}));

// Units of measurement relations
export const unitsOfMeasurementRelations = relations(unitsOfMeasurement, ({ one }) => ({
  utilityCategory: one(utilityCategories, {
    fields: [unitsOfMeasurement.utilityCategoryId],
    references: [utilityCategories.id],
  }),
}));

