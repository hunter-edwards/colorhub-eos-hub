'use server';

import { db } from '@/db';
import { meetingRsvps, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireUser } from './auth-helpers';

export type RsvpStatus = 'attending' | 'declined' | 'tentative';

export async function setRsvp(meetingId: string, status: RsvpStatus) {
  const user = await requireUser();
  await db
    .insert(meetingRsvps)
    .values({ meetingId, userId: user.id, status })
    .onConflictDoUpdate({
      target: [meetingRsvps.meetingId, meetingRsvps.userId],
      set: { status, respondedAt: new Date() },
    });
  revalidatePath('/meeting/upcoming');
}

export async function getMyRsvp(meetingId: string): Promise<RsvpStatus | null> {
  const user = await requireUser();
  const [row] = await db
    .select({ status: meetingRsvps.status })
    .from(meetingRsvps)
    .where(and(eq(meetingRsvps.meetingId, meetingId), eq(meetingRsvps.userId, user.id)));
  return row?.status ?? null;
}

export async function listRsvps(meetingId: string) {
  return db
    .select({
      userId: meetingRsvps.userId,
      status: meetingRsvps.status,
      userName: users.name,
      userEmail: users.email,
    })
    .from(meetingRsvps)
    .leftJoin(users, eq(meetingRsvps.userId, users.id))
    .where(eq(meetingRsvps.meetingId, meetingId));
}

export async function rsvpCountsByStatus(
  meetingId: string,
): Promise<{ attending: number; declined: number; tentative: number }> {
  const rows = await db
    .select({ status: meetingRsvps.status })
    .from(meetingRsvps)
    .where(eq(meetingRsvps.meetingId, meetingId));
  const counts = { attending: 0, declined: 0, tentative: 0 };
  for (const r of rows) counts[r.status]++;
  return counts;
}
