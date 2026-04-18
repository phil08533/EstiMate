-- Company settings: branding, contact info, tax rate, payment terms
create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  company_name text,
  logo_path text,          -- storage path in estimate-media bucket
  logo_scale numeric not null default 1.0,
  phone text,
  email text,
  address text,
  website text,
  license_number text,
  tax_rate numeric not null default 0,  -- percentage, e.g. 8.5
  payment_terms text default 'Due on receipt',
  footer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.company_settings enable row level security;

create policy "Team members can view company settings"
  on public.company_settings for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team owners can manage company settings"
  on public.company_settings for all
  using (team_id in (select id from public.teams where owner_id = auth.uid()));

-- Service item catalog: reusable line items with default prices
create table public.service_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  description text,
  unit text default 'each',  -- e.g. sq ft, hr, each, yard, bag
  default_price numeric not null default 0,
  category text,
  created_at timestamptz default now()
);

alter table public.service_items enable row level security;

create policy "Team members can view service items"
  on public.service_items for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team members can manage service items"
  on public.service_items for all
  using (team_id in (select public.get_user_writable_team_ids()));

-- Estimate line items: materials, labor, services on an estimate
create table public.estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  service_item_id uuid references public.service_items(id) on delete set null,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  unit text default 'each',
  tax_exempt boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
-- subtotal = quantity * unit_price (computed in app)

alter table public.estimate_line_items enable row level security;

create policy "Team members can view line items"
  on public.estimate_line_items for select
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can manage line items"
  on public.estimate_line_items for all
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );
