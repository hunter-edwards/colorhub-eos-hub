import { describe, it, expect } from 'vitest';
import { evaluateEntry } from '../lib/scorecard-utils';

describe('evaluateEntry', () => {
  it('gte: green when value >= goal', () => {
    expect(evaluateEntry({ comparator: 'gte', goal: '10' }, 10)).toBe('green');
    expect(evaluateEntry({ comparator: 'gte', goal: '10' }, 15)).toBe('green');
  });
  it('gte: red when value < goal', () => {
    expect(evaluateEntry({ comparator: 'gte', goal: '10' }, 9)).toBe('red');
  });

  it('lte: green when value <= goal', () => {
    expect(evaluateEntry({ comparator: 'lte', goal: '5' }, 5)).toBe('green');
    expect(evaluateEntry({ comparator: 'lte', goal: '5' }, 3)).toBe('green');
  });
  it('lte: red when value > goal', () => {
    expect(evaluateEntry({ comparator: 'lte', goal: '5' }, 6)).toBe('red');
  });

  it('eq: green when value == goal', () => {
    expect(evaluateEntry({ comparator: 'eq', goal: '42' }, 42)).toBe('green');
  });
  it('eq: red when value != goal', () => {
    expect(evaluateEntry({ comparator: 'eq', goal: '42' }, 41)).toBe('red');
    expect(evaluateEntry({ comparator: 'eq', goal: '42' }, 43)).toBe('red');
  });

  it('range: green when goalMin <= value <= goalMax', () => {
    expect(evaluateEntry({ comparator: 'range', goalMin: '5', goalMax: '10' }, 5)).toBe('green');
    expect(evaluateEntry({ comparator: 'range', goalMin: '5', goalMax: '10' }, 7)).toBe('green');
    expect(evaluateEntry({ comparator: 'range', goalMin: '5', goalMax: '10' }, 10)).toBe('green');
  });
  it('range: red when outside range', () => {
    expect(evaluateEntry({ comparator: 'range', goalMin: '5', goalMax: '10' }, 4)).toBe('red');
    expect(evaluateEntry({ comparator: 'range', goalMin: '5', goalMax: '10' }, 11)).toBe('red');
  });

  it('returns null when goal is missing', () => {
    expect(evaluateEntry({ comparator: 'gte', goal: null }, 10)).toBe(null);
  });

  it('handles decimal values', () => {
    expect(evaluateEntry({ comparator: 'gte', goal: '99.5' }, 99.5)).toBe('green');
    expect(evaluateEntry({ comparator: 'gte', goal: '99.5' }, 99.4)).toBe('red');
  });
});
