-- In-app notifications
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,  -- null = all team members
  type        text not null,
  -- types: 'quote_accepted' | 'quote_declined' | 'quote_modification' |
  --        'reminder_sent' | 'payment_received' | 'follow_up_due' | 'job_today'
  title       text not null,
  body        text,
  data        jsonb,   -- { estimate_id, customer_name, ... }
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "users can read their notifications"
  on notifications for select
  using (
    user_id = auth.uid()
    or (user_id is null and team_id in (
      select team_id from team_members where user_id = auth.uid()
    ))
  );

create policy "users can update their notifications"
  on notifications for update
  using (
    user_id = auth.uid()
    or (user_id is null and team_id in (
      select team_id from team_members where user_id = auth.uid()
    ))
  );

-- Service role inserts notifications (from API routes)

create index if not exists notifications_user_unread_idx
  on notifications(user_id, created_at desc)
  where read_at is null;
