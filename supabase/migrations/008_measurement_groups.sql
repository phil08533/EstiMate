-- Measurement groups allow organizing measurements by material (mulch, rock, dirt, etc.)

create table public.measurement_groups (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz default now()
);

-- Add group_id to measurements (nullable — ungrouped measurements have null)
alter table public.measurements
  add column group_id uuid references public.measurement_groups(id) on delete set null;

-- ─── RLS for measurement_groups ───────────────────────────────────────────────
alter table public.measurement_groups enable row level security;

create policy "Team members can view measurement groups"
  on public.measurement_groups for select
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can add measurement groups"
  on public.measurement_groups for insert
  with check (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );

create policy "Team members can update measurement groups"
  on public.measurement_groups for update
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );

create policy "Team members can delete measurement groups"
  on public.measurement_groups for delete
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );
