# Archived Migrations

This directory contains historical migrations that were previously stored in:
- `/migrations/` (root level)
- `/app/supabase/migrations/`

These migrations predate the current `supabase/migrations/` directory structure and were consolidated here on 2025-12-03 as part of a security and data integrity remediation effort.

## Important Notes

1. **Do NOT move these to `/supabase/migrations/`** - The Supabase CLI tracks applied migrations in the `supabase_migrations` table. Moving these would cause conflicts or re-application attempts.

2. **These migrations are likely already applied** - The schema changes in these files are already present in the database. They are kept here for reference and audit purposes.

3. **RLS policies may be duplicated** - Several files contain RLS policies that are also defined in the main migrations. The main `/supabase/migrations/` folder contains the authoritative versions.

## Files in This Archive

### From `/migrations/` (root)
- `20251105090049_add_payment_instructions.sql` - Payment instruction fields for profiles
- `20251105120000_add_video_conferencing_fields.sql` - Video conferencing fields

### From `/app/supabase/migrations/`
- `20251105130000_add_reminder_fields.sql` - Booking reminder tracking
- `20251105140000_add_student_access_control.sql` - Student access control
- `20251106000000_update_rls_with_check_clauses.sql` - RLS policy updates (comprehensive)
- `20250106090000_add_launch_sprint_fields.sql` - Launch sprint fields
- `20250106103000_create_email_campaigns.sql` - Email campaigns table
- `20250106120000_email_preferences_and_queue.sql` - Email preferences
- `20250106133000_create_conversations.sql` - Conversation threads/messages
- `20250106140000_create_digital_products.sql` - Digital products tables
- `20251113113000_update_student_status_enum.sql` - Student status constraint

## Active Migrations

All active migrations are now in `/supabase/migrations/`. This is the only directory the Supabase CLI should read from.
