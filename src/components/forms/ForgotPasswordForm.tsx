import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForgotPasswordSchema } from "../../lib/validation/auth";
import type { ForgotPasswordRequest } from "../../types";
import { useForgotPasswordMutation } from "../../store/api/apiSlice";
import * as Form from "@radix-ui/react-form";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormInput } from "../ui/FormInput";
import { z } from "zod";
import type { FC } from "react";

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

const ForgotPasswordForm: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onBlur",
  });

  const [requestReset, { isLoading, isSuccess }] = useForgotPasswordMutation();

  async function onSubmit(data: ForgotPasswordRequest) {
    await requestReset(data).unwrap(); // toast handled globally
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
          disabled={isLoading || isSuccess}
        />

        <Form.Submit asChild>
          <SubmitButton idleText="Wyślij link" loadingText="Wysyłanie..." isLoading={isLoading} disabled={isSuccess} />
        </Form.Submit>
      </Form.Root>
    </div>
  );
};

export default ForgotPasswordForm;
