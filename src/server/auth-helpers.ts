import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { atLeast, type UserRole } from '@/lib/auth';

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function getCurrentUserRole(): Promise<UserRole> {
  const authUser = await requireUser();
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, authUser.id));
  if (!row) throw new Error('User row not found');
  return row.role;
}

export async function requireRole(required: UserRole) {
  const authUser = await requireUser();
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, authUser.id));
  if (!row) throw new Error('User row not found');
  if (!atLeast(row.role, required)) {
    throw new Error(`Not authorized: requires ${required} role`);
  }
  return { user: authUser, role: row.role };
}
