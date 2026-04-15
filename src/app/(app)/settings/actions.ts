'use server';
import { createClient } from '@/lib/supabase/server';

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
