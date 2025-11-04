import Providers from "../Providers";
import SignUpForm from "../forms/SignUpForm";
import { Routes } from "../../lib/routes";
import type { FC } from "react";

export const SignUpPage: FC = () => {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <SignUpForm />
        <p className="text-[var(--color-white)] text-sm">
          Masz już konto? <a href={Routes.Login} className="underline">Zaloguj się</a>
        </p>
      </div>
    </Providers>
  );
}

export default SignUpPage;