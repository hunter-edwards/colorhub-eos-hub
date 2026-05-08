import { describe, it, expect } from 'vitest';
import { computeRecap } from './floor-recap-utils';
import type { FloorEvent } from './floor-events-utils';

const stations = [
  { id: 's1', name: 'Press 1' },
  { id: 's2', name: 'Press 2' },
];

function ev(partial: Partial<FloorEvent> & { kind: FloorEvent['kind'] }): FloorEvent {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    stationId: partial.stationId ?? null,
    kind: partial.kind,
    occurredAt: partial.occurredAt ?? new Date('2026-05-07T08:00:00Z'),
    payload: partial.payload ?? {},
  };
}

describe('computeRecap', () => {
  it('empty events → all hero zeros, perStation empty, outstanding empty', () => {
    const out = computeRecap([], stations);
    expect(out.hero).toEqual({
      sheetsCompleted: 0,
      sheetsWasted: 0,
      jobsCompleted: 0,
      pmsPerformed: 0,
      issuesNoted: 0,
      tasksCompleted: 0,
    });
    expect(out.perStation).toEqual([]);
    expect(out.outstanding.unfinishedJobs).toEqual([]);
  });

  it('one started + one completed → jobsCompleted=1, sheets summed, no outstanding', () => {
    const events: FloorEvent[] = [
      ev({
        id: 'a',
        stationId: 's1',
        kind: 'job_started',
        occurredAt: new Date('2026-05-07T08:00:00Z'),
        payload: { jobNumber: 'J100' },
      }),
      ev({
        id: 'b',
        stationId: 's1',
        kind: 'job_completed',
        occurredAt: new Date('2026-05-07T09:00:00Z'),
        payload: { jobNumber: 'J100', sheets: 250 },
      }),
    ];
    const out = computeRecap(events, stations);
    expect(out.hero.jobsCompleted).toBe(1);
    expect(out.hero.sheetsCompleted).toBe(250);
    expect(out.outstanding.unfinishedJobs).toEqual([]);
    expect(out.perStation).toHaveLength(1);
    expect(out.perStation[0].stationName).toBe('Press 1');
    expect(out.perStation[0].sheetsCompleted).toBe(250);
    expect(out.perStation[0].jobsCompleted).toBe(1);
  });

  it('two paired pauses: downtime summed, pauseReasons map correct', () => {
    const events: FloorEvent[] = [
      ev({
        stationId: 's1',
        kind: 'job_paused',
        occurredAt: new Date('2026-05-07T08:00:00Z'),
        payload: { reason: 'material' },
      }),
      ev({
        stationId: 's1',
        kind: 'job_resumed',
        occurredAt: new Date('2026-05-07T08:10:00Z'), // 10 min
        payload: {},
      }),
      ev({
        stationId: 's1',
        kind: 'job_paused',
        occurredAt: new Date('2026-05-07T09:00:00Z'),
        payload: { reason: 'setup' },
      }),
      ev({
        stationId: 's1',
        kind: 'job_resumed',
        occurredAt: new Date('2026-05-07T09:15:00Z'), // 15 min
        payload: {},
      }),
    ];
    const out = computeRecap(events, stations);
    expect(out.perStation).toHaveLength(1);
    expect(out.perStation[0].downtimeMinutes).toBe(25);
    expect(out.perStation[0].pauseReasons).toEqual({
      material: 1,
      setup: 1,
    });
  });

  it('started but not completed → outstanding has 1 entry', () => {
    const events: FloorEvent[] = [
      ev({
        id: 's',
        stationId: 's2',
        kind: 'job_started',
        occurredAt: new Date('2026-05-07T08:00:00Z'),
        payload: { jobNumber: 'J200', sheets: 500 },
      }),
    ];
    const out = computeRecap(events, stations);
    expect(out.outstanding.unfinishedJobs).toHaveLength(1);
    expect(out.outstanding.unfinishedJobs[0]).toMatchObject({
      stationId: 's2',
      stationName: 'Press 2',
      jobNumber: 'J200',
      sheets: 500,
    });
  });

  it('unmatched job_paused without resume contributes no downtime', () => {
    const events: FloorEvent[] = [
      ev({
        stationId: 's1',
        kind: 'job_paused',
        occurredAt: new Date('2026-05-07T08:00:00Z'),
        payload: { reason: 'material' },
      }),
    ];
    const out = computeRecap(events, stations);
    expect(out.perStation[0].downtimeMinutes).toBe(0);
    expect(out.perStation[0].pauseReasons).toEqual({ material: 1 });
  });

  it('counts pm_performed, issue_noted, task_completed, waste_logged in hero', () => {
    const events: FloorEvent[] = [
      ev({ stationId: 's1', kind: 'pm_performed' }),
      ev({ stationId: 's1', kind: 'pm_performed' }),
      ev({ stationId: 's1', kind: 'issue_noted', payload: { text: 'bad' } }),
      ev({ stationId: 's1', kind: 'task_completed', payload: { title: 't' } }),
      ev({ stationId: 's1', kind: 'waste_logged', payload: { sheets: 12 } }),
    ];
    const out = computeRecap(events, stations);
    expect(out.hero.pmsPerformed).toBe(2);
    expect(out.hero.issuesNoted).toBe(1);
    expect(out.hero.tasksCompleted).toBe(1);
    expect(out.hero.sheetsWasted).toBe(12);
  });
});
