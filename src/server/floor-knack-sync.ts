import { db } from '@/db';
import { knackRoutingsSnapshot, knackSyncRuns } from '@/db/schema';
import { knackFetch, getKnackConfig, parseKnackDate } from '@/lib/knack';
import {
  mapRoutingStepToStation,
  parseQtyRollup,
  parseCustomerAndItem,
  yesNoToBool,
  parseKnackInt,
} from '@/lib/floor-knack-parse';
import { desc, eq, sql } from 'drizzle-orm';

const FILTER = encodeURIComponent(
  JSON.stringify({
    match: 'and',
    rules: [
      { field: 'field_460', operator: 'is', value: 'No' },
      { field: 'field_517', operator: 'is', value: 'Yes' },
      { field: 'field_516', operator: 'is', value: 'Yes' },
    ],
  }),
);

export type SyncResult = {
  fetched: number;
  inserted: number;
  hiddenSkipped: number;
  status: 'ok' | 'skipped' | 'error';
  syncedAt: Date;
};

export async function syncFloorRoutings(): Promise<SyncResult> {
  const startedAt = Date.now();
  let fetched = 0;
  let hiddenSkipped = 0;
  const rows: (typeof knackRoutingsSnapshot.$inferInsert)[] = [];

  try {
    const config = getKnackConfig();
    if (!config) throw new Error('Knack not configured');

    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const data = (await knackFetch(
        config,
        `/objects/object_5/records?filters=${FILTER}&rows_per_page=1000&page=${page}`,
      )) as { total_pages: number; records: Record<string, any>[] };
      totalPages = data.total_pages ?? 1;
      fetched += data.records.length;
      for (const r of data.records) {
        const stationKey = mapRoutingStepToStation(String(r.field_43 ?? ''));
        if (!stationKey) {
          hiddenSkipped++;
          continue;
        }
        const qty = parseQtyRollup(String(r.field_1706 ?? ''));
        const ci = parseCustomerAndItem(String(r.field_1707 ?? ''));
        rows.push({
          knackRecordId: r.id,
          knackRunId: r.field_44_raw?.[0]?.id ?? null,
          jobNumber: r.field_1698 ?? null,
          customer: ci.customer,
          itemName: ci.itemName,
          routingStep: String(r.field_43),
          stationKey,
          complete: r.field_460_raw ?? false,
          artReady: yesNoToBool(r.field_517),
          materialReady: yesNoToBool(r.field_516),
          routingIsReady: r.field_574_raw ?? false,
          productionPriority: parseKnackInt(r.field_495),
          highPriority: yesNoToBool(r.field_1052),
          sheetsNeeded: qty.needed ?? parseKnackInt(r.field_929),
          sheetsProduced: qty.produced ?? parseKnackInt(r.field_575),
          sheetsReceived: qty.received,
          wasteExternal: parseKnackInt(r.field_1556),
          wasteInternal: parseKnackInt(r.field_1557),
          issueNotes: r.field_1583 ?? null,
          wcNotesToProd: r.field_538 ?? null,
          wcNotesByProd: r.field_1564 ?? null,
          runDueDate: parseKnackDate(r.field_2097 as string | null),
          routingCompleteAt: null,
        });
      }
      page++;
    }

    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(429000001)`);
      await tx.delete(knackRoutingsSnapshot);
      if (rows.length) {
        await tx.insert(knackRoutingsSnapshot).values(rows);
      }
    });

    const syncedAt = new Date();
    await db.insert(knackSyncRuns).values({
      kind: 'floor_routings',
      status: 'ok',
      fetched,
      inserted: rows.length,
      hiddenSkipped,
      durationMs: Date.now() - startedAt,
      syncedAt,
    });
    return { fetched, inserted: rows.length, hiddenSkipped, status: 'ok', syncedAt };
  } catch (err: any) {
    try {
      await db.insert(knackSyncRuns).values({
        kind: 'floor_routings',
        status: 'error',
        errorMessage: String(err?.message ?? err),
        fetched,
        inserted: rows.length,
        hiddenSkipped,
        durationMs: Date.now() - startedAt,
      });
    } catch {
      // best-effort log
    }
    throw err;
  }
}

export async function getLastFloorSync(): Promise<
  typeof knackSyncRuns.$inferSelect | null
> {
  const rows = await db
    .select()
    .from(knackSyncRuns)
    .where(eq(knackSyncRuns.kind, 'floor_routings'))
    .orderBy(desc(knackSyncRuns.syncedAt))
    .limit(1);
  return rows[0] ?? null;
}
