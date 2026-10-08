-- V26__Fix_Two_Digit_Year_Expiry_Dates.sql
-- Memperbaiki tanggal kadaluarsa yang tersimpan dengan tahun 2-digit (contoh: tahun 0028/0029 dikonversi menjadi 2028/2029)

-- 1. Perbaiki inventory_batches
UPDATE inventory_batches 
SET expiry_date = (expiry_date + INTERVAL '2000 years')::date 
WHERE expiry_date IS NOT NULL AND EXTRACT(YEAR FROM expiry_date) < 100;

-- 2. Perbaiki riwayat stock_movements
UPDATE stock_movements 
SET expiry_date = (expiry_date + INTERVAL '2000 years')::date 
WHERE expiry_date IS NOT NULL AND EXTRACT(YEAR FROM expiry_date) < 100;

-- 3. Perbaiki purchase_details
UPDATE purchase_details 
SET expiry_date = (expiry_date + INTERVAL '2000 years')::date 
WHERE expiry_date IS NOT NULL AND EXTRACT(YEAR FROM expiry_date) < 100;

-- 4. Perbaiki stock_transfer_details
UPDATE stock_transfer_details 
SET expiry_date = (expiry_date + INTERVAL '2000 years')::date 
WHERE expiry_date IS NOT NULL AND EXTRACT(YEAR FROM expiry_date) < 100;
