'use server';

import { db } from '@/db';
import { shiftSessions } from '@/db/schema';
import { and, desc, eq, lte } from 'drizzle-orm';
import { listEventsForShift } from './floor-events';
import { listStations } from './floor-stations';
import { computeRecap } from '@/lib/floor-recap-utils';
import { getCurrentTeamId } from './team-helpers';
import type { FloorEvent } from '@/lib/floor-events-utils';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type ShiftSession = typeof shiftSessions.$inferSelect;

export async function getRecap(opts: {
  date?: string;
  shiftNumber?: 1 | 2;
  sessionId?: string;
}) {
  await requireUser();
  let session: ShiftSession | undefined;
  if (opts.sessionId) {
    const rows = (await db
      .select()
      .from(shiftSessions)
      .where(eq(shiftSessions.id, opts.sessionId))
      .limit(1)) as ShiftSession[];
    session = rows[0];
  } else if (opts.date && opts.shiftNumber) {
    const teamId = await getCurrentTeamId();
    const rows = (await db
      .select()
      .from(shiftSessions)
      .where(
        and(
          eq(shiftSessions.teamId, teamId),
          eq(shiftSessions.date, opts.date),
          eq(shiftSessions.shiftNumber, opts.shiftNumber),
        ),
      )
      .limit(1)) as ShiftSession[];
    session = rows[0];
  }
  if (!session) return null;

  const [events, stations] = await Promise.all([
    listEventsForShift(session.id, { limit: 5000 }),
    listStations({ includeArchived: true }),
  ]);

  const recap = computeRecap(
    events as unknown as FloorEvent[],
    stations.map((s) => ({ id: s.id, name: s.name })),
  );

  return { session, recap, events, stations };
}

/**
 * Find the most recent shift session for the team that opened on or before
 * `now`. Used as the default for the handoff page.
 */
export async function getMostRecentSession(
  now: Date,
): Promise<ShiftSession | null> {
  await requireUser();
  const teamId = await getCurrentTeamId();
  const rows = (await db
    .select()
    .from(shiftSessions)
    .where(
      and(eq(shiftSessions.teamId, teamId), lte(shiftSessions.openedAt, now)),
    )
    .orderBy(desc(shiftSessions.openedAt))
    .limit(1)) as ShiftSession[];
  return rows[0] ?? null;
}
