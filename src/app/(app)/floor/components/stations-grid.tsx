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

  // Identify stationKeys that are shared by 2+ visible stations (e.g. CAD 1
  // + CAD 2 both point at the same Knack machine center).
  const sharedKeys = new Set(
    Object.entries(
      stations.reduce<Record<string, number>>((acc, s) => {
        if (!s.knackMachineCenterId) return acc;
        acc[s.knackMachineCenterId] = (acc[s.knackMachineCenterId] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .filter(([, n]) => n > 1)
      .map(([k]) => k),
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
              isSharedQueue={sharedKeys.has(s.knackMachineCenterId ?? '')}
              onExpand={onExpand}
            />
          </DroppableStation>
        );
      })}
    </div>
  );
}
