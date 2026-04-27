import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

export default function AuthCallbackPage() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Supabase auth client auto-detects session from URL hash; we just wait.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setError('Sign-in did not complete. Please try again.');
        return;
      }
      try {
        const browserLocale = navigator.language;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await api.initializeUserProfile({ browserLocale, timezone });
      } catch (e) {
        // non-fatal: user is logged in regardless
        console.warn('initialize-user-profile failed:', e);
      }
      const params = new URLSearchParams(window.location.search);
      const dest = params.get('redirect') ?? '/dashboard';
      nav(dest, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [nav]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      {error ? (
        <div className="text-destructive text-center max-w-sm">
          <p>{error}</p>
          <button className="underline mt-4" onClick={() => nav('/login', { replace: true })}>Back to sign in</button>
        </div>
      ) : (
        <div className="text-muted-foreground">Signing you in…</div>
      )}
    </div>
  );
}
