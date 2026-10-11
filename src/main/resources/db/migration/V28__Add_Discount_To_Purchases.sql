-- V28__Add_Discount_To_Purchases.sql

-- 1. Tambahkan kolom subtotal, diskon persentase, dan nominal diskon pada tabel purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS subtotal DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0.00;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(19, 2) DEFAULT 0.00;

-- Backfill subtotal data lama dari total_amount jika masih null atau 0
UPDATE purchases SET subtotal = total_amount WHERE subtotal IS NULL OR subtotal = 0.00;
UPDATE purchases SET discount_percent = 0.00 WHERE discount_percent IS NULL;
UPDATE purchases SET discount_amount = 0.00 WHERE discount_amount IS NULL;

-- 2. Tambahkan kolom diskon dan harga neto pada purchase_details
ALTER TABLE purchase_details ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0.00;
ALTER TABLE purchase_details ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE purchase_details ADD COLUMN IF NOT EXISTS net_unit_price DECIMAL(19, 2);

-- Backfill net_unit_price data lama dengan unit_price jika masih null
UPDATE purchase_details SET net_unit_price = unit_price WHERE net_unit_price IS NULL;
UPDATE purchase_details SET discount_percent = 0.00 WHERE discount_percent IS NULL;
UPDATE purchase_details SET discount_amount = 0.00 WHERE discount_amount IS NULL;
