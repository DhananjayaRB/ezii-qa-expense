-- =====================================================================
-- EXPENSE MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================================
-- This file contains all CREATE and INSERT statements for setting up
-- the expense management system in testing environments.
-- 
-- Generated on: 2025-09-19
-- Database: PostgreSQL 16.9
-- 
-- USAGE:
-- 1. Create a new PostgreSQL database
-- 2. Run this script: psql -d your_database -f database_schema_complete.sql
-- 3. Verify tables are created and data is inserted
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set configuration
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================================
-- TABLE DEFINITIONS
-- =====================================================================

-- Companies table (must be first due to foreign key dependencies)
CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

-- Users table
CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'employee'::character varying NOT NULL,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Workflow Roles
CREATE TABLE public.workflow_roles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Workflows table
CREATE TABLE public.workflows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    process_types character varying DEFAULT '[]'::character varying,
    company_id character varying,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    approval_condition_type character varying
);

-- Workflow Levels
CREATE TABLE public.workflow_levels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying NOT NULL,
    level_number integer NOT NULL,
    level_name character varying NOT NULL,
    approval_type character varying DEFAULT 'role-based'::character varying,
    required_approvers integer DEFAULT 1,
    monetary_limit numeric(15,2),
    auto_approve boolean DEFAULT false,
    is_final_level boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Workflow Assignments
CREATE TABLE public.workflow_assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_level_id character varying NOT NULL,
    role_id character varying,
    user_id character varying,
    assignment_type character varying DEFAULT 'role'::character varying,
    is_active boolean DEFAULT true,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Process Master
CREATE TABLE public.process_master (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    process_type character varying NOT NULL,
    display_name character varying NOT NULL,
    description text,
    default_workflow_id character varying,
    auto_approve_when_no_workflow boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Expense Categories
CREATE TABLE public.expense_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Vendors
CREATE TABLE public.vendors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone character varying,
    address text,
    city character varying,
    state character varying,
    postal_code character varying,
    country character varying DEFAULT 'India'::character varying,
    pan_number character varying,
    gst_number character varying,
    bank_account_number character varying,
    bank_ifsc character varying,
    bank_name character varying,
    is_active boolean DEFAULT true,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Expense Requests
CREATE TABLE public.expense_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    estimated_amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    status character varying DEFAULT 'draft'::character varying,
    approved_by character varying,
    approved_at timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    current_approval_level character varying,
    pending_with character varying,
    workflow_id character varying,
    employer_name character varying,
    employee_number character varying,
    employee_email character varying,
    urgency character varying,
    justification text,
    expected_date timestamp without time zone
);

-- Expense Claims
CREATE TABLE public.expense_claims (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    request_id character varying,
    title character varying NOT NULL,
    description text,
    total_amount numeric(10,2) NOT NULL,
    original_request_amount numeric(10,2) DEFAULT 0,
    extra_amount numeric(10,2) DEFAULT 0,
    currency character varying DEFAULT 'INR'::character varying,
    advance_payment_id character varying,
    advance_amount numeric(10,2) DEFAULT 0,
    balance_payment numeric(10,2) DEFAULT 0,
    vendor_id character varying,
    vendor_invoice_number character varying,
    status character varying DEFAULT 'draft'::character varying,
    current_approval_level character varying,
    pending_with character varying,
    utr_number character varying,
    payment_date timestamp without time zone,
    processed_by character varying,
    processed_at timestamp without time zone,
    submitted_at timestamp without time zone,
    approved_at timestamp without time zone,
    paid_at timestamp without time zone,
    approved_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    vendor_due_date timestamp without time zone,
    enable_due_date_reminder boolean DEFAULT false,
    due_date_reminder_days integer DEFAULT 3,
    last_due_date_reminder_sent timestamp without time zone,
    workflow_id character varying,
    employer_name character varying,
    employee_number character varying,
    employee_email character varying
);

-- Expense Items
CREATE TABLE public.expense_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    expense_claim_id character varying,
    expense_request_id character varying,
    category_id character varying,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying,
    expense_date timestamp without time zone,
    receipt_url character varying,
    bill_number character varying,
    vendor_name character varying,
    gst_amount numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Direct Expenses
CREATE TABLE public.direct_expenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying,
    expense_date timestamp without time zone NOT NULL,
    category_id character varying,
    vendor_id character varying,
    invoice_number character varying,
    receipt_url character varying,
    status character varying DEFAULT 'pending'::character varying,
    created_by character varying NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id character varying
);

-- Payment Batches
CREATE TABLE public.payment_batches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    total_amount numeric(10,2) NOT NULL,
    status character varying DEFAULT 'draft'::character varying,
    payment_method character varying,
    scheduled_date timestamp without time zone,
    processed_at timestamp without time zone,
    created_by character varying NOT NULL,
    processed_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id character varying
);

-- Payment Batch Items
CREATE TABLE public.payment_batch_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    batch_id character varying NOT NULL,
    expense_claim_id character varying,
    direct_expense_id character varying,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying,
    payee_name character varying NOT NULL,
    payee_account character varying,
    payee_ifsc character varying,
    purpose text,
    created_at timestamp without time zone DEFAULT now()
);

-- Vendor Onboarding Requests
CREATE TABLE public.vendor_onboarding_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_name character varying NOT NULL,
    vendor_email character varying,
    vendor_phone character varying,
    business_type character varying,
    address text,
    pan_number character varying,
    gst_number character varying,
    bank_account_number character varying,
    bank_ifsc character varying,
    bank_name character varying,
    contact_person character varying,
    status character varying DEFAULT 'pending'::character varying,
    requested_by character varying NOT NULL,
    requested_at timestamp without time zone DEFAULT now(),
    approved_by character varying,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id character varying,
    workflow_id character varying,
    current_approval_level character varying,
    pending_with character varying
);

-- Petty Cash Transactions
CREATE TABLE public.petty_cash_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    cashbox_id character varying NOT NULL,
    transaction_type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying,
    description text NOT NULL,
    transaction_date timestamp without time zone DEFAULT now(),
    category_id character varying,
    receipt_url character varying,
    created_by character varying NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    status character varying DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Cashboxes
CREATE TABLE public.cashboxes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    initial_balance numeric(10,2) DEFAULT 0,
    current_balance numeric(10,2) DEFAULT 0,
    currency character varying DEFAULT 'INR'::character varying,
    location character varying,
    custodian_id character varying,
    is_active boolean DEFAULT true,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Custom Reports
CREATE TABLE public.custom_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    process character varying NOT NULL,
    columns text NOT NULL,
    filters text,
    created_by character varying NOT NULL,
    visibility character varying DEFAULT 'private'::character varying,
    shared_roles text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id character varying
);

-- Agent Conversations
CREATE TABLE public.agent_conversations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title character varying DEFAULT 'New Conversation'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Agent Messages  
CREATE TABLE public.agent_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    type character varying NOT NULL,
    content text NOT NULL,
    success boolean,
    data jsonb,
    actions jsonb,
    created_at timestamp without time zone DEFAULT now()
);

-- Bill Master Types
CREATE TABLE public.bill_master_types (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Bill Master Fields
CREATE TABLE public.bill_master_fields (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    bill_type_id character varying NOT NULL,
    field_name character varying NOT NULL,
    field_label character varying NOT NULL,
    field_type character varying NOT NULL,
    is_required boolean DEFAULT false,
    is_visible boolean DEFAULT true,
    field_order integer DEFAULT 1,
    placeholder character varying,
    helper_text text,
    default_value text,
    validation_rules json,
    field_options json,
    width character varying DEFAULT 'full'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Additional supporting tables
CREATE TABLE public.receipts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    expense_claim_id character varying,
    expense_item_id character varying,
    direct_expense_id character varying,
    file_name character varying NOT NULL,
    file_path character varying NOT NULL,
    file_size integer,
    mime_type character varying,
    uploaded_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    type character varying DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    entity_type character varying,
    entity_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    read_at timestamp without time zone
);

CREATE TABLE public.approval_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    claim_id character varying,
    payment_batch_id character varying,
    approver_id character varying NOT NULL,
    approver_role character varying NOT NULL,
    approver_name character varying NOT NULL,
    action character varying NOT NULL,
    remarks text,
    previous_status character varying,
    new_status character varying,
    next_approval_level character varying,
    processed_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

-- Sessions table for authentication
CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);

-- =====================================================================
-- PRIMARY KEY CONSTRAINTS
-- =====================================================================

ALTER TABLE ONLY public.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workflow_roles ADD CONSTRAINT workflow_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workflows ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workflow_levels ADD CONSTRAINT workflow_levels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workflow_assignments ADD CONSTRAINT workflow_assignments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.process_master ADD CONSTRAINT process_master_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.expense_categories ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendors ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.expense_requests ADD CONSTRAINT expense_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.expense_claims ADD CONSTRAINT expense_claims_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.expense_items ADD CONSTRAINT expense_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.direct_expenses ADD CONSTRAINT direct_expenses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_batches ADD CONSTRAINT payment_batches_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_batch_items ADD CONSTRAINT payment_batch_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendor_onboarding_requests ADD CONSTRAINT vendor_onboarding_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.petty_cash_transactions ADD CONSTRAINT petty_cash_transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cashboxes ADD CONSTRAINT cashboxes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.custom_reports ADD CONSTRAINT custom_reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.agent_conversations ADD CONSTRAINT agent_conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.agent_messages ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bill_master_types ADD CONSTRAINT bill_master_types_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bill_master_fields ADD CONSTRAINT bill_master_fields_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.receipts ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approval_history ADD CONSTRAINT approval_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);
CREATE INDEX idx_expense_claims_user_id ON public.expense_claims USING btree (user_id);
CREATE INDEX idx_expense_claims_status ON public.expense_claims USING btree (status);
CREATE INDEX idx_expense_requests_user_id ON public.expense_requests USING btree (user_id);
CREATE INDEX idx_expense_requests_status ON public.expense_requests USING btree (status);
CREATE INDEX idx_sessions_expire ON public.sessions USING btree (expire);

-- =====================================================================
-- INITIAL DATA INSERTS
-- =====================================================================

-- Insert default company
INSERT INTO public.companies (id, name, created_at) VALUES 
('13', 'Default Company', '2025-09-15 09:22:24.978072');

-- Insert workflow roles
INSERT INTO public.workflow_roles (id, name, description, is_active, company_id, created_at, updated_at) VALUES 
('manager-role-id', 'Manager', 'Department managers with approval authority', true, '13', now(), now()),
('director-role-id', 'Director', 'Directors with high-level approval authority', true, '13', now(), now()),
('finance-role-id', 'Finance', 'Finance team members', true, '13', now(), now()),
('admin-role-id', 'Admin', 'System administrators', true, '13', now(), now()),
('employee-role-id', 'Employees', 'Regular employees', true, '13', now(), now());

-- Insert process master entries
INSERT INTO public.process_master (id, process_type, display_name, description, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES 
(gen_random_uuid(), 'claim', 'Expense Claim', 'Employee expense reimbursement claims', true, true, now(), now()),
(gen_random_uuid(), 'request', 'Expense Request', 'Employee expense pre-approval requests', false, true, now(), now()),
(gen_random_uuid(), 'payment', 'Payment Processing', 'Payment batch processing workflows', true, true, now(), now()),
(gen_random_uuid(), 'vendor', 'Vendor Onboarding', 'Vendor onboarding approval workflows', true, true, now(), now()),
(gen_random_uuid(), 'vendorclaim', 'Vendor Claims', 'Vendor invoice claims and reimbursements', true, true, now(), now()),
(gen_random_uuid(), 'pettycash', 'Petty Cashbox', 'Petty cash transactions and cashbox management', true, true, now(), now()),
(gen_random_uuid(), 'directexpense', 'Direct Expense', 'Company-level direct expenses', true, true, now(), now());

-- Insert default expense categories
INSERT INTO public.expense_categories (id, name, description, is_active, company_id, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Travel', 'Travel and transportation expenses', true, '13', now(), now()),
(gen_random_uuid(), 'Meals', 'Food and dining expenses', true, '13', now(), now()),
(gen_random_uuid(), 'Office Supplies', 'Office equipment and supplies', true, '13', now(), now()),
(gen_random_uuid(), 'Communications', 'Phone, internet, and communication expenses', true, '13', now(), now()),
(gen_random_uuid(), 'Utilities', 'Electricity, water, and utility bills', true, '13', now(), now()),
(gen_random_uuid(), 'Professional Services', 'Consulting and professional service fees', true, '13', now(), now());

-- Insert sample users
INSERT INTO public.users (id, email, first_name, last_name, role, company_id, created_at, updated_at) VALUES 
('1', 'admin@company.com', 'System', 'Admin', 'admin', '13', now(), now()),
('241', 'user241@company.com', 'User', '241', 'employee', '13', now(), now()),
('manager-1', 'manager@company.com', 'John', 'Manager', 'manager', '13', now(), now()),
('finance-1', 'finance@company.com', 'Jane', 'Finance', 'accountant', '13', now(), now());

-- Insert default workflows
INSERT INTO public.workflows (id, name, description, process_types, company_id, is_active, is_default, created_at, updated_at, approval_condition_type) VALUES 
('expense-claim-workflow', 'Default Expense Claims Workflow', 'Standard workflow for expense claim approvals', '["claim"]', '13', true, true, now(), now(), 'process-based'),
('expense-request-workflow', 'Default Expense Request Workflow', 'Standard workflow for expense request approvals', '["request"]', '13', true, true, now(), now(), 'process-based');

-- Insert workflow levels
INSERT INTO public.workflow_levels (id, workflow_id, level_number, level_name, approval_type, required_approvers, auto_approve, is_final_level, created_at, updated_at) VALUES 
(gen_random_uuid(), 'expense-claim-workflow', 1, 'Manager Approval', 'role-based', 1, false, false, now(), now()),
(gen_random_uuid(), 'expense-claim-workflow', 2, 'Finance Approval', 'role-based', 1, false, true, now(), now()),
(gen_random_uuid(), 'expense-request-workflow', 1, 'Manager Approval', 'role-based', 1, false, true, now(), now());

-- Insert default cashbox
INSERT INTO public.cashboxes (id, name, description, initial_balance, current_balance, currency, location, is_active, company_id, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Main Office Cashbox', 'Primary petty cash box for office expenses', 10000.00, 10000.00, 'INR', 'Main Office', true, '13', now(), now());

-- =====================================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================================

ALTER TABLE ONLY public.users ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE ONLY public.workflow_roles ADD CONSTRAINT workflow_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE ONLY public.workflows ADD CONSTRAINT workflows_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE ONLY public.workflow_levels ADD CONSTRAINT workflow_levels_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);
ALTER TABLE ONLY public.workflow_assignments ADD CONSTRAINT workflow_assignments_workflow_level_id_fkey FOREIGN KEY (workflow_level_id) REFERENCES public.workflow_levels(id);
ALTER TABLE ONLY public.workflow_assignments ADD CONSTRAINT workflow_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.workflow_roles(id);
ALTER TABLE ONLY public.workflow_assignments ADD CONSTRAINT workflow_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.expense_requests ADD CONSTRAINT expense_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.expense_claims ADD CONSTRAINT expense_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.expense_claims ADD CONSTRAINT expense_claims_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);
ALTER TABLE ONLY public.expense_items ADD CONSTRAINT expense_items_expense_claim_id_fkey FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id);
ALTER TABLE ONLY public.expense_items ADD CONSTRAINT expense_items_expense_request_id_fkey FOREIGN KEY (expense_request_id) REFERENCES public.expense_requests(id);
ALTER TABLE ONLY public.expense_items ADD CONSTRAINT expense_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);
ALTER TABLE ONLY public.payment_batch_items ADD CONSTRAINT payment_batch_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.payment_batches(id);
ALTER TABLE ONLY public.payment_batch_items ADD CONSTRAINT payment_batch_items_expense_claim_id_fkey FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id);
ALTER TABLE ONLY public.agent_messages ADD CONSTRAINT agent_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.agent_conversations(id);
ALTER TABLE ONLY public.bill_master_fields ADD CONSTRAINT bill_master_fields_bill_type_id_fkey FOREIGN KEY (bill_type_id) REFERENCES public.bill_master_types(id);

-- =====================================================================
-- FINAL NOTES
-- =====================================================================
-- 
-- This schema includes:
-- ✓ Core expense management functionality
-- ✓ Workflow and approval system
-- ✓ Vendor management
-- ✓ Petty cash handling
-- ✓ Payment processing
-- ✓ AI agent conversations
-- ✓ Custom reporting
-- ✓ Bill master configuration
-- ✓ Multi-tenant support via company_id
-- 
-- For testing environments:
-- 1. Ensure PostgreSQL 16+ is installed
-- 2. Create database: CREATE DATABASE expense_management_test;
-- 3. Run this script: psql -d expense_management_test -f database_schema_complete.sql
-- 4. Verify setup: SELECT COUNT(*) FROM process_master; (should return 7)
-- 
-- Default login credentials for testing:
-- - Admin: admin@company.com (role: admin)
-- - Manager: manager@company.com (role: manager)  
-- - Employee: user241@company.com (role: employee)
-- - Finance: finance@company.com (role: accountant)
-- =====================================================================