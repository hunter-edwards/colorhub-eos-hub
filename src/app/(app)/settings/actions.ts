'use server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { teamSettings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { postToTeams } from '@/server/teams-webhook';
import { revalidatePath } from 'next/cache';

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string | null;
  const confirm = formData.get('confirm') as string | null;

  if (!password) return { error: 'Password is required' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };
  if (password !== confirm) return { error: 'Passwords do not match' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { ok: true as const };
}

async function getTeamId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const [dbUser] = await db.select({ teamId: users.teamId }).from(users).where(eq(users.id, user.id));
  return dbUser?.teamId;
}

export async function getWebhookUrl() {
  const teamId = await getTeamId();
  if (!teamId) return null;
  const [row] = await db.select().from(teamSettings).where(eq(teamSettings.teamId, teamId));
  return row?.teamsWebhookUrl ?? null;
}

export async function saveWebhookUrl(url: string) {
  const teamId = await getTeamId();
  if (!teamId) return { error: 'No team found' };

  const trimmed = url.trim();
  if (trimmed && !trimmed.startsWith('https://')) {
    return { error: 'Webhook URL must start with https://' };
  }

  await db
    .insert(teamSettings)
    .values({ teamId, teamsWebhookUrl: trimmed || null })
    .onConflictDoUpdate({
      target: teamSettings.teamId,
      set: { teamsWebhookUrl: trimmed || null },
    });

  return { ok: true as const };
}

export async function testWebhook() {
  const teamId = await getTeamId();
  if (!teamId) return { error: 'No team found' };

  const [row] = await db.select().from(teamSettings).where(eq(teamSettings.teamId, teamId));
  if (!row?.teamsWebhookUrl) return { error: 'No webhook URL configured' };

  const testCtx = {
    meetingDate: new Date().toISOString().slice(0, 10),
    attendees: [{ name: 'Test User', rating: 10 }],
    ratingAvg: 10,
    scorecardReds: [],
    rockChanges: [],
    headlines: [],
    issuesSolved: [],
    toDos: [],
    cascadingMessage: 'This is a test post from Colorhub EOS Hub.',
  };

  const result = await postToTeams(
    testCtx,
    '## Test Post\nThis is a test message from your EOS Hub. If you see this, the webhook is working!',
    row.teamsWebhookUrl,
  );

  if (result.ok) return { ok: true as const };
  return { error: result.error };
}

// --- Profile actions ---

async function requireUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getProfile() {
  const userId = await requireUserId();
  const [row] = await db
    .select({
      name: users.name,
      avatarUrl: users.avatarUrl,
      profileColor: users.profileColor,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? { name: null, avatarUrl: null, profileColor: null };
}

export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  const name = (formData.get('name') as string | null)?.trim() || null;
  const avatarUrl = (formData.get('avatarUrl') as string | null)?.trim() || null;
  const profileColor = (formData.get('profileColor') as string | null)?.trim() || null;

  if (avatarUrl && !avatarUrl.startsWith('https://')) {
    return { error: 'Avatar URL must start with https://' };
  }

  await db
    .update(users)
    .set({ name, avatarUrl, profileColor })
    .where(eq(users.id, userId));

  revalidatePath('/settings');
  return { ok: true as const };
}
