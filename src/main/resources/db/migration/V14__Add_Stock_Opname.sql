-- Migration to add Stock Opname (Physical Inventory Reconciliation) tables
CREATE TABLE stock_opnames (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    opname_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- DRAFT, COMPLETED
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE stock_opname_details (
    id BIGSERIAL PRIMARY KEY,
    opname_id BIGINT NOT NULL,
    inventory_batch_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    system_quantity NUMERIC(19,4) NOT NULL,
    physical_quantity NUMERIC(19,4) NOT NULL,
    difference NUMERIC(19,4) NOT NULL,
    reason VARCHAR(255),
    FOREIGN KEY (opname_id) REFERENCES stock_opnames(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
