'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { todos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentTeamId } from '@/server/team-helpers';
import * as floorTasks from '@/server/floor-tasks';

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
