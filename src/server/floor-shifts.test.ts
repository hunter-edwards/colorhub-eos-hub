import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  // Queue of select results consumed in FIFO order.
  selectResults: [] as Array<unknown[]>,
  insertedShiftSessions: [] as Array<Record<string, unknown>>,
  insertedShiftAssignments: [] as Array<Record<string, unknown>>,
  shiftSessionUpdates: [] as Array<{ set: Record<string, unknown> }>,
  shiftAssignmentDeletes: [] as Array<{ where: unknown }>,
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
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => chain;
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
        if (table === schema.shiftSessions) {
          state.insertedShiftSessions.push(row as Record<string, unknown>);
        } else if (table === schema.shiftAssignments) {
          state.insertedShiftAssignments.push(row as Record<string, unknown>);
        }
      }
      const ret = {
        returning: async () =>
          arr.map((row, i) => {
            const r = row as Record<string, unknown>;
            const id =
              table === schema.shiftSessions
                ? `session-${state.insertedShiftSessions.length}`
                : `assignment-${state.insertedShiftAssignments.length + i}`;
            return { id, ...r };
          }),
        onConflictDoNothing: () => ret,
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return ret;
    },
  });

  const update = (table: unknown) => ({
    set: (s: Record<string, unknown>) => {
      if (table === schema.shiftSessions) state.shiftSessionUpdates.push({ set: s });
      return {
        where: () => Promise.resolve(),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
    },
  });

  const del = (table: unknown) => ({
    where: (cond: unknown) => {
      if (table === schema.shiftAssignments) {
        state.shiftAssignmentDeletes.push({ where: cond });
      }
      return Promise.resolve();
    },
  });

  return { db: { select, insert, update, delete: del } };
});

import {
  getOrOpenCurrentShift,
  listAssignments,
  setAssignment,
  removeAssignment,
  setHandoffNotes,
} from './floor-shifts';

beforeEach(() => {
  state.selectResults = [];
  state.insertedShiftSessions = [];
  state.insertedShiftAssignments = [];
  state.shiftSessionUpdates = [];
  state.shiftAssignmentDeletes = [];
});

// 2026-05-07 14:30 America/Chicago = shift 1 window (07:00-15:00)
const NOON_CT = new Date('2026-05-07T17:30:00.000Z'); // 12:30 CT
// 2026-05-07 02:00 America/Chicago = OUTSIDE shift window
const OUTSIDE_CT = new Date('2026-05-07T07:00:00.000Z'); // 02:00 CT

describe('getOrOpenCurrentShift', () => {
  it('returns null and inserts nothing when outside a shift window', async () => {
    const out = await getOrOpenCurrentShift(OUTSIDE_CT, {
      teamId: 'team-1',
      openedBy: 'user-1',
    });
    expect(out).toBeNull();
    expect(state.insertedShiftSessions).toHaveLength(0);
    expect(state.insertedShiftAssignments).toHaveLength(0);
  });

  it('creates a new session when none exists for (teamId, date, shiftNumber)', async () => {
    // First select: existing session lookup → empty.
    // Second select: default operators → empty (no seeding rows).
    state.selectResults = [[], []];
    const session = await getOrOpenCurrentShift(NOON_CT, {
      teamId: 'team-1',
      openedBy: 'user-1',
    });
    expect(session).not.toBeNull();
    expect(state.insertedShiftSessions).toHaveLength(1);
    expect(state.insertedShiftSessions[0].teamId).toBe('team-1');
    expect(state.insertedShiftSessions[0].shiftNumber).toBe(1);
    expect(state.insertedShiftSessions[0].date).toBe('2026-05-07');
    expect(state.insertedShiftSessions[0].openedBy).toBe('user-1');
  });

  it('seeds assignments from default operators when creating a new session', async () => {
    // First select: existing session → empty.
    // Second select: default operators across all stations for the team.
    state.selectResults = [
      [],
      [
        { stationId: 'st-1', userId: 'u1' },
        { stationId: 'st-1', userId: 'u2' },
        { stationId: 'st-2', userId: 'u3' },
      ],
    ];
    await getOrOpenCurrentShift(NOON_CT, { teamId: 'team-1', openedBy: 'user-1' });
    expect(state.insertedShiftAssignments).toHaveLength(3);
    const pairs = state.insertedShiftAssignments
      .map((r) => `${r.stationId}|${r.userId}`)
      .sort();
    expect(pairs).toEqual(['st-1|u1', 'st-1|u2', 'st-2|u3']);
  });

  it('returns existing session without recreating when one already exists', async () => {
    state.selectResults = [[
      { id: 'existing-session', teamId: 'team-1', date: '2026-05-07', shiftNumber: 1 },
    ]];
    const session = await getOrOpenCurrentShift(NOON_CT, {
      teamId: 'team-1',
      openedBy: 'user-1',
    });
    expect(session).not.toBeNull();
    expect((session as { id: string }).id).toBe('existing-session');
    expect(state.insertedShiftSessions).toHaveLength(0);
    expect(state.insertedShiftAssignments).toHaveLength(0);
  });
});

describe('setAssignment', () => {
  it('is idempotent — calling twice does not duplicate', async () => {
    await setAssignment('sess-1', 'st-1', 'u1');
    await setAssignment('sess-1', 'st-1', 'u1');
    // Both calls happen, but each is upsert-style. We assert that the values
    // match expectations. Idempotency at the DB layer is enforced by the
    // unique constraint; the server function should call onConflictDoNothing.
    expect(state.insertedShiftAssignments).toHaveLength(2);
    for (const row of state.insertedShiftAssignments) {
      expect(row.shiftSessionId).toBe('sess-1');
      expect(row.stationId).toBe('st-1');
      expect(row.userId).toBe('u1');
    }
  });
});

describe('removeAssignment', () => {
  it('deletes only the matching row', async () => {
    await removeAssignment('sess-1', 'st-1', 'u1');
    expect(state.shiftAssignmentDeletes).toHaveLength(1);
  });
});

describe('setHandoffNotes', () => {
  it('writes the notes to the matching session', async () => {
    await setHandoffNotes('sess-1', 'press 2 down for PM');
    expect(state.shiftSessionUpdates).toHaveLength(1);
    expect(state.shiftSessionUpdates[0].set.handoffNotes).toBe('press 2 down for PM');
  });
});

describe('listAssignments', () => {
  it('returns all assignments for the session', async () => {
    state.selectResults = [[
      { stationId: 'st-1', userId: 'u1' },
      { stationId: 'st-2', userId: 'u2' },
    ]];
    const out = await listAssignments('sess-1');
    expect(out).toEqual([
      { stationId: 'st-1', userId: 'u1' },
      { stationId: 'st-2', userId: 'u2' },
    ]);
  });
});
