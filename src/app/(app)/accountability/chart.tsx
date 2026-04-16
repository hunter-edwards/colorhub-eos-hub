'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';
import { Plus, Trash2, X, Network } from 'lucide-react';
import {
  createSeat,
  updateSeat,
  deleteSeat,
} from '@/server/accountability';

// ---- Types ----

type Seat = {
  id: string;
  teamId: string;
  title: string;
  roles: string[];
  parentSeatId: string | null;
  personId: string | null;
  gwcGetsIt: boolean | null;
  gwcWantsIt: boolean | null;
  gwcCapacity: boolean | null;
  orderIdx: number;
  createdAt: Date;
  updatedAt: Date;
  personName: string | null;
  personAvatarUrl: string | null;
  personProfileColor: string | null;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  profileColor: string | null;
};

type SeatNode = Seat & { children: SeatNode[] };

// ---- Tree builder ----

function buildTree(flatSeats: Seat[]): SeatNode[] {
  const map = new Map<string, SeatNode>();
  for (const s of flatSeats) {
    map.set(s.id, { ...s, children: [] });
  }
  const roots: SeatNode[] = [];
  for (const node of map.values()) {
    if (node.parentSeatId && map.has(node.parentSeatId)) {
      map.get(node.parentSeatId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // Sort by orderIdx within each level
  const sortChildren = (nodes: SeatNode[]) => {
    nodes.sort((a, b) => a.orderIdx - b.orderIdx);
    for (const n of nodes) sortChildren(n.children);
  };
  sortChildren(roots);
  return roots;
}

// ---- Initials helper ----

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ---- GWC dot ----

function GwcDot({ value, label }: { value: boolean | null; label: string }) {
  const color =
    value === true
      ? 'bg-green-500'
      : value === false
        ? 'bg-red-400'
        : 'bg-gray-300 dark:bg-gray-600';
  return (
    <span
      title={`${label}: ${value === true ? 'Yes' : value === false ? 'No' : 'Not set'}`}
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
    />
  );
}

// ---- Seat card ----

function SeatCard({
  seat,
  onEdit,
  onAddChild,
}: {
  seat: SeatNode;
  onEdit: (seat: Seat) => void;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <Card
        className="w-56 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow"
        size="sm"
        onClick={() => onEdit(seat)}
      >
        <CardHeader className="pb-0">
          <CardTitle className="text-sm truncate">{seat.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Roles */}
          {seat.roles.length > 0 && (
            <ul className="space-y-0.5">
              {seat.roles.slice(0, 5).map((role, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span className="line-clamp-1">{role}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Person + GWC row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {seat.personId ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                  style={{
                    backgroundColor: seat.personProfileColor || '#6b7280',
                  }}
                >
                  {getInitials(seat.personName)}
                </span>
                <span className="text-xs truncate">{seat.personName || 'Unnamed'}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}

            <div className="flex items-center gap-1">
              <GwcDot value={seat.gwcGetsIt} label="Gets it" />
              <GwcDot value={seat.gwcWantsIt} label="Wants it" />
              <GwcDot value={seat.gwcCapacity} label="Capacity" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add child button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 h-6 text-xs text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onAddChild(seat.id);
        }}
      >
        <Plus className="h-3 w-3 mr-0.5" /> Add
      </Button>

      {/* Children */}
      {seat.children.length > 0 && (
        <div className="mt-2 flex flex-col items-center">
          {/* Vertical connector */}
          <div className="h-4 w-px bg-border" />
          {/* Horizontal connector + children */}
          <div className="flex gap-4">
            {seat.children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Horizontal connector line */}
                {seat.children.length > 1 && (
                  <div
                    className="absolute top-0 h-px bg-border"
                    style={{
                      left: idx === 0 ? '50%' : 0,
                      right: idx === seat.children.length - 1 ? '50%' : 0,
                    }}
                  />
                )}
                {/* Vertical drop to child */}
                <div className="h-4 w-px bg-border" />
                <SeatCard seat={child} onEdit={onEdit} onAddChild={onAddChild} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Edit dialog ----

function EditSeatDialog({
  seat,
  allSeats,
  members,
  onClose,
}: {
  seat: Seat;
  allSeats: Seat[];
  members: Member[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(seat.title);
  const [roles, setRoles] = useState<string[]>(seat.roles);
  const [newRole, setNewRole] = useState('');
  const [personId, setPersonId] = useState(seat.personId ?? '');
  const [parentSeatId, setParentSeatId] = useState(seat.parentSeatId ?? '');
  const [gwcGetsIt, setGwcGetsIt] = useState(seat.gwcGetsIt ?? false);
  const [gwcWantsIt, setGwcWantsIt] = useState(seat.gwcWantsIt ?? false);
  const [gwcCapacity, setGwcCapacity] = useState(seat.gwcCapacity ?? false);
  const [pending, startTransition] = useTransition();

  // Exclude self and descendants from parent options
  function getDescendantIds(id: string): Set<string> {
    const ids = new Set<string>();
    const stack = [id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      ids.add(current);
      for (const s of allSeats) {
        if (s.parentSeatId === current && !ids.has(s.id)) {
          stack.push(s.id);
        }
      }
    }
    return ids;
  }
  const excludedIds = getDescendantIds(seat.id);
  const parentOptions = allSeats.filter((s) => !excludedIds.has(s.id));

  function handleSave() {
    startTransition(async () => {
      await updateSeat({
        id: seat.id,
        title,
        roles,
        personId: personId || null,
        parentSeatId: parentSeatId || null,
        gwcGetsIt,
        gwcWantsIt,
        gwcCapacity,
      });
      onClose();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteSeat(seat.id);
      onClose();
    });
  }

  function addRole() {
    const trimmed = newRole.trim();
    if (!trimmed || roles.length >= 5) return;
    setRoles([...roles, trimmed]);
    setNewRole('');
  }

  function removeRole(index: number) {
    setRoles(roles.filter((_, i) => i !== index));
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Seat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="seat-title">Title</Label>
            <Input
              id="seat-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visionary, Integrator"
            />
          </div>

          {/* Roles */}
          <div className="space-y-1.5">
            <Label>Roles (max 5)</Label>
            <div className="space-y-1">
              {roles.map((role, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="flex-1 text-sm rounded border px-2 py-1">{role}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeRole(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {roles.length < 5 && (
              <form
                className="flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRole();
                }}
              >
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Add a role..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" variant="outline" disabled={!newRole.trim()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </form>
            )}
          </div>

          {/* Assign Person */}
          <div className="space-y-1.5">
            <Label htmlFor="seat-person">Person</Label>
            <select
              id="seat-person"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>

          {/* GWC */}
          <div className="space-y-1.5">
            <Label>GWC</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={gwcGetsIt}
                  onCheckedChange={(v) => setGwcGetsIt(v === true)}
                />
                Gets it
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={gwcWantsIt}
                  onCheckedChange={(v) => setGwcWantsIt(v === true)}
                />
                Wants it
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={gwcCapacity}
                  onCheckedChange={(v) => setGwcCapacity(v === true)}
                />
                Capacity
              </label>
            </div>
          </div>

          {/* Parent Seat */}
          <div className="space-y-1.5">
            <Label htmlFor="seat-parent">Reports to</Label>
            <select
              id="seat-parent"
              value={parentSeatId}
              onChange={(e) => setParentSeatId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="">None (top level)</option>
              {parentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={pending || !title.trim()} size="sm">
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Add seat dialog ----

function AddSeatDialog({
  parentSeatId,
  onClose,
}: {
  parentSeatId: string | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createSeat({
        title: title.trim(),
        parentSeatId: parentSeatId ?? undefined,
      });
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Seat</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-seat-title">Title</Label>
            <Input
              id="new-seat-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VP of Sales"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={pending || !title.trim()} size="sm">
            {pending ? 'Creating...' : 'Create Seat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main chart component ----

export function AccountabilityChart({
  seats,
  members,
}: {
  seats: Seat[];
  members: Member[];
}) {
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined);
  // undefined = dialog closed, null = top-level add, string = add child of that seat

  const tree = buildTree(seats);

  return (
    <div>
      {/* Add top-level seat button */}
      <div className="mb-6">
        <Button size="sm" onClick={() => setAddingParentId(null)}>
          <Plus className="h-4 w-4 mr-1" /> Add Seat
        </Button>
      </div>

      {/* Chart */}
      {tree.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No seats yet"
          description="Add your first seat to start building the Accountability Chart."
        />
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="inline-flex flex-col items-center min-w-fit">
            <div className="flex gap-6">
              {tree.map((root) => (
                <SeatCard
                  key={root.id}
                  seat={root}
                  onEdit={setEditingSeat}
                  onAddChild={(parentId) => setAddingParentId(parentId)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {editingSeat && (
        <EditSeatDialog
          seat={editingSeat}
          allSeats={seats}
          members={members}
          onClose={() => setEditingSeat(null)}
        />
      )}

      {/* Add dialog */}
      {addingParentId !== undefined && (
        <AddSeatDialog
          parentSeatId={addingParentId}
          onClose={() => setAddingParentId(undefined)}
        />
      )}
    </div>
  );
}
