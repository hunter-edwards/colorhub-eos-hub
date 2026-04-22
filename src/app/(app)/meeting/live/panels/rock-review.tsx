'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { createRock, listRocks, listTeamMembers, updateRockStatus } from '@/server/rocks';
import { createIssue } from '@/server/issues';
import { UserAvatar } from '@/components/user-avatar';
import { currentQuarter } from '@/lib/quarters';

type Rock = {
  id: string;
  title: string;
  status: 'on_track' | 'off_track' | 'done';
  progressPct: number;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerId: string;
};

type Member = { id: string; name: string | null; email: string };

const STATUS_BADGE = {
  on_track: { label: 'On Track', variant: 'default' as const },
  off_track: { label: 'Off Track', variant: 'destructive' as const },
  done: { label: 'Done', variant: 'secondary' as const },
};

export function RockReviewPanel({ meetingId }: { meetingId: string }) {
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [adding, setAdding] = useState(false);
  const quarter = currentQuarter();

  useEffect(() => {
    Promise.all([listRocks(quarter), listTeamMembers()]).then(([r, m]) => {
      setRocks(r);
      setMembers(m);
    });
  }, [quarter]);

  async function toggle(rock: Rock, newStatus: 'on_track' | 'off_track' | 'done') {
    await updateRockStatus(rock.id, newStatus);
    if (newStatus === 'off_track') {
      await createIssue({
        title: `Off track: ${rock.title}`,
        ownerId: rock.ownerId,
      });
    }
    const updated = await listRocks(quarter);
    setRocks(updated);
  }

  async function handleAddRock(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newOwner || adding) return;
    setAdding(true);
    await createRock({
      title: newTitle.trim(),
      ownerId: newOwner,
      quarter,
    });
    setNewTitle('');
    setNewOwner('');
    setAdding(false);
    setRocks(await listRocks(quarter));
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleAddRock} className="flex gap-2 items-center pb-2">
        <Input
          placeholder={`Add rock for ${quarter}...`}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1"
        />
        <select
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Owner...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="sm"
          disabled={adding || !newTitle.trim() || !newOwner}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>
      {rocks.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No rocks this quarter.</p>
      )}
      {rocks.map((r) => {
        const info = STATUS_BADGE[r.status];
        return (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
            <div className="flex-1">
              <div className="text-sm font-medium">{r.title}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserAvatar user={{ name: r.ownerName }} size="sm" />
                {r.ownerName || r.ownerEmail} — {r.progressPct}%
              </div>
            </div>
            <div className="flex gap-1">
              {(['on_track', 'off_track', 'done'] as const)
                .filter((s) => s !== r.status)
                .map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggle(r, s)}
                  >
                    {STATUS_BADGE[s].label}
                  </Button>
                ))}
            </div>
            <Badge variant={info.variant}>{info.label}</Badge>
          </div>
        );
      })}
    </div>
  );
}
