'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/empty-state';
import {
  createCoreValue,
  updateCoreValue,
  reorderCoreValues,
  deleteCoreValue,
} from '@/server/core-values';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';

type CoreValue = {
  id: string;
  title: string;
  description: string | null;
  orderIdx: number;
};

function CoreValueCard({
  value,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  value: CoreValue;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(value.title);
  const [description, setDescription] = useState(value.description ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!title.trim()) return;
    startTransition(async () => {
      await updateCoreValue({
        id: value.id,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setEditing(false);
      toast.success('Core value updated');
    });
  }

  function handleCancel() {
    setTitle(value.title);
    setDescription(value.description ?? '');
    setEditing(false);
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCoreValue(value.id);
      toast.success('Core value deleted');
    });
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {index + 1}
        </span>

        {editing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Core value title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="min-h-12"
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={handleSave} disabled={isPending || !title.trim()}>
                <Check className="h-3 w-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{value.title}</p>
            {value.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{value.description}</p>
            )}
          </div>
        )}

        {!editing && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              title="Move up"
              disabled={index === 0 || isPending}
              onClick={onMoveUp}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title="Move down"
              disabled={index === total - 1 || isPending}
              onClick={onMoveDown}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title="Edit"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title="Delete"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddCoreValueForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createCoreValue({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setOpen(false);
      toast.success('Core value added');
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add Core Value
      </Button>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Core value title"
            autoFocus
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="min-h-12"
          />
          <div className="flex gap-1">
            <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setTitle('');
                setDescription('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CoreValuesList({
  initialValues,
}: {
  initialValues: CoreValue[];
}) {
  const [, startTransition] = useTransition();

  function handleReorder(index: number, direction: 'up' | 'down') {
    const ids = initialValues.map((v) => v.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    // Swap
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    startTransition(async () => {
      await reorderCoreValues(ids);
      toast.success('Order updated');
    });
  }

  if (initialValues.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Heart}
          title="No core values yet"
          description="Define your company's 3-7 core values to guide your team's culture and decisions."
        />
        <div className="flex justify-center">
          <AddCoreValueForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {initialValues.map((value, i) => (
        <CoreValueCard
          key={value.id}
          value={value}
          index={i}
          total={initialValues.length}
          onMoveUp={() => handleReorder(i, 'up')}
          onMoveDown={() => handleReorder(i, 'down')}
        />
      ))}
      <AddCoreValueForm />
    </div>
  );
}
