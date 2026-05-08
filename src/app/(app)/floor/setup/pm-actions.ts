'use server';

import { revalidatePath } from 'next/cache';
import * as floorPmSchedules from '@/server/floor-pm-schedules';

export async function createPmScheduleAction(input: {
  stationId: string;
  label: string;
  cadenceDays: number;
  lastDoneAt?: string | null;
}) {
  await floorPmSchedules.createSchedule(input);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function updatePmScheduleAction(
  id: string,
  patch: {
    label?: string;
    cadenceDays?: number;
    lastDoneAt?: string | null;
  },
) {
  await floorPmSchedules.updateSchedule(id, patch);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function deletePmScheduleAction(id: string) {
  await floorPmSchedules.deleteSchedule(id);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}
