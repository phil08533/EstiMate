-- EstiMate Initial Schema
-- Apply this in the Supabase SQL editor or via `supabase db push`

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Extended user info beyond auth.users
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── teams ───────────────────────────────────────────────────────────────────
create table if not exists public.teams (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ─── team_members ─────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  created_at  timestamptz not null default now(),
  unique (team_id, user_id)
);

-- ─── estimates ────────────────────────────────────────────────────────────────
create table if not exists public.estimates (
  id                uuid primary key default uuid_generate_v4(),
  team_id           uuid not null references public.teams(id) on delete cascade,
  assigned_to       uuid references public.profiles(id) on delete set null,
  created_by        uuid not null references public.profiles(id) on delete cascade,
  customer_name     text not null,
  customer_phone    text,
  customer_email    text,
  customer_address  text,
  comments          text,
  status            text not null default 'need_to_estimate'
                      check (status in ('need_to_estimate', 'sent', 'sold', 'lost')),
  total_area        numeric not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger estimates_updated_at
  before update on public.estimates
  for each row execute function public.handle_updated_at();

-- ─── estimate_media ───────────────────────────────────────────────────────────
create table if not exists public.estimate_media (
  id               uuid primary key default uuid_generate_v4(),
  estimate_id      uuid not null references public.estimates(id) on delete cascade,
  uploaded_by      uuid not null references public.profiles(id) on delete cascade,
  storage_path     text not null,
  media_type       text not null default 'photo' check (media_type in ('photo', 'video')),
  comment          text,
  annotation_data  jsonb,  -- Konva Layer 1 JSON
  display_order    integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ─── measurements ─────────────────────────────────────────────────────────────
create table if not exists public.measurements (
  id           uuid primary key default uuid_generate_v4(),
  estimate_id  uuid not null references public.estimates(id) on delete cascade,
  media_id     uuid references public.estimate_media(id) on delete set null,
  length       numeric not null check (length > 0),
  width        numeric not null check (width > 0),
  area         numeric generated always as (length * width) stored,
  label        text,
  created_at   timestamptz not null default now()
);

-- ─── share_tokens ─────────────────────────────────────────────────────────────
create table if not exists public.share_tokens (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  expires_at  timestamptz,  -- null = no expiry
  created_at  timestamptz not null default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_estimates_team_id    on public.estimates(team_id);
create index if not exists idx_estimates_status     on public.estimates(status);
create index if not exists idx_estimates_assigned   on public.estimates(assigned_to);
create index if not exists idx_estimate_media_est   on public.estimate_media(estimate_id);
create index if not exists idx_measurements_est     on public.measurements(estimate_id);
create index if not exists idx_team_members_team    on public.team_members(team_id);
create index if not exists idx_team_members_user    on public.team_members(user_id);
create index if not exists idx_share_tokens_token   on public.share_tokens(token);
