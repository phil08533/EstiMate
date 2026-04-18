-- Migration 012: follow_up_date on estimates + estimate templates

-- Add follow-up date column to estimates
alter table public.estimates add column if not exists follow_up_date date;

-- ─── Estimate templates ───────────────────────────────────────────────────────

create table if not exists public.estimate_templates (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  created_by  uuid not null references public.profiles(id),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.template_line_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.estimate_templates(id) on delete cascade,
  description text not null,
  quantity    numeric not null default 1,
  unit_price  numeric not null default 0,
  unit        text not null default 'each',
  tax_exempt  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.estimate_templates enable row level security;
alter table public.template_line_items enable row level security;

create policy "team members can read templates"
  on public.estimate_templates for select
  using (team_id in (select get_user_team_ids()));

create policy "team members can write templates"
  on public.estimate_templates for all
  using (team_id in (select get_user_writable_team_ids()))
  with check (team_id in (select get_user_writable_team_ids()));

create policy "team members can read template items"
  on public.template_line_items for select
  using (template_id in (
    select id from public.estimate_templates
    where team_id in (select get_user_team_ids())
  ));

create policy "team members can write template items"
  on public.template_line_items for all
  using (template_id in (
    select id from public.estimate_templates
    where team_id in (select get_user_writable_team_ids())
  ))
  with check (template_id in (
    select id from public.estimate_templates
    where team_id in (select get_user_writable_team_ids())
  ));
