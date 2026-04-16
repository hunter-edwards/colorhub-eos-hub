'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  FileText,
  GripVertical,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import {
  createProcess,
  updateProcess,
  deleteProcess,
} from '@/server/processes';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Process = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string | null;
  steps: string[];
  orderIdx: number;
  updatedAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

function SortableStepItem({
  step,
  index,
  total,
  stepId,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateText,
}: {
  step: string;
  index: number;
  total: number;
  stepId: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdateText: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stepId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? 'relative z-50 opacity-80' : ''}`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder step"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </button>
      <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">
        {index + 1}.
      </span>
      <Input
        value={step}
        onChange={(e) => onUpdateText(e.target.value)}
        placeholder={`Step ${index + 1}`}
        className="flex-1"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        disabled={index === 0}
        onClick={onMoveUp}
        title="Move up"
      >
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        disabled={index === total - 1}
        onClick={onMoveDown}
        title="Move down"
      >
        <ArrowDown className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive"
        onClick={onRemove}
        title="Remove step"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

function StepsList({
  steps,
  onUpdate,
}: {
  steps: string[];
  onUpdate: (steps: string[]) => void;
}) {
  // Stable IDs for sortable context -- use index-based IDs that stay consistent
  // as long as the array length doesn't change mid-drag.
  const stepIds = steps.map((_, i) => `step-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate(next);
  };

  const removeStep = (index: number) => {
    onUpdate(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const next = [...steps];
    next[index] = value;
    onUpdate(next);
  };

  const addStep = () => {
    onUpdate([...steps, '']);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stepIds.indexOf(String(active.id));
    const newIndex = stepIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onUpdate(arrayMove(steps, oldIndex, newIndex));
  }

  return (
    <div className="space-y-2">
      <Label>Steps</Label>
      {steps.length === 0 && (
        <p className="text-xs text-muted-foreground">No steps added yet.</p>
      )}
      {steps.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            {steps.map((step, i) => (
              <SortableStepItem
                key={stepIds[i]}
                stepId={stepIds[i]}
                step={step}
                index={i}
                total={steps.length}
                onMoveUp={() => moveStep(i, -1)}
                onMoveDown={() => moveStep(i, 1)}
                onRemove={() => removeStep(i)}
                onUpdateText={(value) => updateStep(i, value)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      <Button variant="outline" size="sm" onClick={addStep} className="mt-1">
        <Plus className="h-3 w-3 mr-1" /> Add Step
      </Button>
    </div>
  );
}

function ProcessCard({
  process,
  members,
  expanded,
  onToggle,
}: {
  process: Process;
  members: Member[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [title, setTitle] = useState(process.title);
  const [description, setDescription] = useState(process.description ?? '');
  const [ownerId, setOwnerId] = useState(process.ownerId ?? '');
  const [steps, setSteps] = useState<string[]>(process.steps ?? []);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useCallback(
    async (patch: Parameters<typeof updateProcess>[0]) => {
      setSaving(true);
      await updateProcess(patch);
      setSaving(false);
    },
    []
  );

  const handleTitleBlur = () => {
    if (title !== process.title) {
      save({ id: process.id, title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (process.description ?? '')) {
      save({ id: process.id, description });
    }
  };

  const handleOwnerChange = (newOwnerId: string) => {
    setOwnerId(newOwnerId);
    save({ id: process.id, ownerId: newOwnerId || null });
  };

  const handleStepsUpdate = (newSteps: string[]) => {
    setSteps(newSteps);
    save({ id: process.id, steps: newSteps });
  };

  const handleDelete = async () => {
    setSaving(true);
    await deleteProcess(process.id);
    setSaving(false);
  };

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <CardTitle className="flex-1">{process.title}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {process.ownerName || process.ownerEmail ? (
              <span>{process.ownerName || process.ownerEmail}</span>
            ) : null}
            <span>
              {steps.length} step{steps.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {!expanded && process.description && (
          <CardDescription className="ml-6 line-clamp-1">
            {process.description}
          </CardDescription>
        )}
      </CardHeader>

      {expanded && (
        <>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`title-${process.id}`}>Title</Label>
              <Input
                id={`title-${process.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`desc-${process.id}`}>Description</Label>
              <Textarea
                id={`desc-${process.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                onClick={(e) => e.stopPropagation()}
                placeholder="Describe this process..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`owner-${process.id}`}>Owner</Label>
              <select
                id={`owner-${process.id}`}
                value={ownerId}
                onChange={(e) => handleOwnerChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="">No owner</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <StepsList steps={steps} onUpdate={handleStepsUpdate} />
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            {confirmDelete ? (
              <>
                <span className="text-sm text-destructive mr-2">
                  Delete this process?
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Confirm Delete
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export function ProcessList({
  processes,
  members,
}: {
  processes: Process[];
  members: Member[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await createProcess({ title: newTitle.trim() });
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="New process title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} size="sm" disabled={adding || !newTitle.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add Process
        </Button>
      </div>

      {processes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No processes documented yet"
          description="Add your first process to get started."
        />
      ) : (
        processes.map((p) => (
          <ProcessCard
            key={p.id}
            process={p}
            members={members}
            expanded={expandedId === p.id}
            onToggle={() =>
              setExpandedId(expandedId === p.id ? null : p.id)
            }
          />
        ))
      )}
    </div>
  );
}
