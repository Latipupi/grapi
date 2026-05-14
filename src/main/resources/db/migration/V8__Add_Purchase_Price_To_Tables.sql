-- V8__Add_Purchase_Price_To_Tables.sql

-- Add purchase_price to inventory_batches to track the cost of a specific batch
ALTER TABLE inventory_batches ADD COLUMN purchase_price DECIMAL(19, 2) DEFAULT 0;

-- Add purchase_price to sales_details to record the cost of the item at the time of sale
-- This is used for calculating profit/loss per transaction
ALTER TABLE sales_details ADD COLUMN purchase_price DECIMAL(19, 2) DEFAULT 0;

-- Add purchase_price to stock_movements for audit trail purposes
ALTER TABLE stock_movements ADD COLUMN purchase_price DECIMAL(19, 2) DEFAULT 0;
