-- V25__Add_Performance_Indexes.sql

-- 1. Indeks untuk tabel stock_movements
-- Mempercepat pencarian riwayat stok produk per cabang & tenant, diurutkan berdasarkan tanggal terbaru
CREATE INDEX idx_stock_movements_branch_product_date ON stock_movements(branch_id, product_id, created_at DESC);
CREATE INDEX idx_stock_movements_tenant_branch ON stock_movements(tenant_id, branch_id);

-- 2. Indeks untuk tabel inventory_batches
-- Mempercepat pencarian batch kedaluwarsa (FEFO) dan stok saat ini per cabang
CREATE INDEX idx_inventory_batches_expiry_qty ON inventory_batches(branch_id, expiry_date, current_quantity);
CREATE INDEX idx_inventory_batches_branch_product_expiry ON inventory_batches(branch_id, product_id, expiry_date);

-- 3. Indeks untuk tabel sales & sales_details
-- Mempercepat pencarian penjualan per cabang berdasarkan tanggal/periode, pencarian per shift, dan detail item penjualan
CREATE INDEX idx_sales_branch_date ON sales(branch_id, sale_date DESC);
CREATE INDEX idx_sales_shift_status ON sales(shift_id, status);
CREATE INDEX idx_sales_details_product ON sales_details(product_id);
CREATE INDEX idx_sales_details_created ON sales_details(created_at);

-- 4. Indeks untuk tabel purchase_details
-- Mempercepat join data detail pembelian
CREATE INDEX idx_purchase_details_purchase ON purchase_details(purchase_id);
CREATE INDEX idx_purchase_details_product ON purchase_details(product_id);
