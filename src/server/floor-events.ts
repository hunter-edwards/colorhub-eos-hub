'use server';

import { db } from '@/db';
import { shiftEvents, shiftEventKind } from '@/db/schema';
import { and, desc, eq, gt } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type ShiftEvent = typeof shiftEvents.$inferSelect;
export type ShiftEventKind = (typeof shiftEventKind.enumValues)[number];

/**
 * Insert a shift event row and return it.
 *
 * `occurredAt` defaults to now() when omitted.
 */
export async function recordEvent(input: {
  shiftSessionId: string;
  stationId: string | null;
  kind: ShiftEventKind;
  payload: Record<string, unknown>;
  recordedBy: string;
  relatedKnackJobId?: string;
  occurredAt?: Date;
}): Promise<ShiftEvent> {
  await requireUser();

  const occurredAt = input.occurredAt ?? new Date();

  const [created] = (await db
    .insert(shiftEvents)
    .values({
      shiftSessionId: input.shiftSessionId,
      stationId: input.stationId,
      kind: input.kind,
      payload: input.payload,
      recordedBy: input.recordedBy,
      relatedKnackJobId: input.relatedKnackJobId,
      occurredAt,
    })
    .returning()) as ShiftEvent[];

  revalidatePath('/floor');
  return created;
}

/**
 * List events for a shift session, newest first by `occurredAt`.
 *
 * - `limit` caps the number of returned rows.
 * - `sinceOccurredAt` returns only rows strictly newer than the given timestamp
 *   (useful for incremental polling).
 */
export async function listEventsForShift(
  shiftSessionId: string,
  opts?: { limit?: number; sinceOccurredAt?: Date },
): Promise<ShiftEvent[]> {
  const where = opts?.sinceOccurredAt
    ? and(
        eq(shiftEvents.shiftSessionId, shiftSessionId),
        gt(shiftEvents.occurredAt, opts.sinceOccurredAt),
      )
    : eq(shiftEvents.shiftSessionId, shiftSessionId);

  const base = db
    .select()
    .from(shiftEvents)
    .where(where)
    .orderBy(desc(shiftEvents.occurredAt));

  const rows = (opts?.limit != null
    ? await base.limit(opts.limit)
    : await base) as ShiftEvent[];

  return rows;
}
