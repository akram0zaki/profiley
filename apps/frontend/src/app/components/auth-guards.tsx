import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../lib/auth';
import { hasAcceptedCurrentLegalVersions } from '../../lib/legal';
import { useCurrentProfile } from '../../lib/profile';

function loginRedirect(pathname: string) {
  return `/login?redirect=${encodeURIComponent(pathname)}`;
}

function legalRedirect(pathname: string) {
  return `/legal/acceptance?redirect=${encodeURIComponent(pathname)}`;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  if (auth.loading) return null;
  if (!auth.session) return <Navigate to={loginRedirect(loc.pathname)} replace />;
  return <>{children}</>;
}

export function RequireLegalAcceptance({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  const { appUser, loading } = useCurrentProfile();

  if (auth.loading || loading) return null;
  if (!auth.session) return <Navigate to={loginRedirect(loc.pathname)} replace />;
  if (!appUser) return null;
  if (!hasAcceptedCurrentLegalVersions(appUser)) {
    return <Navigate to={legalRedirect(loc.pathname)} replace />;
  }
  return <>{children}</>;
}

export function RequireAppAccess({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  const { appUser, loading } = useCurrentProfile();

  if (auth.loading || loading) return null;
  if (!auth.session) return <Navigate to={loginRedirect(loc.pathname)} replace />;
  if (!appUser) return null;
  if (!hasAcceptedCurrentLegalVersions(appUser)) {
    return <Navigate to={legalRedirect(loc.pathname)} replace />;
  }
  if (!appUser.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return null;
  if (!auth.session) return <Navigate to="/login" replace />;
  if (auth.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
