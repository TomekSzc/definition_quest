import { withProviders } from "@/components/Providers";
import { AuthForm } from "../forms/AuthForm";
import { Routes } from "../../lib/routes";
import type { FC } from "react";

const LoginPageComponent: FC = () => {
  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <AuthForm />
        <p className="text-[var(--color-white)] text-sm mt-4">
          Nie masz konta? <a href={Routes.SignUp} className="underline">Zarejestruj się</a>
        </p>
        <p className="text-[var(--color-white)] text-sm">
          <a href={Routes.ForgotPassword} className="underline">Zapomniałeś hasła?</a>
        </p>
      </div>
  );
};

export const LoginPage = withProviders(LoginPageComponent);
export default LoginPage;