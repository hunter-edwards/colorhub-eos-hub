import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome{user?.email ? `, ${user.email}` : ''}. The weekly scorecard, open rocks, and to-dos will land here in Phase 10.
      </p>
    </div>
  );
}
