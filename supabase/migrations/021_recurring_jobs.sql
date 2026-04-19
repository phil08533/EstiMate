-- Recurring jobs (maintenance contracts)
-- Each row represents a repeating service schedule for a customer.
-- A cron or manual trigger creates a new estimate from the template fields.

create type recurrence_frequency as enum ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually');

create table recurring_jobs (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_address text,
  customer_id   uuid references customers(id) on delete set null,
  title         text not null,
  description   text,
  frequency     recurrence_frequency not null default 'monthly',
  next_date     date not null,
  -- When auto-generating estimates, copy these values
  assigned_to   uuid references profiles(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table recurring_jobs enable row level security;

-- Team members can read
create policy "team members read recurring_jobs"
  on recurring_jobs for select
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

-- Owner/member can write
create policy "team members insert recurring_jobs"
  on recurring_jobs for insert
  with check (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members update recurring_jobs"
  on recurring_jobs for update
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members delete recurring_jobs"
  on recurring_jobs for delete
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

-- Track which estimates were auto-generated from a recurring job
alter table estimates add column if not exists recurring_job_id uuid references recurring_jobs(id) on delete set null;

-- updated_at trigger
create trigger set_updated_at_recurring_jobs
  before update on recurring_jobs
  for each row execute function moddatetime(updated_at);
