'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { todos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentTeamId } from '@/server/team-helpers';
import * as floorTasks from '@/server/floor-tasks';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function importTodosAsTasksAction(todoIds: string[]) {
  const teamId = await getCurrentTeamId();
  for (const id of todoIds) {
    await floorTasks.importFromTodo(id, teamId);
  }
  revalidatePath('/floor');
  revalidatePath('/floor/setup');
}

export async function listOpenTodosForImport(): Promise<
  Array<{ id: string; title: string; dueDate: string | null }>
> {
  await requireUser();
  const rows = await db
    .select({
      id: todos.id,
      title: todos.title,
      dueDate: todos.dueDate,
    })
    .from(todos)
    .where(eq(todos.status, 'open'));
  return rows;
}
