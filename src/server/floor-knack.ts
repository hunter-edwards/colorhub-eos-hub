// Phase 2: reads from knack_routings_snapshot, populated by
// `syncFloorRoutings()` in src/server/floor-knack-sync.ts. The mock
// generator that was here in Phase 1 has been removed — see git history
// (commits prior to Phase 2 merge) if you need the old shape.

import { db } from '@/db';
import { knackRoutingsSnapshot } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import type {
  FloorJob,
  FloorStationView,
  StationId,
} from '@/lib/floor-types';

function rowToJob(
  r: typeof knackRoutingsSnapshot.$inferSelect,
): FloorJob {
  return {
    id: r.knackRecordId,
    jobNumber: r.jobNumber ?? '',
    customer: r.customer ?? '',
    lineItem: r.itemName ?? '',
    sheetsNeeded: r.sheetsNeeded ?? 0,
    sheetsCompleted: r.sheetsProduced ?? 0,
    sheetsReceived: r.sheetsReceived ?? 0,
    wasteSheets: (r.wasteInternal ?? 0) + (r.wasteExternal ?? 0),
    routingComplete: r.complete,
    dueDate: r.runDueDate ?? null,
    issueNotes: r.issueNotes ? [r.issueNotes] : [],
  };
}

export async function getFloorView(
  stationIds: StationId[],
): Promise<FloorStationView[]> {
  const result: FloorStationView[] = [];
  for (const stationId of stationIds) {
    const rows = await db
      .select()
      .from(knackRoutingsSnapshot)
      .where(eq(knackRoutingsSnapshot.stationKey, stationId))
      .orderBy(
        asc(knackRoutingsSnapshot.productionPriority),
        asc(knackRoutingsSnapshot.runDueDate),
      );
    const [first, ...rest] = rows;
    result.push({
      stationId,
      status: rows.length > 0 ? 'running' : 'idle',
      current: first ? rowToJob(first) : null,
      queue: rest.map(rowToJob),
    });
  }
  return result;
}
