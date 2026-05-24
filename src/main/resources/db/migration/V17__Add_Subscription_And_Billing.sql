-- V17__Add_Subscription_And_Billing.sql

-- 1. Add subscription and billing columns to tenants table
ALTER TABLE tenants ADD COLUMN subscription_plan VARCHAR(50) NOT NULL DEFAULT 'FREE_TRIAL';
ALTER TABLE tenants ADD COLUMN billing_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE tenants ADD COLUMN expired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days';
ALTER TABLE tenants ADD COLUMN max_users INT NOT NULL DEFAULT 2;
ALTER TABLE tenants ADD COLUMN max_branches INT NOT NULL DEFAULT 1;
ALTER TABLE tenants ADD COLUMN price DECIMAL(19, 2) NOT NULL DEFAULT 0.0;

-- 2. Update default system tenant to unlimited package that never expires (100 years)
UPDATE tenants 
SET 
    subscription_plan = 'PRO_UNLIMITED',
    billing_status = 'ACTIVE',
    expired_at = '2126-05-24 00:00:00',
    max_users = 9999,
    max_branches = 9999,
    price = 0.0
WHERE id = 'SYSTEM';
