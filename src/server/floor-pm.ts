'use server';

import { db } from '@/db';
import { pmSchedules } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { pmStatus } from '@/lib/floor-pm-utils';
import { recordEvent } from './floor-events';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type PmStatusRow = {
  stationId: string;
  pmId: string;
  label: string;
  level: 'green' | 'yellow' | 'red';
  daysUntilDue: number | null;
  nextDueAt: string | null;
};

/**
 * Returns one entry per PM schedule row for the given station ids.
 *
 * Stations with no PM schedules are simply omitted from the result.
 */
export async function listPmStatuses(
  stationIds: string[],
  now: Date,
): Promise<PmStatusRow[]> {
  if (stationIds.length === 0) return [];

  const rows = (await db
    .select({
      id: pmSchedules.id,
      stationId: pmSchedules.stationId,
      label: pmSchedules.label,
      cadenceDays: pmSchedules.cadenceDays,
      lastDoneAt: pmSchedules.lastDoneAt,
    })
    .from(pmSchedules)
    .where(inArray(pmSchedules.stationId, stationIds))) as Array<{
    id: string;
    stationId: string;
    label: string;
    cadenceDays: number;
    lastDoneAt: string | null;
  }>;

  return rows.map((r) => {
    const status = pmStatus(
      { cadenceDays: r.cadenceDays, lastDoneAt: r.lastDoneAt },
      now,
    );
    return {
      stationId: r.stationId,
      pmId: r.id,
      label: r.label,
      level: status.level,
      daysUntilDue: status.daysUntilDue,
      nextDueAt: status.nextDueAt,
    };
  });
}

function formatYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Mark a PM schedule as done — sets `lastDoneAt` to today's date and emits a
 * `pm_performed` shift event.
 */
export async function markPmDone(input: {
  pmScheduleId: string;
  stationId: string;
  recordedBy: string;
  shiftSessionId: string;
  now?: Date;
}): Promise<void> {
  await requireUser();

  const now = input.now ?? new Date();
  const today = formatYmd(now);

  // Fetch the row first so we can include its label in the event payload.
  const existing = (await db
    .select({ id: pmSchedules.id, label: pmSchedules.label })
    .from(pmSchedules)
    .where(eq(pmSchedules.id, input.pmScheduleId))
    .limit(1)) as Array<{ id: string; label: string }>;

  const label = existing[0]?.label ?? '';

  await db
    .update(pmSchedules)
    .set({ lastDoneAt: today })
    .where(eq(pmSchedules.id, input.pmScheduleId));

  await recordEvent({
    shiftSessionId: input.shiftSessionId,
    stationId: input.stationId,
    kind: 'pm_performed',
    payload: { pmScheduleId: input.pmScheduleId, label },
    recordedBy: input.recordedBy,
    occurredAt: now,
  });

  revalidatePath('/floor');
}
