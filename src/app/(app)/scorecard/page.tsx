import { listMetrics, listEntries } from '@/server/scorecard';
import { getWeekStarts } from '@/lib/scorecard-utils';
import { listTeamMembers } from '@/server/rocks';
import { isKnackConfigured } from '@/server/knack-sync';
import { ScorecardGrid } from './grid';
import { KPICharts } from './kpi-charts';
import { KnackSyncButton } from './knack-sync-button';

export default async function ScorecardPage() {
  const weeks = getWeekStarts(13);
  const [metrics, entries, members, knackReady] = await Promise.all([
    listMetrics(),
    listEntries(weeks[0], 13),
    listTeamMembers(),
    isKnackConfigured(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Scorecard</h1>
        {knackReady && <KnackSyncButton />}
      </div>
      <KPICharts metrics={metrics} entries={entries} weeks={weeks} />
      <ScorecardGrid metrics={metrics} entries={entries} weeks={weeks} members={members} />
    </div>
  );
}
