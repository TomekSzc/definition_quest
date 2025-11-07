import type { FC } from "react";
import SidebarToggleButton from "./SidebarToggleButton";
import { useSidebar } from "@/hooks/useSidebar";
import { NavItem } from "./NavItem";
import type { NavItemVM } from "@/types/sidebar";
import { BoardsIcon, PlayedIcon, PlusIcon, MyBoardsIcon } from "@/assets/icons";

const navItems: NavItemVM[] = [
  { label: "Public Boards", route: "/boards", icon: BoardsIcon },
  { label: "My Boards", route: "/my-boards", icon: MyBoardsIcon },
  { label: "Played", route: "/played-boards", icon: PlayedIcon },
  { label: "Create Board", route: "/create-board", icon: PlusIcon },
];

export const Sidebar: FC = () => {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={
        collapsed
          ? "fixed left-0 top-0 z-40 h-full w-16 bg-[var(--color-primary)] text-white transition-all duration-200"
          : "fixed left-0 top-0 z-40 h-full w-64 bg-[var(--color-primary)] text-white transition-all duration-200"
      }
      aria-expanded={!collapsed}
    >
      <div className="flex flex-col h-full py-4 space-y-1">
        <SidebarToggleButton />
        <nav className="flex-1 space-y-1" role="menu">
          {navItems.map((item) => (
            <NavItem key={item.route} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
