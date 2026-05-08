'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { XIcon, PencilIcon } from 'lucide-react';
import type { Station } from '@/server/floor-stations';
import type { ShiftEvent } from '@/server/floor-events';
import type { FloorStationView } from '@/lib/floor-types';
import { progress } from '@/lib/floor-progress-utils';
import { assignOperatorAction, unassignOperatorAction } from '../floor-board-actions';
import { startJobAction } from '../floor-actions';

type PmRow = {
  pmId: string;
  level: 'green' | 'yellow' | 'red';
  daysUntilDue: number | null;
  nextDueAt: string | null;
  label: string;
};

type Operator = { id: string; name: string };
type Member = { id: string; name: string | null; email: string };

export type StationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  view: FloorStationView | null;
  shiftSessionId: string | null;
  events: ShiftEvent[];
  assignedOperators: Operator[];
  pmRows: PmRow[];
  members: Member[];
};

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

function statusPillClasses(status: 'running' | 'setup' | 'down' | 'idle'): string {
  switch (status) {
    case 'running':
      return 'bg-green-500/20 text-green-300 ring-1 ring-green-400/40';
    case 'setup':
      return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40';
    case 'down':
      return 'bg-red-500/20 text-red-300 ring-1 ring-red-400/40';
    case 'idle':
    default:
      return 'bg-white/10 text-white/60 ring-1 ring-white/15';
  }
}

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [active, intervalMs]);
  return now;
}

export function StationModal(props: StationModalProps) {
  const {
    open,
    onOpenChange,
    station,
    view,
    shiftSessionId,
    events,
    assignedOperators,
    pmRows,
    members,
  } = props;

  // Derive timing from events.
  const lastStarted = useMemo(() => {
    const ev = events.find((e) => e.kind === 'job_started');
    return ev ? new Date(ev.occurredAt as unknown as string) : null;
  }, [events]);

  const activePause = useMemo(() => {
    // Walk events newest→oldest; find latest job_paused that has no later job_resumed.
    const sorted = [...events].sort((a, b) => {
      const ta = new Date(a.occurredAt as unknown as string).getTime();
      const tb = new Date(b.occurredAt as unknown as string).getTime();
      return tb - ta;
    });
    for (const e of sorted) {
      if (e.kind === 'job_resumed') return null; // most recent state is resumed
      if (e.kind === 'job_paused') return e;
      if (e.kind === 'job_started' || e.kind === 'job_completed') return null;
    }
    return null;
  }, [events]);

  const tickingNow = useNow(open && !!lastStarted);
  const elapsedMs = lastStarted ? tickingNow - lastStarted.getTime() : 0;

  const current = view?.current ?? null;
  const sheetsProg = current
    ? progress({ completed: current.sheetsCompleted, needed: current.sheetsNeeded })
    : null;
  const receivedProg = current
    ? progress({ completed: current.sheetsReceived, needed: current.sheetsNeeded })
    : null;

  const status = view?.status ?? 'idle';

  const issuesFromKnack = current?.issueNotes ?? [];
  const noteEvents = events.filter((e) => e.kind === 'note' || e.kind === 'issue_noted');

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/70 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          data-floor-tv="true"
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--floor-bg)] text-[var(--floor-fg)] ring-1 ring-white/10 shadow-2xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          {/* Header strip */}
          <section data-section="header" className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[var(--floor-bg)] border-b border-white/10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="floor-display truncate">{station?.name ?? '—'}</div>
              <span className={`floor-chip px-3 py-1 rounded-full font-semibold whitespace-nowrap ${statusPillClasses(status)}`}>
                {status.toUpperCase()}
              </span>
            </div>
            <DialogPrimitive.Close
              className="rounded-md p-2 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <XIcon className="size-6" />
            </DialogPrimitive.Close>
          </section>

          {/* Now running */}
          <section data-section="now-running" className="px-6 py-5 border-b border-white/10">
            <div className="floor-header text-white/60 mb-2">Now running</div>
            {current && sheetsProg ? (
              <div className="flex flex-col gap-3">
                <div className="floor-display tabular-nums">{current.jobNumber}</div>
                <div className="floor-title text-white/80">
                  {current.customer} · {current.lineItem}
                </div>
                <div className="mt-1">
                  <div className="h-6 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full ${sheetsProg.isOver ? 'bg-violet-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, sheetsProg.pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="floor-title tabular-nums">
                      {formatNum(sheetsProg.completed)} / {formatNum(sheetsProg.needed)} sheets
                    </span>
                    <span className={`floor-title tabular-nums font-semibold ${sheetsProg.isOver ? 'text-violet-400' : 'text-white/80'}`}>
                      {sheetsProg.pct.toFixed(1)}%
                      {sheetsProg.isOver && (
                        <span className="ml-2 text-violet-400">
                          (+{formatNum(sheetsProg.overBy)} over)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 floor-chip text-white/70">
                    Waste: <span className="tabular-nums">{formatNum(current.wasteSheets)}</span>
                  </div>
                </div>
                {receivedProg && (
                  <div className="mt-2">
                    <div className="floor-chip text-white/60 mb-1">Received vs needed</div>
                    <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${Math.min(100, receivedProg.pct)}%` }}
                      />
                    </div>
                    <div className="floor-chip tabular-nums text-white/60 mt-1">
                      {formatNum(receivedProg.completed)} / {formatNum(receivedProg.needed)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="floor-title text-white/40">No current job</div>
            )}
          </section>

          {/* Status & timing */}
          <section data-section="status-timing" className="px-6 py-5 border-b border-white/10 grid grid-cols-3 gap-6">
            <div>
              <div className="floor-chip text-white/60 mb-1">Started</div>
              <div className="floor-title tabular-nums">
                {lastStarted ? lastStarted.toLocaleTimeString() : '—'}
              </div>
            </div>
            <div>
              <div className="floor-chip text-white/60 mb-1">Elapsed</div>
              <div className="floor-title tabular-nums">
                {lastStarted ? formatDuration(elapsedMs) : '—'}
              </div>
            </div>
            <div>
              <div className="floor-chip text-white/60 mb-1">Active pause</div>
              <div className="floor-title">
                {activePause ? (
                  <span className="text-amber-300">
                    {(activePause.payload as { reason?: string } | null)?.reason ?? 'paused'}
                  </span>
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </div>
            </div>
          </section>

          {/* Operators */}
          <section data-section="operators" className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="floor-header text-white/60">Operators</div>
              <OperatorPicker
                shiftSessionId={shiftSessionId}
                stationId={station?.id ?? null}
                stationName={station?.name ?? null}
                assigned={assignedOperators}
                members={members}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {assignedOperators.length === 0 && (
                <div className="floor-chip text-white/40">No operators assigned</div>
              )}
              {assignedOperators.map((op) => (
                <span
                  key={op.id}
                  className="floor-chip px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15"
                >
                  {op.name || 'Unknown'}
                </span>
              ))}
            </div>
          </section>

          {/* Up next */}
          <section data-section="queue" className="px-6 py-5 border-b border-white/10">
            <div className="floor-header text-white/60 mb-3">Up next</div>
            {view && view.queue.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {view.queue.slice(0, 5).map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="floor-title tabular-nums truncate">{j.jobNumber}</div>
                      <div className="floor-body text-white/70 truncate">
                        {j.customer} · {j.lineItem}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                      <div className="floor-chip tabular-nums text-white/70">
                        {formatNum(j.sheetsNeeded)} sheets
                      </div>
                      <div className="floor-chip text-white/50">{formatDate(j.dueDate)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="floor-body text-white/40">Queue empty</div>
            )}
          </section>

          {/* PM */}
          <section data-section="pm" className="px-6 py-5 border-b border-white/10">
            <div className="floor-header text-white/60 mb-3">Preventive maintenance</div>
            {pmRows.length === 0 ? (
              <div className="floor-body text-white/40">No PM schedules</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {pmRows.map((p) => (
                  <li
                    key={p.pmId}
                    className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="floor-title truncate">{p.label}</div>
                      <div className="floor-chip text-white/60">
                        Next due: {p.nextDueAt ? formatDate(p.nextDueAt) : '—'}
                        {p.daysUntilDue != null && (
                          <span className="ml-2">
                            {p.daysUntilDue < 0
                              ? `(overdue ${Math.abs(p.daysUntilDue)}d)`
                              : p.daysUntilDue === 0
                                ? '(due today)'
                                : `(in ${p.daysUntilDue}d)`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`floor-chip px-2 py-0.5 rounded-full font-semibold ${
                          p.level === 'red'
                            ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/40'
                            : p.level === 'yellow'
                              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
                              : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                        }`}
                      >
                        {p.level.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        disabled
                        className="floor-chip rounded-md bg-white/10 px-3 py-1 ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Mark PM done
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Issues / notes */}
          <section data-section="issues" className="px-6 py-5 border-b border-white/10">
            <div className="floor-header text-white/60 mb-3">Issues & notes</div>
            <div className="flex flex-col gap-2">
              {issuesFromKnack.map((text, i) => (
                <div
                  key={`k-${i}`}
                  className="floor-body rounded-md bg-amber-500/10 ring-1 ring-amber-400/30 px-3 py-2"
                >
                  {text}
                </div>
              ))}
              {noteEvents.map((e) => {
                const text =
                  ((e.payload as { text?: string } | null)?.text ?? '').toString() || '(no text)';
                return (
                  <div
                    key={e.id}
                    className="floor-body rounded-md bg-white/5 px-3 py-2"
                  >
                    <span className="floor-chip text-white/50 mr-2">
                      {e.kind === 'issue_noted' ? 'Issue' : 'Note'}
                    </span>
                    {text}
                  </div>
                );
              })}
              {issuesFromKnack.length === 0 && noteEvents.length === 0 && (
                <div className="floor-body text-white/40">No notes</div>
              )}
              <button
                type="button"
                disabled
                className="floor-chip self-start mt-1 rounded-md bg-white/10 px-3 py-1 ring-1 ring-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add note
              </button>
            </div>
          </section>

          {/* Quick action strip */}
          <QuickActionsBar
            shiftSessionId={shiftSessionId}
            stationId={station?.id ?? null}
            current={current}
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function QuickActionsBar({
  shiftSessionId,
  stationId,
  current,
}: {
  shiftSessionId: string | null;
  stationId: string | null;
  current: FloorStationView['current'];
}) {
  const [busy, setBusy] = useState(false);
  const canStart = !!shiftSessionId && !!stationId && !!current && !busy;

  async function onStart() {
    if (!canStart) return;
    setBusy(true);
    try {
      await startJobAction({
        shiftSessionId: shiftSessionId!,
        stationId: stationId!,
        knackJobId: current!.id ?? null,
        jobNumber: current!.jobNumber ?? null,
        customer: current!.customer ?? null,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-section="quick-actions"
      className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 px-6 py-4 bg-[var(--floor-bg)] border-t border-white/10"
    >
      <QuickActionButton label="Start job" disabled={!canStart} onClick={onStart} />
      <QuickActionButton label="Pause" disabled />
      <QuickActionButton label="Resume" disabled />
      <QuickActionButton label="Complete job" disabled />
      <QuickActionButton label="Log waste" disabled />
      <QuickActionButton label="Note issue" disabled />
      <QuickActionButton label="Mark PM done" disabled />
    </section>);
}

function QuickActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="floor-title rounded-lg bg-white/10 ring-1 ring-white/15 px-4 py-3 hover:bg-white/15 active:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

function OperatorPicker({
  shiftSessionId,
  stationId,
  stationName,
  assigned,
  members,
}: {
  shiftSessionId: string | null;
  stationId: string | null;
  stationName: string | null;
  assigned: Operator[];
  members: Member[];
}) {
  const [busy, setBusy] = useState(false);
  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.id)), [assigned]);

  if (!shiftSessionId || !stationId) {
    return (
      <button
        type="button"
        disabled
        className="floor-chip rounded-md bg-white/10 ring-1 ring-white/15 px-2 py-1 opacity-40"
        aria-label="Edit operators"
      >
        <PencilIcon className="size-4" />
      </button>
    );
  }

  async function toggleMember(memberId: string, name: string | null) {
    if (busy) return;
    setBusy(true);
    try {
      if (assignedIds.has(memberId)) {
        await unassignOperatorAction({
          shiftSessionId: shiftSessionId!,
          stationId: stationId!,
          userId: memberId,
        });
      } else {
        await assignOperatorAction({
          shiftSessionId: shiftSessionId!,
          stationId: stationId!,
          userId: memberId,
          fromStationId: null,
          fromStationName: null,
          toStationName: stationName,
          userName: name,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className="floor-chip rounded-md bg-white/10 ring-1 ring-white/15 px-2 py-1 hover:bg-white/15"
        aria-label="Edit operators"
      >
        <PencilIcon className="size-4" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" align="end" sideOffset={6} className="isolate z-[60]">
          <PopoverPrimitive.Popup
            data-floor-tv="true"
            className="z-[60] flex max-h-80 w-72 flex-col gap-1 overflow-y-auto rounded-md bg-[var(--floor-card)] p-2 ring-1 ring-white/15 shadow-xl outline-none"
          >
            {members.length === 0 && (
              <div className="floor-chip text-white/40 px-2 py-1">No members</div>
            )}
            {members.map((m) => {
              const isOn = assignedIds.has(m.id);
              return (
                <label
                  key={m.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    disabled={busy}
                    onChange={() => toggleMember(m.id, m.name)}
                  />
                  <span className="floor-body truncate">{m.name ?? m.email}</span>
                </label>
              );
            })}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
