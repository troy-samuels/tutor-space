-- Email delivery events and suppression lists for Resend
-- Tracks bounces/complaints and prevents future sends to bad addresses

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  message_id text,
  to_email text not null,
  event_type text not null,
  reason text,
  metadata jsonb,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

comment on table public.email_events is 'Raw events from Resend (bounces, complaints, deliveries, etc)';
create index if not exists email_events_to_email_idx on public.email_events (lower(to_email), occurred_at desc);
create index if not exists email_events_type_idx on public.email_events (event_type);

create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  last_event_id uuid references public.email_events(id) on delete set null
);

comment on table public.email_suppressions is 'Global suppression list based on bounces/complaints';
create index if not exists email_suppressions_reason_idx on public.email_suppressions (reason);

-- Helper view for quick stats (optional)
create or replace view public.email_event_summary as
select
  event_type,
  count(*) as total_events,
  count(distinct lower(to_email)) as unique_recipients
from public.email_events
group by event_type;

