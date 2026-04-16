'use server';

import { db } from '@/db';
import { processes, users } from '@/db/schema';
import { eq, asc, max } from 'drizzle-orm';
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

export async function listProcesses() {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);
  return db
    .select({
      id: processes.id,
      title: processes.title,
      description: processes.description,
      ownerId: processes.ownerId,
      steps: processes.steps,
      orderIdx: processes.orderIdx,
      updatedAt: processes.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(processes)
    .leftJoin(users, eq(processes.ownerId, users.id))
    .where(eq(processes.teamId, teamId))
    .orderBy(asc(processes.orderIdx));
}

export async function createProcess(input: {
  title: string;
  description?: string;
  ownerId?: string;
}) {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);

  const [result] = await db
    .select({ maxIdx: max(processes.orderIdx) })
    .from(processes)
    .where(eq(processes.teamId, teamId));
  const nextIdx = (result?.maxIdx ?? -1) + 1;

  const [created] = await db
    .insert(processes)
    .values({
      teamId,
      title: input.title,
      description: input.description ?? null,
      ownerId: input.ownerId ?? null,
      orderIdx: nextIdx,
    })
    .returning();
  revalidatePath('/processes');
  return created;
}

export async function updateProcess(input: {
  id: string;
  title?: string;
  description?: string;
  ownerId?: string | null;
  steps?: string[];
}) {
  await requireUser();
  const set: Record<string, unknown> = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.description !== undefined) set.description = input.description;
  if (input.ownerId !== undefined) set.ownerId = input.ownerId;
  if (input.steps !== undefined) set.steps = input.steps;
  if (Object.keys(set).length === 0) return;
  await db.update(processes).set(set).where(eq(processes.id, input.id));
  revalidatePath('/processes');
}

export async function deleteProcess(id: string) {
  await requireUser();
  await db.delete(processes).where(eq(processes.id, id));
  revalidatePath('/processes');
}

export async function listTeamMembers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users);
}
