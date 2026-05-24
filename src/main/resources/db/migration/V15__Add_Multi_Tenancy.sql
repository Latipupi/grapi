-- V15__Add_Multi_Tenancy.sql
-- 1. Create tenants table
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default system tenant
INSERT INTO tenants (id, name, is_active) VALUES ('SYSTEM', 'Sistem Utama', TRUE);

-- 3. Add tenant_id column with default value to existing tables
ALTER TABLE users ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE branches ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE product_categories ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE products ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE suppliers ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE customers ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE purchases ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE sales ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE debts ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE expenses ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE cashier_shifts ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE stock_opnames ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE inventory ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE inventory_batches ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';
ALTER TABLE stock_movements ADD COLUMN tenant_id VARCHAR(50) REFERENCES tenants(id) DEFAULT 'SYSTEM';

-- 4. Alter columns to set NOT NULL and drop default value for safety
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE branches ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE branches ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE product_categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE product_categories ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE suppliers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE purchases ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE purchases ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE sales ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE debts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE debts ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE expenses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE cashier_shifts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE cashier_shifts ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE stock_opnames ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE stock_opnames ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE inventory ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE inventory_batches ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE inventory_batches ALTER COLUMN tenant_id DROP DEFAULT;

ALTER TABLE stock_movements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE stock_movements ALTER COLUMN tenant_id DROP DEFAULT;

-- 5. Add indexes for tenant_id lookup performance
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_inventory_tenant ON inventory(tenant_id);
CREATE INDEX idx_inventory_batches_tenant ON inventory_batches(tenant_id);
