import { describe, it, expect } from 'vitest';
import { isAboveTheBar, nextRating, formatQuarter } from './people-utils';

describe('isAboveTheBar', () => {
  it('returns true when all ratings are plus', () => {
    expect(isAboveTheBar([
      { rating: 'plus' },
      { rating: 'plus' },
      { rating: 'plus' },
    ])).toBe(true);
  });

  it('returns false when any rating is minus', () => {
    expect(isAboveTheBar([
      { rating: 'plus' },
      { rating: 'minus' },
      { rating: 'plus' },
    ])).toBe(false);
  });

  it('returns true when ratings are all plus_minus (no minus)', () => {
    expect(isAboveTheBar([
      { rating: 'plus_minus' },
      { rating: 'plus_minus' },
    ])).toBe(true);
  });

  it('returns true for an empty array', () => {
    expect(isAboveTheBar([])).toBe(true);
  });

  it('returns false when only rating is minus', () => {
    expect(isAboveTheBar([{ rating: 'minus' }])).toBe(false);
  });

  it('returns true for mixed plus and plus_minus', () => {
    expect(isAboveTheBar([
      { rating: 'plus' },
      { rating: 'plus_minus' },
      { rating: 'plus' },
    ])).toBe(true);
  });
});

describe('nextRating', () => {
  it('null -> plus', () => {
    expect(nextRating(null)).toBe('plus');
  });

  it('plus -> plus_minus', () => {
    expect(nextRating('plus')).toBe('plus_minus');
  });

  it('plus_minus -> minus', () => {
    expect(nextRating('plus_minus')).toBe('minus');
  });

  it('minus -> plus (wraps around)', () => {
    expect(nextRating('minus')).toBe('plus');
  });

  it('full cycle starting from null', () => {
    let rating = nextRating(null);
    expect(rating).toBe('plus');
    rating = nextRating(rating);
    expect(rating).toBe('plus_minus');
    rating = nextRating(rating);
    expect(rating).toBe('minus');
    rating = nextRating(rating);
    expect(rating).toBe('plus');
  });
});

describe('formatQuarter', () => {
  it('formats 2026-Q2 as Q2 2026', () => {
    expect(formatQuarter('2026-Q2')).toBe('Q2 2026');
  });

  it('formats 2025-Q1 as Q1 2025', () => {
    expect(formatQuarter('2025-Q1')).toBe('Q1 2025');
  });

  it('formats 2027-Q4 as Q4 2027', () => {
    expect(formatQuarter('2027-Q4')).toBe('Q4 2027');
  });
});
