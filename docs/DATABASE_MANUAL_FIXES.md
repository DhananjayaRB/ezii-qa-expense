# Database Manual Synchronization Fixes

## Overview
This document contains SQL queries that must be run manually on your PostgreSQL database when `npm run db:push` fails or doesn't sync properly. These queries resolve schema mismatches between your codebase and the actual database structure.

## ⚠️ **CRITICAL DATABASE SYNCHRONIZATION ISSUE IDENTIFIED**

### **Error Description:**
```
Error fetching direct expenses: error: column direct_expenses.employer_name does not exist
```

### **Root Cause:**
The `direct_expenses` table is missing several columns that exist in `expense_claims` table and are required by the application code.

## 🛠️ **IMMEDIATE FIXES REQUIRED**

### **1. Add Missing Columns to direct_expenses Table**

Run these SQL queries in your PostgreSQL database **in the exact order listed**:

```sql
-- Add employee/employer information columns
ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS employer_name TEXT;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS employee_number TEXT;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS employee_email TEXT;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- Add tracking and workflow columns
ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS approved_by VARCHAR;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS pending_with VARCHAR;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS current_approval_level VARCHAR;

-- Add payment processing columns
ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS utr_number VARCHAR;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS processed_by VARCHAR;

ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Add workflow integration
ALTER TABLE direct_expenses 
ADD COLUMN IF NOT EXISTS workflow_id TEXT;

-- Update existing records with default values
UPDATE direct_expenses 
SET updated_at = created_at 
WHERE updated_at IS NULL;
```

### **2. Add Foreign Key Constraints**

```sql
-- Add foreign key constraints for referential integrity
ALTER TABLE direct_expenses 
ADD CONSTRAINT IF NOT EXISTS fk_direct_expenses_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id);

ALTER TABLE direct_expenses 
ADD CONSTRAINT IF NOT EXISTS fk_direct_expenses_processed_by 
FOREIGN KEY (processed_by) REFERENCES users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_direct_expenses_employer_name 
ON direct_expenses(employer_name);

CREATE INDEX IF NOT EXISTS idx_direct_expenses_status 
ON direct_expenses(status);

CREATE INDEX IF NOT EXISTS idx_direct_expenses_date 
ON direct_expenses(date);
```

## 🔍 **VERIFICATION QUERIES**

After running the fixes, verify the changes:

```sql
-- 1. Check if all columns exist in direct_expenses
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'direct_expenses' 
ORDER BY column_name;

-- 2. Verify the table structure matches expectations
SELECT 
  COUNT(*) as total_columns,
  COUNT(CASE WHEN column_name = 'employer_name' THEN 1 END) as has_employer_name,
  COUNT(CASE WHEN column_name = 'employee_number' THEN 1 END) as has_employee_number,
  COUNT(CASE WHEN column_name = 'workflow_id' THEN 1 END) as has_workflow_id
FROM information_schema.columns 
WHERE table_name = 'direct_expenses';

-- 3. Test a simple query to ensure no errors
SELECT id, description, amount, employer_name, status 
FROM direct_expenses 
LIMIT 5;
```

## 🚨 **OTHER POTENTIAL SCHEMA ISSUES**

### **Check for Additional Missing Tables/Columns:**

```sql
-- Verify all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'companies', 'expense_categories', 'expense_claims', 
  'direct_expenses', 'receipts', 'expense_items', 'expense_requests',
  'advance_payments', 'vendors', 'workflow_assignments'
)
ORDER BY table_name;

-- Check for missing indexes that might cause performance issues
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('direct_expenses', 'expense_claims')
ORDER BY tablename, indexname;
```

## 📋 **EXECUTION CHECKLIST**

- [ ] **Step 1:** Backup your database before running any queries
- [ ] **Step 2:** Run the "Add Missing Columns" queries in order
- [ ] **Step 3:** Run the "Add Foreign Key Constraints" queries
- [ ] **Step 4:** Execute verification queries to confirm success
- [ ] **Step 5:** Restart your application to ensure errors are resolved
- [ ] **Step 6:** Test the direct expenses functionality in your app

## 🛡️ **BACKUP COMMAND (Run First!)**

```sql
-- Create a backup of direct_expenses table before making changes
CREATE TABLE direct_expenses_backup_$(date +%Y%m%d) AS 
SELECT * FROM direct_expenses;
```

## 🔄 **ROLLBACK (If Issues Occur)**

If something goes wrong, you can rollback the changes:

```sql
-- Remove added columns (only if needed)
ALTER TABLE direct_expenses 
DROP COLUMN IF EXISTS employer_name,
DROP COLUMN IF EXISTS employee_number,
DROP COLUMN IF EXISTS employee_email,
DROP COLUMN IF EXISTS employee_name,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS submitted_at,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS paid_at,
DROP COLUMN IF EXISTS pending_with,
DROP COLUMN IF EXISTS current_approval_level,
DROP COLUMN IF EXISTS utr_number,
DROP COLUMN IF EXISTS payment_date,
DROP COLUMN IF EXISTS processed_by,
DROP COLUMN IF EXISTS processed_at,
DROP COLUMN IF EXISTS workflow_id;

-- Restore from backup
-- DROP TABLE direct_expenses;
-- ALTER TABLE direct_expenses_backup_YYYYMMDD RENAME TO direct_expenses;
```

## 🎯 **EXPECTED RESULTS**

After running these queries successfully:

1. ✅ The `/api/direct-expenses` endpoint will work without errors
2. ✅ Direct expenses will display properly in the UI
3. ✅ No more "column does not exist" PostgreSQL errors
4. ✅ Employee information will be properly tracked for direct expenses
5. ✅ Workflow and approval functionality will work for direct expenses

## 📞 **TROUBLESHOOTING**

### Common Issues:

**Error: "relation does not exist"**
- Ensure you're connected to the correct database
- Verify table names are spelled correctly

**Error: "column already exists"**
- The `IF NOT EXISTS` clause should prevent this
- If it occurs, the column may already exist with different data type

**Error: "foreign key constraint violation"**
- Check that referenced IDs in the `users` table exist
- You may need to populate the foreign key columns after creation

### **Database Connection:**
```bash
# If you need to connect manually:
psql $DATABASE_URL
```

---

**⚠️ IMPORTANT:** Always test these queries on a backup or development database first before applying to production!

**📅 Last Updated:** September 24, 2025  
**🔧 Generated for:** Expense Management Application Database Sync Issues