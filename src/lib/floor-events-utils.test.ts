import { describe, it, expect } from 'vitest';
import { groupEventsByStation, summarizeEvent } from './floor-events-utils';

describe('groupEventsByStation', () => {
  it('groups by stationId, preserving chrono order', () => {
    const evs = [
      { id: '1', stationId: 'a', kind: 'job_started' as const, occurredAt: new Date('2026-05-07T07:05Z'), payload: {} },
      { id: '2', stationId: 'b', kind: 'job_started' as const, occurredAt: new Date('2026-05-07T07:10Z'), payload: {} },
      { id: '3', stationId: 'a', kind: 'job_completed' as const, occurredAt: new Date('2026-05-07T09:00Z'), payload: {} },
    ];
    const grouped = groupEventsByStation(evs);
    expect(grouped.get('a')).toHaveLength(2);
    expect(grouped.get('b')).toHaveLength(1);
  });
});

describe('summarizeEvent', () => {
  it('formats a job_paused with reason', () => {
    expect(summarizeEvent({ kind: 'job_paused', payload: { reason: 'material', note: 'waiting on stock' } } as any))
      .toBe('Paused — material (waiting on stock)');
  });
  it('formats job_completed with sheets', () => {
    expect(summarizeEvent({ kind: 'job_completed', payload: { sheets: 5000 } } as any))
      .toBe('Completed — 5,000 sheets');
  });
});
