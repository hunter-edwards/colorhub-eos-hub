'use server';

import { listEventsForShift } from './floor-events';
import { listAssignments } from './floor-shifts';
import { listTasks } from './floor-tasks';
import { listPmStatuses } from './floor-pm';
import { getFloorView } from './floor-knack';
import { listStations } from './floor-stations';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

/**
 * Polled snapshot for the live /floor TV.
 *
 * - `newEvents` is delta-only when `sinceOccurredAtIso` is supplied (events
 *   strictly newer than that timestamp). When null, returns the most recent
 *   200 events as a baseline.
 * - `assignments`, `tasks`, `pmStatuses`, `floorView` are fetched fresh each
 *   tick — they're all cheap and may change on demand.
 */
export async function getFloorSnapshot(
  shiftSessionId: string | null,
  sinceOccurredAtIso: string | null,
) {
  await requireUser();
  const since = sinceOccurredAtIso ? new Date(sinceOccurredAtIso) : null;

  const [events, assignments, tasks, stations] = await Promise.all([
    shiftSessionId
      ? listEventsForShift(shiftSessionId, {
          limit: 200,
          sinceOccurredAt: since ?? undefined,
        })
      : Promise.resolve([]),
    shiftSessionId
      ? listAssignments(shiftSessionId)
      : Promise.resolve([] as Array<{ stationId: string; userId: string }>),
    listTasks({ statuses: ['open', 'in_progress'] }),
    listStations(),
  ]);

  const stationIds = stations.map((s) => s.id);
  // getFloorView queries the Knack snapshot table by stationKey (the
  // value carried in `stations.knackMachineCenterId`), not by hub UUID.
  // Build the deduped list of stationKeys, fetch views, then re-key each
  // view back to the hub station.id so downstream consumers (which key
  // on station.id) get the right shape — same pattern as page.tsx.
  const stationKeys = Array.from(
    new Set(
      stations
        .map((s) => s.knackMachineCenterId)
        .filter((k): k is string => !!k),
    ),
  );
  const [pmStatuses, floorViewsByKey] = await Promise.all([
    listPmStatuses(stationIds, new Date()),
    getFloorView(stationKeys),
  ]);
  const viewByKey = new Map(floorViewsByKey.map((v) => [v.stationId, v]));
  const floorView = stations.map((s) => {
    const key = s.knackMachineCenterId;
    const v = key ? viewByKey.get(key) : undefined;
    if (!v) {
      return {
        stationId: s.id,
        status: 'idle' as const,
        current: null,
        queue: [],
      };
    }
    return { ...v, stationId: s.id };
  });

  return {
    polledAt: new Date().toISOString(),
    newEvents: events,
    assignments,
    tasks,
    pmStatuses,
    floorView,
  };
}
