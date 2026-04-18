-- Equipment inventory
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  description text,
  make text,
  model text,
  year int,
  serial_number text,
  purchase_date date,
  purchase_price numeric,
  status text not null default 'active',  -- active, maintenance, retired
  notes text,
  created_at timestamptz default now()
);

alter table public.equipment enable row level security;

create policy "Team members can view equipment"
  on public.equipment for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team members can manage equipment"
  on public.equipment for all
  using (team_id in (select public.get_user_writable_team_ids()));

-- Equipment maintenance / activity log
create table public.equipment_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  log_type text not null default 'maintenance',  -- maintenance, repair, fuel, note
  description text not null,
  cost numeric,
  log_date date not null default current_date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.equipment_logs enable row level security;

create policy "Team members can view equipment logs"
  on public.equipment_logs for select
  using (
    equipment_id in (
      select id from public.equipment
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can manage equipment logs"
  on public.equipment_logs for all
  using (
    equipment_id in (
      select id from public.equipment
      where team_id in (select public.get_user_writable_team_ids())
    )
  );
