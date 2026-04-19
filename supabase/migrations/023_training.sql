-- Employee training modules: manager-created checklists/docs employees can view & complete

create table training_modules (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  title       text not null,
  description text,
  is_public   boolean not null default false,  -- false = manager-only, true = all employees can see
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table training_items (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references training_modules(id) on delete cascade,
  content     text not null,
  item_type   text not null default 'checklist',  -- 'checklist' | 'text' | 'video_url'
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table training_completions (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references training_items(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (item_id, employee_id)
);

alter table training_modules     enable row level security;
alter table training_items       enable row level security;
alter table training_completions enable row level security;

-- Modules: team members read (public or manager)
create policy "team members read training_modules"
  on training_modules for select
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members write training_modules"
  on training_modules for insert
  with check (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members update training_modules"
  on training_modules for update
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members delete training_modules"
  on training_modules for delete
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

-- Items readable by all team members
create policy "team members read training_items"
  on training_items for select
  using (module_id in (select id from training_modules where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

create policy "team members write training_items"
  on training_items for insert
  with check (module_id in (select id from training_modules where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

create policy "team members update training_items"
  on training_items for update
  using (module_id in (select id from training_modules where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

create policy "team members delete training_items"
  on training_items for delete
  using (module_id in (select id from training_modules where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

-- Completions
create policy "team members manage completions"
  on training_completions for all
  using (employee_id in (select id from employees where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

create trigger set_updated_at_training_modules
  before update on training_modules
  for each row execute function moddatetime(updated_at);
