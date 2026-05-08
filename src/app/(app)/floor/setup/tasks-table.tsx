'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  archiveTaskAction,
  createTaskAction,
  markTaskAction,
} from './tasks-tab-actions';

type TaskPoolStatus = 'open' | 'in_progress' | 'done' | 'archived';
type TaskPoolSource = 'hub' | 'eos_todo';

export type TaskRow = {
  id: string;
  title: string;
  estMinutes: number | null;
  suggestedStationId: string | null;
  source: TaskPoolSource;
  status: TaskPoolStatus;
  createdAt: Date;
};

export type StationOption = {
  id: string;
  name: string;
};

const STATUS_LABELS: Record<TaskPoolStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
  archived: 'Archived',
};

const STATUS_FILTERS: TaskPoolStatus[] = ['open', 'in_progress', 'done', 'archived'];

function formatDate(d: Date): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function TaskActionButtons({ task }: { task: TaskRow }) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>, success: string) => {
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {task.status !== 'in_progress' && task.status !== 'archived' && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => run(() => markTaskAction(task.id, 'in_progress'), 'Marked in progress')}
          disabled={isPending}
        >
          In progress
        </Button>
      )}
      {task.status !== 'done' && task.status !== 'archived' && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => run(() => markTaskAction(task.id, 'done'), 'Marked done')}
          disabled={isPending}
        >
          Done
        </Button>
      )}
      {task.status !== 'archived' && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => run(() => archiveTaskAction(task.id), 'Archived')}
          disabled={isPending}
        >
          Archive
        </Button>
      )}
    </div>
  );
}

function AddTaskForm({ stations }: { stations: StationOption[] }) {
  const [title, setTitle] = useState('');
  const [estMinutes, setEstMinutes] = useState('');
  const [stationId, setStationId] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    const est = estMinutes === '' ? undefined : Number(estMinutes);
    if (est !== undefined && (!Number.isFinite(est) || est < 0)) {
      toast.error('Est. minutes must be a non-negative number');
      return;
    }
    startTransition(async () => {
      try {
        await createTaskAction({
          title: title.trim(),
          estMinutes: est,
          suggestedStationId: stationId || undefined,
        });
        toast.success('Task added');
        setTitle('');
        setEstMinutes('');
        setStationId('');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to add');
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border/60 bg-card p-4"
    >
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Clean press 1"
          className="h-9 w-64"
          disabled={isPending}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Est. minutes</label>
        <Input
          type="number"
          min={0}
          value={estMinutes}
          onChange={(e) => setEstMinutes(e.target.value)}
          placeholder="15"
          className="h-9 w-24"
          disabled={isPending}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Suggested station</label>
        <select
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
          disabled={isPending}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">—</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={isPending}>
        Add task
      </Button>
    </form>
  );
}

export function TasksTable({
  tasks,
  stations,
}: {
  tasks: TaskRow[];
  stations: StationOption[];
}) {
  const [activeStatuses, setActiveStatuses] = useState<Set<TaskPoolStatus>>(
    () => new Set<TaskPoolStatus>(['open', 'in_progress']),
  );

  const stationNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of stations) m.set(s.id, s.name);
    return m;
  }, [stations]);

  const toggleStatus = (s: TaskPoolStatus) => {
    setActiveStatuses((cur) => {
      const next = new Set(cur);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const filtered = tasks.filter((t) => activeStatuses.has(t.status));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Show:</span>
        {STATUS_FILTERS.map((s) => {
          const active = activeStatuses.has(s);
          return (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => toggleStatus(s)}
            >
              {STATUS_LABELS[s]}
            </Button>
          );
        })}
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Est. minutes</TableHead>
              <TableHead>Suggested station</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No tasks match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.estMinutes ?? '—'}</TableCell>
                  <TableCell>
                    {t.suggestedStationId
                      ? stationNameById.get(t.suggestedStationId) ?? '—'
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{t.source}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">{STATUS_LABELS[t.status]}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <TaskActionButtons task={t} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AddTaskForm stations={stations} />
    </div>
  );
}
