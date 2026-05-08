import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  selectResults: [] as Array<unknown[]>,
  insertedSchedules: [] as Array<Record<string, unknown>>,
  scheduleUpdates: [] as Array<{ set: Record<string, unknown> }>,
  scheduleDeletes: 0,
  lastSelectChain: null as null | { whereCalls: number; orderByCalls: number },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: () => {} }));

vi.mock('@/db', async () => {
  const schema = await import('@/db/schema');

  function makeSelectChain() {
    const result = state.selectResults.shift() ?? [];
    const tracker = { whereCalls: 0, orderByCalls: 0 };
    state.lastSelectChain = tracker;
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => {
      tracker.whereCalls++;
      return chain;
    };
    chain.orderBy = () => {
      tracker.orderByCalls++;
      return chain;
    };
    chain.limit = () => chain;
    chain.then = (resolve: (v: unknown) => void) => resolve(result);
    return chain;
  }

  const select = () => makeSelectChain();

  const insert = (table: unknown) => ({
    values: (v: unknown) => {
      const arr = Array.isArray(v) ? v : [v];
      for (const row of arr) {
        if (table === schema.pmSchedules) {
          state.insertedSchedules.push(row as Record<string, unknown>);
        }
      }
      const ret = {
        returning: async () =>
          arr.map((row, i) => ({
            id: `pm-${state.insertedSchedules.length - arr.length + i + 1}`,
            ...(row as Record<string, unknown>),
          })),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return ret;
    },
  });

  const update = (table: unknown) => ({
    set: (s: Record<string, unknown>) => {
      if (table === schema.pmSchedules) state.scheduleUpdates.push({ set: s });
      const whereChain = {
        returning: async () => [{ id: 'pm-updated', ...s }],
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return {
        where: () => whereChain,
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
    },
  });

  const del = (table: unknown) => {
    if (table === schema.pmSchedules) state.scheduleDeletes++;
    return {
      where: () => Promise.resolve(),
      then: (resolve: (v: unknown) => void) => resolve(undefined),
    };
  };

  return { db: { select, insert, update, delete: del } };
});

import {
  listForStation,
  listForStations,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from './floor-pm-schedules';

beforeEach(() => {
  state.selectResults = [];
  state.insertedSchedules = [];
  state.scheduleUpdates = [];
  state.scheduleDeletes = 0;
  state.lastSelectChain = null;
});

describe('listForStation', () => {
  it('returns rows ordered by label (orderBy + where invoked)', async () => {
    state.selectResults = [[
      { id: 'a', stationId: 's1', label: 'Aaa', cadenceDays: 7, lastDoneAt: null },
      { id: 'b', stationId: 's1', label: 'Bbb', cadenceDays: 30, lastDoneAt: null },
    ]];
    const out = await listForStation('s1');
    expect(out).toHaveLength(2);
    expect(state.lastSelectChain?.whereCalls).toBe(1);
    expect(state.lastSelectChain?.orderByCalls).toBe(1);
  });

  it('returns empty when no rows', async () => {
    state.selectResults = [[]];
    const out = await listForStation('s1');
    expect(out).toEqual([]);
  });
});

describe('listForStations', () => {
  it('returns empty map when station ids list is empty', async () => {
    const out = await listForStations([]);
    expect(out.size).toBe(0);
  });

  it('groups schedules by stationId, all stations present in map', async () => {
    state.selectResults = [[
      { id: 'p1', stationId: 's1', label: 'Aaa', cadenceDays: 7, lastDoneAt: null },
      { id: 'p2', stationId: 's2', label: 'Bbb', cadenceDays: 30, lastDoneAt: null },
      { id: 'p3', stationId: 's1', label: 'Ccc', cadenceDays: 14, lastDoneAt: null },
    ]];
    const out = await listForStations(['s1', 's2', 's3']);
    expect(out.get('s1')?.map((s) => s.id)).toEqual(['p1', 'p3']);
    expect(out.get('s2')?.map((s) => s.id)).toEqual(['p2']);
    expect(out.get('s3')).toEqual([]);
  });
});

describe('createSchedule', () => {
  it('inserts with all given fields', async () => {
    await createSchedule({
      stationId: 's1',
      label: 'Oil change',
      cadenceDays: 30,
      lastDoneAt: '2026-05-01',
    });
    expect(state.insertedSchedules).toHaveLength(1);
    expect(state.insertedSchedules[0]).toEqual({
      stationId: 's1',
      label: 'Oil change',
      cadenceDays: 30,
      lastDoneAt: '2026-05-01',
    });
  });

  it('inserts with lastDoneAt null when omitted', async () => {
    await createSchedule({ stationId: 's1', label: 'Filter', cadenceDays: 7 });
    expect(state.insertedSchedules[0].lastDoneAt).toBeNull();
  });
});

describe('updateSchedule', () => {
  it('updates only the fields provided', async () => {
    await updateSchedule('pm-1', { label: 'Renamed' });
    expect(state.scheduleUpdates).toHaveLength(1);
    expect(state.scheduleUpdates[0].set).toEqual({ label: 'Renamed' });
  });

  it('passes through lastDoneAt null', async () => {
    await updateSchedule('pm-1', { lastDoneAt: null });
    expect(state.scheduleUpdates[0].set).toEqual({ lastDoneAt: null });
  });

  it('updates multiple fields together', async () => {
    await updateSchedule('pm-1', { label: 'L', cadenceDays: 14, lastDoneAt: '2026-01-02' });
    expect(state.scheduleUpdates[0].set).toEqual({
      label: 'L',
      cadenceDays: 14,
      lastDoneAt: '2026-01-02',
    });
  });
});

describe('deleteSchedule', () => {
  it('deletes by id', async () => {
    await deleteSchedule('pm-1');
    expect(state.scheduleDeletes).toBe(1);
  });
});
