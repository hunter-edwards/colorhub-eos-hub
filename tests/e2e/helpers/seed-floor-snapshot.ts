/**
 * Test helper for `tests/e2e/floor.spec.ts`. Seeds rows into
 * `knack_routings_snapshot` so the floor dashboard renders specific
 * scenarios without needing live Knack data.
 *
 * Usage from a Playwright test (after the test DB is reachable):
 *
 *   import { seedFloorSnapshot, clearFloorSnapshot } from './helpers/seed-floor-snapshot';
 *   await seedFloorSnapshot([
 *     { stationKey: 'press_1', jobNumber: 'J-1', customer: 'Acme', sheetsNeeded: 5000 },
 *   ]);
 *
 * The helper writes via Drizzle the same way `syncFloorRoutings()` does —
 * test stays in sync with production write path without touching Knack.
 */

import { db } from '@/db';
import { knackRoutingsSnapshot } from '@/db/schema';

type SeedRouting = {
  stationKey: string;
  jobNumber?: string;
  customer?: string;
  itemName?: string;
  sheetsNeeded?: number;
  sheetsProduced?: number;
  sheetsReceived?: number;
  routingStep?: string;
  productionPriority?: number;
  knackRecordId?: string;
};

export async function clearFloorSnapshot() {
  await db.delete(knackRoutingsSnapshot);
}

export async function seedFloorSnapshot(items: SeedRouting[]) {
  if (items.length === 0) return;
  await db.insert(knackRoutingsSnapshot).values(
    items.map((it, i) => ({
      knackRecordId: it.knackRecordId ?? `test-${i + 1}`,
      knackRunId: null,
      jobNumber: it.jobNumber ?? `J-${i + 1}`,
      customer: it.customer ?? 'Test Customer',
      itemName: it.itemName ?? `Item ${i + 1}`,
      routingStep: it.routingStep ?? routingStepForKey(it.stationKey),
      stationKey: it.stationKey,
      complete: false,
      artReady: true,
      materialReady: true,
      routingIsReady: true,
      productionPriority: it.productionPriority ?? 20,
      highPriority: false,
      sheetsNeeded: it.sheetsNeeded ?? 5000,
      sheetsProduced: it.sheetsProduced ?? 0,
      sheetsReceived: it.sheetsReceived ?? null,
      wasteExternal: 0,
      wasteInternal: 0,
      issueNotes: null,
      wcNotesToProd: null,
      wcNotesByProd: null,
      runDueDate: null,
      routingCompleteAt: null,
    })),
  );
}

function routingStepForKey(key: string): string {
  switch (key) {
    case 'press_1':
      return 'PRINT - BRN';
    case 'press_2':
      return 'PRINT - Durst';
    case 'cad':
      return 'CAD';
    case 'rotary':
      return 'DIE';
    case 'gluer_tape':
      return 'GLUE';
    case 'handwork':
      return 'HAND FULFILLMENT';
    case 'shipping':
      return 'SHIP PREP';
    default:
      return 'PRINT - BRN';
  }
}
