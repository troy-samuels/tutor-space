# Analytics Page Data Map

## Route and Access
- Page entry: `app/app/(dashboard)/analytics/page.tsx` creates a Supabase server client, fetches the authenticated user, and redirects to `/login?redirect=/analytics` when unauthenticated.
- Middleware (`app/middleware.ts`) gates `/analytics` as a Pro-tier protected route and enforces onboarding completion unless `NODE_ENV=development`.
- Client component: `AnalyticsClient` (`app/app/(dashboard)/analytics/analytics-client.tsx`) fetches `/api/analytics/tutor-metrics?tutorId=<userId>&days=<period>` (default 30d) whenever the time selector changes.
- API handler: `app/app/api/analytics/tutor-metrics/route.ts` uses a Supabase server client bound to the user session; it forces dynamic rendering to avoid cache. The handler overwrites any foreign `tutorId` with the current user ID for safety.

## Backend Data Sources (all via Supabase)
- Revenue over time → `getRevenueOverTime` (`app/lib/data/analytics-metrics.ts`): `payments_audit` rows for the tutor where `amount_cents>0` and `created_at>=since`. Groups per day and converts cents to dollars.
- Total revenue summary → `getTotalRevenue`: `payments_audit` rows since the selected period. Computes gross (positive amounts), refunds (negative amounts), fees (`application_fee_cents`), and net = `max(0, gross - refunds - fees)`.
- Booking metrics → `getBookingMetrics`: `bookings` rows for the tutor with `scheduled_at>=since`. Totals + completion/cancellation rates; pending = status `pending` or `confirmed`. Average session value uses `payment_amount` (cents) across paid bookings.
- Student metrics → `getStudentMetrics`: `students` rows for the tutor (no date filter) plus **all** `bookings` rows for that tutor. New students are filtered by `created_at>=since`, but returning/churn/avg lessons use lifetime bookings, not the selected range.
- Service popularity → `getServicePopularity`: `bookings` for the tutor with `scheduled_at>=since`, joined to `services(name)`. Groups by `service_id`, reports top 5 by booking count with percentage of total bookings and revenue (cents→dollars).
- Bookings by period → `getBookingsByPeriod`: `bookings` with `scheduled_at>=since`, grouped by ISO week start (Monday) and labeled `Mon DD` via `formatWeekLabel`.
- Payment ingestion pipeline: `payments_audit` is populated by Stripe webhook handling in `app/api/stripe/webhook/route.ts` (destination charges → `payments_audit` insert with tutor_id/student/booking linkage). Service-role Supabase client (`app/lib/supabase/admin.ts`) powers webhook writes.
- Page view ingestion (not displayed on `/analytics` today): `PageViewTracker` posts to `/api/analytics/page-view` using a service-role Supabase client to insert into `page_views` with anonymized IP/device info.

## Data Flow to UI Components
- Overview cards (`components/analytics/overview-cards.tsx`) use: revenue = rounded `totalRevenue.gross`; lessons = `bookingMetrics.completedBookings`; students/retention = `studentMetrics.totalStudents` + `retentionRate`.
- Charts/cards: revenue → `RevenueChart` (Recharts); bookings trend → `BookingsChart` from `bookingsByPeriod`; student insights → `StudentMetricsCard`; service mix → `ServicePopularityChart`; booking stats → `BookingStatsCard`. Loading + empty states are built-in; errors only log to console.

## Access Control and RLS Notes
- API relies on the user-bound Supabase client (`createClient`) so RLS policies apply: `payments_audit` has tutor_id filter; `bookings`, `students`, and `services` have tutor-owned policies (see `20251112000000_security_hardening_and_schema.sql` and `20251203110002_ensure_rls_enabled.sql`).
- Tutor ID query param is sanitized server-side; admins cannot override via the client fetch.
- Environment: requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the user client; Stripe webhook + payment summary endpoints require `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_APP_URL`.

## Health Check / Validation Tips
- Primary endpoint: `GET /api/analytics/tutor-metrics?tutorId=<uid>&days=7|30|90` (should return the JSON structure mocked in `app/e2e/analytics.spec.ts`).
- Payment summary (separate page `/analytics/payments`): `GET /api/analytics/payments/summary?days=30&tutorId=<uid>` aggregates `payments_audit` via service-role client.
- E2E coverage exists in `app/e2e/analytics.spec.ts`; set `AUTH_STORAGE_STATE` to run Playwright tests that mock the API and verify rendering, responsiveness, and accessibility.

## Observations / Potential Gaps
- Time range mismatch: `getStudentMetrics` uses all bookings (no `since` filter) for returning/churn/avg lessons, so the time selector does not scope those metrics. Consider filtering bookings by the selected `days` window for consistency.
- Week sorting: `getBookingsByPeriod` labels weeks as strings (e.g., "Nov 8") and then sorts with `localeCompare`, which can misorder periods across months. Sorting by the actual week start date would keep charts chronological.
- Error visibility: the client swallows fetch errors (console only) and shows empty states, so backend failures are silent to tutors. Optional toast/error banner could improve clarity.
- Pending definition: pending count treats `pending` and `confirmed` as the same state; if other statuses (e.g., `rescheduled`) exist, they will fall into the "pending" bucket.
