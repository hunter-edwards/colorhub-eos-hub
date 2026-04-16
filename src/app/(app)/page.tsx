import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listRocks } from '@/server/rocks';
import { listMyTodos } from '@/server/todos';
import { listMetrics, listEntries } from '@/server/scorecard';
import { listMeetings } from '@/server/meetings';
import { currentQuarter } from '@/lib/quarters';
import { getWeekStarts, evaluateEntry } from '@/lib/scorecard-utils';
import Link from 'next/link';
import { ScorecardChart } from '@/components/charts/scorecard-chart';
import { MeetingChart } from '@/components/charts/meeting-chart';
import { RockChart } from '@/components/charts/rock-chart';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const quarter = currentQuarter();
  const [weekStart] = getWeekStarts(1);

  const [allRocks, myTodos, metrics, entries, trendEntries, allMeetings] = await Promise.all([
    listRocks(quarter),
    listMyTodos(),
    listMetrics(),
    listEntries(weekStart, 1),
    listEntries(weekStart, 13),
    listMeetings(),
  ]);

  const myRocks = allRocks.filter((r) => r.ownerId === user?.id);
  const recentMeetings = allMeetings.slice(0, 5);

  const entryMap = new Map(entries.map((e) => [e.metricId, e.value]));
  const scorecardRows = metrics.map((m) => {
    const val = entryMap.get(m.id);
    const color = val != null ? evaluateEntry(m, Number(val)) : null;
    return { ...m, value: val, color };
  });

  // Chart data: scorecard trend entries
  const metricNameMap = new Map(metrics.map((m) => [m.id, m.name]));
  const scorecardChartData = trendEntries.map((e) => ({
    metricId: e.metricId,
    metricName: metricNameMap.get(e.metricId) ?? 'Unknown',
    weekStart: e.weekStart,
    value: e.value != null ? Number(e.value) : null,
  }));

  // Chart data: meeting ratings (last 10 completed meetings with ratings)
  const meetingChartData = allMeetings
    .filter((m) => m.endedAt && m.ratingAvg != null)
    .slice(0, 10)
    .map((m) => ({
      date: m.startedAt.toISOString().slice(0, 10),
      rating: Number(m.ratingAvg),
    }));

  // Chart data: rock status distribution
  const rockStatusCounts = (['on_track', 'off_track', 'done'] as const).map((status) => ({
    status,
    count: allRocks.filter((r) => r.status === status).length,
  }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {quarter} — Welcome{user?.email ? `, ${user.email}` : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Scorecard — This Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href="/scorecard" className="hover:underline">
                Scorecard — {weekStart}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scorecardRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No metrics configured.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {scorecardRows.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-2">{m.name}</span>
                    <span
                      className={`font-mono ${
                        m.color === 'red'
                          ? 'text-red-600 font-semibold'
                          : m.color === 'green'
                            ? 'text-emerald-600'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {m.value != null ? `${m.value}${m.unit ? ` ${m.unit}` : ''}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Open Rocks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href="/rocks" className="hover:underline">
                My Rocks
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myRocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rocks this quarter.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {myRocks.map((r) => (
                  <Link key={r.id} href={`/rocks/${r.id}`} className="block">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2">{r.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {r.progressPct}%
                        </span>
                        <Badge
                          variant={
                            r.status === 'done'
                              ? 'default'
                              : r.status === 'off_track'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {r.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Open To-Dos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href="/todos" className="hover:underline">
                My To-Dos
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up!</p>
            ) : (
              <div className="flex flex-col gap-1">
                {myTodos
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 8)
                  .map((t) => {
                    const overdue = t.dueDate < today && t.status === 'open';
                    return (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className={`truncate mr-2 ${overdue ? 'text-red-600' : ''}`}>
                          {t.title}
                        </span>
                        <span
                          className={`text-xs shrink-0 ${
                            overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {t.dueDate}
                        </span>
                      </div>
                    );
                  })}
                {myTodos.length > 8 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    +{myTodos.length - 8} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <Link href="/meeting/history" className="hover:underline">
              Recent Meetings
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-1 pr-4 font-medium">Date</th>
                    <th className="py-1 pr-4 font-medium">Type</th>
                    <th className="py-1 pr-4 font-medium">Rating</th>
                    <th className="py-1 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMeetings.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-4">
                        <Link
                          href={`/meeting/history/${m.id}`}
                          className="hover:underline"
                        >
                          {m.startedAt.toISOString().slice(0, 10)}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-4">{m.type}</td>
                      <td className="py-1.5 pr-4">
                        {m.ratingAvg ? `${m.ratingAvg}/10` : '—'}
                      </td>
                      <td className="py-1.5">
                        {m.endedAt ? (
                          <Badge variant="secondary" className="text-xs">Completed</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">In Progress</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quarterly Review */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <Link href="/quarterly-review" className="hover:underline">
              Quarterly Review
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run a guided end-of-quarter review: rocks, people, V/TO, and next quarter planning.
          </p>
        </CardContent>
      </Card>

      {/* Trends */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Trends</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scorecard — 13 Week Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ScorecardChart entries={scorecardChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Meeting Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <MeetingChart meetings={meetingChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rock Status — {quarter}</CardTitle>
            </CardHeader>
            <CardContent>
              <RockChart rocks={rockStatusCounts} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
