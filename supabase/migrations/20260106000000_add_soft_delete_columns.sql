-- Add soft delete support to core tables
-- Enables data recovery and audit trails without permanent deletion

-- Bookings: Track deleted lesson bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at
  ON bookings(deleted_at) WHERE deleted_at IS NULL;

-- Students: Track deleted student records
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_students_deleted_at
  ON students(deleted_at) WHERE deleted_at IS NULL;

-- Services: Track deleted service offerings
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_services_deleted_at
  ON services(deleted_at) WHERE deleted_at IS NULL;

-- Comments for documentation
COMMENT ON COLUMN bookings.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN students.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN services.deleted_at IS 'Soft delete timestamp - NULL means active';
