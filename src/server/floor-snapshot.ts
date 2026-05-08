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
  const [pmStatuses, floorView] = await Promise.all([
    listPmStatuses(stationIds, new Date()),
    getFloorView(stationIds),
  ]);

  return {
    polledAt: new Date().toISOString(),
    newEvents: events,
    assignments,
    tasks,
    pmStatuses,
    floorView,
  };
}
