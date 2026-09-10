import { useEffect, useRef, useCallback } from 'react';

export function usePolling(fetcher: () => Promise<boolean>, active: boolean, intervalMs = 2000) {
  const fetcherRef = useRef(fetcher);
  const activeRef = useRef(active);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  fetcherRef.current = fetcher;
  activeRef.current = active;

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    activeRef.current = true;

    let retryAfter = 0;

    const tick = async () => {
      if (!activeRef.current) return;
      try {
        const done = await fetcherRef.current();
        if (done || !activeRef.current) return;
      } catch {
        if (!activeRef.current) return;
      }
      timerRef.current = setTimeout(tick, retryAfter || intervalMs);
      retryAfter = 0;
    };

    tick();

    return () => {
      activeRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, intervalMs]);

  return stop;
}
