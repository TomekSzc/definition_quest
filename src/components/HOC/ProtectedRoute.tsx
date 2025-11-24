import { useEffect } from "react";
import type { ReactNode, FC } from "react";
import { useAppSelector } from "@/store/hooks";
import { ProtectedRoutes } from "@/lib/routes";
import { Routes } from "@/lib/routes";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  // Determine if current route requires authentication or should be hidden from authenticated users
  const authPages: Routes[] = [Routes.Login, Routes.SignUp, Routes.ForgotPassword, Routes.ResetPassword];

  const isProtected = Object.values(ProtectedRoutes).includes(pathname as ProtectedRoutes);
  const isAuthPage = authPages.includes(pathname as Routes);
  const authed = Boolean(accessToken) && isAuthenticated;

  useEffect(() => {
    // Redirect unauthenticated users trying to access protected routes
    if (isProtected && !authed) {
      window.location.replace(`/?return=${encodeURIComponent(pathname)}`);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && authed) {
      window.location.replace(Routes.Boards);
    }
  }, [isProtected, authed, pathname]);

  if (isProtected && !authed) {
    return <span>Redirecting…</span>;
  }

  if (isAuthPage && authed) {
    return <span>Redirecting…</span>;
  }

  return <>{children}</>;
};
