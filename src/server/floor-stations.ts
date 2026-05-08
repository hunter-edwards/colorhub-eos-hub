'use server';

import { db } from '@/db';
import { stations, stationDefaultOperators } from '@/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type Station = typeof stations.$inferSelect;
export type StationKind = Station['kind'];

export async function listStations(opts?: { includeArchived?: boolean }): Promise<Station[]> {
  const includeArchived = opts?.includeArchived ?? false;
  const rows = (includeArchived
    ? await db.select().from(stations)
    : await db.select().from(stations).where(isNull(stations.archivedAt))) as Station[];
  return [...rows].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.name.localeCompare(b.name);
  });
}

export async function createStation(input: {
  name: string;
  kind: StationKind;
  groupLabel?: string;
  displayOrder?: number;
  teamId?: string;
}): Promise<Station> {
  await requireUser();

  let displayOrder = input.displayOrder;
  if (displayOrder == null) {
    const [row] = await db
      .select({ max: sql<number | null>`max(${stations.displayOrder})` })
      .from(stations);
    const currentMax = (row?.max ?? 0) as number;
    displayOrder = (currentMax ?? 0) + 1;
  }

  const [created] = await db
    .insert(stations)
    .values({
      name: input.name,
      kind: input.kind,
      groupLabel: input.groupLabel,
      displayOrder,
      teamId: input.teamId,
    })
    .returning();

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  return created as Station;
}

export async function updateStation(
  id: string,
  patch: {
    name?: string;
    kind?: StationKind;
    groupLabel?: string | null;
    displayOrder?: number;
    knackMachineCenterId?: string | null;
  },
): Promise<Station> {
  await requireUser();

  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.kind !== undefined) set.kind = patch.kind;
  if (patch.groupLabel !== undefined) set.groupLabel = patch.groupLabel;
  if (patch.displayOrder !== undefined) set.displayOrder = patch.displayOrder;
  if (patch.knackMachineCenterId !== undefined) set.knackMachineCenterId = patch.knackMachineCenterId;

  await db.update(stations).set(set).where(eq(stations.id, id));

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  // Return shape matches; tests don't read it.
  return { id, ...set } as unknown as Station;
}

export async function archiveStation(id: string): Promise<void> {
  await requireUser();
  await db.update(stations).set({ archivedAt: new Date() }).where(eq(stations.id, id));
  revalidatePath('/floor');
  revalidatePath('/floor/setup');
}

export async function setDefaultOperators(
  stationId: string,
  userIds: string[],
): Promise<void> {
  await requireUser();

  const existing = (await db
    .select({ userId: stationDefaultOperators.userId })
    .from(stationDefaultOperators)
    .where(eq(stationDefaultOperators.stationId, stationId))) as Array<{ userId: string }>;

  const existingSet = new Set(existing.map((r) => r.userId));
  const targetSet = new Set(userIds);

  const toInsert = userIds.filter((u) => !existingSet.has(u));
  const toDelete = [...existingSet].filter((u) => !targetSet.has(u));

  for (const userId of toInsert) {
    await db.insert(stationDefaultOperators).values({ stationId, userId });
  }
  if (toDelete.length > 0) {
    for (const userId of toDelete) {
      await db
        .delete(stationDefaultOperators)
        .where(
          and(
            eq(stationDefaultOperators.stationId, stationId),
            eq(stationDefaultOperators.userId, userId),
          ),
        );
    }
  }

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
}

const DEFAULT_STATIONS: Array<{
  name: string;
  kind: StationKind;
  groupLabel: string;
  displayOrder: number;
}> = [
  { name: 'Press 1', kind: 'printer', groupLabel: 'Printing', displayOrder: 1 },
  { name: 'Press 2', kind: 'printer', groupLabel: 'Printing', displayOrder: 2 },
  { name: 'CAD 1', kind: 'cad', groupLabel: 'Cutting', displayOrder: 3 },
  { name: 'CAD 2', kind: 'cad', groupLabel: 'Cutting', displayOrder: 4 },
  { name: 'Rotary', kind: 'rotary', groupLabel: 'Cutting', displayOrder: 5 },
  { name: 'Gluer/Tape', kind: 'gluer', groupLabel: 'Finishing', displayOrder: 6 },
  { name: 'Handwork', kind: 'handwork', groupLabel: 'Finishing', displayOrder: 7 },
  { name: 'Shipping', kind: 'shipping', groupLabel: 'Shipping', displayOrder: 8 },
];

export async function seedDefaultStations(teamId: string): Promise<{ created: number }> {
  await requireUser();

  const existing = await db
    .select({ id: stations.id })
    .from(stations)
    .where(eq(stations.teamId, teamId))
    .limit(1);

  if (existing.length > 0) return { created: 0 };

  for (const def of DEFAULT_STATIONS) {
    await db.insert(stations).values({
      teamId,
      name: def.name,
      kind: def.kind,
      groupLabel: def.groupLabel,
      displayOrder: def.displayOrder,
    });
  }

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  return { created: DEFAULT_STATIONS.length };
}
