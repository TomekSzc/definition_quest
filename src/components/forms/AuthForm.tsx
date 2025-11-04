import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "../../lib/validation/auth";
import type { LoginRequest } from "../../types";
import { useLoginMutation } from "../../store/api/apiSlice";
import * as Form from "@radix-ui/react-form";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormInput } from "../ui/FormInput";
import { z } from "zod";
import type { FC } from "react";

export type AuthFormData = z.infer<typeof LoginSchema>;

export const AuthForm: FC = () => {
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
      console.warn("Login failed");
      /* toast handled globally */
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-[var(--color-primary)] p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
      <Form.Root className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          name="email"
          label="Email"
          register={register("email")}
          error={errors.email?.message}
          type="email"
          disabled={isLoading}
        />
        <FormInput
          name="password"
          label="Hasło"
          register={register("password")}
          error={errors.password?.message}
          type="password"
          disabled={isLoading}
          showPasswordToggle
        />

        <Form.Submit asChild>
          <SubmitButton idleText="Zaloguj" loadingText="Logowanie..." isLoading={isLoading} />
        </Form.Submit>
      </Form.Root>
    </div>
  );
};

export default AuthForm;
