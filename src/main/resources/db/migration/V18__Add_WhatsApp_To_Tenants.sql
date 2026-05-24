-- V18__Add_WhatsApp_To_Tenants.sql

-- 1. Add whatsapp_number column to tenants table
ALTER TABLE tenants ADD COLUMN whatsapp_number VARCHAR(50) NOT NULL DEFAULT '628123456789';

-- 2. Ensure system tenant has a valid default WhatsApp number
UPDATE tenants SET whatsapp_number = '628123456789' WHERE id = 'SYSTEM';
