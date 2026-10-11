-- V29__Add_Compound_Prescriptions.sql

-- Make product_id and batch_id nullable in sales_details for compounded medicines
ALTER TABLE sales_details ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE sales_details ALTER COLUMN batch_id DROP NOT NULL;

-- Add compound prescription fields to sales_details
ALTER TABLE sales_details ADD COLUMN is_compound BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sales_details ADD COLUMN compound_name VARCHAR(150);
ALTER TABLE sales_details ADD COLUMN dose_rule VARCHAR(100);
ALTER TABLE sales_details ADD COLUMN service_fee DECIMAL(19, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE sales_details ADD COLUMN package_type VARCHAR(50);

-- Table to store ingredients for compounded medicines
CREATE TABLE sale_detail_ingredients (
    id BIGSERIAL PRIMARY KEY,
    sale_detail_id BIGINT NOT NULL REFERENCES sales_details(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    batch_id BIGINT REFERENCES inventory_batches(id),
    quantity DECIMAL(19, 4) NOT NULL,
    unit_price DECIMAL(19, 2) NOT NULL,
    subtotal DECIMAL(19, 2) NOT NULL,
    purchase_price DECIMAL(19, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_detail_ingredients_detail ON sale_detail_ingredients(sale_detail_id);
CREATE INDEX idx_sale_detail_ingredients_product ON sale_detail_ingredients(product_id);
