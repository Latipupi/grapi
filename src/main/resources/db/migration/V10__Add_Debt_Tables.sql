-- V10__Add_Debt_Tables.sql

-- 1. Create debts table
CREATE TABLE debts (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    sale_id BIGINT,
    purchase_id BIGINT,
    branch_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(19, 2) NOT NULL,
    paid_amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_debts_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    CONSTRAINT fk_debts_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
    CONSTRAINT fk_debts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 2. Create debt_payments table
CREATE TABLE debt_payments (
    id BIGSERIAL PRIMARY KEY,
    debt_id BIGINT NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_debt_payments_debt FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- 3. Add payment_method column to purchases table
ALTER TABLE purchases ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH';
