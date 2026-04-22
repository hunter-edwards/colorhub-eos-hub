import { db } from '@/db';
import { meetings } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create the next draft meeting after a meeting is concluded. Open
 * issues and to-dos aren't duplicated — they stay in their own tables
 * and naturally surface in the next live meeting's panels because
 * those query status = 'open'. The only value explicitly carried
 * forward is the cascading message.
 */
export async function createNextDraftFromConcluded(
  concludedMeetingId: string,
  options: { cadenceDays?: number; now?: Date } = {},
) {
  const { cadenceDays = 7, now = new Date() } = options;

  const [prev] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, concludedMeetingId));
  if (!prev) throw new Error('Concluded meeting not found');

  // Only L10s auto-schedule — quarterly/annual are manually scheduled.
  if (prev.type !== 'L10') return null;

  const scheduledFor = new Date(now.getTime() + cadenceDays * 24 * 60 * 60 * 1000);

  const [created] = await db
    .insert(meetings)
    .values({
      teamId: prev.teamId,
      type: prev.type,
      status: 'draft',
      scheduledFor,
      previousCascadingMessage: prev.cascadingMessage ?? null,
      attendees: [],
    })
    .returning();

  return created;
}
