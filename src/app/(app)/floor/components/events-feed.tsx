'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  PauseCircle,
  Pin,
  PinOff,
  Play,
  Trash2,
  UserCog,
  Wrench,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import type { ShiftEvent } from '@/server/floor-events';
import { summarizeEvent, type FloorEvent } from '@/lib/floor-events-utils';

const FLOOR_TZ = 'America/Chicago';

type Station = { id: string; name: string };

type Props = {
  events: ShiftEvent[];
  stations: Station[];
};

const KIND_ICON: Record<FloorEvent['kind'], LucideIcon> = {
  job_started: Play,
  job_paused: PauseCircle,
  job_resumed: Play,
  job_completed: CheckCircle2,
  pm_performed: Wrench,
  issue_noted: AlertTriangle,
  waste_logged: Trash2,
  task_completed: ListChecks,
  operator_moved: UserCog,
  note: StickyNote,
};

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FLOOR_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function EventsFeed({ events, stations }: Props) {
  const [pinned, setPinned] = useState(false);
  const lastCountRef = useRef(events.length);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const stationNameById = new Map(stations.map((s) => [s.id, s.name] as const));

  useEffect(() => {
    if (pinned) {
      lastCountRef.current = events.length;
      return;
    }
    if (events.length > lastCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    lastCountRef.current = events.length;
  }, [events.length, pinned]);

  return (
    <div className="rounded-md border border-white/10 p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="floor-title">Shift events · {events.length}</div>
        <button
          type="button"
          onClick={() => setPinned((v) => !v)}
          aria-label={pinned ? 'Unpin scroll' : 'Pin scroll'}
          aria-pressed={pinned}
          className={`floor-chip p-1 rounded ring-1 ring-white/10 ${
            pinned
              ? 'bg-amber-500/20 text-amber-300 ring-amber-400/40'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          {pinned ? (
            <PinOff className="size-4" />
          ) : (
            <Pin className="size-4" />
          )}
        </button>
      </div>
      <div ref={scrollRef} className="flex flex-col gap-1 overflow-auto min-h-0">
        {events.length === 0 && (
          <div className="floor-body text-white/40 text-center py-4">
            No events yet
          </div>
        )}
        {events.map((e) => {
          const occurredAt =
            e.occurredAt instanceof Date
              ? e.occurredAt
              : new Date(e.occurredAt as unknown as string);
          const stationName = e.stationId
            ? stationNameById.get(e.stationId) ?? '—'
            : '—';
          const Icon = KIND_ICON[e.kind] ?? Activity;
          const summary = summarizeEvent({
            id: e.id,
            stationId: e.stationId,
            kind: e.kind,
            occurredAt,
            payload: (e.payload ?? {}) as Record<string, unknown>,
          } as FloorEvent);
          return (
            <div
              key={e.id}
              className="flex items-start gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1.5"
            >
              <Icon className="size-4 mt-0.5 shrink-0 text-white/60" />
              <span className="floor-chip tabular-nums text-white/60 shrink-0 mt-0.5">
                {formatTime(occurredAt)}
              </span>
              <span className="floor-chip text-white/50 shrink-0 mt-0.5 truncate max-w-[8rem]">
                {stationName}
              </span>
              <span className="floor-body text-white/90 flex-1 min-w-0 truncate">
                {summary}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
