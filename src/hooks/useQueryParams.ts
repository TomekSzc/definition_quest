import { useCallback, useState } from "react";

/**
 * Global hook returning current URL query params and updater.
 */

export function useQueryParams<T extends Record<string, string | undefined>>() {
  const getParams = (): T => {
    const searchParams = new URLSearchParams(window.location.search);
    const entries = Array.from(searchParams.entries()).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
    return entries as T;
  };

  const [params, setParamsState] = useState<T>(() => (typeof window !== "undefined" ? getParams() : ({} as T)));

  const setQueryParams = useCallback((newParams: Partial<T>, options: { replace?: boolean } = {}) => {
    const search = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === null) search.delete(k);
      else search.set(k, v as string);
    });
    const url = `${window.location.pathname}${search.toString() ? `?${search.toString()}` : ""}`;
    if (options.replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    setParamsState(getParams());
  }, []);

  return { params, setQueryParams };
}
