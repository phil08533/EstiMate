-- Vendor / supplier contacts
create table if not exists vendors (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  created_by   uuid references profiles(id),
  name         text not null,
  category     text,                     -- 'nursery','stone','lumber','rental','other'
  contact_name text,
  phone        text,
  email        text,
  address      text,
  website      text,
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table vendors enable row level security;

-- Team members can read
create policy "team members can read vendors"
  on vendors for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

-- Members/owners can insert
create policy "team members can insert vendors"
  on vendors for insert
  with check (
    team_id in (
      select team_id from team_members
      where user_id = auth.uid() and role in ('owner','member')
    )
  );

-- Members/owners can update
create policy "team members can update vendors"
  on vendors for update
  using (
    team_id in (
      select team_id from team_members
      where user_id = auth.uid() and role in ('owner','member')
    )
  );

-- Members/owners can delete
create policy "team members can delete vendors"
  on vendors for delete
  using (
    team_id in (
      select team_id from team_members
      where user_id = auth.uid() and role in ('owner','member')
    )
  );

-- Auto-update updated_at
create trigger vendors_updated_at
  before update on vendors
  for each row execute function update_updated_at_column();
