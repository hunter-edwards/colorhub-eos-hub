'use server';

import { db } from '@/db';
import { todos, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function createTodo(input: {
  title: string;
  ownerId: string;
  dueDate?: string;
  sourceMeetingId?: string;
}) {
  await requireUser();
  const due =
    input.dueDate ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [created] = await db
    .insert(todos)
    .values({
      title: input.title,
      ownerId: input.ownerId,
      dueDate: due,
      sourceMeetingId: input.sourceMeetingId,
    })
    .returning();
  revalidatePath('/todos');
  return created;
}

export async function listOpenTodos() {
  return db
    .select({
      id: todos.id,
      title: todos.title,
      ownerId: todos.ownerId,
      dueDate: todos.dueDate,
      status: todos.status,
      createdAt: todos.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(todos)
    .leftJoin(users, eq(todos.ownerId, users.id))
    .where(eq(todos.status, 'open'));
}

export async function listMyTodos() {
  const user = await requireUser();
  return db
    .select({
      id: todos.id,
      title: todos.title,
      ownerId: todos.ownerId,
      dueDate: todos.dueDate,
      status: todos.status,
      createdAt: todos.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(todos)
    .leftJoin(users, eq(todos.ownerId, users.id))
    .where(and(eq(todos.ownerId, user.id), eq(todos.status, 'open')));
}

export async function toggleTodo(todoId: string) {
  const [existing] = await db
    .select()
    .from(todos)
    .where(eq(todos.id, todoId));
  if (!existing) return;
  const newStatus = existing.status === 'open' ? 'done' : 'open';
  await db
    .update(todos)
    .set({
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date() : null,
    })
    .where(eq(todos.id, todoId));
  revalidatePath('/todos');
}

export async function dropTodo(todoId: string) {
  await requireUser();
  await db.delete(todos).where(eq(todos.id, todoId));
  revalidatePath('/todos');
}

export async function carryOverTodo(todoId: string) {
  await requireUser();
  const newDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  // Re-opening clears completedAt so it isn't mis-counted as completed in the future.
  await db
    .update(todos)
    .set({ dueDate: newDue, status: 'open', completedAt: null })
    .where(eq(todos.id, todoId));
  revalidatePath('/todos');
}
