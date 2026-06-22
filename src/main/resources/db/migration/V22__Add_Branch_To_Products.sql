-- V22__Add_Branch_To_Products.sql
-- Add branch_id column to products table to support branch-specific products

ALTER TABLE products ADD COLUMN branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- Create index for faster querying
CREATE INDEX idx_products_branch ON products(branch_id);
