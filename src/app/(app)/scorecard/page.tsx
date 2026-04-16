import { listMetrics, listEntries } from '@/server/scorecard';
import { getWeekStarts } from '@/lib/scorecard-utils';
import { listTeamMembers } from '@/server/rocks';
import { ScorecardGrid } from './grid';

export default async function ScorecardPage() {
  const weeks = getWeekStarts(13);
  const [metrics, entries, members] = await Promise.all([
    listMetrics(),
    listEntries(weeks[0], 13),
    listTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Scorecard</h1>
      <ScorecardGrid metrics={metrics} entries={entries} weeks={weeks} members={members} />
    </div>
  );
}
