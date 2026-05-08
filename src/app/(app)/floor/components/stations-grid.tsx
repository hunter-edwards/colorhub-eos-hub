'use client';
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
};

export function StationsGrid({
  stations,
  floorView,
  operatorsByStation,
  pmByStation,
  onExpand,
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
          <StationTile
            key={s.id}
            station={s}
            view={view}
            operators={operatorsByStation[s.id] ?? []}
            pm={pmByStation[s.id] ?? null}
            onExpand={onExpand}
          />
        );
      })}
    </div>
  );
}
