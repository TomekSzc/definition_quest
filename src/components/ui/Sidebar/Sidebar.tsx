import type { FC } from "react";
import { useRef, useEffect } from "react";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { useSidebar } from "@/hooks/useSidebar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { NavItem } from "@/components/ui/Sidebar/NavItem";
import type { NavItemVM } from "@/types/sidebar";
import { BoardsIcon, PlayedIcon, PlusIcon, MyBoardsIcon } from "@/assets/icons";
import { PowerIcon } from "@/assets/icons";
import { useLogoutMutation } from "@/store/api/apiSlice";
import { clsx } from "clsx";
import { Routes } from "@/lib/routes";

const navItems: NavItemVM[] = [
  { label: "Public Boards", route: Routes.Boards, icon: BoardsIcon },
  { label: "My Boards", route: Routes.MyBoards, icon: MyBoardsIcon },
  { label: "Played Boards", route: Routes.MyPlayedBoards, icon: PlayedIcon },
  { label: "Utwórz tablicę", route: "/boards/create", icon: PlusIcon },
];

export const Sidebar: FC = () => {
  const { collapsed, set } = useSidebar();
  const asideRef = useRef<HTMLDivElement>(null);
  const [logout] = useLogoutMutation();

  const clickedOutside = useClickOutside<HTMLDivElement>(asideRef);

  useEffect(() => {
    if (!collapsed && clickedOutside) {
      set(true);
    }
  }, [clickedOutside]);

  return (
    <aside
      ref={asideRef}
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
          {/* Logout item at bottom */}
          <button
            onClick={() => logout()}
            className={clsx(
              "mt-5 flex items-center gap-3 w-full text-sm font-bold px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white transition-colors",
              collapsed ? "justify-center" : ""
            )}
          >
            <PowerIcon className="h-5 w-5" />
            {!collapsed && <span>Log out</span>}
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
