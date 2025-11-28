import { withProviders } from "@/components/HOC/Providers";
import ResetPasswordForm from "../forms/ResetPasswordForm";
import { useEffect } from "react";
import { useExchangeCodeMutation } from "../../store/api/apiSlice";
import type { FC } from "react";

const ResetPasswordPageComponent: FC = () => {
  const [exchangeCode] = useExchangeCodeMutation();

  useEffect(() => {
    async function exchange() {
      // Extract tokens from URL hash fragment (#access_token=...&refresh_token=...)
      const hash = window.location.hash.substring(1); // Remove the '#'
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        window.location.replace("/forgot-password");
        return;
      }

      try {
        await exchangeCode({ accessToken, refreshToken }).unwrap();
      } catch {
        // Error toast is handled by RTK Query mutation
        window.location.replace("/forgot-password");
      }
    }
    exchange();
  }, [exchangeCode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
      <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
      <ResetPasswordForm />
    </div>
  );
};
export const ResetPasswordPage = withProviders(ResetPasswordPageComponent);
export default ResetPasswordPage;
