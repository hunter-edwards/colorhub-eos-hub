'use server';

import { db } from '@/db';
import { meetings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { collectMeetingContext, generateSummary } from '@/server/ai-summary';
import { revalidatePath } from 'next/cache';

export async function retrySummary(meetingId: string) {
  try {
    const ctx = await collectMeetingContext(meetingId);
    const summary = await generateSummary(ctx);
    await db
      .update(meetings)
      .set({ aiSummaryMd: summary })
      .where(eq(meetings.id, meetingId));
    revalidatePath(`/meeting/history/${meetingId}`);
    return { summary };
  } catch (e) {
    console.error('Retry summary failed:', e);
    return { summary: null, error: 'Failed to generate summary' };
  }
}
