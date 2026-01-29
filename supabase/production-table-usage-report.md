# Production table usage report

Notes: est_rows from pg_class; activity from pg_stat_user_tables; recency from max timestamp column if present.

## Summary
- auth: 20
- public: 102
- realtime: 9
- storage: 9
- supabase_migrations: 1
- vault: 1

## Tables
### auth.audit_log_entries
- est_rows: 3952
- stats: ins=4035 upd=0 del=0
- last_vacuum: None
- last_autovacuum: 2025-12-29 04:43:46.239756+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:44:21.821688+00:00
- latest_created_at: 2026-01-19 11:54:29.262365+00:00

### auth.flow_state
- est_rows: -1
- stats: ins=55 upd=5 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2025-12-28 20:30:04.568256+00:00

### auth.identities
- est_rows: 44
- stats: ins=909 upd=4 del=852
- last_vacuum: None
- last_autovacuum: 2026-01-19 11:43:21.710870+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.009312+00:00
- latest_updated_at: 2026-01-10 18:48:34.436836+00:00

### auth.instances
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.mfa_amr_claims
- est_rows: 32
- stats: ins=531 upd=0 del=499
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:01:42.070091+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:44:21.824096+00:00
- latest_updated_at: 2026-01-19 11:46:27.537072+00:00

### auth.mfa_challenges
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### auth.mfa_factors
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.oauth_authorizations
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### auth.oauth_client_states
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### auth.oauth_clients
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.oauth_consents
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_revoked_at: None

### auth.one_time_tokens
- est_rows: 0
- stats: ins=40 upd=0 del=39
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-22 12:10:15.589407+00:00
- latest_updated_at: 2025-12-25 20:21:04.847241

### auth.refresh_tokens
- est_rows: 196
- stats: ins=1224 upd=693 del=1032
- last_vacuum: None
- last_autovacuum: 2026-01-17 11:34:16.977135+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:44:21.736593+00:00
- latest_updated_at: 2026-01-19 11:46:27.534752+00:00

### auth.saml_providers
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.saml_relay_states
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.schema_migrations
- est_rows: 67
- stats: ins=65 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-11-01 20:38:29.798836+00:00

### auth.sessions
- est_rows: 30
- stats: ins=531 upd=1019 del=499
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:00:42.068381+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-17 19:21:26.910772+00:00
- latest_updated_at: 2026-01-19 11:46:27.533257+00:00

### auth.sso_domains
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.sso_providers
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### auth.users
- est_rows: 45
- stats: ins=914 upd=4057 del=854
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:02:42.094107+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.005044+00:00
- latest_updated_at: 2026-01-19 11:46:27.536304+00:00

### public.admin_audit_log
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.admin_emails
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_sent_at: None

### public.admin_users
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.ai_conversations
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.ai_messages
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.ai_usage
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.audit_logs
- est_rows: -1
- stats: ins=3 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: 2026-01-10 19:06:06.724796+00:00

### public.availability
- est_rows: 34
- stats: ins=782 upd=5 del=765
- last_vacuum: None
- last_autovacuum: 2026-01-19 11:44:21.826388+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.013424+00:00
- latest_updated_at: 2026-01-10 18:56:11.138836+00:00

### public.blocked_times
- est_rows: -1
- stats: ins=1 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-10 19:04:44.140557+00:00

### public.booking_reschedule_history
- est_rows: -1
- stats: ins=2 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: 2026-01-13 09:56:47.070902+00:00

### public.bookings
- est_rows: 6
- stats: ins=199 upd=13 del=193
- last_vacuum: None
- last_autovacuum: 2026-01-10 14:47:59.907228+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-12 01:00:42.086178+00:00
- latest_updated_at: 2026-01-19 11:47:45.337899+00:00

### public.calendar_connections
- est_rows: 1
- stats: ins=12 upd=2692 del=10
- last_vacuum: None
- last_autovacuum: 2026-01-05 20:22:43.211951+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-08 23:01:08.770778+00:00
- latest_updated_at: 2026-01-13 10:54:00.040690+00:00

### public.calendar_events
- est_rows: -1
- stats: ins=1 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-12 20:01:59.227770+00:00

### public.calendar_sync_jobs
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.calendar_sync_runs
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_started_at: None

### public.content_reports
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.conversation_messages
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.conversation_threads
- est_rows: 4
- stats: ins=50 upd=80 del=47
- last_vacuum: None
- last_autovacuum: 2025-12-28 16:20:29.921774+00:00
- last_analyze: None
- last_autoanalyze: 2025-12-29 04:39:46.118193+00:00
- latest_updated_at: 2025-12-26 23:15:13.469871+00:00

### public.digital_product_purchases
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.digital_products
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.email_campaign_recipients
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.email_campaigns
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.email_events
- est_rows: -1
- stats: ins=9 upd=0 del=3
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: 2025-12-28 20:30:06.047740+00:00

### public.email_suppressions
- est_rows: -1
- stats: ins=2 upd=0 del=2
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_first_seen: None

### public.grammar_error_categories
- est_rows: -1
- stats: ins=11 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: 2025-12-23 17:18:18.207047+00:00

### public.grammar_errors
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.group_session_attendees
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.group_sessions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.homework_assignments
- est_rows: 2
- stats: ins=71 upd=54 del=68
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:03:42.130039+00:00
- last_analyze: None
- last_autoanalyze: 2025-12-29 04:44:46.183171+00:00
- latest_updated_at: 2026-01-19 12:01:38.765032+00:00

### public.homework_submissions
- est_rows: 0
- stats: ins=17 upd=17 del=17
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-29 04:44:46.176430+00:00
- latest_updated_at: None

### public.impersonation_sessions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_started_at: None

### public.interactive_activities
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.invoice_line_items
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.invoices
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.learning_goals
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.learning_roadmaps
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.learning_stats
- est_rows: 0
- stats: ins=20 upd=18 del=19
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-29 04:43:46.258299+00:00
- latest_updated_at: 2026-01-19 12:01:38.765032+00:00

### public.lesson_allowance_periods
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.lesson_briefings
- est_rows: -1
- stats: ins=5 upd=2 del=4
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-13 10:37:01.858711+00:00

### public.lesson_deliveries
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.lesson_drills
- est_rows: -1
- stats: ins=6 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: 2026-01-19 10:57:34.574253+00:00

### public.lesson_notes
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.lesson_recordings
- est_rows: 0
- stats: ins=6 upd=8 del=4
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: 2026-01-19 10:57:34.438433+00:00

### public.lesson_subscription_redemptions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.lesson_subscription_templates
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.lesson_subscriptions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.lifetime_purchases
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.link_events
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_clicked_at: None

### public.links
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.marketing_clips
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.marketplace_orders
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.marketplace_resources
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.moderation_actions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.notification_preferences
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.notifications
- est_rows: 1
- stats: ins=21 upd=0 del=21
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.page_views
- est_rows: 122
- stats: ins=122 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-11-27 10:33:04.756373+00:00
- latest_created_at: 2025-11-27 14:21:03.410455+00:00

### public.payment_reminders
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.payments_audit
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.phonetic_errors
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.plan_change_history
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.plan_overrides
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.platform_config
- est_rows: -1
- stats: ins=20 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2025-11-30 08:49:49.191966+00:00

### public.practice_assignments
- est_rows: 7
- stats: ins=110 upd=33 del=107
- last_vacuum: None
- last_autovacuum: 2025-12-28 13:23:26.347495+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:42:21.706035+00:00
- latest_updated_at: 2026-01-19 12:03:48.703616+00:00

### public.practice_block_ledger
- est_rows: -1
- stats: ins=1 upd=0 del=1
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.practice_scenarios
- est_rows: 3
- stats: ins=110 upd=4 del=107
- last_vacuum: None
- last_autovacuum: 2026-01-19 11:55:22.035379+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.036308+00:00
- latest_updated_at: 2026-01-19 12:03:48.659275+00:00

### public.practice_usage_periods
- est_rows: -1
- stats: ins=3 upd=7 del=2
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-19 12:02:19.266766+00:00

### public.processed_requests
- est_rows: -1
- stats: ins=7 upd=6 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-10 19:05:35.805000+00:00

### public.processed_stripe_events
- est_rows: 7
- stats: ins=21 upd=2 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-17 16:05:58.396000+00:00

### public.proficiency_assessments
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.profiles
- est_rows: 43
- stats: ins=913 upd=842 del=853
- last_vacuum: None
- last_autovacuum: 2026-01-19 11:55:22.035031+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.032228+00:00
- latest_updated_at: 2026-01-18 20:45:33.107373+00:00

### public.pronunciation_assessments
- est_rows: -1
- stats: ins=1 upd=0 del=1
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.rate_limit_events
- est_rows: 51
- stats: ins=73 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-21 20:16:03.319055+00:00
- latest_created_at: 2026-01-19 15:23:49.524082+00:00

### public.refund_requests
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.reviews
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.services
- est_rows: 131
- stats: ins=2635 upd=32 del=2458
- last_vacuum: None
- last_autovacuum: 2026-01-19 11:54:22.015196+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.020526+00:00
- latest_updated_at: 2026-01-10 18:48:34.430379+00:00

### public.session_package_purchases
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.session_package_redemptions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.session_package_templates
- est_rows: 5
- stats: ins=156 upd=21 del=152
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:03:42.115469+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:55:22.027193+00:00
- latest_updated_at: 2026-01-10 18:48:34.430379+00:00

### public.student_engagement_score_queue
- est_rows: 1
- stats: ins=22 upd=8 del=21
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2026-01-19 12:04:22.311408+00:00
- latest_queued_at: 2026-01-19 12:03:48.659275+00:00

### public.student_engagement_scores
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.student_grammar_patterns
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.student_onboarding_progress
- est_rows: 12
- stats: ins=93 upd=0 del=69
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:00:42.089299+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-12 01:03:42.143298+00:00
- latest_updated_at: 2026-01-10 19:05:35.486416+00:00

### public.student_onboarding_templates
- est_rows: 19
- stats: ins=91 upd=0 del=67
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:01:42.094422+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:42:21.712768+00:00
- latest_updated_at: 2026-01-10 19:05:35.486416+00:00

### public.student_practice_messages
- est_rows: 0
- stats: ins=190 upd=0 del=190
- last_vacuum: None
- last_autovacuum: 2026-01-19 11:42:21.709391+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:42:21.710703+00:00
- latest_created_at: None

### public.student_practice_sessions
- est_rows: 0
- stats: ins=64 upd=64 del=63
- last_vacuum: None
- last_autovacuum: 2025-12-28 13:23:26.349379+00:00
- last_analyze: None
- last_autoanalyze: 2025-12-29 04:42:46.147161+00:00
- latest_started_at: 2026-01-19 12:03:48.659275+00:00

### public.student_practice_summaries
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.student_preferences
- est_rows: 2
- stats: ins=2 upd=1 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-07 15:34:18.630341+00:00

### public.student_timeline_events
- est_rows: 13
- stats: ins=143 upd=67 del=132
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:02:42.099968+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:54:22.039796+00:00
- latest_created_at: 2026-01-19 12:01:38.765032+00:00

### public.student_tutor_connections
- est_rows: -1
- stats: ins=15 upd=0 del=14
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2026-01-10 19:00:11.643365+00:00

### public.students
- est_rows: 12
- stats: ins=409 upd=170 del=396
- last_vacuum: None
- last_autovacuum: 2026-01-12 01:03:42.171539+00:00
- last_analyze: None
- last_autoanalyze: 2026-01-19 11:55:22.044006+00:00
- latest_updated_at: 2026-01-19 12:03:48.659275+00:00

### public.subscriptions
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.support_tickets
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### public.system_error_log
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.system_metrics
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_recorded_at: None

### public.system_metrics_hourly
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.system_status
- est_rows: -1
- stats: ins=6 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2025-11-30 08:50:33.114940+00:00

### public.tutor_reengagement_emails
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_sent_at: None

### public.tutor_site_resources
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.tutor_site_reviews
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.tutor_site_services
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### public.tutor_sites
- est_rows: 2
- stats: ins=6 upd=116 del=4
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-29 05:05:46.604427+00:00
- latest_updated_at: 2026-01-18 20:48:41.183740+00:00

### public.tutor_status_history
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_changed_at: None

### realtime.messages_2026_01_15
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.messages_2026_01_16
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.messages_2026_01_17
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.messages_2026_01_18
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.messages_2026_01_19
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.messages_2026_01_20
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.messages_2026_01_21
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### realtime.schema_migrations
- est_rows: 64
- stats: ins=65 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-11-01 20:40:29.806030+00:00
- latest_inserted_at: 2025-11-24 02:15:46

### realtime.subscription
- est_rows: 2
- stats: ins=32 upd=26 del=32
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-25 03:39:54.157454+00:00
- latest_created_at: None

### storage.buckets
- est_rows: -1
- stats: ins=3 upd=1 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2025-12-09 14:32:47.955114+00:00

### storage.buckets_analytics
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### storage.buckets_vectors
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### storage.migrations
- est_rows: -1
- stats: ins=50 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_executed_at: 2025-12-19 10:56:56.267740

### storage.objects
- est_rows: 45
- stats: ins=98 upd=0 del=0
- last_vacuum: None
- last_autovacuum: 2025-12-28 15:52:29.349008+00:00
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2025-12-29 03:41:17.112747+00:00

### storage.prefixes
- est_rows: -1
- stats: ins=10 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: 2025-12-09 18:08:17.111550+00:00

### storage.s3_multipart_uploads
- est_rows: -1
- stats: ins=2 upd=4 del=2
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### storage.s3_multipart_uploads_parts
- est_rows: -1
- stats: ins=4 upd=0 del=4
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_created_at: None

### storage.vector_indexes
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None

### supabase_migrations.schema_migrations
- est_rows: 51
- stats: ins=81 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: 2025-12-23 17:19:12.355523+00:00

### vault.secrets
- est_rows: -1
- stats: ins=0 upd=0 del=0
- last_vacuum: None
- last_autovacuum: None
- last_analyze: None
- last_autoanalyze: None
- latest_updated_at: None
