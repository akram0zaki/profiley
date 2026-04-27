import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: string | null;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, user: null, role: null });
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const role = (data.session?.user?.app_metadata?.role as string | undefined) ?? null;
      setState({ loading: false, session: data.session, user: data.session?.user ?? null, role });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = (session?.user?.app_metadata?.role as string | undefined) ?? null;
      setState({ loading: false, session, user: session?.user ?? null, role });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export async function signInWithEmail(email: string, redirectTo?: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo ?? `${window.location.origin}/auth/callback` },
  });
}

export async function signInWithProvider(provider: 'google' | 'github', redirectTo?: string) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo ?? `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
