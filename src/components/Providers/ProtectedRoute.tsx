import { useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import { useAppSelector } from '@/store/hooks';
import { protectedRoutes } from '@/lib/@routes';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isProtected = Object.values(protectedRoutes).includes(pathname as protectedRoutes);
  const authed = Boolean(accessToken) && isAuthenticated;

  useEffect(() => {
    if (isProtected && !authed) {
      window.location.replace(`/?return=${encodeURIComponent(pathname)}`);
    }
  }, [isProtected, authed, pathname]);

  if (isProtected && !authed) {
    return <span>Redirecting…</span>;
  }

  return <>{children}</>;
};
