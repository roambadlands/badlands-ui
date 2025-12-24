import { useState, useEffect, useCallback } from "react";

/**
 * Hook that returns elapsed time in seconds from a given start timestamp.
 * Updates every 100ms for smooth display.
 */
export function useElapsedTime(startedAt: number | null): number {
  const calculateElapsed = useCallback(() => {
    if (!startedAt) return 0;
    return (Date.now() - startedAt) / 1000;
  }, [startedAt]);

  const [elapsed, setElapsed] = useState(calculateElapsed);

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, calculateElapsed]);

  return elapsed;
}
