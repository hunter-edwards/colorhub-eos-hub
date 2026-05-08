'use client';

import { useState, useTransition } from 'react';
import { saveHandoffNotesAction } from './handoff-actions';

export function HandoffNotesEditor({
  shiftSessionId,
  initialNotes,
  readOnly,
}: {
  shiftSessionId: string;
  initialNotes: string;
  readOnly: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  if (readOnly) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Read-only — this shift closed more than 4 hours ago.
        </p>
        <div className="min-h-[6rem] whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
          {initialNotes || (
            <span className="text-muted-foreground">No notes were saved.</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Notes for the next shift…"
        className="w-full rounded-md border bg-background p-3 text-sm"
        disabled={isPending}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || notes === initialNotes}
          onClick={() => {
            startTransition(async () => {
              await saveHandoffNotesAction(shiftSessionId, notes);
              setSavedAt(new Date());
            });
          }}
          className="rounded border bg-background px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save notes'}
        </button>
        {savedAt && !isPending && (
          <span className="text-xs text-muted-foreground">
            Saved at {savedAt.toLocaleTimeString('en-US')}
          </span>
        )}
      </div>
    </div>
  );
}
