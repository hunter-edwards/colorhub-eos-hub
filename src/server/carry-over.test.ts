import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  prev: null as Record<string, unknown> | null,
  inserted: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/db', () => {
  const select = () => ({
    from: () => ({
      where: async () => (state.prev ? [state.prev] : []),
    }),
  });
  const insert = () => ({
    values: (v: Record<string, unknown>) => ({
      returning: async () => {
        const row = { id: `m-${state.inserted.length + 1}`, ...v };
        state.inserted.push(row);
        return [row];
      },
    }),
  });
  return { db: { select, insert } };
});

import { createNextDraftFromConcluded } from './carry-over';

describe('createNextDraftFromConcluded', () => {
  beforeEach(() => {
    state.prev = null;
    state.inserted = [];
  });

  it('creates a draft meeting ~7 days out for L10 meetings', async () => {
    state.prev = {
      id: 'prev-1',
      teamId: 'team-1',
      type: 'L10',
      cascadingMessage: 'Ship Q2 goals',
    };
    const now = new Date('2026-04-22T10:00:00Z');
    const created = await createNextDraftFromConcluded('prev-1', { now });

    expect(created).not.toBeNull();
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0].status).toBe('draft');
    expect(state.inserted[0].type).toBe('L10');
    const scheduled = state.inserted[0].scheduledFor as Date;
    const diffMs = scheduled.getTime() - now.getTime();
    expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('copies cascading message forward as previousCascadingMessage', async () => {
    state.prev = {
      id: 'prev-2',
      teamId: 'team-1',
      type: 'L10',
      cascadingMessage: 'Focus on customer retention',
    };
    await createNextDraftFromConcluded('prev-2', { now: new Date() });
    expect(state.inserted[0].previousCascadingMessage).toBe('Focus on customer retention');
  });

  it('passes null previousCascadingMessage when prev had none', async () => {
    state.prev = { id: 'prev-3', teamId: 't', type: 'L10', cascadingMessage: null };
    await createNextDraftFromConcluded('prev-3');
    expect(state.inserted[0].previousCascadingMessage).toBeNull();
  });

  it('skips auto-scheduling for quarterly meetings', async () => {
    state.prev = { id: 'q', teamId: 't', type: 'quarterly', cascadingMessage: null };
    const result = await createNextDraftFromConcluded('q');
    expect(result).toBeNull();
    expect(state.inserted).toHaveLength(0);
  });

  it('respects custom cadenceDays', async () => {
    state.prev = { id: 'x', teamId: 't', type: 'L10', cascadingMessage: null };
    const now = new Date('2026-04-22T00:00:00Z');
    await createNextDraftFromConcluded('x', { now, cadenceDays: 14 });
    const scheduled = state.inserted[0].scheduledFor as Date;
    expect(scheduled.getTime() - now.getTime()).toBe(14 * 24 * 60 * 60 * 1000);
  });
});
