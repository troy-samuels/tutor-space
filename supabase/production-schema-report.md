# Production schema report

Total tables: 143
- auth: 20
- public: 102
- realtime: 10
- storage: 9
- supabase_migrations: 1
- vault: 1

## auth

### auth.audit_log_entries
- instance_id uuid NULL
- id uuid NOT NULL
- payload json NULL
- created_at timestamp with time zone NULL
- ip_address character varying NOT NULL DEFAULT ''::character varying

### auth.flow_state
- id uuid NOT NULL
- user_id uuid NULL
- auth_code text NOT NULL
- code_challenge_method USER-DEFINED NOT NULL
- code_challenge text NOT NULL
- provider_type text NOT NULL
- provider_access_token text NULL
- provider_refresh_token text NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- authentication_method text NOT NULL
- auth_code_issued_at timestamp with time zone NULL

### auth.identities
- provider_id text NOT NULL
- user_id uuid NOT NULL
- identity_data jsonb NOT NULL
- provider text NOT NULL
- last_sign_in_at timestamp with time zone NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- email text NULL
- id uuid NOT NULL DEFAULT gen_random_uuid()

### auth.instances
- id uuid NOT NULL
- uuid uuid NULL
- raw_base_config text NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL

### auth.mfa_amr_claims
- session_id uuid NOT NULL
- created_at timestamp with time zone NOT NULL
- updated_at timestamp with time zone NOT NULL
- authentication_method text NOT NULL
- id uuid NOT NULL

### auth.mfa_challenges
- id uuid NOT NULL
- factor_id uuid NOT NULL
- created_at timestamp with time zone NOT NULL
- verified_at timestamp with time zone NULL
- ip_address inet NOT NULL
- otp_code text NULL
- web_authn_session_data jsonb NULL

### auth.mfa_factors
- id uuid NOT NULL
- user_id uuid NOT NULL
- friendly_name text NULL
- factor_type USER-DEFINED NOT NULL
- status USER-DEFINED NOT NULL
- created_at timestamp with time zone NOT NULL
- updated_at timestamp with time zone NOT NULL
- secret text NULL
- phone text NULL
- last_challenged_at timestamp with time zone NULL
- web_authn_credential jsonb NULL
- web_authn_aaguid uuid NULL
- last_webauthn_challenge_data jsonb NULL

### auth.oauth_authorizations
- id uuid NOT NULL
- authorization_id text NOT NULL
- client_id uuid NOT NULL
- user_id uuid NULL
- redirect_uri text NOT NULL
- scope text NOT NULL
- state text NULL
- resource text NULL
- code_challenge text NULL
- code_challenge_method USER-DEFINED NULL
- response_type USER-DEFINED NOT NULL DEFAULT 'code'::auth.oauth_response_type
- status USER-DEFINED NOT NULL DEFAULT 'pending'::auth.oauth_authorization_status
- authorization_code text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:03:00'::interval)
- approved_at timestamp with time zone NULL
- nonce text NULL

### auth.oauth_client_states
- id uuid NOT NULL
- provider_type text NOT NULL
- code_verifier text NULL
- created_at timestamp with time zone NOT NULL

### auth.oauth_clients
- id uuid NOT NULL
- client_secret_hash text NULL
- registration_type USER-DEFINED NOT NULL
- redirect_uris text NOT NULL
- grant_types text NOT NULL
- client_name text NULL
- client_uri text NULL
- logo_uri text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()
- deleted_at timestamp with time zone NULL
- client_type USER-DEFINED NOT NULL DEFAULT 'confidential'::auth.oauth_client_type

### auth.oauth_consents
- id uuid NOT NULL
- user_id uuid NOT NULL
- client_id uuid NOT NULL
- scopes text NOT NULL
- granted_at timestamp with time zone NOT NULL DEFAULT now()
- revoked_at timestamp with time zone NULL

### auth.one_time_tokens
- id uuid NOT NULL
- user_id uuid NOT NULL
- token_type USER-DEFINED NOT NULL
- token_hash text NOT NULL
- relates_to text NOT NULL
- created_at timestamp without time zone NOT NULL DEFAULT now()
- updated_at timestamp without time zone NOT NULL DEFAULT now()

### auth.refresh_tokens
- instance_id uuid NULL
- id bigint NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass)
- token character varying NULL
- user_id character varying NULL
- revoked boolean NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- parent character varying NULL
- session_id uuid NULL

### auth.saml_providers
- id uuid NOT NULL
- sso_provider_id uuid NOT NULL
- entity_id text NOT NULL
- metadata_xml text NOT NULL
- metadata_url text NULL
- attribute_mapping jsonb NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- name_id_format text NULL

### auth.saml_relay_states
- id uuid NOT NULL
- sso_provider_id uuid NOT NULL
- request_id text NOT NULL
- for_email text NULL
- redirect_to text NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- flow_state_id uuid NULL

### auth.schema_migrations
- version character varying NOT NULL

### auth.sessions
- id uuid NOT NULL
- user_id uuid NOT NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- factor_id uuid NULL
- aal USER-DEFINED NULL
- not_after timestamp with time zone NULL
- refreshed_at timestamp without time zone NULL
- user_agent text NULL
- ip inet NULL
- tag text NULL
- oauth_client_id uuid NULL
- refresh_token_hmac_key text NULL
- refresh_token_counter bigint NULL
- scopes text NULL

### auth.sso_domains
- id uuid NOT NULL
- sso_provider_id uuid NOT NULL
- domain text NOT NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL

### auth.sso_providers
- id uuid NOT NULL
- resource_id text NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- disabled boolean NULL

### auth.users
- instance_id uuid NULL
- id uuid NOT NULL
- aud character varying NULL
- role character varying NULL
- email character varying NULL
- encrypted_password character varying NULL
- email_confirmed_at timestamp with time zone NULL
- invited_at timestamp with time zone NULL
- confirmation_token character varying NULL
- confirmation_sent_at timestamp with time zone NULL
- recovery_token character varying NULL
- recovery_sent_at timestamp with time zone NULL
- email_change_token_new character varying NULL
- email_change character varying NULL
- email_change_sent_at timestamp with time zone NULL
- last_sign_in_at timestamp with time zone NULL
- raw_app_meta_data jsonb NULL
- raw_user_meta_data jsonb NULL
- is_super_admin boolean NULL
- created_at timestamp with time zone NULL
- updated_at timestamp with time zone NULL
- phone text NULL DEFAULT NULL::character varying
- phone_confirmed_at timestamp with time zone NULL
- phone_change text NULL DEFAULT ''::character varying
- phone_change_token character varying NULL DEFAULT ''::character varying
- phone_change_sent_at timestamp with time zone NULL
- confirmed_at timestamp with time zone NULL
- email_change_token_current character varying NULL DEFAULT ''::character varying
- email_change_confirm_status smallint NULL DEFAULT 0
- banned_until timestamp with time zone NULL
- reauthentication_token character varying NULL DEFAULT ''::character varying
- reauthentication_sent_at timestamp with time zone NULL
- is_sso_user boolean NOT NULL DEFAULT false
- deleted_at timestamp with time zone NULL
- is_anonymous boolean NOT NULL DEFAULT false

## public

### public.admin_audit_log
- id uuid NOT NULL DEFAULT gen_random_uuid()
- admin_user_id uuid NOT NULL
- action text NOT NULL
- target_type text NULL
- target_id uuid NULL
- metadata jsonb NULL DEFAULT '{}'::jsonb
- ip_address inet NULL
- user_agent text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.admin_emails
- id uuid NOT NULL DEFAULT gen_random_uuid()
- admin_user_id uuid NOT NULL
- recipient_ids ARRAY NOT NULL
- subject text NOT NULL
- body text NOT NULL
- template_id text NULL
- recipient_count integer NOT NULL DEFAULT 0
- sent_at timestamp with time zone NOT NULL DEFAULT now()

### public.admin_users
- id uuid NOT NULL DEFAULT gen_random_uuid()
- email text NOT NULL
- full_name text NOT NULL
- role text NOT NULL DEFAULT 'support'::text
- is_active boolean NOT NULL DEFAULT true
- last_login_at timestamp with time zone NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.ai_conversations
- id uuid NOT NULL DEFAULT gen_random_uuid()
- user_id uuid NOT NULL
- user_role text NOT NULL
- title text NULL
- context_type text NULL
- is_active boolean NULL DEFAULT true
- message_count integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.ai_messages
- id uuid NOT NULL DEFAULT gen_random_uuid()
- conversation_id uuid NOT NULL
- role text NOT NULL
- content text NOT NULL
- metadata jsonb NULL DEFAULT '{}'::jsonb
- tokens_used integer NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.ai_usage
- id uuid NOT NULL DEFAULT gen_random_uuid()
- user_id uuid NOT NULL
- month text NOT NULL
- total_tokens integer NULL DEFAULT 0
- total_requests integer NULL DEFAULT 0
- total_conversations integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.audit_logs
- id uuid NOT NULL DEFAULT gen_random_uuid()
- actor_id uuid NOT NULL
- target_id uuid NULL
- entity_type text NOT NULL
- action_type text NOT NULL
- metadata jsonb NULL DEFAULT '{}'::jsonb
- before_state jsonb NULL
- after_state jsonb NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.availability
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- day_of_week integer NOT NULL
- start_time time without time zone NOT NULL
- end_time time without time zone NOT NULL
- is_available boolean NOT NULL DEFAULT true
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.blocked_times
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- start_time timestamp with time zone NOT NULL
- end_time timestamp with time zone NOT NULL
- label text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.booking_reschedule_history
- id uuid NOT NULL DEFAULT gen_random_uuid()
- booking_id uuid NOT NULL
- tutor_id uuid NOT NULL
- student_id uuid NULL
- previous_scheduled_at timestamp with time zone NOT NULL
- new_scheduled_at timestamp with time zone NOT NULL
- requested_by text NOT NULL
- reason text NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.bookings
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- service_id uuid NULL
- scheduled_at timestamp with time zone NOT NULL
- duration_minutes integer NOT NULL
- timezone text NOT NULL
- status text NULL DEFAULT 'pending'::text
- payment_status text NULL DEFAULT 'unpaid'::text
- payment_amount integer NULL
- currency text NULL DEFAULT 'USD'::text
- stripe_payment_intent_id text NULL
- meeting_url text NULL
- meeting_id text NULL
- meeting_password text NULL
- student_notes text NULL
- internal_notes text NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- meeting_provider text NULL
- reminder_24h_sent boolean NULL DEFAULT false
- reminder_1h_sent boolean NULL DEFAULT false
- planned_scheduled_at timestamp with time zone NULL
- original_scheduled_at timestamp with time zone NULL
- reschedule_requested_at timestamp with time zone NULL
- reschedule_requested_by text NULL
- reschedule_reason text NULL
- reschedule_count integer NULL DEFAULT 0
- deleted_at timestamp with time zone NULL
- short_code text NULL

### public.calendar_connections
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- provider text NOT NULL
- provider_account_id text NOT NULL
- account_email text NULL
- account_name text NULL
- access_token_encrypted text NOT NULL
- refresh_token_encrypted text NULL
- access_token_expires_at timestamp with time zone NULL
- scope text NULL
- sync_status text NOT NULL DEFAULT 'idle'::text
- last_synced_at timestamp with time zone NULL
- error_message text NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- token_expires_at timestamp with time zone NULL
- sync_enabled boolean NULL DEFAULT true

### public.calendar_events
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- provider text NOT NULL
- provider_account_id text NULL
- provider_event_id text NOT NULL
- calendar_id text NULL
- recurrence_master_id text NULL
- recurrence_instance_start timestamp with time zone NULL
- etag text NULL
- version text NULL
- summary text NULL
- location text NULL
- start_at timestamp with time zone NOT NULL
- end_at timestamp with time zone NOT NULL
- is_all_day boolean NULL DEFAULT false
- status text NULL DEFAULT 'confirmed'::text
- fingerprint_hash text NULL
- last_seen_at timestamp with time zone NULL DEFAULT now()
- deleted_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.calendar_sync_jobs
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- provider text NOT NULL
- job_type text NOT NULL
- status text NOT NULL DEFAULT 'pending'::text
- not_before timestamp with time zone NULL DEFAULT now()
- attempts integer NOT NULL DEFAULT 0
- max_attempts integer NOT NULL DEFAULT 5
- last_error text NULL
- payload jsonb NULL DEFAULT '{}'::jsonb
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.calendar_sync_runs
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- provider text NOT NULL
- sync_type text NOT NULL
- status text NOT NULL DEFAULT 'success'::text
- started_at timestamp with time zone NOT NULL DEFAULT now()
- completed_at timestamp with time zone NULL
- error_message text NULL
- items_fetched integer NULL DEFAULT 0
- items_updated integer NULL DEFAULT 0
- items_deleted integer NULL DEFAULT 0
- sync_token text NULL
- next_page_token text NULL
- metadata jsonb NULL DEFAULT '{}'::jsonb

### public.content_reports
- id uuid NOT NULL DEFAULT gen_random_uuid()
- reporter_id uuid NULL
- reporter_role text NULL
- content_type text NOT NULL
- content_id uuid NOT NULL
- content_preview text NULL
- reported_user_id uuid NULL
- reported_user_role text NULL
- reason text NOT NULL
- description text NULL
- status text NULL DEFAULT 'pending'::text
- priority text NULL DEFAULT 'normal'::text
- resolution_action text NULL
- resolution_notes text NULL
- resolved_by uuid NULL
- resolved_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.conversation_messages
- id uuid NOT NULL DEFAULT gen_random_uuid()
- thread_id uuid NOT NULL
- sender_role text NOT NULL
- content text NOT NULL
- attachments jsonb NULL DEFAULT '[]'::jsonb
- read_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- tutor_id uuid NULL
- student_id uuid NULL
- body text NULL
- read_by_tutor boolean NULL DEFAULT false
- read_by_student boolean NULL DEFAULT false

### public.conversation_threads
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- last_message_preview text NULL
- tutor_unread boolean NULL DEFAULT false
- student_unread boolean NULL DEFAULT false
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- last_message_at timestamp with time zone NULL DEFAULT now()

### public.digital_product_purchases
- id uuid NOT NULL DEFAULT gen_random_uuid()
- product_id uuid NOT NULL
- tutor_id uuid NOT NULL
- customer_email text NOT NULL
- buyer_name text NULL
- download_token text NOT NULL
- download_count integer NULL DEFAULT 0
- download_limit integer NULL DEFAULT 5
- status text NULL DEFAULT 'pending'::text
- stripe_session_id text NULL
- completed_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.digital_products
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- title text NOT NULL
- description text NULL
- price_cents integer NOT NULL DEFAULT 0
- currency text NULL DEFAULT 'USD'::text
- fulfillment_type text NULL DEFAULT 'file'::text
- file_url text NULL
- external_url text NULL
- download_limit integer NULL DEFAULT 5
- stripe_product_id text NULL
- stripe_price_id text NULL
- is_active boolean NULL DEFAULT true
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.email_campaign_recipients
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- campaign_id uuid NOT NULL
- student_id uuid NULL
- student_email text NOT NULL
- student_name text NULL
- personalization_subject text NULL
- personalization_body text NULL
- status text NULL DEFAULT 'pending'::text
- scheduled_for timestamp with time zone NULL
- sent_at timestamp with time zone NULL
- error_message text NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.email_campaigns
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- subject text NOT NULL
- body text NOT NULL
- audience_filter text NOT NULL
- template_id text NULL
- recipient_count integer NULL DEFAULT 0
- status text NULL DEFAULT 'pending'::text
- error_message text NULL
- sent_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- kind text NULL DEFAULT 'broadcast'::text
- scheduled_for timestamp with time zone NULL

### public.email_events
- id uuid NOT NULL DEFAULT gen_random_uuid()
- message_id text NULL
- to_email text NOT NULL
- event_type text NOT NULL
- reason text NULL
- metadata jsonb NULL
- occurred_at timestamp with time zone NULL DEFAULT now()
- created_at timestamp with time zone NULL DEFAULT now()

### public.email_suppressions
- email text NOT NULL
- reason text NULL
- first_seen timestamp with time zone NULL DEFAULT now()
- last_seen timestamp with time zone NULL DEFAULT now()
- last_event_id uuid NULL

### public.grammar_error_categories
- id uuid NOT NULL DEFAULT gen_random_uuid()
- slug text NOT NULL
- label text NOT NULL
- description text NULL
- severity_weight smallint NULL DEFAULT 1
- created_at timestamp with time zone NULL DEFAULT now()

### public.grammar_errors
- id uuid NOT NULL DEFAULT gen_random_uuid()
- message_id uuid NOT NULL
- session_id uuid NOT NULL
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- category_slug text NOT NULL
- original_text text NOT NULL
- corrected_text text NOT NULL
- explanation text NULL
- language text NOT NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.group_session_attendees
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- group_session_id uuid NOT NULL
- student_id uuid NULL
- status text NOT NULL DEFAULT 'registered'::text
- joined_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.group_sessions
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- service_id uuid NULL
- title text NOT NULL
- description text NULL
- scheduled_at timestamp with time zone NOT NULL
- duration_minutes integer NOT NULL
- capacity integer NOT NULL DEFAULT 10
- price_cents integer NOT NULL
- currency text NOT NULL DEFAULT 'USD'::text
- waitlist_enabled boolean NULL DEFAULT true
- meeting_url text NULL
- status text NOT NULL DEFAULT 'draft'::text
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.homework_assignments
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- booking_id uuid NULL
- title text NOT NULL
- instructions text NULL
- status text NOT NULL DEFAULT 'assigned'::text
- due_date timestamp with time zone NULL
- attachments jsonb NOT NULL DEFAULT '[]'::jsonb
- student_notes text NULL
- tutor_notes text NULL
- completed_at timestamp with time zone NULL
- submitted_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- notification_sent_at timestamp with time zone NULL
- reminder_sent_at timestamp with time zone NULL
- source text NULL DEFAULT 'manual'::text
- recording_id uuid NULL
- tutor_reviewed boolean NULL DEFAULT false
- tutor_reviewed_at timestamp with time zone NULL

### public.homework_submissions
- id uuid NOT NULL DEFAULT gen_random_uuid()
- homework_id uuid NOT NULL
- student_id uuid NOT NULL
- text_response text NULL
- audio_url text NULL
- file_attachments jsonb NULL DEFAULT '[]'::jsonb
- submitted_at timestamp with time zone NOT NULL DEFAULT now()
- tutor_feedback text NULL
- reviewed_at timestamp with time zone NULL
- review_status text NULL DEFAULT 'pending'::text
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.impersonation_sessions
- id uuid NOT NULL DEFAULT gen_random_uuid()
- admin_user_id uuid NOT NULL
- tutor_id uuid NOT NULL
- started_at timestamp with time zone NOT NULL DEFAULT now()
- ended_at timestamp with time zone NULL
- reason text NOT NULL
- is_active boolean NOT NULL DEFAULT true

### public.interactive_activities
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- student_id uuid NULL
- lesson_plan_id uuid NULL
- activity_type text NOT NULL
- prompt text NULL
- config jsonb NOT NULL DEFAULT '{}'::jsonb
- is_shareable boolean NULL DEFAULT false
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.invoice_line_items
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- invoice_id uuid NOT NULL
- description text NOT NULL
- quantity integer NOT NULL DEFAULT 1
- unit_amount_cents integer NOT NULL
- discount_cents integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()

### public.invoices
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- student_id uuid NULL
- package_purchase_id uuid NULL
- stripe_invoice_id text NULL
- status text NOT NULL DEFAULT 'draft'::text
- total_due_cents integer NOT NULL DEFAULT 0
- currency text NOT NULL DEFAULT 'USD'::text
- due_date timestamp with time zone NULL
- notes text NULL
- auto_reminder_enabled boolean NULL DEFAULT true
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.learning_goals
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- title text NOT NULL
- description text NULL
- target_date date NULL
- status text NULL DEFAULT 'active'::text
- progress_percentage integer NULL DEFAULT 0
- completed_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.learning_roadmaps
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- title text NULL
- nodes jsonb NULL DEFAULT '[]'::jsonb
- created_at timestamp with time zone NULL DEFAULT now()

### public.learning_stats
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- total_lessons integer NULL DEFAULT 0
- total_minutes integer NULL DEFAULT 0
- lessons_this_month integer NULL DEFAULT 0
- minutes_this_month integer NULL DEFAULT 0
- current_streak integer NULL DEFAULT 0
- longest_streak integer NULL DEFAULT 0
- last_lesson_at timestamp with time zone NULL
- messages_sent integer NULL DEFAULT 0
- homework_completed integer NULL DEFAULT 0
- updated_at timestamp with time zone NULL DEFAULT now()
- practice_sessions_completed integer NULL DEFAULT 0
- practice_minutes integer NULL DEFAULT 0
- practice_messages_sent integer NULL DEFAULT 0

### public.lesson_allowance_periods
- id uuid NOT NULL DEFAULT gen_random_uuid()
- subscription_id uuid NOT NULL
- period_start timestamp with time zone NOT NULL
- period_end timestamp with time zone NOT NULL
- lessons_allocated integer NOT NULL
- lessons_rolled_over integer NOT NULL DEFAULT 0
- lessons_used integer NOT NULL DEFAULT 0
- is_current boolean NOT NULL DEFAULT false
- finalized_at timestamp with time zone NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.lesson_briefings
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- booking_id uuid NOT NULL
- student_summary text NULL
- focus_areas jsonb NULL DEFAULT '[]'::jsonb
- error_patterns jsonb NULL DEFAULT '[]'::jsonb
- suggested_activities jsonb NULL DEFAULT '[]'::jsonb
- sr_items_due integer NULL DEFAULT 0
- sr_items_preview jsonb NULL DEFAULT '[]'::jsonb
- goal_progress jsonb NULL
- engagement_trend text NULL
- engagement_signals jsonb NULL DEFAULT '[]'::jsonb
- lessons_analyzed integer NULL DEFAULT 0
- last_lesson_summary text NULL
- last_lesson_date timestamp with time zone NULL
- proficiency_level text NULL
- native_language text NULL
- target_language text NULL
- generated_at timestamp with time zone NULL DEFAULT now()
- viewed_at timestamp with time zone NULL
- dismissed_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.lesson_deliveries
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- booking_id uuid NOT NULL
- package_purchase_id uuid NULL
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- tutor_ack boolean NOT NULL DEFAULT false
- student_ack boolean NOT NULL DEFAULT false
- auto_completed_at timestamp with time zone NULL
- disputed boolean NOT NULL DEFAULT false
- dispute_reason text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.lesson_drills
- id uuid NOT NULL DEFAULT gen_random_uuid()
- recording_id uuid NULL
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- content jsonb NOT NULL
- is_completed boolean NULL DEFAULT false
- completed_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- booking_id uuid NULL
- due_date timestamp with time zone NULL
- homework_assignment_id uuid NULL
- status text NULL DEFAULT 'pending'::text
- drill_type text NULL DEFAULT 'pronunciation'::text
- source text NULL DEFAULT 'manual'::text
- tutor_approved boolean NULL DEFAULT false
- tutor_approved_at timestamp with time zone NULL
- visible_to_student boolean NULL DEFAULT true

### public.lesson_notes
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- booking_id uuid NOT NULL
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- notes text NOT NULL
- homework text NULL
- topics_covered ARRAY NULL
- vocabulary_words ARRAY NULL
- student_performance text NULL
- areas_to_focus ARRAY NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.lesson_recordings
- id uuid NOT NULL DEFAULT gen_random_uuid()
- booking_id uuid NULL
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- storage_path text NOT NULL
- duration_seconds integer NULL
- transcript_json jsonb NULL
- status text NULL DEFAULT 'processing'::text
- created_at timestamp with time zone NULL DEFAULT now()
- egress_id text NULL
- ai_summary_md text NULL
- ai_summary text NULL
- notes text NULL
- summary_md text NULL
- analysis_md text NULL
- tutor_notified_at timestamp with time zone NULL
- tutor_reviewed_at timestamp with time zone NULL
- code_switching_metrics jsonb NULL
- detected_languages ARRAY NULL

### public.lesson_subscription_redemptions
- id uuid NOT NULL DEFAULT gen_random_uuid()
- period_id uuid NOT NULL
- booking_id uuid NOT NULL
- lessons_redeemed integer NOT NULL DEFAULT 1
- refunded_at timestamp with time zone NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.lesson_subscription_templates
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- service_id uuid NOT NULL
- lessons_per_month integer NOT NULL
- template_tier text NOT NULL
- price_cents integer NOT NULL
- currency text NOT NULL DEFAULT 'USD'::text
- stripe_product_id text NULL
- stripe_price_id text NULL
- max_rollover_lessons integer NULL
- is_active boolean NOT NULL DEFAULT true
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.lesson_subscriptions
- id uuid NOT NULL DEFAULT gen_random_uuid()
- template_id uuid NOT NULL
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- stripe_subscription_id text NOT NULL
- stripe_customer_id text NOT NULL
- status text NOT NULL DEFAULT 'active'::text
- current_period_start timestamp with time zone NOT NULL
- current_period_end timestamp with time zone NOT NULL
- cancel_at_period_end boolean NOT NULL DEFAULT false
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.lifetime_purchases
- id uuid NOT NULL DEFAULT gen_random_uuid()
- email text NOT NULL
- stripe_session_id text NOT NULL
- stripe_customer_id text NULL
- amount_paid integer NULL
- currency text NULL
- purchased_at timestamp with time zone NOT NULL DEFAULT now()
- claimed boolean NOT NULL DEFAULT false
- claimed_by uuid NULL
- claimed_at timestamp with time zone NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- source text NULL DEFAULT 'unknown'::text

### public.link_events
- id uuid NOT NULL DEFAULT gen_random_uuid()
- link_id uuid NOT NULL
- tutor_id uuid NOT NULL
- clicked_at timestamp with time zone NULL DEFAULT now()
- user_agent text NULL
- referer text NULL
- ip_hash text NULL

### public.links
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- title text NOT NULL
- description text NULL
- url text NOT NULL
- icon text NULL
- button_style text NULL DEFAULT 'default'::text
- sort_order integer NULL DEFAULT 0
- is_visible boolean NULL DEFAULT true
- click_count integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.marketing_clips
- id uuid NOT NULL DEFAULT gen_random_uuid()
- recording_id uuid NULL
- tutor_id uuid NOT NULL
- storage_path text NOT NULL
- transcript_snippet text NULL
- viral_score double precision NULL
- tutor_approved boolean NULL DEFAULT false
- created_at timestamp with time zone NULL DEFAULT now()
- title text NULL
- slug text NULL
- topic text NULL
- is_public boolean NULL DEFAULT false
- views integer NULL DEFAULT 0
- start_time double precision NULL
- end_time double precision NULL

### public.marketplace_orders
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- marketplace_resource_id uuid NOT NULL
- buyer_id uuid NULL
- price_paid_cents integer NOT NULL
- currency text NOT NULL DEFAULT 'USD'::text
- stripe_payment_intent_id text NULL
- status text NOT NULL DEFAULT 'completed'::text
- created_at timestamp with time zone NULL DEFAULT now()

### public.marketplace_resources
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- resource_id uuid NULL
- title text NOT NULL
- description text NULL
- price_cents integer NOT NULL
- currency text NOT NULL DEFAULT 'USD'::text
- status text NOT NULL DEFAULT 'draft'::text
- preview_url text NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.moderation_actions
- id uuid NOT NULL DEFAULT gen_random_uuid()
- report_id uuid NULL
- admin_id uuid NULL
- action text NOT NULL
- previous_value text NULL
- new_value text NULL
- notes text NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.notification_preferences
- id uuid NOT NULL DEFAULT gen_random_uuid()
- user_id uuid NOT NULL
- notification_type text NOT NULL
- in_app boolean NULL DEFAULT true
- email boolean NULL DEFAULT true
- push boolean NULL DEFAULT false
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.notifications
- id uuid NOT NULL DEFAULT gen_random_uuid()
- user_id uuid NOT NULL
- user_role text NOT NULL
- type text NOT NULL
- title text NOT NULL
- body text NULL
- icon text NULL
- link text NULL
- metadata jsonb NULL DEFAULT '{}'::jsonb
- read boolean NULL DEFAULT false
- read_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.page_views
- id uuid NOT NULL DEFAULT gen_random_uuid()
- page_path text NOT NULL
- user_id uuid NULL
- user_type text NULL
- session_id text NOT NULL
- referrer text NULL
- user_agent text NULL
- ip_hash inet NULL
- device_type text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.payment_reminders
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- invoice_id uuid NOT NULL
- send_at timestamp with time zone NOT NULL
- channel text NOT NULL
- status text NOT NULL DEFAULT 'scheduled'::text
- sent_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.payments_audit
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- student_id uuid NULL
- booking_id uuid NULL
- digital_product_purchase_id uuid NULL
- amount_cents integer NOT NULL
- currency text NOT NULL
- application_fee_cents integer NULL
- net_amount_cents integer NULL
- stripe_payment_intent_id text NULL
- stripe_charge_id text NULL
- destination_account_id text NULL
- payment_type text NOT NULL DEFAULT 'booking'::text
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.phonetic_errors
- id uuid NOT NULL DEFAULT gen_random_uuid()
- message_id uuid NOT NULL
- session_id uuid NOT NULL
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- misspelled_word text NOT NULL
- intended_word text NOT NULL
- phonetic_pattern text NULL
- language text NOT NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.plan_change_history
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- previous_plan text NULL
- new_plan text NULL
- change_type text NOT NULL
- changed_by uuid NULL
- notes text NULL
- stripe_event_id text NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.plan_overrides
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- override_type text NOT NULL
- plan_name text NULL
- original_plan text NULL
- max_students integer NULL
- features_enabled ARRAY NULL
- starts_at timestamp with time zone NULL DEFAULT now()
- expires_at timestamp with time zone NULL
- is_active boolean NULL DEFAULT true
- reason text NULL
- created_by uuid NULL
- notes text NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.platform_config
- key text NOT NULL
- value jsonb NOT NULL
- description text NULL
- category text NULL DEFAULT 'general'::text
- updated_by uuid NULL
- updated_at timestamp with time zone NULL DEFAULT now()
- created_at timestamp with time zone NULL DEFAULT now()

### public.practice_assignments
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- scenario_id uuid NULL
- title text NOT NULL
- instructions text NULL
- status text NULL DEFAULT 'assigned'::text
- due_date timestamp with time zone NULL
- completed_at timestamp with time zone NULL
- sessions_completed integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.practice_block_ledger
- id uuid NOT NULL DEFAULT gen_random_uuid()
- usage_period_id uuid NOT NULL
- blocks_consumed integer NOT NULL DEFAULT 1
- trigger_type text NOT NULL
- usage_at_trigger jsonb NULL
- stripe_usage_record_id text NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.practice_scenarios
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- title text NOT NULL
- description text NULL
- language text NOT NULL
- level text NULL
- topic text NULL
- system_prompt text NOT NULL
- vocabulary_focus ARRAY NULL DEFAULT '{}'::text[]
- grammar_focus ARRAY NULL DEFAULT '{}'::text[]
- example_conversation jsonb NULL
- max_messages integer NULL DEFAULT 20
- is_active boolean NULL DEFAULT true
- is_public boolean NULL DEFAULT false
- times_used integer NULL DEFAULT 0
- avg_rating numeric NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.practice_usage_periods
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- subscription_id text NOT NULL DEFAULT 'freemium'::text
- period_start timestamp with time zone NOT NULL
- period_end timestamp with time zone NOT NULL
- audio_seconds_used integer NOT NULL DEFAULT 0
- text_turns_used integer NOT NULL DEFAULT 0
- blocks_consumed integer NOT NULL DEFAULT 0
- is_free_tier boolean NULL DEFAULT true
- free_audio_seconds integer NULL DEFAULT 2700
- free_text_turns integer NULL DEFAULT 600
- current_tier_price_cents integer NULL DEFAULT 0
- stripe_subscription_id text NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.processed_requests
- id uuid NOT NULL DEFAULT gen_random_uuid()
- idempotency_key text NOT NULL
- status text NULL DEFAULT 'processing'::text
- response_body jsonb NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()
- owner_id text NULL

### public.processed_stripe_events
- event_id text NOT NULL
- event_type text NOT NULL
- processed_at timestamp with time zone NOT NULL DEFAULT now()
- metadata jsonb NULL DEFAULT '{}'::jsonb
- created_at timestamp with time zone NULL DEFAULT now()
- status text NOT NULL DEFAULT 'processed'::text
- processing_started_at timestamp with time zone NULL
- last_error text NULL
- last_error_at timestamp with time zone NULL
- updated_at timestamp with time zone NOT NULL DEFAULT now()
- correlation_id uuid NULL
- livemode boolean NULL
- processing_duration_ms integer NULL

### public.proficiency_assessments
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- skill_area text NOT NULL
- level text NOT NULL
- score integer NULL
- notes text NULL
- assessed_at timestamp with time zone NULL DEFAULT now()
- created_at timestamp with time zone NULL DEFAULT now()

### public.profiles
- id uuid NOT NULL
- email text NOT NULL
- full_name text NULL
- avatar_url text NULL
- role text NOT NULL DEFAULT 'tutor'::text
- username text NULL
- bio text NULL
- tagline text NULL
- languages_taught ARRAY NULL
- timezone text NULL DEFAULT 'UTC'::text
- hourly_rate integer NULL
- currency text NULL DEFAULT 'USD'::text
- website_url text NULL
- twitter_handle text NULL
- linkedin_url text NULL
- youtube_url text NULL
- booking_enabled boolean NULL DEFAULT true
- auto_accept_bookings boolean NULL DEFAULT false
- buffer_time_minutes integer NULL DEFAULT 0
- subscription_status text NULL DEFAULT 'free'::text
- stripe_customer_id text NULL
- stripe_subscription_id text NULL
- onboarding_completed boolean NULL DEFAULT false
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- instagram_handle text NULL
- tiktok_handle text NULL
- payment_instructions text NULL
- venmo_handle text NULL
- paypal_email text NULL
- zelle_phone text NULL
- stripe_payment_link text NULL
- custom_payment_url text NULL
- video_provider text NULL DEFAULT 'none'::text
- zoom_personal_link text NULL
- google_meet_link text NULL
- calendly_link text NULL
- custom_video_url text NULL
- custom_video_name text NULL
- auto_welcome_enabled boolean NULL DEFAULT true
- auto_reengage_enabled boolean NULL DEFAULT false
- auto_reengage_days integer NULL DEFAULT 30
- booking_currency text NULL DEFAULT 'USD'::text
- stripe_account_id text NULL
- stripe_charges_enabled boolean NOT NULL DEFAULT false
- stripe_payouts_enabled boolean NOT NULL DEFAULT false
- stripe_onboarding_status text NOT NULL DEFAULT 'pending'::text
- stripe_default_currency text NULL
- stripe_country text NULL
- stripe_last_capability_check_at timestamp with time zone NULL
- onboarding_step integer NULL DEFAULT 0
- account_status text NULL DEFAULT 'active'::text
- suspended_at timestamp with time zone NULL
- suspended_by uuid NULL
- suspension_reason text NULL
- deactivated_at timestamp with time zone NULL
- last_login_at timestamp with time zone NULL
- facebook_handle text NULL
- x_handle text NULL
- microsoft_teams_link text NULL
- tier USER-DEFINED NULL DEFAULT 'standard'::tier_type
- ai_credits_used integer NULL DEFAULT 0
- custom_domain text NULL
- brand_color text NULL DEFAULT '#000000'::text
- plan text NULL DEFAULT 'professional'::text
- auto_homework_approval text NULL DEFAULT 'require_approval'::text
- stripe_disabled_reason text NULL
- stripe_currently_due ARRAY NULL
- stripe_eventually_due ARRAY NULL
- stripe_past_due ARRAY NULL
- stripe_pending_verification ARRAY NULL
- stripe_details_submitted boolean NULL DEFAULT false
- advance_booking_days_min integer NULL DEFAULT 1
- advance_booking_days_max integer NULL DEFAULT 60
- max_lessons_per_day integer NULL
- max_lessons_per_week integer NULL
- terms_accepted_at timestamp with time zone NULL
- tutor_recording_consent boolean NULL DEFAULT false
- tutor_recording_consent_at timestamp with time zone NULL

### public.pronunciation_assessments
- id uuid NOT NULL DEFAULT gen_random_uuid()
- session_id uuid NULL
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- audio_duration_seconds numeric NOT NULL
- transcript text NULL
- accuracy_score numeric NULL
- fluency_score numeric NULL
- pronunciation_score numeric NULL
- completeness_score numeric NULL
- word_scores jsonb NULL
- problem_phonemes jsonb NULL
- cost_cents integer NOT NULL DEFAULT 0
- language text NOT NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.rate_limit_events
- id bigint NOT NULL DEFAULT nextval('rate_limit_events_id_seq'::regclass)
- key text NOT NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.refund_requests
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- student_id uuid NULL
- booking_id uuid NULL
- payments_audit_id uuid NULL
- amount_cents integer NOT NULL
- currency text NOT NULL DEFAULT 'USD'::text
- reason text NULL
- status text NULL DEFAULT 'requested'::text
- actor_requested text NOT NULL
- processed_by_user_id uuid NULL
- processed_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.reviews
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- review_request_id uuid NULL
- rating smallint NOT NULL
- title text NULL
- body text NULL
- is_published boolean NULL DEFAULT true
- social_asset_url text NULL
- published_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.services
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- name text NOT NULL
- description text NULL
- duration_minutes integer NOT NULL DEFAULT 60
- price integer NOT NULL DEFAULT 0
- currency text NOT NULL DEFAULT 'USD'::text
- is_active boolean NULL DEFAULT true
- requires_approval boolean NULL DEFAULT false
- max_students_per_session integer NULL DEFAULT 1
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- offer_type text NOT NULL DEFAULT 'one_off'::text
- price_amount integer NOT NULL DEFAULT 0
- price_currency text NOT NULL DEFAULT 'USD'::text
- subscriptions_enabled boolean NOT NULL DEFAULT false
- deleted_at timestamp with time zone NULL

### public.session_package_purchases
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- template_id uuid NOT NULL
- tutor_id uuid NOT NULL
- student_id uuid NOT NULL
- stripe_checkout_session_id text NULL
- stripe_invoice_id text NULL
- total_minutes integer NOT NULL
- remaining_minutes integer NOT NULL
- status text NOT NULL DEFAULT 'active'::text
- expires_at timestamp with time zone NULL
- purchased_at timestamp with time zone NULL DEFAULT now()
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- package_id uuid NOT NULL

### public.session_package_redemptions
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- purchase_id uuid NOT NULL
- booking_id uuid NULL
- minutes_redeemed integer NOT NULL
- source text NULL DEFAULT 'booking'::text
- status text NOT NULL DEFAULT 'applied'::text
- created_at timestamp with time zone NULL DEFAULT now()

### public.session_package_templates
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- service_id uuid NULL
- name text NOT NULL
- description text NULL
- session_count integer NULL
- total_minutes integer NOT NULL
- price_cents integer NOT NULL
- currency text NOT NULL DEFAULT 'USD'::text
- stripe_price_id text NULL
- is_active boolean NULL DEFAULT true
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- stripe_product_id text NULL

### public.student_engagement_score_queue
- id bigint NOT NULL DEFAULT nextval('student_engagement_score_queue_id_seq'::regclass)
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- reason text NULL
- queued_at timestamp with time zone NULL DEFAULT now()

### public.student_engagement_scores
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- score integer NULL DEFAULT 100
- lesson_frequency_score integer NULL DEFAULT 100
- response_rate_score integer NULL DEFAULT 100
- homework_completion_score integer NULL DEFAULT 100
- practice_engagement_score integer NULL DEFAULT 100
- risk_status text NULL DEFAULT 'healthy'::text
- risk_status_override text NULL
- override_reason text NULL
- override_at timestamp with time zone NULL
- override_by uuid NULL
- days_since_last_lesson integer NULL
- days_since_last_message integer NULL
- last_computed_at timestamp with time zone NULL DEFAULT now()
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.student_grammar_patterns
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- category_slug text NOT NULL
- language text NOT NULL
- error_count integer NULL DEFAULT 0
- last_error_at timestamp with time zone NULL
- first_error_at timestamp with time zone NULL
- trend text NULL
- updated_at timestamp with time zone NULL DEFAULT now()

### public.student_onboarding_progress
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- template_id uuid NULL
- completed_items ARRAY NULL DEFAULT '{}'::text[]
- status text NULL DEFAULT 'not_started'::text
- started_at timestamp with time zone NULL
- completed_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.student_onboarding_templates
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- name text NOT NULL DEFAULT 'Default'::text
- is_default boolean NULL DEFAULT false
- items jsonb NOT NULL DEFAULT '[]'::jsonb
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.student_practice_messages
- id uuid NOT NULL DEFAULT gen_random_uuid()
- session_id uuid NOT NULL
- role text NOT NULL
- content text NOT NULL
- corrections jsonb NULL
- vocabulary_used ARRAY NULL
- tokens_used integer NULL
- created_at timestamp with time zone NULL DEFAULT now()
- grammar_errors jsonb NULL
- phonetic_errors jsonb NULL
- has_audio boolean NULL DEFAULT false

### public.student_practice_sessions
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- assignment_id uuid NULL
- scenario_id uuid NULL
- language text NOT NULL
- level text NULL
- topic text NULL
- message_count integer NULL DEFAULT 0
- tokens_used integer NULL DEFAULT 0
- estimated_cost_cents integer NULL DEFAULT 0
- duration_seconds integer NULL
- ai_feedback jsonb NULL
- student_rating integer NULL
- started_at timestamp with time zone NULL DEFAULT now()
- ended_at timestamp with time zone NULL
- grammar_errors_count integer NULL DEFAULT 0
- phonetic_errors_count integer NULL DEFAULT 0
- has_audio_input boolean NULL DEFAULT false

### public.student_practice_summaries
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- total_sessions integer NULL DEFAULT 0
- completed_sessions integer NULL DEFAULT 0
- total_messages_sent integer NULL DEFAULT 0
- total_practice_minutes integer NULL DEFAULT 0
- total_grammar_errors integer NULL DEFAULT 0
- top_grammar_issues jsonb NULL
- total_audio_assessments integer NULL DEFAULT 0
- avg_pronunciation_score numeric NULL
- avg_fluency_score numeric NULL
- total_phonetic_errors integer NULL DEFAULT 0
- unique_vocabulary_used integer NULL DEFAULT 0
- vocabulary_words jsonb NULL
- avg_session_rating numeric NULL
- current_streak_days integer NULL DEFAULT 0
- longest_streak_days integer NULL DEFAULT 0
- last_practice_at timestamp with time zone NULL
- weekly_activity jsonb NULL
- monthly_progress jsonb NULL
- updated_at timestamp with time zone NULL DEFAULT now()

### public.student_preferences
- id uuid NOT NULL DEFAULT gen_random_uuid()
- user_id uuid NOT NULL
- timezone text NULL DEFAULT 'UTC'::text
- preferred_language text NULL DEFAULT 'en'::text
- notification_sound boolean NULL DEFAULT true
- theme text NULL DEFAULT 'system'::text
- avatar_url text NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.student_timeline_events
- id uuid NOT NULL DEFAULT gen_random_uuid()
- student_id uuid NOT NULL
- tutor_id uuid NOT NULL
- event_type text NOT NULL
- event_title text NOT NULL
- event_description text NULL
- event_metadata jsonb NULL DEFAULT '{}'::jsonb
- related_booking_id uuid NULL
- related_homework_id uuid NULL
- related_message_id uuid NULL
- visible_to_student boolean NULL DEFAULT false
- is_milestone boolean NULL DEFAULT false
- event_at timestamp with time zone NULL DEFAULT now()
- created_at timestamp with time zone NULL DEFAULT now()

### public.student_tutor_connections
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- student_user_id uuid NOT NULL
- tutor_id uuid NOT NULL
- status text NOT NULL DEFAULT 'pending'::text
- initial_message text NULL
- tutor_notes text NULL
- requested_at timestamp with time zone NOT NULL DEFAULT now()
- resolved_at timestamp with time zone NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### public.students
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- full_name text NOT NULL
- email text NOT NULL
- phone text NULL
- proficiency_level text NULL
- learning_goals text NULL
- native_language text NULL
- notes text NULL
- status text NULL DEFAULT 'active'::text
- user_id uuid NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- email_opt_out boolean NULL DEFAULT false
- email_unsubscribe_token uuid NULL DEFAULT gen_random_uuid()
- last_reengage_email_at timestamp with time zone NULL
- email_booking_reminders boolean NULL DEFAULT true
- email_lesson_updates boolean NULL DEFAULT true
- email_marketing boolean NULL DEFAULT false
- labels ARRAY NULL DEFAULT '{}'::text[]
- ai_practice_free_tier_enabled boolean NULL DEFAULT false
- ai_practice_free_tier_started_at timestamp with time zone NULL
- ai_practice_enabled boolean NULL DEFAULT false
- ai_practice_subscription_id text NULL
- ai_practice_customer_id text NULL
- ai_practice_current_period_end timestamp with time zone NULL
- ai_audio_enabled boolean NULL DEFAULT false
- ai_audio_seconds_limit integer NULL DEFAULT 60
- timezone text NULL
- calendar_access_status text NULL DEFAULT 'pending'::text
- source text NULL DEFAULT 'manual'::text
- target_language text NULL
- onboarding_status text NULL DEFAULT 'not_started'::text
- onboarding_completed_at timestamp with time zone NULL
- engagement_score integer NULL DEFAULT 100
- risk_status text NULL DEFAULT 'healthy'::text
- last_activity_at timestamp with time zone NULL
- first_lesson_at timestamp with time zone NULL
- deleted_at timestamp with time zone NULL

### public.subscriptions
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- user_id uuid NOT NULL
- stripe_subscription_id text NOT NULL
- stripe_customer_id text NOT NULL
- stripe_price_id text NOT NULL
- status text NOT NULL
- plan_name text NOT NULL
- current_period_start timestamp with time zone NOT NULL
- current_period_end timestamp with time zone NOT NULL
- cancel_at_period_end boolean NULL DEFAULT false
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### public.support_tickets
- id uuid NOT NULL DEFAULT gen_random_uuid()
- user_id uuid NOT NULL
- submitted_by_role text NOT NULL DEFAULT 'tutor'::text
- subject text NOT NULL
- message text NOT NULL
- category text NULL DEFAULT 'general'::text
- status text NOT NULL DEFAULT 'open'::text
- tutor_id uuid NULL
- student_id uuid NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()
- resolved_at timestamp with time zone NULL

### public.system_error_log
- id uuid NOT NULL DEFAULT gen_random_uuid()
- error_type text NOT NULL
- error_code text NULL
- message text NOT NULL
- stack_trace text NULL
- context jsonb NULL DEFAULT '{}'::jsonb
- severity text NULL DEFAULT 'error'::text
- resolved_at timestamp with time zone NULL
- resolved_by uuid NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### public.system_metrics
- id uuid NOT NULL DEFAULT gen_random_uuid()
- metric_type text NOT NULL
- metric_name text NOT NULL
- value numeric NOT NULL
- metadata jsonb NULL DEFAULT '{}'::jsonb
- recorded_at timestamp with time zone NOT NULL DEFAULT now()

### public.system_metrics_hourly
- id uuid NOT NULL DEFAULT gen_random_uuid()
- metric_type text NOT NULL
- metric_name text NOT NULL
- hour_start timestamp with time zone NOT NULL
- count integer NOT NULL DEFAULT 0
- sum_value numeric NULL DEFAULT 0
- avg_value numeric NULL DEFAULT 0
- min_value numeric NULL
- max_value numeric NULL
- p50_value numeric NULL
- p95_value numeric NULL
- p99_value numeric NULL
- created_at timestamp with time zone NULL DEFAULT now()

### public.system_status
- id text NOT NULL
- status text NOT NULL DEFAULT 'operational'::text
- message text NULL
- last_check_at timestamp with time zone NULL DEFAULT now()
- last_error text NULL
- consecutive_failures integer NULL DEFAULT 0
- updated_at timestamp with time zone NULL DEFAULT now()

### public.tutor_reengagement_emails
- id uuid NOT NULL DEFAULT gen_random_uuid()
- tutor_id uuid NOT NULL
- admin_user_id uuid NULL
- template_id text NOT NULL
- sent_at timestamp with time zone NOT NULL DEFAULT now()
- metadata jsonb NULL DEFAULT '{}'::jsonb

### public.tutor_site_resources
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_site_id uuid NOT NULL
- label text NOT NULL
- url text NOT NULL
- sort_order integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()

### public.tutor_site_reviews
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_site_id uuid NOT NULL
- author_name text NOT NULL
- quote text NOT NULL
- sort_order integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()
- student_id uuid NULL
- review_id uuid NULL
- rating smallint NULL

### public.tutor_site_services
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_site_id uuid NOT NULL
- service_id uuid NOT NULL
- sort_order integer NULL DEFAULT 0
- created_at timestamp with time zone NULL DEFAULT now()

### public.tutor_sites
- id uuid NOT NULL DEFAULT uuid_generate_v4()
- tutor_id uuid NOT NULL
- about_title text NULL
- about_subtitle text NULL
- about_body text NULL
- theme_background text NULL DEFAULT '#ffffff'::text
- theme_primary text NULL DEFAULT '#2563eb'::text
- theme_font text NULL DEFAULT 'system'::text
- theme_spacing text NULL DEFAULT 'comfortable'::text
- show_about boolean NULL DEFAULT true
- show_lessons boolean NULL DEFAULT true
- show_reviews boolean NULL DEFAULT true
- show_resources boolean NULL DEFAULT false
- show_contact boolean NULL DEFAULT false
- contact_cta_label text NULL
- contact_cta_url text NULL
- status text NULL DEFAULT 'draft'::text
- published_at timestamp with time zone NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- pinned_review_id uuid NULL
- show_hero boolean NULL DEFAULT true
- show_gallery boolean NULL DEFAULT true
- config jsonb NOT NULL DEFAULT '{}'::jsonb

### public.tutor_status_history
- id uuid NOT NULL DEFAULT gen_random_uuid()
- profile_id uuid NOT NULL
- previous_status text NULL
- new_status text NOT NULL
- reason text NULL
- changed_by uuid NULL
- changed_at timestamp with time zone NOT NULL DEFAULT now()

## realtime

### realtime.messages
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_15
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_16
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_17
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_18
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_19
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_20
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.messages_2026_01_21
- topic text NOT NULL
- extension text NOT NULL
- payload jsonb NULL
- event text NULL
- private boolean NULL DEFAULT false
- updated_at timestamp without time zone NOT NULL DEFAULT now()
- inserted_at timestamp without time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()

### realtime.schema_migrations
- version bigint NOT NULL
- inserted_at timestamp without time zone NULL

### realtime.subscription
- id bigint NOT NULL
- subscription_id uuid NOT NULL
- entity regclass NOT NULL
- filters ARRAY NOT NULL DEFAULT '{}'::realtime.user_defined_filter[]
- claims jsonb NOT NULL
- claims_role regrole NOT NULL
- created_at timestamp without time zone NOT NULL DEFAULT timezone('utc'::text, now())

## storage

### storage.buckets
- id text NOT NULL
- name text NOT NULL
- owner uuid NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- public boolean NULL DEFAULT false
- avif_autodetection boolean NULL DEFAULT false
- file_size_limit bigint NULL
- allowed_mime_types ARRAY NULL
- owner_id text NULL
- type USER-DEFINED NOT NULL DEFAULT 'STANDARD'::storage.buckettype

### storage.buckets_analytics
- name text NOT NULL
- type USER-DEFINED NOT NULL DEFAULT 'ANALYTICS'::storage.buckettype
- format text NOT NULL DEFAULT 'ICEBERG'::text
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()
- id uuid NOT NULL DEFAULT gen_random_uuid()
- deleted_at timestamp with time zone NULL

### storage.buckets_vectors
- id text NOT NULL
- type USER-DEFINED NOT NULL DEFAULT 'VECTOR'::storage.buckettype
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

### storage.migrations
- id integer NOT NULL
- name character varying NOT NULL
- hash character varying NOT NULL
- executed_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP

### storage.objects
- id uuid NOT NULL DEFAULT gen_random_uuid()
- bucket_id text NULL
- name text NULL
- owner uuid NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()
- last_accessed_at timestamp with time zone NULL DEFAULT now()
- metadata jsonb NULL
- path_tokens ARRAY NULL
- version text NULL
- owner_id text NULL
- user_metadata jsonb NULL
- level integer NULL

### storage.prefixes
- bucket_id text NOT NULL
- name text NOT NULL
- level integer NOT NULL
- created_at timestamp with time zone NULL DEFAULT now()
- updated_at timestamp with time zone NULL DEFAULT now()

### storage.s3_multipart_uploads
- id text NOT NULL
- in_progress_size bigint NOT NULL DEFAULT 0
- upload_signature text NOT NULL
- bucket_id text NOT NULL
- key text NOT NULL
- version text NOT NULL
- owner_id text NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- user_metadata jsonb NULL

### storage.s3_multipart_uploads_parts
- id uuid NOT NULL DEFAULT gen_random_uuid()
- upload_id text NOT NULL
- size bigint NOT NULL DEFAULT 0
- part_number integer NOT NULL
- bucket_id text NOT NULL
- key text NOT NULL
- etag text NOT NULL
- owner_id text NULL
- version text NOT NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()

### storage.vector_indexes
- id text NOT NULL DEFAULT gen_random_uuid()
- name text NOT NULL
- bucket_id text NOT NULL
- data_type text NOT NULL
- dimension integer NOT NULL
- distance_metric text NOT NULL
- metadata_configuration jsonb NULL
- created_at timestamp with time zone NOT NULL DEFAULT now()
- updated_at timestamp with time zone NOT NULL DEFAULT now()

## supabase_migrations

### supabase_migrations.schema_migrations
- version text NOT NULL
- statements ARRAY NULL
- name text NULL
- created_by text NULL
- idempotency_key text NULL
- rollback ARRAY NULL

## vault

### vault.secrets
- id uuid NOT NULL DEFAULT gen_random_uuid()
- name text NULL
- description text NOT NULL DEFAULT ''::text
- secret text NOT NULL
- key_id uuid NULL
- nonce bytea NULL DEFAULT vault._crypto_aead_det_noncegen()
- created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
