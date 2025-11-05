import type { FC, ReactNode } from 'react';
import clsx from 'clsx';

interface HeaderProps {
  /** Content to render inside header (e.g., logo, nav, actions) */
  children?: ReactNode;
  className?: string;
}

/**
 * Full-width application header (80 px height, bottom shadow).
 */
export const Header: FC<HeaderProps> = ({ children, className }) => (
  <header
    className={clsx(
      'w-screen h-[80px] flex items-center px-6 shadow-md bg-[var(--color-primary)]',
      className,
    )}
  >
    {children}
  </header>
);
