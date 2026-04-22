'use client';

import { useState, useTransition } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { setRsvp, type RsvpStatus } from '@/server/rsvp';
import { cn } from '@/lib/utils';

type Props = {
  meetingId: string;
  initialStatus: RsvpStatus | null;
  counts: { attending: number; declined: number; tentative: number };
};

const OPTIONS: { value: RsvpStatus; label: string; icon: typeof Check }[] = [
  { value: 'attending', label: 'Attending', icon: Check },
  { value: 'tentative', label: 'Tentative', icon: HelpCircle },
  { value: 'declined', label: 'Declined', icon: X },
];

export function RsvpPills({ meetingId, initialStatus, counts }: Props) {
  const [status, setStatus] = useState<RsvpStatus | null>(initialStatus);
  const [localCounts, setLocalCounts] = useState(counts);
  const [pending, startTransition] = useTransition();

  function handleSelect(next: RsvpStatus) {
    if (pending || next === status) return;
    const prev = status;
    const optimistic = { ...localCounts };
    if (prev) optimistic[prev] = Math.max(0, optimistic[prev] - 1);
    optimistic[next] = optimistic[next] + 1;
    setStatus(next);
    setLocalCounts(optimistic);
    startTransition(async () => {
      try {
        await setRsvp(meetingId, next);
      } catch {
        setStatus(prev);
        setLocalCounts(counts);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={pending}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted',
                pending && 'opacity-60'
              )}
            >
              <Icon className="h-3 w-3" />
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground">
        {localCounts.attending} going · {localCounts.tentative} tentative ·{' '}
        {localCounts.declined} declined
      </div>
    </div>
  );
}
