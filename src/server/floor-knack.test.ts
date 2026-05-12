import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  rowsByStation: {} as Record<string, any[]>,
}));

vi.mock('@/db', () => {
  // The reader does: db.select().from(table).where(eq(stationKey, X)).orderBy(...)
  // We capture the stationKey from the eq(...) argument.
  let currentKey: string | null = null;
  return {
    db: {
      select: () => ({
        from: () => ({
          where: (clause: any) => {
            // Drizzle eq(...) wraps its right operand in clause.right.value
            // (internal API; we read it pragmatically). Fall back to scanning
            // clause.queryChunks for the string value.
            currentKey =
              clause?.right?.value ??
              clause?.queryChunks?.find(
                (c: any) => typeof c?.value === 'string',
              )?.value ??
              null;
            return {
              orderBy: async () =>
                currentKey ? (state.rowsByStation[currentKey] ?? []) : [],
            };
          },
        }),
      }),
    },
  };
});

import { getFloorView } from './floor-knack';

beforeEach(() => {
  state.rowsByStation = {};
});

describe('getFloorView (snapshot reader)', () => {
  it('marks station as running when snapshot has rows; current is top priority', async () => {
    state.rowsByStation = {
      press_1: [
        {
          knackRecordId: 'a',
          jobNumber: 'J-1',
          customer: 'Acme',
          itemName: 'Part A',
          sheetsNeeded: 5000,
          sheetsProduced: 0,
          sheetsReceived: 4500,
          wasteInternal: 0,
          wasteExternal: 0,
          issueNotes: null,
          complete: false,
          runDueDate: null,
        },
        {
          knackRecordId: 'b',
          jobNumber: 'J-2',
          customer: 'Globex',
          itemName: 'Part B',
          sheetsNeeded: 1000,
          sheetsProduced: 0,
          sheetsReceived: 0,
          wasteInternal: 0,
          wasteExternal: 0,
          issueNotes: null,
          complete: false,
          runDueDate: null,
        },
      ],
      press_2: [],
    };
    const view = await getFloorView(['press_1', 'press_2']);
    expect(view).toHaveLength(2);
    const p1 = view.find((v) => v.stationId === 'press_1')!;
    expect(p1.status).toBe('running');
    expect(p1.current?.jobNumber).toBe('J-1');
    expect(p1.queue).toHaveLength(1);
    expect(p1.queue[0].jobNumber).toBe('J-2');
    const p2 = view.find((v) => v.stationId === 'press_2')!;
    expect(p2.status).toBe('idle');
    expect(p2.current).toBeNull();
    expect(p2.queue).toEqual([]);
  });

  it('maps waste fields, issue notes, and missing values safely', async () => {
    state.rowsByStation = {
      cad: [
        {
          knackRecordId: 'c',
          jobNumber: null,
          customer: null,
          itemName: null,
          sheetsNeeded: null,
          sheetsProduced: null,
          sheetsReceived: null,
          wasteInternal: 50,
          wasteExternal: 25,
          issueNotes: 'Spline tool jammed',
          complete: false,
          runDueDate: '2026-05-20',
        },
      ],
    };
    const view = await getFloorView(['cad']);
    const c = view[0].current!;
    expect(c.jobNumber).toBe('');
    expect(c.customer).toBe('');
    expect(c.lineItem).toBe('');
    expect(c.sheetsNeeded).toBe(0);
    expect(c.sheetsCompleted).toBe(0);
    expect(c.sheetsReceived).toBe(0);
    expect(c.wasteSheets).toBe(75);
    expect(c.issueNotes).toEqual(['Spline tool jammed']);
    expect(c.dueDate).toBe('2026-05-20');
  });
});
