import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResetPasswordSchema } from "../../lib/validation/auth";
import { useResetPasswordMutation } from "../../store/api/apiSlice";
import type { ResetPasswordRequest } from "../../types";
import * as Form from "@radix-ui/react-form";
import { FormInput } from "../ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { FC } from "react";

// Extend backend schema to include confirmPassword for client-side validation
const ClientSchema = ResetPasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});

export type ResetPasswordFormData = z.infer<typeof ClientSchema>;

const ResetPasswordForm: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ClientSchema),
    mode: "onBlur",
  });

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  async function onSubmit(data: ResetPasswordFormData) {
    const payload: ResetPasswordRequest = { newPassword: data.newPassword };
    await resetPassword(payload).unwrap(); // efekty uboczne obsługiwane globalnie
  }

  return (
    <div className="max-w-md w-full mx-auto bg-[var(--color-primary)] p-8 rounded-xl shadow border-2 border-[var(--color-white)]">
      <Form.Root className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          name="newPassword"
          label="Nowe hasło"
          register={register("newPassword")}
          error={errors.newPassword?.message}
          type="password"
          showPasswordToggle
          disabled={isLoading}
        />
        <FormInput
          name="confirmPassword"
          label="Potwierdź hasło"
          register={register("confirmPassword")}
          error={errors.confirmPassword?.message}
          type="password"
          showPasswordToggle
          disabled={isLoading}
        />
        <Form.Submit asChild>
          <SubmitButton
            idleText="Zmień hasło"
            loadingText="Zapisywanie..."
            isLoading={isLoading}
          />
        </Form.Submit>
      </Form.Root>
    </div>
  );
};

export default ResetPasswordForm;
