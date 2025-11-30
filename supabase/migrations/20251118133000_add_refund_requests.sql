-- Refund requests workflow
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  payments_audit_id UUID REFERENCES payments_audit(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'requested', -- requested|approved|rejected|processed
  actor_requested TEXT NOT NULL DEFAULT 'student', -- student|tutor|admin
  processed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS refund_requests_tutor_id_idx ON refund_requests (tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS refund_requests_booking_id_idx ON refund_requests (booking_id);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON refund_requests (status, created_at DESC);


