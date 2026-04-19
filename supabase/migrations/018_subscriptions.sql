-- Subscription plans for SaaS billing
-- plan: 'free' | 'pro' | 'business'
-- status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'

create table if not exists subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  team_id                   uuid not null references teams(id) on delete cascade unique,
  plan                      text not null default 'free',
  status                    text not null default 'trialing',
  stripe_customer_id        text,
  stripe_subscription_id    text,
  trial_ends_at             timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  canceled_at               timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- Team owner can read their subscription
create policy "team owner can read subscription"
  on subscriptions for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

-- Only service role can insert/update/delete (Stripe webhook handler uses service role)
-- No public insert/update/delete policies

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at_column();

-- Auto-create a free subscription when a team is created
create or replace function handle_new_team_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into subscriptions (team_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'trialing', now() + interval '14 days')
  on conflict (team_id) do nothing;
  return new;
end;
$$;

create trigger on_team_created_subscription
  after insert on teams
  for each row execute function handle_new_team_subscription();
