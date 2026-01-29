# Table reference report (codebase)

Only public tables; matches are case-insensitive word-boundary scans.

## admin_audit_log
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251126200000_create_admin_dashboard.sql
- app/lib/admin/auth.ts
- app/actions/admin/audit-log.ts

## admin_emails
- references: 4
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251126200000_create_admin_dashboard.sql
- app/app/api/admin/email/send/route.ts

## admin_users
- references: 15
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251130000006_content_moderation.sql
- supabase/migrations/20251130000002_tutor_status.sql
- supabase/migrations/20251203100000_tutor_inactivity_tracking.sql
- supabase/migrations/20251126200000_create_admin_dashboard.sql
- supabase/migrations/20251130000009_plan_management.sql
- supabase/migrations/20251130000003_system_health.sql
- supabase/migrations/20251130000001_platform_config.sql
- app/e2e/support-flow.spec.ts
- ... +5 more

## ai_conversations
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000010_ai_assistant.sql
- app/lib/actions/ai-assistant.ts
- app/app/api/ai/conversation/route.ts
- app/app/api/ai/chat/route.ts
- app/docs/archive/claude.md

## ai_messages
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000010_ai_assistant.sql
- app/lib/actions/ai-assistant.ts
- app/app/api/ai/conversation/route.ts
- app/app/api/ai/chat/route.ts
- app/docs/archive/claude.md

## ai_usage
- references: 7
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000010_ai_assistant.sql
- app/lib/actions/ai-assistant.ts
- app/docs/archive/claude.md

## audit_logs
- references: 7
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260107000001_add_state_columns_to_audit_logs.sql
- supabase/migrations/20260107300000_create_audit_logs.sql
- app/docs/ENGINEERING_STANDARDS.md
- app/tests/tutor-students.test.ts
- app/lib/repositories/audit.ts

## availability
- references: 152
- README.md
- STRIPE-SETUP-GUIDE.md
- tasks.md
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/stackhawk-google-oauth.yml
- ... +142 more

## blocked_times
- references: 26
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260229090000_add_external_calendar_ids_to_blocked_times.sql
- supabase/migrations/20251124200000_create_blocked_times.sql
- supabase/migrations/20251222120000_schema_alignment.sql
- supabase/migrations/20251220113000_booking_atomic_function.sql
- app/e2e/availability-blocking.spec.ts
- ... +16 more

## booking_reschedule_history
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000005_reschedule_bookings.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- app/tests/utils/test-database.ts
- app/lib/actions/reschedule.ts
- app/docs/archive/claude.md

## bookings
- references: 322
- README.md
- studio.md
- STRIPE-SETUP-GUIDE.md
- tasks.md
- MVP-LAUNCH-FIXES.md
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- ... +312 more

## calendar_connections
- references: 25
- README.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251204100000_calendar_sync_hardening.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20251222120000_schema_alignment.sql
- app/components/onboarding/steps/StepCalendarSync.tsx
- ... +15 more

## calendar_events
- references: 16
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251204100000_calendar_sync_hardening.sql
- supabase/migrations/20260201090000_calendar_events_booking_linkage.sql
- app/lib/practice/openai.ts
- app/lib/analysis/lesson-insights.ts
- app/lib/analysis/tutor-speech-analyzer.ts
- app/lib/analysis/student-speech-analyzer.ts
- ... +6 more

## calendar_sync_jobs
- references: 3
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251204100000_calendar_sync_hardening.sql

## calendar_sync_runs
- references: 3
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251204100000_calendar_sync_hardening.sql

## content_reports
- references: 9
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000006_content_moderation.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- app/app/api/admin/moderation/route.ts
- app/docs/PRD.md
- app/docs/archive/claude.md

## conversation_messages
- references: 18
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106133000_create_conversations.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251214100000_enable_realtime_messaging.sql
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20251130000000_enable_rls_missing_tables.sql
- ... +8 more

## conversation_threads
- references: 20
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106133000_create_conversations.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251214100000_enable_realtime_messaging.sql
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20260307000000_student_portal_performance_indexes.sql
- ... +10 more

## digital_product_purchases
- references: 20
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106140000_create_digital_products.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251118130000_add_stripe_connect_fields.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20260108000000_marketplace_repository.sql
- ... +10 more

## digital_products
- references: 28
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106140000_create_digital_products.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251226100000_slug_conventions.sql
- supabase/migrations/20251113150000_create_tutor_sites.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20260108000000_marketplace_repository.sql
- ... +18 more

## email_campaign_recipients
- references: 6
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106120000_email_preferences_and_queue.sql
- supabase/production-schema-report.md
- supabase/migrations/20251130000000_enable_rls_missing_tables.sql
- app/lib/server/email-queue.ts
- app/app/api/cron/send-reminders/route.ts

## email_campaigns
- references: 11
- README.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106120000_email_preferences_and_queue.sql
- supabase/migrations_archive/20250106103000_create_email_campaigns.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000000_enable_rls_missing_tables.sql
- app/app/(dashboard)/marketing/email/page.tsx
- app/lib/server/email-queue.ts
- app/app/api/cron/send-reminders/route.ts
- ... +1 more

## email_events
- references: 9
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251201000000_email_events_and_suppressions.sql
- app/lib/email/send.ts
- app/app/book/success/page.tsx
- app/app/api/webhooks/resend/route.ts
- app/docs/archive/claude.md

## email_suppressions
- references: 9
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251201000000_email_events_and_suppressions.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- app/lib/email/send.ts
- app/app/api/webhooks/resend/route.ts
- app/docs/archive/claude.md

## grammar_error_categories
- references: 4
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251226100000_slug_conventions.sql
- supabase/migrations/20251208100000_ai_practice_enhancements.sql

## grammar_errors
- references: 9
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/e2e/practice/ai-practice-session.spec.ts
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251226100000_slug_conventions.sql
- supabase/migrations/20251208100000_ai_practice_enhancements.sql
- app/app/api/practice/end-session/route.ts
- app/app/api/practice/chat/route.ts
- app/app/api/practice/chat/stream/route.ts

## group_session_attendees
- references: 3
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md

## group_sessions
- references: 4
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/docs/design/passes.md

## homework_assignments
- references: 33
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251212100001_homework_notification_fields.sql
- supabase/migrations/20251216100002_drill_booking_linkage.sql
- supabase/migrations/20251213100000_audio_messaging_and_homework.sql
- supabase/migrations/20251202100000_homework_and_progress_expansion.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- ... +23 more

## homework_submissions
- references: 14
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260130000000_homework_submissions_student_fk.sql
- supabase/migrations/20260307000000_student_portal_performance_indexes.sql
- supabase/migrations/20260222120000_add_soft_delete_progress.sql
- supabase/migrations/20251212100000_homework_submissions.sql
- app/e2e/fixtures/test-fixtures.ts
- ... +4 more

## impersonation_sessions
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251126200000_create_admin_dashboard.sql
- app/app/api/admin/impersonate/end/route.ts
- app/app/api/admin/impersonate/start/route.ts

## interactive_activities
- references: 3
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md

## invoice_line_items
- references: 4
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- supabase/migrations/20251203110002_ensure_rls_enabled.sql

## invoices
- references: 24
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- supabase/migrations/20260221110000_extend_dashboard_summary_meeting_links.sql
- supabase/migrations/20251203110001_fix_dashboard_summary_auth.sql
- supabase/migrations/20251202090000_create_dashboard_summary_rpc.sql
- supabase/migrations/20251203110002_ensure_rls_enabled.sql
- app/emails/daily-digest.tsx
- app/components/settings/PaymentSettingsForm.tsx
- app/tests/stripe-billing-portal.test.ts
- ... +14 more

## learning_goals
- references: 25
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20260222120000_add_soft_delete_progress.sql
- supabase/migrations/20251130000008_progress_tracking.sql
- app/tests/utils/test-database.ts
- app/components/students/StudentDetailsTab.tsx
- ... +15 more

## learning_roadmaps
- references: 5
- studio.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251209090000_init_studio_tier.sql
- supabase/migrations/20260120100000_fk_indexes.sql

## learning_stats
- references: 13
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251202100000_homework_and_progress_expansion.sql
- supabase/migrations/20251207100000_ai_practice_companion.sql
- supabase/migrations/20251130000008_progress_tracking.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/progress.ts
- app/lib/actions/progress/practice.ts
- ... +3 more

## lesson_allowance_periods
- references: 13
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251213200000_lesson_subscriptions.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/billing.ts
- app/lib/repositories/lesson-subscriptions.ts
- app/lib/actions/students/lessons/bookings.ts
- ... +3 more

## lesson_briefings
- references: 11
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251223110000_add_lesson_briefings.sql
- app/components/copilot/copilot-widget-server.tsx
- app/lib/actions/copilot.ts
- app/lib/copilot/briefing-generator.ts
- app/scripts/seed-demo-briefing.ts
- app/app/api/cron/generate-briefings/route.ts
- ... +1 more

## lesson_deliveries
- references: 4
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251127090000_enable_student_site_reviews.sql

## lesson_drills
- references: 19
- README.md
- studio.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251209090000_init_studio_tier.sql
- supabase/migrations/20251216100002_drill_booking_linkage.sql
- supabase/migrations/20251215200000_enterprise_lesson_analysis.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20250115000000_post_lesson_insights.sql
- ... +9 more

## lesson_notes
- references: 15
- README.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000008_progress_tracking.sql
- app/tests/utils/test-database.ts
- app/components/booking/StudentLessonHistory.tsx
- app/lib/repositories/progress.ts
- app/lib/data/student-detail.ts
- ... +5 more

## lesson_recordings
- references: 34
- README.md
- studio.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251209090000_init_studio_tier.sql
- supabase/migrations/20251216100001_lesson_recording_analysis_columns.sql
- supabase/migrations/20251215200000_enterprise_lesson_analysis.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251209110000_add_egress_id_to_recordings.sql
- ... +24 more

## lesson_subscription_redemptions
- references: 10
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251213200000_lesson_subscriptions.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/billing.ts
- app/lib/repositories/lesson-subscriptions.ts
- app/lib/calendar/booking-calendar-details.ts
- app/docs/archive/claude.md

## lesson_subscription_templates
- references: 18
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251213200000_lesson_subscriptions.sql
- app/tests/utils/test-database.ts
- app/app/(dashboard)/services/page.tsx
- app/lib/repositories/lesson-subscriptions.ts
- app/lib/data/analytics-metrics.ts
- ... +8 more

## lesson_subscriptions
- references: 14
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251213200000_lesson_subscriptions.sql
- supabase/migrations/20251221120000_dashboard_indexes.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/lesson-subscriptions.ts
- app/lib/data/analytics-metrics.ts
- ... +4 more

## lifetime_purchases
- references: 9
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251128150000_create_lifetime_purchases.sql
- supabase/migrations/20251213300000_add_source_to_lifetime_purchases.sql
- app/lib/repositories/lifetime-purchases.ts
- app/app/api/stripe/webhook/handlers/lifetime-purchase.ts
- app/docs/archive/claude.md

## link_events
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- app/components/marketing/link-analytics.tsx
- app/app/(dashboard)/marketing/links/page.tsx
- app/app/api/links/[id]/click/route.ts
- app/app/api/cron/cleanup-analytics/route.ts

## links
- references: 187
- README.md
- tasks.md
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106120000_email_preferences_and_queue.sql
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- ... +177 more

## marketing_clips
- references: 9
- studio.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251209090000_init_studio_tier.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251226100000_slug_conventions.sql
- supabase/migrations/20251220100000_add_marketing_clip_seo_fields.sql
- app/tests/utils/test-database.ts
- app/app/api/webhooks/deepgram/route.ts

## marketplace_orders
- references: 3
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md

## marketplace_resources
- references: 3
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md

## moderation_actions
- references: 8
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000006_content_moderation.sql
- app/app/api/admin/moderation/route.ts
- app/docs/PRD.md
- app/docs/archive/claude.md

## notification_preferences
- references: 3
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251130000007_notifications.sql

## notifications
- references: 67
- README.md
- tasks.md
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/stackhawk-google-oauth.yml
- app/claude.md
- supabase/migrations/20251130000007_notifications.sql
- supabase/migrations/20260307000000_student_portal_performance_indexes.sql
- ... +57 more

## page_views
- references: 11
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20251126200000_create_admin_dashboard.sql
- supabase/migrations/20251221120000_dashboard_indexes.sql
- app/lib/data/analytics-metrics.ts
- app/app/api/admin/analytics/page-views/route.ts
- app/app/api/analytics/page-view/route.ts
- app/app/api/cron/cleanup-analytics/route.ts
- ... +1 more

## payment_reminders
- references: 3
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md

## payments_audit
- references: 18
- MVP-LAUNCH-FIXES.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251118130000_add_stripe_connect_fields.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20251221120000_dashboard_indexes.sql
- supabase/migrations/20251118133000_add_refund_requests.sql
- app/lib/repositories/payments.ts
- ... +8 more

## phonetic_errors
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251208100000_ai_practice_enhancements.sql
- app/tests/integration/workflows/practice-session-corrections.test.ts
- app/lib/practice/stream-parser.ts
- app/app/api/practice/chat/route.ts
- app/app/api/practice/chat/stream/route.ts

## plan_change_history
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251229100000_checkout_optimization.sql
- supabase/migrations/20251130000009_plan_management.sql
- app/lib/services/checkout-agent.ts
- app/app/api/stripe/webhook/handlers/lifetime-purchase.ts
- app/app/api/stripe/webhook/handlers/subscription.ts
- app/app/api/admin/plans/route.ts

## plan_overrides
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251229100000_checkout_optimization.sql
- supabase/migrations/20251130000009_plan_management.sql
- app/app/api/admin/plans/route.ts

## platform_config
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251130000001_platform_config.sql
- app/lib/services/platform-config.ts
- app/app/api/admin/config/route.ts

## practice_assignments
- references: 18
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- app/e2e/practice/ai-practice-session.spec.ts
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251207100000_ai_practice_companion.sql
- supabase/migrations/20251209100000_homework_practice_integration.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/progress.ts
- ... +8 more

## practice_block_ledger
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251210100000_practice_usage_billing.sql
- supabase/migrations/20251228100000_practice_freemium_model.sql
- app/docs/stripe/PRACTICE-REVENUE-SHARE.md
- app/tests/practice-freemium-smoke.test.ts

## practice_scenarios
- references: 22
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- app/e2e/practice/ai-practice-session.spec.ts
- supabase/migrations/20251207100000_ai_practice_companion.sql
- supabase/migrations/20260313100000_practice_message_reservation.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/progress.ts
- app/app/(dashboard)/practice-scenarios/page.tsx
- ... +12 more

## practice_usage_periods
- references: 22
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251210100000_practice_usage_billing.sql
- supabase/migrations/20251228100000_practice_freemium_model.sql
- supabase/migrations/20260115100000_freemium_hardening.sql
- app/docs/stripe/PRACTICE-REVENUE-SHARE.md
- app/tests/utils/test-database.ts
- ... +12 more

## processed_requests
- references: 9
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260107100000_idempotency_reservation_pattern.sql
- supabase/migrations/20260106200000_create_processed_requests.sql
- supabase/migrations/20260221100000_make_processed_requests_response_body_nullable.sql
- supabase/migrations/20260107000002_add_owner_id_to_processed_requests.sql
- app/docs/ENGINEERING_STANDARDS.md
- app/tests/booking-idempotency.test.ts
- app/lib/utils/idempotency.ts

## processed_stripe_events
- references: 14
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260114100000_webhook_observability.sql
- supabase/migrations/20260308100000_processed_stripe_events_status.sql
- supabase/migrations/20251203110000_create_processed_stripe_events.sql
- app/docs/stripe/PRACTICE-REVENUE-SHARE.md
- app/tests/stripe-idempotency.test.ts
- ... +4 more

## proficiency_assessments
- references: 10
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251130000008_progress_tracking.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/progress.ts
- app/docs/PRD.md
- app/docs/archive/claude.md

## profiles
- references: 289
- README.md
- studio.md
- MVP-LAUNCH-FIXES.md
- project-overview.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106120000_email_preferences_and_queue.sql
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/migrations_archive/README.md
- supabase/migrations_archive/20250106103000_create_email_campaigns.sql
- ... +279 more

## pronunciation_assessments
- references: 10
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251208100000_ai_practice_enhancements.sql
- app/tests/utils/test-database.ts
- app/app/api/practice/audio/route.ts
- app/docs/PRD.md
- app/docs/archive/claude.md

## rate_limit_events
- references: 3
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251204120000_checkout_rate_limit.sql

## refund_requests
- references: 9
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20251118133000_add_refund_requests.sql
- app/lib/repositories/refunds.ts
- app/app/(dashboard)/admin/refunds/page.tsx
- app/docs/archive/claude.md

## reviews
- references: 95
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251227100000_review_editability.sql
- supabase/migrations/20251127090000_enable_student_site_reviews.sql
- app/e2e/homework/assignment-workflow.spec.ts
- app/app/admin/moderation/page.tsx
- ... +85 more

## services
- references: 297
- README.md
- tasks.md
- MVP-LAUNCH-FIXES.md
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/next.config.ts
- ... +287 more

## session_package_purchases
- references: 23
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251129000000_comprehensive_rls_and_constraints.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- supabase/migrations/20251221120000_dashboard_indexes.sql
- ... +13 more

## session_package_redemptions
- references: 11
- MVP-LAUNCH-FIXES.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/tests/utils/test-database.ts
- app/lib/repositories/bookings/queries.ts
- app/lib/actions/packages.ts
- app/lib/actions/students/lessons/bookings.ts
- app/lib/calendar/booking-calendar-details.ts
- ... +1 more

## session_package_templates
- references: 33
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251230100000_update_default_services_onboarding.sql
- supabase/migrations/20251129000000_comprehensive_rls_and_constraints.sql
- supabase/migrations/20251112000000_security_hardening_and_schema.sql
- ... +23 more

## student_engagement_score_queue
- references: 3
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260107000000_align_conversations_and_engagement_queue.sql

## student_engagement_scores
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20260105000000_student_crm_lifecycle.sql
- app/lib/actions/students/lessons/engagement.ts

## student_grammar_patterns
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251226100000_slug_conventions.sql
- supabase/migrations/20251208100000_ai_practice_enhancements.sql

## student_onboarding_progress
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20260105000000_student_crm_lifecycle.sql
- app/lib/actions/students/settings/onboarding.ts

## student_onboarding_templates
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20260105000000_student_crm_lifecycle.sql
- supabase/migrations/20260107000000_align_conversations_and_engagement_queue.sql
- app/lib/actions/students/settings/onboarding.ts

## student_practice_messages
- references: 17
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- app/e2e/practice/ai-practice-session.spec.ts
- supabase/migrations/20251207100000_ai_practice_companion.sql
- supabase/migrations/20251208100000_ai_practice_enhancements.sql
- app/tests/utils/test-database.ts
- app/lib/practice/greeting.ts
- app/lib/practice/openai.ts
- ... +7 more

## student_practice_sessions
- references: 33
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- app/e2e/practice/ai-practice-session.spec.ts
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20251207100000_ai_practice_companion.sql
- supabase/migrations/20260307000000_student_portal_performance_indexes.sql
- supabase/migrations/20251209100000_homework_practice_integration.sql
- ... +23 more

## student_practice_summaries
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251208100000_ai_practice_enhancements.sql
- app/lib/repositories/progress.ts
- app/app/api/practice/progress/route.ts

## student_preferences
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251130000004_student_settings.sql
- supabase/migrations/20260307000000_student_portal_performance_indexes.sql
- app/lib/actions/students/settings/avatar.ts
- app/lib/actions/students/settings/settings.ts

## student_timeline_events
- references: 8
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260106000000_student_crm_automation.sql
- supabase/migrations/20260105000000_student_crm_lifecycle.sql
- supabase/migrations/20260107000000_align_conversations_and_engagement_queue.sql
- app/lib/actions/students/lessons/timeline.ts
- app/lib/actions/students/lessons/engagement.ts
- app/lib/actions/students/settings/onboarding.ts

## student_tutor_connections
- references: 14
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251126100000_create_student_tutor_connections.sql
- app/tests/utils/test-database.ts
- app/lib/repositories/bookings/mutations.ts
- app/lib/repositories/bookings/queries.ts
- app/lib/repositories/messaging.ts
- app/lib/actions/students/lessons/bookings.ts
- app/lib/actions/students/connections.ts
- ... +4 more

## students
- references: 566
- README.md
- studio.md
- STRIPE-SETUP-GUIDE.md
- tasks.md
- MVP-LAUNCH-FIXES.md
- project-overview.md
- TutorLingua - Comprehensive Testing Report.md
- SECURITY.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20250106120000_email_preferences_and_queue.sql
- ... +556 more

## subscriptions
- references: 108
- README.md
- STRIPE-SETUP-GUIDE.md
- tasks.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/migrations_archive/20251106000000_update_rls_with_check_clauses.sql
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251213200000_lesson_subscriptions.sql
- supabase/migrations/20251127103000_add_service_offer_types.sql
- ... +98 more

## support_tickets
- references: 11
- README.md
- project-overview.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251128100000_create_support_tickets.sql
- app/lib/actions/support.ts
- app/app/api/support/route.ts
- app/docs/PRD.md
- ... +1 more

## system_error_log
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251130000003_system_health.sql
- app/lib/monitoring.ts
- app/app/api/admin/health/route.ts

## system_metrics
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251130000003_system_health.sql
- app/lib/monitoring.ts
- app/app/api/admin/health/route.ts

## system_metrics_hourly
- references: 3
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251130000003_system_health.sql

## system_status
- references: 4
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20251130000003_system_health.sql
- app/app/api/admin/health/route.ts

## tutor_reengagement_emails
- references: 6
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251203100000_tutor_inactivity_tracking.sql
- app/app/api/admin/tutors/reengagement/route.ts
- app/docs/archive/claude.md

## tutor_site_resources
- references: 10
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251116181000_enable_rls_and_policies.sql
- supabase/migrations/20260108000000_add_soft_delete_to_site_resources.sql
- supabase/migrations/20251113150000_create_tutor_sites.sql
- supabase/migrations/20251115120000_unlock_theme_and_layouts.sql
- app/lib/repositories/tutor-sites.ts
- app/docs/archive/claude.md

## tutor_site_reviews
- references: 13
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260305000000_add_soft_delete_to_site_children.sql
- supabase/migrations/20251116181000_enable_rls_and_policies.sql
- supabase/migrations/20251113150000_create_tutor_sites.sql
- supabase/migrations/20251128110000_add_pinned_review.sql
- supabase/migrations/20251227100000_review_editability.sql
- supabase/migrations/20251127090000_enable_student_site_reviews.sql
- ... +3 more

## tutor_site_services
- references: 10
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20260305000000_add_soft_delete_to_site_children.sql
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251116181000_enable_rls_and_policies.sql
- supabase/migrations/20251113150000_create_tutor_sites.sql
- app/lib/repositories/tutor-sites.ts
- app/docs/archive/claude.md

## tutor_sites
- references: 21
- README.md
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- app/claude.md
- supabase/migrations/20251116181100_add_updated_at_trigger.sql
- supabase/migrations/20251116181000_enable_rls_and_policies.sql
- supabase/migrations/20251215100000_cultural_banner_archetypes.sql
- supabase/migrations/20251116181200_add_tutor_site_versions.sql
- supabase/migrations/20251207120000_add_hero_gallery_visibility.sql
- supabase/migrations/20251113150000_create_tutor_sites.sql
- ... +11 more

## tutor_status_history
- references: 5
- supabase/production-table-usage-report.md
- supabase/production-schema-report.md
- supabase/migrations/20260120100000_fk_indexes.sql
- supabase/migrations/20251130000002_tutor_status.sql
- app/app/api/admin/tutors/[id]/status/route.ts
