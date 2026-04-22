'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Users, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addAttendee, removeAttendee, listTeamUsers, getMeeting } from '@/server/meetings';

type Attendee = { id: string; name: string | null; email: string };
type TeamUser = { id: string; name: string | null; email: string };

export function AttendeesManager({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [candidates, setCandidates] = useState<TeamUser[]>([]);
  const [pending, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const [m, users] = await Promise.all([getMeeting(meetingId), listTeamUsers()]);
    if (m) setAttendees((m.attendees as Attendee[]) || []);
    setCandidates(users);
  }

  useEffect(() => {
    if (open) refresh();
  }, [open, meetingId]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const attendeeIds = new Set(attendees.map((a) => a.id));
  const missing = candidates.filter((u) => !attendeeIds.has(u.id));

  function handleAdd(userId: string) {
    startTransition(async () => {
      await addAttendee(meetingId, userId);
      await refresh();
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeAttendee(meetingId, userId);
      await refresh();
    });
  }

  return (
    <div className="relative" ref={popoverRef}>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <Users className="h-4 w-4 mr-1" /> Attendees ({attendees.length})
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 w-80 rounded-md border bg-popover p-3 shadow-md space-y-3">
          <div>
            <div className="text-xs font-medium mb-1 text-muted-foreground uppercase">Present</div>
            {attendees.length === 0 ? (
              <p className="text-xs text-muted-foreground">No one yet.</p>
            ) : (
              <ul className="space-y-1">
                {attendees.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span>{a.name ?? a.email}</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleRemove(a.id)}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                      aria-label={`Remove ${a.name ?? a.email}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {missing.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-1 text-muted-foreground uppercase">Add</div>
              <ul className="space-y-1 max-h-48 overflow-auto">
                {missing.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <span>{u.name ?? u.email}</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleAdd(u.id)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                      aria-label={`Add ${u.name ?? u.email}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
