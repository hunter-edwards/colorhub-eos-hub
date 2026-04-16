'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { setEntry, createMetric, updateMetric, deleteMetric } from '@/server/scorecard';
import { evaluateEntry } from '@/lib/scorecard-utils';

type Metric = {
  id: string;
  name: string;
  ownerId: string;
  goal: string | null;
  comparator: 'gte' | 'lte' | 'eq' | 'range';
  goalMin: string | null;
  goalMax: string | null;
  unit: string | null;
  orderIdx: number;
  active: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Entry = {
  id: string;
  metricId: string;
  weekStart: string;
  value: string | null;
  note: string | null;
};

type Member = { id: string; name: string | null; email: string };

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function goalDisplay(m: Metric): string {
  if (m.comparator === 'range') return `${m.goalMin}–${m.goalMax}`;
  const prefix = m.comparator === 'gte' ? '≥' : m.comparator === 'lte' ? '≤' : '=';
  return m.goal ? `${prefix} ${m.goal}` : '';
}

function Cell({
  metric,
  weekStart,
  value,
}: {
  metric: Metric;
  weekStart: string;
  value: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value ?? '');

  const color =
    value != null && value !== ''
      ? evaluateEntry(metric, Number(value))
      : null;

  const bgClass =
    color === 'green'
      ? 'bg-green-100 dark:bg-green-900/30'
      : color === 'red'
        ? 'bg-red-100 dark:bg-red-900/30'
        : '';

  if (editing) {
    return (
      <td className="p-0">
        <input
          type="number"
          step="any"
          className="w-full h-full px-1 py-0.5 text-xs text-center border-0 outline-none bg-background"
          value={input}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          onBlur={async () => {
            setEditing(false);
            if (input !== (value ?? '')) {
              await setEntry(metric.id, weekStart, input);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setInput(value ?? '');
              setEditing(false);
            }
          }}
        />
      </td>
    );
  }

  return (
    <td
      className={`px-2 py-1 text-xs text-center cursor-pointer hover:ring-1 hover:ring-primary ${bgClass}`}
      onClick={() => setEditing(true)}
    >
      {value ?? '–'}
    </td>
  );
}

function AddMetricDialog({
  open,
  onOpenChange,
  members,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  members: Member[];
}) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Metric</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          action={async (fd) => {
            setPending(true);
            await createMetric({
              name: fd.get('name') as string,
              ownerId: fd.get('ownerId') as string,
              goal: (fd.get('goal') as string) || undefined,
              comparator: (fd.get('comparator') as 'gte' | 'lte' | 'eq' | 'range') || 'gte',
              goalMin: (fd.get('goalMin') as string) || undefined,
              goalMax: (fd.get('goalMax') as string) || undefined,
              unit: (fd.get('unit') as string) || undefined,
            });
            setPending(false);
            onOpenChange(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="m-name">Name</Label>
            <Input id="m-name" name="name" required placeholder="e.g. Weekly Revenue" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-owner">Owner</Label>
            <select
              id="m-owner"
              name="ownerId"
              required
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Select...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-comp">Comparator</Label>
              <select
                id="m-comp"
                name="comparator"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="gte">≥ (at least)</option>
                <option value="lte">≤ (at most)</option>
                <option value="eq">= (exactly)</option>
                <option value="range">Range</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-goal">Goal</Label>
              <Input id="m-goal" name="goal" type="number" step="any" placeholder="e.g. 100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-min">Range Min</Label>
              <Input id="m-min" name="goalMin" type="number" step="any" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-max">Range Max</Label>
              <Input id="m-max" name="goalMax" type="number" step="any" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-unit">Unit (optional)</Label>
            <Input id="m-unit" name="unit" placeholder="e.g. $, %, hrs" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Adding...' : 'Add Metric'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMetricDialog({
  open,
  onOpenChange,
  metric,
  members,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  metric: Metric;
  members: Member[];
}) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Metric</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          action={async (fd) => {
            setPending(true);
            await updateMetric(metric.id, {
              name: fd.get('name') as string,
              ownerId: fd.get('ownerId') as string,
              goal: (fd.get('goal') as string) || null,
              comparator: (fd.get('comparator') as 'gte' | 'lte' | 'eq' | 'range') || 'gte',
              goalMin: (fd.get('goalMin') as string) || null,
              goalMax: (fd.get('goalMax') as string) || null,
              unit: (fd.get('unit') as string) || null,
            });
            toast.success('Metric updated');
            setPending(false);
            onOpenChange(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="e-name">Name</Label>
            <Input id="e-name" name="name" required defaultValue={metric.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-owner">Owner</Label>
            <select
              id="e-owner"
              name="ownerId"
              required
              defaultValue={metric.ownerId}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-comp">Comparator</Label>
              <select
                id="e-comp"
                name="comparator"
                defaultValue={metric.comparator}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="gte">≥ (at least)</option>
                <option value="lte">≤ (at most)</option>
                <option value="eq">= (exactly)</option>
                <option value="range">Range</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-goal">Goal</Label>
              <Input id="e-goal" name="goal" type="number" step="any" defaultValue={metric.goal ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-min">Range Min</Label>
              <Input id="e-min" name="goalMin" type="number" step="any" defaultValue={metric.goalMin ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-max">Range Max</Label>
              <Input id="e-max" name="goalMax" type="number" step="any" defaultValue={metric.goalMax ?? ''} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-unit">Unit (optional)</Label>
            <Input id="e-unit" name="unit" defaultValue={metric.unit ?? ''} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMetricDialog({
  open,
  onOpenChange,
  metric,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  metric: Metric;
}) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Metric</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Delete <strong>{metric.name}</strong> and all its weekly entries? This cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await deleteMetric(metric.id);
              toast.success('Metric deleted');
              setPending(false);
              onOpenChange(false);
            }}
          >
            {pending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScorecardGrid({
  metrics,
  entries,
  weeks,
  members,
}: {
  metrics: Metric[];
  entries: Entry[];
  weeks: string[];
  members: Member[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [deletingMetric, setDeletingMetric] = useState<Metric | null>(null);

  const entryMap = new Map<string, string | null>();
  for (const e of entries) {
    entryMap.set(`${e.metricId}:${e.weekStart}`, e.value);
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Metric
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-2 py-1 font-medium min-w-[180px]">Metric</th>
              <th className="text-left px-2 py-1 font-medium text-xs text-muted-foreground">Goal</th>
              {weeks.map((w) => (
                <th key={w} className="px-2 py-1 text-xs font-medium text-center min-w-[60px]">
                  {formatWeek(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 && (
              <tr>
                <td colSpan={weeks.length + 2} className="text-center py-8 text-muted-foreground text-sm">
                  No metrics yet. Add one to get started.
                </td>
              </tr>
            )}
            {metrics.map((m) => (
              <tr key={m.id} className="border-b hover:bg-accent/50 group">
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.ownerName || m.ownerEmail}
                      </div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Edit metric"
                        onClick={() => setEditingMetric(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Delete metric"
                        onClick={() => setDeletingMetric(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-1 text-xs text-muted-foreground whitespace-nowrap">
                  {goalDisplay(m)} {m.unit ?? ''}
                </td>
                {weeks.map((w) => (
                  <Cell
                    key={w}
                    metric={m}
                    weekStart={w}
                    value={entryMap.get(`${m.id}:${w}`) ?? null}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddMetricDialog open={dialogOpen} onOpenChange={setDialogOpen} members={members} />
      {editingMetric && (
        <EditMetricDialog
          open
          onOpenChange={(o) => { if (!o) setEditingMetric(null); }}
          metric={editingMetric}
          members={members}
        />
      )}
      {deletingMetric && (
        <DeleteMetricDialog
          open
          onOpenChange={(o) => { if (!o) setDeletingMetric(null); }}
          metric={deletingMetric}
        />
      )}
    </>
  );
}
