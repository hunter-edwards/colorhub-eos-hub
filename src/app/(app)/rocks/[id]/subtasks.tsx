'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { addSubtask, toggleSubtask, deleteSubtask } from '@/server/rocks';

type SubtaskRow = {
  id: string;
  rockId: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  orderIdx: number;
};

export function Subtasks({
  rockId,
  subtasks,
}: {
  rockId: string;
  subtasks: SubtaskRow[];
}) {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Subtasks</h2>

      <div className="space-y-1">
        {subtasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No subtasks yet.</p>
        )}
        {subtasks.map((st) => (
          <div
            key={st.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent group"
          >
            <Checkbox
              checked={st.done}
              onCheckedChange={() => toggleSubtask(st.id)}
            />
            <span
              className={`flex-1 text-sm ${st.done ? 'line-through text-muted-foreground' : ''}`}
            >
              {st.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => deleteSubtask(st.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          setAdding(true);
          await addSubtask(rockId, newTitle.trim());
          setNewTitle('');
          setAdding(false);
        }}
      >
        <Input
          placeholder="Add subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={adding || !newTitle.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </form>
    </div>
  );
}
