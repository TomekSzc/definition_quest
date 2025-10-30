import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "../../lib/validation/auth";
import type { LoginRequest } from "../../types";
import { useLoginMutation } from "../../store/api/apiSlice";
import * as Form from "@radix-ui/react-form";
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
    mode: "onBlur",
  });

  const [login, { isLoading }] = useLoginMutation();

  // Toggle password visibility while mouse is pressed on eye icon
  const [showPwd, setShowPwd] = useState(false);

  async function onSubmit(data: LoginRequest) {
    try {
      const res = await login(data).unwrap();
      if (res.data?.user) {
        window.location.href = "/dashboard";
      }
    } catch {
      console.warn("Login failed");
      /* toast handled globally */
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-[var(--color-primary)] p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
      <Form.Root className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Form.Field name="email" className="grid">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm text-[var(--color-white)]">Email</Form.Label>
            {errors?.email && <span className="text-red-600 text-xs">{errors.email.message}</span>}
          </div>
          <Form.Control asChild>
            <input
              type="email"
              required
              {...register("email")}
              className={`mt-1 px-3 py-2 border-2 rounded outline-none focus:ring-2 bg-[var(--color-primary)] text-[var(--color-white)] ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-white)] focus:ring-[var(--color-white)]'}`}
              disabled={isLoading}
            />
          </Form.Control>
        </Form.Field>
        <Form.Field name="password" className="grid">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm text-[var(--color-white)]">Hasło</Form.Label>
            {errors.password && <span className="text-red-600 text-xs">{errors.password.message}</span>}
          </div>
          <div className="relative mt-1">
            <Form.Control asChild>
              <input
                type={showPwd ? "text" : "password"}
                required
                {...register("password")}
                className={`pr-10 px-3 py-2 w-full border-2 rounded outline-none focus:ring-2 bg-[var(--color-primary)] text-[var(--color-white)] ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-white)] focus:ring-[var(--color-white)]'}`}
                disabled={isLoading}
              />
            </Form.Control>
            <img
              src="/icons/eye.svg"
              alt="Pokaż hasło"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer select-none"
              onMouseDown={() => setShowPwd(true)}
              onMouseUp={() => setShowPwd(false)}
              onMouseLeave={() => setShowPwd(false)}
            />
          </div>
        </Form.Field>

        <Form.Submit asChild>
          <Button className="w-full font-bold bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-black)] hover:text-[var(--color-white)]" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj"}
          </Button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
}
