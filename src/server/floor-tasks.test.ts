import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  selectResults: [] as Array<unknown[]>,
  insertedTasks: [] as Array<Record<string, unknown>>,
  taskUpdates: [] as Array<{ set: Record<string, unknown> }>,
  // Each task gets the `set` merged when updated; we return a synthetic row
  // from .returning() for the server fn.
  recordEventCalls: [] as Array<Record<string, unknown>>,
  // Whether the select chain has been called with a where() — so tests can
  // confirm filtering happens.
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
        if (table === schema.taskPool) {
          state.insertedTasks.push(row as Record<string, unknown>);
        }
      }
      const ret = {
        returning: async () =>
          arr.map((row, i) => ({
            id: `task-${state.insertedTasks.length - arr.length + i + 1}`,
            ...(row as Record<string, unknown>),
          })),
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return ret;
    },
  });

  const update = (table: unknown) => ({
    set: (s: Record<string, unknown>) => {
      if (table === schema.taskPool) state.taskUpdates.push({ set: s });
      const whereChain = {
        returning: async () => [
          { id: 'task-updated', title: 'existing-title', ...s },
        ],
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
      return {
        where: () => whereChain,
        then: (resolve: (v: unknown) => void) => resolve(undefined),
      };
    },
  });

  return { db: { select, insert, update } };
});

import {
  listTasks,
  createTask,
  importFromTodo,
  markTask,
  assignTask,
} from './floor-tasks';
import { recordEvent } from './floor-events';

beforeEach(() => {
  state.selectResults = [];
  state.insertedTasks = [];
  state.taskUpdates = [];
  state.recordEventCalls = [];
  state.lastSelectChain = null;
  (recordEvent as unknown as { mockClear?: () => void }).mockClear?.();
});

describe('listTasks', () => {
  it('filters by status array (where() invoked) and orders desc by createdAt', async () => {
    state.selectResults = [[{ id: 't1', status: 'open' }]];
    const out = await listTasks({ statuses: ['open', 'in_progress'] });
    expect(out).toHaveLength(1);
    expect(state.lastSelectChain?.whereCalls).toBe(1);
    expect(state.lastSelectChain?.orderByCalls).toBe(1);
  });

  it('skips where() when no filters are given', async () => {
    state.selectResults = [[]];
    await listTasks();
    expect(state.lastSelectChain?.whereCalls).toBe(0);
    expect(state.lastSelectChain?.orderByCalls).toBe(1);
  });
});

describe('createTask', () => {
  it("defaults source to 'hub'", async () => {
    await createTask({ title: 'Sweep press 1', teamId: 'team-1' });
    expect(state.insertedTasks).toHaveLength(1);
    const row = state.insertedTasks[0];
    expect(row.title).toBe('Sweep press 1');
    expect(row.teamId).toBe('team-1');
    expect(row.source).toBe('hub');
  });

  it('passes through estMinutes and suggestedStationId', async () => {
    await createTask({
      title: 'Reload spool',
      teamId: 'team-1',
      estMinutes: 15,
      suggestedStationId: 'st-1',
    });
    const row = state.insertedTasks[0];
    expect(row.estMinutes).toBe(15);
    expect(row.suggestedStationId).toBe('st-1');
  });
});

describe('importFromTodo', () => {
  it("inserts a task with source='eos_todo' and sourceTodoId", async () => {
    state.selectResults = [[{ id: 'todo-1', title: 'Order ink' }]];
    const out = await importFromTodo('todo-1', 'team-1');
    expect(state.insertedTasks).toHaveLength(1);
    const row = state.insertedTasks[0];
    expect(row.source).toBe('eos_todo');
    expect(row.sourceTodoId).toBe('todo-1');
    expect(row.title).toBe('Order ink');
    expect(row.teamId).toBe('team-1');
    expect(out).toBeDefined();
  });

  it('throws when todo not found', async () => {
    state.selectResults = [[]];
    await expect(importFromTodo('todo-x', 'team-1')).rejects.toThrow(
      'Todo not found',
    );
    expect(state.insertedTasks).toHaveLength(0);
  });
});

describe('markTask', () => {
  it("flipping to 'done' sets completedAt and emits a task_completed event", async () => {
    await markTask('task-1', 'done', {
      recordedBy: 'user-1',
      shiftSessionId: 'sess-1',
      stationId: 'st-1',
    });

    expect(state.taskUpdates).toHaveLength(1);
    expect(state.taskUpdates[0].set.status).toBe('done');
    expect(state.taskUpdates[0].set.completedAt).toBeInstanceOf(Date);

    expect(recordEvent).toHaveBeenCalledTimes(1);
    expect(state.recordEventCalls).toHaveLength(1);
    const evt = state.recordEventCalls[0];
    expect(evt.kind).toBe('task_completed');
    expect(evt.shiftSessionId).toBe('sess-1');
    expect(evt.stationId).toBe('st-1');
    expect(evt.recordedBy).toBe('user-1');
    expect((evt.payload as { taskId: string }).taskId).toBe('task-1');
  });

  it("flipping to 'done' without shiftSessionId/recordedBy does NOT emit", async () => {
    await markTask('task-1', 'done', {});
    expect(state.taskUpdates).toHaveLength(1);
    expect(state.taskUpdates[0].set.completedAt).toBeInstanceOf(Date);
    expect(recordEvent).not.toHaveBeenCalled();
    expect(state.recordEventCalls).toHaveLength(0);
  });

  it('flipping to a non-done status does NOT emit an event', async () => {
    await markTask('task-1', 'in_progress', {
      recordedBy: 'user-1',
      shiftSessionId: 'sess-1',
    });
    expect(state.taskUpdates).toHaveLength(1);
    expect(state.taskUpdates[0].set.status).toBe('in_progress');
    expect(state.taskUpdates[0].set.completedAt).toBeUndefined();
    expect(recordEvent).not.toHaveBeenCalled();
  });
});

describe('assignTask', () => {
  it('writes the assignment fields', async () => {
    await assignTask('task-1', 'sess-1', 'user-2');
    expect(state.taskUpdates).toHaveLength(1);
    expect(state.taskUpdates[0].set.assignedShiftSessionId).toBe('sess-1');
    expect(state.taskUpdates[0].set.assignedUserId).toBe('user-2');
  });
});
