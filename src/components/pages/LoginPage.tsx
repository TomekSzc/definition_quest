import Providers from "../Providers";
import { AuthForm } from "../forms/AuthForm";
import { Routes } from "../../lib/routes";
import type { FC } from "react";

export const LoginPage: FC = () =>  {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <AuthForm />
        <p className="text-[var(--color-white)] text-sm mt-4">
          Nie masz konta? <a href={Routes.SignUp} className="underline">Zarejestruj się</a>
        </p>
      </div>
    </Providers>
  );
}
 export default LoginPage;