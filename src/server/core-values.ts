'use server';

import { db } from '@/db';
import { coreValues, users } from '@/db/schema';
import { eq, and, asc, max } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

async function getTeamId(userId: string) {
  const [dbUser] = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(eq(users.id, userId));
  if (!dbUser?.teamId) throw new Error('No team found');
  return dbUser.teamId;
}

export async function listCoreValues() {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);
  return db
    .select()
    .from(coreValues)
    .where(and(eq(coreValues.teamId, teamId), eq(coreValues.active, true)))
    .orderBy(asc(coreValues.orderIdx));
}

export async function createCoreValue(input: {
  title: string;
  description?: string;
}) {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);

  // Get the current max orderIdx
  const [result] = await db
    .select({ maxIdx: max(coreValues.orderIdx) })
    .from(coreValues)
    .where(eq(coreValues.teamId, teamId));
  const nextIdx = (result?.maxIdx ?? -1) + 1;

  const [created] = await db
    .insert(coreValues)
    .values({
      teamId,
      title: input.title,
      description: input.description ?? null,
      orderIdx: nextIdx,
    })
    .returning();
  revalidatePath('/core-values');
  return created;
}

export async function updateCoreValue(input: {
  id: string;
  title: string;
  description?: string;
}) {
  await requireUser();
  await db
    .update(coreValues)
    .set({
      title: input.title,
      description: input.description ?? null,
    })
    .where(eq(coreValues.id, input.id));
  revalidatePath('/core-values');
}

export async function reorderCoreValues(ids: string[]) {
  await requireUser();
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(coreValues)
      .set({ orderIdx: i })
      .where(eq(coreValues.id, ids[i]));
  }
  revalidatePath('/core-values');
}

export async function deleteCoreValue(id: string) {
  await requireUser();
  await db.delete(coreValues).where(eq(coreValues.id, id));
  revalidatePath('/core-values');
}
