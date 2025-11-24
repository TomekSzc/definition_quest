/* eslint-disable */
import { useEffect, useState } from "react";

// Returns current `.value` of a ref (e.g., input) and keeps it in state
export function useRefValue<T extends { value?: unknown }>(ref: React.RefObject<T | null>) {
  const [value, setValue] = useState<T["value"] | undefined>(undefined);

  useEffect(() => {
    if (ref.current?.value !== undefined) {
      setValue(ref.current.value);
    }
  }, [ref.current?.value]);

  return value;
}
