# 01 - Database Schema

## Objective

Design and implement a multi-tenant database schema for the language tutor platform with proper security via Row Level Security (RLS). This schema supports tutors, students, services, bookings, and all core features.

## Prerequisites

- Completed **00-project-setup.md**
- Supabase project created and accessible
- Understanding of PostgreSQL basics

## Schema Overview

Our platform uses a multi-tenant architecture where:
- Each **tutor** has their own space with students, services, bookings
- **Row Level Security (RLS)** ensures tutors only see their own data
- **Students** can see only their own bookings and progress
- **Public data** (tutor profiles, services) is accessible for booking

## Core Tables

**Professional Plan (MVP)**
1. **profiles** - Extended user data (tutors and students)
2. **services** - Lesson types offered by tutors
3. **bookings** - Scheduled sessions between tutors and students
4. **students** - Student records managed by tutors
5. **lesson_notes** - Post-session notes and progress tracking
6. **availability** - Tutor schedule and availability slots
7. **subscriptions** - Stripe subscription tracking
8. **links** - Link-in-bio functionality

**Professional Enhancements**
- **session_package_templates / purchases / redemptions** - Track prepaid bundles and redemption history
- **invoices / invoice_line_items / payment_reminders** - Automated billing and reminder cadence
- **review_requests / reviews** - Verified social proof pipeline
- **resources / resource_tags / lesson_plans / lesson_plan_resources / interactive_activities** - Digital classroom, lesson builder, and interactive tools

**Growth Plan**
- **lead_sources / leads / lead_events** - Lead hub and pipeline management
- **ad_accounts / ad_campaigns / ad_creatives / ad_performance_daily** - Growth & Ads Power-Up
- **ai_content_clips / ai_transcripts / ai_transcript_segments / ai_detected_errors** - AI Teaching Assistant data flow

**Studio / Add-Ons**
- **group_sessions / group_session_attendees** - Workshops and group classes
- **marketplace_resources / marketplace_orders** - Shared resource marketplace
- **executive_snapshots** - CEO dashboard metrics

## Implementation Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Enable Required Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram similarity for search (optional but useful)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Step 3: Create Profiles Table

This extends Supabase's built-in `auth.users` table.

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- User type
  role TEXT NOT NULL DEFAULT 'tutor' CHECK (role IN ('tutor', 'student', 'admin')),
  
  -- Tutor-specific fields
  username TEXT UNIQUE,
  bio TEXT,
  tagline TEXT,
  languages_taught TEXT[], -- Array of languages
  timezone TEXT DEFAULT 'UTC',
  hourly_rate INTEGER, -- Stored in cents
  currency TEXT DEFAULT 'USD',

  -- Social links
  website_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  facebook_handle TEXT,
  x_handle TEXT,

  -- Business settings
  booking_enabled BOOLEAN DEFAULT true,
  auto_accept_bookings BOOLEAN DEFAULT false,
  buffer_time_minutes INTEGER DEFAULT 0, -- Time between sessions

  -- Subscription
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'professional' CHECK (plan IN ('professional', 'growth', 'studio')),

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username lookups (for custom subdomains)
CREATE INDEX profiles_username_idx ON profiles(username);

-- Create index for role filtering
CREATE INDEX profiles_role_idx ON profiles(role);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

> **Already created this table in Supabase?** Run the following to add the new social handles:
> ```sql
> ALTER TABLE profiles
>   ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
>   ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
>   ADD COLUMN IF NOT EXISTS facebook_handle TEXT,
>   ADD COLUMN IF NOT EXISTS x_handle TEXT,
>   ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'professional' CHECK (plan IN ('professional', 'growth', 'studio'));
> ```

### Step 4: Create Services Table

```sql
-- Services/lesson types offered by tutors
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Service details
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price INTEGER NOT NULL, -- In cents
  currency TEXT DEFAULT 'USD',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  max_students_per_session INTEGER DEFAULT 1, -- 1 for 1-on-1, >1 for group
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tutor lookup
CREATE INDEX services_tutor_id_idx ON services(tutor_id);

-- Trigger for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 5: Create Students Table

```sql
-- Students managed by tutors (separate from auth.users)
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Student info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Learning details
  proficiency_level TEXT, -- A1, A2, B1, B2, C1, C2
  learning_goals TEXT,
  native_language TEXT,
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  
  -- Connection to auth (optional - if student creates account)
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one student per email per tutor
  UNIQUE(tutor_id, email)
);

-- Index for tutor lookup
CREATE INDEX students_tutor_id_idx ON students(tutor_id);

-- Index for user_id lookup (when student logs in)
CREATE INDEX students_user_id_idx ON students(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 6: Create Bookings Table

```sql
-- Bookings/sessions between tutors and students
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Timing
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'cancelled_by_tutor', 
    'cancelled_by_student', 'completed', 'no_show'
  )),
  
  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'paid', 'refunded'
  )),
  payment_amount INTEGER, -- In cents
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  
  -- Meeting details
  meeting_url TEXT,
  meeting_id TEXT,
  meeting_password TEXT,
  
  -- Notes
  student_notes TEXT, -- Notes from student when booking
  internal_notes TEXT, -- Tutor's private notes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX bookings_tutor_id_idx ON bookings(tutor_id);
CREATE INDEX bookings_student_id_idx ON bookings(student_id);
CREATE INDEX bookings_scheduled_at_idx ON bookings(scheduled_at);
CREATE INDEX bookings_status_idx ON bookings(status);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 7: Create Lesson Notes Table

```sql
-- Post-session notes and progress tracking
CREATE TABLE lesson_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  notes TEXT NOT NULL,
  homework TEXT,
  topics_covered TEXT[],
  vocabulary_words TEXT[],
  
  -- Progress indicators
  student_performance TEXT CHECK (student_performance IN (
    'excellent', 'good', 'needs_improvement'
  )),
  areas_to_focus TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX lesson_notes_booking_id_idx ON lesson_notes(booking_id);
CREATE INDEX lesson_notes_tutor_id_idx ON lesson_notes(tutor_id);
CREATE INDEX lesson_notes_student_id_idx ON lesson_notes(student_id);

-- Trigger for updated_at
CREATE TRIGGER update_lesson_notes_updated_at
  BEFORE UPDATE ON lesson_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 8: Create Availability Table

```sql
-- Tutor availability schedule
CREATE TABLE availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Day of week (0=Sunday, 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Time slots (in tutor's timezone)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tutor + day lookups
CREATE INDEX availability_tutor_day_idx ON availability(tutor_id, day_of_week);

-- Trigger for updated_at
CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calendar connections (Google, Outlook OAuth)
CREATE TABLE calendar_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  provider_account_id TEXT NOT NULL,
  account_email TEXT,
  account_name TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  access_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'healthy', 'error')),
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tutor_id, provider)
);

CREATE INDEX calendar_connections_provider_idx
  ON calendar_connections(tutor_id, provider);

CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 9: Create Links Table (Link-in-Bio)

```sql
-- Link-in-bio functionality
CREATE TABLE links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Link details
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  
  -- Display settings
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Button style
  button_style TEXT DEFAULT 'default' CHECK (button_style IN (
    'default', 'primary', 'secondary', 'outline'
  )),
  
  -- Analytics
  click_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tutor + sort order
CREATE INDEX links_tutor_sort_idx ON links(tutor_id, sort_order);

-- Trigger for updated_at
CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 10: Create Subscriptions Table

```sql
-- Stripe subscription tracking
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe details
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  
  -- Subscription details
  status TEXT NOT NULL CHECK (status IN (
    'active', 'cancelled', 'past_due', 'trialing', 'unpaid'
  )),
  plan_name TEXT NOT NULL, -- 'starter', 'professional', 'studio'
  
  -- Billing
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_stripe_subscription_idx ON subscriptions(stripe_subscription_id);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 11: Session Packages & Billing Automation Tables

```sql
-- Package templates tutors can sell (e.g., 10-hour bundles)
CREATE TABLE session_package_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  session_count INTEGER,
  total_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX session_package_templates_tutor_idx
  ON session_package_templates(tutor_id, is_active);

-- Student purchases of packages
CREATE TABLE session_package_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES session_package_templates(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_invoice_id TEXT,
  total_minutes INTEGER NOT NULL,
  remaining_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'completed', 'refunded', 'expired'
  )),
  expires_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX session_package_purchases_student_idx
  ON session_package_purchases(student_id, status);

-- How package minutes are redeemed per booking
CREATE TABLE session_package_redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID REFERENCES session_package_purchases(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  minutes_redeemed INTEGER NOT NULL,
  source TEXT DEFAULT 'booking' CHECK (source IN ('booking', 'manual_adjustment', 'refund')),
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX session_package_redemptions_purchase_idx
  ON session_package_redemptions(purchase_id);

-- Automated invoicing
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  package_purchase_id UUID REFERENCES session_package_purchases(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'paid', 'overdue', 'void'
  )),
  total_due_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date TIMESTAMPTZ,
  notes TEXT,
  auto_reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX invoices_tutor_status_idx
  ON invoices(tutor_id, status);

CREATE TABLE invoice_line_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_amount_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'skipped', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX payment_reminders_invoice_idx
  ON payment_reminders(invoice_id, status);
```

### Step 12: Reviews & Social Proof Tables

```sql
-- Track when review requests were sent
CREATE TABLE review_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'scheduled', 'sent', 'completed', 'skipped'
  )),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'manual')),
  send_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  review_request_id UUID REFERENCES review_requests(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_published BOOLEAN DEFAULT true,
  social_asset_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX reviews_public_idx
  ON reviews(tutor_id, is_published);
```

### Step 13: Resource Library & Lesson Builder Tables

```sql
CREATE TABLE resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'link', 'video', 'audio', 'activity')),
  storage_path TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared_with_student', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resource_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2563eb'
);

CREATE TABLE resource_tag_map (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES resource_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

CREATE TABLE lesson_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT,
  duration_minutes INTEGER DEFAULT 60,
  ce_fr_level TEXT,
  structure JSONB DEFAULT '[]'::JSONB,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lesson_plan_resources (
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  PRIMARY KEY (lesson_plan_id, resource_id)
);
```

### Step 14: Interactive Classroom Tables

Run these statements after Step 13 so the `lesson_plans` table exists.

```sql
-- Tracks reusable classroom activities that tutors can attach to lesson plans.
CREATE TABLE IF NOT EXISTS interactive_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'sentence_sort', 'categorization', 'image_hotspots', 'flashcards', 'quiz'
  )),
  prompt TEXT,
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_shareable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes for dashboard filters.
CREATE INDEX IF NOT EXISTS interactive_activities_tutor_idx
  ON interactive_activities (tutor_id, activity_type);

CREATE INDEX IF NOT EXISTS interactive_activities_lesson_idx
  ON interactive_activities (lesson_plan_id);

-- Re-use the shared updated_at trigger helper so the timestamp stays fresh.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_interactive_activities_updated_at'
  ) THEN
    CREATE TRIGGER update_interactive_activities_updated_at
      BEFORE UPDATE ON interactive_activities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
```

### Step 15: Lead Capture & Growth Tables

```sql
CREATE TABLE lead_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('meta_form', 'landing_page', 'manual', 'referral', 'other')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  language_interest TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'nurturing', 'booked', 'lost')),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  first_contacted_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX leads_tutor_status_idx
  ON leads(tutor_id, status);

CREATE TABLE lead_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('note', 'email_sent', 'sms_sent', 'booking_created', 'status_changed')),
  payload JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 16: Growth & Ads Tables

```sql
CREATE TABLE ad_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('meta', 'google')),
  external_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  daily_budget_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  targeting JSONB DEFAULT '{}'::JSONB,
  schedule JSONB DEFAULT '{}'::JSONB,
  external_campaign_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_creatives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  headline TEXT,
  primary_text TEXT,
  media_url TEXT,
  call_to_action TEXT,
  external_creative_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_performance_daily (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  spend_cents INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX ad_performance_daily_unique_idx
  ON ad_performance_daily(campaign_id, date);
```

### Step 17: AI Teaching Assistant Tables

```sql
CREATE TABLE ai_transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  session_started_at TIMESTAMPTZ NOT NULL,
  session_ended_at TIMESTAMPTZ,
  transcript JSONB NOT NULL,
  audio_url TEXT,
  created_via TEXT DEFAULT 'chrome_extension' CHECK (created_via IN ('chrome_extension', 'manual_upload')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_transcript_segments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transcript_id UUID REFERENCES ai_transcripts(id) ON DELETE CASCADE NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('tutor', 'student', 'assistant')),
  started_at_ms INTEGER NOT NULL,
  ended_at_ms INTEGER NOT NULL,
  text TEXT NOT NULL,
  detected_language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_detected_errors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transcript_id UUID REFERENCES ai_transcripts(id) ON DELETE CASCADE NOT NULL,
  segment_id UUID REFERENCES ai_transcript_segments(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('grammar', 'pronunciation', 'vocabulary', 'fluency')),
  original_text TEXT,
  correction TEXT,
  notes TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_content_clips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('article', 'video', 'pdf')),
  summary JSONB,
  vocabulary JSONB,
  quiz JSONB,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 18: Group Sessions & Marketplace Tables

```sql
CREATE TABLE group_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  waitlist_enabled BOOLEAN DEFAULT true,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_session_attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_session_id UUID REFERENCES group_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'attended', 'no_show', 'refunded')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketplace_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketplace_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  marketplace_resource_id UUID REFERENCES marketplace_resources(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  price_paid_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 19: Executive Dashboard Tables

```sql
CREATE TABLE executive_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  mrr_cents INTEGER DEFAULT 0,
  arr_cents INTEGER DEFAULT 0,
  churn_rate NUMERIC(5,2),
  retention_rate NUMERIC(5,2),
  active_students INTEGER DEFAULT 0,
  at_risk_students INTEGER DEFAULT 0,
  pipeline_value_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX executive_snapshots_unique_idx
  ON executive_snapshots(tutor_id, snapshot_date);
```

-- Attach updated_at trigger to new tables that include the column
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY[
    'session_package_templates',
    'session_package_purchases',
    'invoices',
    'reviews',
    'resources',
    'lesson_plans',
    'interactive_activities',
    'leads',
    'ad_accounts',
    'ad_campaigns',
    'ad_creatives',
    'ai_transcripts',
    'group_sessions',
    'marketplace_resources'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%1$s_updated_at
       BEFORE UPDATE ON %1$s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      table_name
    );
  END LOOP;
END;
$$;

### Step 20: Setup Row Level Security (RLS)

This is CRITICAL for security in a multi-tenant app.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_package_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_package_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plan_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_detected_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all tutor profiles (public), update only their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (role = 'tutor' OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Services: Public read, tutor-only write
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (is_active = true OR tutor_id = auth.uid());

CREATE POLICY "Tutors can manage own services"
  ON services FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Students: Tutors see their students, students see themselves
CREATE POLICY "Tutors can manage their students"
  ON students FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view their own profile"
  ON students FOR SELECT
  USING (user_id = auth.uid());

-- Bookings: Tutors see their bookings, students see theirs
CREATE POLICY "Tutors can manage their bookings"
  ON bookings FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view their bookings"
  ON bookings FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Lesson Notes: Tutor-only access
CREATE POLICY "Tutors can manage their lesson notes"
  ON lesson_notes FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Availability: Public read, tutor-only write
CREATE POLICY "Availability is viewable by everyone"
  ON availability FOR SELECT
  USING (true);

CREATE POLICY "Tutors can manage their availability"
  ON availability FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Calendar connections: tutors manage their own OAuth tokens
CREATE POLICY "Tutors manage their calendar connections"
  ON calendar_connections FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Links: Public read, tutor-only write
CREATE POLICY "Links are viewable by everyone"
  ON links FOR SELECT
  USING (is_visible = true OR tutor_id = auth.uid());

CREATE POLICY "Tutors can manage their links"
  ON links FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Subscriptions: User can only see their own
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Session Packages
CREATE POLICY "Tutors manage their package templates"
  ON session_package_templates FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage package purchases"
  ON session_package_purchases FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view their package purchases"
  ON session_package_purchases FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage package redemptions"
  ON session_package_redemptions FOR ALL
  USING (
    purchase_id IN (
      SELECT id FROM session_package_purchases
      WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    purchase_id IN (
      SELECT id FROM session_package_purchases
      WHERE tutor_id = auth.uid()
    )
  );

-- Invoices & Reminders
CREATE POLICY "Tutors manage their invoices"
  ON invoices FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view their invoices"
  ON invoices FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage invoice line items"
  ON invoice_line_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage payment reminders"
  ON payment_reminders FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE tutor_id = auth.uid()
    )
  );

-- Reviews
CREATE POLICY "Tutors manage review requests"
  ON review_requests FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage their reviews"
  ON reviews FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view their reviews"
  ON reviews FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Resource Library
CREATE POLICY "Tutors manage their resources"
  ON resources FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view shared resources"
  ON resources FOR SELECT
  USING (
    visibility IN ('shared_with_student', 'public')
    OR tutor_id = auth.uid()
  );

CREATE POLICY "Tutors manage resource tags"
  ON resource_tags FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage resource tag relations"
  ON resource_tag_map FOR ALL
  USING (
    resource_id IN (
      SELECT id FROM resources WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    resource_id IN (
      SELECT id FROM resources WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage lesson plans"
  ON lesson_plans FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view shared lesson plans"
  ON lesson_plans FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
    OR tutor_id = auth.uid()
  );

CREATE POLICY "Tutors manage lesson plan resources"
  ON lesson_plan_resources FOR ALL
  USING (
    lesson_plan_id IN (
      SELECT id FROM lesson_plans WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    lesson_plan_id IN (
      SELECT id FROM lesson_plans WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage interactive activities"
  ON interactive_activities FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Leads & Growth
CREATE POLICY "Tutors manage their lead sources"
  ON lead_sources FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage their leads"
  ON leads FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage lead events"
  ON lead_events FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE tutor_id = auth.uid()
    )
  );

-- Ads
CREATE POLICY "Tutors manage ad accounts"
  ON ad_accounts FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage ad campaigns"
  ON ad_campaigns FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage ad creatives"
  ON ad_creatives FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors view ad performance"
  ON ad_performance_daily FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns WHERE tutor_id = auth.uid()
    )
  );

-- AI Teaching Assistant
CREATE POLICY "Tutors manage AI transcripts"
  ON ai_transcripts FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students view their AI transcripts"
  ON ai_transcripts FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage transcript segments"
  ON ai_transcript_segments FOR ALL
  USING (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage detected errors"
  ON ai_detected_errors FOR ALL
  USING (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    transcript_id IN (
      SELECT id FROM ai_transcripts WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage AI content clips"
  ON ai_content_clips FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Group Sessions & Marketplace
CREATE POLICY "Tutors manage group sessions"
  ON group_sessions FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Students can view group sessions"
  ON group_sessions FOR SELECT
  USING (status = 'published');

CREATE POLICY "Tutors manage group attendees"
  ON group_session_attendees FOR ALL
  USING (
    group_session_id IN (
      SELECT id FROM group_sessions WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    group_session_id IN (
      SELECT id FROM group_sessions WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students view their group attendance"
  ON group_session_attendees FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors manage marketplace resources"
  ON marketplace_resources FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors manage marketplace orders"
  ON marketplace_orders FOR ALL
  USING (
    marketplace_resource_id IN (
      SELECT id FROM marketplace_resources WHERE tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    marketplace_resource_id IN (
      SELECT id FROM marketplace_resources WHERE tutor_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view their marketplace orders"
  ON marketplace_orders FOR SELECT
  USING (buyer_id = auth.uid());

-- Executive Dashboard
CREATE POLICY "Tutors manage executive snapshots"
  ON executive_snapshots FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());
```

### Step 21: Create Helper Functions

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tutor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to get tutor's upcoming bookings
CREATE OR REPLACE FUNCTION get_upcoming_bookings(tutor_uuid UUID)
RETURNS TABLE (
  booking_id UUID,
  student_name TEXT,
  service_name TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    s.full_name,
    srv.name,
    b.scheduled_at,
    b.duration_minutes,
    b.status
  FROM bookings b
  JOIN students s ON b.student_id = s.id
  LEFT JOIN services srv ON b.service_id = srv.id
  WHERE b.tutor_id = tutor_uuid
    AND b.scheduled_at > NOW()
    AND b.status IN ('confirmed', 'pending')
  ORDER BY b.scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 22: Generate TypeScript Types

Run this in your terminal (from project root):

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Generate types (replace YOUR_PROJECT_ID)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts
```

### Step 23: Create Type Utilities

Create `lib/types/index.ts`:

```typescript
import { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type LessonNote = Database['public']['Tables']['lesson_notes']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type Link = Database['public']['Tables']['links']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SessionPackageTemplate = Database['public']['Tables']['session_package_templates']['Row']
export type SessionPackagePurchase = Database['public']['Tables']['session_package_purchases']['Row']
export type SessionPackageRedemption = Database['public']['Tables']['session_package_redemptions']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceLineItem = Database['public']['Tables']['invoice_line_items']['Row']
export type PaymentReminder = Database['public']['Tables']['payment_reminders']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type LessonPlan = Database['public']['Tables']['lesson_plans']['Row']
export type InteractiveActivity = Database['public']['Tables']['interactive_activities']['Row']
export type LeadSource = Database['public']['Tables']['lead_sources']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type AdAccount = Database['public']['Tables']['ad_accounts']['Row']
export type AdCampaign = Database['public']['Tables']['ad_campaigns']['Row']
export type AdCreative = Database['public']['Tables']['ad_creatives']['Row']
export type AdPerformanceDaily = Database['public']['Tables']['ad_performance_daily']['Row']
export type AiTranscript = Database['public']['Tables']['ai_transcripts']['Row']
export type AiContentClip = Database['public']['Tables']['ai_content_clips']['Row']
export type AiDetectedError = Database['public']['Tables']['ai_detected_errors']['Row']
export type GroupSession = Database['public']['Tables']['group_sessions']['Row']
export type GroupSessionAttendee = Database['public']['Tables']['group_session_attendees']['Row']
export type MarketplaceResource = Database['public']['Tables']['marketplace_resources']['Row']
export type MarketplaceOrder = Database['public']['Tables']['marketplace_orders']['Row']
export type ExecutiveSnapshot = Database['public']['Tables']['executive_snapshots']['Row']

// Insert types (for creating new records)
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type SessionPackageTemplateInsert = Database['public']['Tables']['session_package_templates']['Insert']
export type SessionPackagePurchaseInsert = Database['public']['Tables']['session_package_purchases']['Insert']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert']
export type PaymentReminderInsert = Database['public']['Tables']['payment_reminders']['Insert']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ResourceInsert = Database['public']['Tables']['resources']['Insert']
export type LessonPlanInsert = Database['public']['Tables']['lesson_plans']['Insert']
export type InteractiveActivityInsert = Database['public']['Tables']['interactive_activities']['Insert']
export type LeadSourceInsert = Database['public']['Tables']['lead_sources']['Insert']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadEventInsert = Database['public']['Tables']['lead_events']['Insert']
export type AdAccountInsert = Database['public']['Tables']['ad_accounts']['Insert']
export type AdCampaignInsert = Database['public']['Tables']['ad_campaigns']['Insert']
export type AdCreativeInsert = Database['public']['Tables']['ad_creatives']['Insert']
export type AdPerformanceDailyInsert = Database['public']['Tables']['ad_performance_daily']['Insert']
export type AiTranscriptInsert = Database['public']['Tables']['ai_transcripts']['Insert']
export type AiContentClipInsert = Database['public']['Tables']['ai_content_clips']['Insert']
export type AiDetectedErrorInsert = Database['public']['Tables']['ai_detected_errors']['Insert']
export type GroupSessionInsert = Database['public']['Tables']['group_sessions']['Insert']
export type GroupSessionAttendeeInsert = Database['public']['Tables']['group_session_attendees']['Insert']
export type MarketplaceResourceInsert = Database['public']['Tables']['marketplace_resources']['Insert']
export type MarketplaceOrderInsert = Database['public']['Tables']['marketplace_orders']['Insert']

// Update types (for partial updates)
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']
export type StudentUpdate = Database['public']['Tables']['students']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type SessionPackageTemplateUpdate = Database['public']['Tables']['session_package_templates']['Update']
export type SessionPackagePurchaseUpdate = Database['public']['Tables']['session_package_purchases']['Update']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
export type InvoiceLineItemUpdate = Database['public']['Tables']['invoice_line_items']['Update']
export type PaymentReminderUpdate = Database['public']['Tables']['payment_reminders']['Update']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']
export type ResourceUpdate = Database['public']['Tables']['resources']['Update']
export type LessonPlanUpdate = Database['public']['Tables']['lesson_plans']['Update']
export type InteractiveActivityUpdate = Database['public']['Tables']['interactive_activities']['Update']
export type LeadSourceUpdate = Database['public']['Tables']['lead_sources']['Update']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']
export type LeadEventUpdate = Database['public']['Tables']['lead_events']['Update']
export type AdAccountUpdate = Database['public']['Tables']['ad_accounts']['Update']
export type AdCampaignUpdate = Database['public']['Tables']['ad_campaigns']['Update']
export type AdCreativeUpdate = Database['public']['Tables']['ad_creatives']['Update']
export type AdPerformanceDailyUpdate = Database['public']['Tables']['ad_performance_daily']['Update']
export type AiTranscriptUpdate = Database['public']['Tables']['ai_transcripts']['Update']
export type AiContentClipUpdate = Database['public']['Tables']['ai_content_clips']['Update']
export type AiDetectedErrorUpdate = Database['public']['Tables']['ai_detected_errors']['Update']
export type GroupSessionUpdate = Database['public']['Tables']['group_sessions']['Update']
export type GroupSessionAttendeeUpdate = Database['public']['Tables']['group_session_attendees']['Update']
export type MarketplaceResourceUpdate = Database['public']['Tables']['marketplace_resources']['Update']
export type MarketplaceOrderUpdate = Database['public']['Tables']['marketplace_orders']['Update']

// Extended types with relationships
export type BookingWithRelations = Booking & {
  student: Student
  service: Service | null
  tutor: Profile
}

export type StudentWithStats = Student & {
  total_lessons: number
  total_hours: number
  last_lesson_date: string | null
}
```

## Testing Checklist

Test in Supabase SQL Editor:

```sql
-- Test 1: Insert a test profile
SELECT * FROM profiles LIMIT 5;

-- Test 2: Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test 3: Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Test 4: Test the trigger
-- (Create a user in Supabase Auth Dashboard, check if profile auto-creates)

-- Test 5: Ensure premium tables exist
SELECT COUNT(*) FROM session_package_templates;
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM ad_campaigns;
SELECT COUNT(*) FROM ai_transcripts;
```

## AI Tool Prompts for Cursor/Claude

### Review Schema
```
Review this database schema for a language tutor platform. Check for:
1. Missing indexes for common queries
2. Data integrity issues
3. Security vulnerabilities in RLS policies
4. Performance optimization opportunities
5. Missing foreign key constraints
Suggest improvements.
```

### Generate Query Functions
```
Create TypeScript functions using Supabase client for:
1. Getting a tutor's profile by username
2. Fetching session package balances for a student
3. Creating a new booking that redeems package minutes (or charges Stripe if none available)
4. Logging a lead interaction and scheduling the next follow-up
5. Saving an AI transcript summary back to the student's record
Include proper error handling and TypeScript types.
```

### Create Migration System
```
Help me set up a migration system for this database schema that allows:
1. Version-controlled schema changes
2. Rollback capability
3. Seed data for development
4. Production-safe migrations
Suggest tools and patterns.
```

## Common Gotchas

### Issue: RLS Blocks Everything
**Problem**: Can't query tables even though policies exist
**Solution**: 
- Check if you're using the correct auth context
- Verify `auth.uid()` returns expected user ID
- Test policies with `USING (true)` temporarily to debug
- Check if user's role matches policy expectations

### Issue: Foreign Key Violations
**Problem**: Can't delete records due to references
**Solution**:
- Use `ON DELETE CASCADE` for dependent data
- Use `ON DELETE SET NULL` for optional references
- Check deletion order (students before tutors, etc.)

### Issue: TypeScript Types Out of Sync
**Problem**: Type errors after schema changes
**Solution**:
- Regenerate types after every schema change
- Use `supabase gen types` command
- Restart TypeScript server in editor

### Issue: Slow Queries
**Problem**: Profile page loads slowly
**Solution**:
- Add indexes on frequently queried columns
- Use `EXPLAIN ANALYZE` to check query plans
- Consider materialized views for complex aggregations

### Issue: Meta Ads API Calls Failing
**Problem**: Growth Plan ad sync returns 401/403 errors
**Solution**:
- Verify `META_ADS_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are still valid
- Refresh tokens via Meta Marketing API and update Supabase secrets
- Confirm campaign user has required ad account permissions

### Issue: AI Transcript Upload Size Limits
**Problem**: Chrome extension uploads get rejected
**Solution**:
- Ensure Supabase Storage bucket allows larger file sizes or compress before upload
- Split long sessions into segments in the extension before persisting
- Validate that `ai_transcripts` table columns are sized for expected payloads

## Next Steps

Once database is set up and tested:
1. Proceed to **02-authentication.md** to implement auth flows
2. Keep SQL Editor open for quick schema adjustments
3. Commit schema SQL to version control
4. Document any custom changes for team
5. Map table ownership to Build Plan tasks (session packages → 08, leads → 23, ads → 22, etc.) so feature work references the right schema blocks

## Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/design)

## Success Criteria

✅ All tables created successfully
✅ RLS enabled on all tables
✅ Policies allow expected access patterns
✅ Indexes created for common queries
✅ TypeScript types generated
✅ Trigger creates profile on user signup
✅ No foreign key violations in test data
✅ Premium/Growth tables scaffolded for future phases
✅ Updated_at triggers attached to tables with audit columns

**Estimated Time**: 2-3 hours including testing
