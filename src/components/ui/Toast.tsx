import { useEffect } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideToast, selectToast, clearToast } from "@/store/slices/toastSlice";
import type { ToastType } from "@/store/slices/toastSlice";
import type { FC } from "react";

export const Toast: FC = () => {
  const dispatch = useAppDispatch();
  const { visible, type = "info", title, message } = useAppSelector(selectToast);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => dispatch(hideToast()), 15000);
    return () => clearTimeout(timeout);
  }, [visible, dispatch]);

  if (!visible) return null;

  const closeToast = () => {
    dispatch(clearToast());
  };

  const colorMap: Record<ToastType, string> = {
    success: "bg-[var(--color-toast-success-bg)] text-[var(--color-toast-success-text)]",
    error: "bg-[var(--color-toast-error-bg)] text-[var(--color-toast-error-text)]",
    warning: "bg-[var(--color-toast-warning-bg)] text-[var(--color-toast-warning-text)]",
    info: "bg-[var(--color-toast-success-bg)] text-[var(--color-toast-success-text)]",
  };

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        className={`z-[1000] fixed bottom-4 right-4 w-96 rounded-md shadow-lg border p-4 text-sm data-[state=open]:animate-in data-[state=closed]:animate-out ${colorMap[type as ToastType]}`}
        open={visible}
        onOpenChange={(v: boolean) => !v && dispatch(clearToast())}
      >
        {title && <ToastPrimitive.Title className="font-semibold mb-1">{title}</ToastPrimitive.Title>}
        <ToastPrimitive.Description>{message}</ToastPrimitive.Description>

        <button
          aria-label="Close"
          className="absolute top-2 right-2 text-inherit hover:opacity-80 cursor-pointer font-extrabold text-lg leading-none"
          onClick={() => dispatch(clearToast())}
        >
          ×
        </button>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-96 outline-none" />
    </ToastPrimitive.Provider>
  );
};

export default Toast;
