import Providers from "../Providers";
import ResetPasswordForm from "../forms/ResetPasswordForm";
import { supabaseClient } from "../../db/supabase.client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../store/slices/toastSlice";
import type { FC } from "react";

const ResetPasswordPage: FC = () => {
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
    <Providers>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <ResetPasswordForm />
      </div>
    </Providers>
  );
};

export default ResetPasswordPage;
