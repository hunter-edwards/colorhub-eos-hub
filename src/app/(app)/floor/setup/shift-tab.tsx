export function ShiftTab() {
  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Shift windows</h2>
        <div className="rounded-md border p-4 space-y-1 text-sm">
          <div><span className="font-medium">1st Shift:</span> 07:00 — 15:00</div>
          <div><span className="font-medium">2nd Shift:</span> 15:00 — 23:00</div>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Huddle window</h2>
        <p className="text-sm">The dashboard auto-switches to &quot;Huddle&quot; mode within 10 minutes of each shift&apos;s start and end.</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">TV display preferences</h2>
        <p className="text-sm text-muted-foreground">No options yet.</p>
      </div>
      <p className="text-xs text-muted-foreground italic">Editing these settings will land in Phase 2.</p>
    </div>
  );
}
