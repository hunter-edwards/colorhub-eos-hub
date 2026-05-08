'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import type { TaskRow } from '@/server/floor-tasks';
import {
  archiveTaskFromBoardAction,
  completeTaskAction,
  createTaskFromBoardAction,
  progressTaskAction,
} from '../floor-tasks-actions';

type Station = { id: string; name: string };

type Props = {
  tasks: TaskRow[];
  stations: Station[];
  shiftSessionId: string | null;
};

function TaskCard({
  task,
  stationName,
  shiftSessionId,
}: {
  task: TaskRow;
  stationName: string | null;
  shiftSessionId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const meta: string[] = [];
  if (task.estMinutes != null) meta.push(`est. ${task.estMinutes}min`);
  if (stationName) meta.push(`for ${stationName}`);

  const onStart = () => {
    startTransition(async () => {
      await progressTaskAction(task.id, shiftSessionId);
    });
  };

  const onDone = () => {
    startTransition(async () => {
      await completeTaskAction(
        task.id,
        shiftSessionId,
        task.suggestedStationId ?? null,
      );
    });
  };

  const onArchive = () => {
    setMenuOpen(false);
    startTransition(async () => {
      await archiveTaskFromBoardAction(task.id);
    });
  };

  return (
    <div className="flex items-start gap-2 rounded-md bg-white/5 ring-1 ring-white/10 p-2">
      <div className="flex-1 min-w-0">
        <div className="floor-body font-semibold text-white truncate">
          {task.title}
        </div>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {meta.length > 0 && (
            <span className="floor-chip text-white/60">{meta.join(' · ')}</span>
          )}
          {task.source === 'eos_todo' && (
            <span className="floor-chip px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/40 font-semibold">
              EOS
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {task.status === 'open' && (
          <button
            type="button"
            onClick={onStart}
            disabled={isPending}
            className="floor-chip px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50 font-semibold"
          >
            Start
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            type="button"
            onClick={onDone}
            disabled={isPending}
            className="floor-chip px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50 font-semibold"
          >
            Mark done
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={isPending}
            aria-label="More actions"
            className="floor-chip px-2 py-1 rounded bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
          >
            …
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 rounded-md bg-zinc-900 ring-1 ring-white/10 shadow-lg">
              <button
                type="button"
                onClick={onArchive}
                className="floor-chip block w-full text-left px-3 py-1.5 text-white/80 hover:bg-white/10 whitespace-nowrap"
              >
                Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddTaskForm({
  stations,
  onClose,
}: {
  stations: Station[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [estMinutes, setEstMinutes] = useState('');
  const [stationId, setStationId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title required');
      return;
    }
    const est = estMinutes === '' ? undefined : Number(estMinutes);
    if (est !== undefined && (!Number.isFinite(est) || est < 0)) {
      setError('Est. minutes must be a non-negative number');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createTaskFromBoardAction({
          title: title.trim(),
          estMinutes: est,
          suggestedStationId: stationId || undefined,
        });
        setTitle('');
        setEstMinutes('');
        setStationId('');
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add');
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-md bg-white/5 ring-1 ring-white/10 p-2"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        autoFocus
        disabled={isPending}
        className="floor-body bg-black/30 rounded px-2 py-1 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-emerald-400/60 outline-none"
      />
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          value={estMinutes}
          onChange={(e) => setEstMinutes(e.target.value)}
          placeholder="min"
          disabled={isPending}
          className="floor-chip bg-black/30 rounded px-2 py-1 text-white placeholder:text-white/40 ring-1 ring-white/10 focus:ring-emerald-400/60 outline-none w-20"
        />
        <select
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
          disabled={isPending}
          className="floor-chip bg-black/30 rounded px-2 py-1 text-white ring-1 ring-white/10 focus:ring-emerald-400/60 outline-none flex-1"
        >
          <option value="">No station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id} className="text-black">
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {error && <span className="floor-chip text-red-400">{error}</span>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="floor-chip px-2 py-1 rounded bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="floor-chip px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50 font-semibold"
        >
          Add
        </button>
      </div>
    </form>
  );
}

export function TasksPanel({ tasks, stations, shiftSessionId }: Props) {
  const [adding, setAdding] = useState(false);
  const stationNameById = new Map(stations.map((s) => [s.id, s.name] as const));

  const openCount = tasks.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  ).length;

  // In_progress first, then open. Within each, newest first (already createdAt desc).
  const sorted = [...tasks]
    .filter((t) => t.status === 'open' || t.status === 'in_progress')
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'in_progress' ? -1 : 1;
    });

  return (
    <div className="rounded-md border border-white/10 p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="floor-title">Tasks · {openCount} open</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            title="Coming in Task 29"
            className="floor-chip px-2 py-1 rounded bg-white/5 text-white/40 ring-1 ring-white/10 cursor-not-allowed"
          >
            Import EOS to-do
          </button>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            aria-label="Add task"
            className="floor-chip p-1 rounded bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 overflow-auto min-h-0">
        {adding && (
          <AddTaskForm stations={stations} onClose={() => setAdding(false)} />
        )}
        {sorted.length === 0 && !adding && (
          <div className="floor-body text-white/40 text-center py-4">
            No open tasks
          </div>
        )}
        {sorted.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            stationName={
              t.suggestedStationId
                ? stationNameById.get(t.suggestedStationId) ?? null
                : null
            }
            shiftSessionId={shiftSessionId}
          />
        ))}
      </div>
    </div>
  );
}
