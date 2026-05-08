import { listStations, listDefaultOperators } from '@/server/floor-stations';
import { listTeamMembers } from '@/server/rocks';
import { StationsTable, type StationRow, type Member } from './stations-table';

export async function StationsTab() {
  const stations = await listStations({ includeArchived: true });
  const defaults = await listDefaultOperators(stations.map((s) => s.id));
  const members = await listTeamMembers();

  const memberRows: Member[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  const rows: StationRow[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    displayOrder: s.displayOrder,
    groupLabel: s.groupLabel,
    archivedAt: s.archivedAt,
    defaultOperatorIds: defaults.get(s.id) ?? [],
  }));

  return <StationsTable stations={rows} members={memberRows} />;
}
