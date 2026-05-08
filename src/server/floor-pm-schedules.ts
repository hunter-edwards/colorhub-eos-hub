'use server';

import { db } from '@/db';
import { pmSchedules } from '@/db/schema';
import { asc, eq, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type PmSchedule = typeof pmSchedules.$inferSelect;

export async function listForStation(stationId: string): Promise<PmSchedule[]> {
  const rows = (await db
    .select()
    .from(pmSchedules)
    .where(eq(pmSchedules.stationId, stationId))
    .orderBy(asc(pmSchedules.label))) as PmSchedule[];
  return rows;
}

export async function listForStations(
  stationIds: string[],
): Promise<Map<string, PmSchedule[]>> {
  const out = new Map<string, PmSchedule[]>();
  if (stationIds.length === 0) return out;

  const rows = (await db
    .select()
    .from(pmSchedules)
    .where(inArray(pmSchedules.stationId, stationIds))
    .orderBy(asc(pmSchedules.label))) as PmSchedule[];

  for (const id of stationIds) out.set(id, []);
  for (const r of rows) {
    const list = out.get(r.stationId);
    if (list) list.push(r);
  }
  return out;
}

export async function createSchedule(input: {
  stationId: string;
  label: string;
  cadenceDays: number;
  lastDoneAt?: string | null;
}): Promise<PmSchedule> {
  await requireUser();

  const [created] = (await db
    .insert(pmSchedules)
    .values({
      stationId: input.stationId,
      label: input.label,
      cadenceDays: input.cadenceDays,
      lastDoneAt: input.lastDoneAt ?? null,
    })
    .returning()) as PmSchedule[];

  revalidatePath('/floor/setup');
  revalidatePath('/floor');
  return created;
}

export async function updateSchedule(
  id: string,
  patch: {
    label?: string;
    cadenceDays?: number;
    lastDoneAt?: string | null;
  },
): Promise<PmSchedule> {
  await requireUser();

  const set: Record<string, unknown> = {};
  if (patch.label !== undefined) set.label = patch.label;
  if (patch.cadenceDays !== undefined) set.cadenceDays = patch.cadenceDays;
  if (patch.lastDoneAt !== undefined) set.lastDoneAt = patch.lastDoneAt;

  const [updated] = (await db
    .update(pmSchedules)
    .set(set)
    .where(eq(pmSchedules.id, id))
    .returning()) as PmSchedule[];

  revalidatePath('/floor/setup');
  revalidatePath('/floor');
  return updated;
}

export async function deleteSchedule(id: string): Promise<void> {
  await requireUser();
  await db.delete(pmSchedules).where(eq(pmSchedules.id, id));
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}
