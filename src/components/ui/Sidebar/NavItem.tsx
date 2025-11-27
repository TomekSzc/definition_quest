import type { FC } from "react";
import { useEffect, useState } from "react";
import type { NavItemVM } from "@/types/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { clsx } from "clsx";

interface NavItemProps {
  item: NavItemVM;
}

export const NavItem: FC<NavItemProps> = ({ item }) => {
  const { collapsed, toggle } = useSidebar();
  const Icon = item.icon;

  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const handleClick = () => {
    // Always collapse sidebar on mobile/desktop after navigation
    if (!collapsed) {
      toggle();
    }
  };

  const isActive = currentPath === item.route;

  return (
    <a
      href={item.route}
      onClick={handleClick}
      data-testid={`nav-${item.route.replace(/\//g, "-")}`}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
        collapsed ? "justify-center text-sm font-normal" : "text-sm font-bold",
        isActive
          ? "bg-blue-700 bg-opacity-60 cursor-default pointer-events-none"
          : "hover:bg-blue-700 hover:bg-opacity-50 cursor-pointer"
      )}
      role="menuitem"
      aria-current={isActive ? "page" : undefined}
      aria-disabled={isActive || undefined}
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{item.label}</span>}
    </a>
  );
};

export default NavItem;
