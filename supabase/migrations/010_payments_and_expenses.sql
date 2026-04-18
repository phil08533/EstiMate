-- Payments: track money received against estimates
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  amount numeric not null,
  payment_method text not null default 'cash',  -- cash, check, card, bank_transfer, other
  payment_date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Team members can view payments"
  on public.payments for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team members can manage payments"
  on public.payments for all
  using (team_id in (select public.get_user_writable_team_ids()));

-- Expenses: track business costs
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  category text not null default 'other',
  -- categories: materials, labor, equipment, fuel, insurance, marketing, office, utilities, subcontractor, other
  description text not null,
  amount numeric not null,
  expense_date date not null default current_date,
  vendor text,
  receipt_path text,  -- storage path
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Team members can view expenses"
  on public.expenses for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team members can manage expenses"
  on public.expenses for all
  using (team_id in (select public.get_user_writable_team_ids()));
