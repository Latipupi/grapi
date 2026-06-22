-- V22__Add_Branch_To_Products.sql
-- Add branch_id column to products table to support branch-specific products

ALTER TABLE products ADD COLUMN branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- Automatically assign branch_id to existing products if they only have inventory in one branch
UPDATE products p
SET branch_id = (
    SELECT MIN(branch_id) 
    FROM inventory i 
    WHERE i.product_id = p.id
)
WHERE (
    SELECT COUNT(DISTINCT branch_id) 
    FROM inventory i 
    WHERE i.product_id = p.id
) = 1;

-- Create index for faster querying
CREATE INDEX idx_products_branch ON products(branch_id);
