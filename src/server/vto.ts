'use server';

import { db } from '@/db';
import { vto, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

export async function getVTO() {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);
  const [record] = await db
    .select()
    .from(vto)
    .where(eq(vto.teamId, teamId));
  return record ?? null;
}

export async function saveVTO(data: {
  coreFocusPurpose?: string | null;
  coreFocusNiche?: string | null;
  tenYearTarget?: string | null;
  marketingStrategyTargetMarket?: string | null;
  marketingStrategyUniques?: string[] | null;
  marketingStrategyProvenProcess?: string | null;
  marketingStrategyGuarantee?: string | null;
  threeYearPictureDate?: string | null;
  threeYearPictureRevenue?: string | null;
  threeYearPictureProfit?: string | null;
  threeYearPictureMeasurables?: string[] | null;
  oneYearPlanDate?: string | null;
  oneYearPlanRevenue?: string | null;
  oneYearPlanProfit?: string | null;
  oneYearPlanGoals?: string[] | null;
}) {
  const user = await requireUser();
  const teamId = await getTeamId(user.id);

  await db
    .insert(vto)
    .values({ teamId, ...data })
    .onConflictDoUpdate({
      target: vto.teamId,
      set: { ...data },
    });

  revalidatePath('/vto');
}
