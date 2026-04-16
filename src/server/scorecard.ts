'use server';

import { db } from '@/db';
import { scorecardMetrics, scorecardEntries, users } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function createMetric(input: {
  name: string;
  ownerId: string;
  goal?: string;
  comparator?: 'gte' | 'lte' | 'eq' | 'range';
  goalMin?: string;
  goalMax?: string;
  unit?: string;
}) {
  await requireUser();
  const [created] = await db
    .insert(scorecardMetrics)
    .values({
      name: input.name,
      ownerId: input.ownerId,
      goal: input.goal,
      comparator: input.comparator ?? 'gte',
      goalMin: input.goalMin,
      goalMax: input.goalMax,
      unit: input.unit,
    })
    .returning();
  revalidatePath('/scorecard');
  return created;
}

export async function listMetrics() {
  return db
    .select({
      id: scorecardMetrics.id,
      name: scorecardMetrics.name,
      ownerId: scorecardMetrics.ownerId,
      goal: scorecardMetrics.goal,
      comparator: scorecardMetrics.comparator,
      goalMin: scorecardMetrics.goalMin,
      goalMax: scorecardMetrics.goalMax,
      unit: scorecardMetrics.unit,
      orderIdx: scorecardMetrics.orderIdx,
      active: scorecardMetrics.active,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(scorecardMetrics)
    .leftJoin(users, eq(scorecardMetrics.ownerId, users.id))
    .where(eq(scorecardMetrics.active, true));
}

export async function listEntries(weekStart: string, weekCount: number) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() - (weekCount - 1) * 7);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return db
    .select()
    .from(scorecardEntries)
    .where(
      and(
        gte(scorecardEntries.weekStart, endStr),
        lte(scorecardEntries.weekStart, startStr)
      )
    );
}

export async function setEntry(
  metricId: string,
  weekStart: string,
  value: string
) {
  await requireUser();
  await db
    .insert(scorecardEntries)
    .values({ metricId, weekStart, value })
    .onConflictDoUpdate({
      target: [scorecardEntries.metricId, scorecardEntries.weekStart],
      set: { value },
    });
  revalidatePath('/scorecard');
}

export async function updateMetric(
  metricId: string,
  input: {
    name?: string;
    ownerId?: string;
    goal?: string | null;
    comparator?: 'gte' | 'lte' | 'eq' | 'range';
    goalMin?: string | null;
    goalMax?: string | null;
    unit?: string | null;
  }
) {
  await requireUser();
  await db
    .update(scorecardMetrics)
    .set(input)
    .where(eq(scorecardMetrics.id, metricId));
  revalidatePath('/scorecard');
}

export async function deleteMetric(metricId: string) {
  await requireUser();
  await db.delete(scorecardMetrics).where(eq(scorecardMetrics.id, metricId));
  revalidatePath('/scorecard');
}
