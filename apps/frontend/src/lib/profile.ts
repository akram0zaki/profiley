// Client-side helpers for the authenticated user's own profile.
// Reads/writes go through the supabase client with the user's JWT, so RLS
// policies in 0019_rls.sql enforce ownership.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

export type AppUserRow = {
  id: string;
  email: string;
  preferred_language: string | null;
  browser_locale: string | null;
  timezone: string | null;
  onboarding_completed: boolean;
  role: string;
};

export type ProfileRow = {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  headline: string | null;
  short_bio: string | null;
  long_bio: string | null;
  current_location: string | null;
  profile_photo_path: string | null;
  public_visibility: boolean;
  recruiter_intro: string | null;
  persona_style: string | null;
};

export type PreferencesRow = {
  id: string;
  user_id: string;
  response_language_mode: string;
  allow_public_chat: boolean;
  allow_job_fit_analysis: boolean;
  allow_document_citation: boolean;
  allow_contact_form: boolean;
  ai_persona_tone: string | null;
  model_chat_override: string | null;
  model_stt_override: string | null;
  model_tts_override: string | null;
  model_embedding_override: string | null;
};

export type CurrentProfileBundle = {
  appUser: AppUserRow | null;
  profile: ProfileRow | null;
  preferences: PreferencesRow | null;
};

export function useCurrentProfile() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<CurrentProfileBundle>({ appUser: null, profile: null, preferences: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setData({ appUser: null, profile: null, preferences: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [appUserRes, profileRes, prefsRes] = await Promise.all([
        supabase.from('app_users').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profile_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      if (appUserRes.error) throw appUserRes.error;
      if (profileRes.error) throw profileRes.error;
      if (prefsRes.error) throw prefsRes.error;
      setData({
        appUser: (appUserRes.data as AppUserRow | null) ?? null,
        profile: (profileRes.data as ProfileRow | null) ?? null,
        preferences: (prefsRes.data as PreferencesRow | null) ?? null,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  return { ...data, loading: authLoading || loading, error, reload };
}

export async function updateProfile(userId: string, patch: Partial<ProfileRow>) {
  const { error } = await supabase.from('profiles').update(patch).eq('user_id', userId);
  if (error) throw error;
}

export async function updatePreferences(userId: string, patch: Partial<PreferencesRow>) {
  const { error } = await supabase
    .from('profile_preferences')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function updateAppUser(userId: string, patch: Partial<AppUserRow>) {
  const { error } = await supabase.from('app_users').update(patch).eq('id', userId);
  if (error) throw error;
}

// Returns a public storage URL for the avatar bucket path, or null.
export function avatarPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl ?? null;
}
