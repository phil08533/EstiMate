-- Migration 013: CRM — customers, leads, contact logs

-- Lead pipeline stages
create type if not exists public.lead_stage as enum (
  'new_lead', 'estimate_scheduled', 'proposal_sent', 'won', 'lost'
);

-- Customers (active clients)
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  created_by   uuid not null references public.profiles(id),
  full_name    text not null,
  email        text,
  phone        text,
  address      text,
  city         text,
  state        text,
  zip          text,
  tags         text[],
  notes        text,
  source       text,  -- 'referral','google','facebook','mailer','door_hanger','other'
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Link estimates to a customer (optional)
alter table public.estimates
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

-- Leads pipeline
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.teams(id) on delete cascade,
  created_by      uuid not null references public.profiles(id),
  customer_id     uuid references public.customers(id) on delete set null,
  full_name       text not null,
  email           text,
  phone           text,
  address         text,
  service_interest text,
  notes           text,
  source          text,
  stage           public.lead_stage not null default 'new_lead',
  estimated_value numeric,
  assigned_to     uuid references public.profiles(id) on delete set null,
  follow_up_date  date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Contact history logs (calls, emails, texts, visits)
create table if not exists public.contact_logs (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  lead_id     uuid references public.leads(id) on delete cascade,
  created_by  uuid not null references public.profiles(id),
  log_type    text not null, -- 'call','email','text','visit','note'
  summary     text not null,
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.customers  enable row level security;
alter table public.leads       enable row level security;
alter table public.contact_logs enable row level security;

-- Read: all team members
create policy "team read customers"
  on public.customers for select
  using (team_id in (select get_user_team_ids()));

create policy "team read leads"
  on public.leads for select
  using (team_id in (select get_user_team_ids()));

create policy "team read contact_logs"
  on public.contact_logs for select
  using (team_id in (select get_user_team_ids()));

-- Write: members + owners
create policy "team write customers"
  on public.customers for all
  using  (team_id in (select get_user_writable_team_ids()))
  with check (team_id in (select get_user_writable_team_ids()));

create policy "team write leads"
  on public.leads for all
  using  (team_id in (select get_user_writable_team_ids()))
  with check (team_id in (select get_user_writable_team_ids()));

create policy "team write contact_logs"
  on public.contact_logs for all
  using  (team_id in (select get_user_writable_team_ids()))
  with check (team_id in (select get_user_writable_team_ids()));

-- updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.touch_updated_at();

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();
