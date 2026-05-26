-- V20__Add_Expense_Type.sql
-- Add expense_type column to expenses table
ALTER TABLE expenses ADD COLUMN expense_type VARCHAR(50) DEFAULT 'OPERASIONAL';

-- Classify existing categories
UPDATE expenses SET expense_type = 'HARIAN' WHERE category IN ('OPERASIONAL', 'LAIN-LAIN');
UPDATE expenses SET expense_type = 'OPERASIONAL' WHERE category IN ('GAJI', 'LISTRIK', 'SEWA', 'MARKETING');
