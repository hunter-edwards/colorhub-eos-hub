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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const quarter = currentQuarter();
  const [weekStart] = getWeekStarts(1);

  const [allRocks, myTodos, metrics, entries, allMeetings] = await Promise.all([
    listRocks(quarter),
    listMyTodos(),
    listMetrics(),
    listEntries(weekStart, 1),
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
    </div>
  );
}
