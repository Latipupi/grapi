-- V19__Add_Settings_Fields.sql
-- 1. Add email, phone, npwp, and address to tenants table
ALTER TABLE tenants ADD COLUMN email VARCHAR(100);
ALTER TABLE tenants ADD COLUMN phone VARCHAR(50);
ALTER TABLE tenants ADD COLUMN npwp VARCHAR(50);
ALTER TABLE tenants ADD COLUMN address VARCHAR(255);

-- 2. Add phone to users table
ALTER TABLE users ADD COLUMN phone VARCHAR(50);

-- 3. Populate existing default values for SYSTEM tenant
UPDATE tenants 
SET 
    email = 'contact@gapotek.id',
    phone = '021-555-1234',
    npwp = '12.345.678.9-012.000',
    address = 'Jl. Kesehatan No. 88, Kebayoran Baru, Jakarta Selatan'
WHERE id = 'SYSTEM';

-- 4. Populate existing users with a default phone number
UPDATE users
SET phone = '081234567890'
WHERE phone IS NULL;
