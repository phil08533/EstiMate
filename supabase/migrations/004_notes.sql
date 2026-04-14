-- EstiMate Notes Feature
-- Run after 003_triggers.sql

-- ─── notes ────────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id           uuid primary key default uuid_generate_v4(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  title        text,
  content      text,
  canvas_data  jsonb,
  mode         text not null default 'text' check (mode in ('text', 'draw')),
  note_date    date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Reuse existing handle_updated_at() function from 001_initial_schema.sql
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- ─── note_shares ──────────────────────────────────────────────────────────────
-- note_id IS NULL  → share all notes for the team
-- note_id IS NOT NULL → share one specific note
create table if not exists public.note_shares (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  note_id     uuid references public.notes(id) on delete cascade,
  token       text not null unique,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_notes_team_date   on public.notes(team_id, note_date desc);
create index if not exists idx_notes_created_by  on public.notes(created_by);
create index if not exists idx_note_shares_token on public.note_shares(token);
create index if not exists idx_note_shares_team  on public.note_shares(team_id);
create index if not exists idx_note_shares_note  on public.note_shares(note_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.notes enable row level security;

create policy "Team members can view notes"
  on public.notes for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team members can create notes"
  on public.notes for insert
  with check (
    team_id in (select public.get_user_team_ids())
    and created_by = auth.uid()
  );

create policy "Team members can update notes"
  on public.notes for update
  using (team_id in (select public.get_user_team_ids()));

create policy "Creator or team owner can delete notes"
  on public.notes for delete
  using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );

alter table public.note_shares enable row level security;

create policy "Team members can manage note shares"
  on public.note_shares for all
  using (team_id in (select public.get_user_team_ids()));

create policy "Anyone can read note shares for validation"
  on public.note_shares for select
  using (true);
