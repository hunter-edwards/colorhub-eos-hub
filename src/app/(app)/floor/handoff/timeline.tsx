import type { ShiftEvent } from '@/server/floor-events';
import type { Station } from '@/server/floor-stations';
import {
  groupEventsByStation,
  summarizeEvent,
  type FloorEvent,
} from '@/lib/floor-events-utils';

function fmtTime(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function iconFor(kind: FloorEvent['kind']): string {
  switch (kind) {
    case 'job_started':
      return '▶';
    case 'job_paused':
      return '⏸';
    case 'job_resumed':
      return '⏵';
    case 'job_completed':
      return '✓';
    case 'pm_performed':
      return '🛠';
    case 'issue_noted':
      return '⚠';
    case 'waste_logged':
      return '✗';
    case 'task_completed':
      return '☑';
    case 'operator_moved':
      return '↦';
    case 'note':
      return '📝';
    default:
      return '•';
  }
}

export function HandoffTimeline({
  events,
  stations,
}: {
  events: ShiftEvent[];
  stations: Station[];
}) {
  const stationName = new Map(stations.map((s) => [s.id, s.name]));
  const grouped = groupEventsByStation(events as unknown as FloorEvent[]);

  if (grouped.size === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No station events for this shift.
      </p>
    );
  }

  // Sort station ids by display order if present.
  const orderIndex = new Map(stations.map((s, i) => [s.id, i]));
  const stationIds = [...grouped.keys()].sort(
    (a, b) => (orderIndex.get(a) ?? 999) - (orderIndex.get(b) ?? 999),
  );

  return (
    <div className="space-y-2">
      {stationIds.map((sid) => {
        const evs = (grouped.get(sid) ?? []).slice().sort(
          (a, b) =>
            new Date(b.occurredAt as unknown as string).getTime() -
            new Date(a.occurredAt as unknown as string).getTime(),
        );
        return (
          <details
            key={sid}
            className="rounded-md border bg-card text-card-foreground"
          >
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
              {stationName.get(sid) ?? 'Unknown'}{' '}
              <span className="text-muted-foreground">({evs.length})</span>
            </summary>
            <ul className="divide-y border-t">
              {evs.map((e) => (
                <li
                  key={e.id}
                  className="flex items-baseline gap-3 px-3 py-1.5 text-sm"
                >
                  <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {fmtTime(e.occurredAt as unknown as string)}
                  </span>
                  <span aria-hidden className="w-4 shrink-0 text-center">
                    {iconFor(e.kind as FloorEvent['kind'])}
                  </span>
                  <span className="flex-1">
                    {summarizeEvent(e as unknown as FloorEvent)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
