import { withProviders } from "@/components/HOC/Providers";
import ResetPasswordForm from "../forms/ResetPasswordForm";
import { useEffect, useState } from "react";
import type { FC } from "react";

const ResetPasswordPageComponent: FC = () => {
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Extract tokens from URL hash fragment (#access_token=...&refresh_token=...)
    const hash = window.location.hash.substring(1); // Remove the '#'
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError(true);
      setTimeout(() => {
        window.location.replace("/forgot-password");
      }, 2000);
      return;
    }

    setTokens({ accessToken, refreshToken });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <div className="max-w-md w-full mx-auto bg-[var(--color-primary)] p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
          <p className="text-[var(--color-white)] text-center">Link jest nieprawidłowy. Przekierowywanie...</p>
        </div>
      </div>
    );
  }

  if (!tokens) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <div className="max-w-md w-full mx-auto bg-[var(--color-primary)] p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
          <p className="text-[var(--color-white)] text-center">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
      <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
      <ResetPasswordForm accessToken={tokens.accessToken} refreshToken={tokens.refreshToken} />
    </div>
  );
};
export const ResetPasswordPage = withProviders(ResetPasswordPageComponent);
export default ResetPasswordPage;
