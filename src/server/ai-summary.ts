'use server';

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db';
import {
  meetings,
  meetingRatings,
  headlines,
  rocks,
  rockActivity,
  todos,
  scorecardMetrics,
  scorecardEntries,
  users,
} from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getWeekStarts } from '@/lib/scorecard-utils';
import { evaluateEntry } from '@/lib/scorecard-utils';

const client = new Anthropic();

export type MeetingContext = {
  meetingDate: string;
  attendees: { name: string; rating: number }[];
  ratingAvg: number;
  scorecardReds: { metric: string; owner: string; value: number; goal: number }[];
  rockChanges: { title: string; owner: string; newStatus: string }[];
  headlines: { kind: 'customer' | 'employee'; text: string }[];
  issuesSolved: { title: string; toDosCreated: number }[];
  toDos: { title: string; owner: string; dueDate: string }[];
  cascadingMessage: string;
};

export async function collectMeetingContext(meetingId: string): Promise<MeetingContext> {
  const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));
  if (!meeting) throw new Error('Meeting not found');

  // Ratings
  const ratings = await db
    .select({ rating: meetingRatings.rating, name: users.name, email: users.email })
    .from(meetingRatings)
    .leftJoin(users, eq(meetingRatings.userId, users.id))
    .where(eq(meetingRatings.meetingId, meetingId));

  const ratingAvg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;

  // Headlines
  const hdls = await db
    .select({ kind: headlines.kind, text: headlines.text })
    .from(headlines)
    .where(eq(headlines.meetingId, meetingId));

  // Rock status changes during meeting
  const rockChanges = await db
    .select({
      title: rocks.title,
      ownerName: users.name,
      ownerEmail: users.email,
      payload: rockActivity.payload,
    })
    .from(rockActivity)
    .innerJoin(rocks, eq(rockActivity.rockId, rocks.id))
    .leftJoin(users, eq(rocks.ownerId, users.id))
    .where(
      and(
        eq(rockActivity.kind, 'status_change'),
        gte(rockActivity.createdAt, meeting.startedAt)
      )
    );

  // Scorecard reds for current week
  const [weekStart] = getWeekStarts(1);
  const metrics = await db.select().from(scorecardMetrics).where(eq(scorecardMetrics.active, true));
  const entries = await db
    .select()
    .from(scorecardEntries)
    .where(eq(scorecardEntries.weekStart, weekStart));

  const entryMap = new Map(entries.map((e) => [e.metricId, e.value]));
  const scorecardReds: MeetingContext['scorecardReds'] = [];
  for (const m of metrics) {
    const val = entryMap.get(m.id);
    if (val != null && evaluateEntry(m, Number(val)) === 'red') {
      const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, m.ownerId));
      scorecardReds.push({
        metric: m.name,
        owner: owner?.name ?? '',
        value: Number(val),
        goal: Number(m.goal ?? 0),
      });
    }
  }

  // To-dos created during meeting
  const meetingTodos = await db
    .select({ title: todos.title, dueDate: todos.dueDate, ownerName: users.name, ownerEmail: users.email })
    .from(todos)
    .leftJoin(users, eq(todos.ownerId, users.id))
    .where(eq(todos.sourceMeetingId, meetingId));

  return {
    meetingDate: meeting.startedAt.toISOString().slice(0, 10),
    attendees: ratings.map((r) => ({ name: r.name || r.email || 'Unknown', rating: r.rating })),
    ratingAvg: Number(ratingAvg.toFixed(1)),
    scorecardReds,
    rockChanges: rockChanges.map((r) => ({
      title: r.title,
      owner: r.ownerName || r.ownerEmail || '',
      newStatus: (r.payload as { status: string }).status,
    })),
    headlines: hdls.map((h) => ({ kind: h.kind, text: h.text })),
    issuesSolved: [],
    toDos: meetingTodos.map((t) => ({
      title: t.title,
      owner: t.ownerName || t.ownerEmail || '',
      dueDate: t.dueDate,
    })),
    cascadingMessage: meeting.cascadingMessage ?? '',
  };
}

export async function generateSummary(ctx: MeetingContext): Promise<string> {
  const stableContext = `Team: Colorhub. This is an EOS L10 weekly meeting summary.
Current rocks: ${ctx.rockChanges.map((r) => r.title).join(', ') || 'none reported'}`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: 'You are an EOS meeting summarizer. Output concise markdown. No preamble, no fluff. Use these sections: ## Meeting Health, ## Scorecard, ## Rock Pulse, ## Issues Solved, ## Action Items, ## Cascading Message.',
      },
      {
        type: 'text',
        text: stableContext,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Summarize this L10 meeting:\n\n${JSON.stringify(ctx, null, 2)}`,
      },
    ],
  });

  const block = msg.content[0];
  return block.type === 'text' ? block.text : '';
}
