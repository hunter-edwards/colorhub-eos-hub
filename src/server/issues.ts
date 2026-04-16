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
}) {
  await requireUser();
  const [created] = await db
    .insert(issues)
    .values({
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      list: input.list ?? 'short_term',
    })
    .returning();
  revalidatePath('/issues');
  return created;
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
    .set({ status: 'dropped' })
    .where(eq(issues.id, issueId));
  revalidatePath('/issues');
}

export async function moveList(issueId: string, list: 'short_term' | 'long_term') {
  await requireUser();
  await db.update(issues).set({ list }).where(eq(issues.id, issueId));
  revalidatePath('/issues');
}
