-- English tool email subscribers table
-- Captures leads from the English learning tools (level test, phrasal verbs, vocab)

create table if not exists public.english_tool_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'english-tools',
  tool text,
  subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for email lookups
create index if not exists english_tool_subscribers_email_idx
  on public.english_tool_subscribers (email);

-- Index for source analytics
create index if not exists english_tool_subscribers_source_idx
  on public.english_tool_subscribers (source);

-- Updated_at trigger
create or replace function update_english_tool_subscribers_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger english_tool_subscribers_updated_at
  before update on public.english_tool_subscribers
  for each row execute function update_english_tool_subscribers_updated_at();

-- RLS: only service role can read subscriber list
alter table public.english_tool_subscribers enable row level security;

-- Public insert allowed (for the subscribe API route which uses anon key)
create policy "Allow public insert"
  on public.english_tool_subscribers
  for insert
  with check (true);

-- Only authenticated admin users can select
create policy "Service role can read"
  on public.english_tool_subscribers
  for select
  using (auth.role() = 'service_role');

comment on table public.english_tool_subscribers is
  'Email leads captured from the English learning tools (level test, phrasal verbs, vocabulary builder)';
