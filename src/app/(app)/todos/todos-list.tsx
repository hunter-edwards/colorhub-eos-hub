'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, RotateCcw, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { createTodo, toggleTodo, dropTodo, carryOverTodo } from '@/server/todos';

type Todo = {
  id: string;
  title: string;
  ownerId: string;
  dueDate: string;
  status: 'open' | 'done';
  createdAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

function daysLeft(dueDate: string): { text: string; overdue: boolean } {
  const due = new Date(dueDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { text: 'Due today', overdue: true };
  if (diff === 1) return { text: 'Tomorrow', overdue: false };
  return { text: `${diff}d left`, overdue: false };
}

function TodoRow({ todo }: { todo: Todo }) {
  const dl = daysLeft(todo.dueDate);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(todo.status);
  const [, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent group">
      <Checkbox
        checked={optimisticStatus === 'done'}
        onCheckedChange={() => {
          startTransition(async () => {
            setOptimisticStatus(optimisticStatus === 'done' ? 'open' : 'done');
            await toggleTodo(todo.id);
          });
        }}
      />
      <span className={`flex-1 text-sm ${optimisticStatus === 'done' ? 'line-through text-muted-foreground' : ''}`}>
        {todo.title}
      </span>
      <span className="text-xs text-muted-foreground">
        {todo.ownerName || todo.ownerEmail}
      </span>
      <span className={`text-xs ${dl.overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
        {dl.text}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Carry over (+7 days)"
          onClick={async () => {
            await carryOverTodo(todo.id);
            toast.success('To-do carried over (+7 days)');
          }}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Drop"
          onClick={async () => {
            await dropTodo(todo.id);
            toast.success('To-do dropped');
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function AddTodoForm({ members }: { members: Member[] }) {
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [adding, setAdding] = useState(false);

  return (
    <form
      className="flex gap-2 items-center"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || !ownerId) return;
        setAdding(true);
        await createTodo({ title: title.trim(), ownerId });
        setTitle('');
        setAdding(false);
        toast.success('To-do added');
      }}
    >
      <Input
        placeholder="Add to-do..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <select
        value={ownerId}
        onChange={(e) => setOwnerId(e.target.value)}
        required
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
      >
        <option value="">Owner...</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name || m.email}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={adding || !title.trim() || !ownerId}>
        <Plus className="h-4 w-4 mr-1" /> Add
      </Button>
    </form>
  );
}

export function TodosList({
  todos,
  members,
  currentUserId,
}: {
  todos: Todo[];
  members: Member[];
  currentUserId: string;
}) {
  const myTodos = todos.filter((t) => t.ownerId === currentUserId);
  const sortByDue = (a: Todo, b: Todo) => a.dueDate.localeCompare(b.dueDate);

  return (
    <Tabs defaultValue={0}>
      <TabsList>
        <TabsTrigger value={0}>My To-Dos ({myTodos.length})</TabsTrigger>
        <TabsTrigger value={1}>All Team ({todos.length})</TabsTrigger>
      </TabsList>

      <TabsContent value={0} className="space-y-4">
        <AddTodoForm members={members} />
        {myTodos.length === 0 && (
          <EmptyState icon={CheckCircle2} title="All caught up!" description="No open to-dos" />
        )}
        {myTodos.sort(sortByDue).map((todo) => (
          <TodoRow key={todo.id} todo={todo} />
        ))}
      </TabsContent>

      <TabsContent value={1} className="space-y-4">
        <AddTodoForm members={members} />
        {todos.length === 0 && (
          <EmptyState icon={CheckCircle2} title="All caught up!" description="No open to-dos" />
        )}
        {[...todos].sort(sortByDue).map((todo) => (
          <TodoRow key={todo.id} todo={todo} />
        ))}
      </TabsContent>
    </Tabs>
  );
}
