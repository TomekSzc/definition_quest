import { useCallback, useEffect, useState } from 'react';

/**
 * Hook zwracający aktualny obiekt parametrów query oraz setter do ich modyfikacji.
 * Hook reaguje na zmianę parametrów (popstate / pushState) i aktualizuje wartość.
 */
export function useQueryParams<T extends Record<string, string | undefined>>() {
  const getParams = (): T => {
    const searchParams = new URLSearchParams(window.location.search);
    const entries = Array.from(searchParams.entries()).reduce(
      (acc, [key, value]) => {
        acc[key as keyof T] = value as any;
        return acc;
      },
      {} as any,
    );
    return entries as T;
  };

  const [params, setParamsState] = useState<T>(() => (typeof window !== 'undefined' ? getParams() : {} as T));

  // Update on back/forward navigation
  useEffect(() => {
    const handler = () => {
      setParamsState(getParams());
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const setQueryParams = useCallback(
    (newParams: Partial<T>, options: { replace?: boolean } = {}) => {
      const searchParams = new URLSearchParams(window.location.search);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          searchParams.delete(key);
        } else {
          searchParams.set(key, value as string);
        }
      });
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      if (options.replace) {
        window.history.replaceState(null, '', newUrl);
      } else {
        window.history.pushState(null, '', newUrl);
      }
      // trigger state update
      setParamsState(getParams());
    },
    [],
  );

  return { params, setQueryParams } as const;
}
