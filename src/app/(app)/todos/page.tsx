import { listOpenTodos } from '@/server/todos';
import { listTeamMembers } from '@/server/rocks';
import { createClient } from '@/lib/supabase/server';
import { TodosList } from './todos-list';

export default async function TodosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [allTodos, members] = await Promise.all([
    listOpenTodos(),
    listTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">To-Dos</h1>
      <TodosList
        todos={allTodos}
        members={members}
        currentUserId={user?.id ?? ''}
      />
    </div>
  );
}
