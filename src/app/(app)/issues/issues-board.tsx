'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckCircle, Trash2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import {
  createIssue,
  solveIssue,
  dropIssue,
  moveList,
} from '@/server/issues';

type Issue = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string | null;
  list: 'short_term' | 'long_term';
  status: 'open' | 'solved' | 'dropped';
  solvedAt: Date | null;
  createdAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

function IssueRow({ issue }: { issue: Issue }) {
  const target = issue.list === 'short_term' ? 'long_term' : 'short_term';
  const MoveIcon = issue.list === 'short_term' ? ArrowRight : ArrowLeft;
  const moveLabel = issue.list === 'short_term' ? 'Move to Long-Term' : 'Move to Short-Term';

  return (
    <div className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent group">
      <span className="flex-1 text-sm">{issue.title}</span>
      {issue.ownerName || issue.ownerEmail ? (
        <span className="text-xs text-muted-foreground">
          {issue.ownerName || issue.ownerEmail}
        </span>
      ) : null}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title={moveLabel}
          onClick={() => moveList(issue.id, target)}
        >
          <MoveIcon className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-green-600"
          title="Solve"
          onClick={() => solveIssue(issue.id)}
        >
          <CheckCircle className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Drop"
          onClick={() => dropIssue(issue.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function AddIssueForm({
  list,
  members,
}: {
  list: 'short_term' | 'long_term';
  members: Member[];
}) {
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [adding, setAdding] = useState(false);

  return (
    <form
      className="flex gap-2 items-center"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setAdding(true);
        await createIssue({
          title: title.trim(),
          ownerId: ownerId || undefined,
          list,
        });
        setTitle('');
        setOwnerId('');
        setAdding(false);
      }}
    >
      <Input
        placeholder="Add issue..."
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
  );
}

export function IssuesBoard({
  shortTerm,
  longTerm,
  members,
}: {
  shortTerm: Issue[];
  longTerm: Issue[];
  members: Member[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="font-semibold">Short-Term</h2>
        <AddIssueForm list="short_term" members={members} />
        {shortTerm.length === 0 && (
          <EmptyState icon={AlertCircle} title="No open issues" />
        )}
        {shortTerm.map((issue) => (
          <IssueRow key={issue.id} issue={issue} />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Long-Term</h2>
        <AddIssueForm list="long_term" members={members} />
        {longTerm.length === 0 && (
          <EmptyState icon={AlertCircle} title="No open issues" />
        )}
        {longTerm.map((issue) => (
          <IssueRow key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}
