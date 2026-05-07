import { describe, it, expect } from 'vitest';
import { pmStatus } from './floor-pm-utils';

describe('pmStatus', () => {
  const today = new Date('2026-05-07');
  it('green when next due > 7 days out', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: '2026-05-01' }, today).level).toBe('green');
  });
  it('yellow when due within 7 days', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: '2026-04-15' }, today).level).toBe('yellow');
  });
  it('red when overdue', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: '2026-04-01' }, today).level).toBe('red');
  });
  it('red when never done', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: null }, today).level).toBe('red');
  });
});
