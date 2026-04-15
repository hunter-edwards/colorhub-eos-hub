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
