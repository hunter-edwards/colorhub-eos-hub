'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { syncKnackToScorecard } from '@/server/knack-sync';

export function KnackSyncButton() {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncKnackToScorecard(13);
      if (result.ok) {
        toast.success(`Synced ${result.weeksUpdated} weeks from Knack`);
      } else {
        toast.error(result.error ?? 'Sync failed');
      }
    } catch {
      toast.error('Sync failed unexpectedly');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync from Knack'}
    </Button>
  );
}
