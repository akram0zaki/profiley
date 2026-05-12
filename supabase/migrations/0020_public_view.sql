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
  jsonb_strip_nulls(jsonb_build_object(
    'linkedin', case when coalesce((pref.public_social_visibility->>'linkedin')::boolean, false) then p.social_links->'linkedin' else null end,
    'github', case when coalesce((pref.public_social_visibility->>'github')::boolean, false) then p.social_links->'github' else null end,
    'twitter', case when coalesce((pref.public_social_visibility->>'twitter')::boolean, false) then p.social_links->'twitter' else null end,
    'reddit', case when coalesce((pref.public_social_visibility->>'reddit')::boolean, false) then p.social_links->'reddit' else null end,
    'discord', case when coalesce((pref.public_social_visibility->>'discord')::boolean, false) then p.social_links->'discord' else null end,
    'instagram', case when coalesce((pref.public_social_visibility->>'instagram')::boolean, false) then p.social_links->'instagram' else null end,
    'tiktok', case when coalesce((pref.public_social_visibility->>'tiktok')::boolean, false) then p.social_links->'tiktok' else null end,
    'youtube', case when coalesce((pref.public_social_visibility->>'youtube')::boolean, false) then p.social_links->'youtube' else null end
  )) as social_links,
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
