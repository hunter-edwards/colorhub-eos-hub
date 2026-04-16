'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { listRocks, updateRockStatus } from '@/server/rocks';
import { createIssue } from '@/server/issues';
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

const STATUS_BADGE = {
  on_track: { label: 'On Track', variant: 'default' as const },
  off_track: { label: 'Off Track', variant: 'destructive' as const },
  done: { label: 'Done', variant: 'secondary' as const },
};

export function RockReviewPanel({ meetingId }: { meetingId: string }) {
  const [rocks, setRocks] = useState<Rock[]>([]);
  const quarter = currentQuarter();

  useEffect(() => {
    listRocks(quarter).then(setRocks);
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

  return (
    <div className="space-y-2">
      {rocks.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No rocks this quarter.</p>
      )}
      {rocks.map((r) => {
        const info = STATUS_BADGE[r.status];
        return (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
            <div className="flex-1">
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">
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
