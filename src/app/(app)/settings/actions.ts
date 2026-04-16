'use server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { teamSettings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { postToTeams } from '@/server/teams-webhook';

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
