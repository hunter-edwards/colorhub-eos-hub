'use server';

import { db } from '@/db';
import {
  meetings,
  meetingRatings,
  headlines,
  users,
  teamSettings,
  issues,
  todos,
  rocks,
  rockActivity,
} from '@/db/schema';
import { eq, and, or, desc, gte, lte } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { collectMeetingContext, generateSummary } from './ai-summary';
import { postToTeams } from './teams-webhook';
import { requireRole } from './auth-helpers';
import { createNextDraftFromConcluded } from './carry-over';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function startMeeting(type: 'L10' | 'quarterly' | 'annual' = 'L10') {
  const { user } = await requireRole('leader');
  const active = await getActiveMeeting();
  if (active) throw new Error('A meeting is already in progress');
  const [dbUser] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, user.id));
  const attendees = dbUser
    ? [{ id: dbUser.id, name: dbUser.name, email: dbUser.email }]
    : [];
  const [created] = await db
    .insert(meetings)
    .values({ type, attendees, status: 'live' })
    .returning();
  revalidatePath('/meeting/live');
  revalidatePath('/meeting/upcoming');
  return created;
}

export async function createDraftMeeting(input: {
  type?: 'L10' | 'quarterly' | 'annual';
  scheduledFor?: Date;
}) {
  await requireRole('leader');
  const [created] = await db
    .insert(meetings)
    .values({
      type: input.type ?? 'L10',
      attendees: [],
      status: 'draft',
      scheduledFor: input.scheduledFor,
    })
    .returning();
  revalidatePath('/meeting/upcoming');
  return created;
}

export async function activateMeeting(meetingId: string) {
  const { user } = await requireRole('leader');
  const active = await getActiveMeeting();
  if (active && active.id !== meetingId) {
    throw new Error('A meeting is already in progress');
  }
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.status === 'concluded') throw new Error('Meeting already concluded');

  const attendees = (meeting.attendees as { id: string; name: string | null; email: string }[]) || [];
  let nextAttendees = attendees;
  if (!attendees.some((a) => a.id === user.id)) {
    const [dbUser] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, user.id));
    if (dbUser) {
      nextAttendees = [...attendees, { id: dbUser.id, name: dbUser.name, email: dbUser.email }];
    }
  }

  await db
    .update(meetings)
    .set({ status: 'live', startedAt: new Date(), attendees: nextAttendees })
    .where(eq(meetings.id, meetingId));
  revalidatePath('/meeting/live');
  revalidatePath('/meeting/upcoming');
  return meetingId;
}

export async function endMeeting(meetingId: string) {
  await requireRole('leader');
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
    .set({ endedAt: new Date(), ratingAvg: avg, status: 'concluded' })
    .where(eq(meetings.id, meetingId));

  // Generate AI summary (non-blocking — meeting still ends if this fails)
  let summary: string | null = null;
  let ctx: Awaited<ReturnType<typeof collectMeetingContext>> | null = null;
  try {
    ctx = await collectMeetingContext(meetingId);
    summary = await generateSummary(ctx);
    await db
      .update(meetings)
      .set({ aiSummaryMd: summary })
      .where(eq(meetings.id, meetingId));
  } catch (e) {
    console.error('AI summary generation failed:', e);
  }

  // Post to Teams webhook if configured
  if (ctx && summary) {
    try {
      const [settings] = await db.select().from(teamSettings);
      if (settings?.teamsWebhookUrl) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
        const meetingUrl = siteUrl ? `${siteUrl}/meeting/history/${meetingId}` : undefined;
        const result = await postToTeams(ctx, summary, settings.teamsWebhookUrl, meetingUrl);
        if (result.ok) {
          await db
            .update(meetings)
            .set({ teamsPostedAt: result.postedAt })
            .where(eq(meetings.id, meetingId));
        } else {
          console.error('Teams webhook post failed:', result.error);
        }
      }
    } catch (e) {
      console.error('Teams webhook post failed:', e);
    }
  }

  // Auto-create the next draft meeting (L10 only). Non-fatal if it fails.
  try {
    await createNextDraftFromConcluded(meetingId);
  } catch (e) {
    console.error('Failed to create next draft meeting:', e);
  }

  revalidatePath('/meeting/live');
  revalidatePath('/meeting/history');
  revalidatePath('/meeting/upcoming');
  return { meetingId };
}

export async function getActiveMeeting() {
  const [active] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.status, 'live'))
    .limit(1);
  return active ?? null;
}

export async function listDraftMeetings() {
  return db
    .select()
    .from(meetings)
    .where(eq(meetings.status, 'draft'))
    .orderBy(meetings.scheduledFor);
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

export async function addAttendee(meetingId: string, userId: string) {
  await requireRole('leader');
  const [dbUser] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  if (!dbUser) throw new Error('User not found');
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  const attendees = (meeting.attendees as { id: string; name: string | null; email: string }[]) || [];
  if (attendees.some((a) => a.id === userId)) return;
  await db
    .update(meetings)
    .set({
      attendees: [...attendees, { id: dbUser.id, name: dbUser.name, email: dbUser.email }],
    })
    .where(eq(meetings.id, meetingId));
  revalidatePath('/meeting/live');
}

export async function removeAttendee(meetingId: string, userId: string) {
  await requireRole('leader');
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  const attendees = (meeting.attendees as { id: string }[]) || [];
  await db
    .update(meetings)
    .set({ attendees: attendees.filter((a) => a.id !== userId) })
    .where(eq(meetings.id, meetingId));
  revalidatePath('/meeting/live');
}

export async function listTeamUsers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .orderBy(users.name);
}

export async function setCascadingMessage(meetingId: string, text: string) {
  await requireRole('leader');
  await db
    .update(meetings)
    .set({ cascadingMessage: text })
    .where(eq(meetings.id, meetingId));
  revalidatePath('/meeting/live');
}

export async function rateMeetingOnBehalf(
  meetingId: string,
  userId: string,
  rating: number,
) {
  await requireRole('admin');
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  const attendees = (meeting.attendees as { id: string }[]) || [];
  if (!attendees.some((a) => a.id === userId)) {
    throw new Error('Only attendees can be rated for this meeting');
  }
  await db
    .insert(meetingRatings)
    .values({ meetingId, userId, rating })
    .onConflictDoUpdate({
      target: [meetingRatings.meetingId, meetingRatings.userId],
      set: { rating },
    });
  revalidatePath('/meeting/live');
}

export async function rateMeeting(meetingId: string, rating: number) {
  const user = await requireUser();
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  const attendees = (meeting.attendees as { id: string }[]) || [];
  if (!attendees.some((a) => a.id === user.id)) {
    throw new Error('Only attendees can rate this meeting');
  }
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
    .where(eq(meetings.status, 'concluded'))
    .orderBy(desc(meetings.startedAt));
}

// ── Meeting changelog ──────────────────────────────────────────────

export type MeetingChangelog = {
  startedAt: Date;
  endedAt: Date | null;
  issuesCreated: Array<{ id: string; title: string; list: 'short_term' | 'long_term'; ownerName: string | null }>;
  issuesSolved: Array<{ id: string; title: string; ownerName: string | null }>;
  issuesDropped: Array<{ id: string; title: string; ownerName: string | null }>;
  todosCreated: Array<{ id: string; title: string; dueDate: string; ownerName: string | null }>;
  todosCompleted: Array<{ id: string; title: string; ownerName: string | null }>;
  rockEvents: Array<{
    id: string;
    rockId: string;
    rockTitle: string;
    actorName: string | null;
    kind: 'status_change' | 'progress' | 'comment' | 'subtask' | 'mention';
    payload: Record<string, unknown>;
    createdAt: Date;
  }>;
};

/**
 * Aggregates everything that changed during a meeting so anyone who missed
 * it can see exactly what happened: new/solved/dropped issues, to-dos
 * created or completed, and every rock activity entry inside the meeting
 * window.
 *
 * All queries are bounded by [meeting.startedAt, meeting.endedAt] so
 * changes outside the meeting don't leak in.
 */
export async function getMeetingChangelog(meetingId: string): Promise<MeetingChangelog | null> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) return null;

  const start = meeting.startedAt;
  // If meeting is still live, use "now" as the window end so we see in-progress activity.
  const end = meeting.endedAt ?? new Date();

  const [
    issuesCreatedRows,
    issuesSolvedRows,
    issuesDroppedRows,
    todosCreatedRows,
    todosCompletedRows,
    rockEventRows,
  ] = await Promise.all([
    db
      .select({
        id: issues.id,
        title: issues.title,
        list: issues.list,
        ownerName: users.name,
      })
      .from(issues)
      .leftJoin(users, eq(issues.ownerId, users.id))
      .where(and(gte(issues.createdAt, start), lte(issues.createdAt, end))),

    db
      .select({
        id: issues.id,
        title: issues.title,
        ownerName: users.name,
      })
      .from(issues)
      .leftJoin(users, eq(issues.ownerId, users.id))
      .where(
        and(
          eq(issues.status, 'solved'),
          gte(issues.solvedAt, start),
          lte(issues.solvedAt, end)
        )
      ),

    db
      .select({
        id: issues.id,
        title: issues.title,
        ownerName: users.name,
      })
      .from(issues)
      .leftJoin(users, eq(issues.ownerId, users.id))
      .where(
        and(
          eq(issues.status, 'dropped'),
          gte(issues.droppedAt, start),
          lte(issues.droppedAt, end)
        )
      ),

    db
      .select({
        id: todos.id,
        title: todos.title,
        dueDate: todos.dueDate,
        ownerName: users.name,
      })
      .from(todos)
      .leftJoin(users, eq(todos.ownerId, users.id))
      .where(
        // Either explicitly sourced from this meeting, or created during the window
        or(
          eq(todos.sourceMeetingId, meetingId),
          and(gte(todos.createdAt, start), lte(todos.createdAt, end))
        )
      ),

    db
      .select({
        id: todos.id,
        title: todos.title,
        ownerName: users.name,
      })
      .from(todos)
      .leftJoin(users, eq(todos.ownerId, users.id))
      .where(
        and(
          eq(todos.status, 'done'),
          gte(todos.completedAt, start),
          lte(todos.completedAt, end)
        )
      ),

    db
      .select({
        id: rockActivity.id,
        rockId: rockActivity.rockId,
        rockTitle: rocks.title,
        actorName: users.name,
        kind: rockActivity.kind,
        payload: rockActivity.payload,
        createdAt: rockActivity.createdAt,
      })
      .from(rockActivity)
      .leftJoin(rocks, eq(rockActivity.rockId, rocks.id))
      .leftJoin(users, eq(rockActivity.actorId, users.id))
      .where(
        and(gte(rockActivity.createdAt, start), lte(rockActivity.createdAt, end))
      )
      .orderBy(rockActivity.createdAt),
  ]);

  return {
    startedAt: start,
    endedAt: meeting.endedAt,
    issuesCreated: issuesCreatedRows,
    issuesSolved: issuesSolvedRows,
    issuesDropped: issuesDroppedRows,
    todosCreated: todosCreatedRows,
    todosCompleted: todosCompletedRows,
    rockEvents: rockEventRows.map((r) => ({
      ...r,
      rockTitle: r.rockTitle ?? '(deleted rock)',
      payload: (r.payload ?? {}) as Record<string, unknown>,
    })),
  };
}
