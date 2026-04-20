-- Crews: named groups of employees that get assigned to jobs
-- schedule_blocks: multi-day allocation of hours per estimate per crew

create table crews (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table crew_members (
  crew_id     uuid not null references crews(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  primary key (crew_id, employee_id)
);

-- schedule_blocks: how hours for a job are spread across days/crews
create table schedule_blocks (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  estimate_id uuid not null references estimates(id) on delete cascade,
  crew_id     uuid references crews(id) on delete set null,
  block_date  date not null,
  hours       numeric(5,2) not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table crews          enable row level security;
alter table crew_members   enable row level security;
alter table schedule_blocks enable row level security;

create policy "team members read crews"
  on crews for select
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members write crews"
  on crews for insert
  with check (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members update crews"
  on crews for update
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members delete crews"
  on crews for delete
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

create policy "team members read crew_members"
  on crew_members for select
  using (crew_id in (select id from crews where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

create policy "team members write crew_members"
  on crew_members for all
  using (crew_id in (select id from crews where team_id in (
    select team_id from team_members where user_id = auth.uid()
  )));

create policy "team members manage schedule_blocks"
  on schedule_blocks for all
  using (team_id in (select team_id from team_members where user_id = auth.uid()));

-- Add crew assignment to estimates
alter table estimates add column if not exists crew_id uuid references crews(id) on delete set null;
