'use server';

import { revalidatePath } from 'next/cache';
import { setHandoffNotes } from '@/server/floor-shifts';

export async function saveHandoffNotesAction(
  shiftSessionId: string,
  notes: string,
): Promise<void> {
  await setHandoffNotes(shiftSessionId, notes);
  revalidatePath('/floor');
  revalidatePath('/floor/handoff');
}
