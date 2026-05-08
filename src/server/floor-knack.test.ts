import { describe, it, expect } from 'vitest';
import { getFloorView } from './floor-knack';

describe('getFloorView (mock)', () => {
  it('returns one entry per station id passed in', async () => {
    const view = await getFloorView(['s1', 's2', 's3']);
    expect(view).toHaveLength(3);
    expect(view.every(v => v.current === null || typeof v.current.jobNumber === 'string')).toBe(true);
  });
  it('produces deterministic mock data per stationId', async () => {
    const a = await getFloorView(['s1']);
    const b = await getFloorView(['s1']);
    expect(a).toEqual(b);
  });
});
