'use server';

// Note: drag-handler shape is exercised by Task 42 Playwright E2E rather than
// a unit test, since pure isolation isn't meaningful here.
// TODO(Task 42): cover the full drag → assign flow via Playwright.

import { revalidatePath } from 'next/cache';
import { setAssignment, removeAssignment } from '@/server/floor-shifts';
import { recordEvent } from '@/server/floor-events';
import { createClient } from '@/lib/supabase/server';

async function requireUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function assignOperatorAction(input: {
  shiftSessionId: string;
  stationId: string;
  userId: string;
  fromStationId?: string | null;
  fromStationName?: string | null;
  toStationName?: string | null;
  userName?: string | null;
}) {
  const recordedBy = await requireUserId();
  if (input.fromStationId && input.fromStationId !== input.stationId) {
    await removeAssignment(input.shiftSessionId, input.fromStationId, input.userId);
  }
  await setAssignment(input.shiftSessionId, input.stationId, input.userId);
  await recordEvent({
    shiftSessionId: input.shiftSessionId,
    stationId: input.stationId,
    kind: 'operator_moved',
    payload: {
      userId: input.userId,
      userName: input.userName ?? null,
      fromStationId: input.fromStationId ?? null,
      fromStationName: input.fromStationName ?? null,
      toStationId: input.stationId,
      toStationName: input.toStationName ?? null,
    },
    recordedBy,
  });
  revalidatePath('/floor');
}

export async function unassignOperatorAction(input: {
  shiftSessionId: string;
  stationId: string;
  userId: string;
}) {
  await requireUserId();
  await removeAssignment(input.shiftSessionId, input.stationId, input.userId);
  revalidatePath('/floor');
}
