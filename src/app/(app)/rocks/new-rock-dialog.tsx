'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createRock } from '@/server/rocks';

type Member = { id: string; name: string | null; email: string };

export function NewRockDialog({
  open,
  onOpenChange,
  members,
  quarter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  quarter: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Rock — {quarter}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            setPending(true);
            setError(null);
            const title = fd.get('title') as string;
            const description = (fd.get('description') as string) || undefined;
            const ownerId = fd.get('ownerId') as string;
            const dueDate = (fd.get('dueDate') as string) || undefined;

            if (!title || !ownerId) {
              setError('Title and owner are required.');
              setPending(false);
              return;
            }

            try {
              await createRock({ title, description, ownerId, quarter, dueDate });
              onOpenChange(false);
            } catch {
              setError('Failed to create rock.');
            } finally {
              setPending(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="rock-title">Title</Label>
            <Input id="rock-title" name="title" required placeholder="e.g. Launch v2 billing" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rock-desc">Description (optional)</Label>
            <Textarea id="rock-desc" name="description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rock-owner">Owner</Label>
            <select
              id="rock-owner"
              name="ownerId"
              required
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select owner...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rock-due">Due date (optional)</Label>
            <Input id="rock-due" name="dueDate" type="date" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating...' : 'Create Rock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
