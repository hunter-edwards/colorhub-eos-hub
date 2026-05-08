'use server';
import { db } from '@/db';
import { teams } from '@/db/schema';

let cached: string | null = null;

export async function getCurrentTeamId(): Promise<string> {
  if (cached) return cached;
  const [team] = await db.select({ id: teams.id }).from(teams).limit(1);
  if (!team) throw new Error('No team found — run db:seed first');
  cached = team.id;
  return cached;
}
