import type { FC, PropsWithChildren } from "react";

const Chip: FC<PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <span
    className={`inline-block rounded-full bg-[var(--color-primary)] text-[var(--color-white)] px-2 py-0.5 text-xs ${className}`}
  >
    {children}
  </span>
);

export default Chip;
