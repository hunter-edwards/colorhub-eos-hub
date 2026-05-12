'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Station } from '@/server/floor-stations';
import type { ShiftSession } from '@/server/floor-shifts';
import type { ShiftEvent } from '@/server/floor-events';
import type { TaskRow } from '@/server/floor-tasks';
import type { PmStatusRow } from '@/server/floor-pm';
import type { FloorStationView } from '@/lib/floor-types';
import { isInHuddleWindow } from '@/lib/floor-shift-utils';
import { TVHeader } from './components/tv-header';
import { StationsGrid } from './components/stations-grid';
import { PeopleBench } from './components/people-bench';
import { TasksPanel } from './components/tasks-panel';
import { EventsFeed } from './components/events-feed';
import { StationModal } from './components/station-modal';
import { assignOperatorAction } from './floor-board-actions';
import { useFloorPoll } from './floor-poller';

type PmTileRow = {
  stationId: string;
  level: 'green' | 'yellow' | 'red';
  daysUntilDue: number | null;
  label: string;
};

function buildOperatorsByStation(
  assignments: FloorBoardInitial['assignments'],
  defaults: FloorBoardInitial['defaultOperatorsByStation'],
  members: FloorBoardInitial['members'],
): Record<string, string[]> {
  const idToName = new Map(members.map((m) => [m.id, m.name ?? m.email]));
  const byStation: Record<string, string[]> = {};
  for (const a of assignments) {
    if (!byStation[a.stationId]) byStation[a.stationId] = [];
    byStation[a.stationId].push(idToName.get(a.userId) ?? 'Unknown');
  }
  for (const [stationId, userIds] of Object.entries(defaults)) {
    if (!byStation[stationId]) {
      byStation[stationId] = userIds.map((id) => idToName.get(id) ?? 'Unknown');
    }
  }
  return byStation;
}

function buildPmByStation(
  rows: FloorBoardInitial['pmStatuses'],
): Record<string, PmTileRow | null> {
  const out: Record<string, PmTileRow> = {};
  const rank: Record<'red' | 'yellow' | 'green', number> = {
    red: 3,
    yellow: 2,
    green: 1,
  };
  for (const r of rows) {
    const cur = out[r.stationId];
    if (!cur || rank[r.level] > rank[cur.level]) {
      out[r.stationId] = {
        stationId: r.stationId,
        level: r.level,
        daysUntilDue: r.daysUntilDue,
        label: r.label,
      };
    }
  }
  return out;
}

export type FloorBoardInitial = {
  now: string;
  shift: { shiftNumber: 1 | 2; date: string } | null;
  session: ShiftSession | null;
  stations: Station[];
  assignments: Array<{ stationId: string; userId: string }>;
  events: ShiftEvent[];
  pmStatuses: PmStatusRow[];
  tasks: TaskRow[];
  floorView: FloorStationView[];
  members: Array<{ id: string; name: string | null; email: string }>;
  defaultOperatorsByStation: Record<string, string[]>;
  previousHandoffNotes: string | null;
  previousSessionId: string | null;
  floorSync: {
    syncedAt: string | null;
    status: 'ok' | 'error' | null;
    errorMessage: string | null;
  } | null;
};

type Mode = 'huddle' | 'run';

export function FloorBoard({ initial }: { initial: FloorBoardInitial }) {
  // Default mode: 'huddle' inside the ±10-minute huddle window, otherwise
  // 'run'. Computed in a useState initializer so the SSR snapshot and the
  // first client render agree.
  const [mode, setMode] = useState<Mode>(() =>
    isInHuddleWindow(new Date()) ? 'huddle' : 'run',
  );
  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Live state — seeded from `initial`, updated each tick from the poller.
  const [events, setEvents] = useState<ShiftEvent[]>(initial.events);
  const [assignments, setAssignments] = useState<
    FloorBoardInitial['assignments']
  >(initial.assignments);
  const [tasks, setTasks] = useState<TaskRow[]>(initial.tasks);
  const [pmStatuses, setPmStatuses] = useState<PmStatusRow[]>(
    initial.pmStatuses,
  );
  const [floorView, setFloorView] = useState<FloorStationView[]>(
    initial.floorView,
  );
  const [pulsingStations, setPulsingStations] = useState<
    Record<string, true>
  >({});
  const [handoffDismissed, setHandoffDismissed] = useState(false);

  // Read dismissal state from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    if (!initial.previousSessionId || !initial.previousHandoffNotes) return;
    try {
      const stored = window.localStorage.getItem('floor-handoff-dismissed');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bridging from window.localStorage (external system) to React state on mount
      if (stored === initial.previousSessionId) setHandoffDismissed(true);
    } catch {
      // localStorage unavailable; treat as not dismissed.
    }
  }, [initial.previousSessionId, initial.previousHandoffNotes]);

  function dismissHandoffBanner() {
    setHandoffDismissed(true);
    if (initial.previousSessionId) {
      try {
        window.localStorage.setItem(
          'floor-handoff-dismissed',
          initial.previousSessionId,
        );
      } catch {
        // ignore.
      }
    }
  }

  const { snapshot, lastSyncAt } = useFloorPoll(initial.session?.id ?? null);

  // Track per-station pulse-clear timers so repeated bursts re-arm cleanly.
  const pulseTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.newEvents.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing poll snapshot (external system) into React state
      setEvents((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        const merged = [
          ...snapshot.newEvents.filter((e) => !ids.has(e.id)),
          ...prev,
        ];
        return merged.slice(0, 200);
      });
      const stationIds = Array.from(
        new Set(
          snapshot.newEvents
            .map((e) => e.stationId)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      if (stationIds.length > 0) {
        setPulsingStations((prev) => ({
          ...prev,
          ...Object.fromEntries(stationIds.map((id) => [id, true as const])),
        }));
        for (const id of stationIds) {
          const existing = pulseTimers.current.get(id);
          if (existing) window.clearTimeout(existing);
          const timer = window.setTimeout(() => {
            setPulsingStations((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            pulseTimers.current.delete(id);
          }, 1500);
          pulseTimers.current.set(id, timer);
        }
      }
    }
    setAssignments(snapshot.assignments);
    setTasks(snapshot.tasks);
    setPmStatuses(snapshot.pmStatuses);
    setFloorView(snapshot.floorView);
  }, [snapshot]);

  // Clean up any outstanding pulse timers on unmount.
  useEffect(() => {
    const timers = pulseTimers.current;
    return () => {
      for (const t of timers.values()) window.clearTimeout(t);
      timers.clear();
    };
  }, []);

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || !initial.session) return;
    const userId = String(e.active.id).replace('member-', '');
    const stationId = String(e.over.id).replace('station-', '');
    const userName = initial.members.find((m) => m.id === userId)?.name ?? null;
    const stationName =
      initial.stations.find((s) => s.id === stationId)?.name ?? null;
    const currentStation = assignments.find((a) => a.userId === userId);
    const fromStationName = currentStation
      ? initial.stations.find((s) => s.id === currentStation.stationId)?.name ?? null
      : null;
    if (!initial.session) return;
    const sessionId = initial.session.id;
    startTransition(() => {
      void assignOperatorAction({
        shiftSessionId: sessionId,
        stationId,
        userId,
        fromStationId: currentStation?.stationId ?? null,
        fromStationName,
        toStationName: stationName,
        userName,
      });
    });
  }

  const operatorsByStation = buildOperatorsByStation(
    assignments,
    initial.defaultOperatorsByStation,
    initial.members,
  );
  const pmByStation = buildPmByStation(pmStatuses);

  const sessionStatus: 'live' | 'pre-shift' | 'handoff' =
    initial.session && !initial.session.closedAt
      ? 'live'
      : initial.shift && !initial.session
        ? 'pre-shift'
        : 'handoff';

  const counts = {
    operators: initial.members.length,
    pmsDue: pmStatuses.filter((p) => p.level !== 'green').length,
    openIssues: events.filter((e) => e.kind === 'issue_noted').length,
    tasksOpen: tasks.filter(
      (t) => t.status === 'open' || t.status === 'in_progress',
    ).length,
  };

  const sessionOpenedAt = initial.session?.openedAt
    ? new Date(initial.session.openedAt as unknown as string)
    : null;

  const expandedStationData = useMemo(() => {
    if (!expandedStation) return null;
    return {
      station:
        initial.stations.find((s) => s.id === expandedStation) ?? null,
      view: floorView.find((v) => v.stationId === expandedStation) ?? null,
    };
  }, [expandedStation, initial.stations, floorView]);

  const expandedAssignedOperators = useMemo(() => {
    if (!expandedStation) return [];
    return assignments
      .filter((a) => a.stationId === expandedStation)
      .map((a) => ({
        id: a.userId,
        name: initial.members.find((m) => m.id === a.userId)?.name ?? '',
      }));
  }, [expandedStation, assignments, initial.members]);

  const expandedPmRows = useMemo(() => {
    if (!expandedStation) return [];
    return pmStatuses
      .filter((p) => p.stationId === expandedStation)
      .map((p) => ({
        pmId: p.pmId,
        level: p.level,
        daysUntilDue: p.daysUntilDue,
        nextDueAt: p.nextDueAt,
        label: p.label,
      }));
  }, [expandedStation, pmStatuses]);

  const expandedEvents = useMemo(() => {
    if (!expandedStation) return [];
    return events.filter((e) => e.stationId === expandedStation);
  }, [expandedStation, events]);

  return (
    <div
      data-floor-tv="true"
      data-floor-mode={mode}
      data-modal-open={expandedStation ? 'true' : undefined}
      className="min-h-[calc(100vh-3rem)] -m-6 p-4 flex flex-col gap-3"
    >
      <TVHeader
        shift={initial.shift}
        sessionStatus={sessionStatus}
        mode={mode}
        counts={counts}
        sessionOpenedAt={sessionOpenedAt}
        lastSyncAt={lastSyncAt}
        floorSync={
          initial.floorSync
            ? {
                syncedAt: initial.floorSync.syncedAt
                  ? new Date(initial.floorSync.syncedAt)
                  : null,
                status: initial.floorSync.status,
                errorMessage: initial.floorSync.errorMessage,
              }
            : null
        }
        onModeChange={setMode}
        onCounterClick={() => {
          /* TODO Task 31 — scroll/highlight panel */
        }}
      />

      {!handoffDismissed && initial.previousHandoffNotes && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 floor-body flex items-start gap-3">
          <span className="font-semibold">From last shift:</span>
          <span className="flex-1 whitespace-pre-wrap">
            {initial.previousHandoffNotes}
          </span>
          <button
            type="button"
            onClick={dismissHandoffBanner}
            aria-label="Dismiss handoff notes"
            className="px-1 leading-none"
          >
            ×
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Stations grid takes ~70% */}
        <div className="floor-grid-row flex-[7] min-h-0">
          <StationsGrid
            stations={initial.stations}
            floorView={floorView}
            operatorsByStation={operatorsByStation}
            pmByStation={pmByStation}
            onExpand={setExpandedStation}
            pulsingStationIds={pulsingStations}
          />
        </div>

        {/* Bottom strip ~30% — three panels */}
        <div className="floor-bottom-strip flex-[3] grid grid-cols-3 gap-3">
          <PeopleBench
            members={initial.members}
            assignments={assignments}
            defaultsByStation={initial.defaultOperatorsByStation}
            stations={initial.stations}
          />
          <TasksPanel
            tasks={tasks}
            stations={initial.stations}
            shiftSessionId={initial.session?.id ?? null}
          />
          <EventsFeed events={events} stations={initial.stations} />
        </div>
      </DndContext>

      <StationModal
        open={!!expandedStation}
        onOpenChange={(o) => {
          if (!o) setExpandedStation(null);
        }}
        station={expandedStationData?.station ?? null}
        view={expandedStationData?.view ?? null}
        shiftSessionId={initial.session?.id ?? null}
        events={expandedEvents}
        assignedOperators={expandedAssignedOperators}
        pmRows={expandedPmRows}
        members={initial.members}
      />
    </div>
  );
}
