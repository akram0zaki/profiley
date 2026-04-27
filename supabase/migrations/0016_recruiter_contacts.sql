-- 0016_recruiter_contacts.sql

create table if not exists public.recruiter_contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_name text not null,
  visitor_email citext not null,
  company text,
  message text not null,
  delivery_status text not null default 'pending', -- pending | sent | failed
  delivery_error text,
  ip_hash text,
  visitor_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recruiter_contacts_profile on public.recruiter_contacts(profile_id, created_at desc);
create index if not exists idx_recruiter_contacts_status on public.recruiter_contacts(delivery_status);
