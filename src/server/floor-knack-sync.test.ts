import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted DB mock state
const state = vi.hoisted(() => ({
  deletedSnapshot: 0,
  insertedRoutings: [] as any[],
  syncRuns: [] as any[],
}));

vi.mock('@/db', () => {
  const tx = {
    execute: vi.fn().mockResolvedValue(undefined),
    delete: () => ({
      // drizzle's tx.delete(table) returns a thenable; tests await it
      async then(resolve: any) {
        state.deletedSnapshot++;
        resolve(undefined);
      },
    }),
    insert: (_table: any) => ({
      values: async (rows: any[]) => {
        if (Array.isArray(rows)) state.insertedRoutings.push(...rows);
        else state.insertedRoutings.push(rows);
      },
    }),
  };
  return {
    db: {
      transaction: async (fn: any) => fn(tx),
      insert: (_table: any) => ({
        values: async (row: any) => {
          state.syncRuns.push(row);
        },
      }),
    },
  };
});

vi.mock('@/lib/knack', async () => {
  const actual = await vi.importActual<typeof import('@/lib/knack')>('@/lib/knack');
  return {
    ...actual,
    knackFetch: vi.fn(),
    getKnackConfig: () => ({ appId: 'a', apiKey: 'k' }),
  };
});

import { knackFetch } from '@/lib/knack';
import { syncFloorRoutings } from './floor-knack-sync';

beforeEach(() => {
  state.deletedSnapshot = 0;
  state.insertedRoutings = [];
  state.syncRuns = [];
  vi.mocked(knackFetch).mockReset();
});

describe('syncFloorRoutings', () => {
  it('paginates, parses, and writes visible routings', async () => {
    vi.mocked(knackFetch).mockResolvedValueOnce({
      total_pages: 1,
      records: [
        {
          id: 'rec1',
          field_43: 'PRINT - BRN',
          field_44_raw: [{ id: 'run1' }],
          field_460: 'No',
          field_460_raw: false,
          field_517: 'Yes',
          field_516: 'Yes',
          field_574_raw: true,
          field_495: '10.0',
          field_1052: 'No',
          field_929: 5000,
          field_575: 0,
          field_1706: '0 / 5000 (+10%/-0%)\nRcvd = 4500\n#Jobs = 1',
          field_1707: 'Acme Corp<br /><br />Part A',
          field_1698: '055_19141_1',
          field_2097: '05/26/2026',
          field_1583: null,
          field_538: null,
          field_1564: null,
          field_1556: '',
          field_1557: '',
        },
        // SLIT - hidden
        {
          id: 'rec2',
          field_43: 'SLIT',
          field_460: 'No',
          field_460_raw: false,
          field_517: 'Yes',
          field_516: 'Yes',
          field_574_raw: true,
          field_495: '20.0',
          field_1052: 'No',
          field_1706: '',
          field_1707: '',
        },
      ],
    });

    const result = await syncFloorRoutings();

    expect(result.fetched).toBe(2);
    expect(result.hiddenSkipped).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.status).toBe('ok');
    expect(state.insertedRoutings).toHaveLength(1);
    expect(state.insertedRoutings[0]).toMatchObject({
      knackRecordId: 'rec1',
      knackRunId: 'run1',
      stationKey: 'press_1',
      routingStep: 'PRINT - BRN',
      customer: 'Acme Corp',
      itemName: 'Part A',
      jobNumber: '055_19141_1',
      sheetsNeeded: 5000,
      sheetsProduced: 0,
      sheetsReceived: 4500,
      productionPriority: 10,
      highPriority: false,
      complete: false,
      artReady: true,
      materialReady: true,
      routingIsReady: true,
      runDueDate: '2026-05-26',
    });
    expect(state.syncRuns).toHaveLength(1);
    expect(state.syncRuns[0]).toMatchObject({
      kind: 'floor_routings',
      status: 'ok',
      fetched: 2,
      inserted: 1,
      hiddenSkipped: 1,
    });
  });

  it('logs error on Knack failure and leaves snapshot alone', async () => {
    vi.mocked(knackFetch).mockRejectedValueOnce(new Error('boom'));
    await expect(syncFloorRoutings()).rejects.toThrow('boom');
    expect(state.insertedRoutings).toHaveLength(0);
    expect(state.syncRuns).toHaveLength(1);
    expect(state.syncRuns[0]).toMatchObject({
      kind: 'floor_routings',
      status: 'error',
    });
    expect(state.syncRuns[0].errorMessage).toContain('boom');
  });

  it('falls back to direct numeric fields when rollup is sparse', async () => {
    vi.mocked(knackFetch).mockResolvedValueOnce({
      total_pages: 1,
      records: [
        {
          id: 'rec3',
          field_43: 'PRINT - Durst',
          field_44_raw: [{ id: 'r' }],
          field_460: 'No',
          field_460_raw: false,
          field_517: 'Yes',
          field_516: 'Yes',
          field_574_raw: true,
          field_495: '20',
          field_1052: 'No',
          field_929: 1234,
          field_575: 567,
          field_1706: '',   // empty rollup
          field_1707: 'X<br /><br />Y',
          field_1698: 'J',
          field_2097: null,
        },
      ],
    });
    await syncFloorRoutings();
    expect(state.insertedRoutings[0]).toMatchObject({
      sheetsNeeded: 1234,
      sheetsProduced: 567,
      sheetsReceived: null,
    });
  });
});
