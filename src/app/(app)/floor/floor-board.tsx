'use client';
import { useState } from 'react';
import type { Station } from '@/server/floor-stations';
import type { ShiftSession } from '@/server/floor-shifts';
import type { ShiftEvent } from '@/server/floor-events';
import type { TaskRow } from '@/server/floor-tasks';
import type { PmStatusRow } from '@/server/floor-pm';
import type { FloorStationView } from '@/lib/floor-types';

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

  // Reference unused state setter / initial so they aren't lint-flagged while
  // the heavy panels (Tasks 23–30) are still stubbed.
  void initial;
  void mode;
  void setMode;

  return (
    <div data-floor-tv="true" className="min-h-[calc(100vh-3rem)] -m-6 p-4 flex flex-col gap-3">
      {/* TODO Task 23 — TV header */}
      <div className="floor-header opacity-50">[ TV header coming Task 23 ]</div>

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
