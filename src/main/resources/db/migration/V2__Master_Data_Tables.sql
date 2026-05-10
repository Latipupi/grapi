-- V2__Master_Data_Tables.sql

CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES product_categories(id),
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_units (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    unit_name VARCHAR(50) NOT NULL, -- e.g., Box, Strip, Tablet
    conversion_to_base INTEGER NOT NULL DEFAULT 1, -- e.g., 1 Box = 100 Tablets (base)
    is_base_unit BOOLEAN DEFAULT FALSE,
    price_per_unit DECIMAL(19, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
