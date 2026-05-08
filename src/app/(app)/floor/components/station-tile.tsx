'use client';

import type { Station } from '@/server/floor-stations';
import type { FloorStationView } from '@/lib/floor-types';
import { progress } from '@/lib/floor-progress-utils';

type PmInfo = {
  level: 'green' | 'yellow' | 'red';
  daysUntilDue: number | null;
  label: string;
};

type Props = {
  station: Station;
  view: FloorStationView;
  operators: string[];
  pm: PmInfo | null;
  onExpand: (stationId: string) => void;
};

function statusPillClasses(status: FloorStationView['status']): string {
  switch (status) {
    case 'running':
      return 'bg-green-500/20 text-green-300 ring-1 ring-green-400/40';
    case 'setup':
      return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40';
    case 'down':
      return 'bg-red-500/20 text-red-300 ring-1 ring-red-400/40';
    case 'idle':
    default:
      return 'bg-white/10 text-white/60 ring-1 ring-white/15';
  }
}

function statusLabel(status: FloorStationView['status']): string {
  return status.toUpperCase();
}

function pmBadgeClasses(level: PmInfo['level']): string {
  switch (level) {
    case 'red':
      return 'bg-red-500/20 text-red-300 ring-1 ring-red-400/40';
    case 'yellow':
      return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40';
    case 'green':
    default:
      return 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40';
  }
}

function pmHint(daysUntilDue: number | null): string {
  if (daysUntilDue == null) return '';
  if (daysUntilDue < 0) return `(overdue ${Math.abs(daysUntilDue)}d)`;
  if (daysUntilDue === 0) return '(due today)';
  return `(due in ${daysUntilDue}d)`;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

export function StationTile({ station, view, operators, pm, onExpand }: Props) {
  const current = view.current;
  const next = view.queue[0] ?? null;
  const progressInfo = current
    ? progress({ completed: current.sheetsCompleted, needed: current.sheetsNeeded })
    : null;

  const idleLabel =
    view.status === 'down' ? 'Down' : view.status === 'setup' ? 'Setup' : 'No job';

  return (
    <button
      type="button"
      onClick={() => onExpand(station.id)}
      aria-label={station.name}
      className="relative flex flex-col text-left h-full w-full rounded-md border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors overflow-hidden"
    >
      {/* Header row: name + status pill */}
      <div className="flex items-start justify-between gap-2">
        <div className="floor-title truncate min-w-0">{station.name}</div>
        <span
          className={`floor-chip px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusPillClasses(view.status)}`}
        >
          {statusLabel(view.status)}
        </span>
      </div>

      {/* PM badge — only when present */}
      {pm && (
        <div className="mt-1">
          <span
            className={`floor-chip inline-block px-2 py-0.5 rounded-full font-semibold ${pmBadgeClasses(pm.level)}`}
          >
            PM {pm.label} {pmHint(pm.daysUntilDue)}
          </span>
        </div>
      )}

      {/* Body */}
      {current && progressInfo ? (
        <div className="flex-1 flex flex-col mt-2 min-w-0">
          <div className="floor-title font-bold tabular-nums truncate">
            {current.jobNumber}
          </div>
          <div className="floor-body text-white/80 truncate">
            {current.customer} · {current.lineItem}
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full ${progressInfo.isOver ? 'bg-violet-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, progressInfo.pct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="floor-chip tabular-nums text-white/70">
                {formatNum(progressInfo.completed)} / {formatNum(progressInfo.needed)}
              </span>
              <span
                className={`floor-chip tabular-nums font-semibold ${
                  progressInfo.isOver ? 'over text-violet-400' : 'text-white/80'
                }`}
              >
                {progressInfo.pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="floor-display text-white/40">{idleLabel}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
        <div className="floor-chip text-white/70 truncate min-w-0">
          {operators.length > 0 ? operators.join(' · ') : '—'}
        </div>
        {next && (
          <div className="floor-chip text-white/60 whitespace-nowrap">
            Next: {next.jobNumber}
          </div>
        )}
      </div>
    </button>
  );
}
