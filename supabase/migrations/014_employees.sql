-- Migration 014: Employee management with org tree

create table if not exists public.employees (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  profile_id  uuid references public.profiles(id) on delete set null,
  manager_id  uuid references public.employees(id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  role        text not null default 'crew_member',
    -- 'owner','manager','estimator','crew_lead','crew_member','office','subcontractor'
  pay_rate    numeric,
  pay_type    text default 'hourly', -- 'hourly','salary'
  hire_date   date,
  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Time entries (clock-in/out per job)
create table if not exists public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  estimate_id uuid references public.estimates(id) on delete set null,
  clock_in    timestamptz not null,
  clock_out   timestamptz,
  break_mins  integer not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.employees   enable row level security;
alter table public.time_entries enable row level security;

create policy "team read employees"
  on public.employees for select
  using (team_id in (select get_user_team_ids()));

create policy "team write employees"
  on public.employees for all
  using  (team_id in (select get_user_writable_team_ids()))
  with check (team_id in (select get_user_writable_team_ids()));

create policy "team read time_entries"
  on public.time_entries for select
  using (team_id in (select get_user_team_ids()));

create policy "team write time_entries"
  on public.time_entries for all
  using  (team_id in (select get_user_writable_team_ids()))
  with check (team_id in (select get_user_writable_team_ids()));

create trigger employees_updated_at
  before update on public.employees
  for each row execute function public.touch_updated_at();
