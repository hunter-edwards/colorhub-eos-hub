import { listStations } from '@/server/floor-stations';
import { StationsTable, type StationRow } from './stations-table';

export async function StationsTab() {
  const stations = await listStations({ includeArchived: true });
  const rows: StationRow[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    displayOrder: s.displayOrder,
    groupLabel: s.groupLabel,
    archivedAt: s.archivedAt,
  }));
  return <StationsTable stations={rows} />;
}
