import { useCallback, useMemo } from "react";

export const useTime = () => {
  const msToMin = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");

    return `${mm}:${ss}`;
  }, []);

  return useMemo(
    () => ({
      msToMin,
    }),
    [msToMin]
  );
};
