-- Store extracted social/profile links on the profile and let owners control
-- which platforms are exposed on the public profile.

alter table public.profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.profile_preferences
  add column if not exists public_social_visibility jsonb not null default '{}'::jsonb;

comment on column public.profiles.social_links is
  'Canonical platform-specific profile links extracted from uploaded documents or edited by the owner.';

comment on column public.profile_preferences.public_social_visibility is
  'Per-platform public visibility flags for structured social links.';