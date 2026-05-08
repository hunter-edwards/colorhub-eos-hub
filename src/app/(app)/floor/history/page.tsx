import Link from 'next/link';
import { db } from '@/db';
import { shiftSessions, shiftEvents, users } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { getCurrentTeamId } from '@/server/team-helpers';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

const PAGE_SIZE = 20;

type SearchParams = { page?: string };

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function fmtDuration(openedAt: Date, closedAt: Date | null): string {
  if (!closedAt) return 'still open';
  const ms = closedAt.getTime() - openedAt.getTime();
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export default async function FloorHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const offset = (page - 1) * PAGE_SIZE;

  const teamId = await getCurrentTeamId();

  const sessions = (await db
    .select()
    .from(shiftSessions)
    .where(eq(shiftSessions.teamId, teamId))
    .orderBy(desc(shiftSessions.openedAt))
    .limit(PAGE_SIZE + 1) // fetch one extra to detect next page
    .offset(offset)) as Array<typeof shiftSessions.$inferSelect>;

  const hasNext = sessions.length > PAGE_SIZE;
  const pageRows = hasNext ? sessions.slice(0, PAGE_SIZE) : sessions;

  // Fetch all events for these sessions in one query, aggregate in JS.
  const sessionIds = pageRows.map((s) => s.id);
  const events =
    sessionIds.length > 0
      ? ((await db
          .select({
            shiftSessionId: shiftEvents.shiftSessionId,
            kind: shiftEvents.kind,
            payload: shiftEvents.payload,
          })
          .from(shiftEvents)
          .where(inArray(shiftEvents.shiftSessionId, sessionIds))) as Array<{
          shiftSessionId: string;
          kind: string;
          payload: Record<string, unknown> | null;
        }>)
      : [];

  type Agg = { jobsCompleted: number; sheetsTotal: number; events: number };
  const aggBySession = new Map<string, Agg>();
  for (const id of sessionIds) {
    aggBySession.set(id, { jobsCompleted: 0, sheetsTotal: 0, events: 0 });
  }
  for (const e of events) {
    const a = aggBySession.get(e.shiftSessionId);
    if (!a) continue;
    a.events += 1;
    if (e.kind === 'job_completed') {
      a.jobsCompleted += 1;
      const sheets = (e.payload as Record<string, unknown> | null)?.sheets;
      if (typeof sheets === 'number' && Number.isFinite(sheets)) {
        a.sheetsTotal += sheets;
      }
    }
  }

  // Look up opener names.
  const openerIds = [
    ...new Set(
      pageRows
        .map((s) => s.openedBy)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const openerRows =
    openerIds.length > 0
      ? ((await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, openerIds))) as Array<{
          id: string;
          name: string | null;
          email: string;
        }>)
      : [];
  const openerById = new Map(openerRows.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Past Shifts</h1>
        <nav className="flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={`/floor/history?page=${page - 1}`}
              className="rounded border px-3 py-1 hover:bg-muted"
            >
              ← Newer
            </Link>
          ) : (
            <span className="rounded border px-3 py-1 opacity-50">← Newer</span>
          )}
          <span className="text-muted-foreground">Page {page}</span>
          {hasNext ? (
            <Link
              href={`/floor/history?page=${page + 1}`}
              className="rounded border px-3 py-1 hover:bg-muted"
            >
              Older →
            </Link>
          ) : (
            <span className="rounded border px-3 py-1 opacity-50">Older →</span>
          )}
        </nav>
      </header>

      {pageRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No shift sessions yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {pageRows.map((s) => {
            const openedAt = new Date(s.openedAt as unknown as string);
            const closedAt = s.closedAt
              ? new Date(s.closedAt as unknown as string)
              : null;
            const agg = aggBySession.get(s.id) ?? {
              jobsCompleted: 0,
              sheetsTotal: 0,
              events: 0,
            };
            const opener = s.openedBy ? openerById.get(s.openedBy) : null;
            const openerName =
              opener?.name ?? opener?.email ?? '—';
            const shiftLabel = s.shiftNumber === 1 ? '1st Shift' : '2nd Shift';

            return (
              <li key={s.id}>
                <Link
                  href={`/floor/handoff?session=${s.id}`}
                  className="block"
                >
                  <Card size="sm" className="transition hover:bg-muted/30">
                    <CardContent>
                      <div className="grid grid-cols-2 items-baseline gap-2 sm:grid-cols-6">
                        <div className="font-medium">{s.date}</div>
                        <div className="text-sm">{shiftLabel}</div>
                        <div className="text-sm tabular-nums">
                          {fmtDuration(openedAt, closedAt)}
                        </div>
                        <div className="text-sm tabular-nums">
                          {agg.jobsCompleted.toLocaleString('en-US')} jobs
                        </div>
                        <div className="text-sm tabular-nums">
                          {agg.sheetsTotal.toLocaleString('en-US')} sheets
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {openerName}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
