import type { FC, MouseEventHandler } from "react";

interface ISubmitButtonProps {
  loadingText: string;
  idleText: string;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  dataTestId?: string;
}

export const SubmitButton: FC<ISubmitButtonProps> = ({
  loadingText,
  idleText,
  isLoading,
  disabled,
  className = "",
  onClick,
  dataTestId,
}) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      className={`w-full font-bold bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-black)] hover:text-[var(--color-white)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none px-4 py-2 rounded ${className}`}
      disabled={disabled ?? isLoading}
      data-test-id={dataTestId}
    >
      {isLoading ? loadingText : idleText}
    </button>
  );
};
