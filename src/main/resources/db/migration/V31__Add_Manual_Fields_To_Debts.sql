-- V31__Add_Manual_Fields_To_Debts.sql
-- Add reference_number and party_name columns to debts table for manual debt input & adjustments
ALTER TABLE debts ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS party_name VARCHAR(255);
