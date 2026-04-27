-- 0003_profiles.sql

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  slug citext unique not null,
  full_name text not null,
  headline text,
  short_bio text,
  long_bio text,
  current_location text,
  profile_photo_path text,
  public_visibility boolean not null default false,
  recruiter_intro text,
  persona_style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id)
);

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_public on public.profiles(public_visibility) where public_visibility = true;
