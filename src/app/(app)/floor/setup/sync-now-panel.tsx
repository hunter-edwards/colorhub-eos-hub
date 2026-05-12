'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncNowAction } from './sync-now-action';

type Props = {
  lastSync: {
    syncedAt: string;
    status: 'ok' | 'error';
    errorMessage: string | null;
    inserted: number | null;
    hiddenSkipped: number | null;
  } | null;
};

export function SyncNowPanel({ lastSync }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await syncNowAction();
        toast.success(
          `Synced ${result.inserted} routings (${result.hiddenSkipped} hidden)`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown error';
        toast.error(`Sync failed: ${message}`);
      }
    });
  };

  return (
    <div className="flex items-center justify-between rounded-md border p-3 bg-muted/40">
      <div className="text-sm">
        {lastSync ? (
          lastSync.status === 'ok' ? (
            <span className="text-muted-foreground">
              Last sync ·{' '}
              {formatDistanceToNow(new Date(lastSync.syncedAt), { addSuffix: true })}
              {' · '}
              {lastSync.inserted ?? 0} routings
              {' · '}
              {lastSync.hiddenSkipped ?? 0} hidden
            </span>
          ) : (
            <span className="text-destructive">
              Last sync failed · {lastSync.errorMessage ?? 'unknown error'}
            </span>
          )
        ) : (
          <span className="text-muted-foreground">Never synced</span>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Syncing…' : 'Sync now'}
      </Button>
    </div>
  );
}
