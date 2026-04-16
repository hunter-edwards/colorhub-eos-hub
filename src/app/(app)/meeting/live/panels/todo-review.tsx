'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import { listOpenTodos, toggleTodo, carryOverTodo, dropTodo } from '@/server/todos';
import { UserAvatar } from '@/components/user-avatar';

type Todo = {
  id: string;
  title: string;
  dueDate: string;
  status: 'open' | 'done';
  ownerName: string | null;
  ownerEmail: string | null;
};

export function TodoReviewPanel({ meetingId }: { meetingId: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    listOpenTodos().then(setTodos);
  }, []);

  async function refresh() {
    setTodos(await listOpenTodos());
  }

  const today = new Date().toISOString().slice(0, 10);
  const due = todos.filter((t) => t.dueDate <= today);
  const upcoming = todos.filter((t) => t.dueDate > today);

  return (
    <div className="space-y-4">
      {due.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-red-600">Due / Overdue ({due.length})</h3>
          {due.map((t) => (
            <TodoRow key={t.id} todo={t} onAction={refresh} />
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Upcoming ({upcoming.length})</h3>
          {upcoming.map((t) => (
            <TodoRow key={t.id} todo={t} onAction={refresh} />
          ))}
        </div>
      )}
      {todos.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No open to-dos.</p>
      )}
    </div>
  );
}

function TodoRow({ todo, onAction }: { todo: Todo; onAction: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent group">
      <Checkbox
        checked={todo.status === 'done'}
        onCheckedChange={async () => {
          await toggleTodo(todo.id);
          onAction();
        }}
      />
      <span className="flex-1 text-sm">{todo.title}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <UserAvatar user={{ name: todo.ownerName }} size="sm" />
        {todo.ownerName || todo.ownerEmail}
      </span>
      <span className="text-xs text-muted-foreground">{todo.dueDate}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Carry over"
          onClick={async () => { await carryOverTodo(todo.id); onAction(); }}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Drop"
          onClick={async () => { await dropTodo(todo.id); onAction(); }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
