# RLS policies, views, and functions report

## Policies
### public.admin_audit_log.Service role manages admin_audit_log
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.admin_emails.Service role manages admin_emails
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.admin_users.Service role manages admin_users
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.ai_conversations.Service role manages ai_conversations
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.ai_conversations.Users manage own ai_conversations
- qual: (user_id = auth.uid())
- with_check: (user_id = auth.uid())

### public.ai_messages.Service role manages ai_messages
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.ai_messages.Users manage own ai_messages
- qual: (conversation_id IN ( SELECT ai_conversations.id
   FROM ai_conversations
  WHERE (ai_conversations.user_id = auth.uid())))
- with_check: (conversation_id IN ( SELECT ai_conversations.id
   FROM ai_conversations
  WHERE (ai_conversations.user_id = auth.uid())))

### public.ai_usage.Service role manages ai_usage
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.ai_usage.Users view own ai_usage
- qual: (user_id = auth.uid())

### public.audit_logs.Service role inserts audit_logs
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.audit_logs.Service role reads audit_logs
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.audit_logs.Tutors insert own audit_logs
- with_check: (actor_id = auth.uid())

### public.audit_logs.Tutors read own audit_logs
- qual: (actor_id = auth.uid())

### public.availability.Availability is viewable by everyone
- qual: true

### public.availability.Public can view availability
- qual: (is_available = true)

### public.availability.Tutors can manage their availability
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.blocked_times.Tutors can delete own blocked times
- qual: (auth.uid() = tutor_id)

### public.blocked_times.Tutors can insert own blocked times
- with_check: (auth.uid() = tutor_id)

### public.blocked_times.Tutors can update own blocked times
- qual: (auth.uid() = tutor_id)
- with_check: (auth.uid() = tutor_id)

### public.blocked_times.Tutors can view own blocked times
- qual: (auth.uid() = tutor_id)

### public.booking_reschedule_history.Service role manages reschedule_history
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.booking_reschedule_history.Students view own reschedule history
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.booking_reschedule_history.Tutors view own reschedule history
- qual: (tutor_id = auth.uid())

### public.bookings.Students can create bookings
- with_check: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.bookings.Students can view their bookings
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.bookings.Tutors can manage their bookings
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.calendar_connections.Tutors manage their calendar connections
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.calendar_connections.calendar_connections_service_role_all
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.calendar_connections.calendar_connections_tutor_delete
- qual: (tutor_id = auth.uid())

### public.calendar_connections.calendar_connections_tutor_insert
- with_check: (tutor_id = auth.uid())

### public.calendar_connections.calendar_connections_tutor_select
- qual: (tutor_id = auth.uid())

### public.calendar_connections.calendar_connections_tutor_update
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.calendar_events.calendar_events_service_role_all
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.calendar_events.calendar_events_tutor_delete
- qual: (tutor_id = auth.uid())

### public.calendar_events.calendar_events_tutor_insert
- with_check: (tutor_id = auth.uid())

### public.calendar_events.calendar_events_tutor_select
- qual: (tutor_id = auth.uid())

### public.calendar_events.calendar_events_tutor_update
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.calendar_sync_jobs.calendar_sync_jobs_service_role_all
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.calendar_sync_jobs.calendar_sync_jobs_tutor_delete
- qual: (tutor_id = auth.uid())

### public.calendar_sync_jobs.calendar_sync_jobs_tutor_select
- qual: (tutor_id = auth.uid())

### public.calendar_sync_jobs.calendar_sync_jobs_tutor_update
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.calendar_sync_runs.calendar_sync_runs_service_role_all
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.calendar_sync_runs.calendar_sync_runs_tutor_select
- qual: (tutor_id = auth.uid())

### public.content_reports.Service role manages content_reports
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.content_reports.Users create reports
- with_check: (reporter_id = auth.uid())

### public.content_reports.Users view own reports
- qual: (reporter_id = auth.uid())

### public.conversation_messages.conversation_messages_student_insert
- with_check: (thread_id IN ( SELECT ct.id
   FROM (conversation_threads ct
     JOIN students s ON ((ct.student_id = s.id)))
  WHERE (s.user_id = auth.uid())))

### public.conversation_messages.conversation_messages_student_read
- qual: (thread_id IN ( SELECT ct.id
   FROM (conversation_threads ct
     JOIN students s ON ((ct.student_id = s.id)))
  WHERE (s.user_id = auth.uid())))

### public.conversation_messages.conversation_messages_tutor_all
- qual: (thread_id IN ( SELECT conversation_threads.id
   FROM conversation_threads
  WHERE (conversation_threads.tutor_id = auth.uid())))
- with_check: (thread_id IN ( SELECT conversation_threads.id
   FROM conversation_threads
  WHERE (conversation_threads.tutor_id = auth.uid())))

### public.conversation_threads.conversation_threads_student_read
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.conversation_threads.conversation_threads_tutor_all
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.digital_product_purchases.digital_product_purchases_tutor_read
- qual: (tutor_id = auth.uid())

### public.digital_products.digital_products_public_read
- qual: (is_active = true)

### public.digital_products.digital_products_tutor_all
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.email_campaign_recipients.email_campaign_recipients_tutor_all
- qual: (campaign_id IN ( SELECT email_campaigns.id
   FROM email_campaigns
  WHERE (email_campaigns.tutor_id = auth.uid())))
- with_check: (campaign_id IN ( SELECT email_campaigns.id
   FROM email_campaigns
  WHERE (email_campaigns.tutor_id = auth.uid())))

### public.email_campaigns.Tutors manage email campaigns
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.email_events.Service role can manage email_events
- qual: true
- with_check: true

### public.email_suppressions.Service role can manage email_suppressions
- qual: true
- with_check: true

### public.grammar_error_categories.Grammar categories are public read
- qual: true

### public.grammar_errors.Service role can insert grammar errors
- with_check: true

### public.grammar_errors.Tutors can view student grammar errors
- qual: (tutor_id = auth.uid())

### public.group_session_attendees.Students can register for group sessions
- with_check: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.group_session_attendees.Students view their group attendance
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.group_session_attendees.Tutors manage group attendees
- qual: (group_session_id IN ( SELECT group_sessions.id
   FROM group_sessions
  WHERE (group_sessions.tutor_id = auth.uid())))
- with_check: (group_session_id IN ( SELECT group_sessions.id
   FROM group_sessions
  WHERE (group_sessions.tutor_id = auth.uid())))

### public.group_sessions.Students can view group sessions
- qual: (status = 'published'::text)

### public.group_sessions.Tutors manage group sessions
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.homework_assignments.Service role manages homework_assignments
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.homework_assignments.Students view homework_assignments
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.homework_assignments.Tutors manage homework_assignments
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.homework_submissions.Service role manages homework_submissions
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.homework_submissions.Students manage own submissions
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))
- with_check: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.homework_submissions.Tutors review submissions
- qual: (EXISTS ( SELECT 1
   FROM homework_assignments ha
  WHERE ((ha.id = homework_submissions.homework_id) AND (ha.tutor_id = auth.uid()))))
- with_check: (EXISTS ( SELECT 1
   FROM homework_assignments ha
  WHERE ((ha.id = homework_submissions.homework_id) AND (ha.tutor_id = auth.uid()))))

### public.homework_submissions.Tutors view student submissions
- qual: (EXISTS ( SELECT 1
   FROM homework_assignments ha
  WHERE ((ha.id = homework_submissions.homework_id) AND (ha.tutor_id = auth.uid()))))

### public.impersonation_sessions.Service role manages impersonation_sessions
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.interactive_activities.Tutors manage interactive activities
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.invoice_line_items.Tutors manage invoice line items
- qual: (invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.tutor_id = auth.uid())))
- with_check: (invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.tutor_id = auth.uid())))

### public.invoices.Students can view their invoices
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.invoices.Tutors manage their invoices
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.learning_goals.Service role manages learning_goals
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.learning_goals.Students view own learning_goals
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.learning_goals.Tutors manage learning_goals
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.learning_roadmaps.Students can view own roadmaps
- qual: (student_id IN ( SELECT s.id
   FROM students s
  WHERE (s.user_id = auth.uid())))

### public.learning_roadmaps.Tutors can manage own roadmaps
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.learning_stats.Service role manages learning_stats
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.learning_stats.Students view own learning_stats
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.learning_stats.Tutors manage learning_stats
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_allowance_periods.Service role manages periods
- qual: (auth.role() = 'service_role'::text)
- with_check: (auth.role() = 'service_role'::text)

### public.lesson_allowance_periods.Students view own periods
- qual: (EXISTS ( SELECT 1
   FROM (lesson_subscriptions ls
     JOIN students s ON ((s.id = ls.student_id)))
  WHERE ((ls.id = lesson_allowance_periods.subscription_id) AND (s.user_id = auth.uid()))))

### public.lesson_allowance_periods.Tutors view student periods
- qual: (EXISTS ( SELECT 1
   FROM lesson_subscriptions ls
  WHERE ((ls.id = lesson_allowance_periods.subscription_id) AND (ls.tutor_id = auth.uid()))))

### public.lesson_briefings.Service role can delete briefings
- qual: true

### public.lesson_briefings.Service role can insert briefings
- with_check: true

### public.lesson_briefings.Tutors can update their own briefings
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_briefings.Tutors can view their own briefings
- qual: (tutor_id = auth.uid())

### public.lesson_deliveries.Students acknowledge lesson deliveries
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))
- with_check: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.lesson_deliveries.Students view lesson deliveries
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.lesson_deliveries.Tutors manage lesson deliveries
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_deliveries.Tutors view lesson deliveries
- qual: (tutor_id = auth.uid())

### public.lesson_drills.Students can update own drills
- qual: (student_id IN ( SELECT s.id
   FROM students s
  WHERE (s.user_id = auth.uid())))
- with_check: (student_id IN ( SELECT s.id
   FROM students s
  WHERE (s.user_id = auth.uid())))

### public.lesson_drills.Students can view own drills
- qual: (student_id IN ( SELECT s.id
   FROM students s
  WHERE (s.user_id = auth.uid())))

### public.lesson_drills.Students can view their visible drills
- qual: ((student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid()))) AND (visible_to_student = true))

### public.lesson_drills.Tutors can delete drills for their students
- qual: (tutor_id = auth.uid())

### public.lesson_drills.Tutors can manage own drills
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_drills.Tutors can update drills for their students
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_drills.Tutors can view drills for their students
- qual: (tutor_id = auth.uid())

### public.lesson_notes.Service role manages lesson_notes
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.lesson_notes.Students view own lesson_notes
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.lesson_notes.Tutors can manage their lesson notes
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_notes.Tutors manage lesson_notes
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_recordings.Students can view own recordings
- qual: (student_id IN ( SELECT s.id
   FROM students s
  WHERE (s.user_id = auth.uid())))

### public.lesson_recordings.Tutors can manage own recordings
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_subscription_redemptions.Service role manages redemptions
- qual: (auth.role() = 'service_role'::text)
- with_check: (auth.role() = 'service_role'::text)

### public.lesson_subscription_redemptions.Students view own redemptions
- qual: (EXISTS ( SELECT 1
   FROM ((lesson_allowance_periods lap
     JOIN lesson_subscriptions ls ON ((ls.id = lap.subscription_id)))
     JOIN students s ON ((s.id = ls.student_id)))
  WHERE ((lap.id = lesson_subscription_redemptions.period_id) AND (s.user_id = auth.uid()))))

### public.lesson_subscription_redemptions.Tutors view redemptions
- qual: (EXISTS ( SELECT 1
   FROM (lesson_allowance_periods lap
     JOIN lesson_subscriptions ls ON ((ls.id = lap.subscription_id)))
  WHERE ((lap.id = lesson_subscription_redemptions.period_id) AND (ls.tutor_id = auth.uid()))))

### public.lesson_subscription_templates.Public view active templates
- qual: (is_active = true)

### public.lesson_subscription_templates.Tutors manage own templates
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.lesson_subscriptions.Service role manages subscriptions
- qual: (auth.role() = 'service_role'::text)
- with_check: (auth.role() = 'service_role'::text)

### public.lesson_subscriptions.Students view own subscriptions
- qual: (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.id = lesson_subscriptions.student_id) AND (s.user_id = auth.uid()))))

### public.lesson_subscriptions.Tutors view student subscriptions
- qual: (tutor_id = auth.uid())

### public.lifetime_purchases.Service role manages lifetime purchases
- qual: true
- with_check: true

### public.link_events.link_events_tutor_read
- qual: (tutor_id = auth.uid())

### public.links.Links are viewable by everyone
- qual: ((is_visible = true) OR (tutor_id = auth.uid()))

### public.links.Tutors can manage their links
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.marketing_clips.Public can view approved clips
- qual: (tutor_approved = true)

### public.marketing_clips.Tutors can manage own clips
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.marketplace_orders.Buyers can view their marketplace orders
- qual: (buyer_id = auth.uid())

### public.marketplace_orders.Tutors manage marketplace orders
- qual: (marketplace_resource_id IN ( SELECT marketplace_resources.id
   FROM marketplace_resources
  WHERE (marketplace_resources.tutor_id = auth.uid())))

### public.marketplace_orders.Tutors manage orders for their resources
- qual: (marketplace_resource_id IN ( SELECT marketplace_resources.id
   FROM marketplace_resources
  WHERE (marketplace_resources.tutor_id = auth.uid())))
- with_check: (marketplace_resource_id IN ( SELECT marketplace_resources.id
   FROM marketplace_resources
  WHERE (marketplace_resources.tutor_id = auth.uid())))

### public.marketplace_resources.Tutors manage marketplace resources
- qual: (tutor_id = auth.uid())

### public.marketplace_resources.Tutors manage their marketplace resources
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.moderation_actions.Service role manages moderation_actions
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.notification_preferences.Service role manages notification_preferences
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.notification_preferences.Users manage own notification_preferences
- qual: (user_id = auth.uid())
- with_check: (user_id = auth.uid())

### public.notifications.Service role manages notifications
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.notifications.Users update own notifications
- qual: (user_id = auth.uid())
- with_check: (user_id = auth.uid())

### public.notifications.Users view own notifications
- qual: (user_id = auth.uid())

### public.page_views.Service role manages page_views
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.page_views.page_views_no_user_access
- qual: false

### public.payment_reminders.Tutors manage payment reminders
- qual: (invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.tutor_id = auth.uid())))
- with_check: (invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.tutor_id = auth.uid())))

### public.payments_audit.payments_audit_tutor_read
- qual: (tutor_id = auth.uid())

### public.phonetic_errors.Service role can insert phonetic errors
- with_check: true

### public.phonetic_errors.Tutors can view phonetic errors
- qual: (tutor_id = auth.uid())

### public.plan_change_history.Service role manages plan_change_history
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.plan_change_history.Tutors view own plan_change_history
- qual: (tutor_id = auth.uid())

### public.plan_overrides.Service role manages plan_overrides
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.plan_overrides.Tutors view own plan_overrides
- qual: (tutor_id = auth.uid())

### public.platform_config.Service role manages platform_config
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.practice_assignments.Tutors manage own assignments
- qual: (tutor_id = auth.uid())

### public.practice_block_ledger.Service role full access ledger
- qual: true
- with_check: true

### public.practice_scenarios.Tutors manage own scenarios
- qual: (tutor_id = auth.uid())

### public.practice_usage_periods.Service role full access usage
- qual: true
- with_check: true

### public.practice_usage_periods.Students can view own usage
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.practice_usage_periods.Tutors can view student usage
- qual: (tutor_id = auth.uid())

### public.processed_stripe_events.Service role manages processed events
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.proficiency_assessments.Service role manages proficiency_assessments
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.proficiency_assessments.Students view own proficiency_assessments
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.proficiency_assessments.Tutors manage proficiency_assessments
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.profiles.Users can insert own profile
- with_check: (id = auth.uid())

### public.profiles.Users can read own profile
- qual: (auth.uid() = id)

### public.profiles.Users can update own profile
- qual: (id = auth.uid())
- with_check: (id = auth.uid())

### public.profiles.Users can view own profile
- qual: (auth.uid() = id)

### public.pronunciation_assessments.Service role can insert pronunciation assessments
- with_check: true

### public.pronunciation_assessments.Tutors can view pronunciation assessments
- qual: (tutor_id = auth.uid())

### public.rate_limit_events.Service role manages rate limit events
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.refund_requests.refund_requests_student_read
- qual: (student_id = auth.uid())

### public.refund_requests.refund_requests_tutor_create
- with_check: (tutor_id = auth.uid())

### public.refund_requests.refund_requests_tutor_read
- qual: (tutor_id = auth.uid())

### public.reviews.Students can view their reviews
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.reviews.Students create reviews
- with_check: ((student_id IN ( SELECT students.id
   FROM students
  WHERE ((students.user_id = auth.uid()) AND (students.tutor_id = reviews.tutor_id)))) AND (EXISTS ( SELECT 1
   FROM bookings
  WHERE ((bookings.tutor_id = reviews.tutor_id) AND (bookings.student_id = reviews.student_id) AND (bookings.status = 'completed'::text)))))

### public.reviews.Tutors manage their reviews
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.services.Public can view active services
- qual: (is_active = true)

### public.services.Services are viewable by everyone
- qual: ((is_active = true) OR (tutor_id = auth.uid()))

### public.services.Tutors can manage own services
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.session_package_purchases.Students can view their package purchases
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.session_package_purchases.Tutors manage package purchases
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.session_package_redemptions.Tutors manage package redemptions
- qual: (purchase_id IN ( SELECT session_package_purchases.id
   FROM session_package_purchases
  WHERE (session_package_purchases.tutor_id = auth.uid())))
- with_check: (purchase_id IN ( SELECT session_package_purchases.id
   FROM session_package_purchases
  WHERE (session_package_purchases.tutor_id = auth.uid())))

### public.session_package_templates.Tutors manage their package templates
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.student_engagement_score_queue.Service role full access engagement queue
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_engagement_scores.Service role full access scores
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_engagement_scores.Tutors manage engagement scores
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.student_grammar_patterns.Service role can manage grammar patterns
- with_check: true

### public.student_grammar_patterns.Tutors can view student grammar patterns
- qual: (tutor_id = auth.uid())

### public.student_onboarding_progress.Service role full access progress
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_onboarding_progress.Students view own onboarding progress
- qual: (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))

### public.student_onboarding_progress.Tutors manage onboarding progress
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.student_onboarding_templates.Service role full access templates
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_onboarding_templates.Students view templates used in onboarding
- qual: (EXISTS ( SELECT 1
   FROM (student_onboarding_progress p
     JOIN students s ON ((s.id = p.student_id)))
  WHERE ((p.template_id = student_onboarding_templates.id) AND (s.user_id = auth.uid()))))

### public.student_onboarding_templates.Tutors manage own templates
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.student_practice_messages.Service role manages practice messages
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_practice_sessions.Service role manages practice sessions
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_practice_sessions.Tutors view student sessions
- qual: (tutor_id = auth.uid())

### public.student_practice_summaries.Service role can manage practice summaries
- with_check: true

### public.student_practice_summaries.Tutors can view practice summaries
- qual: (tutor_id = auth.uid())

### public.student_preferences.Service role manages student_preferences
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_preferences.Students manage own preferences
- qual: (user_id = auth.uid())
- with_check: (user_id = auth.uid())

### public.student_timeline_events.Service role full access timeline
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.student_timeline_events.Students view own visible timeline
- qual: ((visible_to_student = true) AND (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid()))))

### public.student_timeline_events.Tutors manage student timeline
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.student_tutor_connections.Students create connection requests
- with_check: (student_user_id = auth.uid())

### public.student_tutor_connections.Students view own connections
- qual: (student_user_id = auth.uid())

### public.student_tutor_connections.Tutors update connection requests
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.student_tutor_connections.Tutors view their connection requests
- qual: (tutor_id = auth.uid())

### public.students.Students can view their own profile
- qual: (user_id = auth.uid())

### public.students.Tutors can manage their students
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.subscriptions.Service role can manage subscriptions
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.subscriptions.Users can view own subscription
- qual: (user_id = auth.uid())

### public.support_tickets.Service role manages support tickets
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.support_tickets.Users create support tickets
- with_check: ((user_id = auth.uid()) AND ((student_id IS NULL) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE (students.user_id = auth.uid())))) AND ((tutor_id IS NULL) OR (tutor_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM students
  WHERE ((students.user_id = auth.uid()) AND (students.tutor_id = support_tickets.tutor_id))))))

### public.support_tickets.Users view own support tickets
- qual: (user_id = auth.uid())

### public.system_error_log.Service role manages system_error_log
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.system_metrics.Service role manages system_metrics
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.system_metrics_hourly.Service role manages system_metrics_hourly
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.system_status.Service role manages system_status
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.tutor_reengagement_emails.Service role manages tutor_reengagement_emails
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### public.tutor_site_resources.tutor_site_resources_owner_all
- qual: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_resources.tutor_site_id) AND (tutor_sites.tutor_id = auth.uid()))))
- with_check: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_resources.tutor_site_id) AND (tutor_sites.tutor_id = auth.uid()))))

### public.tutor_site_resources.tutor_site_resources_public_select
- qual: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_resources.tutor_site_id) AND (tutor_sites.status = 'published'::text))))

### public.tutor_site_reviews.tutor_site_reviews_owner_all
- qual: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_reviews.tutor_site_id) AND (tutor_sites.tutor_id = auth.uid()))))
- with_check: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_reviews.tutor_site_id) AND (tutor_sites.tutor_id = auth.uid()))))

### public.tutor_site_reviews.tutor_site_reviews_public_select
- qual: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_reviews.tutor_site_id) AND (tutor_sites.status = 'published'::text))))

### public.tutor_site_reviews.tutor_site_reviews_student_insert
- with_check: ((EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_reviews.tutor_site_id) AND (tutor_sites.tutor_id IN ( SELECT students.tutor_id
           FROM students
          WHERE (students.user_id = auth.uid())))))) AND ((student_id IS NULL) OR (student_id IN ( SELECT students.id
   FROM students
  WHERE ((students.user_id = auth.uid()) AND (students.tutor_id IN ( SELECT tutor_sites.tutor_id
           FROM tutor_sites
          WHERE (tutor_sites.id = tutor_site_reviews.tutor_site_id))))))) AND (EXISTS ( SELECT 1
   FROM bookings
  WHERE ((bookings.tutor_id = ( SELECT tutor_sites.tutor_id
           FROM tutor_sites
          WHERE (tutor_sites.id = tutor_site_reviews.tutor_site_id))) AND (bookings.student_id = tutor_site_reviews.student_id) AND (bookings.status = 'completed'::text)))))

### public.tutor_site_services.tutor_site_services_owner_all
- qual: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_services.tutor_site_id) AND (tutor_sites.tutor_id = auth.uid()))))
- with_check: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_services.tutor_site_id) AND (tutor_sites.tutor_id = auth.uid()))))

### public.tutor_site_services.tutor_site_services_public_select
- qual: (EXISTS ( SELECT 1
   FROM tutor_sites
  WHERE ((tutor_sites.id = tutor_site_services.tutor_site_id) AND (tutor_sites.status = 'published'::text))))

### public.tutor_sites.tutor_sites_owner_all
- qual: (tutor_id = auth.uid())
- with_check: (tutor_id = auth.uid())

### public.tutor_sites.tutor_sites_public_select
- qual: (status = 'published'::text)

### public.tutor_status_history.Service role manages tutor_status_history
- qual: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
- with_check: ((auth.jwt() ->> 'role'::text) = 'service_role'::text)

### storage.objects.Anyone can view avatars
- qual: (bucket_id = 'avatars'::text)

### storage.objects.Public read site assets
- qual: (bucket_id = 'site-assets'::text)

### storage.objects.Site assets delete own folder
- qual: ((bucket_id = 'site-assets'::text) AND (name ~~ ((auth.uid())::text || '/%'::text)))

### storage.objects.Site assets update own folder
- qual: ((bucket_id = 'site-assets'::text) AND (name ~~ ((auth.uid())::text || '/%'::text)))
- with_check: ((bucket_id = 'site-assets'::text) AND (name ~~ ((auth.uid())::text || '/%'::text)))

### storage.objects.Site assets upload own folder
- with_check: ((bucket_id = 'site-assets'::text) AND (name ~~ ((auth.uid())::text || '/%'::text)))

### storage.objects.Users can delete their own avatar
- qual: (bucket_id = 'avatars'::text)

### storage.objects.Users can update their own avatar
- qual: (bucket_id = 'avatars'::text)

### storage.objects.Users can upload their own avatar
- with_check: (bucket_id = 'avatars'::text)

## Views
### extensions.pg_stat_statements_info
```sql
 SELECT dealloc,
    stats_reset
   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);
```

### extensions.pg_stat_statements
```sql
 SELECT userid,
    dbid,
    toplevel,
    queryid,
    query,
    plans,
    total_plan_time,
    min_plan_time,
    max_plan_time,
    mean_plan_time,
    stddev_plan_time,
    calls,
    total_exec_time,
    min_exec_time,
    max_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_dirtied,
    shared_blks_written,
    local_blks_hit,
    local_blks_read,
    local_blks_dirtied,
    local_blks_written,
    temp_blks_read,
    temp_blks_written,
    shared_blk_read_time,
    shared_blk_write_time,
    local_blk_read_time,
    local_blk_write_time,
    temp_blk_read_time,
    temp_blk_write_time,
    wal_records,
    wal_fpi,
    wal_bytes,
    jit_functions,
    jit_generation_time,
    jit_inlining_count,
    jit_inlining_time,
    jit_optimization_count,
    jit_optimization_time,
    jit_emission_count,
    jit_emission_time,
    jit_deform_count,
    jit_deform_time,
    stats_since,
    minmax_stats_since
   FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since);
```

### vault.decrypted_secrets
```sql
 SELECT id,
    name,
    description,
    secret,
    convert_from(vault._crypto_aead_det_decrypt(message => decode(secret, 'base64'::text), additional => convert_to(id::text, 'utf8'::name), key_id => 0::bigint, context => '\x7067736f6469756d'::bytea, nonce => nonce), 'utf8'::name) AS decrypted_secret,
    key_id,
    nonce,
    created_at,
    updated_at
   FROM vault.secrets s;
```

### public.public_profiles
```sql
 SELECT id,
    username,
    full_name,
    avatar_url,
    bio,
    tagline,
    timezone,
    languages_taught,
    booking_currency,
    created_at,
    role,
    website_url,
    instagram_handle,
    tiktok_handle,
    facebook_handle,
    x_handle
   FROM get_public_profiles() get_public_profiles(id, username, full_name, avatar_url, bio, tagline, timezone, languages_taught, booking_currency, created_at, role, website_url, instagram_handle, tiktok_handle, facebook_handle, x_handle);
```

### public.email_event_summary
```sql
 SELECT event_type,
    count(*) AS total_events,
    count(DISTINCT lower(to_email)) AS unique_recipients
   FROM email_events
  GROUP BY event_type;
```

### public.webhook_health_stats
```sql
 SELECT status,
    count(*) AS event_count,
    max(processed_at) AS last_event_at,
    avg(processing_duration_ms)::integer AS avg_processing_ms,
    min(processed_at) AS oldest_event_at
   FROM processed_stripe_events
  WHERE processed_at > (now() - '24:00:00'::interval)
  GROUP BY status;
```

## Functions
### public.set_homework_submissions_updated_at
```sql
CREATE OR REPLACE FUNCTION public.set_homework_submissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.update_homework_on_submission
```sql
CREATE OR REPLACE FUNCTION public.update_homework_on_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE homework_assignments
    SET status = 'submitted',
        submitted_at = NEW.submitted_at,
        updated_at = NOW()
    WHERE id = NEW.homework_id
      AND status IN ('assigned', 'in_progress');
  END IF;
  RETURN NEW;
END;
$function$

```

### public.update_lesson_briefings_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_lesson_briefings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$

```

### public.update_student_tutor_connections_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_student_tutor_connections_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.update_admin_users_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.set_updated_at_timestamp
```sql
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.update_platform_config_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_platform_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.update_tutor_sites_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_tutor_sites_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### extensions.set_limit
```sql
CREATE OR REPLACE FUNCTION extensions.set_limit(real)
 RETURNS real
 LANGUAGE c
 STRICT
AS '$libdir/pg_trgm', $function$set_limit$function$

```

### extensions.show_limit
```sql
CREATE OR REPLACE FUNCTION extensions.show_limit()
 RETURNS real
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_limit$function$

```

### extensions.show_trgm
```sql
CREATE OR REPLACE FUNCTION extensions.show_trgm(text)
 RETURNS text[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_trgm$function$

```

### extensions.similarity
```sql
CREATE OR REPLACE FUNCTION extensions.similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity$function$

```

### extensions.similarity_op
```sql
CREATE OR REPLACE FUNCTION extensions.similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_op$function$

```

### extensions.word_similarity
```sql
CREATE OR REPLACE FUNCTION extensions.word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity$function$

```

### extensions.word_similarity_op
```sql
CREATE OR REPLACE FUNCTION extensions.word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_op$function$

```

### extensions.word_similarity_commutator_op
```sql
CREATE OR REPLACE FUNCTION extensions.word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_commutator_op$function$

```

### extensions.similarity_dist
```sql
CREATE OR REPLACE FUNCTION extensions.similarity_dist(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_dist$function$

```

### extensions.word_similarity_dist_op
```sql
CREATE OR REPLACE FUNCTION extensions.word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_op$function$

```

### extensions.word_similarity_dist_commutator_op
```sql
CREATE OR REPLACE FUNCTION extensions.word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_commutator_op$function$

```

### extensions.gtrgm_in
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_in(cstring)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_in$function$

```

### extensions.gtrgm_out
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_out(gtrgm)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_out$function$

```

### extensions.gtrgm_consistent
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_consistent(internal, text, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_consistent$function$

```

### extensions.gtrgm_distance
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_distance(internal, text, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_distance$function$

```

### extensions.gtrgm_compress
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_compress$function$

```

### extensions.gtrgm_decompress
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_decompress$function$

```

### extensions.gtrgm_penalty
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_penalty$function$

```

### extensions.gtrgm_picksplit
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_picksplit$function$

```

### extensions.gtrgm_union
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_union(internal, internal)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_union$function$

```

### extensions.gtrgm_same
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_same(gtrgm, gtrgm, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_same$function$

```

### extensions.gin_extract_value_trgm
```sql
CREATE OR REPLACE FUNCTION extensions.gin_extract_value_trgm(text, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$

```

### extensions.gin_extract_query_trgm
```sql
CREATE OR REPLACE FUNCTION extensions.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$

```

### extensions.gin_trgm_consistent
```sql
CREATE OR REPLACE FUNCTION extensions.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_consistent$function$

```

### extensions.gin_trgm_triconsistent
```sql
CREATE OR REPLACE FUNCTION extensions.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)
 RETURNS "char"
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_triconsistent$function$

```

### extensions.strict_word_similarity
```sql
CREATE OR REPLACE FUNCTION extensions.strict_word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity$function$

```

### extensions.strict_word_similarity_op
```sql
CREATE OR REPLACE FUNCTION extensions.strict_word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_op$function$

```

### extensions.strict_word_similarity_commutator_op
```sql
CREATE OR REPLACE FUNCTION extensions.strict_word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_commutator_op$function$

```

### extensions.strict_word_similarity_dist_op
```sql
CREATE OR REPLACE FUNCTION extensions.strict_word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_op$function$

```

### extensions.strict_word_similarity_dist_commutator_op
```sql
CREATE OR REPLACE FUNCTION extensions.strict_word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_commutator_op$function$

```

### extensions.gtrgm_options
```sql
CREATE OR REPLACE FUNCTION extensions.gtrgm_options(internal)
 RETURNS void
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE
AS '$libdir/pg_trgm', $function$gtrgm_options$function$

```

### public.sync_homework_due_dates_on_reschedule
```sql
CREATE OR REPLACE FUNCTION public.sync_homework_due_dates_on_reschedule()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only run if scheduled_at actually changed
  IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
    -- Only update homework that is EXPLICITLY linked to this booking via booking_id
    -- Homework with manually set due dates (booking_id IS NULL) will NOT be affected
    UPDATE homework_assignments
    SET
      due_date = NEW.scheduled_at,
      updated_at = NOW()
    WHERE
      booking_id = NEW.id  -- Must be linked to THIS specific booking
      AND status IN ('assigned', 'in_progress');  -- Only pending homework
  END IF;

  RETURN NEW;
END;
$function$

```

### public.increment_scenario_usage
```sql
CREATE OR REPLACE FUNCTION public.increment_scenario_usage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.scenario_id IS NOT NULL THEN
    UPDATE practice_scenarios
    SET times_used = COALESCE(times_used, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.scenario_id;
  END IF;
  RETURN NEW;
END;
$function$

```

### realtime.send
```sql
CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$function$

```

### public.update_learning_stats_on_homework
```sql
CREATE OR REPLACE FUNCTION public.update_learning_stats_on_homework()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle DELETE: decrement if deleted assignment was completed
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      UPDATE learning_stats
      SET homework_completed = GREATEST(COALESCE(homework_completed, 0) - 1, 0),
          updated_at = NOW()
      WHERE student_id = OLD.student_id
        AND tutor_id = OLD.tutor_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle INSERT/UPDATE to completed: increment
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO learning_stats (student_id, tutor_id, homework_completed, updated_at)
    VALUES (NEW.student_id, NEW.tutor_id, 1, NOW())
    ON CONFLICT (student_id, tutor_id) DO UPDATE SET
      homework_completed = COALESCE(learning_stats.homework_completed, 0) + 1,
      updated_at = NOW();
  -- Handle UPDATE from completed (reopened): decrement
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status IS DISTINCT FROM 'completed' THEN
    UPDATE learning_stats
    SET homework_completed = GREATEST(COALESCE(homework_completed, 0) - 1, 0),
        updated_at = NOW()
    WHERE student_id = OLD.student_id
      AND tutor_id = OLD.tutor_id;
  END IF;

  RETURN NEW;
END;
$function$

```

### public.update_practice_stats
```sql
CREATE OR REPLACE FUNCTION public.update_practice_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    -- Session just ended, update stats
    UPDATE learning_stats
    SET practice_sessions_completed = COALESCE(practice_sessions_completed, 0) + 1,
        practice_minutes = COALESCE(practice_minutes, 0) + COALESCE(NEW.duration_seconds, 0) / 60,
        practice_messages_sent = COALESCE(practice_messages_sent, 0) + COALESCE(NEW.message_count, 0),
        updated_at = NOW()
    WHERE student_id = NEW.student_id
      AND tutor_id = NEW.tutor_id;
  END IF;
  RETURN NEW;
END;
$function$

```

### public.update_assignment_on_session_end
```sql
CREATE OR REPLACE FUNCTION public.update_assignment_on_session_end()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL AND NEW.assignment_id IS NOT NULL THEN
    UPDATE practice_assignments
    SET sessions_completed = COALESCE(sessions_completed, 0) + 1,
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.assignment_id;
  END IF;
  RETURN NEW;
END;
$function$

```

### extensions.gen_salt
```sql
CREATE OR REPLACE FUNCTION extensions.gen_salt(text)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt$function$

```

### extensions.encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt$function$

```

### extensions.decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt$function$

```

### extensions.pg_stat_statements_info
```sql
CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)
 RETURNS record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$

```

### extensions.gen_salt
```sql
CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$

```

### public.log_tutor_status_change
```sql
CREATE OR REPLACE FUNCTION public.log_tutor_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    INSERT INTO public.tutor_status_history (
      profile_id,
      previous_status,
      new_status,
      reason,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.account_status,
      NEW.account_status,
      NEW.suspension_reason,
      NEW.suspended_by
    );
  END IF;
  RETURN NEW;
END;
$function$

```

### public.set_homework_assignments_updated_at
```sql
CREATE OR REPLACE FUNCTION public.set_homework_assignments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### extensions.pg_stat_statements_reset
```sql
CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false)
 RETURNS timestamp with time zone
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_11$function$

```

### pgbouncer.get_auth
```sql
CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)
 RETURNS TABLE(username text, password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $function$

```

### public.save_onboarding_step_3
```sql
CREATE OR REPLACE FUNCTION public.save_onboarding_step_3(p_user_id uuid, p_languages_taught text[], p_booking_currency text, p_service_name text DEFAULT NULL::text, p_service_duration integer DEFAULT NULL::integer, p_service_price integer DEFAULT NULL::integer, p_service_currency text DEFAULT NULL::text, p_offer_type text DEFAULT 'one_off'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_service_id uuid;
BEGIN
  -- Update profile with languages and currency
  UPDATE profiles
  SET
    languages_taught = p_languages_taught,
    booking_currency = UPPER(COALESCE(p_booking_currency, 'USD')),
    onboarding_step = 3
  WHERE id = p_user_id;

  -- Insert the service if provided
  IF p_service_name IS NOT NULL AND p_service_price IS NOT NULL THEN
    INSERT INTO services (
      tutor_id,
      name,
      duration_minutes,
      price_amount,
      price,
      price_currency,
      currency,
      is_active,
      offer_type
    )
    VALUES (
      p_user_id,
      p_service_name,
      COALESCE(p_service_duration, 60),
      p_service_price,
      p_service_price,
      UPPER(COALESCE(p_service_currency, 'USD')),
      UPPER(COALESCE(p_service_currency, 'USD')),
      true,
      COALESCE(p_offer_type, 'one_off')
    )
    RETURNING id INTO v_service_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'service_id', v_service_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service already exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$

```

### public.update_practice_timestamps
```sql
CREATE OR REPLACE FUNCTION public.update_practice_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.normalize_service_pricing
```sql
CREATE OR REPLACE FUNCTION public.normalize_service_pricing()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  resolved_price INTEGER;
  resolved_currency TEXT;
  profile_currency TEXT;
BEGIN
  SELECT booking_currency
    INTO profile_currency
    FROM public.profiles
    WHERE id = NEW.tutor_id;

  resolved_currency := UPPER(
    COALESCE(
      NULLIF(BTRIM(NEW.price_currency), ''),
      NULLIF(BTRIM(NEW.currency), ''),
      NULLIF(BTRIM(profile_currency), ''),
      'USD'
    )
  );

  resolved_price := CASE
    WHEN (NEW.price_amount IS NULL OR NEW.price_amount < 0)
      AND (NEW.price IS NULL OR NEW.price < 0) THEN 0
    WHEN NEW.price_amount IS NULL OR NEW.price_amount < 0 THEN NEW.price
    WHEN NEW.price IS NULL OR NEW.price < 0 THEN NEW.price_amount
    WHEN NEW.price_amount = NEW.price THEN NEW.price_amount
    WHEN NEW.price_amount = 0 AND NEW.price > 0 THEN NEW.price
    WHEN NEW.price = 0 AND NEW.price_amount > 0 THEN NEW.price_amount
    ELSE NEW.price_amount
  END;

  IF resolved_price IS NULL THEN
    resolved_price := 0;
  END IF;

  IF resolved_price < 0 THEN
    RAISE EXCEPTION 'Service price must be zero or greater';
  END IF;

  NEW.price_amount := resolved_price;
  NEW.price := resolved_price;
  NEW.price_currency := resolved_currency;
  NEW.currency := resolved_currency;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$function$

```

### public.ensure_default_onboarding_template
```sql
CREATE OR REPLACE FUNCTION public.ensure_default_onboarding_template(p_tutor_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id UUID;
  v_items JSONB;
BEGIN
  SELECT id INTO v_template_id
  FROM student_onboarding_templates
  WHERE tutor_id = p_tutor_id AND is_default = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    RETURN v_template_id;
  END IF;

  SELECT id INTO v_template_id
  FROM student_onboarding_templates
  WHERE tutor_id = p_tutor_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    UPDATE student_onboarding_templates
    SET is_default = true
    WHERE id = v_template_id;
    RETURN v_template_id;
  END IF;

  v_items := jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Welcome message sent',
      'description', 'Send a personalized welcome message to the student',
      'order', 0
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Learning goals discussed',
      'description', 'Understand what the student wants to achieve',
      'order', 1
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Proficiency level assessed',
      'description', 'Evaluate current language skills',
      'order', 2
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'Schedule first lesson',
      'description', 'Book the initial lesson',
      'order', 3
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'label', 'First lesson completed',
      'description', 'Complete the introductory lesson',
      'order', 4
    )
  );

  INSERT INTO student_onboarding_templates (tutor_id, name, is_default, items)
  VALUES (p_tutor_id, 'Default Onboarding', true, v_items)
  RETURNING id INTO v_template_id;

  RETURN v_template_id;
EXCEPTION WHEN unique_violation THEN
  SELECT id INTO v_template_id
  FROM student_onboarding_templates
  WHERE tutor_id = p_tutor_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    UPDATE student_onboarding_templates
    SET is_default = true
    WHERE id = v_template_id;
  END IF;

  RETURN v_template_id;
END;
$function$

```

### public.set_booking_planned_time
```sql
CREATE OR REPLACE FUNCTION public.set_booking_planned_time()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.planned_scheduled_at IS NULL THEN
    NEW.planned_scheduled_at := NEW.scheduled_at;
  END IF;
  RETURN NEW;
END;
$function$

```

### extensions.uuid_nil
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$

```

### extensions.uuid_ns_dns
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$

```

### extensions.uuid_ns_url
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$

```

### extensions.uuid_ns_oid
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$

```

### public.save_onboarding_step_4
```sql
CREATE OR REPLACE FUNCTION public.save_onboarding_step_4(p_user_id uuid, p_availability jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing availability for this tutor
  DELETE FROM availability WHERE tutor_id = p_user_id;

  -- Insert new availability slots from JSONB array
  IF p_availability IS NOT NULL AND jsonb_array_length(p_availability) > 0 THEN
    INSERT INTO availability (tutor_id, day_of_week, start_time, end_time)
    SELECT
      p_user_id,
      (slot->>'day_of_week')::integer,
      (slot->>'start_time')::time,
      (slot->>'end_time')::time
    FROM jsonb_array_elements(p_availability) AS slot;
  END IF;

  -- Update onboarding step on profile
  UPDATE profiles
  SET onboarding_step = 4
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$

```

### public.lesson_deliveries_apply_auto_complete
```sql
CREATE OR REPLACE FUNCTION public.lesson_deliveries_apply_auto_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  b RECORD;
BEGIN
  SELECT scheduled_at, planned_scheduled_at, duration_minutes
  INTO b
  FROM public.bookings
  WHERE id = NEW.booking_id;

  IF b.planned_scheduled_at IS NOT NULL
     AND b.scheduled_at = b.planned_scheduled_at
     AND (b.scheduled_at + (b.duration_minutes || ' minutes')::interval) <= NOW()
     AND NOT NEW.disputed
  THEN
     NEW.tutor_ack := TRUE;
     NEW.student_ack := TRUE;
     IF NEW.auto_completed_at IS NULL THEN
       NEW.auto_completed_at := NOW();
     END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$

```

### auth.uid
```sql
CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$

```

### auth.role
```sql
CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$

```

### auth.email
```sql
CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$

```

### public.update_ai_conversation_count
```sql
CREATE OR REPLACE FUNCTION public.update_ai_conversation_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.ai_conversations
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$

```

### extensions.uuid_ns_x500
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$

```

### extensions.uuid_generate_v1
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$

```

### public.increment_grammar_pattern
```sql
CREATE OR REPLACE FUNCTION public.increment_grammar_pattern(p_student_id uuid, p_tutor_id uuid, p_category_slug text, p_language text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO student_grammar_patterns (
    student_id, tutor_id, category_slug, language,
    error_count, first_error_at, last_error_at, updated_at
  )
  VALUES (
    p_student_id, p_tutor_id, p_category_slug, p_language,
    1, NOW(), NOW(), NOW()
  )
  ON CONFLICT (student_id, tutor_id, category_slug, language)
  DO UPDATE SET
    error_count = student_grammar_patterns.error_count + 1,
    last_error_at = NOW(),
    updated_at = NOW();
END;
$function$

```

### public.queue_student_engagement_refresh
```sql
CREATE OR REPLACE FUNCTION public.queue_student_engagement_refresh(p_student_id uuid, p_tutor_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO student_engagement_score_queue (student_id, tutor_id, reason, queued_at)
  VALUES (p_student_id, p_tutor_id, p_reason, NOW())
  ON CONFLICT (student_id, tutor_id) DO UPDATE
  SET queued_at = EXCLUDED.queued_at,
      reason = EXCLUDED.reason;
END;
$function$

```

### public.update_blocked_times_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_blocked_times_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$

```

### public.cleanup_old_analytics
```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics(retention_days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

  WITH deleted AS (
    DELETE FROM public.page_views
    WHERE created_at < cutoff_date
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  WITH deleted AS (
    DELETE FROM public.link_events
    WHERE clicked_at < cutoff_date
    RETURNING 1
  )
  SELECT deleted_count + COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$function$

```

### public.cleanup_old_system_metrics
```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_system_metrics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.system_metrics WHERE recorded_at < NOW() - INTERVAL '7 days';
  DELETE FROM public.system_error_log WHERE created_at < NOW() - INTERVAL '30 days' AND resolved_at IS NOT NULL;
END;
$function$

```

### public.update_system_status_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_system_status_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.get_public_profiles
```sql
CREATE OR REPLACE FUNCTION public.get_public_profiles()
 RETURNS TABLE(id uuid, username text, full_name text, avatar_url text, bio text, tagline text, timezone text, languages_taught text[], booking_currency text, created_at timestamp with time zone, role text, website_url text, instagram_handle text, tiktok_handle text, facebook_handle text, x_handle text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.tagline,
    p.timezone,
    p.languages_taught,
    p.booking_currency,
    p.created_at,
    p.role,
    p.website_url,
    p.instagram_handle,
    p.tiktok_handle,
    p.facebook_handle,
    p.x_handle
  FROM profiles p
  WHERE p.role = 'tutor';
$function$

```

### public.refresh_practice_summary
```sql
CREATE OR REPLACE FUNCTION public.refresh_practice_summary(p_student_id uuid, p_tutor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_total_sessions INTEGER;
  v_completed_sessions INTEGER;
  v_total_messages INTEGER;
  v_total_minutes INTEGER;
  v_total_grammar_errors INTEGER;
  v_total_phonetic_errors INTEGER;
  v_avg_rating NUMERIC;
  v_last_practice TIMESTAMPTZ;
  v_top_issues JSONB;
  v_weekly_activity JSONB;
BEGIN
  -- Get session stats
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE ended_at IS NOT NULL),
    COALESCE(SUM(message_count), 0),
    COALESCE(SUM(duration_seconds) / 60, 0),
    COALESCE(AVG((ai_feedback->>'overall_rating')::NUMERIC), 0),
    MAX(started_at)
  INTO
    v_total_sessions,
    v_completed_sessions,
    v_total_messages,
    v_total_minutes,
    v_avg_rating,
    v_last_practice
  FROM student_practice_sessions
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  -- Get grammar error count
  SELECT COUNT(*)
  INTO v_total_grammar_errors
  FROM grammar_errors
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  -- Get phonetic error count
  SELECT COUNT(*)
  INTO v_total_phonetic_errors
  FROM phonetic_errors
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  -- Get top grammar issues
  SELECT COALESCE(jsonb_agg(issue), '[]'::jsonb)
  INTO v_top_issues
  FROM (
    SELECT jsonb_build_object(
      'category_slug', sgp.category_slug,
      'label', gec.label,
      'count', sgp.error_count,
      'trend', sgp.trend
    ) as issue
    FROM student_grammar_patterns sgp
    JOIN grammar_error_categories gec ON gec.slug = sgp.category_slug
    WHERE sgp.student_id = p_student_id AND sgp.tutor_id = p_tutor_id
    ORDER BY sgp.error_count DESC
    LIMIT 5
  ) top_issues;

  -- Get weekly activity (last 8 weeks)
  SELECT COALESCE(jsonb_agg(week_data ORDER BY week_start), '[]'::jsonb)
  INTO v_weekly_activity
  FROM (
    SELECT
      date_trunc('week', started_at) as week_start,
      jsonb_build_object(
        'week', to_char(date_trunc('week', started_at), 'YYYY-MM-DD'),
        'sessions', COUNT(*),
        'minutes', COALESCE(SUM(duration_seconds) / 60, 0),
        'errors', COALESCE(SUM(grammar_errors_count), 0)
      ) as week_data
    FROM student_practice_sessions
    WHERE student_id = p_student_id
      AND tutor_id = p_tutor_id
      AND started_at >= NOW() - INTERVAL '8 weeks'
    GROUP BY date_trunc('week', started_at)
  ) weeks;

  -- Upsert summary
  INSERT INTO student_practice_summaries (
    student_id, tutor_id,
    total_sessions, completed_sessions, total_messages_sent, total_practice_minutes,
    total_grammar_errors, top_grammar_issues,
    total_phonetic_errors,
    avg_session_rating, last_practice_at,
    weekly_activity, updated_at
  )
  VALUES (
    p_student_id, p_tutor_id,
    v_total_sessions, v_completed_sessions, v_total_messages, v_total_minutes,
    v_total_grammar_errors, v_top_issues,
    v_total_phonetic_errors,
    v_avg_rating, v_last_practice,
    v_weekly_activity, NOW()
  )
  ON CONFLICT (student_id, tutor_id)
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    completed_sessions = EXCLUDED.completed_sessions,
    total_messages_sent = EXCLUDED.total_messages_sent,
    total_practice_minutes = EXCLUDED.total_practice_minutes,
    total_grammar_errors = EXCLUDED.total_grammar_errors,
    top_grammar_issues = EXCLUDED.top_grammar_issues,
    total_phonetic_errors = EXCLUDED.total_phonetic_errors,
    avg_session_rating = EXCLUDED.avg_session_rating,
    last_practice_at = EXCLUDED.last_practice_at,
    weekly_activity = EXCLUDED.weekly_activity,
    updated_at = NOW();
END;
$function$

```

### public.get_or_create_free_usage_period
```sql
CREATE OR REPLACE FUNCTION public.get_or_create_free_usage_period(p_student_id uuid, p_tutor_id uuid)
 RETURNS practice_usage_periods
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Monthly periods aligned to 1st of month
  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + interval '1 month';

  -- Try to find existing period for this month
  SELECT * INTO v_period FROM practice_usage_periods
  WHERE student_id = p_student_id
    AND period_start = v_period_start
  LIMIT 1;

  -- If no period exists, create one with free tier allowances
  IF v_period IS NULL THEN
    INSERT INTO practice_usage_periods (
      id,
      student_id,
      tutor_id,
      period_start,
      period_end,
      audio_seconds_used,
      text_turns_used,
      blocks_consumed,
      current_tier_price_cents,
      is_free_tier,
      free_audio_seconds,
      free_text_turns,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_student_id,
      p_tutor_id,
      v_period_start,
      v_period_end,
      0,
      0,
      0,
      0,  -- Free tier has no base price
      true,
      2700,  -- 45 min audio
      600,   -- 600 text turns
      now(),
      now()
    ) RETURNING * INTO v_period;
  END IF;

  RETURN v_period;
END;
$function$

```

### public.get_dashboard_summary
```sql
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_tutor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_profile jsonb;
  v_upcoming_bookings jsonb;
  v_total_bookings bigint;
  v_student_count bigint;
  v_revenue_this_month bigint;
  v_now timestamp with time zone := now();
  v_month_start timestamp with time zone;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_tutor_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another tutor''s dashboard';
  END IF;

  v_month_start := date_trunc('month', v_now);

  SELECT jsonb_build_object(
    'username', p.username,
    'bio', p.bio,
    'tagline', p.tagline,
    'full_name', p.full_name,
    'plan', p.plan,
    'email', p.email,
    'created_at', p.created_at,
    'booking_currency', p.booking_currency
  ) INTO v_profile
  FROM profiles p
  WHERE p.id = p_tutor_id;

  SELECT COALESCE(jsonb_agg(booking_data ORDER BY scheduled_at ASC), '[]'::jsonb)
  INTO v_upcoming_bookings
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'scheduled_at', b.scheduled_at,
      'status', b.status,
      'payment_status', b.payment_status,
      'payment_amount', b.payment_amount,
      'currency', b.currency,
      'meeting_url', b.meeting_url,
      'meeting_provider', b.meeting_provider,
      'short_code', b.short_code,
      'student', jsonb_build_object(
        'full_name', s.full_name,
        'proficiency_level', s.proficiency_level
      ),
      'service', jsonb_build_object(
        'name', srv.name
      )
    ) AS booking_data,
    b.scheduled_at
    FROM bookings b
    LEFT JOIN students s ON s.id = b.student_id
    LEFT JOIN services srv ON srv.id = b.service_id
    WHERE b.tutor_id = p_tutor_id
      AND b.scheduled_at >= v_now
    ORDER BY b.scheduled_at ASC
    LIMIT 3
  ) upcoming;

  SELECT COUNT(*)
  INTO v_total_bookings
  FROM bookings
  WHERE tutor_id = p_tutor_id;

  SELECT COUNT(*)
  INTO v_student_count
  FROM students
  WHERE tutor_id = p_tutor_id;

  SELECT COALESCE(SUM(total_due_cents), 0)
  INTO v_revenue_this_month
  FROM invoices
  WHERE tutor_id = p_tutor_id
    AND status = 'paid'
    AND due_date >= v_month_start
    AND due_date < v_month_start + interval '1 month';

  result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'upcoming_bookings', v_upcoming_bookings,
    'total_bookings', COALESCE(v_total_bookings, 0),
    'student_count', COALESCE(v_student_count, 0),
    'revenue_this_month_cents', COALESCE(v_revenue_this_month, 0),
    'is_first_visit', COALESCE(v_total_bookings, 0) = 0
  );

  RETURN result;
END;
$function$

```

### public.increment_text_turn_freemium
```sql
CREATE OR REPLACE FUNCTION public.increment_text_turn_freemium(p_usage_period_id uuid, p_allow_block_overage boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_allowance INTEGER;
  v_needs_block BOOLEAN;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PERIOD_NOT_FOUND');
  END IF;

  -- Calculate total allowance: free tier + (blocks x 300)
  v_allowance := COALESCE(v_period.free_text_turns, 600) + (v_period.blocks_consumed * 300);

  -- Check if at or over limit
  v_needs_block := v_period.text_turns_used >= v_allowance;

  -- If over limit and not allowed to charge blocks, return error
  IF v_needs_block AND NOT p_allow_block_overage THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BLOCK_REQUIRED',
      'needs_block', true,
      'text_turns_used', v_period.text_turns_used,
      'text_turns_allowance', v_allowance,
      'blocks_consumed', v_period.blocks_consumed
    );
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET text_turns_used = text_turns_used + 1,
      updated_at = now()
  WHERE id = p_usage_period_id;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'text_turns_used', v_period.text_turns_used + 1,
    'text_turns_allowance', v_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$function$

```

### public.increment_audio_seconds_freemium
```sql
CREATE OR REPLACE FUNCTION public.increment_audio_seconds_freemium(p_usage_period_id uuid, p_seconds integer, p_allow_block_overage boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_allowance INTEGER;
  v_projected INTEGER;
  v_needs_block BOOLEAN;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_period
  FROM practice_usage_periods
  WHERE id = p_usage_period_id
  FOR UPDATE;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PERIOD_NOT_FOUND');
  END IF;

  -- Calculate total allowance: free tier + (blocks x 2700)
  v_allowance := COALESCE(v_period.free_audio_seconds, 2700) + (v_period.blocks_consumed * 2700);

  -- Calculate projected usage after this increment
  v_projected := v_period.audio_seconds_used + p_seconds;

  -- Check if would exceed limit
  v_needs_block := v_projected > v_allowance;

  -- If would exceed and not allowed to charge blocks, return error
  IF v_needs_block AND NOT p_allow_block_overage THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BLOCK_REQUIRED',
      'needs_block', true,
      'audio_seconds_used', v_period.audio_seconds_used,
      'audio_seconds_allowance', v_allowance,
      'blocks_consumed', v_period.blocks_consumed
    );
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET audio_seconds_used = audio_seconds_used + p_seconds,
      updated_at = now()
  WHERE id = p_usage_period_id;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'audio_seconds_used', v_period.audio_seconds_used + p_seconds,
    'audio_seconds_allowance', v_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$function$

```

### public.get_practice_allowance
```sql
CREATE OR REPLACE FUNCTION public.get_practice_allowance(p_usage_period_id uuid)
 RETURNS TABLE(audio_seconds_allowance integer, text_turns_allowance integer, audio_seconds_used integer, text_turns_used integer, audio_seconds_remaining integer, text_turns_remaining integer, blocks_consumed integer, is_free_tier boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_block_audio_seconds INTEGER := 2700;  -- 45 min per block
  v_block_text_turns INTEGER := 300;      -- 300 text per block
BEGIN
  SELECT * INTO v_period FROM practice_usage_periods WHERE id = p_usage_period_id;

  IF v_period IS NULL THEN
    RETURN;
  END IF;

  audio_seconds_allowance := v_period.free_audio_seconds + (v_period.blocks_consumed * v_block_audio_seconds);
  text_turns_allowance := v_period.free_text_turns + (v_period.blocks_consumed * v_block_text_turns);
  audio_seconds_used := v_period.audio_seconds_used;
  text_turns_used := v_period.text_turns_used;
  audio_seconds_remaining := GREATEST(0, audio_seconds_allowance - audio_seconds_used);
  text_turns_remaining := GREATEST(0, text_turns_allowance - text_turns_used);
  blocks_consumed := v_period.blocks_consumed;
  is_free_tier := v_period.is_free_tier;

  RETURN NEXT;
END;
$function$

```

### extensions.uuid_generate_v1mc
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$

```

### extensions.uuid_generate_v3
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$

```

### extensions.uuid_generate_v4
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$

```

### extensions.uuid_generate_v5
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$

```

### extensions.digest
```sql
CREATE OR REPLACE FUNCTION extensions.digest(text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$

```

### extensions.digest
```sql
CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$

```

### extensions.hmac
```sql
CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$

```

### extensions.hmac
```sql
CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$

```

### extensions.crypt
```sql
CREATE OR REPLACE FUNCTION extensions.crypt(text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_crypt$function$

```

### extensions.encrypt_iv
```sql
CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$

```

### extensions.decrypt_iv
```sql
CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$

```

### public.save_availability
```sql
CREATE OR REPLACE FUNCTION public.save_availability(p_user_id uuid, p_availability jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Replace availability in a single transaction
  DELETE FROM availability WHERE tutor_id = p_user_id;

  IF p_availability IS NOT NULL AND jsonb_array_length(p_availability) > 0 THEN
    INSERT INTO availability (tutor_id, day_of_week, start_time, end_time, is_available)
    SELECT
      p_user_id,
      (slot->>'day_of_week')::integer,
      (slot->>'start_time')::text,
      (slot->>'end_time')::text,
      COALESCE((slot->>'is_available')::boolean, TRUE)
    FROM jsonb_array_elements(p_availability) AS slot;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$

```

### public.update_student_preferences_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_student_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.ensure_student_preferences
```sql
CREATE OR REPLACE FUNCTION public.ensure_student_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.student_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$

```

### public.check_practice_allowance
```sql
CREATE OR REPLACE FUNCTION public.check_practice_allowance(p_usage_period_id uuid, p_resource_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_allowance RECORD;
  v_has_allowance BOOLEAN;
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  IF v_allowance IS NULL THEN
    RETURN jsonb_build_object(
      'has_allowance', false,
      'error', 'Usage period not found'
    );
  END IF;

  IF p_resource_type = 'audio' THEN
    v_has_allowance := v_allowance.audio_seconds_remaining > 0;
    v_used := v_allowance.audio_seconds_used;
    v_limit := v_allowance.audio_seconds_allowance;
  ELSE
    v_has_allowance := v_allowance.text_turns_remaining > 0;
    v_used := v_allowance.text_turns_used;
    v_limit := v_allowance.text_turns_allowance;
  END IF;

  RETURN jsonb_build_object(
    'has_allowance', v_has_allowance,
    'used', v_used,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_used),
    'blocks_consumed', v_allowance.blocks_consumed,
    'is_free_tier', v_allowance.is_free_tier
  );
END;
$function$

```

### public.consume_rate_limit
```sql
CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
 RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  window_start TIMESTAMPTZ := NOW() - make_interval(secs => p_window_seconds);
  current_count INTEGER;
  last_event TIMESTAMPTZ;
BEGIN
  IF p_limit <= 0 OR p_window_seconds <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, NOW();
    RETURN;
  END IF;

  SELECT count(*), max(created_at)
  INTO current_count, last_event
  FROM rate_limit_events
  WHERE key = p_key
    AND created_at >= window_start;

  IF current_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, GREATEST(p_limit - current_count, 0), last_event + make_interval(secs => p_window_seconds);
    RETURN;
  END IF;

  INSERT INTO rate_limit_events(key) VALUES (p_key);

  RETURN QUERY SELECT TRUE, p_limit - current_count - 1, NOW() + make_interval(secs => p_window_seconds);
END;
$function$

```

### public.process_engagement_score_queue
```sql
CREATE OR REPLACE FUNCTION public.process_engagement_score_queue(p_limit integer DEFAULT 100)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  processed INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, student_id, tutor_id
    FROM student_engagement_score_queue
    ORDER BY queued_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM upsert_student_engagement_score(r.student_id, r.tutor_id);
    DELETE FROM student_engagement_score_queue WHERE id = r.id;
    processed := processed + 1;
  END LOOP;

  RETURN processed;
END;
$function$

```

### public.refresh_engagement_on_booking_change
```sql
CREATE OR REPLACE FUNCTION public.refresh_engagement_on_booking_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'booking_completed');
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
      AND (NEW.status = 'completed' OR OLD.status = 'completed') THEN
      PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'booking_status_change');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$

```

### public.refresh_engagement_on_homework_change
```sql
CREATE OR REPLACE FUNCTION public.refresh_engagement_on_homework_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'homework_change');
  RETURN NEW;
END;
$function$

```

### public.refresh_engagement_on_practice_session
```sql
CREATE OR REPLACE FUNCTION public.refresh_engagement_on_practice_session()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM queue_student_engagement_refresh(NEW.student_id, NEW.tutor_id, 'practice_session');

  UPDATE students
  SET last_activity_at = COALESCE(NEW.ended_at, NEW.started_at, NOW())
  WHERE id = NEW.student_id AND tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$function$

```

### graphql.increment_schema_version
```sql
CREATE OR REPLACE FUNCTION graphql.increment_schema_version()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    perform pg_catalog.nextval('graphql.seq_schema_version');
end;
$function$

```

### vault._crypto_aead_det_noncegen
```sql
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_noncegen()
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_noncegen$function$

```

### extensions.pg_stat_statements
```sql
CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone)
 RETURNS SETOF record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_11$function$

```

### extensions.pgrst_drop_watch
```sql
CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$

```

### graphql.get_schema_version
```sql
CREATE OR REPLACE FUNCTION graphql.get_schema_version()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    select last_value from graphql.seq_schema_version;
$function$

```

### graphql._internal_resolve
```sql
CREATE OR REPLACE FUNCTION graphql._internal_resolve(query text, variables jsonb DEFAULT '{}'::jsonb, "operationName" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE c
AS '$libdir/pg_graphql', $function$resolve_wrapper$function$

```

### graphql.resolve
```sql
CREATE OR REPLACE FUNCTION graphql.resolve(query text, variables jsonb DEFAULT '{}'::jsonb, "operationName" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
    res jsonb;
    message_text text;
begin
  begin
    select graphql._internal_resolve("query" := "query",
                                     "variables" := "variables",
                                     "operationName" := "operationName",
                                     "extensions" := "extensions") into res;
    return res;
  exception
    when others then
    get stacked diagnostics message_text = message_text;
    return
    jsonb_build_object('data', null,
                       'errors', jsonb_build_array(jsonb_build_object('message', message_text)));
  end;
end;
$function$

```

### storage.update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$function$

```

### storage.can_insert_object
```sql
CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$function$

```

### storage.list_objects_with_delimiter
```sql
CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text)
 RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$function$

```

### public.get_subscription_balance
```sql
CREATE OR REPLACE FUNCTION public.get_subscription_balance(p_subscription_id uuid)
 RETURNS TABLE(total_available integer, lessons_allocated integer, lessons_rolled_over integer, lessons_used integer, period_ends_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    GREATEST(0, (lap.lessons_allocated + lap.lessons_rolled_over - lap.lessons_used))::INTEGER as total_available,
    lap.lessons_allocated,
    lap.lessons_rolled_over,
    lap.lessons_used,
    lap.period_end as period_ends_at
  FROM lesson_allowance_periods lap
  WHERE lap.subscription_id = p_subscription_id
    AND lap.is_current = TRUE;
END;
$function$

```

### extensions.pgrst_ddl_watch
```sql
CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$

```

### public.process_subscription_rollover
```sql
CREATE OR REPLACE FUNCTION public.process_subscription_rollover(p_subscription_id uuid, p_new_period_start timestamp with time zone, p_new_period_end timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_old_period lesson_allowance_periods%ROWTYPE;
  v_template lesson_subscription_templates%ROWTYPE;
  v_subscription lesson_subscriptions%ROWTYPE;
  v_unused_lessons INTEGER;
  v_rollover_lessons INTEGER;
  v_max_rollover INTEGER;
  v_new_period_id UUID;
BEGIN
  -- Get subscription and template
  SELECT * INTO v_subscription FROM lesson_subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  SELECT * INTO v_template FROM lesson_subscription_templates WHERE id = v_subscription.template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found for subscription: %', p_subscription_id;
  END IF;

  -- Get current period (about to end)
  SELECT * INTO v_old_period
  FROM lesson_allowance_periods
  WHERE subscription_id = p_subscription_id AND is_current = TRUE;

  -- Calculate unused lessons from old period
  IF v_old_period.id IS NOT NULL THEN
    v_unused_lessons := GREATEST(0,
      v_old_period.lessons_allocated + v_old_period.lessons_rolled_over - v_old_period.lessons_used
    );
  ELSE
    v_unused_lessons := 0;
  END IF;

  -- Apply rollover cap (soft cap = 1 month's allocation)
  v_max_rollover := COALESCE(v_template.max_rollover_lessons, v_template.lessons_per_month);
  v_rollover_lessons := LEAST(v_unused_lessons, v_max_rollover);

  -- Finalize old period
  IF v_old_period.id IS NOT NULL THEN
    UPDATE lesson_allowance_periods
    SET is_current = FALSE, finalized_at = NOW(), updated_at = NOW()
    WHERE id = v_old_period.id;
  END IF;

  -- Create new period
  INSERT INTO lesson_allowance_periods (
    subscription_id,
    period_start,
    period_end,
    lessons_allocated,
    lessons_rolled_over,
    lessons_used,
    is_current
  ) VALUES (
    p_subscription_id,
    p_new_period_start,
    p_new_period_end,
    v_template.lessons_per_month,
    v_rollover_lessons,
    0,
    TRUE
  ) RETURNING id INTO v_new_period_id;

  -- Update subscription period dates
  UPDATE lesson_subscriptions
  SET current_period_start = p_new_period_start,
      current_period_end = p_new_period_end,
      updated_at = NOW()
  WHERE id = p_subscription_id;

  RETURN v_new_period_id;
END;
$function$

```

### public.redeem_subscription_lesson
```sql
CREATE OR REPLACE FUNCTION public.redeem_subscription_lesson(p_subscription_id uuid, p_booking_id uuid, p_lessons_count integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period lesson_allowance_periods%ROWTYPE;
  v_available INTEGER;
BEGIN
  -- Get current period
  SELECT * INTO v_period
  FROM lesson_allowance_periods
  WHERE subscription_id = p_subscription_id AND is_current = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No current period found for subscription: %', p_subscription_id;
  END IF;

  -- Check available lessons
  v_available := v_period.lessons_allocated + v_period.lessons_rolled_over - v_period.lessons_used;
  IF v_available < p_lessons_count THEN
    RAISE EXCEPTION 'Insufficient lesson credits. Available: %, Requested: %', v_available, p_lessons_count;
  END IF;

  -- Create redemption record
  INSERT INTO lesson_subscription_redemptions (period_id, booking_id, lessons_redeemed)
  VALUES (v_period.id, p_booking_id, p_lessons_count);

  -- Update lessons_used
  UPDATE lesson_allowance_periods
  SET lessons_used = lessons_used + p_lessons_count, updated_at = NOW()
  WHERE id = v_period.id;

  RETURN TRUE;
END;
$function$

```

### public.refund_subscription_lesson
```sql
CREATE OR REPLACE FUNCTION public.refund_subscription_lesson(p_booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_redemption lesson_subscription_redemptions%ROWTYPE;
  v_period lesson_allowance_periods%ROWTYPE;
BEGIN
  -- Get redemption record
  SELECT * INTO v_redemption
  FROM lesson_subscription_redemptions
  WHERE booking_id = p_booking_id AND refunded_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    -- No redemption to refund (booking wasn't from subscription)
    RETURN FALSE;
  END IF;

  -- Get the period
  SELECT * INTO v_period
  FROM lesson_allowance_periods
  WHERE id = v_redemption.period_id;

  -- Only refund if period is still current
  IF v_period.is_current THEN
    -- Restore credit
    UPDATE lesson_allowance_periods
    SET lessons_used = GREATEST(0, lessons_used - v_redemption.lessons_redeemed),
        updated_at = NOW()
    WHERE id = v_period.id;
  END IF;

  -- Mark redemption as refunded (regardless of period status for audit)
  UPDATE lesson_subscription_redemptions
  SET refunded_at = NOW()
  WHERE id = v_redemption.id;

  RETURN TRUE;
END;
$function$

```

### public.update_lesson_subscription_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_lesson_subscription_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.refresh_all_engagement_scores
```sql
CREATE OR REPLACE FUNCTION public.refresh_all_engagement_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, tutor_id
    FROM students
    WHERE status IN ('active', 'trial')
  LOOP
    PERFORM upsert_student_engagement_score(r.id, r.tutor_id);
  END LOOP;
END;
$function$

```

### extensions.grant_pg_graphql_access
```sql
CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$function$

```

### public.compute_student_engagement_score
```sql
CREATE OR REPLACE FUNCTION public.compute_student_engagement_score(p_student_id uuid, p_tutor_id uuid)
 RETURNS TABLE(score integer, lesson_frequency_score integer, response_rate_score integer, homework_completion_score integer, practice_engagement_score integer, days_since_last_lesson integer, days_since_last_message integer, risk_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_last_lesson TIMESTAMPTZ;
  v_last_message TIMESTAMPTZ;
  v_days_since_lesson INTEGER;
  v_days_since_message INTEGER;
  v_lesson_score INTEGER;
  v_response_score INTEGER;
  v_homework_score INTEGER;
  v_practice_score INTEGER;
  v_total_score INTEGER;
  v_risk TEXT;
  v_homework_assigned INTEGER;
  v_homework_completed INTEGER;
  v_practice_sessions INTEGER;
BEGIN
  -- Get last completed lesson date
  SELECT MAX(scheduled_at) INTO v_last_lesson
  FROM bookings
  WHERE student_id = p_student_id
    AND tutor_id = p_tutor_id
    AND status = 'completed';

  -- Get last message date (from either party)
  SELECT MAX(cm.created_at) INTO v_last_message
  FROM conversation_messages cm
  JOIN conversation_threads ct ON cm.thread_id = ct.id
  WHERE ct.student_id = p_student_id
    AND ct.tutor_id = p_tutor_id;

  -- Calculate days since last activity
  v_days_since_lesson := COALESCE(EXTRACT(DAY FROM NOW() - v_last_lesson)::INTEGER, 365);
  v_days_since_message := COALESCE(EXTRACT(DAY FROM NOW() - v_last_message)::INTEGER, 365);

  -- Lesson frequency score: 100 if within 14 days, decreases by 3 per day after
  v_lesson_score := GREATEST(0, 100 - (GREATEST(0, v_days_since_lesson - 14) * 3));

  -- Response rate score: 100 if within 7 days, decreases by 5 per day after
  v_response_score := GREATEST(0, 100 - (GREATEST(0, v_days_since_message - 7) * 5));

  -- Homework completion score: % of assigned homework completed
  SELECT COUNT(*) INTO v_homework_assigned
  FROM homework_assignments
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  SELECT COUNT(*) INTO v_homework_completed
  FROM homework_assignments
  WHERE student_id = p_student_id
    AND tutor_id = p_tutor_id
    AND status IN ('completed', 'submitted');

  IF v_homework_assigned > 0 THEN
    v_homework_score := (v_homework_completed::FLOAT / v_homework_assigned * 100)::INTEGER;
  ELSE
    v_homework_score := 100; -- No homework assigned = neutral score
  END IF;

  -- Practice engagement score: Based on sessions in last 30 days
  SELECT COUNT(*) INTO v_practice_sessions
  FROM student_practice_sessions
  WHERE student_id = p_student_id
    AND tutor_id = p_tutor_id
    AND started_at > NOW() - INTERVAL '30 days';

  v_practice_score := LEAST(100, v_practice_sessions * 20); -- 5 sessions = 100%

  -- Calculate total score (weighted average)
  -- Weights: Lesson 40%, Response 25%, Homework 20%, Practice 15%
  v_total_score := (
    v_lesson_score * 40 +
    v_response_score * 25 +
    v_homework_score * 20 +
    v_practice_score * 15
  ) / 100;

  -- Determine risk status based on score
  IF v_total_score >= 70 THEN
    v_risk := 'healthy';
  ELSIF v_total_score >= 40 THEN
    v_risk := 'at_risk';
  ELSIF v_total_score >= 20 THEN
    v_risk := 'critical';
  ELSE
    v_risk := 'churned';
  END IF;

  RETURN QUERY SELECT
    v_total_score,
    v_lesson_score,
    v_response_score,
    v_homework_score,
    v_practice_score,
    v_days_since_lesson,
    v_days_since_message,
    v_risk;
END;
$function$

```

### public.ensure_single_default_template
```sql
CREATE OR REPLACE FUNCTION public.ensure_single_default_template()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE student_onboarding_templates
    SET is_default = false
    WHERE tutor_id = NEW.tutor_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$function$

```

### public.log_booking_reschedule
```sql
CREATE OR REPLACE FUNCTION public.log_booking_reschedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
    IF NEW.original_scheduled_at IS NULL THEN
      NEW.original_scheduled_at := OLD.scheduled_at;
    END IF;

    NEW.reschedule_count := COALESCE(OLD.reschedule_count, 0) + 1;

    INSERT INTO public.booking_reschedule_history (
      booking_id,
      tutor_id,
      student_id,
      previous_scheduled_at,
      new_scheduled_at,
      requested_by,
      reason
    ) VALUES (
      NEW.id,
      NEW.tutor_id,
      NEW.student_id,
      OLD.scheduled_at,
      NEW.scheduled_at,
      COALESCE(NEW.reschedule_requested_by, 'tutor'),
      NEW.reschedule_reason
    );

    NEW.reschedule_requested_at := NULL;
    NEW.reschedule_requested_by := NULL;
    NEW.reschedule_reason := NULL;
  END IF;

  RETURN NEW;
END;
$function$

```

### public.increment_text_turn_freemium
```sql
CREATE OR REPLACE FUNCTION public.increment_text_turn_freemium(p_usage_period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_allowance RECORD;
  v_needs_block BOOLEAN := false;
BEGIN
  -- Get current period
  SELECT * INTO v_period FROM practice_usage_periods WHERE id = p_usage_period_id;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Calculate current allowance
  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  -- Check if we need a block (at or over limit)
  IF v_period.text_turns_used >= v_allowance.text_turns_allowance THEN
    v_needs_block := true;
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET
    text_turns_used = text_turns_used + 1,
    updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'text_turns_used', v_period.text_turns_used,
    'text_turns_allowance', v_allowance.text_turns_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$function$

```

### public.create_booking_atomic
```sql
CREATE OR REPLACE FUNCTION public.create_booking_atomic(p_tutor_id uuid, p_student_id uuid, p_service_id uuid, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_timezone text, p_status text, p_payment_status text, p_payment_amount integer, p_currency text, p_student_notes text)
 RETURNS TABLE(id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start timestamptz := p_scheduled_at;
  v_end timestamptz := p_scheduled_at + (p_duration_minutes || ' minutes')::interval;
BEGIN
  -- Serialize booking creation per tutor to avoid race conditions
  IF NOT pg_try_advisory_xact_lock(hashtext(p_tutor_id::text)) THEN
    RAISE EXCEPTION USING errcode = '55P03', message = 'Could not acquire booking lock for tutor';
  END IF;

  -- Reject if overlapping active booking already exists
  PERFORM 1
  FROM public.bookings b
  WHERE b.tutor_id = p_tutor_id
    AND b.status IN ('pending', 'confirmed')
    AND booking_time_range(b.scheduled_at, b.duration_minutes) &&
        booking_time_range(p_scheduled_at, p_duration_minutes)
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'Time slot conflict for tutor';
  END IF;

  -- Reject if blocked time overlaps
  PERFORM 1
  FROM public.blocked_times bt
  WHERE bt.tutor_id = p_tutor_id
    AND bt.start_time < v_end
    AND bt.end_time > v_start
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0002', message = 'Time slot is blocked for tutor';
  END IF;

  RETURN QUERY
  INSERT INTO public.bookings (
    tutor_id,
    student_id,
    service_id,
    scheduled_at,
    duration_minutes,
    timezone,
    status,
    payment_status,
    payment_amount,
    currency,
    student_notes
  )
  VALUES (
    p_tutor_id,
    p_student_id,
    p_service_id,
    p_scheduled_at,
    p_duration_minutes,
    p_timezone,
    p_status,
    p_payment_status,
    p_payment_amount,
    p_currency,
    p_student_notes
  )
  RETURNING bookings.id AS id, bookings.created_at AS created_at;
END;
$function$

```

### public.increment_audio_seconds_freemium
```sql
CREATE OR REPLACE FUNCTION public.increment_audio_seconds_freemium(p_usage_period_id uuid, p_seconds integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_allowance RECORD;
  v_needs_block BOOLEAN := false;
BEGIN
  -- Get current period
  SELECT * INTO v_period FROM practice_usage_periods WHERE id = p_usage_period_id;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Calculate current allowance
  SELECT * INTO v_allowance FROM get_practice_allowance(p_usage_period_id);

  -- Check if we need a block (would exceed limit)
  IF (v_period.audio_seconds_used + p_seconds) > v_allowance.audio_seconds_allowance THEN
    v_needs_block := true;
  END IF;

  -- Increment usage
  UPDATE practice_usage_periods
  SET
    audio_seconds_used = audio_seconds_used + p_seconds,
    updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  RETURN jsonb_build_object(
    'success', true,
    'needs_block', v_needs_block,
    'audio_seconds_used', v_period.audio_seconds_used,
    'audio_seconds_allowance', v_allowance.audio_seconds_allowance,
    'blocks_consumed', v_period.blocks_consumed
  );
END;
$function$

```

### public.sync_calendar_token_expiry
```sql
CREATE OR REPLACE FUNCTION public.sync_calendar_token_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.token_expires_at IS NULL AND NEW.access_token_expires_at IS NOT NULL THEN
    NEW.token_expires_at := NEW.access_token_expires_at;
  ELSIF NEW.access_token_expires_at IS NULL AND NEW.token_expires_at IS NOT NULL THEN
    NEW.access_token_expires_at := NEW.token_expires_at;
  END IF;
  RETURN NEW;
END;
$function$

```

### public.record_block_purchase
```sql
CREATE OR REPLACE FUNCTION public.record_block_purchase(p_usage_period_id uuid, p_trigger_type text, p_stripe_usage_record_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_period practice_usage_periods;
  v_block_audio_seconds INTEGER := 2700;
  v_block_text_turns INTEGER := 300;
BEGIN
  -- Increment blocks_consumed
  UPDATE practice_usage_periods
  SET
    blocks_consumed = blocks_consumed + 1,
    current_tier_price_cents = (blocks_consumed + 1) * 500,  -- $5 per block
    is_free_tier = false,
    updated_at = now()
  WHERE id = p_usage_period_id
  RETURNING * INTO v_period;

  IF v_period IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period not found');
  END IF;

  -- Record in ledger
  INSERT INTO practice_block_ledger (
    id,
    usage_period_id,
    blocks_consumed,
    trigger_type,
    usage_at_trigger,
    stripe_usage_record_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_usage_period_id,
    1,
    p_trigger_type,
    jsonb_build_object(
      'audio_seconds_used', v_period.audio_seconds_used,
      'text_turns_used', v_period.text_turns_used
    ),
    p_stripe_usage_record_id,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'blocks_consumed', v_period.blocks_consumed,
    'new_audio_allowance', v_period.free_audio_seconds + (v_period.blocks_consumed * v_block_audio_seconds),
    'new_text_allowance', v_period.free_text_turns + (v_period.blocks_consumed * v_block_text_turns)
  );
END;
$function$

```

### public.update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.create_student_timeline_event
```sql
CREATE OR REPLACE FUNCTION public.create_student_timeline_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_description,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    NEW.id,
    NEW.tutor_id,
    'student_created',
    'Student joined',
    'Welcome to your language learning journey!',
    true,
    true,
    NEW.created_at
  );
  RETURN NEW;
END;
$function$

```

### public.create_booking_timeline_event
```sql
CREATE OR REPLACE FUNCTION public.create_booking_timeline_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_event_type TEXT;
  v_event_title TEXT;
  v_is_milestone BOOLEAN := false;
  v_lesson_count INTEGER;
BEGIN
  -- Determine event type based on status change
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'booking_created';
    v_event_title := 'Lesson booked';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      v_event_type := 'booking_completed';
      v_event_title := 'Lesson completed';

      -- Check for lesson milestones (1st, 10th, 25th, 50th, 100th)
      SELECT COUNT(*) INTO v_lesson_count
      FROM bookings
      WHERE student_id = NEW.student_id
        AND tutor_id = NEW.tutor_id
        AND status = 'completed';

      IF v_lesson_count = 1 THEN
        v_is_milestone := true;
        v_event_type := 'first_lesson';
        v_event_title := 'First lesson completed!';

        -- Update first_lesson_at on student
        UPDATE students
        SET first_lesson_at = NEW.scheduled_at
        WHERE id = NEW.student_id;
      ELSIF v_lesson_count IN (10, 25, 50, 100) THEN
        v_is_milestone := true;
        v_event_type := 'lesson_milestone';
        v_event_title := v_lesson_count || ' lessons completed!';
      END IF;
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      v_event_type := 'booking_cancelled';
      v_event_title := 'Lesson cancelled';
    ELSE
      RETURN NEW; -- No relevant status change
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_metadata,
    related_booking_id,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    NEW.student_id,
    NEW.tutor_id,
    v_event_type,
    v_event_title,
    jsonb_build_object(
      'service_id', NEW.service_id,
      'scheduled_at', NEW.scheduled_at,
      'duration_minutes', NEW.duration_minutes
    ),
    NEW.id,
    true,
    v_is_milestone,
    COALESCE(NEW.scheduled_at, NOW())
  );

  -- Update last_activity_at on student
  UPDATE students
  SET last_activity_at = NOW()
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$function$

```

### public.create_homework_timeline_event
```sql
CREATE OR REPLACE FUNCTION public.create_homework_timeline_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_event_type TEXT;
  v_event_title TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'homework_assigned';
    v_event_title := 'Homework assigned: ' || COALESCE(NEW.title, 'New assignment');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      v_event_type := 'homework_completed';
      v_event_title := 'Homework completed: ' || COALESCE(NEW.title, 'Assignment');
    ELSIF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
      v_event_type := 'homework_submitted';
      v_event_title := 'Homework submitted: ' || COALESCE(NEW.title, 'Assignment');
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_metadata,
    related_homework_id,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    NEW.student_id,
    NEW.tutor_id,
    v_event_type,
    v_event_title,
    jsonb_build_object(
      'homework_title', NEW.title,
      'due_date', NEW.due_date
    ),
    NEW.id,
    true,
    false,
    NOW()
  );

  -- Update last_activity_at
  UPDATE students
  SET last_activity_at = NOW()
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$function$

```

### vault._crypto_aead_det_encrypt
```sql
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_encrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_encrypt_by_id$function$

```

### extensions.armor
```sql
CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$

```

### vault.create_secret
```sql
CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rec record;
BEGIN
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    new_secret,
    new_name,
    new_description
  )
  RETURNING * INTO rec;
  UPDATE vault.secrets s
  SET secret = encode(vault._crypto_aead_det_encrypt(
    message := convert_to(rec.secret, 'utf8'),
    additional := convert_to(s.id::text, 'utf8'),
    key_id := 0,
    context := 'pgsodium'::bytea,
    nonce := rec.nonce
  ), 'base64')
  WHERE id = rec.id;
  RETURN rec.id;
END
$function$

```

### vault._crypto_aead_det_decrypt
```sql
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_decrypt_by_id$function$

```

### extensions.dearmor
```sql
CREATE OR REPLACE FUNCTION extensions.dearmor(text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_dearmor$function$

```

### extensions.pgp_armor_headers
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)
 RETURNS SETOF record
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$

```

### extensions.set_graphql_placeholder
```sql
CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$function$

```

### public.update_content_reports_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_content_reports_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### extensions.grant_pg_net_access
```sql
CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$function$

```

### public.check_report_escalation
```sql
CREATE OR REPLACE FUNCTION public.check_report_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM public.content_reports
  WHERE reported_user_id = NEW.reported_user_id
    AND created_at > NOW() - INTERVAL '30 days'
    AND status != 'dismissed';

  IF report_count >= 5 THEN
    NEW.priority := 'urgent';
  ELSIF report_count >= 3 THEN
    NEW.priority := 'high';
  END IF;

  RETURN NEW;
END;
$function$

```

### vault.update_secret
```sql
CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  decrypted_secret text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_id);
BEGIN
  UPDATE vault.secrets s
  SET
    secret = CASE WHEN new_secret IS NULL THEN s.secret
                  ELSE encode(vault._crypto_aead_det_encrypt(
                    message := convert_to(new_secret, 'utf8'),
                    additional := convert_to(s.id::text, 'utf8'),
                    key_id := 0,
                    context := 'pgsodium'::bytea,
                    nonce := s.nonce
                  ), 'base64') END,
    name = coalesce(new_name, s.name),
    description = coalesce(new_description, s.description),
    updated_at = now()
  WHERE s.id = secret_id;
END
$function$

```

### extensions.gen_random_bytes
```sql
CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_random_bytes$function$

```

### extensions.gen_random_uuid
```sql
CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/pgcrypto', $function$pg_random_uuid$function$

```

### extensions.pgp_sym_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$

```

### extensions.pgp_sym_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$

```

### extensions.pgp_sym_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$

```

### extensions.pgp_sym_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$

```

### extensions.pgp_sym_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$

```

### extensions.pgp_sym_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$

```

### extensions.pgp_sym_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$

```

### extensions.pgp_sym_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$

```

### extensions.pgp_pub_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$

```

### extensions.pgp_pub_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$

```

### extensions.pgp_pub_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$

```

### extensions.pgp_pub_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$

```

### extensions.pgp_pub_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$

```

### extensions.pgp_pub_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$

```

### extensions.pgp_pub_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$

```

### extensions.pgp_pub_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$

```

### extensions.pgp_pub_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$

```

### extensions.pgp_pub_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$

```

### extensions.pgp_key_id
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$

```

### extensions.armor
```sql
CREATE OR REPLACE FUNCTION extensions.armor(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$

```

### public.create_message_timeline_event
```sql
CREATE OR REPLACE FUNCTION public.create_message_timeline_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_thread RECORD;
  v_event_type TEXT;
  v_event_title TEXT;
BEGIN
  SELECT tutor_id, student_id INTO v_thread
  FROM conversation_threads
  WHERE id = NEW.thread_id;

  IF v_thread.tutor_id IS NULL OR v_thread.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_role = 'student' THEN
    v_event_type := 'message_received';
    v_event_title := 'Message received from student';
  ELSIF NEW.sender_role = 'tutor' THEN
    v_event_type := 'message_sent';
    v_event_title := 'Tutor sent a message';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO student_timeline_events (
    student_id,
    tutor_id,
    event_type,
    event_title,
    event_metadata,
    related_message_id,
    visible_to_student,
    is_milestone,
    event_at
  ) VALUES (
    v_thread.student_id,
    v_thread.tutor_id,
    v_event_type,
    v_event_title,
    jsonb_build_object('thread_id', NEW.thread_id, 'sender_role', NEW.sender_role),
    NEW.id,
    true,
    false,
    COALESCE(NEW.created_at, NOW())
  );

  UPDATE students
  SET last_activity_at = COALESCE(NEW.created_at, NOW())
  WHERE id = v_thread.student_id AND tutor_id = v_thread.tutor_id;

  PERFORM queue_student_engagement_refresh(v_thread.student_id, v_thread.tutor_id, 'message');

  RETURN NEW;
END;
$function$

```

### public.handle_new_user
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  first_name TEXT;
  full_name_val TEXT;
  v_standard_service_id UUID;
BEGIN
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  first_name := SPLIT_PART(full_name_val, ' ', 1);

  IF first_name = '' THEN
    first_name := 'Tutor';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    plan,
    terms_accepted_at,
    tutor_recording_consent,
    tutor_recording_consent_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    full_name_val,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tutor'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'founder_lifetime'),
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'tutor_recording_consent', '')::boolean, false),
    NULLIF(NEW.raw_user_meta_data->>'tutor_recording_consent_at', '')::timestamptz
  );

  -- Service 1: Trial Lesson - 30 min, $0 (blank for tutor to set)
  INSERT INTO public.services (
    tutor_id,
    name,
    description,
    duration_minutes,
    price,
    currency,
    price_amount,
    price_currency,
    is_active,
    requires_approval,
    offer_type,
    max_students_per_session
  ) VALUES (
    NEW.id,
    'Trial Lesson with ' || first_name,
    'A short introductory session to see if we are a good fit.',
    30,
    0,
    'USD',
    0,
    'USD',
    true,
    false,
    'trial',
    1
  );

  -- Service 2: Standard Lesson - 55 min, $0 (blank for tutor to set)
  INSERT INTO public.services (
    tutor_id,
    name,
    description,
    duration_minutes,
    price,
    currency,
    price_amount,
    price_currency,
    is_active,
    requires_approval,
    offer_type,
    max_students_per_session
  ) VALUES (
    NEW.id,
    'Standard Lesson with ' || first_name,
    'A full-length lesson focused on your learning goals.',
    55,
    0,
    'USD',
    0,
    'USD',
    true,
    false,
    'one_off',
    1
  )
  RETURNING id INTO v_standard_service_id;

  -- Session Package: 10 Lessons attached to the standard lesson
  INSERT INTO public.session_package_templates (
    tutor_id,
    service_id,
    name,
    description,
    session_count,
    total_minutes,
    price_cents,
    currency,
    is_active
  ) VALUES (
    NEW.id,
    v_standard_service_id,
    '10 Lesson Package',
    'Save when you commit to 10 lessons upfront.',
    10,
    550,
    0,
    'USD',
    true
  );

  RETURN NEW;
END;
$function$

```

### graphql_public.graphql
```sql
CREATE OR REPLACE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $function$

```

### graphql.exception
```sql
CREATE OR REPLACE FUNCTION graphql.exception(message text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
begin
    raise exception using errcode='22000', message=message;
end;
$function$

```

### graphql.comment_directive
```sql
CREATE OR REPLACE FUNCTION graphql.comment_directive(comment_ text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
AS $function$
    /*
    comment on column public.account.name is '@graphql.name: myField'
    */
    select
        coalesce(
            (
                regexp_match(
                    comment_,
                    '@graphql\((.+)\)'
                )
            )[1]::jsonb,
            jsonb_build_object()
        )
$function$

```

### extensions.grant_pg_cron_access
```sql
CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$function$

```

### auth.jwt
```sql
CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$

```

### storage.filename
```sql
CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$function$

```

### public.create_notification
```sql
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_user_role text, p_type text, p_title text, p_body text DEFAULT NULL::text, p_link text DEFAULT NULL::text, p_icon text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, user_role, type, title, body, link, icon, metadata)
  VALUES (p_user_id, p_user_role, p_type, p_title, p_body, p_link, p_icon, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$function$

```

### storage.foldername
```sql
CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$function$

```

### storage.extension
```sql
CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$function$

```

### storage.list_multipart_uploads_with_delimiter
```sql
CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)
 RETURNS TABLE(key text, id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$function$

```

### public.gbtreekey4_in
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey4_in(cstring)
 RETURNS gbtreekey4
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$

```

### storage.operation
```sql
CREATE OR REPLACE FUNCTION storage.operation()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$function$

```

### storage.get_level
```sql
CREATE OR REPLACE FUNCTION storage.get_level(name text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
SELECT array_length(string_to_array("name", '/'), 1);
$function$

```

### storage.get_prefix
```sql
CREATE OR REPLACE FUNCTION storage.get_prefix(name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$function$

```

### storage.get_prefixes
```sql
CREATE OR REPLACE FUNCTION storage.get_prefixes(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$function$

```

### storage.add_prefixes
```sql
CREATE OR REPLACE FUNCTION storage.add_prefixes(_bucket_id text, _name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$function$

```

### storage.delete_prefix
```sql
CREATE OR REPLACE FUNCTION storage.delete_prefix(_bucket_id text, _name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$function$

```

### storage.prefixes_insert_trigger
```sql
CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$function$

```

### storage.objects_insert_prefix_trigger
```sql
CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$function$

```

### storage.delete_prefix_hierarchy_trigger
```sql
CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$function$

```

### storage.get_size_by_bucket
```sql
CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE(size bigint, bucket_id text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$

```

### storage.objects_update_prefix_trigger
```sql
CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$function$

```

### storage.enforce_bucket_name_length
```sql
CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$function$

```

### public.gbtreekey4_out
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey4_out(gbtreekey4)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$

```

### storage.search_v1_optimised
```sql
CREATE OR REPLACE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$

```

### storage.search_legacy_v1
```sql
CREATE OR REPLACE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$

```

### storage.search
```sql
CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$function$

```

### public.gbtreekey8_in
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey8_in(cstring)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$

```

### public.gbtreekey8_out
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey8_out(gbtreekey8)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$

```

### public.gbtreekey16_in
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey16_in(cstring)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$

```

### public.gbtreekey16_out
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey16_out(gbtreekey16)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$

```

### public.gbtreekey32_in
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey32_in(cstring)
 RETURNS gbtreekey32
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$

```

### public.gbtreekey32_out
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey32_out(gbtreekey32)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$

```

### public.gbtreekey_var_in
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey_var_in(cstring)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$

```

### public.gbtreekey_var_out
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey_var_out(gbtreekey_var)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$

```

### public.cash_dist
```sql
CREATE OR REPLACE FUNCTION public.cash_dist(money, money)
 RETURNS money
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$cash_dist$function$

```

### storage.search_v2
```sql
CREATE OR REPLACE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$function$

```

### storage.lock_top_prefixes
```sql
CREATE OR REPLACE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$function$

```

### public.date_dist
```sql
CREATE OR REPLACE FUNCTION public.date_dist(date, date)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$date_dist$function$

```

### storage.objects_delete_cleanup
```sql
CREATE OR REPLACE FUNCTION storage.objects_delete_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$function$

```

### storage.objects_update_cleanup
```sql
CREATE OR REPLACE FUNCTION storage.objects_update_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$function$

```

### storage.prefixes_delete_cleanup
```sql
CREATE OR REPLACE FUNCTION storage.prefixes_delete_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$function$

```

### storage.objects_update_level_trigger
```sql
CREATE OR REPLACE FUNCTION storage.objects_update_level_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$function$

```

### public.float4_dist
```sql
CREATE OR REPLACE FUNCTION public.float4_dist(real, real)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$float4_dist$function$

```

### public.float8_dist
```sql
CREATE OR REPLACE FUNCTION public.float8_dist(double precision, double precision)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$float8_dist$function$

```

### public.int2_dist
```sql
CREATE OR REPLACE FUNCTION public.int2_dist(smallint, smallint)
 RETURNS smallint
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$int2_dist$function$

```

### public.int4_dist
```sql
CREATE OR REPLACE FUNCTION public.int4_dist(integer, integer)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$int4_dist$function$

```

### public.int8_dist
```sql
CREATE OR REPLACE FUNCTION public.int8_dist(bigint, bigint)
 RETURNS bigint
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$int8_dist$function$

```

### public.interval_dist
```sql
CREATE OR REPLACE FUNCTION public.interval_dist(interval, interval)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$interval_dist$function$

```

### storage.delete_leaf_prefixes
```sql
CREATE OR REPLACE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$function$

```

### public.oid_dist
```sql
CREATE OR REPLACE FUNCTION public.oid_dist(oid, oid)
 RETURNS oid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$oid_dist$function$

```

### public.time_dist
```sql
CREATE OR REPLACE FUNCTION public.time_dist(time without time zone, time without time zone)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$time_dist$function$

```

### public.ts_dist
```sql
CREATE OR REPLACE FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$ts_dist$function$

```

### public.tstz_dist
```sql
CREATE OR REPLACE FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone)
 RETURNS interval
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$tstz_dist$function$

```

### public.gbt_oid_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_consistent(internal, oid, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_consistent$function$

```

### realtime.quote_wal2json
```sql
CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $function$

```

### public.gbt_oid_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_distance(internal, oid, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_distance$function$

```

### public.gbt_oid_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_fetch$function$

```

### realtime.cast
```sql
CREATE OR REPLACE FUNCTION realtime."cast"(val text, type_ regtype)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $function$

```

### public.gbt_oid_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_compress$function$

```

### public.gbt_decompress
```sql
CREATE OR REPLACE FUNCTION public.gbt_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_decompress$function$

```

### public.gbt_var_decompress
```sql
CREATE OR REPLACE FUNCTION public.gbt_var_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_var_decompress$function$

```

### public.gbt_var_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_var_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_var_fetch$function$

```

### public.gbt_oid_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_penalty$function$

```

### public.gbt_oid_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_picksplit$function$

```

### public.update_learning_stats_on_booking
```sql
CREATE OR REPLACE FUNCTION public.update_learning_stats_on_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.learning_stats (student_id, tutor_id, total_lessons, total_minutes, last_lesson_at)
    VALUES (NEW.student_id, NEW.tutor_id, 1, NEW.duration_minutes, NOW())
    ON CONFLICT (student_id, tutor_id) DO UPDATE SET
      total_lessons = public.learning_stats.total_lessons + 1,
      total_minutes = public.learning_stats.total_minutes + NEW.duration_minutes,
      last_lesson_at = NOW(),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$function$

```

### public.gbt_oid_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_union$function$

```

### realtime.subscription_check_filters
```sql
CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $function$

```

### public.gbt_oid_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_oid_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_oid_same$function$

```

### realtime.list_changes
```sql
CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer)
 RETURNS SETOF realtime.wal_rls
 LANGUAGE sql
 SET log_min_messages TO 'fatal'
AS $function$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $function$

```

### public.gbt_int2_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_consistent(internal, smallint, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_consistent$function$

```

### public.gbt_int2_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_distance(internal, smallint, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_distance$function$

```

### public.gbt_int2_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_compress$function$

```

### public.gbt_int2_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_fetch$function$

```

### public.gbt_int2_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_penalty$function$

```

### public.gbt_int2_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_picksplit$function$

```

### public.gbt_int2_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_union(internal, internal)
 RETURNS gbtreekey4
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_union$function$

```

### public.gbt_int2_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_int2_same(gbtreekey4, gbtreekey4, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_same$function$

```

### public.gbt_int4_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_consistent(internal, integer, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_consistent$function$

```

### public.gbt_int4_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_distance(internal, integer, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_distance$function$

```

### public.gbt_int4_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_compress$function$

```

### public.gbt_int4_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_fetch$function$

```

### realtime.broadcast_changes
```sql
CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$function$

```

### public.gbt_int4_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_penalty$function$

```

### public.gbt_int4_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_picksplit$function$

```

### public.gbt_int4_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_union$function$

```

### realtime.to_regrole
```sql
CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)
 RETURNS regrole
 LANGUAGE sql
 IMMUTABLE
AS $function$ select role_name::regrole $function$

```

### public.gbt_int4_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_int4_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_same$function$

```

### public.gbt_int8_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_consistent$function$

```

### realtime.build_prepared_statement_sql
```sql
CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[])
 RETURNS text
 LANGUAGE sql
AS $function$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $function$

```

### public.gbt_int8_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_distance(internal, bigint, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_distance$function$

```

### public.gbt_int8_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_compress$function$

```

### realtime.apply_rls
```sql
CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024))
 RETURNS SETOF realtime.wal_rls
 LANGUAGE plpgsql
AS $function$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$function$

```

### public.gbt_int8_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_fetch$function$

```

### public.gbt_int8_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_penalty$function$

```

### public.gbt_int8_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_picksplit$function$

```

### public.gbt_int8_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_union$function$

```

### public.gbt_int8_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_int8_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_same$function$

```

### realtime.check_equality_op
```sql
CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $function$

```

### realtime.is_visible_through_filters
```sql
CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $function$

```

### realtime.topic
```sql
CREATE OR REPLACE FUNCTION realtime.topic()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
select nullif(current_setting('realtime.topic', true), '')::text;
$function$

```

### public.gbt_float4_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_consistent$function$

```

### public.update_plan_overrides_updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_plan_overrides_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

```

### public.gbt_float4_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_distance(internal, real, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_distance$function$

```

### public.gbt_float4_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_compress$function$

```

### public.gbt_float4_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_fetch$function$

```

### public.gbt_float4_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_penalty$function$

```

### public.gbt_float4_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_picksplit$function$

```

### public.gbt_float4_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_union$function$

```

### public.gbt_float4_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_float4_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_same$function$

```

### public.gbt_float8_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_consistent$function$

```

### public.gbt_float8_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_distance$function$

```

### public.gbt_float8_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_compress$function$

```

### public.gbt_float8_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_fetch$function$

```

### public.gbt_float8_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_penalty$function$

```

### public.get_effective_plan
```sql
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_tutor_id uuid)
 RETURNS TABLE(plan_name text, max_students integer, is_override boolean, override_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_override RECORD;
  v_profile RECORD;
BEGIN
  SELECT * INTO v_override
  FROM public.plan_overrides
  WHERE tutor_id = p_tutor_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND AND v_override.plan_name IS NOT NULL THEN
    RETURN QUERY SELECT
      v_override.plan_name,
      COALESCE(v_override.max_students,
        CASE v_override.plan_name
          WHEN 'professional' THEN 20
          WHEN 'growth' THEN 999999
          WHEN 'studio' THEN 999999
          ELSE 20
        END),
      TRUE,
      v_override.expires_at;
    RETURN;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_tutor_id;

  IF FOUND THEN
    RETURN QUERY SELECT
      COALESCE(v_profile.plan, 'professional')::TEXT,
      CASE COALESCE(v_profile.plan, 'professional')
        WHEN 'professional' THEN 20
        WHEN 'growth' THEN 999999
        WHEN 'studio' THEN 999999
        ELSE 20
      END,
      FALSE,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'professional'::TEXT, 20, FALSE, NULL::TIMESTAMPTZ;
END;
$function$

```

### public.get_upcoming_bookings
```sql
CREATE OR REPLACE FUNCTION public.get_upcoming_bookings(tutor_uuid uuid)
 RETURNS TABLE(booking_id uuid, student_name text, service_name text, scheduled_at timestamp with time zone, duration_minutes integer, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    s.full_name,
    srv.name,
    b.scheduled_at,
    b.duration_minutes,
    b.status
  FROM public.bookings b
  JOIN public.students s ON b.student_id = s.id
  LEFT JOIN public.services srv ON b.service_id = srv.id
  WHERE b.tutor_id = tutor_uuid
    AND b.scheduled_at > NOW()
    AND b.status IN ('confirmed', 'pending')
  ORDER BY b.scheduled_at ASC;
END;
$function$

```

### public.gbt_float8_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_picksplit$function$

```

### public.gbt_float8_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_union$function$

```

### public.gbt_float8_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_float8_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_same$function$

```

### public.gbt_ts_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_consistent(internal, timestamp without time zone, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_consistent$function$

```

### public.gbt_ts_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_distance(internal, timestamp without time zone, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_distance$function$

```

### public.gbt_tstz_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_tstz_consistent(internal, timestamp with time zone, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_tstz_consistent$function$

```

### public.gbt_tstz_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_tstz_distance$function$

```

### public.gbt_ts_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_compress$function$

```

### public.gbt_tstz_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_tstz_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_tstz_compress$function$

```

### public.gbt_ts_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_fetch$function$

```

### public.gbt_ts_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_penalty$function$

```

### public.gbt_ts_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_picksplit$function$

```

### public.gbt_ts_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_union$function$

```

### public.gbt_ts_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_ts_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_ts_same$function$

```

### public.gbt_time_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_consistent(internal, time without time zone, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_consistent$function$

```

### public.gbt_time_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_distance$function$

```

### public.gbt_timetz_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_timetz_consistent$function$

```

### public.gbt_time_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_compress$function$

```

### public.gbt_timetz_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_timetz_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_timetz_compress$function$

```

### public.gbt_time_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_fetch$function$

```

### public.gbt_time_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_penalty$function$

```

### public.gbt_time_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_picksplit$function$

```

### public.gbt_time_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_union$function$

```

### public.gbt_time_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_time_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_time_same$function$

```

### public.gbt_date_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_consistent(internal, date, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_consistent$function$

```

### public.gbt_date_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_distance$function$

```

### public.gbt_date_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_compress$function$

```

### public.gbt_date_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_fetch$function$

```

### public.gbt_date_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_penalty$function$

```

### public.gbt_date_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_picksplit$function$

```

### public.gbt_date_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_union$function$

```

### public.gbt_date_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_date_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_same$function$

```

### public.gbt_intv_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_consistent(internal, interval, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_consistent$function$

```

### public.gbt_intv_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_distance$function$

```

### public.gbt_intv_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_compress$function$

```

### public.gbt_intv_decompress
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_decompress$function$

```

### public.gbt_intv_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_fetch$function$

```

### public.gbt_intv_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_penalty$function$

```

### public.gbt_intv_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_picksplit$function$

```

### public.gbt_intv_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_union(internal, internal)
 RETURNS gbtreekey32
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_union$function$

```

### public.gbt_intv_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_intv_same(gbtreekey32, gbtreekey32, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_same$function$

```

### public.gbt_cash_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_consistent$function$

```

### public.gbt_cash_distance
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_distance$function$

```

### public.gbt_cash_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_compress$function$

```

### public.gbt_cash_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_fetch$function$

```

### public.gbt_cash_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_penalty$function$

```

### public.gbt_cash_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_picksplit$function$

```

### public.gbt_cash_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_union$function$

```

### public.gbt_cash_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_cash_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_same$function$

```

### public.gbt_macad_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_consistent$function$

```

### public.gbt_macad_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_compress$function$

```

### public.gbt_macad_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_fetch$function$

```

### public.gbt_macad_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_penalty$function$

```

### public.gbt_macad_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_picksplit$function$

```

### public.gbt_macad_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_union$function$

```

### public.gbt_macad_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad_same$function$

```

### public.gbt_text_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_consistent$function$

```

### public.gbt_bpchar_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bpchar_consistent$function$

```

### public.gbt_text_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_text_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_compress$function$

```

### public.gbt_bpchar_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_bpchar_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bpchar_compress$function$

```

### public.gbt_text_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_text_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_penalty$function$

```

### public.gbt_text_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_text_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_picksplit$function$

```

### public.gbt_text_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_text_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_union$function$

```

### public.gbt_text_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_text_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_text_same$function$

```

### public.gbt_bytea_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_bytea_consistent(internal, bytea, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_consistent$function$

```

### public.gbt_bytea_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_bytea_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_compress$function$

```

### public.gbt_bytea_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_bytea_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_penalty$function$

```

### public.gbt_bytea_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_bytea_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_picksplit$function$

```

### public.gbt_bytea_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_bytea_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_union$function$

```

### public.gbt_bytea_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_bytea_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_same$function$

```

### public.gbt_numeric_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_consistent$function$

```

### public.gbt_numeric_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_numeric_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_compress$function$

```

### public.gbt_numeric_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_numeric_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_penalty$function$

```

### public.gbt_numeric_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_numeric_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_picksplit$function$

```

### public.gbt_numeric_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_numeric_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_union$function$

```

### public.gbt_numeric_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_numeric_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_numeric_same$function$

```

### public.gbt_bit_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_consistent$function$

```

### public.gbt_bit_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_bit_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_compress$function$

```

### public.gbt_bit_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_bit_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_penalty$function$

```

### public.gbt_bit_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_bit_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_picksplit$function$

```

### public.gbt_bit_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_bit_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_union$function$

```

### public.gbt_bit_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_bit_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_same$function$

```

### public.gbt_inet_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_consistent$function$

```

### public.gbt_inet_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_inet_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_compress$function$

```

### public.gbt_inet_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_inet_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_penalty$function$

```

### public.gbt_inet_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_inet_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_picksplit$function$

```

### public.gbt_inet_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_inet_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_union$function$

```

### public.gbt_inet_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_inet_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_same$function$

```

### public.gbt_uuid_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_consistent$function$

```

### public.gbt_uuid_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_fetch$function$

```

### public.gbt_uuid_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_compress$function$

```

### public.gbt_uuid_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_penalty$function$

```

### public.gbt_uuid_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_picksplit$function$

```

### public.gbt_uuid_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_union(internal, internal)
 RETURNS gbtreekey32
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_union$function$

```

### public.gbt_uuid_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_uuid_same(gbtreekey32, gbtreekey32, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_uuid_same$function$

```

### public.gbt_macad8_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_consistent$function$

```

### public.gbt_macad8_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_compress$function$

```

### public.gbt_macad8_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_fetch$function$

```

### public.gbt_macad8_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_penalty$function$

```

### public.gbt_macad8_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_picksplit$function$

```

### public.gbt_macad8_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_union$function$

```

### public.gbt_macad8_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_macad8_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_macad8_same$function$

```

### public.gbt_enum_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_consistent(internal, anyenum, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_consistent$function$

```

### public.gbt_enum_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_compress$function$

```

### public.gbt_enum_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_fetch$function$

```

### public.gbt_enum_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_penalty$function$

```

### public.gbt_enum_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_picksplit$function$

```

### public.gbt_enum_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_union$function$

```

### public.gbt_enum_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_enum_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_same$function$

```

### public.gbtreekey2_in
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey2_in(cstring)
 RETURNS gbtreekey2
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_in$function$

```

### public.gbtreekey2_out
```sql
CREATE OR REPLACE FUNCTION public.gbtreekey2_out(gbtreekey2)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbtreekey_out$function$

```

### public.gbt_bool_consistent
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_consistent$function$

```

### public.gbt_bool_compress
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_compress$function$

```

### public.gbt_bool_fetch
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_fetch$function$

```

### public.gbt_bool_penalty
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_penalty$function$

```

### public.gbt_bool_picksplit
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_picksplit$function$

```

### public.gbt_bool_union
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_union(internal, internal)
 RETURNS gbtreekey2
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_union$function$

```

### public.gbt_bool_same
```sql
CREATE OR REPLACE FUNCTION public.gbt_bool_same(gbtreekey2, gbtreekey2, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_same$function$

```

### public.init_student_onboarding_progress
```sql
CREATE OR REPLACE FUNCTION public.init_student_onboarding_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id UUID;
BEGIN
  v_template_id := ensure_default_onboarding_template(NEW.tutor_id);

  INSERT INTO student_onboarding_progress (
    student_id,
    tutor_id,
    template_id,
    completed_items,
    status,
    started_at,
    completed_at
  )
  VALUES (
    NEW.id,
    NEW.tutor_id,
    v_template_id,
    '{}'::TEXT[],
    'not_started',
    NULL,
    NULL
  )
  ON CONFLICT (student_id, tutor_id) DO NOTHING;

  UPDATE students
  SET onboarding_status = COALESCE(onboarding_status, 'not_started')
  WHERE id = NEW.id AND tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$function$

```

### public.booking_time_range
```sql
CREATE OR REPLACE FUNCTION public.booking_time_range(scheduled_at timestamp with time zone, duration_minutes integer)
 RETURNS tstzrange
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)');
$function$

```

### public.upsert_student_engagement_score
```sql
CREATE OR REPLACE FUNCTION public.upsert_student_engagement_score(p_student_id uuid, p_tutor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score RECORD;
  v_override TEXT;
BEGIN
  SELECT * INTO v_score
  FROM compute_student_engagement_score(p_student_id, p_tutor_id);

  IF v_score IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO student_engagement_scores (
    student_id,
    tutor_id,
    score,
    lesson_frequency_score,
    response_rate_score,
    homework_completion_score,
    practice_engagement_score,
    risk_status,
    days_since_last_lesson,
    days_since_last_message,
    last_computed_at
  ) VALUES (
    p_student_id,
    p_tutor_id,
    v_score.score,
    v_score.lesson_frequency_score,
    v_score.response_rate_score,
    v_score.homework_completion_score,
    v_score.practice_engagement_score,
    v_score.risk_status,
    v_score.days_since_last_lesson,
    v_score.days_since_last_message,
    NOW()
  )
  ON CONFLICT (student_id, tutor_id) DO UPDATE SET
    score = EXCLUDED.score,
    lesson_frequency_score = EXCLUDED.lesson_frequency_score,
    response_rate_score = EXCLUDED.response_rate_score,
    homework_completion_score = EXCLUDED.homework_completion_score,
    practice_engagement_score = EXCLUDED.practice_engagement_score,
    risk_status = EXCLUDED.risk_status,
    days_since_last_lesson = EXCLUDED.days_since_last_lesson,
    days_since_last_message = EXCLUDED.days_since_last_message,
    last_computed_at = EXCLUDED.last_computed_at;

  SELECT risk_status_override INTO v_override
  FROM student_engagement_scores
  WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

  UPDATE students
  SET engagement_score = v_score.score,
      risk_status = COALESCE(v_override, v_score.risk_status)
  WHERE id = p_student_id AND tutor_id = p_tutor_id;
END;
$function$

```
