'use client';

import { useEffect, useState } from 'react';

type Mode = 'huddle' | 'run';
type Panel = 'people' | 'pm' | 'issues' | 'tasks';
type SessionStatus = 'live' | 'pre-shift' | 'handoff';

type Props = {
  shift: { shiftNumber: 1 | 2; date: string } | null;
  sessionStatus: SessionStatus;
  mode: Mode;
  counts: { operators: number; pmsDue: number; openIssues: number; tasksOpen: number };
  /** Time the shift session was opened — used to render the live elapsed timer. */
  sessionOpenedAt?: Date | null;
  lastSyncAt: Date | null;
  onModeChange: (m: Mode) => void;
  onCounterClick: (panel: Panel) => void;
};

const FLOOR_TZ = 'America/Chicago';

function formatShiftLabel(
  shift: { shiftNumber: 1 | 2; date: string } | null,
): string {
  if (!shift) return 'Off-shift';
  // Parse 'YYYY-MM-DD' as a Chicago-local calendar date. We intentionally
  // construct the date at noon UTC so DST shifts can't bump it to the prior
  // day in en-US formatting.
  const [y, m, d] = shift.date.split('-').map((s) => parseInt(s, 10));
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: FLOOR_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const ordinal = shift.shiftNumber === 1 ? '1st' : '2nd';
  return `${ordinal} Shift — ${fmt.format(date)}`;
}

function formatElapsed(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatClock(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FLOOR_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
}

function statusPillClasses(status: SessionStatus): string {
  switch (status) {
    case 'live':
      return 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40';
    case 'pre-shift':
      return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40';
    case 'handoff':
      return 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/40';
  }
}

function statusLabel(status: SessionStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'pre-shift':
      return 'Pre-shift';
    case 'handoff':
      return 'Handoff';
  }
}

export function TVHeader(props: Props) {
  const {
    shift,
    sessionStatus,
    mode,
    counts,
    sessionOpenedAt,
    lastSyncAt,
    onModeChange,
    onCounterClick,
  } = props;

  // Tick once per second for the live elapsed timer + clock.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const shiftLabel = formatShiftLabel(shift);
  const elapsed = sessionOpenedAt
    ? formatElapsed(now.getTime() - sessionOpenedAt.getTime())
    : null;

  const counters: Array<{
    key: Panel;
    label: string;
    value: number;
    aria: string;
  }> = [
    { key: 'people', label: 'Operators', value: counts.operators, aria: 'operators' },
    { key: 'pm', label: 'PMs Due', value: counts.pmsDue, aria: 'pms due' },
    { key: 'issues', label: 'Open Issues', value: counts.openIssues, aria: 'open issues' },
    { key: 'tasks', label: 'Tasks Open', value: counts.tasksOpen, aria: 'tasks open' },
  ];

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
      {/* LEFT: shift label + elapsed/clock */}
      <div className="flex flex-col min-w-0">
        <div className="floor-header truncate">{shiftLabel}</div>
        <div className="flex items-center gap-3 mt-1">
          {elapsed && (
            <span className="floor-chip text-white/70">Elapsed {elapsed}</span>
          )}
          <span className="floor-chip text-white/70">{formatClock(now)}</span>
        </div>
      </div>

      {/* CENTER: status pill + mode toggle */}
      <div className="flex items-center gap-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${statusPillClasses(sessionStatus)}`}
        >
          {statusLabel(sessionStatus)}
        </span>
        <div className="inline-flex rounded-md overflow-hidden ring-1 ring-white/15">
          <button
            type="button"
            onClick={() => onModeChange('huddle')}
            aria-pressed={mode === 'huddle'}
            className={`px-4 py-2 text-sm font-semibold ${
              mode === 'huddle'
                ? 'bg-white/15 text-white'
                : 'bg-transparent text-white/60 hover:text-white'
            }`}
          >
            Huddle
          </button>
          <button
            type="button"
            onClick={() => onModeChange('run')}
            aria-pressed={mode === 'run'}
            className={`px-4 py-2 text-sm font-semibold ${
              mode === 'run'
                ? 'bg-white/15 text-white'
                : 'bg-transparent text-white/60 hover:text-white'
            }`}
          >
            Run
          </button>
        </div>
      </div>

      {/* RIGHT: counters + sync dot */}
      <div className="flex items-center gap-2">
        {counters.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onCounterClick(c.key)}
            aria-label={c.aria}
            className="min-w-[88px] h-14 flex flex-col items-center justify-center px-3 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10"
          >
            <span className="text-2xl font-bold leading-none tabular-nums">{c.value}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
              {c.label}
            </span>
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2 text-xs text-white/60">
          <span
            aria-hidden="true"
            className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"
          />
          <span>
            Last sync {lastSyncAt ? 'just now' : 'never'}
          </span>
        </div>
      </div>
    </header>
  );
}
