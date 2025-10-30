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
          <Form.Control asChild>
            <input
              type="password"
              required
              {...register("password")}
              className={`mt-1 px-3 py-2 border-2 rounded outline-none focus:ring-2 bg-[var(--color-primary)] text-[var(--color-white)] ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-white)] focus:ring-[var(--color-white)]'}`}
              disabled={isLoading}
            />
          </Form.Control>
        </Form.Field>

        <Form.Submit asChild>
          <Button className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj"}
          </Button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
}
