import { withProviders } from "@/components/HOC/Providers";
import { AuthForm } from "../forms/AuthForm";
import { Routes } from "../../lib/routes";
import type { FC } from "react";

const LoginPageComponent: FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
      <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
      <h4 className="text-[var(--color-white)] text-sm text-center">
        Aplikacja wspomagająca naukę słownictwa. <br /> Utwórz tablicę zawierającą pary słów i definicji, a następnie
        przetestuj swoją wiedzę w grze memory.
      </h4>
      <AuthForm />
      <p className="text-[var(--color-white)] text-sm mt-4">
        Nie masz konta?{" "}
        <a href={Routes.SignUp} className="underline" data-testid="signup-link">
          Zarejestruj się
        </a>
      </p>
      <p className="text-[var(--color-white)] text-sm">
        <a href={Routes.ForgotPassword} className="underline" data-testid="forgot-password-link">
          Zapomniałeś hasła?
        </a>
      </p>
    </div>
  );
};

export const LoginPage = withProviders(LoginPageComponent);
export default LoginPage;
