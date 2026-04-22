'use server';

import { db } from '@/db';
import { issues, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function createIssue(input: {
  title: string;
  description?: string;
  ownerId?: string;
  list?: 'short_term' | 'long_term';
  sourceMetricId?: string;
}) {
  await requireUser();
  const [created] = await db
    .insert(issues)
    .values({
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      list: input.list ?? 'short_term',
      sourceMetricId: input.sourceMetricId,
    })
    .returning();
  revalidatePath('/issues');
  revalidatePath('/meeting/live');
  return created;
}

/**
 * Create an issue unless an OPEN issue already exists for the same
 * sourceMetricId. Used by the scorecard panel to avoid flooding the
 * issues list when the same metric stays red week after week.
 */
export async function createIssueIfNotExists(input: {
  title: string;
  description?: string;
  ownerId?: string;
  list?: 'short_term' | 'long_term';
  sourceMetricId: string;
}) {
  await requireUser();
  const [existing] = await db
    .select()
    .from(issues)
    .where(and(eq(issues.status, 'open'), eq(issues.sourceMetricId, input.sourceMetricId)))
    .limit(1);
  if (existing) return { issue: existing, created: false as const };

  const [created] = await db
    .insert(issues)
    .values({
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      list: input.list ?? 'short_term',
      sourceMetricId: input.sourceMetricId,
    })
    .returning();
  revalidatePath('/issues');
  revalidatePath('/meeting/live');
  return { issue: created, created: true as const };
}

export async function listIssues(list?: 'short_term' | 'long_term') {
  const base = db
    .select({
      id: issues.id,
      title: issues.title,
      description: issues.description,
      ownerId: issues.ownerId,
      list: issues.list,
      status: issues.status,
      solvedAt: issues.solvedAt,
      createdAt: issues.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(issues)
    .leftJoin(users, eq(issues.ownerId, users.id));

  if (list) {
    return base.where(and(eq(issues.list, list), eq(issues.status, 'open')));
  }
  return base.where(eq(issues.status, 'open'));
}

export async function solveIssue(issueId: string) {
  await requireUser();
  await db
    .update(issues)
    .set({ status: 'solved', solvedAt: new Date() })
    .where(eq(issues.id, issueId));
  revalidatePath('/issues');
}

export async function dropIssue(issueId: string) {
  await requireUser();
  await db
    .update(issues)
    .set({ status: 'dropped', droppedAt: new Date() })
    .where(eq(issues.id, issueId));
  revalidatePath('/issues');
}

export async function moveList(issueId: string, list: 'short_term' | 'long_term') {
  await requireUser();
  await db.update(issues).set({ list }).where(eq(issues.id, issueId));
  revalidatePath('/issues');
}

/**
 * Per-week counts of issues opened vs solved across the last N weeks.
 * Week boundary = Monday 00:00 local.
 * Returns [{ weekStart: ISO date, opened: number, solved: number }, ...]
 * ordered oldest → newest.
 */
export async function getIssuesTrend(weekCount = 13): Promise<
  Array<{ weekStart: string; opened: number; solved: number }>
> {
  // Compute the N Monday starts ordered oldest → newest
  const now = new Date();
  const dow = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((dow + 6) % 7));
  thisMonday.setHours(0, 0, 0, 0);

  const weekStarts: Date[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setDate(thisMonday.getDate() - i * 7);
    weekStarts.push(d);
  }

  const startBoundary = weekStarts[0];

  // Pull all issues created since the window start OR solved since the window start
  const all = await db
    .select({
      createdAt: issues.createdAt,
      solvedAt: issues.solvedAt,
    })
    .from(issues);

  // Bucket into weeks
  function weekIndex(d: Date): number {
    const t = d.getTime();
    if (t < startBoundary.getTime()) return -1;
    // Each bucket is 7 days from weekStarts[i]
    for (let i = weekStarts.length - 1; i >= 0; i--) {
      if (t >= weekStarts[i].getTime()) return i;
    }
    return -1;
  }

  const buckets = weekStarts.map((ws) => ({
    weekStart: ws.toISOString().slice(0, 10),
    opened: 0,
    solved: 0,
  }));

  for (const row of all) {
    const createdIdx = weekIndex(row.createdAt);
    if (createdIdx >= 0) buckets[createdIdx].opened++;
    if (row.solvedAt) {
      const solvedIdx = weekIndex(row.solvedAt);
      if (solvedIdx >= 0) buckets[solvedIdx].solved++;
    }
  }

  return buckets;
}
