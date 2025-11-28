import type { FC } from "react";
import clsx from "clsx";
import { useSidebar } from "@/hooks/useSidebar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface HeaderProps {
  className?: string;
}

/**
 * Full-width application header (60px height, fixed positioning with bottom shadow).
 * Dynamically adjusts left padding based on sidebar collapsed state.
 * - Collapsed sidebar: pl-13 (52px)
 * - Expanded sidebar: pl-72 (288px)
 */
export const Header: FC<HeaderProps> = ({ className }) => {
  const { collapsed } = useSidebar();

  const leftPadding = collapsed ? "pl-13" : "pl-72";
  const breadCrumbsVisible = !collapsed ? "hidden md:block" : "block";

  return (
    <header
      className={clsx(
        "w-full z-[1] fixed top-0 h-[60px] flex items-center px-6 shadow-md bg-[var(--color-primary)]",
        leftPadding,
        className
      )}
    >
      <div className={breadCrumbsVisible}>
        <Breadcrumbs />
      </div>
    </header>
  );
};
