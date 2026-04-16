'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateRockStatus, createRock } from '@/server/rocks';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Rock = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  quarter: string;
  status: 'on_track' | 'off_track' | 'done';
  progressPct: number;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

type CoreValue = {
  id: string;
  title: string;
  description: string | null;
  teamId: string;
  orderIdx: number;
  active: boolean;
};

type PeopleRating = {
  id: string;
  teamId: string;
  subjectId: string;
  coreValueId: string | null;
  gwcField: string | null;
  rating: 'plus' | 'plus_minus' | 'minus';
  quarter: string;
};

type VTOData = {
  id: string;
  teamId: string;
  coreFocusPurpose: string | null;
  coreFocusNiche: string | null;
  tenYearTarget: string | null;
  marketingStrategyTargetMarket: string | null;
  marketingStrategyUniques: string[] | null;
  marketingStrategyProvenProcess: string | null;
  marketingStrategyGuarantee: string | null;
  threeYearPictureDate: string | null;
  threeYearPictureRevenue: string | null;
  threeYearPictureProfit: string | null;
  threeYearPictureMeasurables: string[] | null;
  oneYearPlanDate: string | null;
  oneYearPlanRevenue: string | null;
  oneYearPlanProfit: string | null;
  oneYearPlanGoals: string[] | null;
  updatedAt: Date;
} | null;

type NewRockDraft = {
  title: string;
  ownerId: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STEPS = ['Rock Review', 'People Review', 'V/TO Check', 'Next Quarter'] as const;

function nextQuarter(q: string): string {
  const [yearStr, qStr] = q.split('-Q');
  const year = parseInt(yearStr, 10);
  const num = parseInt(qStr, 10);
  if (num >= 4) return `${year + 1}-Q1`;
  return `${year}-Q${num + 1}`;
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  on_track: { label: 'On Track', variant: 'default' },
  off_track: { label: 'Off Track', variant: 'destructive' },
  done: { label: 'Done', variant: 'secondary' },
};

const RATING_DISPLAY: Record<string, string> = {
  plus: '+',
  plus_minus: '+/-',
  minus: '-',
};

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                done
                  ? 'bg-primary text-primary-foreground'
                  : active
                    ? 'border-2 border-primary text-primary'
                    : 'border border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={`hidden sm:block h-px w-12 ${
                  done ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Rock Review                                                */
/* ------------------------------------------------------------------ */

function RockReviewStep({
  rocks,
  onStatusChange,
}: {
  rocks: Rock[];
  onStatusChange: (id: string, status: 'on_track' | 'off_track' | 'done') => void;
}) {
  const onTrack = rocks.filter((r) => r.status === 'on_track');
  const offTrack = rocks.filter((r) => r.status === 'off_track');
  const done = rocks.filter((r) => r.status === 'done');
  const total = rocks.length;
  const completionRate = total > 0 ? Math.round((done.length / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rock Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{onTrack.length}</p>
            <p className="text-xs text-muted-foreground">On Track</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{offTrack.length}</p>
            <p className="text-xs text-muted-foreground">Off Track</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{done.length}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion</p>
          </div>
        </div>

        {/* Rock list */}
        {rocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rocks this quarter.</p>
        ) : (
          <div className="space-y-2">
            {rocks.map((rock) => (
              <div
                key={rock.id}
                className="flex items-center justify-between rounded-lg border p-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{rock.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {rock.ownerName || rock.ownerEmail} &middot; {rock.progressPct}%
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[rock.status].variant}>
                    {STATUS_BADGE[rock.status].label}
                  </Badge>
                  {rock.status !== 'done' && (
                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onStatusChange(rock.id, 'done')}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Done
                      </Button>
                      {rock.status !== 'off_track' && (
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => onStatusChange(rock.id, 'off_track')}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Off
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: People Review                                              */
/* ------------------------------------------------------------------ */

function PeopleReviewStep({
  members,
  coreValues,
  ratings,
}: {
  members: Member[];
  coreValues: CoreValue[];
  ratings: PeopleRating[];
}) {
  // Build a lookup: subjectId -> coreValueId -> rating
  const ratingMap = new Map<string, Map<string, string>>();
  for (const r of ratings) {
    const key = r.coreValueId ?? `gwc:${r.gwcField}`;
    if (!ratingMap.has(r.subjectId)) ratingMap.set(r.subjectId, new Map());
    ratingMap.get(r.subjectId)!.set(key, r.rating);
  }

  // Identify people below the bar (2+ minus or plus_minus ratings)
  function belowBar(memberId: string): boolean {
    const mr = ratingMap.get(memberId);
    if (!mr) return false;
    let negativeCount = 0;
    for (const rating of mr.values()) {
      if (rating === 'minus') negativeCount += 2;
      if (rating === 'plus_minus') negativeCount += 1;
    }
    return negativeCount >= 3;
  }

  const columns = [
    ...coreValues.map((cv) => ({ id: cv.id, label: cv.title })),
    { id: 'gwc:gets_it', label: 'G' },
    { id: 'gwc:wants_it', label: 'W' },
    { id: 'gwc:capacity', label: 'C' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>People Review</CardTitle>
        <Link href="/people" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Edit Ratings <ExternalLink className="h-3 w-3 ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Person</th>
                  {columns.map((col) => (
                    <th key={col.id} className="py-2 px-2 text-center font-medium min-w-[3rem]">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-2 pl-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isBelowBar = belowBar(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`border-b last:border-0 ${isBelowBar ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                    >
                      <td className="py-2 pr-4 font-medium">{m.name || m.email}</td>
                      {columns.map((col) => {
                        const rating = ratingMap.get(m.id)?.get(col.id);
                        return (
                          <td key={col.id} className="py-2 px-2 text-center">
                            <span
                              className={`text-sm font-mono ${
                                rating === 'plus'
                                  ? 'text-emerald-600 font-bold'
                                  : rating === 'minus'
                                    ? 'text-red-600 font-bold'
                                    : rating === 'plus_minus'
                                      ? 'text-amber-600 font-bold'
                                      : 'text-muted-foreground'
                              }`}
                            >
                              {rating ? RATING_DISPLAY[rating] : '--'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2 pl-4">
                        {isBelowBar ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Below Bar
                          </Badge>
                        ) : (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: V/TO Check                                                 */
/* ------------------------------------------------------------------ */

type VTOChecklist = {
  coreFocus: boolean | null;
  tenYearTarget: boolean | null;
  threeYearPicture: boolean | null;
  oneYearPlan: boolean | null;
  marketingStrategy: boolean | null;
};

function VTOCheckStep({
  vto,
  checklist,
  onChecklistChange,
}: {
  vto: VTOData;
  checklist: VTOChecklist;
  onChecklistChange: (key: keyof VTOChecklist, value: boolean) => void;
}) {
  const sections = [
    {
      key: 'coreFocus' as const,
      label: 'Core Focus',
      summary: vto
        ? [vto.coreFocusPurpose, vto.coreFocusNiche].filter(Boolean).join(' / ') || 'Not set'
        : 'Not set',
    },
    {
      key: 'tenYearTarget' as const,
      label: '10-Year Target',
      summary: vto?.tenYearTarget || 'Not set',
    },
    {
      key: 'threeYearPicture' as const,
      label: '3-Year Picture',
      summary: vto
        ? [
            vto.threeYearPictureRevenue ? `Revenue: ${vto.threeYearPictureRevenue}` : null,
            vto.threeYearPictureProfit ? `Profit: ${vto.threeYearPictureProfit}` : null,
          ]
            .filter(Boolean)
            .join(', ') || 'Not set'
        : 'Not set',
    },
    {
      key: 'oneYearPlan' as const,
      label: '1-Year Plan',
      summary: vto
        ? (() => {
            const goals = vto.oneYearPlanGoals ?? [];
            const parts = [
              vto.oneYearPlanRevenue ? `Revenue: ${vto.oneYearPlanRevenue}` : null,
              goals.length > 0 ? `${goals.length} goal${goals.length === 1 ? '' : 's'}` : null,
            ].filter(Boolean);
            return parts.join(', ') || 'Not set';
          })()
        : 'Not set',
    },
    {
      key: 'marketingStrategy' as const,
      label: 'Marketing Strategy',
      summary: vto
        ? [
            vto.marketingStrategyTargetMarket ? `Target: ${vto.marketingStrategyTargetMarket}` : null,
            (vto.marketingStrategyUniques?.length ?? 0) > 0
              ? `${vto.marketingStrategyUniques!.length} unique(s)`
              : null,
          ]
            .filter(Boolean)
            .join(', ') || 'Not set'
        : 'Not set',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>V/TO Check</CardTitle>
        <Link href="/vto" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Edit V/TO <ExternalLink className="h-3 w-3 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Review each section of your Vision/Traction Organizer. Is it still accurate?
        </p>
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.key}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{section.label}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{section.summary}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">Still accurate?</span>
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant={checklist[section.key] === true ? 'default' : 'outline'}
                    onClick={() => onChecklistChange(section.key, true)}
                  >
                    Yes
                  </Button>
                  <Button
                    size="xs"
                    variant={checklist[section.key] === false ? 'destructive' : 'outline'}
                    onClick={() => onChecklistChange(section.key, false)}
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: Next Quarter Planning                                      */
/* ------------------------------------------------------------------ */

function NextQuarterStep({
  members,
  drafts,
  onAddDraft,
  onRemoveDraft,
  onUpdateDraft,
  nextQ,
  createdCount,
  isCreating,
  rocks,
  checklist,
}: {
  members: Member[];
  drafts: NewRockDraft[];
  onAddDraft: () => void;
  onRemoveDraft: (idx: number) => void;
  onUpdateDraft: (idx: number, field: keyof NewRockDraft, value: string) => void;
  nextQ: string;
  createdCount: number;
  isCreating: boolean;
  rocks: Rock[];
  checklist: VTOChecklist;
}) {
  const done = rocks.filter((r) => r.status === 'done').length;
  const total = rocks.length;
  const checklistAnswered = Object.values(checklist).filter((v) => v !== null).length;
  const checklistYes = Object.values(checklist).filter((v) => v === true).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Quarter Planning &mdash; {nextQ}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="font-medium text-sm">Review Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Rocks completed: </span>
              <span className="font-medium">{done}/{total}</span>
            </div>
            <div>
              <span className="text-muted-foreground">V/TO sections checked: </span>
              <span className="font-medium">{checklistAnswered}/5</span>
            </div>
            <div>
              <span className="text-muted-foreground">V/TO accurate: </span>
              <span className="font-medium">{checklistYes}/{checklistAnswered || 0}</span>
            </div>
          </div>
        </div>

        {/* New rocks input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">New Rocks for {nextQ}</Label>
            <Button size="sm" variant="outline" onClick={onAddDraft}>
              <Plus className="h-3 w-3 mr-1" /> Add Rock
            </Button>
          </div>

          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No new rocks added yet. Click "Add Rock" to plan next quarter.
            </p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft, idx) => (
                <div key={idx} className="flex items-end gap-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      placeholder="e.g. Launch new marketing campaign"
                      value={draft.title}
                      onChange={(e) => onUpdateDraft(idx, 'title', e.target.value)}
                    />
                  </div>
                  <div className="w-48 space-y-1">
                    <Label className="text-xs">Owner</Label>
                    <select
                      value={draft.ownerId}
                      onChange={(e) => onUpdateDraft(idx, 'ownerId', e.target.value)}
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveDraft(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {createdCount > 0 && (
            <p className="text-sm text-emerald-600 font-medium">
              {createdCount} rock{createdCount === 1 ? '' : 's'} created for {nextQ}!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Wizard                                                        */
/* ------------------------------------------------------------------ */

export function ReviewWizard({
  rocks: initialRocks,
  coreValues,
  ratings,
  members,
  vto,
  quarter,
}: {
  rocks: Rock[];
  coreValues: CoreValue[];
  ratings: PeopleRating[];
  members: Member[];
  vto: VTOData;
  quarter: string;
}) {
  const [step, setStep] = useState(0);
  const [rocks, setRocks] = useState(initialRocks);
  const [isPending, startTransition] = useTransition();
  const [checklist, setChecklist] = useState<VTOChecklist>({
    coreFocus: null,
    tenYearTarget: null,
    threeYearPicture: null,
    oneYearPlan: null,
    marketingStrategy: null,
  });
  const [drafts, setDrafts] = useState<NewRockDraft[]>([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const nextQ = nextQuarter(quarter);

  function handleStatusChange(id: string, status: 'on_track' | 'off_track' | 'done') {
    setRocks((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    startTransition(async () => {
      try {
        await updateRockStatus(id, status);
        toast.success(`Rock marked as ${STATUS_BADGE[status].label.toLowerCase()}`);
      } catch {
        toast.error('Failed to update rock status');
        setRocks((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: initialRocks.find((ir) => ir.id === id)!.status } : r))
        );
      }
    });
  }

  function handleChecklistChange(key: keyof VTOChecklist, value: boolean) {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, { title: '', ownerId: '' }]);
  }

  function removeDraft(idx: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDraft(idx: number, field: keyof NewRockDraft, value: string) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  }

  async function handleCreateRocks() {
    const valid = drafts.filter((d) => d.title.trim() && d.ownerId);
    if (valid.length === 0) {
      toast.error('Add at least one rock with a title and owner');
      return;
    }
    setIsCreating(true);
    try {
      for (const draft of valid) {
        await createRock({
          title: draft.title.trim(),
          ownerId: draft.ownerId,
          quarter: nextQ,
        });
      }
      setCreatedCount(valid.length);
      setDrafts([]);
      toast.success(`Created ${valid.length} rock${valid.length === 1 ? '' : 's'} for ${nextQ}`);
    } catch {
      toast.error('Failed to create rocks');
    } finally {
      setIsCreating(false);
    }
  }

  function handleNext() {
    if (step === 3) {
      // On the last step, create rocks if there are drafts
      const valid = drafts.filter((d) => d.title.trim() && d.ownerId);
      if (valid.length > 0) {
        handleCreateRocks();
      }
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="space-y-2">
        <StepIndicator current={step} total={STEPS.length} />
        <p className="text-center text-sm font-medium text-muted-foreground">
          Step {step + 1}: {STEPS[step]}
        </p>
      </div>

      {/* Step content */}
      {step === 0 && (
        <RockReviewStep rocks={rocks} onStatusChange={handleStatusChange} />
      )}
      {step === 1 && (
        <PeopleReviewStep
          members={members}
          coreValues={coreValues}
          ratings={ratings}
        />
      )}
      {step === 2 && (
        <VTOCheckStep
          vto={vto}
          checklist={checklist}
          onChecklistChange={handleChecklistChange}
        />
      )}
      {step === 3 && (
        <NextQuarterStep
          members={members}
          drafts={drafts}
          onAddDraft={addDraft}
          onRemoveDraft={removeDraft}
          onUpdateDraft={updateDraft}
          nextQ={nextQ}
          createdCount={createdCount}
          isCreating={isCreating}
          rocks={rocks}
          checklist={checklist}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateRocks}
            disabled={isCreating || drafts.filter((d) => d.title.trim() && d.ownerId).length === 0}
          >
            {isCreating
              ? 'Creating...'
              : createdCount > 0
                ? 'All Done!'
                : 'Create Rocks & Finish'}
          </Button>
        )}
      </div>
    </div>
  );
}
