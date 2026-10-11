-- V27__Add_Product_Recommendations.sql

-- 1. Tambahkan kolom active_substance pada tabel products jika belum ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_substance VARCHAR(150);

-- 2. Buat tabel product_recommendations untuk Substitusi, Up-Selling, dan Link-Selling
CREATE TABLE IF NOT EXISTS product_recommendations (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id),
    source_product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    relation_type VARCHAR(30) NOT NULL, -- 'SUBSTITUTION', 'UP_SELLING', 'LINK_SELLING'
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_recommendation UNIQUE (tenant_id, source_product_id, target_product_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_prod_rec_source ON product_recommendations(tenant_id, source_product_id);
CREATE INDEX IF NOT EXISTS idx_prod_rec_target ON product_recommendations(tenant_id, target_product_id);
CREATE INDEX IF NOT EXISTS idx_prod_rec_type ON product_recommendations(tenant_id, relation_type);
