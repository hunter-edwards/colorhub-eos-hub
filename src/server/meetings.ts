'use server';

import { db } from '@/db';
import { meetings, meetingRatings, headlines, users } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { collectMeetingContext, generateSummary } from './ai-summary';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function startMeeting(type: 'L10' | 'quarterly' | 'annual' = 'L10') {
  await requireUser();
  const active = await getActiveMeeting();
  if (active) throw new Error('A meeting is already in progress');
  const [created] = await db
    .insert(meetings)
    .values({ type, attendees: [] })
    .returning();
  revalidatePath('/meeting/live');
  return created;
}

export async function endMeeting(meetingId: string) {
  await requireUser();
  const ratings = await db
    .select({ rating: meetingRatings.rating })
    .from(meetingRatings)
    .where(eq(meetingRatings.meetingId, meetingId));
  const avg =
    ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;
  await db
    .update(meetings)
    .set({ endedAt: new Date(), ratingAvg: avg })
    .where(eq(meetings.id, meetingId));

  // Generate AI summary (non-blocking — meeting still ends if this fails)
  try {
    const ctx = await collectMeetingContext(meetingId);
    const summary = await generateSummary(ctx);
    await db
      .update(meetings)
      .set({ aiSummaryMd: summary })
      .where(eq(meetings.id, meetingId));
  } catch (e) {
    console.error('AI summary generation failed:', e);
  }

  revalidatePath('/meeting/live');
  revalidatePath('/meeting/history');
  return { meetingId };
}

export async function getActiveMeeting() {
  const [active] = await db
    .select()
    .from(meetings)
    .where(isNull(meetings.endedAt))
    .limit(1);
  return active ?? null;
}

export async function getMeeting(meetingId: string) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));
  return meeting ?? null;
}

export async function joinMeeting(meetingId: string) {
  const user = await requireUser();
  const [dbUser] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, user.id));
  if (!dbUser) return;

  const meeting = await getMeeting(meetingId);
  if (!meeting) return;

  const attendees = (meeting.attendees as { id: string }[]) || [];
  if (attendees.some((a) => a.id === user.id)) return;

  await db
    .update(meetings)
    .set({
      attendees: [...attendees, { id: dbUser.id, name: dbUser.name, email: dbUser.email }],
    })
    .where(eq(meetings.id, meetingId));
  revalidatePath('/meeting/live');
}

export async function rateMeeting(meetingId: string, rating: number) {
  const user = await requireUser();
  await db
    .insert(meetingRatings)
    .values({ meetingId, userId: user.id, rating })
    .onConflictDoUpdate({
      target: [meetingRatings.meetingId, meetingRatings.userId],
      set: { rating },
    });
  revalidatePath('/meeting/live');
}

export async function getMeetingRatings(meetingId: string) {
  return db
    .select({
      userId: meetingRatings.userId,
      rating: meetingRatings.rating,
      userName: users.name,
      userEmail: users.email,
    })
    .from(meetingRatings)
    .leftJoin(users, eq(meetingRatings.userId, users.id))
    .where(eq(meetingRatings.meetingId, meetingId));
}

export async function addHeadline(
  meetingId: string,
  kind: 'customer' | 'employee',
  text: string
) {
  const user = await requireUser();
  await db.insert(headlines).values({
    meetingId,
    kind,
    text,
    authorId: user.id,
  });
  revalidatePath('/meeting/live');
}

export async function listHeadlines(meetingId: string) {
  return db
    .select({
      id: headlines.id,
      kind: headlines.kind,
      text: headlines.text,
      authorId: headlines.authorId,
      createdAt: headlines.createdAt,
      authorName: users.name,
    })
    .from(headlines)
    .leftJoin(users, eq(headlines.authorId, users.id))
    .where(eq(headlines.meetingId, meetingId));
}

export async function listMeetings() {
  return db
    .select()
    .from(meetings)
    .orderBy(desc(meetings.startedAt));
}
