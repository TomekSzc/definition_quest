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
  const boardMatch = pathname.match(/^\/boards\/([^/]+)(?:\/(edit))?$/);
  const addLevelMatch = pathname.match(/^(?:\/my-boards|\/boards)\/[^/]+\/add-level$/);
  const isBoardDetail = Boolean(boardMatch);
  const isAddLevel = Boolean(addLevelMatch);
  const isEdit = boardMatch?.[2] === "edit";
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

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  if (isBoardDetail) {
    return (
      <button
        type="button"
        onClick={handleBack}
        className="text-[18px] md:text-[22px] flex items-center md:text-2xl font-bold cursor-pointer select-none bg-transparent border-none p-0"
      >
        <ChevronLeftIcon className="h-6 w-6 mr-2" />
        <span>{prevTitle}</span>
        <span className="mx-2">/</span>
        <span>{isEdit ? "Edit" : "Play"}</span>
      </button>
    );
  }
  if (isAddLevel) {
    const isMine = pathname.startsWith("/my-boards");
    const baseHref = isMine ? "/my-boards" : "/boards";
    const baseTitle = isMine ? "My Boards" : "Public Boards";
    return (
      <h1 className="text-2xl font-bold flex items-center">
        <a href={baseHref} className="hover:underline">
          {baseTitle}
        </a>
        <span className="mx-2">/</span>
        <span>Add level</span>
      </h1>
    );
  }

  return <h1 className="text-2xl font-bold">{title}</h1>;
};

export default Breadcrumbs;
