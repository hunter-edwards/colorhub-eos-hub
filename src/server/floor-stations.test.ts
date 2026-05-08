import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted state so vi.mock factories can reference it.
const state = vi.hoisted(() => ({
  // Each call to db.select()...await pops one result from this queue.
  selectResults: [] as Array<unknown[]>,
  // All inserts captured (newest last). Each entry: { values: ... }
  insertedStations: [] as Array<Record<string, unknown>>,
  insertedDefaultOps: [] as Array<Record<string, unknown>>,
  // Updates captured: { set, where? }
  stationUpdates: [] as Array<{ set: Record<string, unknown> }>,
  // Deletes captured.
  defaultOpsDeletes: 0,
  // What table the next insert/update/delete targets — set by the server fn
  // via which schema object it passes. We detect that here.
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: () => {} }));

// Identify the drizzle table by reference equality with our schema imports.
import { stations, stationDefaultOperators } from '@/db/schema';

vi.mock('@/db', async () => {
  const schema = await import('@/db/schema');

  function makeSelectChain() {
    const result = state.selectResults.shift() ?? [];
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => chain;
    // Awaitable.
    chain.then = (resolve: (v: unknown) => void) => resolve(result);
    return chain;
  }

  const select = () => makeSelectChain();

  const insert = (table: unknown) => ({
    values: (v: unknown) => {
      const arr = Array.isArray(v) ? v : [v];
      for (const row of arr) {
        if (table === schema.stations) {
          state.insertedStations.push(row as Record<string, unknown>);
        } else if (table === schema.stationDefaultOperators) {
          state.insertedDefaultOps.push(row as Record<string, unknown>);
        }
      }
      const promise = {
        returning: async () =>
          arr.map((row, i) => ({
            id: `row-${state.insertedStations.length + state.insertedDefaultOps.length + i}`,
            ...(row as Record<string, unknown>),
          })),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return promise;
    },
  });

  const update = (table: unknown) => ({
    set: (s: Record<string, unknown>) => {
      if (table === schema.stations) state.stationUpdates.push({ set: s });
      return {
        where: () => Promise.resolve(),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
    },
  });

  const del = (table: unknown) => {
    if (table === schema.stationDefaultOperators) state.defaultOpsDeletes++;
    return {
      where: () => Promise.resolve(),
      then: (resolve: (v: unknown) => void) => resolve(undefined),
    };
  };

  return { db: { select, insert, update, delete: del } };
});

import {
  listStations,
  createStation,
  updateStation,
  archiveStation,
  setDefaultOperators,
  seedDefaultStations,
} from './floor-stations';

beforeEach(() => {
  state.selectResults = [];
  state.insertedStations = [];
  state.insertedDefaultOps = [];
  state.stationUpdates = [];
  state.defaultOpsDeletes = 0;
});

// Avoid "unused import" lint; use the schema refs in a no-op assertion.
void stations;
void stationDefaultOperators;

describe('listStations', () => {
  it('excludes archived by default; includes when option set', async () => {
    state.selectResults = [[{ id: 's1', name: 'A', displayOrder: 1, archivedAt: null }]];
    const active = await listStations();
    expect(active.map((s) => s.id)).toEqual(['s1']);

    state.selectResults = [[
      { id: 's1', name: 'A', displayOrder: 1, archivedAt: null },
      { id: 's2', name: 'B', displayOrder: 2, archivedAt: new Date() },
    ]];
    const all = await listStations({ includeArchived: true });
    expect(all.map((s) => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('sorts by displayOrder then name', async () => {
    state.selectResults = [[
      { id: 'b', name: 'Beta', displayOrder: 2, archivedAt: null },
      { id: 'a2', name: 'Alpha2', displayOrder: 1, archivedAt: null },
      { id: 'a1', name: 'Alpha1', displayOrder: 1, archivedAt: null },
    ]];
    const out = await listStations();
    expect(out.map((s) => s.id)).toEqual(['a1', 'a2', 'b']);
  });
});

describe('createStation', () => {
  it('defaults displayOrder to max+1 when omitted', async () => {
    // The server function selects max(display_order) — return [{ max: 5 }].
    state.selectResults = [[{ max: 5 }]];
    await createStation({ name: 'New', kind: 'printer' });
    expect(state.insertedStations).toHaveLength(1);
    expect(state.insertedStations[0].displayOrder).toBe(6);
    expect(state.insertedStations[0].name).toBe('New');
  });

  it('defaults to 1 when no rows exist', async () => {
    state.selectResults = [[{ max: null }]];
    await createStation({ name: 'First', kind: 'cad' });
    expect(state.insertedStations[0].displayOrder).toBe(1);
  });

  it('uses provided displayOrder when given', async () => {
    await createStation({ name: 'Explicit', kind: 'cad', displayOrder: 99 });
    expect(state.insertedStations).toHaveLength(1);
    expect(state.insertedStations[0].displayOrder).toBe(99);
  });
});

describe('updateStation', () => {
  it('updates only the fields provided', async () => {
    await updateStation('s1', { name: 'Renamed' });
    expect(state.stationUpdates).toHaveLength(1);
    expect(state.stationUpdates[0].set).toEqual({ name: 'Renamed' });
  });

  it('passes through groupLabel null', async () => {
    await updateStation('s1', { groupLabel: null });
    expect(state.stationUpdates[0].set).toEqual({ groupLabel: null });
  });
});

describe('archiveStation', () => {
  it('sets archivedAt to now', async () => {
    await archiveStation('s1');
    expect(state.stationUpdates).toHaveLength(1);
    expect(state.stationUpdates[0].set.archivedAt).toBeInstanceOf(Date);
  });
});

describe('setDefaultOperators', () => {
  it('inserts new pairings and deletes ones not in the new set', async () => {
    // Existing pairings for s1: u1, u2.
    state.selectResults = [[
      { stationId: 's1', userId: 'u1' },
      { stationId: 's1', userId: 'u2' },
    ]];
    await setDefaultOperators('s1', ['u2', 'u3']);

    expect(state.insertedDefaultOps).toHaveLength(1);
    expect(state.insertedDefaultOps[0].userId).toBe('u3');
    expect(state.defaultOpsDeletes).toBeGreaterThanOrEqual(1);
  });

  it('inserts all when nothing exists', async () => {
    state.selectResults = [[]];
    await setDefaultOperators('s1', ['u1', 'u2']);
    expect(state.insertedDefaultOps).toHaveLength(2);
    expect(state.defaultOpsDeletes).toBe(0);
  });

  it('deletes all when new list is empty', async () => {
    state.selectResults = [[
      { stationId: 's1', userId: 'u1' },
      { stationId: 's1', userId: 'u2' },
    ]];
    await setDefaultOperators('s1', []);
    expect(state.insertedDefaultOps).toHaveLength(0);
    expect(state.defaultOpsDeletes).toBeGreaterThanOrEqual(1);
  });
});

describe('seedDefaultStations', () => {
  it('inserts 8 stations in the right order when table is empty', async () => {
    // First select: returns empty (no existing stations for team).
    state.selectResults = [[]];
    const result = await seedDefaultStations('team-1');
    expect(result).toEqual({ created: 8 });
    expect(state.insertedStations).toHaveLength(8);
    expect(state.insertedStations.map((s) => s.name)).toEqual([
      'Press 1',
      'Press 2',
      'CAD 1',
      'CAD 2',
      'Rotary',
      'Gluer/Tape',
      'Handwork',
      'Shipping',
    ]);
    expect(state.insertedStations.map((s) => s.displayOrder)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(state.insertedStations.map((s) => s.kind)).toEqual([
      'printer',
      'printer',
      'cad',
      'cad',
      'rotary',
      'gluer',
      'handwork',
      'shipping',
    ]);
    expect(state.insertedStations.every((s) => s.teamId === 'team-1')).toBe(true);
  });

  it('inserts 0 when non-empty', async () => {
    state.selectResults = [[{ id: 'existing' }]];
    const result = await seedDefaultStations('team-1');
    expect(result).toEqual({ created: 0 });
    expect(state.insertedStations).toHaveLength(0);
  });
});
