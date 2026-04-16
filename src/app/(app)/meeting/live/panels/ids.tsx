'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus } from 'lucide-react';
import { listIssues, solveIssue, createIssue } from '@/server/issues';
import { createTodo } from '@/server/todos';
import { listTeamMembers } from '@/server/rocks';
import { UserAvatar } from '@/components/user-avatar';

type Issue = {
  id: string;
  title: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

export function IDSPanel({ meetingId }: { meetingId: string }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [discussing, setDiscussing] = useState<string | null>(null);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoOwner, setTodoOwner] = useState('');

  useEffect(() => {
    Promise.all([listIssues(), listTeamMembers()]).then(([i, m]) => {
      setIssues(i);
      setMembers(m);
    });
  }, []);

  async function refresh() {
    setIssues(await listIssues());
  }

  const active = issues.find((i) => i.id === discussing);

  return (
    <div className="flex gap-6 h-full">
      {/* Issue list */}
      <div className="w-1/2 space-y-2 overflow-auto">
        <p className="text-xs text-muted-foreground">
          Identify, Discuss, Solve — click an issue to discuss.
        </p>
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => setDiscussing(issue.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm ${
              discussing === issue.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            <span className="flex-1">{issue.title}</span>
            <span className="flex items-center gap-1 text-xs opacity-70">
              <UserAvatar user={{ name: issue.ownerName }} size="sm" />
              {issue.ownerName || issue.ownerEmail || ''}
            </span>
          </div>
        ))}
        {issues.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No open issues.</p>
        )}
      </div>

      {/* Discussion pane */}
      <div className="w-1/2 space-y-4">
        {active ? (
          <>
            <div>
              <h3 className="font-medium">{active.title}</h3>
              <p className="text-xs text-muted-foreground">
                Owner: <UserAvatar user={{ name: active.ownerName }} size="sm" className="inline-block mx-1" />{active.ownerName || active.ownerEmail || 'Unassigned'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Create To-Do from this issue:</p>
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!todoTitle.trim() || !todoOwner) return;
                  await createTodo({
                    title: todoTitle.trim(),
                    ownerId: todoOwner,
                    sourceMeetingId: meetingId,
                  });
                  setTodoTitle('');
                }}
              >
                <Input
                  placeholder="To-do title..."
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={todoOwner}
                  onChange={(e) => setTodoOwner(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">Owner...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name || m.email}</option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={!todoTitle.trim() || !todoOwner}>
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <Button
              className="w-full"
              onClick={async () => {
                await solveIssue(active.id);
                setDiscussing(null);
                await refresh();
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Mark Solved
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Select an issue to discuss.
          </p>
        )}
      </div>
    </div>
  );
}
