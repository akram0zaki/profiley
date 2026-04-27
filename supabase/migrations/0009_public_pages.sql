-- 0009_public_pages.sql

create table if not exists public.public_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  slug citext unique not null,
  theme_name text default 'default',
  accent_color text,
  hero_layout text default 'classic',
  intro_video_path text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_pages_user_id_unique unique (user_id)
);
