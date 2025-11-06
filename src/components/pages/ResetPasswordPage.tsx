import { withProviders } from "@/components/Providers";
import ResetPasswordForm from "../forms/ResetPasswordForm";
import { supabaseClient } from "../../db/supabase.client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../store/slices/toastSlice";
import type { FC } from "react";

const ResetPasswordPageComponent: FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    async function exchange() {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.exchangeCodeForSession(window.location.href);
      if (error || !session) {
        dispatch(
          showToast({
            type: "error",
            title: "Błąd",
            message: "Link resetujący jest nieprawidłowy lub wygasł.",
          }),
        );
        window.location.replace("/forgot-password");
      }
    }
    exchange();
  }, [dispatch]);

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <ResetPasswordForm />
      </div>
  );
};
export const ResetPasswordPage = withProviders(ResetPasswordPageComponent);
export default ResetPasswordPage;
