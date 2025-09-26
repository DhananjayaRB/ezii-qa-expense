--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advance_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advance_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying NOT NULL,
    user_id character varying NOT NULL,
    approved_amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    payment_status character varying DEFAULT 'pending'::character varying NOT NULL,
    payment_date timestamp without time zone,
    is_settled boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: agent_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_conversations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title character varying DEFAULT 'New Conversation'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: agent_messages; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: approval_history; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: automated_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automated_tasks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    task_type character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id character varying NOT NULL,
    scheduled_for timestamp without time zone NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    task_data jsonb,
    result_data jsonb,
    error_message text,
    processed_at timestamp without time zone,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: bank_advice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_advice (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    advice_number character varying NOT NULL,
    advice_type character varying NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    payment_date timestamp without time zone NOT NULL,
    batch_id character varying,
    status character varying DEFAULT 'generated'::character varying NOT NULL,
    generated_by character varying NOT NULL,
    file_url character varying,
    bank_details text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: bank_advice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_advice_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    advice_id character varying NOT NULL,
    payee_id character varying,
    payee_name character varying NOT NULL,
    payee_type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    account_number character varying NOT NULL,
    ifsc_code character varying NOT NULL,
    bank_name character varying,
    purpose text NOT NULL,
    expense_claim_id character varying,
    direct_expense_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: banks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    account_number character varying,
    ifsc_code character varying,
    branch_name character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: bill_master_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bill_master_fields (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    bill_type_id character varying(255) NOT NULL,
    field_name character varying(255) NOT NULL,
    field_label character varying(255) NOT NULL,
    field_type character varying(50) NOT NULL,
    is_required boolean DEFAULT false,
    is_visible boolean DEFAULT true,
    field_order integer DEFAULT 1,
    placeholder character varying(255),
    helper_text text,
    default_value text,
    validation_rules json,
    field_options json,
    width character varying(20) DEFAULT 'full'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: bill_master_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bill_master_types (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: card_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    statement_id character varying NOT NULL,
    payment_amount numeric(10,2) NOT NULL,
    payment_date timestamp without time zone NOT NULL,
    payment_method character varying NOT NULL,
    reference_number character varying,
    bank_account character varying,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    processed_by character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: card_statements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_statements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    card_number character varying NOT NULL,
    card_type character varying NOT NULL,
    bank_name character varying NOT NULL,
    statement_month integer NOT NULL,
    statement_year integer NOT NULL,
    opening_balance numeric(10,2) DEFAULT '0'::numeric,
    closing_balance numeric(10,2) NOT NULL,
    total_spent numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    due_date timestamp without time zone NOT NULL,
    status character varying DEFAULT 'uploaded'::character varying NOT NULL,
    uploaded_by character varying NOT NULL,
    statement_file character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: card_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    statement_id character varying NOT NULL,
    transaction_date timestamp without time zone NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category character varying,
    merchant_name character varying,
    is_reconciled boolean DEFAULT false,
    matched_expense_id character varying,
    matched_expense_type character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cashboxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cashboxes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    cashier_id character varying NOT NULL,
    current_balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    opening_balance_date timestamp without time zone,
    accounting_code character varying,
    accounting_ledger character varying,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    vendor_id character varying NOT NULL,
    vendor_name character varying NOT NULL,
    agreement_reference character varying,
    expense_type character varying NOT NULL,
    agreement_start_date timestamp without time zone NOT NULL,
    agreement_end_date timestamp without time zone,
    due_date timestamp without time zone,
    amount numeric(10,2) NOT NULL,
    frequency character varying NOT NULL,
    supporting_documents jsonb DEFAULT '[]'::jsonb,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    is_auto_populated boolean DEFAULT false,
    expense_claim_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    enable_reminders boolean DEFAULT true,
    reminder_days_before integer DEFAULT 7,
    auto_generate_vendor_claim boolean DEFAULT true,
    last_reminder_sent timestamp without time zone,
    next_due_date timestamp without time zone,
    last_vendor_claim_generated timestamp without time zone,
    company_id character varying NOT NULL
);


--
-- Name: cost_centre_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_centre_configs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    org_id character varying NOT NULL,
    type character varying DEFAULT 'single'::character varying NOT NULL,
    cost_category_1_id character varying,
    cost_category_1_name character varying,
    cost_category_1_tally_integration boolean DEFAULT false,
    cost_category_2_id character varying,
    cost_category_2_name character varying,
    cost_category_2_tally_integration boolean DEFAULT false,
    cost_category_3_id character varying,
    cost_category_3_name character varying,
    cost_category_3_tally_integration boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: cost_distributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_distributions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    expense_claim_id character varying NOT NULL,
    cost_center_id character varying NOT NULL,
    cost_center_name character varying NOT NULL,
    cost_center_type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    original_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: custom_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    owner_id character varying NOT NULL,
    process character varying NOT NULL,
    selected_columns jsonb DEFAULT '[]'::jsonb NOT NULL,
    filters jsonb DEFAULT '[]'::jsonb NOT NULL,
    sorts jsonb DEFAULT '[]'::jsonb NOT NULL,
    group_by jsonb DEFAULT '[]'::jsonb NOT NULL,
    visibility character varying DEFAULT 'private'::character varying NOT NULL,
    shared_roles jsonb DEFAULT '[]'::jsonb,
    shared_users jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    org_id character varying NOT NULL
);


--
-- Name: dashboard_widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_widgets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    widget_type character varying NOT NULL,
    "position" jsonb NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: direct_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.direct_expenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    category_id character varying,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    vendor_name character varying,
    invoice_number character varying,
    receipt_url character varying,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    employer_name character varying,
    employee_number character varying,
    employee_email character varying
);


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_claims (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    request_id character varying,
    title character varying NOT NULL,
    description text,
    total_amount numeric(10,2) NOT NULL,
    original_request_amount numeric(10,2) DEFAULT '0'::numeric,
    extra_amount numeric(10,2) DEFAULT '0'::numeric,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    advance_payment_id character varying,
    advance_amount numeric(10,2) DEFAULT '0'::numeric,
    balance_payment numeric(10,2) NOT NULL,
    vendor_id character varying,
    vendor_invoice_number character varying,
    status character varying DEFAULT 'submitted'::character varying NOT NULL,
    current_approval_level character varying DEFAULT 'manager'::character varying,
    pending_with character varying,
    utr_number character varying,
    payment_date timestamp without time zone,
    processed_by character varying,
    processed_at timestamp without time zone,
    submitted_at timestamp without time zone DEFAULT now(),
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


--
-- Name: expense_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_groups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_heads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_heads (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    expense_group_id character varying NOT NULL,
    accounting_code character varying,
    accounting_ledger character varying,
    status boolean DEFAULT true NOT NULL,
    supporting_required boolean DEFAULT false NOT NULL,
    claim_form character varying DEFAULT 'expense'::character varying NOT NULL,
    applicable_for character varying DEFAULT 'both'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    claim_id character varying NOT NULL,
    category_id character varying,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    receipt_url character varying,
    receipt_file_name character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_policies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    expense_head_id character varying NOT NULL,
    rule_type character varying DEFAULT 'fixed'::character varying NOT NULL,
    class character varying,
    day_limit_per_transaction boolean DEFAULT false NOT NULL,
    is_restricted boolean DEFAULT false NOT NULL,
    status boolean DEFAULT true NOT NULL,
    limit_amount numeric(10,2),
    limit_currency character varying DEFAULT 'INR'::character varying NOT NULL,
    location_id character varying,
    location_name character varying,
    department_id character varying,
    department_name character varying,
    division_id character varying,
    division_name character varying,
    level_id character varying,
    level_name character varying,
    program_id character varying,
    program_name character varying,
    project_id character varying,
    project_name character varying,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    estimated_amount numeric(10,2),
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    status character varying DEFAULT 'submitted'::character varying NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    current_approval_level character varying DEFAULT 'manager'::character varying,
    pending_with character varying,
    workflow_id character varying,
    employer_name character varying,
    employee_number character varying,
    employee_email character varying
);


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledger_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    cashbox_id character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    opening_balance numeric(10,2) NOT NULL,
    debit numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    credit numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    closing_balance numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    recipient_emails jsonb NOT NULL,
    scheduled_for timestamp without time zone NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    sent_at timestamp without time zone,
    failure_reason text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    metadata jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: parties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parties (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    party_type character varying NOT NULL,
    legal_entity character varying,
    key_contact_person character varying,
    email character varying,
    phone character varying,
    address text,
    accounting_ledger character varying,
    accounting_code character varying,
    link_to_claim boolean DEFAULT false,
    is_active boolean DEFAULT true,
    pan character varying,
    register_under_msme boolean DEFAULT false,
    msme_no character varying,
    vendor_trade_name character varying,
    gst_registration_type character varying,
    gst_no character varying,
    state character varying,
    shipped_from character varying,
    bank_party_name character varying,
    bank_name character varying,
    bank_account_number character varying,
    branch_name character varying,
    ifsc_code character varying,
    preferred_payment_mode character varying,
    preferred_payment_dispatch_mode character varying,
    bank_account_type character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: payment_batch_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_batch_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    batch_id character varying NOT NULL,
    expense_claim_id character varying,
    direct_expense_id character varying,
    amount numeric(10,2) NOT NULL,
    payee_type character varying NOT NULL,
    payee_name character varying NOT NULL,
    bank_account character varying,
    ifsc_code character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payment_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_batches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    batch_number character varying NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    status character varying DEFAULT 'initiated'::character varying NOT NULL,
    created_by character varying NOT NULL,
    current_approval_level character varying DEFAULT 'manager'::character varying,
    pending_with character varying,
    released_by character varying,
    released_at timestamp without time zone,
    approved_by character varying,
    approved_at timestamp without time zone,
    payment_method character varying NOT NULL,
    bank_details text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: petty_cash_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.petty_cash_receipts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    receipt_type character varying NOT NULL,
    received_from_id character varying,
    received_from_name character varying NOT NULL,
    open_advance_id character varying,
    remaining_advance numeric(10,2) DEFAULT '0'::numeric,
    purpose text,
    amount_received numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    payment_option character varying NOT NULL,
    bank_id character varying,
    document_url character varying,
    document_file_name character varying,
    document_file_size integer,
    recorded_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: petty_cash_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.petty_cash_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    cashbox_id character varying NOT NULL,
    type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    description text NOT NULL,
    payee character varying,
    payee_type character varying,
    payee_id character varying,
    category character varying,
    receipt_url character varying,
    receipt_file_name character varying,
    transfer_to_cashbox_id character varying,
    transfer_from_cashbox_id character varying,
    iou_status character varying,
    linked_iou_id character varying,
    transaction_date timestamp without time zone NOT NULL,
    recorded_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: process_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.process_master (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    process_type character varying NOT NULL,
    display_name character varying NOT NULL,
    description text,
    default_workflow_id character varying,
    auto_approve_when_no_workflow boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    file_name character varying NOT NULL,
    original_name character varying NOT NULL,
    file_url character varying NOT NULL,
    file_size integer,
    mime_type character varying,
    is_attached boolean DEFAULT false,
    attached_to_id character varying,
    attached_to_type character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: tds_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tds_master (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    category character varying NOT NULL,
    category_name character varying NOT NULL,
    default_rate numeric(5,2) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: vendor_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    onboarding_request_id character varying,
    vendor_id character varying,
    document_type character varying NOT NULL,
    document_name character varying NOT NULL,
    file_name character varying NOT NULL,
    original_name character varying NOT NULL,
    file_url character varying NOT NULL,
    file_size integer,
    mime_type character varying,
    uploaded_by character varying NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    is_verified boolean DEFAULT false,
    verified_by character varying,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: vendor_onboarding_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_onboarding_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_name character varying NOT NULL,
    address text NOT NULL,
    contact_person character varying NOT NULL,
    phone character varying NOT NULL,
    email character varying NOT NULL,
    account_number character varying NOT NULL,
    ifsc_code character varying NOT NULL,
    bank_name character varying NOT NULL,
    bank_branch character varying NOT NULL,
    gstin character varying,
    pan character varying NOT NULL,
    tds_category character varying,
    msme_status character varying,
    msme_number character varying,
    tds_rate numeric(5,2),
    is_less_rates boolean DEFAULT false,
    custom_tds_rate numeric(5,2),
    tds_rate_from_date timestamp without time zone,
    tds_rate_to_date timestamp without time zone,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    current_approval_level character varying DEFAULT 'admin'::character varying,
    pending_with character varying,
    requested_by character varying NOT NULL,
    requested_at timestamp without time zone DEFAULT now(),
    approved_by character varying,
    approved_at timestamp without time zone,
    rejected_by character varying,
    rejected_at timestamp without time zone,
    rejection_reason text,
    vendor_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    employer_name character varying,
    employee_number character varying,
    employee_email character varying
);


--
-- Name: vendor_payment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_payment_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    vendor_id character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying NOT NULL,
    payment_date timestamp without time zone NOT NULL,
    utr_number character varying,
    payment_method character varying NOT NULL,
    expense_claim_id character varying,
    direct_expense_id character varying,
    payment_batch_id character varying,
    processed_by character varying NOT NULL,
    status character varying DEFAULT 'paid'::character varying NOT NULL,
    description text,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    address text NOT NULL,
    contact_person character varying NOT NULL,
    phone character varying NOT NULL,
    email character varying NOT NULL,
    account_number character varying NOT NULL,
    ifsc_code character varying NOT NULL,
    bank_name character varying NOT NULL,
    bank_branch character varying NOT NULL,
    gstin character varying,
    pan character varying NOT NULL,
    tds_category character varying,
    msme_status character varying,
    msme_number character varying,
    tds_rate numeric(5,2),
    is_less_rates boolean DEFAULT false,
    custom_tds_rate numeric(5,2),
    tds_rate_from_date timestamp without time zone,
    tds_rate_to_date timestamp without time zone,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_by character varying,
    total_paid numeric(10,2) DEFAULT '0'::numeric,
    last_payment_date timestamp without time zone,
    last_payment_utr character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: workflow_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying NOT NULL,
    process_type character varying NOT NULL,
    vendor_id character varying,
    expense_head_id character varying,
    company_id character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_instances (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    entity_id character varying NOT NULL,
    entity_type character varying NOT NULL,
    workflow_id character varying NOT NULL,
    current_level integer DEFAULT 1 NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: workflow_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_levels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying NOT NULL,
    level integer NOT NULL,
    role_id character varying NOT NULL,
    min_amount numeric(10,2),
    max_amount numeric(10,2),
    is_required boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: workflow_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_roles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    menu_keys text,
    company_id character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    process_types text NOT NULL,
    company_id character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    approval_condition_type character varying DEFAULT 'process-based'::character varying NOT NULL
);


--
-- Data for Name: advance_payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_conversations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_messages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: approval_history; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: automated_tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bank_advice; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bank_advice_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bill_master_fields; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bill_master_types; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.bill_master_types (id, name, description, is_default, is_active, display_order, created_at, updated_at) VALUES ('ba9bbb09-3006-4794-8be2-9ae8595167f0', 'Invoice', '', false, true, 1, '2025-09-16 11:26:48.462882', '2025-09-16 11:26:48.462882');


--
-- Data for Name: card_payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: card_statements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: card_transactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: cashboxes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.companies (id, name, created_at) VALUES ('13', 'Default Company', '2025-09-15 09:22:24.978072');


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.contracts (id, title, vendor_id, vendor_name, agreement_reference, expense_type, agreement_start_date, agreement_end_date, due_date, amount, frequency, supporting_documents, status, is_auto_populated, expense_claim_id, created_at, updated_at, enable_reminders, reminder_days_before, auto_generate_vendor_claim, last_reminder_sent, next_due_date, last_vendor_claim_generated, company_id) VALUES ('61fa5fb7-4f61-46e5-a5c0-8c6e525e6109', 'Office Rent Contract', 'efc7d238-76d4-4469-87dd-49f07bd028f4', 'TEST', 'REF001', 'rent', '2025-01-01 00:00:00', NULL, '2025-09-15 00:00:00', 50000.00, 'monthly', '[]', 'active', false, NULL, '2025-09-17 12:29:46.961533', '2025-09-17 12:29:46.961533', true, 7, true, NULL, '2025-09-01 00:00:00', NULL, '13');
INSERT INTO public.contracts (id, title, vendor_id, vendor_name, agreement_reference, expense_type, agreement_start_date, agreement_end_date, due_date, amount, frequency, supporting_documents, status, is_auto_populated, expense_claim_id, created_at, updated_at, enable_reminders, reminder_days_before, auto_generate_vendor_claim, last_reminder_sent, next_due_date, last_vendor_claim_generated, company_id) VALUES ('37f222ba-f79f-4101-b2ac-872399b64d4b', 'Internet Service Contract', 'd35cb98a-4a2b-437d-8ced-752462e3c16a', 'test', 'REF002', 'subscription_fee', '2025-01-01 00:00:00', NULL, '2025-09-20 00:00:00', 15000.00, 'monthly', '[]', 'active', false, NULL, '2025-09-17 12:29:46.961533', '2025-09-17 12:29:46.961533', true, 7, true, NULL, '2025-09-15 00:00:00', NULL, '13');
INSERT INTO public.contracts (id, title, vendor_id, vendor_name, agreement_reference, expense_type, agreement_start_date, agreement_end_date, due_date, amount, frequency, supporting_documents, status, is_auto_populated, expense_claim_id, created_at, updated_at, enable_reminders, reminder_days_before, auto_generate_vendor_claim, last_reminder_sent, next_due_date, last_vendor_claim_generated, company_id) VALUES ('c999ce8d-743b-4395-a80f-39554b7aa53e', 'Cleaning Service Contract', 'efc7d238-76d4-4469-87dd-49f07bd028f4', 'TEST', 'REF003', 'lease', '2025-01-01 00:00:00', NULL, '2025-09-25 00:00:00', 8000.00, 'monthly', '[]', 'active', false, NULL, '2025-09-17 12:29:46.961533', '2025-09-17 12:29:46.961533', true, 7, true, NULL, '2025-09-30 00:00:00', NULL, '13');


--
-- Data for Name: cost_centre_configs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cost_centre_configs (id, org_id, type, cost_category_1_id, cost_category_1_name, cost_category_1_tally_integration, cost_category_2_id, cost_category_2_name, cost_category_2_tally_integration, cost_category_3_id, cost_category_3_name, cost_category_3_tally_integration, created_at, updated_at) VALUES ('c61f039b-154c-45ec-a009-3b783c290e71', '47611237', 'multiple', '0', 'Location', false, '1', 'Department', false, '', '', false, '2025-09-16 09:03:08.629136', '2025-09-16 11:40:41.49');


--
-- Data for Name: cost_distributions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cost_distributions (id, expense_claim_id, cost_center_id, cost_center_name, cost_center_type, amount, original_amount, created_at, updated_at) VALUES ('8a65f86a-bf90-4794-81c3-d4b557d11961', 'b21ef87d-687d-459e-b51b-467697b9be4e', '25', 'Dehli Office', 'location', 1000.00, NULL, '2025-09-16 16:23:33.322101', '2025-09-16 16:23:33.322101');


--
-- Data for Name: custom_reports; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.custom_reports (id, name, description, owner_id, process, selected_columns, filters, sorts, group_by, visibility, shared_roles, shared_users, created_at, updated_at, org_id) VALUES ('84bbdaa1-b0b4-498d-a216-d0fcc04b2bf2', 'Expense Claim Report', '', '1', 'claim', '["employerName", "employeeNumber", "employeeEmail", "title", "totalAmount", "balancePayment", "submittedAt"]', '{"period": "all"}', '[]', '[]', 'shared', '[]', '[]', '2025-09-18 09:21:40.370617', '2025-09-18 09:21:40.370617', '13');
INSERT INTO public.custom_reports (id, name, description, owner_id, process, selected_columns, filters, sorts, group_by, visibility, shared_roles, shared_users, created_at, updated_at, org_id) VALUES ('414616a2-efa6-42a9-b01f-6408e5e7a5d8', 'Expense Request', '', '1', 'request', '["employerName", "employeeNumber", "employeeEmail", "title", "type", "estimatedAmount", "createdAt"]', '{"period": "thisMonth"}', '[]', '[]', 'private', '[]', '[]', '2025-09-18 12:22:34.512393', '2025-09-18 12:22:34.512393', '13');
INSERT INTO public.custom_reports (id, name, description, owner_id, process, selected_columns, filters, sorts, group_by, visibility, shared_roles, shared_users, created_at, updated_at, org_id) VALUES ('6ed0891e-c68b-4848-9e9c-585e6bb1f4d1', 'Expense Reports', '', '1', 'claim', '["employerName", "employeeNumber", "employeeEmail", "title", "totalAmount"]', '{"period": ""}', '[]', '[]', 'role-based', '["Admin"]', '[]', '2025-09-18 12:37:22.354156', '2025-09-18 12:37:22.354156', '13');
INSERT INTO public.custom_reports (id, name, description, owner_id, process, selected_columns, filters, sorts, group_by, visibility, shared_roles, shared_users, created_at, updated_at, org_id) VALUES ('06e1dc1c-4ddf-4e6e-9828-836c83412e2e', 'Expense Claims', '', '1', 'claim', '["claim.title", "claim.balancePayment", "claim.status", "request.type", "request.title"]', '{"period": ""}', '[]', '[]', 'role-based', '["Admin"]', '[]', '2025-09-19 06:37:08.746219', '2025-09-19 06:37:08.746219', '13');


--
-- Data for Name: dashboard_widgets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('96879104-6a11-4180-b0f0-66d411c6d669', '47611237', 'pending_approvals', '{"x": 1, "y": 0, "width": 1, "height": 1}', '{}', false, '2025-09-16 12:46:52.391152', '2025-09-16 19:16:17.924');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('bc5ec642-51ee-4ecd-b5ab-30901db71d77', '47611237', 'total_expenses', '{"x": 0, "y": 0, "width": 1, "height": 1}', '{}', false, '2025-09-16 12:46:52.391408', '2025-09-16 19:16:19.841');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('5ae87767-9a94-4e30-bf5e-ee41d2e03f9c', '47611237', 'monthly_insights', '{"x": 0, "y": 8, "width": 1, "height": 1}', '{}', false, '2025-09-16 18:28:41.408498', '2025-09-16 19:16:25.773');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('40dbdcba-13b1-4ca1-a9b8-082cbb5c7fdb', '47611237', 'pending_approvals', '{"x": 0, "y": 11, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:22:07.433761', '2025-09-16 19:22:51.711');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('b63d3fbb-04f0-4588-8e5c-4b9413e8935a', '47611237', 'total_expenses', '{"x": 0, "y": 10, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:22:04.553138', '2025-09-16 19:23:19.382');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('452cfc94-d89f-4f8a-b234-3b2ef6f2c490', '47611237', 'monthly_insights', '{"x": 0, "y": 9, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:22:02.818339', '2025-09-16 19:23:22.074');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('70bb7803-9fa1-46d0-9166-3cdd171929e9', '47611237', 'recent_claims', '{"x": 0, "y": 2, "width": 1, "height": 1}', '{}', false, '2025-09-16 12:46:52.545581', '2025-09-16 19:24:03.531');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('c8ce184a-2c9a-480b-9bb1-220c85f75540', '47611237', 'category_breakdown', '{"x": 1, "y": 2, "width": 1, "height": 1}', '{}', false, '2025-09-16 12:46:52.644373', '2025-09-16 19:24:04.718');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('85fa3084-5e6f-4f05-a145-083b279c4eb1', '47611237', 'vendor_spending', '{"x": 0, "y": 3, "width": 2, "height": 1}', '{}', false, '2025-09-16 12:46:52.801125', '2025-09-16 19:24:07.354');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('86782063-bece-4ca0-a8d7-ea4dd93d921c', '47611237', 'expense_trends', '{"x": 0, "y": 1, "width": 2, "height": 1}', '{}', false, '2025-09-16 12:46:54.531343', '2025-09-16 19:24:08.486');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('3365606d-0b0a-4b04-961a-b2eb69ad3fa3', '47611237', 'period_filter', '{"x": 0, "y": 7, "width": 1, "height": 1}', '{}', false, '2025-09-16 18:28:39.755462', '2025-09-16 19:24:09.738');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('d760f372-3388-410a-8153-5b746f36bd2e', '47611237', 'pending_approvals', '{"x": 0, "y": 12, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:23:25.262249', '2025-09-16 19:24:11.06');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('eb6a3c1b-17bc-4ab4-86f5-25f897cd99de', '47611237', 'total_expenses', '{"x": 0, "y": 13, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:23:27.120532', '2025-09-16 19:24:19.94');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6cca300f-5747-48f0-b652-36a94e8547ca', '47611237', 'monthly_insights', '{"x": 0, "y": 14, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:23:28.362038', '2025-09-16 19:24:25.363');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('10c0d5ca-4264-4f44-9459-abcb2298faab', '47611237', 'cost_to_company', '{"x": 0, "y": 6, "width": 1, "height": 1}', '{}', false, '2025-09-16 18:28:37.305627', '2025-09-16 19:24:27.39');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('64c961b5-07d1-44e1-82f8-4e3e2f494ea1', '47611237', 'pending_approvals', '{"x": 0, "y": 15, "width": 1, "height": 1}', '{}', true, '2025-09-16 19:24:31.048076', '2025-09-16 19:24:31.048076');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('5a255ac4-b90c-440c-a4bb-999ce0bf22e7', '47611237', 'cost_to_company', '{"x": 0, "y": 16, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:24:33.917196', '2025-09-16 19:25:43.305');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('97d500d5-1ef8-48fb-bc7d-158ea694c25d', '47611237', 'expense_trends', '{"x": 0, "y": 17, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:24:52.379687', '2025-09-16 19:25:49.338');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('4353839a-1bd4-46fb-9206-4bdd75a30a1d', '47611237', 'recent_claims', '{"x": 0, "y": 18, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:24:58.90849', '2025-09-16 19:25:50.792');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('5d9953ed-d19e-4514-8ac0-545b4d7c1b58', '47611237', 'vendor_spending', '{"x": 0, "y": 19, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:25:01.685968', '2025-09-16 19:25:53.03');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('44b788fb-77a5-4820-8ba2-2379bc62401b', '47611237', 'total_expenses', '{"x": 0, "y": 20, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:25:06.143443', '2025-09-16 19:25:54.187');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('e7010b91-2ec8-46dc-bd06-a834aa6915bf', '47611237', 'monthly_insights', '{"x": 0, "y": 21, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:25:21.709271', '2025-09-16 19:25:54.987');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('133c18a3-fcb9-4b47-b392-fca530cde004', '47611237', 'period_filter', '{"x": 0, "y": 22, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:25:23.189103', '2025-09-16 19:25:56.129');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6bdccd79-1ec7-437c-92ba-f368c2c27b2f', '47611237', 'category_breakdown', '{"x": 0, "y": 23, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:25:24.937536', '2025-09-16 19:25:57.766');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('8453b5d5-eba6-41c8-90bd-7480a610941f', '47611237', 'expense_trends', '{"x": 0, "y": 24, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:26:03.801895', '2025-09-16 19:26:08.612');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('b50c3ab9-315a-4ce7-815d-28a434c1ea5a', '47611237', 'total_expenses', '{"x": 0, "y": 25, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:26:15.089456', '2025-09-16 19:26:17.371');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('8b97c738-6470-4e08-adb9-4fd460b75b59', '47611237', 'category_breakdown', '{"x": 0, "y": 26, "width": 1, "height": 1}', '{}', true, '2025-09-16 19:26:19.641437', '2025-09-16 19:26:19.641437');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6b5cd72a-05c8-44ba-9896-1782ccc75a51', '47611237', 'expense_trends', '{"x": 0, "y": 27, "width": 1, "height": 1}', '{}', true, '2025-09-16 19:26:27.003213', '2025-09-16 19:26:27.003213');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6fb2d557-1d97-440c-b3d9-f2bbb73b06a1', '47611237', 'monthly_insights', '{"x": 0, "y": 28, "width": 1, "height": 1}', '{}', true, '2025-09-16 19:26:31.808558', '2025-09-16 19:26:31.808558');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('22b97deb-4228-4f32-b285-0d6c86d63491', '47611237', 'total_expenses', '{"x": 0, "y": 30, "width": 1, "height": 1}', '{}', true, '2025-09-16 19:26:43.698558', '2025-09-16 19:26:43.698558');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('42e5d7fc-890f-4bac-8f11-29f3353194ad', '47611237', 'vendor_spending', '{"x": 0, "y": 32, "width": 1, "height": 1}', '{}', true, '2025-09-16 19:26:48.62048', '2025-09-16 19:26:48.62048');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('745d40fa-66cc-414f-9471-6d100fc36904', '47611237', 'period_filter', '{"x": 0, "y": 31, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:26:47.180615', '2025-09-17 04:06:43.613');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('775e4372-5480-45dd-b817-6d2ef7826804', '47611237', 'cost_to_company', '{"x": 0, "y": 29, "width": 1, "height": 1}', '{}', false, '2025-09-16 19:26:40.354771', '2025-09-17 04:06:45.969');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('3779769f-f063-4e78-b934-6d18af9437cb', '47611237', 'recent_claims', '{"x": 0, "y": 33, "width": 1, "height": 1}', '{}', true, '2025-09-17 04:06:47.94926', '2025-09-17 04:06:47.94926');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('3e83bbe2-4a1f-4954-8650-c6888cf83f58', '47611237', 'period_filter', '{"x": 0, "y": 34, "width": 1, "height": 1}', '{}', true, '2025-09-17 04:06:49.173391', '2025-09-17 04:06:49.173391');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('75714c93-b06b-4869-854f-81ce67c9176a', '47611237', 'cost_to_company', '{"x": 0, "y": 35, "width": 1, "height": 1}', '{}', false, '2025-09-17 05:31:59.930567', '2025-09-17 05:36:12.397');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('687b1a8e-fbbd-422a-8dae-eeb574d0b2ad', '47611237', 'cost_to_company', '{"x": 0, "y": 36, "width": 1, "height": 1}', '{}', true, '2025-09-17 05:36:19.479544', '2025-09-17 05:36:19.479544');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6ec0e586-fc50-4ec7-a07a-6a9697579d1a', '1', 'cost_to_company', '{"x": 0, "y": 0, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:19:25.617981', '2025-09-17 09:06:25.523');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('3f5a12df-c2fb-45fe-9d4b-458ee9821b9e', '1', 'expense_trends', '{"x": 0, "y": 1, "width": 2, "height": 1}', '{}', false, '2025-09-17 08:19:25.944829', '2025-09-17 09:06:27.753');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('5a80faac-69d5-4759-b771-165f8d6b1ba3', '1', 'period_filter', '{"x": 1, "y": 0, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:19:25.61625', '2025-09-17 09:06:24.367');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('cdb7f706-5b87-4483-bfa4-f2d42f9a1c64', '1', 'monthly_insights', '{"x": 1, "y": 2, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:19:25.955648', '2025-09-17 09:06:29.253');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('91e38e3a-372b-4e7f-83a0-f5c075886bce', '1', 'total_expenses', '{"x": 0, "y": 3, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:19:26.193733', '2025-09-17 09:06:31.302');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('bd699947-6c89-49de-a861-e337972ce8a8', '1', 'category_breakdown', '{"x": 0, "y": 2, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:19:25.949711', '2025-09-17 09:06:33.544');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('97682f87-1d3b-4fb3-a564-7dc68bea2909', '1', 'recent_claims', '{"x": 0, "y": 6, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:25:40.661342', '2025-09-17 09:06:35.818');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('9448e149-bd19-4346-ac7e-bea0335cec28', '1', 'pending_approvals', '{"x": 0, "y": 7, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:25:42.6945', '2025-09-17 09:06:36.875');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('96539366-ccf6-4e61-95f9-a9fdb829c7cd', '1', 'vendor_spending', '{"x": 0, "y": 8, "width": 1, "height": 1}', '{}', false, '2025-09-17 08:25:45.191833', '2025-09-17 09:06:37.863');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('5a2d5c3a-6422-4996-9036-28110a8d3b9d', '1', 'recent_claims', '{"x": 0, "y": 11, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:06:55.100942', '2025-09-17 09:44:15.789');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('8c8506bf-918e-439f-98d1-b5299a85533b', '1', 'vendor_spending', '{"x": 0, "y": 12, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:06:57.775482', '2025-09-17 09:44:17.303');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('36bec845-bb48-4c13-be26-ec84431cfc32', '1', 'total_expenses', '{"x": 0, "y": 13, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:07:04.145557', '2025-09-17 09:44:18.988');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('26b764ec-9eeb-4412-949d-299ff6f9009a', '1', 'monthly_insights', '{"x": 0, "y": 14, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:07:07.582717', '2025-09-17 09:44:20.355');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('10bfa951-29cf-46e0-8ebb-196a945bff32', '1', 'total_expenses', '{"x": 0, "y": 19, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:44:25.535459', '2025-09-17 09:44:35.417');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6f2d197c-b518-41aa-a9ef-a4870910ffe6', '1', 'period_filter', '{"x": 0, "y": 17, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:07:26.282433', '2025-09-17 09:44:37.228');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('c65d2064-4b3e-4d80-a8dc-6bfa968475a0', '1', 'monthly_insights', '{"x": 0, "y": 18, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:44:23.717487', '2025-09-17 09:44:38.93');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('2dca9d1d-2b57-4145-aab5-05f5e467d2ba', '1', 'expense_trends', '{"x": 0, "y": 15, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:07:16.810608', '2025-09-17 09:44:40.55');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('0d58b572-a852-48cc-a069-8966efacc7e9', '1', 'cost_to_company', '{"x": 0, "y": 16, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:07:23.362118', '2025-09-17 09:44:42.269');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('46f827b0-3054-4755-903f-581dc04f46c2', '1', 'category_breakdown', '{"x": 0, "y": 10, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:06:48.650702', '2025-09-17 09:44:44.382');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('cd5f6f8e-a08e-4c5d-be9f-d243aea1c957', '1', 'pending_approvals', '{"x": 0, "y": 9, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:06:41.283165', '2025-09-17 09:44:45.698');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('d231cfde-805b-40e9-814f-bc62d11f5851', '1', 'cost_to_company', '{"x": 0, "y": 20, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:45:16.233037', '2025-09-17 10:00:46.747');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('93d8b15b-f105-4f84-94cc-2a63e1aac2f2', '1', 'expense_trends', '{"x": 0, "y": 21, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:45:30.531737', '2025-09-17 10:00:47.532');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('c5bb6961-681e-44ea-961d-9a4d2681ccc1', '1', 'category_breakdown', '{"x": 0, "y": 22, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:46:22.552042', '2025-09-17 10:00:48.484');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('8cf7ef79-724d-4ef1-875a-7d487c12e479', '1', 'monthly_insights', '{"x": 0, "y": 23, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:46:37.367682', '2025-09-17 10:00:50.243');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('cff8e8e6-8b39-4a3d-95fc-2d045db928dd', '1', 'total_expenses', '{"x": 0, "y": 24, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:47:02.030175', '2025-09-17 10:00:51.222');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('bec7b820-a173-4e1a-a115-502daccf8473', '1', 'pending_approvals', '{"x": 0, "y": 25, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:47:09.801746', '2025-09-17 10:00:52.264');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('32e82c95-9b32-4dbb-85a5-d5b79e35e0d0', '1', 'period_filter', '{"x": 0, "y": 26, "width": 1, "height": 1}', '{}', false, '2025-09-17 09:47:18.417698', '2025-09-17 10:00:53.339');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('f324da0d-e990-40b8-b32c-6a86ce8ae87f', '1', 'recent_claims', '{"x": 0, "y": 27, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:00:31.289621', '2025-09-17 10:00:54.37');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('e0fbecac-5502-4ce3-89e7-fc672eb7fbc3', '1', 'vendor_spending', '{"x": 0, "y": 28, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:00:34.116536', '2025-09-17 10:00:56.254');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('6bffba03-096c-4807-aee9-a46aa17380a3', '1', 'pending_approvals', '{"x": 0, "y": 29, "width": 1, "height": 1}', '{}', true, '2025-09-17 10:00:58.41701', '2025-09-17 10:00:58.41701');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('1f1637ab-1a73-4dc9-aa04-07b920b3d840', '1', 'category_breakdown', '{"x": 0, "y": 30, "width": 1, "height": 1}', '{}', true, '2025-09-17 10:01:06.57079', '2025-09-17 10:01:06.57079');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('5e42becb-a16a-4839-b1d8-f825ceed9740', '1', 'vendor_spending', '{"x": 0, "y": 32, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:01:28.636469', '2025-09-17 10:01:31.803');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('843cab34-9439-4bcb-aef5-0572db5d668d', '1', 'payment_calendar', '{"x": 0, "y": 39, "width": 1, "height": 1}', '{}', false, '2025-09-17 11:27:43.587503', '2025-09-17 11:27:54.232');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('729c16a7-0373-4a4b-aa16-5ab2974aa418', '1', 'vendor_spending', '{"x": 0, "y": 38, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:02:03.401863', '2025-09-17 11:28:07.978');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('f89b8e17-4c7b-4d31-b450-5dba49122b88', '1', 'monthly_insights', '{"x": 0, "y": 37, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:02:01.97903', '2025-09-17 11:28:09.65');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('26426e3e-4d63-43b8-a2ae-8bb211d81d55', '1', 'period_filter', '{"x": 0, "y": 36, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:01:59.399708', '2025-09-17 11:28:11.762');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('a4cffe74-cdea-4025-93ce-3d953a6e431a', '1', 'recent_claims', '{"x": 0, "y": 35, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:01:52.804379', '2025-09-17 11:28:15.248');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('93efba03-f2d6-4a18-9dfe-d3ea56d531c8', '1', 'cost_to_company', '{"x": 0, "y": 34, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:01:43.742051', '2025-09-17 11:28:16.68');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('9fa08445-bea7-4e92-9388-2f990709d264', '1', 'total_expenses', '{"x": 0, "y": 33, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:01:35.191041', '2025-09-17 11:28:18.131');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('1d1d4147-d65c-4d39-a3bb-227250b7e218', '1', 'expense_trends', '{"x": 0, "y": 31, "width": 1, "height": 1}', '{}', false, '2025-09-17 10:01:17.14625', '2025-09-17 11:28:20.281');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('f4a5cd56-4f7a-446f-a6c0-87ca10f98a15', '1', 'payment_calendar', '{"x": 0, "y": 40, "width": 1, "height": 1}', '{}', true, '2025-09-17 11:28:21.620413', '2025-09-17 11:28:21.620413');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('2dcd46ef-923b-44ac-bdc9-3284c9de8621', '1', 'expense_trends', '{"x": 0, "y": 41, "width": 1, "height": 1}', '{}', true, '2025-09-17 11:28:27.031645', '2025-09-17 11:28:27.031645');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('9affe84a-cbf1-4085-9b16-df4627814f4d', '1', 'cost_to_company', '{"x": 0, "y": 42, "width": 1, "height": 1}', '{}', false, '2025-09-17 11:28:30.844475', '2025-09-17 11:28:40.132');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('a8a9b01c-193c-45c1-b546-fa544e3663cd', '1', 'monthly_insights', '{"x": 0, "y": 43, "width": 1, "height": 1}', '{}', true, '2025-09-17 11:28:45.612645', '2025-09-17 11:28:45.612645');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('c28ca96a-08c8-4b3a-a165-ec0d92057fd4', '1', 'cost_to_company', '{"x": 0, "y": 44, "width": 1, "height": 1}', '{}', true, '2025-09-17 11:29:00.646376', '2025-09-17 11:29:00.646376');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('b3db2aa2-c2ad-4b7d-82dc-a764e176fdef', '1', 'period_filter', '{"x": 0, "y": 46, "width": 1, "height": 1}', '{}', true, '2025-09-17 11:29:08.383525', '2025-09-17 11:29:08.383525');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('ef618f42-c596-4817-bafc-dcd97464bf64', '1', 'vendor_spending', '{"x": 0, "y": 48, "width": 1, "height": 1}', '{}', false, '2025-09-17 11:29:18.081491', '2025-09-18 12:44:01.499');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('170a2d6c-6fdb-49d2-91d8-34f54c10f740', '1', 'recent_claims', '{"x": 0, "y": 45, "width": 1, "height": 1}', '{}', false, '2025-09-17 11:29:06.948084', '2025-09-18 12:44:04.359');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('4d2c98b5-4bfb-47d7-bd17-58940095853f', '1', 'recent_claims', '{"x": 0, "y": 49, "width": 1, "height": 1}', '{}', true, '2025-09-18 12:44:07.323462', '2025-09-18 12:44:07.323462');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('57f598cc-ce38-4996-a629-823f423451bb', '1', 'vendor_spending', '{"x": 0, "y": 50, "width": 1, "height": 1}', '{}', false, '2025-09-18 12:44:08.993505', '2025-09-19 06:41:17.063');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('d7626312-726b-4944-aea9-48073ecd453a', '1', 'total_expenses', '{"x": 0, "y": 47, "width": 1, "height": 1}', '{}', false, '2025-09-17 11:29:15.052087', '2025-09-19 06:41:33.018');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('28206ac7-303c-45c3-939f-6459352b0af5', '241', 'pending_approvals', '{"x": 0, "y": 0, "width": 1, "height": 1}', '{}', true, '2025-09-19 07:05:04.762115', '2025-09-19 07:05:04.762115');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('50fcb565-0e2a-43d1-8e74-8f675896c8bc', '241', 'category_breakdown', '{"x": 1, "y": 0, "width": 1, "height": 1}', '{}', true, '2025-09-19 07:05:04.764643', '2025-09-19 07:05:04.764643');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('00b048ae-9828-4a0b-9f0d-0aa261eb7378', '241', 'payment_calendar', '{"x": 2, "y": 0, "width": 1, "height": 1}', '{}', true, '2025-09-19 07:05:04.766818', '2025-09-19 07:05:04.766818');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('11007c39-6c08-4ba7-a6a2-85376cead6d6', '241', 'period_filter', '{"x": 3, "y": 0, "width": 1, "height": 1}', '{}', true, '2025-09-19 07:05:04.771897', '2025-09-19 07:05:04.771897');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('54d847a6-d664-42eb-a867-a33c631feaaf', '241', 'cost_to_company', '{"x": 0, "y": 1, "width": 1, "height": 1}', '{}', true, '2025-09-19 07:05:04.828827', '2025-09-19 07:05:04.828827');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('790e6939-9d18-4f5f-99f2-ddb4de65b5ba', '241', 'monthly_insights', '{"x": 1, "y": 1, "width": 1, "height": 1}', '{}', true, '2025-09-19 07:05:05.07787', '2025-09-19 07:05:05.07787');
INSERT INTO public.dashboard_widgets (id, user_id, widget_type, "position", config, is_visible, created_at, updated_at) VALUES ('50b4da54-17b7-4ca5-8543-94634a2ea488', '241', 'expense_trends', '{"x": 2, "y": 1, "width": 2, "height": 1}', '{}', true, '2025-09-19 07:05:05.081841', '2025-09-19 07:05:05.081841');


--
-- Data for Name: direct_expenses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: expense_claims; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('5d012025-dafe-454b-8215-a083398f9be0', '1', NULL, 'Rent', '', 1000.00, 0.00, 1000.00, 'INR', NULL, 0.00, 1000.00, NULL, NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-16 09:44:41.756451', NULL, NULL, NULL, '2025-09-16 09:44:41.756451', '2025-09-16 09:44:41.756451', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('89cb16be-1ce8-49aa-a217-ba278fe2bf49', '1', NULL, 'Rent', '', 1000.00, 0.00, 1000.00, 'INR', NULL, 0.00, 1000.00, NULL, NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-16 09:44:48.566847', NULL, NULL, NULL, '2025-09-16 09:44:48.566847', '2025-09-16 09:44:48.566847', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('b21ef87d-687d-459e-b51b-467697b9be4e', '1', NULL, 'TEst flow', '', 1000.00, 0.00, 1000.00, 'INR', NULL, 0.00, 1000.00, NULL, NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-16 16:23:33.269333', NULL, NULL, NULL, '2025-09-16 16:23:33.269333', '2025-09-16 16:23:33.269333', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('07023ee2-33ee-41a6-84e5-23bf72f60459', '1', NULL, 'Milk', '', 9999.84, 0.00, 0.00, 'INR', NULL, 0.00, 8999.86, 'efc7d238-76d4-4469-87dd-49f07bd028f4', NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-16 18:23:57.905', NULL, NULL, NULL, '2025-09-16 18:23:57.927788', '2025-09-16 18:23:57.927788', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('920ad8f2-7e40-43ad-a8f3-9ce0423e869e', '1', NULL, 'Rent', '', 50000.00, 0.00, 50000.00, 'INR', NULL, 0.00, 50000.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-17 08:08:50.3961', NULL, NULL, NULL, '2025-09-17 08:08:50.3961', '2025-09-17 08:08:50.3961', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('b8d5788f-8ea6-4209-bf48-ae290e62525d', '1', NULL, 'Montlhy Rent', '', 25000.00, 0.00, 0.00, 'INR', NULL, 0.00, 22500.00, 'efc7d238-76d4-4469-87dd-49f07bd028f4', NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-17 11:41:00.35', NULL, NULL, NULL, '2025-09-17 11:41:00.372311', '2025-09-17 11:41:00.372311', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('ac2570d7-b0ad-4064-8cda-fede810e1730', '1', NULL, 'Resolve Rent', '', 26000.00, 0.00, 0.00, 'INR', NULL, 0.00, 23400.00, 'efc7d238-76d4-4469-87dd-49f07bd028f4', NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-17 12:05:33.381', NULL, NULL, NULL, '2025-09-17 12:05:33.402597', '2025-09-17 12:05:33.402597', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('9c4fbac2-52a3-4b71-9915-eeb5afb823c8', '1', NULL, 'Electricity Bill', '', 7000.00, 0.00, 0.00, 'INR', NULL, 0.00, 6300.00, 'efc7d238-76d4-4469-87dd-49f07bd028f4', NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-17 18:12:44.966', NULL, NULL, NULL, '2025-09-17 18:12:44.98622', '2025-09-17 18:12:44.98622', '2025-09-07 00:00:00', false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('b972d4e4-ded9-4b85-ba09-46c312940ff0', '1', NULL, 'Bescom', '', 3665.00, 0.00, 0.00, 'INR', NULL, 0.00, 3298.50, 'efc7d238-76d4-4469-87dd-49f07bd028f4', NULL, 'submitted', 'manager', NULL, NULL, NULL, NULL, NULL, '2025-09-17 18:24:27.96', NULL, NULL, NULL, '2025-09-17 18:24:27.985433', '2025-09-17 18:24:27.985433', '2025-09-11 00:00:00', false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('4e348b41-9a00-4961-8c24-85c1a672c401', '1', NULL, 'CAl2', '', 12222.00, 0.00, 12222.00, 'INR', NULL, 0.00, 12222.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-18 08:00:22.471885', NULL, NULL, NULL, '2025-09-18 08:00:22.471885', '2025-09-18 08:00:22.471885', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('9ec4b87c-ef4b-43a8-aa04-f43c704e7e88', '1', NULL, 'Rent2', '', 34444.00, 0.00, 34444.00, 'INR', NULL, 0.00, 34444.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-18 08:12:21.350228', NULL, NULL, NULL, '2025-09-18 08:12:21.350228', '2025-09-18 08:12:21.350228', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('0e4a5f63-c7c2-49a5-a48d-287a8f4f4e9e', '1', NULL, 'Final test', '', 56666.00, 0.00, 56666.00, 'INR', NULL, 0.00, 56666.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-18 08:49:39.773589', NULL, NULL, NULL, '2025-09-18 08:49:39.773589', '2025-09-18 08:49:39.773589', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('3aba7694-ac62-4144-8099-ac961b8667b0', '1', NULL, 'Claim 3', '', 4500.00, 0.00, 4500.00, 'INR', NULL, 0.00, 4500.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-18 09:11:56.681053', NULL, NULL, NULL, '2025-09-18 09:11:56.681053', '2025-09-18 09:11:56.681053', NULL, false, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('4bcebe71-86ec-4c51-8b89-c510dc218de7', '1', NULL, 'Lunch/dinner', '', 6779.00, 0.00, 6779.00, 'INR', NULL, 0.00, 6779.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-18 09:13:36.74336', NULL, NULL, NULL, '2025-09-18 09:13:36.74336', '2025-09-18 09:13:36.74336', NULL, false, 3, NULL, NULL, 'Srikanth D G', '1001', 'resolvepaytest@gmail.com');
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('9322cc21-7eea-4d40-89e5-614f9fe7f4d4', '1', NULL, 'TEST22', '', 353535.00, 0.00, 353535.00, 'INR', NULL, 0.00, 353535.00, NULL, NULL, 'pending_manager', 'manager', '1', NULL, NULL, NULL, NULL, '2025-09-18 20:00:49.875925', NULL, NULL, NULL, '2025-09-18 20:00:49.875925', '2025-09-18 20:00:49.875925', NULL, false, 3, NULL, NULL, 'Srikanth D G', '1001', 'resolvepaytest@gmail.com');
INSERT INTO public.expense_claims (id, user_id, request_id, title, description, total_amount, original_request_amount, extra_amount, currency, advance_payment_id, advance_amount, balance_payment, vendor_id, vendor_invoice_number, status, current_approval_level, pending_with, utr_number, payment_date, processed_by, processed_at, submitted_at, approved_at, paid_at, approved_by, created_at, updated_at, vendor_due_date, enable_due_date_reminder, due_date_reminder_days, last_due_date_reminder_sent, workflow_id, employer_name, employee_number, employee_email) VALUES ('d17f4ed0-ca24-490b-b3ba-db49b2d0aeaf', '1', NULL, 'CAl5', '', 54.00, 0.00, 54.00, 'INR', NULL, 0.00, 54.00, NULL, NULL, 'approved', 'auto_approved', NULL, NULL, NULL, NULL, NULL, '2025-09-18 20:14:11.243426', '2025-09-18 20:14:11.221', NULL, '1', '2025-09-18 20:14:11.243426', '2025-09-18 20:14:11.243426', NULL, false, 3, NULL, NULL, 'Srikanth D G', '1001', 'resolvepaytest@gmail.com');


--
-- Data for Name: expense_groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_groups (id, name, status, created_at, updated_at) VALUES ('7eea724c-2040-49a9-b82f-3a0085959641', 'Travel Expense', true, '2025-09-16 07:31:37.432493', '2025-09-16 07:31:37.432493');


--
-- Data for Name: expense_heads; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_heads (id, name, expense_group_id, accounting_code, accounting_ledger, status, supporting_required, claim_form, applicable_for, created_at, updated_at) VALUES ('7686f2ea-bad7-49c3-9607-650ec6491949', 'Ticket', '7eea724c-2040-49a9-b82f-3a0085959641', '', '', true, false, 'expense', 'both', '2025-09-16 07:31:52.95946', '2025-09-16 07:31:52.95946');
INSERT INTO public.expense_heads (id, name, expense_group_id, accounting_code, accounting_ledger, status, supporting_required, claim_form, applicable_for, created_at, updated_at) VALUES ('9f8f01ce-9a72-4dee-bcef-6f3fea8c4370', 'Ticket', '7eea724c-2040-49a9-b82f-3a0085959641', '', '', true, false, 'ticket', 'both', '2025-09-16 09:03:29.689115', '2025-09-16 09:03:29.689115');
INSERT INTO public.expense_heads (id, name, expense_group_id, accounting_code, accounting_ledger, status, supporting_required, claim_form, applicable_for, created_at, updated_at) VALUES ('b2517da9-c867-4dc2-af46-0cbe91747d9d', 'Hotel', '7eea724c-2040-49a9-b82f-3a0085959641', '', '', true, false, 'accommodation', 'both', '2025-09-16 11:16:54.591157', '2025-09-16 11:16:54.591157');


--
-- Data for Name: expense_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('8b773cf3-d21c-4d22-8399-cce1dbef98da', 'b21ef87d-687d-459e-b51b-467697b9be4e', '7686f2ea-bad7-49c3-9607-650ec6491949', 'Davanger - Expense', 1000.00, 'INR', '2025-09-08 00:00:00', NULL, NULL, '2025-09-16 16:23:33.369852');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('661f907f-14d9-46c9-b94a-e4a9a24aa622', '920ad8f2-7e40-43ad-a8f3-9ce0423e869e', 'b2517da9-c867-4dc2-af46-0cbe91747d9d', 'Davangere - Expense', 50000.00, 'INR', '2025-09-16 00:00:00', NULL, NULL, '2025-09-17 08:08:50.461471');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('9017be32-d0a9-44c3-87a5-ebe7ea79c9ae', '4e348b41-9a00-4961-8c24-85c1a672c401', 'b2517da9-c867-4dc2-af46-0cbe91747d9d', 'Davanger to Bengaluru - Ticket', 12222.00, 'INR', '2025-09-10 00:00:00', NULL, NULL, '2025-09-18 08:00:22.543791');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('7da065d3-c0bf-49a8-85d3-214a92a09d87', '9ec4b87c-ef4b-43a8-aa04-f43c704e7e88', 'b2517da9-c867-4dc2-af46-0cbe91747d9d', 'Davanger - Expense', 34444.00, 'INR', '2025-09-16 00:00:00', NULL, NULL, '2025-09-18 08:12:21.409958');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('e8089f02-e3da-43a8-a97f-785ae92a1708', '0e4a5f63-c7c2-49a5-a48d-287a8f4f4e9e', 'b2517da9-c867-4dc2-af46-0cbe91747d9d', 'bb - Accommodation', 56666.00, 'INR', '2025-09-11 00:00:00', NULL, NULL, '2025-09-18 08:49:39.833049');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('ddbca983-b48b-49a7-bc4a-3b267f6dd08f', '3aba7694-ac62-4144-8099-ac961b8667b0', '7686f2ea-bad7-49c3-9607-650ec6491949', 'Davangere - Accommodation', 4500.00, 'INR', '2025-09-16 00:00:00', NULL, NULL, '2025-09-18 09:11:56.757403');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('d504a588-1a0d-49a1-81c9-0ff2767ccc74', '4bcebe71-86ec-4c51-8b89-c510dc218de7', '7686f2ea-bad7-49c3-9607-650ec6491949', 'Davangere - Expense', 6779.00, 'INR', '2025-09-10 00:00:00', NULL, NULL, '2025-09-18 09:13:36.795695');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('0a007f91-5de4-49d3-8966-b3f7389be6be', '9322cc21-7eea-4d40-89e5-614f9fe7f4d4', '7686f2ea-bad7-49c3-9607-650ec6491949', 'Davanger - Expense', 353535.00, 'INR', '2025-09-22 00:00:00', NULL, NULL, '2025-09-18 20:00:49.939085');
INSERT INTO public.expense_items (id, claim_id, category_id, description, amount, currency, date, receipt_url, receipt_file_name, created_at) VALUES ('2673da32-18ac-4c47-a3d2-b1fddda69c78', 'd17f4ed0-ca24-490b-b3ba-db49b2d0aeaf', '7686f2ea-bad7-49c3-9607-650ec6491949', 'Davanger - Expense', 54.00, 'INR', '2025-09-02 00:00:00', NULL, NULL, '2025-09-18 20:14:11.307181');


--
-- Data for Name: expense_policies; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: expense_requests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('e4068981-e60c-4b0e-b4be-8b6a6f172c27', '1', 'cash_advance', 'Marketing Request', '', 25000.00, 'INR', '2025-09-16 00:00:00', '2025-09-19 00:00:00', 'submitted', NULL, NULL, NULL, '2025-09-17 05:22:17.008179', '2025-09-17 05:22:17.008179', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('30cd388b-814b-4094-b4dc-4e2fa4d3f29e', '1', 'advance_payment', 'Lunch', '', 4555.00, 'INR', '2025-09-16 00:00:00', '2025-09-17 00:00:00', 'submitted', NULL, NULL, NULL, '2025-09-17 06:09:47.297135', '2025-09-17 06:09:47.297135', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('71b23d05-c9a8-42db-bd22-5d7487c3363c', '1', 'cash_advance', 'Resolve', '', 23000.00, 'INR', '2025-09-17 00:00:00', '2025-09-18 00:00:00', 'submitted', NULL, NULL, NULL, '2025-09-17 06:11:14.700046', '2025-09-17 06:11:14.700046', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('855f02ad-1115-4aad-ade5-c674ab972f3d', '1', 'travel', 'Sandesh', 'SB', 1250.00, 'INR', '2025-09-23 00:00:00', '2025-09-26 00:00:00', 'submitted', NULL, NULL, NULL, '2025-09-17 09:21:38.98616', '2025-09-17 09:21:38.98616', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('5d1ec1a0-eefb-4314-873a-a7046b471e4e', '1', 'cash_advance', 'Resolve first Claim', '', 1568.00, 'INR', '2025-09-23 00:00:00', '2025-09-30 00:00:00', 'submitted', NULL, NULL, NULL, '2025-09-17 10:03:04.929691', '2025-09-17 10:03:04.929691', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('30270ef8-3c6d-49d5-a6cf-d5472aec43d6', '1', 'cash_advance', 'Workflow test', '', 1200.00, 'INR', '2025-09-29 00:00:00', '2025-09-30 00:00:00', 'submitted', NULL, NULL, NULL, '2025-09-17 10:13:33.890322', '2025-09-17 10:13:33.890322', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('daf0c837-5f1c-4c0d-b0b3-3fac700e0f10', '1', 'cash_advance', 'OHH', '', 12000.00, 'INR', '2025-09-16 00:00:00', '2025-09-19 00:00:00', 'approved', '1', '2025-09-17 11:06:09.709', NULL, '2025-09-17 11:01:06.113612', '2025-09-17 11:06:09.709', 'manager', '1', NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('de5e17e4-1236-43fa-94cd-a0cce5564c49', '1', 'cash_advance', 'Bharath', '', 2333.00, 'INR', '2025-09-16 00:00:00', '2025-09-19 00:00:00', 'approved', '1', '2025-09-17 11:12:24.142', NULL, '2025-09-17 10:53:53.344295', '2025-09-17 11:12:24.142', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('a9396646-d11e-4dfc-b41d-30817f9cb51c', '1', 'cash_advance', 'INDIA', '', 10999.00, 'INR', '2025-09-29 00:00:00', '2025-09-30 00:00:00', 'approved', '1', '2025-09-17 11:12:31.977', NULL, '2025-09-17 10:45:45.653984', '2025-09-17 11:12:31.977', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('ac4f4ab0-b49d-4c71-89a6-eb59d2f0dc78', '1', 'cash_advance', 'TEST final', '', 1000.00, 'INR', '2025-09-16 00:00:00', '2025-09-17 00:00:00', 'approved', '1', '2025-09-18 04:19:24.917', NULL, '2025-09-16 15:59:02.956353', '2025-09-18 04:19:24.917', 'manager', NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.expense_requests (id, user_id, type, title, description, estimated_amount, currency, start_date, end_date, status, approved_by, approved_at, paid_at, created_at, updated_at, current_approval_level, pending_with, workflow_id, employer_name, employee_number, employee_email) VALUES ('96624418-0a4d-4879-abe6-9d482402918d', '1', 'cash_advance', 'TY', '', 88888.00, 'INR', '2025-09-24 00:00:00', '2025-09-25 00:00:00', 'approved', '1', '2025-09-18 20:15:22.595', NULL, '2025-09-18 20:14:57.335507', '2025-09-18 20:15:22.595', 'manager', '1', NULL, 'Srikanth D G', '1001', 'resolvepaytest@gmail.com');


--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: parties; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payment_batch_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payment_batches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: petty_cash_receipts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: petty_cash_transactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: process_master; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('4ba587e4-6e52-4789-8ca7-4a905209f363', 'claim', 'Expense Claim', 'Employee expense reimbursement claims', NULL, true, true, '2025-09-17 09:36:38.231937', '2025-09-17 09:36:38.231937');
INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('9831d1fd-3801-4d2e-8044-d8fe7ca22c48', 'payment', 'Payment Processing', 'Payment batch processing workflows', NULL, true, true, '2025-09-17 09:36:38.231937', '2025-09-17 09:36:38.231937');
INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('83ac32e0-8552-4542-9357-1c3669be2515', 'vendor', 'Vendor Onboarding', 'Vendor onboarding approval workflows', NULL, true, true, '2025-09-17 09:36:38.231937', '2025-09-17 09:36:38.231937');
INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('e3b27aab-7396-4fb4-8841-755a81c32bc6', 'request', 'Expense Request', 'Employee expense pre-approval requests', NULL, false, true, '2025-09-17 09:36:38.231937', '2025-09-17 09:36:38.231937');
INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('c5213b6f-c0c8-43df-bb2a-ec9c4c6aaf65', 'vendorclaim', 'Vendor Claims', 'Vendor invoice claims and reimbursements', NULL, true, true, '2025-09-19 07:46:59.915327', '2025-09-19 07:46:59.915327');
INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('9b6c51c1-e4af-42cc-a890-e4c99186cb04', 'pettycash', 'Petty Cashbox', 'Petty cash transactions and cashbox management', NULL, true, true, '2025-09-19 07:46:59.915327', '2025-09-19 07:46:59.915327');
INSERT INTO public.process_master (id, process_type, display_name, description, default_workflow_id, auto_approve_when_no_workflow, is_active, created_at, updated_at) VALUES ('10580d19-0de5-4b77-8e94-56b4352b4e92', 'directexpense', 'Direct Expense', 'Company-level direct expenses', NULL, true, true, '2025-09-19 07:46:59.915327', '2025-09-19 07:46:59.915327');


--
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sessions (sid, sess, expire) VALUES ('y59YBaiORv-yS8By_hxeW8HqNNs_APaB', '{"cookie": {"path": "/", "secure": true, "expires": "2025-09-24T07:17:01.777Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "4fba88fd-51fa-463e-89fc-eea1e952ed85", "exp": 1758097021, "iat": 1758093421, "iss": "https://replit.com/oidc", "sub": "47611237", "email": "sandesh@resolveindia.com", "at_hash": "xgWjh6dyfhcBgUtZ0zJddg", "username": "sandesh29", "auth_time": 1757922829, "last_name": "SB", "first_name": "Sandesh"}, "expires_at": 1758097021, "access_token": "HjfYcm3CZWFjlaFZx8a5I2vlH7iwsWcv5PbzRePHuYl", "refresh_token": "GDuKjliS_azzmEfNIjx5ohCK7zss_1U38HBeCVVdUFS"}}}', '2025-09-24 08:14:07');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('9fcdww4Dl3MZ1t6ZP-vIzIf0v3sLGG9C', '{"cookie": {"path": "/", "secure": true, "expires": "2025-09-22T11:25:29.088Z", "httpOnly": true, "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"aud": "4fba88fd-51fa-463e-89fc-eea1e952ed85", "exp": 1757939129, "iat": 1757935529, "iss": "https://replit.com/oidc", "sub": "47611237", "email": "sandesh@resolveindia.com", "at_hash": "UNleu9J2QDdRYp9fmrpuEQ", "username": "sandesh29", "auth_time": 1757930889, "last_name": "SB", "first_name": "Sandesh"}, "expires_at": 1757939129, "access_token": "IOvx5xPlrt9RQ4cDCSl0UHxuodVL5V5pyoC7p4fM6SE", "refresh_token": "vK2NVQnVo9BCTrW99K27GsPu9F1h-j604nSZw6L6Zou"}}}', '2025-09-23 05:17:18');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('c4qUjngzDzCRVUAAwj2OcA9aP1BZWDoP', '{"cookie": {"path": "/", "secure": true, "expires": "2025-09-22T10:25:04.254Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "4fba88fd-51fa-463e-89fc-eea1e952ed85", "exp": 1757935503, "iat": 1757931903, "iss": "https://replit.com/oidc", "sub": "47615958", "email": "sandeshsb25260@gmail.com", "at_hash": "YNIRT64pMv39AWOjk2-SPA", "username": "sandeshsb25260", "auth_time": 1757931903, "last_name": "rao", "first_name": "Rohan"}, "expires_at": 1757935503, "access_token": "-dUzZSghS-xwljQXP653ytuCGaROZDH0wmvm3MxXv_m", "refresh_token": "ckw8IZUoXjy8CWLMT7Toy1Zlf0wFIfDVjgENZE4njhu"}}}', '2025-09-22 11:07:06');


--
-- Data for Name: tds_master; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tds_master (id, category, category_name, default_rate, description, is_active, created_at, updated_at) VALUES ('ee3c2e90-4af8-43d0-b44c-a88aaf6f922f', '12', 'Professional', 10.00, '', true, '2025-09-16 11:32:15.768473', '2025-09-16 11:32:15.768473');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, first_name, last_name, profile_image_url, role, company_id, created_at, updated_at) VALUES ('47615958', 'sandeshsb25260@gmail.com', 'Rohan', 'rao', NULL, 'employee', NULL, '2025-09-15 10:25:04.130596', '2025-09-15 10:25:04.130596');
INSERT INTO public.users (id, email, first_name, last_name, profile_image_url, role, company_id, created_at, updated_at) VALUES ('1', 'user-1@example.com', 'User', '1', NULL, 'admin', '13', '2025-09-17 04:34:29.241155', '2025-09-17 04:34:29.241155');
INSERT INTO public.users (id, email, first_name, last_name, profile_image_url, role, company_id, created_at, updated_at) VALUES ('47611237', 'sandesh@resolveindia.com', 'Sandesh', 'SB', NULL, 'employee', '13', '2025-09-15 07:53:52.427513', '2025-09-15 10:08:09.845');
INSERT INTO public.users (id, email, first_name, last_name, profile_image_url, role, company_id, created_at, updated_at) VALUES ('241', 'user241@company.com', 'User', '241', NULL, 'employee', '13', '2025-09-19 07:03:01.614705', '2025-09-19 07:03:01.614705');


--
-- Data for Name: vendor_documents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: vendor_onboarding_requests; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: vendor_payment_history; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vendors (id, name, address, contact_person, phone, email, account_number, ifsc_code, bank_name, bank_branch, gstin, pan, tds_category, msme_status, msme_number, tds_rate, is_less_rates, custom_tds_rate, tds_rate_from_date, tds_rate_to_date, status, created_by, total_paid, last_payment_date, last_payment_utr, created_at, updated_at) VALUES ('efc7d238-76d4-4469-87dd-49f07bd028f4', 'TEST', '', '', '', '', '', '', 'SBI', '', '12XXXXX0000X1Z1', 'XXXXX0000X', '12', 'not_applicable', '', 10.00, true, 1.00, '2025-09-15 00:00:00', '2025-09-17 00:00:00', 'active', NULL, 0.00, NULL, NULL, '2025-09-16 11:37:00.00102', '2025-09-16 11:37:00.00102');
INSERT INTO public.vendors (id, name, address, contact_person, phone, email, account_number, ifsc_code, bank_name, bank_branch, gstin, pan, tds_category, msme_status, msme_number, tds_rate, is_less_rates, custom_tds_rate, tds_rate_from_date, tds_rate_to_date, status, created_by, total_paid, last_payment_date, last_payment_utr, created_at, updated_at) VALUES ('d35cb98a-4a2b-437d-8ced-752462e3c16a', 'test', '', 'test', '', 'test@gmail.com', '', '', '', '', '', 'AAAPA1234A', '12', 'not_applicable', '', 10.00, true, 3.00, '1900-01-01 00:00:00', '1900-01-01 00:00:00', 'active', NULL, 0.00, NULL, NULL, '2025-09-17 05:35:50.810831', '2025-09-17 05:35:50.810831');


--
-- Data for Name: workflow_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflow_assignments (id, workflow_id, process_type, vendor_id, expense_head_id, company_id, is_default, priority, created_at) VALUES ('590f9111-24fc-44fa-b050-e770147c4e39', '0b13f674-3c48-401c-849a-1c980895fbbe', 'request', NULL, NULL, '13', true, 0, '2025-09-17 10:38:48.150275');
INSERT INTO public.workflow_assignments (id, workflow_id, process_type, vendor_id, expense_head_id, company_id, is_default, priority, created_at) VALUES ('56fd4834-7729-4d38-8c77-856260ad3944', '5d10fd7b-c062-494f-8483-821adc5a64ff', 'claim', NULL, NULL, '13', true, 0, '2025-09-19 07:04:23.51762');


--
-- Data for Name: workflow_instances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('40506bd0-2df4-4e24-aec2-624293856ecc', 'a9396646-d11e-4dfc-b41d-30817f9cb51c', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:53.513853', '2025-09-17 10:51:53.513853');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('02f41669-98e1-4ed4-9bae-9984c53c9e6a', '30270ef8-3c6d-49d5-a6cf-d5472aec43d6', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:53.982371', '2025-09-17 10:51:53.982371');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('fc77d06e-f504-475e-b1ff-e3bac56068eb', '5d1ec1a0-eefb-4314-873a-a7046b471e4e', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:54.460659', '2025-09-17 10:51:54.460659');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('873ed6cf-cb87-4ceb-a316-498983f3e8e6', '855f02ad-1115-4aad-ade5-c674ab972f3d', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:54.937128', '2025-09-17 10:51:54.937128');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('32db9dc9-7ab6-4c5f-93e8-59dcecdb5cbc', '71b23d05-c9a8-42db-bd22-5d7487c3363c', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:55.392776', '2025-09-17 10:51:55.392776');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('cf221f30-6556-4702-a0b0-51b6184cc236', '30cd388b-814b-4094-b4dc-4e2fa4d3f29e', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:55.855705', '2025-09-17 10:51:55.855705');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('b8ef5b42-38ee-4c60-9ee7-f61af798f517', 'e4068981-e60c-4b0e-b4be-8b6a6f172c27', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:56.307614', '2025-09-17 10:51:56.307614');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('d8de873c-bd74-4f43-a554-a89ad3fe2488', 'ac4f4ab0-b49d-4c71-89a6-eb59d2f0dc78', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:51:56.755967', '2025-09-17 10:51:56.755967');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('25aef3ac-31e7-472c-a708-86435276aa89', 'de5e17e4-1236-43fa-94cd-a0cce5564c49', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 10:53:57.966997', '2025-09-17 10:53:57.966997');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('6909756b-39a0-4579-95b1-66bad8b8d58d', 'daf0c837-5f1c-4c0d-b0b3-3fac700e0f10', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-17 11:01:10.234784', '2025-09-17 11:01:10.234784');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('aa96ecaf-e0d6-4e03-b8fa-b687bcac9e29', '96624418-0a4d-4879-abe6-9d482402918d', 'request', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, 'pending', '2025-09-18 20:15:13.961736', '2025-09-18 20:15:13.961736');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('162e5b4e-3884-4656-9292-23bf478490b0', 'd17f4ed0-ca24-490b-b3ba-db49b2d0aeaf', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:27.296796', '2025-09-19 07:05:27.296796');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('5493256e-e33f-4480-ad98-d6289b6dc17c', '9322cc21-7eea-4d40-89e5-614f9fe7f4d4', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:27.65485', '2025-09-19 07:05:27.65485');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('abcd2183-07ce-4ce5-be68-1a38ae7960f1', '4bcebe71-86ec-4c51-8b89-c510dc218de7', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:28.007462', '2025-09-19 07:05:28.007462');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('37618898-ebab-409e-b636-49acd15c0b3d', '3aba7694-ac62-4144-8099-ac961b8667b0', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:28.361886', '2025-09-19 07:05:28.361886');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('3949d483-d930-48a8-85bb-d047f4b258c7', '0e4a5f63-c7c2-49a5-a48d-287a8f4f4e9e', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:28.732263', '2025-09-19 07:05:28.732263');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('39cf59c1-bc68-4a16-b631-3de9f6c00c3f', '9ec4b87c-ef4b-43a8-aa04-f43c704e7e88', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:29.091594', '2025-09-19 07:05:29.091594');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('3f3af18b-8d9b-4f2f-b16e-1c049a00d693', '4e348b41-9a00-4961-8c24-85c1a672c401', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:29.446989', '2025-09-19 07:05:29.446989');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('84448670-f89a-468f-b4ac-5f8412310800', 'b972d4e4-ded9-4b85-ba09-46c312940ff0', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:29.80626', '2025-09-19 07:05:29.80626');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('b097c436-06f1-4129-8630-5b8b8860c1db', '9c4fbac2-52a3-4b71-9915-eeb5afb823c8', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:30.165547', '2025-09-19 07:05:30.165547');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('ee404456-9b03-4790-9370-519bd8eb2844', 'ac2570d7-b0ad-4064-8cda-fede810e1730', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:30.519988', '2025-09-19 07:05:30.519988');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('68addaaa-38c4-48f8-9edd-6ec73bcaf127', 'b8d5788f-8ea6-4209-bf48-ae290e62525d', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:30.877018', '2025-09-19 07:05:30.877018');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('9191fe5b-fe47-4f80-85d0-63f7a38a76b3', '920ad8f2-7e40-43ad-a8f3-9ce0423e869e', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:31.232778', '2025-09-19 07:05:31.232778');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('235fc3d3-46ac-49a7-b412-950f3b0f1f7f', '07023ee2-33ee-41a6-84e5-23bf72f60459', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:31.587447', '2025-09-19 07:05:31.587447');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('a30802df-2958-4275-9a93-daefd707a218', 'b21ef87d-687d-459e-b51b-467697b9be4e', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:31.94687', '2025-09-19 07:05:31.94687');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('21c08619-de69-47f7-b0f8-3cb7b3693eb0', '89cb16be-1ce8-49aa-a217-ba278fe2bf49', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:32.299807', '2025-09-19 07:05:32.299807');
INSERT INTO public.workflow_instances (id, entity_id, entity_type, workflow_id, current_level, status, created_at, updated_at) VALUES ('291745da-3f99-43ef-bb0d-b3a679e0be9f', '5d012025-dafe-454b-8215-a083398f9be0', 'claim', '5d10fd7b-c062-494f-8483-821adc5a64ff', 1, 'pending', '2025-09-19 07:05:32.657055', '2025-09-19 07:05:32.657055');


--
-- Data for Name: workflow_levels; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflow_levels (id, workflow_id, level, role_id, min_amount, max_amount, is_required, created_at) VALUES ('09f03333-c68d-44a5-a3e8-5b978f0bf2fe', '0b13f674-3c48-401c-849a-1c980895fbbe', 1, '7e4494db-0032-4589-a870-5391bc4668a2', NULL, NULL, true, '2025-09-17 10:13:03.356371');


--
-- Data for Name: workflow_roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflow_roles (id, name, description, menu_keys, company_id, is_active, created_at, updated_at) VALUES ('3f7a9af2-ff84-4c4f-8708-4d3ace52693b', 'Employee', 'Employee', '["payments-initiate","dashboard","direct-expenses","receipts","reports","employee-claim","employee-uploads","employee-request","approval-tracker"]', '13', true, '2025-09-16 07:07:34.252303', '2025-09-16 07:21:52.236');
INSERT INTO public.workflow_roles (id, name, description, menu_keys, company_id, is_active, created_at, updated_at) VALUES ('7e4494db-0032-4589-a870-5391bc4668a2', 'Admin', 'Admin', '["dashboard","approvals","admin","configuration","vendors","vendor-claim","direct-expenses","vendor-reports","contracts","petty-cash","payments-initiate","payments-process","card-statements","payments-release","receipts","reports","access-rights","employee-request","employee-uploads","vendor-onboarding","employee-claim","approval-tracker","vendor-add"]', '13', true, '2025-09-15 09:23:12.841886', '2025-09-16 11:22:53.137');


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflows (id, name, description, process_types, company_id, is_active, is_default, created_at, updated_at, approval_condition_type) VALUES ('0b13f674-3c48-401c-849a-1c980895fbbe', 'Expense Request', '', '["request"]', '13', true, false, '2025-09-17 10:13:03.356371', '2025-09-17 10:13:03.356371', 'process-based');
INSERT INTO public.workflows (id, name, description, process_types, company_id, is_active, is_default, created_at, updated_at, approval_condition_type) VALUES ('5d10fd7b-c062-494f-8483-821adc5a64ff', 'Expense Claims Workflow', 'Workflow for processing expense claims', '["claim"]', '13', true, false, '2025-09-19 07:04:15.220868', '2025-09-19 07:04:15.220868', 'process-based');


--
-- Name: advance_payments advance_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_payments
    ADD CONSTRAINT advance_payments_pkey PRIMARY KEY (id);


--
-- Name: agent_conversations agent_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_pkey PRIMARY KEY (id);


--
-- Name: agent_messages agent_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);


--
-- Name: approval_history approval_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_pkey PRIMARY KEY (id);


--
-- Name: automated_tasks automated_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automated_tasks
    ADD CONSTRAINT automated_tasks_pkey PRIMARY KEY (id);


--
-- Name: bank_advice bank_advice_advice_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice
    ADD CONSTRAINT bank_advice_advice_number_unique UNIQUE (advice_number);


--
-- Name: bank_advice_items bank_advice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice_items
    ADD CONSTRAINT bank_advice_items_pkey PRIMARY KEY (id);


--
-- Name: bank_advice bank_advice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice
    ADD CONSTRAINT bank_advice_pkey PRIMARY KEY (id);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: bill_master_fields bill_master_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_master_fields
    ADD CONSTRAINT bill_master_fields_pkey PRIMARY KEY (id);


--
-- Name: bill_master_types bill_master_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_master_types
    ADD CONSTRAINT bill_master_types_pkey PRIMARY KEY (id);


--
-- Name: card_payments card_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_payments
    ADD CONSTRAINT card_payments_pkey PRIMARY KEY (id);


--
-- Name: card_statements card_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_statements
    ADD CONSTRAINT card_statements_pkey PRIMARY KEY (id);


--
-- Name: card_transactions card_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_transactions
    ADD CONSTRAINT card_transactions_pkey PRIMARY KEY (id);


--
-- Name: cashboxes cashboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashboxes
    ADD CONSTRAINT cashboxes_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: cost_centre_configs cost_centre_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_centre_configs
    ADD CONSTRAINT cost_centre_configs_pkey PRIMARY KEY (id);


--
-- Name: cost_distributions cost_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_distributions
    ADD CONSTRAINT cost_distributions_pkey PRIMARY KEY (id);


--
-- Name: custom_reports custom_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT custom_reports_pkey PRIMARY KEY (id);


--
-- Name: dashboard_widgets dashboard_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_pkey PRIMARY KEY (id);


--
-- Name: direct_expenses direct_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_expenses
    ADD CONSTRAINT direct_expenses_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_claims expense_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_pkey PRIMARY KEY (id);


--
-- Name: expense_groups expense_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_groups
    ADD CONSTRAINT expense_groups_pkey PRIMARY KEY (id);


--
-- Name: expense_heads expense_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_heads
    ADD CONSTRAINT expense_heads_pkey PRIMARY KEY (id);


--
-- Name: expense_items expense_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_pkey PRIMARY KEY (id);


--
-- Name: expense_policies expense_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_policies
    ADD CONSTRAINT expense_policies_pkey PRIMARY KEY (id);


--
-- Name: expense_requests expense_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_pkey PRIMARY KEY (id);


--
-- Name: payment_batch_items payment_batch_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batch_items
    ADD CONSTRAINT payment_batch_items_pkey PRIMARY KEY (id);


--
-- Name: payment_batches payment_batches_batch_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_batch_number_unique UNIQUE (batch_number);


--
-- Name: payment_batches payment_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_pkey PRIMARY KEY (id);


--
-- Name: petty_cash_receipts petty_cash_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_receipts
    ADD CONSTRAINT petty_cash_receipts_pkey PRIMARY KEY (id);


--
-- Name: petty_cash_transactions petty_cash_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_transactions
    ADD CONSTRAINT petty_cash_transactions_pkey PRIMARY KEY (id);


--
-- Name: process_master process_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.process_master
    ADD CONSTRAINT process_master_pkey PRIMARY KEY (id);


--
-- Name: process_master process_master_process_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.process_master
    ADD CONSTRAINT process_master_process_type_unique UNIQUE (process_type);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: tds_master tds_master_category_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_master
    ADD CONSTRAINT tds_master_category_unique UNIQUE (category);


--
-- Name: tds_master tds_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_master
    ADD CONSTRAINT tds_master_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendor_documents vendor_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_pkey PRIMARY KEY (id);


--
-- Name: vendor_onboarding_requests vendor_onboarding_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_onboarding_requests
    ADD CONSTRAINT vendor_onboarding_requests_pkey PRIMARY KEY (id);


--
-- Name: vendor_payment_history vendor_payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payment_history
    ADD CONSTRAINT vendor_payment_history_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: workflow_assignments workflow_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_assignments
    ADD CONSTRAINT workflow_assignments_pkey PRIMARY KEY (id);


--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: workflow_levels workflow_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_levels
    ADD CONSTRAINT workflow_levels_pkey PRIMARY KEY (id);


--
-- Name: workflow_roles workflow_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_roles
    ADD CONSTRAINT workflow_roles_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: unique_cashbox_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_cashbox_date ON public.ledger_entries USING btree (cashbox_id, date);


--
-- Name: advance_payments advance_payments_request_id_expense_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_payments
    ADD CONSTRAINT advance_payments_request_id_expense_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.expense_requests(id);


--
-- Name: advance_payments advance_payments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_payments
    ADD CONSTRAINT advance_payments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agent_conversations agent_conversations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agent_messages agent_messages_conversation_id_agent_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_conversation_id_agent_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.agent_conversations(id);


--
-- Name: approval_history approval_history_approver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_approver_id_users_id_fk FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: approval_history approval_history_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_claim_id_expense_claims_id_fk FOREIGN KEY (claim_id) REFERENCES public.expense_claims(id);


--
-- Name: approval_history approval_history_payment_batch_id_payment_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_payment_batch_id_payment_batches_id_fk FOREIGN KEY (payment_batch_id) REFERENCES public.payment_batches(id);


--
-- Name: bank_advice bank_advice_batch_id_payment_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice
    ADD CONSTRAINT bank_advice_batch_id_payment_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.payment_batches(id);


--
-- Name: bank_advice bank_advice_generated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice
    ADD CONSTRAINT bank_advice_generated_by_users_id_fk FOREIGN KEY (generated_by) REFERENCES public.users(id);


--
-- Name: bank_advice_items bank_advice_items_advice_id_bank_advice_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice_items
    ADD CONSTRAINT bank_advice_items_advice_id_bank_advice_id_fk FOREIGN KEY (advice_id) REFERENCES public.bank_advice(id);


--
-- Name: bank_advice_items bank_advice_items_direct_expense_id_direct_expenses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice_items
    ADD CONSTRAINT bank_advice_items_direct_expense_id_direct_expenses_id_fk FOREIGN KEY (direct_expense_id) REFERENCES public.direct_expenses(id);


--
-- Name: bank_advice_items bank_advice_items_expense_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice_items
    ADD CONSTRAINT bank_advice_items_expense_claim_id_expense_claims_id_fk FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id);


--
-- Name: bank_advice_items bank_advice_items_payee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_advice_items
    ADD CONSTRAINT bank_advice_items_payee_id_users_id_fk FOREIGN KEY (payee_id) REFERENCES public.users(id);


--
-- Name: bill_master_fields bill_master_fields_bill_type_id_bill_master_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_master_fields
    ADD CONSTRAINT bill_master_fields_bill_type_id_bill_master_types_id_fk FOREIGN KEY (bill_type_id) REFERENCES public.bill_master_types(id) ON DELETE CASCADE;


--
-- Name: card_payments card_payments_processed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_payments
    ADD CONSTRAINT card_payments_processed_by_users_id_fk FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: card_payments card_payments_statement_id_card_statements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_payments
    ADD CONSTRAINT card_payments_statement_id_card_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.card_statements(id);


--
-- Name: card_statements card_statements_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_statements
    ADD CONSTRAINT card_statements_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: card_transactions card_transactions_statement_id_card_statements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_transactions
    ADD CONSTRAINT card_transactions_statement_id_card_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.card_statements(id);


--
-- Name: cashboxes cashboxes_cashier_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashboxes
    ADD CONSTRAINT cashboxes_cashier_id_users_id_fk FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: contracts contracts_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: contracts contracts_expense_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_expense_claim_id_expense_claims_id_fk FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id);


--
-- Name: contracts contracts_vendor_id_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_vendor_id_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: cost_distributions cost_distributions_expense_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_distributions
    ADD CONSTRAINT cost_distributions_expense_claim_id_expense_claims_id_fk FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id) ON DELETE CASCADE;


--
-- Name: custom_reports custom_reports_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT custom_reports_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: dashboard_widgets dashboard_widgets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: direct_expenses direct_expenses_category_id_expense_heads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_expenses
    ADD CONSTRAINT direct_expenses_category_id_expense_heads_id_fk FOREIGN KEY (category_id) REFERENCES public.expense_heads(id);


--
-- Name: direct_expenses direct_expenses_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_expenses
    ADD CONSTRAINT direct_expenses_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expense_categories expense_categories_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: expense_claims expense_claims_advance_payment_id_advance_payments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_advance_payment_id_advance_payments_id_fk FOREIGN KEY (advance_payment_id) REFERENCES public.advance_payments(id);


--
-- Name: expense_claims expense_claims_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: expense_claims expense_claims_pending_with_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_pending_with_users_id_fk FOREIGN KEY (pending_with) REFERENCES public.users(id);


--
-- Name: expense_claims expense_claims_processed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_processed_by_users_id_fk FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: expense_claims expense_claims_request_id_expense_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_request_id_expense_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.expense_requests(id);


--
-- Name: expense_claims expense_claims_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expense_claims expense_claims_vendor_id_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_vendor_id_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: expense_claims expense_claims_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_claims
    ADD CONSTRAINT expense_claims_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: expense_heads expense_heads_expense_group_id_expense_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_heads
    ADD CONSTRAINT expense_heads_expense_group_id_expense_groups_id_fk FOREIGN KEY (expense_group_id) REFERENCES public.expense_groups(id);


--
-- Name: expense_items expense_items_category_id_expense_heads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_category_id_expense_heads_id_fk FOREIGN KEY (category_id) REFERENCES public.expense_heads(id);


--
-- Name: expense_items expense_items_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_items
    ADD CONSTRAINT expense_items_claim_id_expense_claims_id_fk FOREIGN KEY (claim_id) REFERENCES public.expense_claims(id);


--
-- Name: expense_policies expense_policies_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_policies
    ADD CONSTRAINT expense_policies_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: expense_policies expense_policies_expense_head_id_expense_heads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_policies
    ADD CONSTRAINT expense_policies_expense_head_id_expense_heads_id_fk FOREIGN KEY (expense_head_id) REFERENCES public.expense_heads(id);


--
-- Name: expense_requests expense_requests_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: expense_requests expense_requests_pending_with_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_pending_with_users_id_fk FOREIGN KEY (pending_with) REFERENCES public.users(id);


--
-- Name: expense_requests expense_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expense_requests expense_requests_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: ledger_entries ledger_entries_cashbox_id_cashboxes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_cashbox_id_cashboxes_id_fk FOREIGN KEY (cashbox_id) REFERENCES public.cashboxes(id);


--
-- Name: notifications notifications_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payment_batch_items payment_batch_items_batch_id_payment_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batch_items
    ADD CONSTRAINT payment_batch_items_batch_id_payment_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.payment_batches(id);


--
-- Name: payment_batch_items payment_batch_items_direct_expense_id_direct_expenses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batch_items
    ADD CONSTRAINT payment_batch_items_direct_expense_id_direct_expenses_id_fk FOREIGN KEY (direct_expense_id) REFERENCES public.direct_expenses(id);


--
-- Name: payment_batch_items payment_batch_items_expense_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batch_items
    ADD CONSTRAINT payment_batch_items_expense_claim_id_expense_claims_id_fk FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id);


--
-- Name: payment_batches payment_batches_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: payment_batches payment_batches_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payment_batches payment_batches_pending_with_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_pending_with_users_id_fk FOREIGN KEY (pending_with) REFERENCES public.users(id);


--
-- Name: payment_batches payment_batches_released_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_released_by_users_id_fk FOREIGN KEY (released_by) REFERENCES public.users(id);


--
-- Name: petty_cash_receipts petty_cash_receipts_bank_id_banks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_receipts
    ADD CONSTRAINT petty_cash_receipts_bank_id_banks_id_fk FOREIGN KEY (bank_id) REFERENCES public.banks(id);


--
-- Name: petty_cash_receipts petty_cash_receipts_open_advance_id_advance_payments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_receipts
    ADD CONSTRAINT petty_cash_receipts_open_advance_id_advance_payments_id_fk FOREIGN KEY (open_advance_id) REFERENCES public.advance_payments(id);


--
-- Name: petty_cash_receipts petty_cash_receipts_recorded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_receipts
    ADD CONSTRAINT petty_cash_receipts_recorded_by_users_id_fk FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: petty_cash_transactions petty_cash_transactions_cashbox_id_cashboxes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_transactions
    ADD CONSTRAINT petty_cash_transactions_cashbox_id_cashboxes_id_fk FOREIGN KEY (cashbox_id) REFERENCES public.cashboxes(id);


--
-- Name: petty_cash_transactions petty_cash_transactions_payee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_transactions
    ADD CONSTRAINT petty_cash_transactions_payee_id_users_id_fk FOREIGN KEY (payee_id) REFERENCES public.users(id);


--
-- Name: petty_cash_transactions petty_cash_transactions_recorded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_transactions
    ADD CONSTRAINT petty_cash_transactions_recorded_by_users_id_fk FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: petty_cash_transactions petty_cash_transactions_transfer_from_cashbox_id_cashboxes_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_transactions
    ADD CONSTRAINT petty_cash_transactions_transfer_from_cashbox_id_cashboxes_id_f FOREIGN KEY (transfer_from_cashbox_id) REFERENCES public.cashboxes(id);


--
-- Name: petty_cash_transactions petty_cash_transactions_transfer_to_cashbox_id_cashboxes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_transactions
    ADD CONSTRAINT petty_cash_transactions_transfer_to_cashbox_id_cashboxes_id_fk FOREIGN KEY (transfer_to_cashbox_id) REFERENCES public.cashboxes(id);


--
-- Name: process_master process_master_default_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.process_master
    ADD CONSTRAINT process_master_default_workflow_id_workflows_id_fk FOREIGN KEY (default_workflow_id) REFERENCES public.workflows(id);


--
-- Name: receipts receipts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: vendor_documents vendor_documents_onboarding_request_id_vendor_onboarding_reques; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_onboarding_request_id_vendor_onboarding_reques FOREIGN KEY (onboarding_request_id) REFERENCES public.vendor_onboarding_requests(id);


--
-- Name: vendor_documents vendor_documents_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: vendor_documents vendor_documents_vendor_id_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_vendor_id_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendor_documents vendor_documents_verified_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: vendor_onboarding_requests vendor_onboarding_requests_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_onboarding_requests
    ADD CONSTRAINT vendor_onboarding_requests_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: vendor_onboarding_requests vendor_onboarding_requests_pending_with_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_onboarding_requests
    ADD CONSTRAINT vendor_onboarding_requests_pending_with_users_id_fk FOREIGN KEY (pending_with) REFERENCES public.users(id);


--
-- Name: vendor_onboarding_requests vendor_onboarding_requests_rejected_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_onboarding_requests
    ADD CONSTRAINT vendor_onboarding_requests_rejected_by_users_id_fk FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: vendor_onboarding_requests vendor_onboarding_requests_requested_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_onboarding_requests
    ADD CONSTRAINT vendor_onboarding_requests_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: vendor_onboarding_requests vendor_onboarding_requests_vendor_id_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_onboarding_requests
    ADD CONSTRAINT vendor_onboarding_requests_vendor_id_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendor_payment_history vendor_payment_history_direct_expense_id_direct_expenses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payment_history
    ADD CONSTRAINT vendor_payment_history_direct_expense_id_direct_expenses_id_fk FOREIGN KEY (direct_expense_id) REFERENCES public.direct_expenses(id);


--
-- Name: vendor_payment_history vendor_payment_history_expense_claim_id_expense_claims_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payment_history
    ADD CONSTRAINT vendor_payment_history_expense_claim_id_expense_claims_id_fk FOREIGN KEY (expense_claim_id) REFERENCES public.expense_claims(id);


--
-- Name: vendor_payment_history vendor_payment_history_payment_batch_id_payment_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payment_history
    ADD CONSTRAINT vendor_payment_history_payment_batch_id_payment_batches_id_fk FOREIGN KEY (payment_batch_id) REFERENCES public.payment_batches(id);


--
-- Name: vendor_payment_history vendor_payment_history_processed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payment_history
    ADD CONSTRAINT vendor_payment_history_processed_by_users_id_fk FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: vendor_payment_history vendor_payment_history_vendor_id_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_payment_history
    ADD CONSTRAINT vendor_payment_history_vendor_id_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendors vendors_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: workflow_assignments workflow_assignments_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_assignments
    ADD CONSTRAINT workflow_assignments_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: workflow_assignments workflow_assignments_expense_head_id_expense_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_assignments
    ADD CONSTRAINT workflow_assignments_expense_head_id_expense_categories_id_fk FOREIGN KEY (expense_head_id) REFERENCES public.expense_categories(id);


--
-- Name: workflow_assignments workflow_assignments_vendor_id_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_assignments
    ADD CONSTRAINT workflow_assignments_vendor_id_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: workflow_assignments workflow_assignments_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_assignments
    ADD CONSTRAINT workflow_assignments_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflow_instances workflow_instances_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_levels workflow_levels_role_id_workflow_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_levels
    ADD CONSTRAINT workflow_levels_role_id_workflow_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.workflow_roles(id);


--
-- Name: workflow_levels workflow_levels_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_levels
    ADD CONSTRAINT workflow_levels_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflow_roles workflow_roles_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_roles
    ADD CONSTRAINT workflow_roles_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: workflows workflows_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

