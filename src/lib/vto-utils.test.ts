import { describe, it, expect } from 'vitest';
import { nextQuarter, completionRate } from './vto-utils';

describe('nextQuarter', () => {
  it('Q1 -> Q2', () => {
    expect(nextQuarter('2026-Q1')).toBe('2026-Q2');
  });

  it('Q2 -> Q3', () => {
    expect(nextQuarter('2026-Q2')).toBe('2026-Q3');
  });

  it('Q3 -> Q4', () => {
    expect(nextQuarter('2026-Q3')).toBe('2026-Q4');
  });

  it('Q4 wraps to next year Q1', () => {
    expect(nextQuarter('2026-Q4')).toBe('2027-Q1');
  });

  it('works for different years', () => {
    expect(nextQuarter('2025-Q4')).toBe('2026-Q1');
    expect(nextQuarter('2030-Q2')).toBe('2030-Q3');
  });
});

describe('completionRate', () => {
  it('returns 0 for empty array', () => {
    expect(completionRate([])).toBe(0);
  });

  it('returns 100 when all rocks are done', () => {
    expect(completionRate([
      { status: 'done' },
      { status: 'done' },
    ])).toBe(100);
  });

  it('returns 0 when no rocks are done', () => {
    expect(completionRate([
      { status: 'on_track' },
      { status: 'off_track' },
    ])).toBe(0);
  });

  it('calculates correct percentage', () => {
    expect(completionRate([
      { status: 'done' },
      { status: 'on_track' },
      { status: 'off_track' },
      { status: 'done' },
    ])).toBe(50);
  });

  it('rounds to nearest integer', () => {
    expect(completionRate([
      { status: 'done' },
      { status: 'on_track' },
      { status: 'off_track' },
    ])).toBe(33);
  });

  it('handles single done rock', () => {
    expect(completionRate([{ status: 'done' }])).toBe(100);
  });

  it('handles single non-done rock', () => {
    expect(completionRate([{ status: 'on_track' }])).toBe(0);
  });
});
