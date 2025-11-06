import { withProviders } from "@/components/Providers";
import ForgotPasswordForm from "../forms/ForgotPasswordForm";
import { Routes } from "../../lib/routes";
import type { FC } from "react";

const ForgotPasswordPageComponent: FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
      <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
      <ForgotPasswordForm />
      <p className="text-[var(--color-white)] text-sm mt-4">
        Pamiętasz hasło? <a href={Routes.Login} className="underline">Zaloguj się</a>
      </p>
    </div>
  );
};

export const ForgotPasswordPage = withProviders(ForgotPasswordPageComponent);
export default ForgotPasswordPage;
