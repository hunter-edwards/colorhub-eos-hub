import { db } from '@/db';
import { users, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'admin' | 'leader' | 'member';

const RANK: Record<UserRole, number> = { member: 0, leader: 1, admin: 2 };

export function atLeast(userRole: UserRole, required: UserRole): boolean {
  return RANK[userRole] >= RANK[required];
}

export async function upsertUser(authUser: { id: string; email: string }) {
  const existing = await db.select().from(users).where(eq(users.id, authUser.id));
  if (existing.length) return existing[0];

  const [team] = await db.select().from(teams).limit(1);
  if (!team) {
    throw new Error('No team found. Run `npm run db:seed` before first login.');
  }

  const [created] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email,
      teamId: team.id,
    })
    .onConflictDoNothing({ target: users.id })
    .returning();

  // If a concurrent request inserted first, `created` will be undefined — re-fetch.
  if (!created) {
    const [row] = await db.select().from(users).where(eq(users.id, authUser.id));
    return row;
  }
  return created;
}
