'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { listMetrics, listEntries, setEntry } from '@/server/scorecard';
import { getWeekStarts, evaluateEntry } from '@/lib/scorecard-utils';
import { createIssue } from '@/server/issues';
import { UserAvatar } from '@/components/user-avatar';

type Metric = {
  id: string;
  name: string;
  goal: string | null;
  comparator: 'gte' | 'lte' | 'eq' | 'range';
  goalMin: string | null;
  goalMax: string | null;
  unit: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerId: string;
};

type Entry = { metricId: string; weekStart: string; value: string | null };

export function ScorecardPanel({ meetingId }: { meetingId: string }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [week] = useState(() => getWeekStarts(1)[0]);

  useEffect(() => {
    Promise.all([listMetrics(), listEntries(week, 1)]).then(([m, e]) => {
      setMetrics(m);
      setEntries(e);
    });
  }, [week]);

  const entryMap = new Map(entries.map((e) => [e.metricId, e.value]));

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">Week of {week}</p>
      {metrics.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No metrics configured.</p>
      )}
      {metrics.map((m) => {
        const val = entryMap.get(m.id);
        const color = val != null && val !== '' ? evaluateEntry(m, Number(val)) : null;
        return (
          <div
            key={m.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              color === 'red' ? 'bg-red-100 dark:bg-red-900/30' : color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-accent/50'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium">{m.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserAvatar user={{ name: m.ownerName }} size="sm" />
                {m.ownerName || m.ownerEmail}
              </div>
            </div>
            <input
              type="number"
              step="any"
              className="w-20 h-7 px-2 text-sm text-center border rounded bg-background"
              defaultValue={val ?? ''}
              onBlur={async (e) => {
                if (e.target.value !== (val ?? '')) {
                  await setEntry(m.id, week, e.target.value);
                  const updated = await listEntries(week, 1);
                  setEntries(updated);
                }
              }}
            />
            <span className="text-xs text-muted-foreground w-8">{m.unit ?? ''}</span>
            {color === 'red' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={async () => {
                  await createIssue({
                    title: `Scorecard: ${m.name} missed goal`,
                    ownerId: m.ownerId,
                  });
                }}
              >
                <AlertCircle className="h-3 w-3 mr-1" /> Issue
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
