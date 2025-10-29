import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "../../lib/validation/auth";
import type { LoginRequest } from "../../types";
import { useLoginMutation } from "../../store/api/apiSlice";
import { Button } from "../ui/button";
import { z } from "zod";

export type AuthFormData = z.infer<typeof LoginSchema>;

export default function AuthForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const [login, { isLoading }] = useLoginMutation();
  const [oauthLoading, setOauthLoading] = useState(false);

  async function onSubmit(data: LoginRequest) {
    try {
      const res = await login(data).unwrap();
      if (res.data?.user) {
        window.location.href = "/dashboard";
      }
    } catch {
      /* toast handled globally */
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(true);
    try {
      const { error } = await (window as any).supabase.auth.signInWithOAuth({
        provider,
      });
      if (error) throw error;
    } finally {
      setOauthLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-neutral-900 p-6 rounded-lg shadow">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
            disabled={isLoading || oauthLoading}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
            disabled={isLoading || oauthLoading}
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || oauthLoading}>
          {isLoading ? "Logowanie..." : "Zaloguj"}
        </Button>
      </form>
      <div className="flex items-center my-6">
        <span className="flex-grow h-px bg-gray-300 dark:bg-neutral-700" />
        <span className="mx-2 text-sm text-gray-500">lub</span>
        <span className="flex-grow h-px bg-gray-300 dark:bg-neutral-700" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          disabled={isLoading || oauthLoading}
          onClick={() => handleOAuth("google")}
        >
          {oauthLoading ? "Przekierowanie..." : "Zaloguj przez Google"}
        </Button>
        <Button
          variant="outline"
          disabled={isLoading || oauthLoading}
          onClick={() => handleOAuth("github")}
        >
          {oauthLoading ? "Przekierowanie..." : "Zaloguj przez GitHub"}
        </Button>
      </div>
    </div>
  );
}
