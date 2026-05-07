import { describe, it, expect } from 'vitest';
import { resolveShift, isInHuddleWindow } from './floor-shift-utils';

describe('resolveShift', () => {
  it('returns shift 1 for 07:00–15:00', () => {
    expect(resolveShift(new Date('2026-05-07T07:00:00-05:00'))).toMatchObject({ shiftNumber: 1, date: '2026-05-07' });
    expect(resolveShift(new Date('2026-05-07T14:59:00-05:00')).shiftNumber).toBe(1);
  });
  it('returns shift 2 for 15:00–23:00', () => {
    expect(resolveShift(new Date('2026-05-07T15:00:00-05:00')).shiftNumber).toBe(2);
    expect(resolveShift(new Date('2026-05-07T22:59:00-05:00')).shiftNumber).toBe(2);
  });
  it('returns null off-hours', () => {
    expect(resolveShift(new Date('2026-05-07T05:00:00-05:00'))).toBeNull();
    expect(resolveShift(new Date('2026-05-07T23:30:00-05:00'))).toBeNull();
  });
});

describe('isInHuddleWindow', () => {
  it('true within ±10min of 07:00 and 15:00', () => {
    expect(isInHuddleWindow(new Date('2026-05-07T06:55:00-05:00'))).toBe(true);
    expect(isInHuddleWindow(new Date('2026-05-07T15:05:00-05:00'))).toBe(true);
  });
  it('false in the middle of a shift', () => {
    expect(isInHuddleWindow(new Date('2026-05-07T11:00:00-05:00'))).toBe(false);
  });
});
