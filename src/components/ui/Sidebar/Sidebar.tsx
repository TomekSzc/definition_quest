import type { FC } from "react";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { useSidebar } from "@/hooks/useSidebar";
import { NavItem } from "@/components/ui/Sidebar/NavItem";
import type { NavItemVM } from "@/types/sidebar";
import { BoardsIcon, PlayedIcon, PlusIcon, MyBoardsIcon } from "@/assets/icons";
import { Routes } from "@/lib/routes";

const navItems: NavItemVM[] = [
  { label: "Public Boards", route: Routes.Boards, icon: BoardsIcon },
  { label: "My Boards", route: Routes.MyBoards, icon: MyBoardsIcon },
  { label: "Played Boards", route: Routes.MyPlayedBoards, icon: PlayedIcon },
  { label: "Utwórz tablicę", route: "/boards/create", icon: PlusIcon },
];

export const Sidebar: FC = () => {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={
        collapsed
          ? "fixed left-[-50px] md:left-0 top-0 z-40 h-full bg-[var(--color-primary)] text-white transition-all duration-200"
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
