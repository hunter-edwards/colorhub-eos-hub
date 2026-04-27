import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { listRocks } from '@/server/rocks';
import { listMyTodos } from '@/server/todos';
import { listMetrics, listEntries } from '@/server/scorecard';
import { listMeetings } from '@/server/meetings';
import { getIssuesTrend } from '@/server/issues';
import { currentQuarter } from '@/lib/quarters';
import { getWeekStarts, evaluateEntry } from '@/lib/scorecard-utils';
import Link from 'next/link';
import { DashboardTrends } from './dashboard-trends';
import { ArrowRight, TrendingUp, Target, CheckSquare, Calendar } from 'lucide-react';

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const quarter = currentQuarter();
  const [weekStart] = getWeekStarts(1);

  const [allRocks, myTodos, metrics, entries, trendEntries, allMeetings, issuesTrend] = await Promise.all([
    listRocks(quarter),
    listMyTodos(),
    listMetrics(),
    listEntries(weekStart, 1),
    listEntries(weekStart, 13),
    listMeetings(),
    getIssuesTrend(13),
  ]);

  const myRocks = allRocks.filter((r) => r.ownerId === user?.id);
  const recentMeetings = allMeetings.slice(0, 5);

  const entryMap = new Map(entries.map((e) => [e.metricId, e.value]));
  const scorecardRows = metrics.map((m) => {
    const val = entryMap.get(m.id);
    const color = val != null ? evaluateEntry(m, Number(val)) : null;
    return { ...m, value: val, color };
  });

  // Trend data for Knack-sourced KPIs — one tile each, single y-axis
  const trendWeeks = getWeekStarts(13).slice().reverse(); // oldest → newest
  function trendFor(metricName: string) {
    const m = metrics.find((x) => x.name === metricName);
    if (!m) return { data: trendWeeks.map((w) => ({ weekStart: w, value: null as number | null })), goal: null };
    const byWeek = new Map(
      trendEntries
        .filter((e) => e.metricId === m.id)
        .map((e) => [e.weekStart, e.value != null ? Number(e.value) : null])
    );
    const data = trendWeeks.map((w) => ({ weekStart: w, value: byWeek.get(w) ?? null }));
    const goal = m.goal != null ? Number(m.goal) : null;
    return { data, goal };
  }

  const revenue = trendFor('Weekly Revenue');
  const onTime = trendFor('On-Time Delivery %');
  const jobs = trendFor('Jobs Completed');

  const today = new Date().toISOString().slice(0, 10);

  // Quick stats for hero
  const rocksOnTrack = allRocks.filter((r) => r.status === 'on_track').length;
  const rocksOffTrack = allRocks.filter((r) => r.status === 'off_track').length;
  const rocksDone = allRocks.filter((r) => r.status === 'done').length;
  const overdueCount = myTodos.filter((t) => t.dueDate < today && t.status === 'open').length;
  const redMetrics = scorecardRows.filter((m) => m.color === 'red').length;

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="border-b border-border/60 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting()}{displayName ? `, ${displayName}` : ''}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {quarter} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <QuickStat label="Rocks on track" value={rocksOnTrack} color="emerald" />
            <QuickStat label="Rocks off track" value={rocksOffTrack} color={rocksOffTrack > 0 ? 'rose' : 'muted'} />
            <QuickStat label="Overdue to-dos" value={overdueCount} color={overdueCount > 0 ? 'rose' : 'muted'} />
            <QuickStat label="Metrics in red" value={redMetrics} color={redMetrics > 0 ? 'rose' : 'muted'} />
          </div>
        </div>
      </header>

      {/* Primary trio */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Scorecard */}
        <SectionCard
          href="/scorecard"
          icon={TrendingUp}
          title="Scorecard"
          subtitle={`Week of ${formatShortDate(new Date(weekStart + 'T00:00:00'))}`}
        >
          {scorecardRows.length === 0 ? (
            <EmptyRow>No metrics configured.</EmptyRow>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {scorecardRows.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate pr-3 text-foreground/80">{m.name}</span>
                  <span
                    className={`tabular-nums font-medium ${
                      m.color === 'red'
                        ? 'text-rose-600 dark:text-rose-400'
                        : m.color === 'green'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {m.value != null ? `${m.value}${m.unit ? ` ${m.unit}` : ''}` : '—'}
                  </span>
                </div>
              ))}
              {scorecardRows.length > 6 && (
                <div className="pt-2 text-xs text-muted-foreground">
                  +{scorecardRows.length - 6} more
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* My Rocks */}
        <SectionCard
          href="/rocks"
          icon={Target}
          title="My Rocks"
          subtitle={`${myRocks.length} active · ${rocksDone} done`}
        >
          {myRocks.length === 0 ? (
            <EmptyRow>No rocks this quarter.</EmptyRow>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {myRocks.map((r) => (
                <Link key={r.id} href={`/rocks/${r.id}`} className="block py-2 hover:bg-accent/30 -mx-2 px-2 rounded transition-colors">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${
                              r.status === 'off_track' ? 'bg-rose-500' : r.status === 'done' ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${r.progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                          {r.progressPct}%
                        </span>
                      </div>
                      <Badge
                        variant={
                          r.status === 'done'
                            ? 'default'
                            : r.status === 'off_track'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-[10px] whitespace-nowrap"
                      >
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* My To-Dos */}
        <SectionCard
          href="/todos"
          icon={CheckSquare}
          title="My To-Dos"
          subtitle={myTodos.length === 0 ? 'All caught up' : `${myTodos.length} open${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}`}
        >
          {myTodos.length === 0 ? (
            <EmptyRow>All caught up!</EmptyRow>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {myTodos
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 6)
                .map((t) => {
                  const overdue = t.dueDate < today && t.status === 'open';
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className={`min-w-0 flex-1 truncate ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}`}>
                        {t.title}
                      </span>
                      <span
                        className={`shrink-0 text-xs tabular-nums ${
                          overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {formatShortDate(new Date(t.dueDate + 'T00:00:00'))}
                      </span>
                    </div>
                  );
                })}
              {myTodos.length > 6 && (
                <div className="pt-2 text-xs text-muted-foreground">
                  +{myTodos.length - 6} more
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent meetings (full width) */}
      <SectionCard
        href="/meeting/history"
        icon={Calendar}
        title="Recent Meetings"
        subtitle={`${recentMeetings.length} latest`}
      >
        {recentMeetings.length === 0 ? (
          <EmptyRow>No meetings yet.</EmptyRow>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Rating</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMeetings.map((m) => {
                  const isDraft = m.status === 'draft';
                  const isLive = m.status === 'live';
                  const dateSource = isDraft && m.scheduledFor ? m.scheduledFor : m.startedAt;
                  const href = isDraft
                    ? `/meeting/${m.id}/prep`
                    : isLive
                      ? '/meeting/live'
                      : `/meeting/history/${m.id}`;
                  return (
                    <tr key={m.id} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                      <td className="px-3 py-2.5">
                        <Link href={href} className="font-medium hover:underline">
                          {formatShortDate(dateSource)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.type}</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {m.ratingAvg ? (
                          <span className="font-medium">{m.ratingAvg}<span className="text-muted-foreground">/10</span></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {isDraft ? (
                          <Badge variant="outline" className="text-[10px]">Upcoming</Badge>
                        ) : isLive ? (
                          <Badge variant="default" className="text-[10px]">In Progress</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Completed</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Trends */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trends</h2>
          <span className="text-xs text-muted-foreground">Last 13 weeks</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <DashboardTrends
            revenueTrend={revenue.data}
            revenueGoal={revenue.goal}
            onTimeTrend={onTime.data}
            onTimeGoal={onTime.goal}
            jobsTrend={jobs.data}
            jobsGoal={jobs.goal}
            issuesTrend={issuesTrend}
          />

          <Link
            href="/quarterly-review"
            className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Quarterly Review</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Run a guided end-of-quarter review: rocks, people, V/TO, and next-quarter planning.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Start review
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────

function QuickStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'emerald' | 'rose' | 'muted';
}) {
  const classes =
    color === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20'
      : color === 'rose'
        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20'
        : 'bg-muted text-muted-foreground ring-border';
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1 ring-1 ring-inset ${classes}`}>
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-[11px]">{label}</span>
    </div>
  );
}

function SectionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </Link>
      <div>{children}</div>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-2 text-sm text-muted-foreground">{children}</p>
  );
}
