'use server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function signInWithMagicLink(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim();
  if (!email) return { error: 'Email is required' };

  const h = await headers();
  const origin = h.get('origin') ?? h.get('referer')?.replace(/\/login\/?$/, '') ?? 'http://localhost:3000';

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  return error ? { error: error.message } : { ok: true as const };
}

export async function signInWithPassword(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim();
  const password = formData.get('password') as string | null;
  if (!email || !password) return { error: 'Email and password are required' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Supabase returns generic "Invalid login credentials" for unknown email OR wrong password OR user has no password set yet.
    // Keep the message generic to avoid account-enumeration.
    return { error: 'Invalid email or password. If you haven\'t set a password yet, use the Magic Link tab first.' };
  }
  return { ok: true as const };
}
