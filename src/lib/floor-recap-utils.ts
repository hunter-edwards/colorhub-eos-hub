import type { FloorEvent } from './floor-events-utils';

export type Station = { id: string; name: string };

export type Recap = {
  hero: {
    sheetsCompleted: number;
    sheetsWasted: number;
    jobsCompleted: number;
    pmsPerformed: number;
    issuesNoted: number;
    tasksCompleted: number;
  };
  perStation: Array<{
    stationId: string;
    stationName: string;
    jobsCompleted: number;
    sheetsCompleted: number;
    sheetsWasted: number;
    downtimeMinutes: number;
    pauseReasons: Record<string, number>; // reason → count
  }>;
  outstanding: {
    unfinishedJobs: Array<{
      stationId: string;
      stationName: string;
      jobNumber: string | null;
      sheets: number | null;
    }>;
  };
};

function asTime(d: Date | string | null | undefined): number {
  if (!d) return 0;
  if (d instanceof Date) return d.getTime();
  return new Date(d).getTime();
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function computeRecap(events: FloorEvent[], stations: Station[]): Recap {
  const stationName = new Map<string, string>();
  for (const s of stations) stationName.set(s.id, s.name);

  // Hero counts.
  let sheetsCompleted = 0;
  let sheetsWasted = 0;
  let jobsCompleted = 0;
  let pmsPerformed = 0;
  let issuesNoted = 0;
  let tasksCompleted = 0;

  for (const e of events) {
    const p = e.payload ?? {};
    switch (e.kind) {
      case 'job_completed': {
        jobsCompleted += 1;
        const s = numOrNull(p.sheets);
        if (s !== null) sheetsCompleted += s;
        break;
      }
      case 'waste_logged': {
        const s = numOrNull(p.sheets);
        if (s !== null) sheetsWasted += s;
        break;
      }
      case 'pm_performed':
        pmsPerformed += 1;
        break;
      case 'issue_noted':
        issuesNoted += 1;
        break;
      case 'task_completed':
        tasksCompleted += 1;
        break;
    }
  }

  // Per-station aggregations: include only stations with at least one event.
  type PerStationAcc = {
    stationId: string;
    stationName: string;
    jobsCompleted: number;
    sheetsCompleted: number;
    sheetsWasted: number;
    downtimeMinutes: number;
    pauseReasons: Record<string, number>;
    pendingPauses: Array<{ at: number; reason: string | null }>;
  };
  const accs = new Map<string, PerStationAcc>();

  function ensure(stationId: string): PerStationAcc {
    let a = accs.get(stationId);
    if (!a) {
      a = {
        stationId,
        stationName: stationName.get(stationId) ?? 'Unknown',
        jobsCompleted: 0,
        sheetsCompleted: 0,
        sheetsWasted: 0,
        downtimeMinutes: 0,
        pauseReasons: {},
        pendingPauses: [],
      };
      accs.set(stationId, a);
    }
    return a;
  }

  // Process events oldest -> newest so pause/resume pairing works.
  const sorted = [...events].sort(
    (a, b) => asTime(a.occurredAt) - asTime(b.occurredAt),
  );

  for (const e of sorted) {
    if (!e.stationId) continue;
    const a = ensure(e.stationId);
    const p = e.payload ?? {};
    switch (e.kind) {
      case 'job_completed': {
        a.jobsCompleted += 1;
        const s = numOrNull(p.sheets);
        if (s !== null) a.sheetsCompleted += s;
        break;
      }
      case 'waste_logged': {
        const s = numOrNull(p.sheets);
        if (s !== null) a.sheetsWasted += s;
        break;
      }
      case 'job_paused': {
        const reason =
          typeof p.reason === 'string' && p.reason.length > 0 ? p.reason : null;
        a.pendingPauses.push({ at: asTime(e.occurredAt), reason });
        if (reason) {
          a.pauseReasons[reason] = (a.pauseReasons[reason] ?? 0) + 1;
        }
        break;
      }
      case 'job_resumed': {
        const pending = a.pendingPauses.shift();
        if (pending) {
          const ms = asTime(e.occurredAt) - pending.at;
          if (ms > 0) {
            a.downtimeMinutes += Math.round(ms / 60000);
          }
        }
        break;
      }
    }
  }

  const perStation = [...accs.values()].map((a) => ({
    stationId: a.stationId,
    stationName: a.stationName,
    jobsCompleted: a.jobsCompleted,
    sheetsCompleted: a.sheetsCompleted,
    sheetsWasted: a.sheetsWasted,
    downtimeMinutes: a.downtimeMinutes,
    pauseReasons: a.pauseReasons,
  }));

  // Outstanding: job_started events whose related job is never completed.
  type StartInfo = {
    stationId: string;
    jobNumber: string | null;
    sheets: number | null;
    relatedKey: string | null;
  };
  const completedKeys = new Set<string>();
  for (const e of sorted) {
    if (e.kind !== 'job_completed') continue;
    const rel =
      (e as unknown as { relatedKnackJobId?: string | null })
        .relatedKnackJobId ?? null;
    const jobNumber =
      typeof e.payload?.jobNumber === 'string' ? e.payload.jobNumber : null;
    if (rel) completedKeys.add(`rel:${rel}`);
    if (jobNumber) completedKeys.add(`num:${jobNumber}`);
  }

  const startedByKey = new Map<string, StartInfo>();
  const startedOrder: string[] = [];
  for (const e of sorted) {
    if (e.kind !== 'job_started') continue;
    if (!e.stationId) continue;
    const rel =
      (e as unknown as { relatedKnackJobId?: string | null })
        .relatedKnackJobId ?? null;
    const jobNumber =
      typeof e.payload?.jobNumber === 'string' ? e.payload.jobNumber : null;
    const key = rel ? `rel:${rel}` : jobNumber ? `num:${jobNumber}` : `id:${e.id}`;
    const info: StartInfo = {
      stationId: e.stationId,
      jobNumber,
      sheets: numOrNull(e.payload?.sheets),
      relatedKey: rel ? `rel:${rel}` : jobNumber ? `num:${jobNumber}` : null,
    };
    if (!startedByKey.has(key)) startedOrder.push(key);
    startedByKey.set(key, info);
  }

  const unfinishedJobs: Recap['outstanding']['unfinishedJobs'] = [];
  for (const key of startedOrder) {
    const info = startedByKey.get(key);
    if (!info) continue;
    if (info.relatedKey && completedKeys.has(info.relatedKey)) continue;
    unfinishedJobs.push({
      stationId: info.stationId,
      stationName: stationName.get(info.stationId) ?? 'Unknown',
      jobNumber: info.jobNumber,
      sheets: info.sheets,
    });
  }

  return {
    hero: {
      sheetsCompleted,
      sheetsWasted,
      jobsCompleted,
      pmsPerformed,
      issuesNoted,
      tasksCompleted,
    },
    perStation,
    outstanding: { unfinishedJobs },
  };
}
