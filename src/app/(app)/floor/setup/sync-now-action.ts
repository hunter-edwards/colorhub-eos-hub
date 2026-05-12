'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/server/auth-helpers';
import { syncFloorRoutings, getLastFloorSync } from '@/server/floor-knack-sync';

export async function syncNowAction() {
  await requireUser();
  // Phase 1 didn't separate supervisor vs member roles; for now any
  // authenticated user can trigger. When supervisor gating lands, swap
  // this for requireRole('supervisor') (or equivalent).
  const result = await syncFloorRoutings();
  revalidatePath('/floor');
  revalidatePath('/floor/setup');
  return result;
}

export async function getLastFloorSyncForUi() {
  await requireUser();
  return getLastFloorSync();
}
