import { useCallback, useEffect, useState } from 'react';

/**
 * Global hook returning current URL query params and updater.
 */
export function useQueryParams<T extends Record<string, string | undefined>>() {
  const getParams = (): T => {
    const searchParams = new URLSearchParams(window.location.search);
    const entries = Array.from(searchParams.entries()).reduce((acc, [key, value]) => {
      (acc as any)[key] = value;
      return acc;
    }, {} as any);
    return entries as T;
  };

  const [params, setParamsState] = useState<T>(() => (typeof window !== 'undefined' ? getParams() : ({} as T)));

  useEffect(() => {
    const handler = () => {console.log('tomek', getParams());setParamsState(getParams())};
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const setQueryParams = useCallback((newParams: Partial<T>, options: { replace?: boolean } = {}) => {
    const search = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === null) search.delete(k);
      else search.set(k, v as string);
    });
    const url = `${window.location.pathname}${search.toString() ? `?${search.toString()}` : ''}`;
    if (options.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setParamsState(getParams());
  }, []);

  return { params, setQueryParams } as const;
}
