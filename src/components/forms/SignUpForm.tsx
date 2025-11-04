import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema } from "../../lib/validation/auth";
import type { SignUpRequest } from "../../types";
import { useSignUpMutation } from "../../store/api/apiSlice";
import * as Form from "@radix-ui/react-form";
import { SubmitButton } from "../ui/SubmitButton";
import { FormInput } from "../ui/FormInput";
import { z } from "zod";
import { Routes } from "../../lib/routes";
import { ClientSignUpSchema } from "../../lib/schemas/auth";

export type SignUpFormData = z.infer<typeof ClientSignUpSchema>;

export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(ClientSignUpSchema),
    mode: "onBlur",
  });

  const [signUp, { isLoading }] = useSignUpMutation();

  async function onSubmit(data: SignUpFormData) {
    const payload: SignUpRequest = {
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    };
    await signUp(payload).unwrap();
    window.location.href = Routes.Home;
  }

  return (
    <div className="max-w-md w-full mx-auto bg-[var(--color-primary)] p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
      <Form.Root className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Display Name */}
        <FormInput
          name="displayName"
          label="Nazwa użytkownika"
          register={register("displayName")}
          error={errors.displayName?.message}
          disabled={isLoading}
        />

        {/* Email */}
        <FormInput
          name="email"
          label="Email"
          register={register("email")}
          error={errors.email?.message}
          type="email"
          disabled={isLoading}
        />

        {/* Password */}
        <FormInput
          name="password"
          label="Hasło"
          register={register("password")}
          error={errors.password?.message}
          type="password"
          disabled={isLoading}
          showPasswordToggle
        />

        {/* Repeat Password */}
        <FormInput
          name="repeatPassword"
          label="Powtórz hasło"
          register={register("repeatPassword")}
          error={errors.repeatPassword?.message}
          type="password"
          disabled={isLoading}
          showPasswordToggle
        />

        {/* Submit */}
        <Form.Submit asChild>
          <SubmitButton idleText="Zarejestruj" loadingText="Rejestracja..." isLoading={isLoading} />
        </Form.Submit>
      </Form.Root>
    </div>
  );
}
