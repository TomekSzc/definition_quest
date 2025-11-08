import type { FC } from "react";
import { useEffect, useState } from "react";
import type { NavItemVM } from "@/types/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { clsx } from "clsx";

interface NavItemProps {
  item: NavItemVM;
}

export const NavItem: FC<NavItemProps> = ({ item }) => {
  const { collapsed } = useSidebar();
  const Icon = item.icon;

  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const isActive = currentPath === item.route;

  return (
    <a
      href={isActive ? undefined : item.route}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-blue-700 bg-opacity-60 cursor-default pointer-events-none"
          : "hover:bg-blue-700 hover:bg-opacity-50"
      )}
      role="menuitem"
      aria-current={isActive ? "page" : undefined}
      tabIndex={isActive ? -1 : 0}
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{item.label}</span>}
    </a>
  );
};

export default NavItem;
 