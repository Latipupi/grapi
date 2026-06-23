-- V23__Update_Products_Branch_Id.sql
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
