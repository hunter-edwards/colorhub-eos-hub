import Link from 'next/link';
import { getRecap, getMostRecentSession } from '@/server/floor-recap';
import { listPmStatuses } from '@/server/floor-pm';
import { listTasks } from '@/server/floor-tasks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { summarizeEvent, type FloorEvent } from '@/lib/floor-events-utils';
import { HandoffTimeline } from './timeline';
import { HandoffNotesEditor } from './notes-editor';

type SearchParams = {
  date?: string;
  shift?: string;
  session?: string;
};

function fmtNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default async function FloorHandoffPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  let opts: Parameters<typeof getRecap>[0] | null = null;
  if (sp.session) {
    opts = { sessionId: sp.session };
  } else if (sp.date && (sp.shift === '1' || sp.shift === '2')) {
    opts = {
      date: sp.date,
      shiftNumber: sp.shift === '1' ? 1 : 2,
    };
  } else {
    const recent = await getMostRecentSession(new Date());
    if (recent) opts = { sessionId: recent.id };
  }

  const data = opts ? await getRecap(opts) : null;

  if (!data) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Shift Handoff Recap
          </h1>
          <p className="text-muted-foreground">
            No shift session found.
          </p>
        </header>
        <HandoffPicker
          date={sp.date ?? ''}
          shift={sp.shift === '2' ? '2' : '1'}
        />
      </div>
    );
  }

  const { session, recap, events, stations } = data;
  const shiftLabel = session.shiftNumber === 1 ? '1st Shift' : '2nd Shift';

  const stationIds = stations.map((s) => s.id);
  const [pmStatuses, openTasks] = await Promise.all([
    listPmStatuses(stationIds, new Date()),
    listTasks({ statuses: ['open', 'in_progress'] }),
  ]);
  const pmsStillDue = pmStatuses.filter((p) => p.level !== 'green');
  const stationNameById = new Map(stations.map((s) => [s.id, s.name]));
  const issueEvents = events.filter((e) => e.kind === 'issue_noted');

  const sessionStartedAt = new Date(
    session.openedAt as unknown as string,
  ).getTime();
  const fourHoursMs = 4 * 60 * 60 * 1000;
  // eslint-disable-next-line react-hooks/purity -- this is an async server component, not a React render path
  const notesReadOnly = Date.now() - sessionStartedAt > fourHoursMs;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Shift Handoff Recap
          </h1>
          <p className="text-muted-foreground">
            {shiftLabel} — {session.date}
          </p>
        </div>
        <HandoffPicker date={session.date} shift={String(session.shiftNumber)} />
      </header>

      <section
        aria-label="Hero metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <HeroStat label="Sheets completed" value={fmtNumber(recap.hero.sheetsCompleted)} />
        <HeroStat label="Sheets wasted" value={fmtNumber(recap.hero.sheetsWasted)} />
        <HeroStat label="Jobs completed" value={fmtNumber(recap.hero.jobsCompleted)} />
        <HeroStat label="PMs performed" value={fmtNumber(recap.hero.pmsPerformed)} />
        <HeroStat label="Issues noted" value={fmtNumber(recap.hero.issuesNoted)} />
        <HeroStat label="Tasks completed" value={fmtNumber(recap.hero.tasksCompleted)} />
      </section>

      <section aria-label="Per-station summary" className="space-y-2">
        <h2 className="text-lg font-semibold">By station</h2>
        {recap.perStation.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No station activity for this shift.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recap.perStation.map((s) => (
              <Card key={s.stationId} size="sm">
                <CardHeader>
                  <CardTitle>{s.stationName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Jobs</span>
                    <span className="text-right">{fmtNumber(s.jobsCompleted)}</span>
                    <span className="text-muted-foreground">Sheets</span>
                    <span className="text-right">{fmtNumber(s.sheetsCompleted)}</span>
                    <span className="text-muted-foreground">Waste</span>
                    <span className="text-right">{fmtNumber(s.sheetsWasted)}</span>
                    <span className="text-muted-foreground">Downtime</span>
                    <span className="text-right">{fmtNumber(s.downtimeMinutes)}m</span>
                  </div>
                  {Object.keys(s.pauseReasons).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(s.pauseReasons).map(([reason, count]) => (
                        <span
                          key={reason}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {reason} × {count}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Timeline" className="space-y-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <HandoffTimeline events={events} stations={stations} />
      </section>

      <section aria-label="Outstanding" className="space-y-3">
        <h2 className="text-lg font-semibold">Outstanding</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Unfinished jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {recap.outstanding.unfinishedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {recap.outstanding.unfinishedJobs.map((j, idx) => (
                    <li key={`${j.stationId}-${j.jobNumber ?? idx}`}>
                      <span className="font-medium">{j.jobNumber ?? '—'}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        @ {j.stationName}
                        {j.sheets != null
                          ? ` · ${j.sheets.toLocaleString('en-US')} sheets`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Open issues</CardTitle>
            </CardHeader>
            <CardContent>
              {issueEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {issueEvents.map((e) => (
                    <li key={e.id}>
                      <span className="text-muted-foreground">
                        {e.stationId
                          ? stationNameById.get(e.stationId) ?? '—'
                          : '—'}
                        {' · '}
                      </span>
                      {summarizeEvent(e as unknown as FloorEvent)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>PMs still due</CardTitle>
            </CardHeader>
            <CardContent>
              {pmsStillDue.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {pmsStillDue.map((p) => (
                    <li key={p.pmId}>
                      <span
                        className={
                          p.level === 'red'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }
                      >
                        ●
                      </span>{' '}
                      {stationNameById.get(p.stationId) ?? '—'}
                      <span className="text-muted-foreground">
                        {' '}— {p.label}
                        {p.daysUntilDue != null
                          ? ` (${p.daysUntilDue}d)`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Tasks still open</CardTitle>
            </CardHeader>
            <CardContent>
              {openTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">None.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {openTasks.map((t) => (
                    <li key={t.id}>
                      <span className="font-medium">{t.title}</span>
                      <span className="text-muted-foreground">
                        {' '}— {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-label="Notes" className="space-y-2">
        <h2 className="text-lg font-semibold">Handoff notes</h2>
        <p className="text-sm text-muted-foreground">
          What does the next shift need to know?
        </p>
        <HandoffNotesEditor
          shiftSessionId={session.id}
          initialNotes={session.handoffNotes ?? ''}
          readOnly={notesReadOnly}
        />
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function HandoffPicker({ date, shift }: { date: string; shift: string }) {
  return (
    <form
      action="/floor/handoff"
      method="GET"
      className="flex flex-wrap items-center gap-2"
    >
      <label className="text-sm">
        Date
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="ml-2 rounded border bg-background px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm">
        <input
          type="radio"
          name="shift"
          value="1"
          defaultChecked={shift !== '2'}
          className="mr-1"
        />
        1st
      </label>
      <label className="text-sm">
        <input
          type="radio"
          name="shift"
          value="2"
          defaultChecked={shift === '2'}
          className="mr-1"
        />
        2nd
      </label>
      <button
        type="submit"
        className="rounded border bg-background px-3 py-1 text-sm hover:bg-muted"
      >
        Go
      </button>
      <Link
        href="/floor/history"
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        Past shifts
      </Link>
    </form>
  );
}
