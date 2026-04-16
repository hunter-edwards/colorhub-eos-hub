'use server';

import { db } from '@/db';
import { rocks, rockActivity, rockSubtasks, users } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function createRock(input: {
  title: string;
  description?: string;
  ownerId: string;
  quarter: string;
  dueDate?: string;
}) {
  await requireUser();
  const [created] = await db.insert(rocks).values(input).returning();
  revalidatePath('/rocks');
  return created;
}

export async function listRocks(quarter: string) {
  return db
    .select({
      id: rocks.id,
      title: rocks.title,
      description: rocks.description,
      ownerId: rocks.ownerId,
      quarter: rocks.quarter,
      status: rocks.status,
      progressPct: rocks.progressPct,
      dueDate: rocks.dueDate,
      createdAt: rocks.createdAt,
      updatedAt: rocks.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(rocks)
    .leftJoin(users, eq(rocks.ownerId, users.id))
    .where(eq(rocks.quarter, quarter));
}

export async function updateRockStatus(rockId: string, status: 'on_track' | 'off_track' | 'done') {
  const user = await requireUser();
  await db.update(rocks).set({ status }).where(eq(rocks.id, rockId));
  await db.insert(rockActivity).values({
    rockId,
    actorId: user.id,
    kind: 'status_change',
    payload: { status },
  });
  revalidatePath('/rocks');
  revalidatePath(`/rocks/${rockId}`);
}

export async function updateRockProgress(rockId: string, progressPct: number) {
  const user = await requireUser();
  await db.update(rocks).set({ progressPct }).where(eq(rocks.id, rockId));
  await db.insert(rockActivity).values({
    rockId,
    actorId: user.id,
    kind: 'progress',
    payload: { progressPct },
  });
  revalidatePath('/rocks');
  revalidatePath(`/rocks/${rockId}`);
}

async function recalcProgress(rockId: string) {
  const subtasks = await db
    .select({ done: rockSubtasks.done })
    .from(rockSubtasks)
    .where(eq(rockSubtasks.rockId, rockId));
  if (subtasks.length === 0) return;
  const done = subtasks.filter((s) => s.done).length;
  const pct = Math.round((done / subtasks.length) * 100);
  await db.update(rocks).set({ progressPct: pct }).where(eq(rocks.id, rockId));
}

export async function listTeamMembers() {
  return db.select({ id: users.id, name: users.name, email: users.email }).from(users);
}

export async function getRock(rockId: string) {
  const [rock] = await db
    .select({
      id: rocks.id,
      title: rocks.title,
      description: rocks.description,
      ownerId: rocks.ownerId,
      quarter: rocks.quarter,
      status: rocks.status,
      progressPct: rocks.progressPct,
      dueDate: rocks.dueDate,
      createdAt: rocks.createdAt,
      updatedAt: rocks.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(rocks)
    .leftJoin(users, eq(rocks.ownerId, users.id))
    .where(eq(rocks.id, rockId));
  return rock ?? null;
}

export async function listSubtasks(rockId: string) {
  return db
    .select()
    .from(rockSubtasks)
    .where(eq(rockSubtasks.rockId, rockId))
    .orderBy(asc(rockSubtasks.orderIdx));
}

export async function addSubtask(rockId: string, title: string) {
  const user = await requireUser();
  const [created] = await db
    .insert(rockSubtasks)
    .values({ rockId, title })
    .returning();
  await db.insert(rockActivity).values({
    rockId,
    actorId: user.id,
    kind: 'subtask',
    payload: { action: 'added', subtaskTitle: title },
  });
  await recalcProgress(rockId);
  revalidatePath(`/rocks/${rockId}`);
  revalidatePath('/rocks');
  return created;
}

export async function toggleSubtask(subtaskId: string) {
  const [existing] = await db
    .select()
    .from(rockSubtasks)
    .where(eq(rockSubtasks.id, subtaskId));
  if (!existing) return;
  await db
    .update(rockSubtasks)
    .set({ done: !existing.done })
    .where(eq(rockSubtasks.id, subtaskId));
  await recalcProgress(existing.rockId);
  revalidatePath(`/rocks/${existing.rockId}`);
  revalidatePath('/rocks');
}

export async function deleteSubtask(subtaskId: string) {
  const [existing] = await db
    .select()
    .from(rockSubtasks)
    .where(eq(rockSubtasks.id, subtaskId));
  if (!existing) return;
  await db.delete(rockSubtasks).where(eq(rockSubtasks.id, subtaskId));
  await recalcProgress(existing.rockId);
  revalidatePath(`/rocks/${existing.rockId}`);
  revalidatePath('/rocks');
}

export async function listActivity(rockId: string) {
  return db
    .select({
      id: rockActivity.id,
      kind: rockActivity.kind,
      payload: rockActivity.payload,
      createdAt: rockActivity.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(rockActivity)
    .leftJoin(users, eq(rockActivity.actorId, users.id))
    .where(eq(rockActivity.rockId, rockId))
    .orderBy(desc(rockActivity.createdAt));
}

export async function addComment(rockId: string, body: string) {
  const user = await requireUser();
  // Parse @mentions
  const mentionRegex = /@(\w+)/g;
  const mentions = [...body.matchAll(mentionRegex)].map((m) => m[1]);
  await db.insert(rockActivity).values({
    rockId,
    actorId: user.id,
    kind: 'comment',
    payload: { body, mentions },
  });
  revalidatePath(`/rocks/${rockId}`);
}
