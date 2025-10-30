import Providers from "../Providers";
import AuthForm from "../forms/AuthForm";

export default function LoginPage() {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-primary)] space-y-6">
        <h1 className="text-[36px] text-[var(--color-white)] font-bold">Definition quest</h1>
        <AuthForm />
      </div>
    </Providers>
  );
}
