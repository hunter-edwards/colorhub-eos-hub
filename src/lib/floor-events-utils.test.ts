import { describe, it, expect } from 'vitest';
import {
  deriveStationStatus,
  groupEventsByStation,
  summarizeEvent,
} from './floor-events-utils';

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

describe('deriveStationStatus', () => {
  it('idle when no events', () => {
    expect(deriveStationStatus([], 's1')).toBe('idle');
  });
  it('running after job_started', () => {
    const evs = [
      { id: '1', stationId: 's1', kind: 'job_started', occurredAt: new Date(), payload: {} },
    ];
    expect(deriveStationStatus(evs as any, 's1')).toBe('running');
  });
  it('paused after job_paused', () => {
    const evs = [
      { id: '1', stationId: 's1', kind: 'job_started', occurredAt: new Date('2026-05-07T08:00Z'), payload: {} },
      { id: '2', stationId: 's1', kind: 'job_paused', occurredAt: new Date('2026-05-07T09:00Z'), payload: {} },
    ];
    expect(deriveStationStatus(evs as any, 's1')).toBe('setup');
  });
  it('running after pause then resume', () => {
    const evs = [
      { id: '1', stationId: 's1', kind: 'job_started', occurredAt: new Date('2026-05-07T08:00Z'), payload: {} },
      { id: '2', stationId: 's1', kind: 'job_paused', occurredAt: new Date('2026-05-07T09:00Z'), payload: {} },
      { id: '3', stationId: 's1', kind: 'job_resumed', occurredAt: new Date('2026-05-07T09:30Z'), payload: {} },
    ];
    expect(deriveStationStatus(evs as any, 's1')).toBe('running');
  });
  it('idle after job_completed', () => {
    const evs = [
      { id: '1', stationId: 's1', kind: 'job_started', occurredAt: new Date('2026-05-07T08:00Z'), payload: {} },
      { id: '2', stationId: 's1', kind: 'job_completed', occurredAt: new Date('2026-05-07T11:00Z'), payload: {} },
    ];
    expect(deriveStationStatus(evs as any, 's1')).toBe('idle');
  });
  it('only considers events for the given stationId', () => {
    const evs = [
      { id: '1', stationId: 's2', kind: 'job_started', occurredAt: new Date('2026-05-07T08:00Z'), payload: {} },
      { id: '2', stationId: 's1', kind: 'job_paused', occurredAt: new Date('2026-05-07T09:00Z'), payload: {} },
    ];
    expect(deriveStationStatus(evs as any, 's2')).toBe('running');
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
