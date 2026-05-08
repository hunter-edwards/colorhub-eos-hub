'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentTeamId } from '@/server/team-helpers';
import * as floorTasks from '@/server/floor-tasks';
import type { TaskPoolStatus } from '@/server/floor-tasks';

export async function createTaskAction(input: {
  title: string;
  estMinutes?: number;
  suggestedStationId?: string;
}) {
  const teamId = await getCurrentTeamId();
  await floorTasks.createTask({ ...input, teamId });
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function markTaskAction(taskId: string, status: TaskPoolStatus) {
  await floorTasks.markTask(taskId, status, {});
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function archiveTaskAction(taskId: string) {
  await floorTasks.markTask(taskId, 'archived', {});
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}
