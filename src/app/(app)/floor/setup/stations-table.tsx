'use client';

import { useState, useTransition } from 'react';
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
import { ArrowDown, ArrowUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  archiveStationAction,
  createStationAction,
  reorderStationAction,
  seedDefaultStationsAction,
  setDefaultOperatorsAction,
  updateStationAction,
} from './stations-tab-actions';

type StationKind = 'printer' | 'cad' | 'rotary' | 'gluer' | 'handwork' | 'shipping';

const STATION_KINDS: StationKind[] = [
  'printer',
  'cad',
  'rotary',
  'gluer',
  'handwork',
  'shipping',
];

export type StationRow = {
  id: string;
  name: string;
  kind: StationKind;
  displayOrder: number;
  groupLabel: string | null;
  archivedAt: Date | null;
  defaultOperatorIds: string[];
};

export type Member = {
  id: string;
  name: string | null;
  email: string;
};

function memberLabel(m: Member): string {
  return m.name ?? m.email;
}

function DefaultOperatorsPicker({
  station,
  members,
}: {
  station: StationRow;
  members: Member[];
}) {
  const [selected, setSelected] = useState<string[]>(station.defaultOperatorIds);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initialRef = station.defaultOperatorIds;

  const toggle = (id: string, checked: boolean) => {
    setSelected((cur) => (checked ? [...cur, id] : cur.filter((x) => x !== id)));
  };

  const persistIfChanged = () => {
    const initial = [...initialRef].sort().join(',');
    const next = [...selected].sort().join(',');
    if (initial === next) return;
    startTransition(async () => {
      try {
        await setDefaultOperatorsAction(station.id, selected);
        toast.success('Default operators updated');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save');
      }
    });
  };

  const summary =
    selected.length === 0
      ? 'None'
      : selected.length === 1
        ? memberLabel(members.find((m) => m.id === selected[0]) ?? { id: '', name: null, email: '?' })
        : `${selected.length} operators`;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) persistIfChanged();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isPending}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{summary}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-2">
        <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Default operators
        </div>
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {members.length === 0 ? (
            <div className="px-1 py-2 text-xs text-muted-foreground">
              No team members.
            </div>
          ) : (
            members.map((m) => {
              const checked = selected.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggle(m.id, !!v)}
                  />
                  <span className="text-sm">{memberLabel(m)}</span>
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StationEditableRow({
  station,
  prevId,
  nextId,
  members,
}: {
  station: StationRow;
  prevId: string | null;
  nextId: string | null;
  members: Member[];
}) {
  const [name, setName] = useState(station.name);
  const [groupLabel, setGroupLabel] = useState(station.groupLabel ?? '');
  const [isPending, startTransition] = useTransition();

  const dirty =
    name !== station.name || (groupLabel || null) !== (station.groupLabel ?? null);

  const save = () => {
    startTransition(async () => {
      try {
        await updateStationAction(station.id, {
          name,
          groupLabel: groupLabel === '' ? null : groupLabel,
        });
        toast.success('Station updated');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update');
      }
    });
  };

  const swapWith = (otherId: string, otherDisplayOrder: number) => {
    startTransition(async () => {
      try {
        await reorderStationAction(otherId, station.displayOrder);
        await reorderStationAction(station.id, otherDisplayOrder);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to reorder');
      }
    });
  };

  const onArchive = () => {
    if (!confirm(`Archive ${station.name}?`)) return;
    startTransition(async () => {
      try {
        await archiveStationAction(station.id);
        toast.success('Station archived');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to archive');
      }
    });
  };

  const onKindChange = (kind: StationKind) => {
    startTransition(async () => {
      try {
        await updateStationAction(station.id, { kind });
        toast.success('Kind updated');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update kind');
      }
    });
  };

  const archived = station.archivedAt != null;

  return (
    <TableRow data-archived={archived ? '' : undefined} className={archived ? 'opacity-60' : ''}>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending || archived}
          className="h-8 w-full"
        />
      </TableCell>
      <TableCell>
        <select
          value={station.kind}
          onChange={(e) => onKindChange(e.target.value as StationKind)}
          disabled={isPending || archived}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {STATION_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell>
        <Input
          value={groupLabel}
          onChange={(e) => setGroupLabel(e.target.value)}
          disabled={isPending || archived}
          className="h-8 w-full"
          placeholder="—"
        />
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="w-6 text-sm tabular-nums">{station.displayOrder}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            disabled={!prevId || isPending || archived}
            onClick={() => prevId && swapWith(prevId, station.displayOrder - 1)}
            aria-label="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            disabled={!nextId || isPending || archived}
            onClick={() => nextId && swapWith(nextId, station.displayOrder + 1)}
            aria-label="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={
            archived
              ? 'text-xs text-muted-foreground'
              : 'text-xs font-medium text-foreground'
          }
        >
          {archived ? 'Archived' : 'Active'}
        </span>
      </TableCell>
      <TableCell>
        {!archived && <DefaultOperatorsPicker station={station} members={members} />}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {dirty && !archived && (
            <Button type="button" size="sm" onClick={save} disabled={isPending}>
              Save
            </Button>
          )}
          {!archived && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onArchive}
              disabled={isPending}
            >
              Archive
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function AddStationForm() {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<StationKind>('printer');
  const [groupLabel, setGroupLabel] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name required');
      return;
    }
    startTransition(async () => {
      try {
        await createStationAction({
          name: name.trim(),
          kind,
          groupLabel: groupLabel.trim() || undefined,
        });
        toast.success('Station added');
        setName('');
        setGroupLabel('');
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
        <label className="text-xs font-medium text-muted-foreground">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Press 3"
          className="h-9 w-40"
          disabled={isPending}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Kind</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as StationKind)}
          disabled={isPending}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {STATION_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Group label</label>
        <Input
          value={groupLabel}
          onChange={(e) => setGroupLabel(e.target.value)}
          placeholder="Printing"
          className="h-9 w-40"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        Add station
      </Button>
    </form>
  );
}

function SeedDefaultsButton() {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      try {
        await seedDefaultStationsAction();
        toast.success('Default stations seeded');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to seed');
      }
    });
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6 text-center">
      <p className="mb-3 text-sm text-muted-foreground">
        No stations yet. Seed the standard set to get started.
      </p>
      <Button type="button" onClick={onClick} disabled={isPending}>
        Reset to defaults
      </Button>
    </div>
  );
}

export function StationsTable({
  stations,
  members,
}: {
  stations: StationRow[];
  members: Member[];
}) {
  if (stations.length === 0) {
    return (
      <div className="space-y-4">
        <SeedDefaultsButton />
        <AddStationForm />
      </div>
    );
  }

  // Build prev/next maps based on visible (non-archived) order for swap.
  const active = stations.filter((s) => s.archivedAt == null);
  const prevByActiveId = new Map<string, string | null>();
  const nextByActiveId = new Map<string, string | null>();
  active.forEach((s, i) => {
    prevByActiveId.set(s.id, i === 0 ? null : active[i - 1].id);
    nextByActiveId.set(s.id, i === active.length - 1 ? null : active[i + 1].id);
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-center">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Operators</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((s) => (
              <StationEditableRow
                key={s.id}
                station={s}
                prevId={s.archivedAt == null ? prevByActiveId.get(s.id) ?? null : null}
                nextId={s.archivedAt == null ? nextByActiveId.get(s.id) ?? null : null}
                members={members}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <AddStationForm />
    </div>
  );
}
