import type { FC } from "react";
import { MenuIcon, ChevronLeftIcon } from "@/assets/icons";
import { useSidebar } from "@/hooks/useSidebar";
import { clsx } from "clsx";

export const SidebarToggleButton: FC = () => {
  const { collapsed, toggle } = useSidebar();

  return (
    <button
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-pressed={collapsed}
      onClick={toggle}
      className={clsx(
        "flex items-center gap-3 rounded-md py-2 hover:bg-blue-700 hover:bg-opacity-50 transition-colors text-white w-full cursor-pointer",
        collapsed
          ? "justify-center position: absolute md:relative left-13 top-3 md:top-[unset] md:left-[unset]"
          : "px-3",
        "mt-2.4"
      )}
    >
      {collapsed ? <MenuIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
    </button>
  );
};

export default SidebarToggleButton;
