-- Auto-create a personal team whenever a new profile is inserted.
-- This fires after the handle_new_user trigger creates the profile row,
-- so every user always has a team without any client-side logic needed.

create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer as $$
declare
  v_team_id uuid;
  v_team_name text;
begin
  -- Skip if user already has a team (idempotent)
  if exists (select 1 from public.team_members where user_id = new.id) then
    return new;
  end if;

  v_team_name := case
    when new.full_name is not null and new.full_name != '' then new.full_name || '''s Team'
    when new.email is not null then split_part(new.email, '@', 1) || '''s Team'
    else 'My Team'
  end;

  insert into public.teams (name, owner_id)
  values (v_team_name, new.id)
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();
