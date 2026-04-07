-- EstiMate RLS Policies
-- Enables Row Level Security on all tables and defines access rules

-- ─── Helper function ──────────────────────────────────────────────────────────
-- Returns the team_id(s) the current user is a member of
create or replace function public.get_user_team_ids()
returns setof uuid language sql security definer stable as $$
  select team_id from public.team_members where user_id = auth.uid()
$$;

-- ─── profiles ─────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can view profiles in their teams"
  on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select user_id from public.team_members
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- ─── teams ────────────────────────────────────────────────────────────────────
alter table public.teams enable row level security;

create policy "Team members can view their team"
  on public.teams for select
  using (id in (select public.get_user_team_ids()));

create policy "Users can create teams"
  on public.teams for insert
  with check (owner_id = auth.uid());

create policy "Team owners can update team"
  on public.teams for update
  using (owner_id = auth.uid());

-- ─── team_members ─────────────────────────────────────────────────────────────
alter table public.team_members enable row level security;

create policy "Team members can view team members"
  on public.team_members for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team owners can manage team members"
  on public.team_members for all
  using (
    team_id in (select id from public.teams where owner_id = auth.uid())
  );

create policy "Users can join team (insert own membership)"
  on public.team_members for insert
  with check (user_id = auth.uid());

-- ─── estimates ────────────────────────────────────────────────────────────────
alter table public.estimates enable row level security;

create policy "Team members can view estimates"
  on public.estimates for select
  using (team_id in (select public.get_user_team_ids()));

create policy "Team members can create estimates"
  on public.estimates for insert
  with check (
    team_id in (select public.get_user_team_ids())
    and created_by = auth.uid()
  );

create policy "Team members can update estimates"
  on public.estimates for update
  using (team_id in (select public.get_user_team_ids()));

create policy "Team owners and creators can delete estimates"
  on public.estimates for delete
  using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );

-- ─── estimate_media ───────────────────────────────────────────────────────────
alter table public.estimate_media enable row level security;

create policy "Team members can view media"
  on public.estimate_media for select
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can add media"
  on public.estimate_media for insert
  with check (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
    and uploaded_by = auth.uid()
  );

create policy "Uploader or team owner can update media"
  on public.estimate_media for update
  using (
    uploaded_by = auth.uid()
    or estimate_id in (
      select e.id from public.estimates e
      join public.teams t on t.id = e.team_id
      where t.owner_id = auth.uid()
    )
  );

create policy "Uploader or team owner can delete media"
  on public.estimate_media for delete
  using (
    uploaded_by = auth.uid()
    or estimate_id in (
      select e.id from public.estimates e
      join public.teams t on t.id = e.team_id
      where t.owner_id = auth.uid()
    )
  );

-- ─── measurements ─────────────────────────────────────────────────────────────
alter table public.measurements enable row level security;

create policy "Team members can view measurements"
  on public.measurements for select
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can add measurements"
  on public.measurements for insert
  with check (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can update measurements"
  on public.measurements for update
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

create policy "Team members can delete measurements"
  on public.measurements for delete
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_team_ids())
    )
  );

-- ─── share_tokens ─────────────────────────────────────────────────────────────
alter table public.share_tokens enable row level security;

create policy "Team members can manage share tokens"
  on public.share_tokens for all
  using (team_id in (select public.get_user_team_ids()));

create policy "Anyone can read share tokens (for validation)"
  on public.share_tokens for select
  using (true);  -- validation happens in server code checking expiry

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run this in the Supabase dashboard Storage section, or via CLI:
-- Create bucket: estimate-media (public: false)
-- Then apply these policies via SQL:

insert into storage.buckets (id, name, public)
values ('estimate-media', 'estimate-media', false)
on conflict (id) do nothing;

create policy "Team members can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'estimate-media'
    and auth.uid() is not null
  );

create policy "Team members can view media"
  on storage.objects for select
  using (
    bucket_id = 'estimate-media'
    and auth.uid() is not null
  );

create policy "Uploader can delete media"
  on storage.objects for delete
  using (
    bucket_id = 'estimate-media'
    and owner = auth.uid()
  );
