-- Dashboard analytics index improvements

-- Bookings: tutor scoped queries filtered by scheduled_at/status/created_at
create index if not exists idx_bookings_tutor_scheduled_at on bookings (tutor_id, scheduled_at);
create index if not exists idx_bookings_tutor_status_created_at on bookings (tutor_id, status, created_at);

-- Payments: tutor scoped revenue timelines and recent payment feed
create index if not exists idx_payments_audit_tutor_created_at on payments_audit (tutor_id, created_at);
create index if not exists idx_payments_audit_tutor_created_at_positive on payments_audit (tutor_id, created_at) where amount_cents > 0;

-- Students: tutor roster counts and recent student activity + email lookups
create index if not exists idx_students_tutor_created_at on students (tutor_id, created_at);
create index if not exists idx_students_email_lower on students (lower(email));

-- Page views: filter by page_path and date range
create index if not exists idx_page_views_path_created_at on page_views (page_path, created_at);

-- Subscription/package mixes: active lesson subscriptions and session packages
create index if not exists idx_lesson_subscriptions_tutor_active on lesson_subscriptions (tutor_id, status) where status in ('active', 'trialing');
create index if not exists idx_session_package_purchases_active on session_package_purchases (status, remaining_minutes);
