-- Service categories: user-defined work types (Landscaping, Mowing, Snow Plowing, Lighting…)
-- Estimates are tagged with a category for revenue/profit tracking by work type.

create table service_categories (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  name       text not null,
  color      text not null default '#3b82f6',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table service_categories enable row level security;

create policy "team members read service_categories"
  on service_categories for select
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members write service_categories"
  on service_categories for insert
  with check (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members update service_categories"
  on service_categories for update
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members delete service_categories"
  on service_categories for delete
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

-- Add category + hours to estimates
alter table estimates add column if not exists category_id uuid references service_categories(id) on delete set null;
alter table estimates add column if not exists estimated_hours numeric(6,2);
