'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { createIssue, listIssues } from '@/server/issues';
import { listTeamMembers } from '@/server/rocks';
import { UserAvatar } from '@/components/user-avatar';

type Issue = {
  id: string;
  title: string;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

export function PrepIssuesPanel() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([listIssues(), listTeamMembers()]).then(([i, m]) => {
      setIssues(i);
      setMembers(m);
    });
  }, []);

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2 items-center"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || adding) return;
          setAdding(true);
          await createIssue({
            title: title.trim(),
            ownerId: ownerId || undefined,
          });
          setTitle('');
          setOwnerId('');
          setAdding(false);
          setIssues(await listIssues());
        }}
      >
        <Input
          placeholder="Add issue for the next meeting..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
        />
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Owner...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={adding || !title.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </form>

      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open issues yet.</p>
      ) : (
        <ul className="space-y-1">
          {issues.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 text-sm"
            >
              <span className="flex-1">{i.title}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserAvatar user={{ name: i.ownerName }} size="sm" />
                {i.ownerName || i.ownerEmail || 'Unassigned'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
