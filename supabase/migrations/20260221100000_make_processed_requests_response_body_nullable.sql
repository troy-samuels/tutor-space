-- Allow response_body to be null for in-flight idempotency reservations
ALTER TABLE processed_requests
ALTER COLUMN response_body DROP NOT NULL;
