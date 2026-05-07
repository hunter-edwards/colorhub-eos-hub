import { describe, it, expect } from 'vitest';
import { progress } from './floor-progress-utils';

describe('progress', () => {
  it('computes pct under 100', () => {
    expect(progress({ completed: 4820, needed: 5000 }).pct).toBeCloseTo(96.4, 1);
    expect(progress({ completed: 4820, needed: 5000 }).overBy).toBe(0);
    expect(progress({ completed: 4820, needed: 5000 }).isOver).toBe(false);
  });
  it('handles over-run', () => {
    expect(progress({ completed: 5402, needed: 5000 }).pct).toBeCloseTo(108.04, 1);
    expect(progress({ completed: 5402, needed: 5000 }).overBy).toBe(402);
    expect(progress({ completed: 5402, needed: 5000 }).isOver).toBe(true);
  });
  it('handles 0 needed safely', () => {
    expect(progress({ completed: 100, needed: 0 }).pct).toBe(0);
  });
  it('handles missing fields', () => {
    expect(progress({ completed: null, needed: 5000 }).pct).toBe(0);
  });
});
