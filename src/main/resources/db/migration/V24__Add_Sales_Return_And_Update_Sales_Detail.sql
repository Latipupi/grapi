-- V24__Add_Sales_Return_And_Update_Sales_Detail.sql

-- Add conversion_factor to sales_details
ALTER TABLE sales_details ADD COLUMN conversion_factor INTEGER NOT NULL DEFAULT 1;

-- Create sales_returns table
CREATE TABLE sales_returns (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    shift_id BIGINT REFERENCES cashier_shifts(id),
    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_refund_amount DECIMAL(19, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_return_details table
CREATE TABLE sales_return_details (
    id BIGSERIAL PRIMARY KEY,
    sales_return_id BIGINT NOT NULL REFERENCES sales_returns(id),
    sale_detail_id BIGINT NOT NULL REFERENCES sales_details(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    batch_id BIGINT NOT NULL REFERENCES inventory_batches(id),
    quantity DECIMAL(19, 4) NOT NULL,
    refund_amount DECIMAL(19, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_returns_sale ON sales_returns(sale_id);
CREATE INDEX idx_sales_returns_branch ON sales_returns(branch_id);
CREATE INDEX idx_sales_returns_tenant ON sales_returns(tenant_id);
CREATE INDEX idx_sales_return_details_return ON sales_return_details(sales_return_id);
CREATE INDEX idx_sales_return_details_detail ON sales_return_details(sale_detail_id);
