'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function SeguePanel({ meetingId }: { meetingId: string }) {
  const [entries, setEntries] = useState<{ name: string; text: string }[]>([
    { name: '', text: '' },
  ]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Share one personal and one professional good news.
      </p>
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Name"
            className="w-32"
            value={entry.name}
            onChange={(e) => {
              const next = [...entries];
              next[i] = { ...next[i], name: e.target.value };
              setEntries(next);
            }}
          />
          <Input
            placeholder="Good news..."
            className="flex-1"
            value={entry.text}
            onChange={(e) => {
              const next = [...entries];
              next[i] = { ...next[i], text: e.target.value };
              if (i === entries.length - 1 && e.target.value) {
                next.push({ name: '', text: '' });
              }
              setEntries(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}
