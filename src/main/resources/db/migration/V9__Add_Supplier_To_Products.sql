-- V9__Add_Supplier_To_Products.sql
ALTER TABLE products ADD COLUMN supplier_id BIGINT;
ALTER TABLE products ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
