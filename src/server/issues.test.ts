import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted chainable db mock so vi.mock factories can reference it.
const state = vi.hoisted(() => ({
  existing: null as unknown as Record<string, unknown> | null,
  inserted: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: () => {} }));

vi.mock('@/db', () => {
  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => (state.existing ? [state.existing] : []),
      }),
    }),
  });
  const insert = () => ({
    values: (v: Record<string, unknown>) => ({
      returning: async () => {
        const row = { id: `issue-${state.inserted.length + 1}`, status: 'open', ...v };
        state.inserted.push(row);
        return [row];
      },
    }),
  });
  return { db: { select, insert } };
});

// Import after mocks.
import { createIssueIfNotExists } from './issues';

describe('createIssueIfNotExists', () => {
  beforeEach(() => {
    state.existing = null;
    state.inserted = [];
  });

  it('creates a new issue when none exists for the metric', async () => {
    const result = await createIssueIfNotExists({
      title: 'Scorecard: Revenue missed goal',
      sourceMetricId: 'metric-1',
    });
    expect(result.created).toBe(true);
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0].sourceMetricId).toBe('metric-1');
  });

  it('returns the existing open issue without inserting', async () => {
    state.existing = {
      id: 'issue-existing',
      sourceMetricId: 'metric-1',
      status: 'open',
      title: 'Scorecard: Revenue missed goal',
    };
    const result = await createIssueIfNotExists({
      title: 'Scorecard: Revenue missed goal',
      sourceMetricId: 'metric-1',
    });
    expect(result.created).toBe(false);
    expect(result.issue.id).toBe('issue-existing');
    expect(state.inserted).toHaveLength(0);
  });
});
