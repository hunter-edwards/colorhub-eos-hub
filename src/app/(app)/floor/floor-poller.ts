'use client';

import { useEffect, useRef, useState } from 'react';
import { getFloorSnapshot } from '@/server/floor-snapshot';

export type FloorSnapshot = Awaited<ReturnType<typeof getFloorSnapshot>>;

/**
 * Polls the floor snapshot on an interval (default 15s).
 *
 * - Pauses while the tab is hidden, fires immediately on visibility return.
 * - Tracks the newest seen `occurredAt` so subsequent polls return only newer
 *   events (delta polling).
 */
export function useFloorPoll(
  shiftSessionId: string | null,
  intervalMs = 15000,
) {
  const [snapshot, setSnapshot] = useState<FloorSnapshot | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const lastSeenIso = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      try {
        const snap = await getFloorSnapshot(
          shiftSessionId,
          lastSeenIso.current,
        );
        if (cancelled) return;
        setSnapshot(snap);
        setLastSyncAt(new Date(snap.polledAt));
        if (snap.newEvents.length > 0) {
          // Events are returned newest-first; remember the newest occurredAt.
          const newest = snap.newEvents[0]?.occurredAt;
          if (newest) {
            lastSeenIso.current =
              newest instanceof Date
                ? newest.toISOString()
                : new Date(newest as unknown as string).toISOString();
          }
        }
      } catch {
        // Swallow — next tick will retry.
      }
    }

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, intervalMs) as unknown as number;

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [shiftSessionId, intervalMs]);

  return { snapshot, lastSyncAt };
}
