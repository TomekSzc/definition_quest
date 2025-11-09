import type { FC } from "react";
import { ChevronLeftIcon } from "@/assets/icons";

// Mapping of known static routes to their display titles
const routeTitles: Record<string, string> = {
  "/boards": "Public Boards",
  "/my-boards": "My Boards",
  "/played-boards": "Played Boards",
  "/create-board": "Create Board",
  "/played": "Played Boards",
};

/**
 * Displays either the page title or breadcrumbs with a back link when on a board detail page.
 */
export const Breadcrumbs: FC = () => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isBoardDetail = /^\/boards\/[^/]+$/.test(pathname);
  const title = routeTitles[pathname] ?? "Public Boards";

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  if (isBoardDetail) {
    return (
      <a
        href="#"
        onClick={handleBack}
        className="flex items-center text-2xl font-bold cursor-pointer select-none"
      >
        <ChevronLeftIcon className="h-6 w-6 mr-2" />
        <span>{routeTitles["/boards"]}</span>
        <span className="mx-2">/</span>
        <span>Play</span>
      </a>
    );
  }

  return <h1 className="text-2xl font-bold">{title}</h1>;
};

export default Breadcrumbs;
