ALTER TABLE inventory ALTER COLUMN id TYPE BIGINT;
ALTER TABLE stock_movements ALTER COLUMN id TYPE BIGINT;

-- Ensure sequences are updated if necessary (usually they are already BIGINT but good to check)
-- In Postgres, SERIAL and BIGSERIAL just differ in the underlying sequence type.
-- But since we want to be safe:
ALTER SEQUENCE inventory_id_seq AS BIGINT;
ALTER SEQUENCE stock_movements_id_seq AS BIGINT;
