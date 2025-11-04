import { useState } from "react";
import * as Form from "@radix-ui/react-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { FC } from "react";
import { Icons } from "@/assets/icons";

interface IInputProps {
  name: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  type?: "text" | "email" | "password";
  disabled?: boolean;
  showPasswordToggle?: boolean;
}

export const FormInput:FC<IInputProps> = ({
  name,
  label,
  register,
  error,
  type = "text",
  disabled = false,
  showPasswordToggle = false,
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const computedType = type === "password" && showPasswordToggle ? (showPwd ? "text" : "password") : type;

  return (
    <Form.Field name={name} className="grid">
      <div className="flex items-baseline justify-between">
        <Form.Label className="text-sm text-[var(--color-white)]">{label}</Form.Label>
        {error && <span className="text-red-600 text-xs">{error}</span>}
      </div>
      <div className="relative mt-1">
        <Form.Control asChild>
          <input
            type={computedType}
            required
            className={`w-full px-3 py-2 border-2 rounded outline-none focus:ring-2 bg-[var(--color-primary)] text-[var(--color-white)] ${error ? "border-red-500 focus:ring-red-500" : "border-[var(--color-white)] focus:ring-[var(--color-white)]"}`}
            disabled={disabled}
            {...register}
          />
        </Form.Control>
        {type === "password" && showPasswordToggle && (
          <img
            src={Icons.Eye}
            alt="Pokaż hasło"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer select-none invert"
            onMouseDown={() => setShowPwd(true)}
            onMouseUp={() => setShowPwd(false)}
            onMouseLeave={() => setShowPwd(false)}
          />
        )}
      </div>
    </Form.Field>
  );
};

