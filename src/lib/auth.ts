import { db } from '@/db';
import { users, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function upsertUser(authUser: { id: string; email: string }) {
  const existing = await db.select().from(users).where(eq(users.id, authUser.id));
  if (existing.length) return existing[0];

  const [team] = await db.select().from(teams).limit(1);
  const [created] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email,
      teamId: team?.id,
    })
    .returning();
  return created;
}
