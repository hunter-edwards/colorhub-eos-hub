'use server';

import { revalidatePath } from 'next/cache';
import { recordEvent } from '@/server/floor-events';
import { createClient } from '@/lib/supabase/server';

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function startJobAction(input: {
  shiftSessionId: string;
  stationId: string;
  knackJobId: string | null;
  jobNumber: string | null;
  customer: string | null;
}) {
  const recordedBy = await requireUserId();
  await recordEvent({
    shiftSessionId: input.shiftSessionId,
    stationId: input.stationId,
    kind: 'job_started',
    payload: {
      knackJobId: input.knackJobId,
      jobNumber: input.jobNumber,
      customer: input.customer,
    },
    recordedBy,
    relatedKnackJobId: input.knackJobId ?? undefined,
  });
  revalidatePath('/floor');
}
