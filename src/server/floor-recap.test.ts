import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  selectResults: [] as Array<unknown[]>,
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
  return { db: { select } };
});

vi.mock('./floor-events', () => ({
  listEventsForShift: vi.fn(async () => [
    {
      id: 'e1',
      stationId: 's1',
      kind: 'job_completed',
      occurredAt: new Date('2026-05-07T08:00:00Z'),
      payload: { sheets: 100 },
    },
  ]),
}));

vi.mock('./floor-stations', () => ({
  listStations: vi.fn(async () => [
    { id: 's1', name: 'Press 1', archivedAt: null },
  ]),
}));

vi.mock('./team-helpers', () => ({
  getCurrentTeamId: async () => 'team-1',
}));

import { getRecap } from './floor-recap';

beforeEach(() => {
  state.selectResults = [];
});

describe('getRecap', () => {
  it('returns null when no session is found by sessionId', async () => {
    state.selectResults = [[]];
    const out = await getRecap({ sessionId: 'missing' });
    expect(out).toBeNull();
  });

  it('returns null when no session found by date+shift', async () => {
    state.selectResults = [[]];
    const out = await getRecap({ date: '2026-05-07', shiftNumber: 1 });
    expect(out).toBeNull();
  });

  it('stitches session, events, stations, and computed recap', async () => {
    const session = {
      id: 'sess-1',
      teamId: 'team-1',
      date: '2026-05-07',
      shiftNumber: 1,
      openedBy: 'user-1',
      openedAt: new Date('2026-05-07T07:00:00Z'),
      closedAt: null,
      handoffNotes: null,
    };
    state.selectResults = [[session]];
    const out = await getRecap({ sessionId: 'sess-1' });
    expect(out).not.toBeNull();
    expect(out!.session.id).toBe('sess-1');
    expect(out!.events).toHaveLength(1);
    expect(out!.stations).toHaveLength(1);
    expect(out!.recap.hero.jobsCompleted).toBe(1);
    expect(out!.recap.hero.sheetsCompleted).toBe(100);
  });
});
