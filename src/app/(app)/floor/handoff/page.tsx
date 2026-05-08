import Link from 'next/link';
import { getRecap, getMostRecentSession } from '@/server/floor-recap';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

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

  const { session, recap } = data;
  const shiftLabel = session.shiftNumber === 1 ? '1st Shift' : '2nd Shift';

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
