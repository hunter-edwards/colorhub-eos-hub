'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, History } from 'lucide-react';
import { toast } from 'sonner';
import { syncKnackToScorecard } from '@/server/knack-sync';

export function KnackSyncButton() {
  const [mode, setMode] = useState<null | 'quick' | 'backfill'>(null);

  async function runSync(label: 'quick' | 'backfill', weekCount: number) {
    setMode(label);
    try {
      const result = await syncKnackToScorecard(weekCount);
      if (result.ok) {
        toast.success(
          result.weeksUpdated === 1
            ? 'Synced latest week from Knack'
            : `Synced ${result.weeksUpdated} weeks from Knack`
        );
      } else {
        toast.error(result.error ?? 'Sync failed');
      }
    } catch {
      toast.error('Sync failed unexpectedly');
    } finally {
      setMode(null);
    }
  }

  const busy = mode !== null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => runSync('quick', 1)}
        disabled={busy}
        title="Pull just the most recent completed week"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${mode === 'quick' ? 'animate-spin' : ''}`} />
        {mode === 'quick' ? 'Syncing…' : 'Sync latest'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => runSync('backfill', 13)}
        disabled={busy}
        title="Rebuild all 13 weeks — slower"
      >
        <History className={`h-4 w-4 mr-1 ${mode === 'backfill' ? 'animate-spin' : ''}`} />
        {mode === 'backfill' ? 'Backfilling…' : 'Backfill 13w'}
      </Button>
    </div>
  );
}
