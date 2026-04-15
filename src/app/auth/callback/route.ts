import { createClient } from '@/lib/supabase/server';
import { upsertUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        try {
          await upsertUser({ id: user.id, email: user.email });
        } catch (e) {
          console.error('upsertUser failed:', e);
          // Don't block login on DB issue — the auth session is set; user can retry by reloading
        }
      }
    }
  }
  return NextResponse.redirect(`${origin}/`);
}
