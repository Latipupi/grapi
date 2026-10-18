-- V32__Add_Capital_Fields_To_Branches.sql
-- Add initial_capital and capital_mode columns to branches table for Balance Sheet (Neraca) capital tracking
ALTER TABLE branches ADD COLUMN IF NOT EXISTS initial_capital NUMERIC(19, 2) DEFAULT 0;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS capital_mode VARCHAR(50) DEFAULT 'AUTO_STOCK';
