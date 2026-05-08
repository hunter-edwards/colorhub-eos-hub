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
