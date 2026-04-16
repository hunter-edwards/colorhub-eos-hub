'use server';

import { db } from '@/db';
import { seats, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function listSeats() {
  const user = await requireUser();
  const [dbUser] = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(eq(users.id, user.id));
  if (!dbUser?.teamId) return [];

  return db
    .select({
      id: seats.id,
      teamId: seats.teamId,
      title: seats.title,
      roles: seats.roles,
      parentSeatId: seats.parentSeatId,
      personId: seats.personId,
      gwcGetsIt: seats.gwcGetsIt,
      gwcWantsIt: seats.gwcWantsIt,
      gwcCapacity: seats.gwcCapacity,
      orderIdx: seats.orderIdx,
      createdAt: seats.createdAt,
      updatedAt: seats.updatedAt,
      personName: users.name,
      personAvatarUrl: users.avatarUrl,
      personProfileColor: users.profileColor,
    })
    .from(seats)
    .leftJoin(users, eq(seats.personId, users.id))
    .where(eq(seats.teamId, dbUser.teamId));
}

export async function createSeat(input: {
  title: string;
  parentSeatId?: string;
}) {
  const user = await requireUser();
  const [dbUser] = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(eq(users.id, user.id));
  if (!dbUser?.teamId) throw new Error('No team');

  const [created] = await db
    .insert(seats)
    .values({
      title: input.title,
      teamId: dbUser.teamId,
      parentSeatId: input.parentSeatId ?? null,
    })
    .returning();
  revalidatePath('/accountability');
  return created;
}

export async function updateSeat(input: {
  id: string;
  title?: string;
  roles?: string[];
  parentSeatId?: string | null;
  personId?: string | null;
  gwcGetsIt?: boolean;
  gwcWantsIt?: boolean;
  gwcCapacity?: boolean;
}) {
  await requireUser();
  const { id, ...fields } = input;

  // Build update object with only provided fields
  const update: Record<string, unknown> = {};
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.roles !== undefined) update.roles = fields.roles;
  if (fields.parentSeatId !== undefined) update.parentSeatId = fields.parentSeatId;
  if (fields.personId !== undefined) update.personId = fields.personId;
  if (fields.gwcGetsIt !== undefined) update.gwcGetsIt = fields.gwcGetsIt;
  if (fields.gwcWantsIt !== undefined) update.gwcWantsIt = fields.gwcWantsIt;
  if (fields.gwcCapacity !== undefined) update.gwcCapacity = fields.gwcCapacity;

  if (Object.keys(update).length === 0) return;

  await db.update(seats).set(update).where(eq(seats.id, id));
  revalidatePath('/accountability');
}

export async function deleteSeat(id: string) {
  await requireUser();

  // Move children to null parent (orphan them to top level)
  await db
    .update(seats)
    .set({ parentSeatId: null })
    .where(eq(seats.parentSeatId, id));

  await db.delete(seats).where(eq(seats.id, id));
  revalidatePath('/accountability');
}

export async function listTeamMembers() {
  const user = await requireUser();
  const [dbUser] = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(eq(users.id, user.id));
  if (!dbUser?.teamId) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      profileColor: users.profileColor,
    })
    .from(users)
    .where(eq(users.teamId, dbUser.teamId));
}
