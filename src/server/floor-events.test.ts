import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  selectResults: [] as Array<unknown[]>,
  insertedShiftEvents: [] as Array<Record<string, unknown>>,
  // Capture filter args so tests can assert ordering / limit / since.
  lastSelectChain: null as null | {
    whereCalls: number;
    orderByCalls: number;
    limitArg: number | null;
  },
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
    const tracker = {
      whereCalls: 0,
      orderByCalls: 0,
      limitArg: null as number | null,
    };
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
    chain.limit = (n: number) => {
      tracker.limitArg = n;
      return chain;
    };
    chain.innerJoin = () => chain;
    chain.leftJoin = () => chain;
    chain.then = (resolve: (v: unknown) => void) => resolve(result);
    return chain;
  }

  const select = () => makeSelectChain();

  const insert = (table: unknown) => ({
    values: (v: unknown) => {
      const arr = Array.isArray(v) ? v : [v];
      for (const row of arr) {
        if (table === schema.shiftEvents) {
          state.insertedShiftEvents.push(row as Record<string, unknown>);
        }
      }
      const ret = {
        returning: async () =>
          arr.map((row, i) => ({
            id: `evt-${state.insertedShiftEvents.length - arr.length + i + 1}`,
            ...(row as Record<string, unknown>),
          })),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return ret;
    },
  });

  return { db: { select, insert } };
});

import { recordEvent, listEventsForShift } from './floor-events';

beforeEach(() => {
  state.selectResults = [];
  state.insertedShiftEvents = [];
  state.lastSelectChain = null;
});

describe('recordEvent', () => {
  it('inserts with given fields and returns the created row', async () => {
    const occurredAt = new Date('2026-05-07T18:00:00.000Z');
    const out = await recordEvent({
      shiftSessionId: 'sess-1',
      stationId: 'st-1',
      kind: 'note',
      payload: { text: 'hi' },
      recordedBy: 'user-1',
      relatedKnackJobId: 'job-1',
      occurredAt,
    });
    expect(state.insertedShiftEvents).toHaveLength(1);
    const row = state.insertedShiftEvents[0];
    expect(row.shiftSessionId).toBe('sess-1');
    expect(row.stationId).toBe('st-1');
    expect(row.kind).toBe('note');
    expect(row.payload).toEqual({ text: 'hi' });
    expect(row.recordedBy).toBe('user-1');
    expect(row.relatedKnackJobId).toBe('job-1');
    expect(row.occurredAt).toBe(occurredAt);
    // Returned row has the inserted values.
    expect((out as { kind: string }).kind).toBe('note');
  });

  it('defaults occurredAt to now() when omitted', async () => {
    const before = Date.now();
    await recordEvent({
      shiftSessionId: 'sess-1',
      stationId: null,
      kind: 'job_started',
      payload: {},
      recordedBy: 'user-1',
    });
    const after = Date.now();
    const row = state.insertedShiftEvents[0];
    const occurredAt = row.occurredAt as Date;
    expect(occurredAt).toBeInstanceOf(Date);
    expect(occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(occurredAt.getTime()).toBeLessThanOrEqual(after);
  });
});

describe('listEventsForShift', () => {
  it('orders newest first (orderBy is invoked, results returned as-is)', async () => {
    state.selectResults = [[
      { id: 'e2', occurredAt: new Date('2026-05-07T20:00:00Z') },
      { id: 'e1', occurredAt: new Date('2026-05-07T18:00:00Z') },
    ]];
    const out = await listEventsForShift('sess-1');
    expect(state.lastSelectChain?.orderByCalls).toBe(1);
    expect(out.map((r) => (r as { id: string }).id)).toEqual(['e2', 'e1']);
  });

  it('respects the limit argument', async () => {
    state.selectResults = [[{ id: 'e1' }]];
    await listEventsForShift('sess-1', { limit: 5 });
    expect(state.lastSelectChain?.limitArg).toBe(5);
  });

  it('does not call .limit() when no limit is given', async () => {
    state.selectResults = [[]];
    await listEventsForShift('sess-1');
    expect(state.lastSelectChain?.limitArg).toBeNull();
  });

  it('with sinceOccurredAt builds a compound where (still one .where() call)', async () => {
    state.selectResults = [[]];
    const since = new Date('2026-05-07T18:00:00Z');
    await listEventsForShift('sess-1', { sinceOccurredAt: since });
    // Single where() call but compound condition built via and().
    expect(state.lastSelectChain?.whereCalls).toBe(1);
  });
});
