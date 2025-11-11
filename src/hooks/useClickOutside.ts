import { useState, useEffect } from "react";

/**
 * Detect clicks outside of the referenced element.
 * Returns `true` whenever the last mousedown occurred outside of the given ref.
 * The flag resets to `false` if the user clicks again inside the element.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(ref: React.RefObject<T | null>) {
  const [clickedOutside, setClickedOutside] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ref.current) return;
      const clickedOut = !ref.current.contains(e.target as Node);
      setClickedOutside(clickedOut);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref]);

  return clickedOutside;
}

export default useClickOutside;
