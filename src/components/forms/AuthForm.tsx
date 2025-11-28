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
import { Routes } from "@/lib/routes";
export type AuthFormData = z.infer<typeof LoginSchema>;
import { useQueryParams } from "@/hooks/useQueryParams";
import { useMemo } from "react";

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
  const { params } = useQueryParams();

  const getRouteAddress = useMemo(() => {
    const returnUrl = params.return;
    const returnRoute = Object.values(Routes).find((route) => route === returnUrl);
    if (!returnUrl || !returnRoute) {
      return Routes.Boards;
    }
    return returnRoute;
  }, [params.return]);

  async function onSubmit(data: LoginRequest) {
    const res = await login(data).unwrap();
    if (res.data?.user) {
      window.location.assign(getRouteAddress);
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-[var(--color-primary)]  p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
      <Form.Root className="space-y-6" onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
        <FormInput
          name="email"
          label="Email"
          register={register("email")}
          error={errors.email?.message}
          type="email"
          disabled={isLoading}
          dataTestId="login-email-input"
        />
        <FormInput
          name="password"
          label="Hasło"
          register={register("password")}
          error={errors.password?.message}
          type="password"
          disabled={isLoading}
          showPasswordToggle
          dataTestId="login-password-input"
        />

        <Form.Submit asChild>
          <SubmitButton
            idleText="Zaloguj"
            loadingText="Logowanie..."
            isLoading={isLoading}
            dataTestId="login-submit-button"
          />
        </Form.Submit>
      </Form.Root>
    </div>
  );
};

export default AuthForm;
