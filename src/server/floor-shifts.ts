'use server';

import { db } from '@/db';
import {
  shiftSessions,
  shiftAssignments,
  stationDefaultOperators,
  stations,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resolveShift } from '@/lib/floor-shift-utils';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type ShiftSession = typeof shiftSessions.$inferSelect;

/**
 * Look up (or create) the shift session for the current `now`.
 *
 * - If `resolveShift(now)` returns null we are outside any shift window — return null.
 * - Otherwise upsert a `shiftSessions` row keyed by (teamId, date, shiftNumber).
 * - On first creation, seed `shiftAssignments` from `stationDefaultOperators`
 *   for every station in the team.
 */
export async function getOrOpenCurrentShift(
  now: Date,
  opts: { teamId: string; openedBy: string },
): Promise<ShiftSession | null> {
  await requireUser();

  const resolved = resolveShift(now);
  if (!resolved) return null;

  const { date, shiftNumber } = resolved;

  // Look up existing session first.
  const existing = (await db
    .select()
    .from(shiftSessions)
    .where(
      and(
        eq(shiftSessions.teamId, opts.teamId),
        eq(shiftSessions.date, date),
        eq(shiftSessions.shiftNumber, shiftNumber),
      ),
    )
    .limit(1)) as ShiftSession[];

  if (existing.length > 0) {
    return existing[0];
  }

  // Create a new session.
  const [created] = (await db
    .insert(shiftSessions)
    .values({
      teamId: opts.teamId,
      date,
      shiftNumber,
      openedBy: opts.openedBy,
    })
    .returning()) as ShiftSession[];

  // Seed assignments from default operators across all team stations.
  const defaults = (await db
    .select({
      stationId: stationDefaultOperators.stationId,
      userId: stationDefaultOperators.userId,
    })
    .from(stationDefaultOperators)
    .innerJoin(stations, eq(stationDefaultOperators.stationId, stations.id))
    .where(eq(stations.teamId, opts.teamId))) as Array<{
    stationId: string;
    userId: string;
  }>;

  for (const d of defaults) {
    await db.insert(shiftAssignments).values({
      shiftSessionId: created.id,
      stationId: d.stationId,
      userId: d.userId,
    });
  }

  revalidatePath('/floor');
  return created;
}

export async function listAssignments(
  shiftSessionId: string,
): Promise<Array<{ stationId: string; userId: string }>> {
  const rows = (await db
    .select({
      stationId: shiftAssignments.stationId,
      userId: shiftAssignments.userId,
    })
    .from(shiftAssignments)
    .where(eq(shiftAssignments.shiftSessionId, shiftSessionId))) as Array<{
    stationId: string;
    userId: string;
  }>;
  return rows;
}

export async function setAssignment(
  shiftSessionId: string,
  stationId: string,
  userId: string,
): Promise<void> {
  await requireUser();
  // Idempotent: rely on UNIQUE(shiftSessionId, stationId, userId).
  const insertChain = db
    .insert(shiftAssignments)
    .values({ shiftSessionId, stationId, userId });
  // Use onConflictDoNothing if available so duplicate calls are no-ops.
  const maybeOnConflict = (insertChain as unknown as {
    onConflictDoNothing?: () => Promise<unknown>;
  }).onConflictDoNothing;
  if (typeof maybeOnConflict === 'function') {
    await maybeOnConflict.call(insertChain);
  } else {
    await insertChain;
  }
  revalidatePath('/floor');
}

export async function removeAssignment(
  shiftSessionId: string,
  stationId: string,
  userId: string,
): Promise<void> {
  await requireUser();
  await db
    .delete(shiftAssignments)
    .where(
      and(
        eq(shiftAssignments.shiftSessionId, shiftSessionId),
        eq(shiftAssignments.stationId, stationId),
        eq(shiftAssignments.userId, userId),
      ),
    );
  revalidatePath('/floor');
}

export async function setHandoffNotes(
  shiftSessionId: string,
  notes: string,
): Promise<void> {
  await requireUser();
  await db
    .update(shiftSessions)
    .set({ handoffNotes: notes })
    .where(eq(shiftSessions.id, shiftSessionId));
  revalidatePath('/floor');
}

// Silence unused-import lint when inArray is not used in production but kept for future filtering.
void inArray;
