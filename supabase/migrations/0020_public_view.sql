-- 0020_public_view.sql
-- Sanitized read-only view of public profiles for anonymous consumers.

create or replace view public.public_profile_view as
select
  p.id,
  p.slug,
  p.full_name,
  p.headline,
  p.short_bio,
  p.long_bio,
  p.current_location,
  p.recruiter_intro,
  p.persona_style,
  p.profile_photo_path,
  p.user_id,
  pp.theme_name,
  pp.accent_color,
  pp.hero_layout,
  pp.seo_title,
  pp.seo_description,
  pref.allow_public_chat,
  pref.allow_job_fit_analysis,
  pref.allow_contact_form,
  pref.allow_document_citation
from public.profiles p
left join public.public_pages pp on pp.user_id = p.user_id
left join public.profile_preferences pref on pref.user_id = p.user_id
where p.public_visibility = true;

grant select on public.public_profile_view to anon, authenticated;
