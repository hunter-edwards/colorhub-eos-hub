'use client';
import { useState } from 'react';
import type { Station } from '@/server/floor-stations';
import type { ShiftSession } from '@/server/floor-shifts';
import type { ShiftEvent } from '@/server/floor-events';
import type { TaskRow } from '@/server/floor-tasks';
import type { PmStatusRow } from '@/server/floor-pm';
import type { FloorStationView } from '@/lib/floor-types';
import { TVHeader } from './components/tv-header';

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
};

type Mode = 'huddle' | 'run';

export function FloorBoard({ initial }: { initial: FloorBoardInitial }) {
  const [mode, setMode] = useState<Mode>('huddle');

  const sessionStatus: 'live' | 'pre-shift' | 'handoff' =
    initial.session && !initial.session.closedAt
      ? 'live'
      : initial.shift && !initial.session
        ? 'pre-shift'
        : 'handoff';

  const counts = {
    operators: initial.members.length,
    pmsDue: initial.pmStatuses.filter((p) => p.level !== 'green').length,
    openIssues: initial.events.filter((e) => e.kind === 'issue_noted').length,
    tasksOpen: initial.tasks.filter(
      (t) => t.status === 'open' || t.status === 'in_progress',
    ).length,
  };

  const sessionOpenedAt = initial.session?.openedAt
    ? new Date(initial.session.openedAt as unknown as string)
    : null;

  return (
    <div data-floor-tv="true" className="min-h-[calc(100vh-3rem)] -m-6 p-4 flex flex-col gap-3">
      <TVHeader
        shift={initial.shift}
        sessionStatus={sessionStatus}
        mode={mode}
        counts={counts}
        sessionOpenedAt={sessionOpenedAt}
        lastSyncAt={new Date()}
        onModeChange={setMode}
        onCounterClick={() => {
          /* TODO Task 31 — scroll/highlight panel */
        }}
      />

      {/* Stations grid takes ~70% */}
      <div className="flex-[7] floor-body opacity-50">[ Stations grid coming Task 25 ]</div>

      {/* Bottom strip ~30% — three panels */}
      <div className="flex-[3] grid grid-cols-3 gap-3">
        <div className="rounded-md border border-white/10 p-4 floor-body opacity-50">[ People bench Task 26 ]</div>
        <div className="rounded-md border border-white/10 p-4 floor-body opacity-50">[ Tasks pool Task 28 ]</div>
        <div className="rounded-md border border-white/10 p-4 floor-body opacity-50">[ Events feed Task 30 ]</div>
      </div>
    </div>
  );
}
