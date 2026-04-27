import { listMetrics, listEntries } from '@/server/scorecard';
import { getWeekStarts } from '@/lib/scorecard-utils';
import { listTeamMembers } from '@/server/rocks';
import { isKnackConfigured, getLastKnackSync } from '@/server/knack-sync';
import { ScorecardGrid } from './grid';
import { KPICharts } from './kpi-charts';
import { KnackSyncButton } from './knack-sync-button';

export default async function ScorecardPage() {
  const weeks = getWeekStarts(13);
  const [metrics, entries, members, knackReady, lastSync] = await Promise.all([
    listMetrics(),
    listEntries(weeks[0], 13),
    listTeamMembers(),
    isKnackConfigured(),
    getLastKnackSync(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Scorecard</h1>
          <p className="text-sm text-muted-foreground">
            Weekly KPIs pulled from Knack. Click any chart to see the runs behind the number.
          </p>
        </div>
        {knackReady && <KnackSyncButton lastSyncedAt={lastSync?.syncedAt ?? null} />}
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Key metrics
          </h2>
          <span className="text-xs text-muted-foreground">Last 13 weeks</span>
        </div>
        <KPICharts metrics={metrics} entries={entries} weeks={weeks} />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All metrics
          </h2>
          <span className="text-xs text-muted-foreground">{metrics.length} tracked</span>
        </div>
        <ScorecardGrid metrics={metrics} entries={entries} weeks={weeks} members={members} />
      </section>
    </div>
  );
}
