-- Role-based write access: viewers (role='viewer') can only read.
-- Members and owners can create/update/delete estimates, media, measurements, and notes.

-- Helper: returns team_ids where the current user can write (owner or member)
create or replace function public.get_user_writable_team_ids()
returns setof uuid language sql security definer stable as $$
  select team_id from public.team_members
  where user_id = auth.uid() and role in ('owner', 'member')
$$;

-- ─── estimates ────────────────────────────────────────────────────────────────
drop policy if exists "Team members can create estimates" on public.estimates;
drop policy if exists "Team members can update estimates" on public.estimates;
drop policy if exists "Team owners and creators can delete estimates" on public.estimates;

create policy "Team members can create estimates"
  on public.estimates for insert
  with check (
    team_id in (select public.get_user_writable_team_ids())
    and created_by = auth.uid()
  );

create policy "Team members can update estimates"
  on public.estimates for update
  using (team_id in (select public.get_user_writable_team_ids()));

create policy "Team owners and creators can delete estimates"
  on public.estimates for delete
  using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );

-- ─── estimate_media ───────────────────────────────────────────────────────────
drop policy if exists "Team members can add media" on public.estimate_media;
drop policy if exists "Uploader or team owner can update media" on public.estimate_media;
drop policy if exists "Uploader or team owner can delete media" on public.estimate_media;

create policy "Team members can add media"
  on public.estimate_media for insert
  with check (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
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
drop policy if exists "Team members can add measurements" on public.measurements;
drop policy if exists "Team members can update measurements" on public.measurements;
drop policy if exists "Team members can delete measurements" on public.measurements;

create policy "Team members can add measurements"
  on public.measurements for insert
  with check (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );

create policy "Team members can update measurements"
  on public.measurements for update
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );

create policy "Team members can delete measurements"
  on public.measurements for delete
  using (
    estimate_id in (
      select id from public.estimates
      where team_id in (select public.get_user_writable_team_ids())
    )
  );

-- ─── notes ────────────────────────────────────────────────────────────────────
-- Drop existing write policies and recreate with writable team check
drop policy if exists "Team members can insert notes" on public.notes;
drop policy if exists "Team members can update notes" on public.notes;
drop policy if exists "Team members can delete notes" on public.notes;

create policy "Team members can insert notes"
  on public.notes for insert
  with check (
    team_id in (select public.get_user_writable_team_ids())
    and created_by = auth.uid()
  );

create policy "Team members can update notes"
  on public.notes for update
  using (team_id in (select public.get_user_writable_team_ids()));

create policy "Team members can delete notes"
  on public.notes for delete
  using (
    created_by = auth.uid()
    or team_id in (select id from public.teams where owner_id = auth.uid())
  );
