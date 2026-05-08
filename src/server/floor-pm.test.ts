import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  selectResults: [] as Array<unknown[]>,
  pmScheduleUpdates: [] as Array<{ set: Record<string, unknown> }>,
  recordEventCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: () => {} }));

vi.mock('./floor-events', () => ({
  recordEvent: vi.fn(async (input: Record<string, unknown>) => {
    state.recordEventCalls.push(input);
    return { id: 'evt-1', ...input };
  }),
}));

vi.mock('@/db', async () => {
  const schema = await import('@/db/schema');

  function makeSelectChain() {
    const result = state.selectResults.shift() ?? [];
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => chain;
    chain.then = (resolve: (v: unknown) => void) => resolve(result);
    return chain;
  }

  const select = () => makeSelectChain();

  const update = (table: unknown) => ({
    set: (s: Record<string, unknown>) => {
      if (table === schema.pmSchedules) state.pmScheduleUpdates.push({ set: s });
      return {
        where: () => Promise.resolve(),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
    },
  });

  return { db: { select, update } };
});

import { listPmStatuses, markPmDone } from './floor-pm';
import { recordEvent } from './floor-events';

beforeEach(() => {
  state.selectResults = [];
  state.pmScheduleUpdates = [];
  state.recordEventCalls = [];
  (recordEvent as unknown as { mockClear?: () => void }).mockClear?.();
});

const NOW = new Date('2026-05-07T12:00:00Z');

describe('listPmStatuses', () => {
  it('returns one entry per schedule with the right level', async () => {
    state.selectResults = [[
      // Done a long time ago, way past due → red.
      {
        id: 'pm-1',
        stationId: 'st-1',
        label: 'Lubricate',
        cadenceDays: 7,
        lastDoneAt: '2026-04-01',
      },
      // Done recently, within cadence buffer → green.
      {
        id: 'pm-2',
        stationId: 'st-2',
        label: 'Inspect blades',
        cadenceDays: 30,
        lastDoneAt: '2026-05-06',
      },
      // Due in 3 days — yellow zone.
      {
        id: 'pm-3',
        stationId: 'st-1',
        label: 'Clean rollers',
        cadenceDays: 10,
        lastDoneAt: '2026-04-30',
      },
    ]];

    const out = await listPmStatuses(['st-1', 'st-2'], NOW);
    expect(out).toHaveLength(3);

    const byId = Object.fromEntries(out.map((r) => [r.pmId, r]));
    expect(byId['pm-1'].level).toBe('red');
    expect(byId['pm-1'].stationId).toBe('st-1');
    expect(byId['pm-1'].label).toBe('Lubricate');

    expect(byId['pm-2'].level).toBe('green');
    expect(byId['pm-3'].level).toBe('yellow');
  });

  it('returns empty when stationIds is empty', async () => {
    const out = await listPmStatuses([], NOW);
    expect(out).toEqual([]);
  });

  it('returns empty when stations have no PM schedules', async () => {
    state.selectResults = [[]];
    const out = await listPmStatuses(['st-1', 'st-2'], NOW);
    expect(out).toEqual([]);
  });
});

describe('markPmDone', () => {
  it('updates lastDoneAt AND emits a pm_performed event', async () => {
    // The select for the existing PM row.
    state.selectResults = [[{ id: 'pm-1', label: 'Lubricate' }]];

    await markPmDone({
      pmScheduleId: 'pm-1',
      stationId: 'st-1',
      recordedBy: 'user-1',
      shiftSessionId: 'sess-1',
      now: NOW,
    });

    // Update sets lastDoneAt to today's YYYY-MM-DD.
    expect(state.pmScheduleUpdates).toHaveLength(1);
    expect(state.pmScheduleUpdates[0].set.lastDoneAt).toBe('2026-05-07');

    // Event recorded with the right kind and payload.
    expect(recordEvent).toHaveBeenCalledTimes(1);
    expect(state.recordEventCalls).toHaveLength(1);
    const evt = state.recordEventCalls[0];
    expect(evt.kind).toBe('pm_performed');
    expect(evt.shiftSessionId).toBe('sess-1');
    expect(evt.stationId).toBe('st-1');
    expect(evt.recordedBy).toBe('user-1');
    expect(evt.payload).toEqual({ pmScheduleId: 'pm-1', label: 'Lubricate' });
  });
});
