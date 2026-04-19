-- Per-estimate quote tokens for customer-facing quote links
alter table estimates
  add column if not exists quote_token       text unique,
  add column if not exists customer_response text,           -- 'accepted' | 'declined' | 'modification_requested'
  add column if not exists customer_response_at   timestamptz,
  add column if not exists customer_response_notes text;

create unique index if not exists estimates_quote_token_idx
  on estimates(quote_token) where quote_token is not null;

-- Job reminder settings per team (one row per team)
create table if not exists reminder_settings (
  id                       uuid primary key default gen_random_uuid(),
  team_id                  uuid not null references teams(id) on delete cascade unique,
  is_enabled               boolean not null default true,
  reminder_days_before     integer[] not null default '{1}',   -- e.g. {1, 3} = 1 day and 3 days before
  send_email               boolean not null default true,
  send_sms                 boolean not null default false,
  message_template         text,                                -- optional custom message
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table reminder_settings enable row level security;

create policy "team members can read reminder settings"
  on reminder_settings for select
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team owners can manage reminder settings"
  on reminder_settings for all
  using (team_id in (select team_id from team_members where user_id = auth.uid() and role in ('owner','member')))
  with check (team_id in (select team_id from team_members where user_id = auth.uid() and role in ('owner','member')));

create trigger reminder_settings_updated_at
  before update on reminder_settings
  for each row execute function update_updated_at_column();

-- Track which reminders have already been sent (prevent duplicates)
create table if not exists reminder_log (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  estimate_id  uuid not null references estimates(id) on delete cascade,
  sent_at      timestamptz not null default now(),
  days_before  integer not null,
  method       text not null,   -- 'email' | 'sms'
  recipient    text,
  unique (estimate_id, days_before, method)
);

alter table reminder_log enable row level security;

create policy "team members can read reminder log"
  on reminder_log for select
  using (team_id in (select team_id from team_members where user_id = auth.uid()));
