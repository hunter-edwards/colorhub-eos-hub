'use server';

import { db } from '@/db';
import { peopleRatings, coreValues, users } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

async function getTeamId(userId: string) {
  const [dbUser] = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(eq(users.id, userId));
  if (!dbUser?.teamId) throw new Error('No team found');
  return dbUser.teamId;
}

export async function listPeopleRatings(quarter: string) {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);
  return db
    .select()
    .from(peopleRatings)
    .where(and(eq(peopleRatings.teamId, teamId), eq(peopleRatings.quarter, quarter)));
}

export async function setRating(input: {
  subjectId: string;
  coreValueId?: string;
  gwcField?: string;
  rating: 'plus' | 'plus_minus' | 'minus';
  quarter: string;
}) {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);

  await db
    .insert(peopleRatings)
    .values({
      teamId,
      subjectId: input.subjectId,
      coreValueId: input.coreValueId ?? null,
      gwcField: input.gwcField ?? null,
      rating: input.rating,
      quarter: input.quarter,
    })
    .onConflictDoUpdate({
      target: [peopleRatings.subjectId, peopleRatings.coreValueId, peopleRatings.gwcField, peopleRatings.quarter],
      set: { rating: input.rating },
    });

  revalidatePath('/people');
}

export async function listTeamMembersWithDetails() {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);
  return db
    .select({
      id: users.id,
      name: users.name,
      profileColor: users.profileColor,
    })
    .from(users)
    .where(eq(users.teamId, teamId));
}

export async function listTeamCoreValues() {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);
  return db
    .select({
      id: coreValues.id,
      title: coreValues.title,
    })
    .from(coreValues)
    .where(and(eq(coreValues.teamId, teamId), eq(coreValues.active, true)))
    .orderBy(asc(coreValues.orderIdx));
}
