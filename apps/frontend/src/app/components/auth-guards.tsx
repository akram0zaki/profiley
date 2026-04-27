import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../lib/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  if (auth.loading) return null;
  if (!auth.session) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return null;
  if (!auth.session) return <Navigate to="/login" replace />;
  if (auth.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
