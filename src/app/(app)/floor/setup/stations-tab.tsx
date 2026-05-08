import { listStations, listDefaultOperators } from '@/server/floor-stations';
import { listForStations } from '@/server/floor-pm-schedules';
import { listTeamMembers } from '@/server/rocks';
import { StationsTable, type StationRow, type Member, type PmScheduleRow } from './stations-table';

export async function StationsTab() {
  const stations = await listStations({ includeArchived: true });
  const stationIds = stations.map((s) => s.id);
  const defaults = await listDefaultOperators(stationIds);
  const members = await listTeamMembers();
  const pmByStation = await listForStations(stationIds);

  const memberRows: Member[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  const rows: StationRow[] = stations.map((s) => {
    const pm = pmByStation.get(s.id) ?? [];
    const pmRows: PmScheduleRow[] = pm.map((p) => ({
      id: p.id,
      stationId: p.stationId,
      label: p.label,
      cadenceDays: p.cadenceDays,
      lastDoneAt: p.lastDoneAt,
    }));
    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      displayOrder: s.displayOrder,
      groupLabel: s.groupLabel,
      archivedAt: s.archivedAt,
      defaultOperatorIds: defaults.get(s.id) ?? [],
      pmSchedules: pmRows,
    };
  });

  return <StationsTable stations={rows} members={memberRows} />;
}
