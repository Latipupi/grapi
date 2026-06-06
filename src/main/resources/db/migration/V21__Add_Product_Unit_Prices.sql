-- V21__Add_Product_Unit_Prices.sql
-- Create table to store multiple dynamic price tiers/options per product unit

CREATE TABLE product_unit_prices (
    id BIGSERIAL PRIMARY KEY,
    product_unit_id BIGINT NOT NULL REFERENCES product_units(id) ON DELETE CASCADE,
    price_label VARCHAR(100) NOT NULL, -- e.g., 'Medis', 'Masyarakat', 'Grosir'
    price DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval
CREATE INDEX idx_product_unit_prices_unit_id ON product_unit_prices(product_unit_id);
