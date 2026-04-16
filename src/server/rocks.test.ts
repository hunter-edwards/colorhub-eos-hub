import { describe, it, expect } from 'vitest';
import { currentQuarter } from '../lib/quarters';

describe('currentQuarter', () => {
  it('formats Q1', () => expect(currentQuarter(new Date('2026-02-14'))).toBe('2026-Q1'));
  it('formats Q2', () => expect(currentQuarter(new Date('2026-05-01'))).toBe('2026-Q2'));
  it('formats Q3', () => expect(currentQuarter(new Date('2026-08-15'))).toBe('2026-Q3'));
  it('formats Q4', () => expect(currentQuarter(new Date('2026-12-31'))).toBe('2026-Q4'));
  it('handles Jan 1 as Q1', () => expect(currentQuarter(new Date(2026, 0, 1))).toBe('2026-Q1'));
  it('handles March 31 as Q1', () => expect(currentQuarter(new Date(2026, 2, 31))).toBe('2026-Q1'));
  it('handles April 1 as Q2', () => expect(currentQuarter(new Date(2026, 3, 1))).toBe('2026-Q2'));
});
