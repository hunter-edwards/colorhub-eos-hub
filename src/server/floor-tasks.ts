'use server';

import { db } from '@/db';
import { taskPool, taskPoolStatus, todos } from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { recordEvent } from './floor-events';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export type TaskRow = typeof taskPool.$inferSelect;
export type TaskPoolStatus = (typeof taskPoolStatus.enumValues)[number];

export async function listTasks(opts?: {
  statuses?: TaskPoolStatus[];
  teamId?: string;
}): Promise<TaskRow[]> {
  const conds = [] as ReturnType<typeof eq>[];
  if (opts?.statuses && opts.statuses.length > 0) {
    conds.push(inArray(taskPool.status, opts.statuses));
  }
  if (opts?.teamId) {
    conds.push(eq(taskPool.teamId, opts.teamId));
  }

  const base = db.select().from(taskPool);
  const filtered = conds.length > 0 ? base.where(and(...conds)) : base;
  const rows = (await filtered.orderBy(desc(taskPool.createdAt))) as TaskRow[];
  return rows;
}

export async function createTask(input: {
  title: string;
  estMinutes?: number;
  suggestedStationId?: string;
  teamId: string;
}): Promise<TaskRow> {
  await requireUser();

  const [created] = (await db
    .insert(taskPool)
    .values({
      title: input.title,
      estMinutes: input.estMinutes,
      suggestedStationId: input.suggestedStationId,
      teamId: input.teamId,
      source: 'hub',
    })
    .returning()) as TaskRow[];

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  return created;
}

/**
 * Pull an existing EOS todo into the floor task pool.
 *
 * Throws `Error('Todo not found')` if the todo id doesn't resolve.
 */
export async function importFromTodo(
  todoId: string,
  teamId: string,
): Promise<TaskRow> {
  await requireUser();

  const found = (await db
    .select({ id: todos.id, title: todos.title })
    .from(todos)
    .where(eq(todos.id, todoId))
    .limit(1)) as Array<{ id: string; title: string }>;

  if (found.length === 0) {
    throw new Error('Todo not found');
  }

  const [created] = (await db
    .insert(taskPool)
    .values({
      title: found[0].title,
      teamId,
      source: 'eos_todo',
      sourceTodoId: todoId,
    })
    .returning()) as TaskRow[];

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  return created;
}

export async function markTask(
  taskId: string,
  status: TaskPoolStatus,
  opts: {
    recordedBy?: string;
    shiftSessionId?: string;
    stationId?: string | null;
  },
): Promise<TaskRow> {
  await requireUser();

  const set: Record<string, unknown> = { status };
  const now = new Date();
  if (status === 'done') {
    set.completedAt = now;
  }

  const [updated] = (await db
    .update(taskPool)
    .set(set)
    .where(eq(taskPool.id, taskId))
    .returning()) as TaskRow[];

  if (status === 'done' && opts.shiftSessionId && opts.recordedBy) {
    await recordEvent({
      shiftSessionId: opts.shiftSessionId,
      stationId: opts.stationId ?? null,
      kind: 'task_completed',
      payload: { taskId, title: updated?.title },
      recordedBy: opts.recordedBy,
      occurredAt: now,
    });
  }

  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  return updated;
}

export async function assignTask(
  taskId: string,
  shiftSessionId: string,
  userId: string,
): Promise<TaskRow> {
  await requireUser();

  const [updated] = (await db
    .update(taskPool)
    .set({
      assignedShiftSessionId: shiftSessionId,
      assignedUserId: userId,
    })
    .where(eq(taskPool.id, taskId))
    .returning()) as TaskRow[];

  revalidatePath('/floor');
  return updated;
}
