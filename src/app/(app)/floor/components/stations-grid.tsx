'use client';
import { useDroppable } from '@dnd-kit/core';
import type { Station } from '@/server/floor-stations';
import type { FloorStationView } from '@/lib/floor-types';
import { StationTile } from './station-tile';

type PmRow = {
  stationId: string;
  level: 'green' | 'yellow' | 'red';
  daysUntilDue: number | null;
  label: string;
};

type Props = {
  stations: Station[];
  floorView: FloorStationView[];
  operatorsByStation: Record<string, string[]>;
  pmByStation: Record<string, PmRow | null>;
  onExpand: (stationId: string) => void;
  pulsingStationIds?: Record<string, true>;
};

function DroppableStation({
  stationId,
  pulsing,
  children,
}: {
  stationId: string;
  pulsing?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `station-${stationId}` });
  return (
    <div
      ref={setNodeRef}
      data-pulse={pulsing ? 'true' : undefined}
      className={isOver ? 'ring-2 ring-emerald-500 rounded-lg' : undefined}
    >
      {children}
    </div>
  );
}

export function StationsGrid({
  stations,
  floorView,
  operatorsByStation,
  pmByStation,
  onExpand,
  pulsingStationIds,
}: Props) {
  const viewById = new Map(floorView.map((v) => [v.stationId, v]));
  const sorted = [...stations].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-3 h-full">
      {sorted.map((s) => {
        const view: FloorStationView = viewById.get(s.id) ?? {
          stationId: s.id,
          status: 'idle',
          current: null,
          queue: [],
        };
        return (
          <DroppableStation
            key={s.id}
            stationId={s.id}
            pulsing={Boolean(pulsingStationIds?.[s.id])}
          >
            <StationTile
              station={s}
              view={view}
              operators={operatorsByStation[s.id] ?? []}
              pm={pmByStation[s.id] ?? null}
              onExpand={onExpand}
            />
          </DroppableStation>
        );
      })}
    </div>
  );
}
