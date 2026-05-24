-- V16__Add_Branch_Type_And_Stock_Transfer.sql

-- 1. Add type column to branches table with default 'RETAIL'
ALTER TABLE branches ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'RETAIL';

-- 2. Create stock_transfers table
CREATE TABLE stock_transfers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id),
    source_branch_id BIGINT NOT NULL REFERENCES branches(id),
    destination_branch_id BIGINT NOT NULL REFERENCES branches(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- COMPLETED, CANCELLED
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create stock_transfer_details table
CREATE TABLE stock_transfer_details (
    id BIGSERIAL PRIMARY KEY,
    transfer_id BIGINT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity DECIMAL(19, 4) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE
);

-- 4. Create performance indexes
CREATE INDEX idx_stock_transfers_tenant ON stock_transfers(tenant_id);
CREATE INDEX idx_stock_transfers_source ON stock_transfers(source_branch_id);
CREATE INDEX idx_stock_transfers_dest ON stock_transfers(destination_branch_id);
CREATE INDEX idx_st_details_transfer ON stock_transfer_details(transfer_id);
