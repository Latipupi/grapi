CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    stock_quantity DECIMAL(19, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    type VARCHAR(50) NOT NULL,
    quantity DECIMAL(19, 4) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_branch_product ON inventory(branch_id, product_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_branch ON stock_movements(branch_id);
