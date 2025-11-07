import type { FC } from "react";
import type { NavItemVM } from "@/types/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { clsx } from "clsx";

interface NavItemProps {
  item: NavItemVM;
}

export const NavItem: FC<NavItemProps> = ({ item }) => {
  const { collapsed } = useSidebar();
  const Icon = item.icon;

  return (
    <a
      href={item.route}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 hover:bg-opacity-50 transition-colors",
        collapsed && "justify-center px-0"
      )}
      role="menuitem"
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{item.label}</span>}
    </a>
  );
};

export default NavItem;
