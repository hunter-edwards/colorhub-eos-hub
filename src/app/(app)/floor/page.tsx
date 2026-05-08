// Phase 1 manual TV checklist — verify on a real TV before declaring complete:
// - Tile text legible from ~10 ft
// - 4×2 grid fills cleanly without overflow on 1920×1080
// - Status colors readable in shop lighting
// - Modal scroll works at TV resolution
// - Events feed update animation visible but not distracting
// - People bench drag-to-assign works on the input device used in front of the TV
import Link from 'next/link';
import { resolveShift } from '@/lib/floor-shift-utils';
import { getCurrentTeamId } from '@/server/team-helpers';
import { listStations, listDefaultOperators } from '@/server/floor-stations';
import { getOrOpenCurrentShift, listAssignments } from '@/server/floor-shifts';
import { listEventsForShift } from '@/server/floor-events';
import { listPmStatuses } from '@/server/floor-pm';
import { listTasks } from '@/server/floor-tasks';
import { getFloorView } from '@/server/floor-knack';
import { listTeamMembers } from '@/server/rocks';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { shiftSessions } from '@/db/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { FloorBoard } from './floor-board';

export default async function FloorPage() {
  const now = new Date();

  // auth — already enforced by (app)/layout.tsx but we need the user id
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const teamId = await getCurrentTeamId();
  const stations = await listStations();
  const stationIds = stations.map((s) => s.id);

  if (stations.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-6">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold mb-2">No stations configured</h2>
          <p className="text-muted-foreground mb-6">
            The floor dashboard needs at least one station. Visit Setup to add
            stations or restore the default 8.
          </p>
          <Button render={<Link href="/floor/setup" />}>Open Floor Setup</Button>
        </div>
      </div>
    );
  }

  const session = await getOrOpenCurrentShift(now, { teamId, openedBy: user.id });
  const shift = resolveShift(now);

  const [
    assignments,
    events,
    pmStatuses,
    tasks,
    floorView,
    members,
    defaultOperators,
    prevSession,
  ] = await Promise.all([
    session ? listAssignments(session.id) : Promise.resolve([]),
    session ? listEventsForShift(session.id, { limit: 200 }) : Promise.resolve([]),
    listPmStatuses(stationIds, now),
    listTasks({ statuses: ['open', 'in_progress'] }),
    getFloorView(stationIds),
    listTeamMembers(),
    listDefaultOperators(stationIds),
    // previous shift session (for handoff banner)
    session
      ? db
          .select()
          .from(shiftSessions)
          .where(
            and(
              eq(shiftSessions.teamId, teamId),
              lt(shiftSessions.openedAt, session.openedAt),
            ),
          )
          .orderBy(desc(shiftSessions.openedAt))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <FloorBoard
      initial={{
        now: now.toISOString(),
        shift,
        session,
        stations,
        assignments,
        events,
        pmStatuses,
        tasks,
        floorView,
        members,
        defaultOperatorsByStation: Object.fromEntries(defaultOperators.entries()),
        previousHandoffNotes: prevSession?.handoffNotes ?? null,
        previousSessionId: prevSession?.id ?? null,
      }}
    />
  );
}
