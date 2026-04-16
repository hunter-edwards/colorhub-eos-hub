'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { saveVTO } from '@/server/vto';
import { toast } from 'sonner';
import {
  Plus,
  X,
  Save,
  ArrowRight,
  Target,
  Compass,
  Megaphone,
  Calendar,
  Mountain,
  AlertCircle,
  Heart,
} from 'lucide-react';
import Link from 'next/link';

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

type CoreValue = {
  id: string;
  title: string;
  description: string | null;
  orderIdx: number;
};

type Rock = {
  id: string;
  title: string;
  status: 'on_track' | 'off_track' | 'done' | null;
  ownerName: string | null;
};

type Issue = {
  id: string;
  title: string;
  ownerName: string | null;
  list: 'short_term' | 'long_term' | null;
};

// ── Editable string list ─────────────────────────────────────

function EditableList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft('');
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex-1 text-sm">{item}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(i)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? 'Add item...'}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Section save button ──────────────────────────────────────

function SectionSaveButton({
  isPending,
  onClick,
}: {
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={onClick}
    >
      <Save className="mr-1 h-4 w-4" />
      {isPending ? 'Saving...' : 'Save'}
    </Button>
  );
}

// ── Status badge for rocks ───────────────────────────────────

const statusConfig = {
  on_track: { label: 'On Track', variant: 'secondary' as const },
  off_track: { label: 'Off Track', variant: 'destructive' as const },
  done: { label: 'Done', variant: 'default' as const },
};

// ── Main form ────────────────────────────────────────────────

export function VTOForm({
  vto,
  coreValues,
  rocks,
  issues,
  quarter,
}: {
  vto: VTOData;
  coreValues: CoreValue[];
  rocks: Rock[];
  issues: Issue[];
  quarter: string;
}) {
  // Core Focus
  const [coreFocusPurpose, setCoreFocusPurpose] = useState(vto?.coreFocusPurpose ?? '');
  const [coreFocusNiche, setCoreFocusNiche] = useState(vto?.coreFocusNiche ?? '');

  // 10-Year Target
  const [tenYearTarget, setTenYearTarget] = useState(vto?.tenYearTarget ?? '');

  // Marketing Strategy
  const [targetMarket, setTargetMarket] = useState(vto?.marketingStrategyTargetMarket ?? '');
  const [uniques, setUniques] = useState<string[]>(vto?.marketingStrategyUniques ?? []);
  const [provenProcess, setProvenProcess] = useState(vto?.marketingStrategyProvenProcess ?? '');
  const [guarantee, setGuarantee] = useState(vto?.marketingStrategyGuarantee ?? '');

  // 3-Year Picture
  const [threeYearDate, setThreeYearDate] = useState(vto?.threeYearPictureDate ?? '');
  const [threeYearRevenue, setThreeYearRevenue] = useState(vto?.threeYearPictureRevenue ?? '');
  const [threeYearProfit, setThreeYearProfit] = useState(vto?.threeYearPictureProfit ?? '');
  const [measurables, setMeasurables] = useState<string[]>(vto?.threeYearPictureMeasurables ?? []);

  // 1-Year Plan
  const [oneYearDate, setOneYearDate] = useState(vto?.oneYearPlanDate ?? '');
  const [oneYearRevenue, setOneYearRevenue] = useState(vto?.oneYearPlanRevenue ?? '');
  const [oneYearProfit, setOneYearProfit] = useState(vto?.oneYearPlanProfit ?? '');
  const [goals, setGoals] = useState<string[]>(vto?.oneYearPlanGoals ?? []);

  const [isPending, startTransition] = useTransition();

  function handleSaveSection(data: Parameters<typeof saveVTO>[0]) {
    startTransition(async () => {
      try {
        await saveVTO(data);
        toast.success('Section saved');
      } catch {
        toast.error('Failed to save');
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ─── VISION COLUMN ─────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-muted-foreground tracking-wide uppercase">
          Vision
        </h2>

        {/* Core Values (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Core Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coreValues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No core values defined yet.</p>
            ) : (
              <ul className="space-y-1">
                {coreValues.map((cv) => (
                  <li key={cv.id} className="text-sm">
                    <span className="font-medium">{cv.title}</span>
                    {cv.description && (
                      <span className="text-muted-foreground"> &mdash; {cv.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/core-values">
                <Button variant="outline" size="sm">
                  Edit Core Values <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Core Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Core Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Purpose / Cause / Passion</label>
              <Textarea
                value={coreFocusPurpose}
                onChange={(e) => setCoreFocusPurpose(e.target.value)}
                placeholder="Why does this organization exist?"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Niche</label>
              <Textarea
                value={coreFocusNiche}
                onChange={(e) => setCoreFocusNiche(e.target.value)}
                placeholder="What do you do best?"
                rows={2}
              />
            </div>
            <SectionSaveButton
              isPending={isPending}
              onClick={() =>
                handleSaveSection({
                  coreFocusPurpose: coreFocusPurpose || null,
                  coreFocusNiche: coreFocusNiche || null,
                })
              }
            />
          </CardContent>
        </Card>

        {/* 10-Year Target */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              10-Year Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={tenYearTarget}
              onChange={(e) => setTenYearTarget(e.target.value)}
              placeholder="What is your long-term, large, inspiring goal?"
              rows={3}
            />
            <SectionSaveButton
              isPending={isPending}
              onClick={() =>
                handleSaveSection({
                  tenYearTarget: tenYearTarget || null,
                })
              }
            />
          </CardContent>
        </Card>

        {/* Marketing Strategy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Marketing Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Target Market</label>
              <Textarea
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                placeholder="Who is your ideal customer?"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">3 Uniques</label>
              <EditableList
                items={uniques}
                onChange={setUniques}
                placeholder="Add a unique differentiator..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Proven Process</label>
              <Textarea
                value={provenProcess}
                onChange={(e) => setProvenProcess(e.target.value)}
                placeholder="What is your proven process?"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Guarantee</label>
              <Textarea
                value={guarantee}
                onChange={(e) => setGuarantee(e.target.value)}
                placeholder="What do you guarantee?"
                rows={2}
              />
            </div>
            <SectionSaveButton
              isPending={isPending}
              onClick={() =>
                handleSaveSection({
                  marketingStrategyTargetMarket: targetMarket || null,
                  marketingStrategyUniques: uniques.length > 0 ? uniques : null,
                  marketingStrategyProvenProcess: provenProcess || null,
                  marketingStrategyGuarantee: guarantee || null,
                })
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── TRACTION COLUMN ───────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-muted-foreground tracking-wide uppercase">
          Traction
        </h2>

        {/* 3-Year Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              3-Year Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Future Date</label>
                <Input
                  type="date"
                  value={threeYearDate}
                  onChange={(e) => setThreeYearDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Revenue</label>
                <Input
                  value={threeYearRevenue}
                  onChange={(e) => setThreeYearRevenue(e.target.value)}
                  placeholder="$"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Profit</label>
                <Input
                  value={threeYearProfit}
                  onChange={(e) => setThreeYearProfit(e.target.value)}
                  placeholder="$"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Measurables</label>
              <EditableList
                items={measurables}
                onChange={setMeasurables}
                placeholder="Add a measurable..."
              />
            </div>
            <SectionSaveButton
              isPending={isPending}
              onClick={() =>
                handleSaveSection({
                  threeYearPictureDate: threeYearDate || null,
                  threeYearPictureRevenue: threeYearRevenue || null,
                  threeYearPictureProfit: threeYearProfit || null,
                  threeYearPictureMeasurables: measurables.length > 0 ? measurables : null,
                })
              }
            />
          </CardContent>
        </Card>

        {/* 1-Year Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              1-Year Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Future Date</label>
                <Input
                  type="date"
                  value={oneYearDate}
                  onChange={(e) => setOneYearDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Revenue</label>
                <Input
                  value={oneYearRevenue}
                  onChange={(e) => setOneYearRevenue(e.target.value)}
                  placeholder="$"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Profit</label>
                <Input
                  value={oneYearProfit}
                  onChange={(e) => setOneYearProfit(e.target.value)}
                  placeholder="$"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Goals</label>
              <EditableList
                items={goals}
                onChange={setGoals}
                placeholder="Add a goal..."
              />
            </div>
            <SectionSaveButton
              isPending={isPending}
              onClick={() =>
                handleSaveSection({
                  oneYearPlanDate: oneYearDate || null,
                  oneYearPlanRevenue: oneYearRevenue || null,
                  oneYearPlanProfit: oneYearProfit || null,
                  oneYearPlanGoals: goals.length > 0 ? goals : null,
                })
              }
            />
          </CardContent>
        </Card>

        {/* Quarterly Rocks (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-4 w-4" />
              Rocks &mdash; {quarter}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rocks for this quarter.</p>
            ) : (
              <ul className="space-y-2">
                {rocks.map((rock) => (
                  <li key={rock.id} className="flex items-center justify-between text-sm">
                    <span>{rock.title}</span>
                    <div className="flex items-center gap-2">
                      {rock.ownerName && (
                        <span className="text-xs text-muted-foreground">{rock.ownerName}</span>
                      )}
                      {rock.status && (
                        <Badge variant={statusConfig[rock.status].variant}>
                          {statusConfig[rock.status].label}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/rocks">
                <Button variant="outline" size="sm">
                  View Rocks <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Issues List (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Issues List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open issues.</p>
            ) : (
              <ul className="space-y-2">
                {issues.map((issue) => (
                  <li key={issue.id} className="flex items-center justify-between text-sm">
                    <span>{issue.title}</span>
                    <div className="flex items-center gap-2">
                      {issue.ownerName && (
                        <span className="text-xs text-muted-foreground">{issue.ownerName}</span>
                      )}
                      {issue.list && (
                        <Badge variant="outline">
                          {issue.list === 'short_term' ? 'Short' : 'Long'}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/issues">
                <Button variant="outline" size="sm">
                  View Issues <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
