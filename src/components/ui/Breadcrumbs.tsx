import type { FC } from "react";
import { useMemo } from "react";
import { ChevronLeftIcon } from "@/assets/icons";

// Mapping of known static routes to their display titles
const routeTitles: Record<string, string> = {
  "/boards": "Public Boards",
  "/my-boards": "My Boards",
  "/played-boards": "Played Boards",
  "/boards/create": "Utwórz tablicę",
  "/played": "Played Boards",
};

/**
 * Displays either the page title or breadcrumbs with a back link when on a board detail page.
 */
export const Breadcrumbs: FC = () => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isBoardDetail = /^\/boards\/[^/]+$/.test(pathname);
  const title = routeTitles[pathname] ?? "Public Boards";

  const prevTitle = useMemo(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return routeTitles["/boards"];
    }

    try {
      const ref = document.referrer;
      if (!ref) return routeTitles["/boards"];

      const refUrl = new URL(ref);
      if (refUrl.origin !== window.location.origin) {
        return routeTitles["/boards"];
      }

      return routeTitles[refUrl.pathname] ?? routeTitles["/boards"];
    } catch {
      return routeTitles["/boards"]; // malformed referrer
    }
  }, []);

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
        className="text-[16px] text-[24px] flex items-center text-2xl font-bold cursor-pointer select-none"
      >
        <ChevronLeftIcon className="h-6 w-6 mr-2" />
        <span>{prevTitle}</span>
        <span className="mx-2">/</span>
        <span>Play</span>
      </a>
    );
  }

  return <h1 className="text-2xl font-bold">{title}</h1>;
};

export default Breadcrumbs;
