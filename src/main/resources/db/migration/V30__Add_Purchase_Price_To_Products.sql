-- V30__Add_Purchase_Price_To_Products.sql

-- Add purchase_price to products table for master data reference price and HPP valuation
ALTER TABLE products ADD COLUMN purchase_price DECIMAL(19, 2) NOT NULL DEFAULT 0.00;
