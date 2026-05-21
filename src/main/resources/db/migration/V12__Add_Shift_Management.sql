CREATE TABLE cashier_shifts (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    starting_cash NUMERIC(19,4) NOT NULL,
    ending_cash NUMERIC(19,4),
    expected_ending_cash NUMERIC(19,4),
    total_sales NUMERIC(19,4),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

ALTER TABLE sales ADD COLUMN shift_id BIGINT;
ALTER TABLE sales ADD CONSTRAINT fk_sales_shift FOREIGN KEY (shift_id) REFERENCES cashier_shifts(id);
