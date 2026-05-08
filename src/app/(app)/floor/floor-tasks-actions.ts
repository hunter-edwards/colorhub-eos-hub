'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentTeamId } from '@/server/team-helpers';
import { createClient } from '@/lib/supabase/server';
import * as floorTasks from '@/server/floor-tasks';

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function createTaskFromBoardAction(input: {
  title: string;
  estMinutes?: number;
  suggestedStationId?: string;
}) {
  const teamId = await getCurrentTeamId();
  await floorTasks.createTask({ ...input, teamId });
  revalidatePath('/floor');
}

export async function progressTaskAction(
  taskId: string,
  _shiftSessionId: string | null,
) {
  void _shiftSessionId; // accepted for API symmetry with completeTaskAction; not currently used
  await floorTasks.markTask(taskId, 'in_progress', {});
  revalidatePath('/floor');
}

export async function completeTaskAction(
  taskId: string,
  shiftSessionId: string | null,
  stationId: string | null,
) {
  const recordedBy = await requireUserId();
  await floorTasks.markTask(taskId, 'done', {
    recordedBy,
    shiftSessionId: shiftSessionId ?? undefined,
    stationId,
  });
  revalidatePath('/floor');
}

export async function archiveTaskFromBoardAction(taskId: string) {
  await floorTasks.markTask(taskId, 'archived', {});
  revalidatePath('/floor');
}
