-- Migration to add version column for Optimistic Locking in inventory_batches
ALTER TABLE inventory_batches ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
