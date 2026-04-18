-- Payment links: shareable URLs for customers to pay a deposit online
create table public.payment_links (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  created_by uuid references public.profiles(id),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  deposit_pct integer not null default 50,
  deposit_amount numeric not null,
  total_amount numeric not null,
  status text not null default 'pending'
    constraint payment_links_status check (status in ('pending', 'paid', 'expired')),
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,
  expires_at timestamptz default (now() + interval '30 days'),
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table public.payment_links enable row level security;

-- Team members manage their own links
create policy "Team members can manage payment links"
  on public.payment_links for all
  using (team_id in (select public.get_user_team_ids()))
  with check (team_id in (select public.get_user_writable_team_ids()));

-- Public read by token (used by customer payment page via service role)
-- The payment page uses the service role key which bypasses RLS,
-- so no additional public policy is required.
