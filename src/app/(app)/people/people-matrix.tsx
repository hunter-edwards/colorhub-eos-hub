'use client';

import { useState, useTransition } from 'react';
import { Printer } from 'lucide-react';
import { setRating, listPeopleRatings } from '@/server/people-analyzer';

type Member = { id: string; name: string | null; profileColor: string | null };
type CoreValue = { id: string; title: string };
type Rating = {
  id: string;
  teamId: string;
  subjectId: string;
  coreValueId: string | null;
  gwcField: string | null;
  rating: 'plus' | 'plus_minus' | 'minus';
  quarter: string;
};

const GWC_FIELDS = ['gets_it', 'wants_it', 'capacity'] as const;
const GWC_LABELS: Record<string, string> = {
  gets_it: 'G',
  wants_it: 'W',
  capacity: 'C',
};

type RatingValue = 'plus' | 'plus_minus' | 'minus';

function ratingDisplay(r: RatingValue | null): string {
  if (r === 'plus') return '+';
  if (r === 'plus_minus') return '+/\u2212';
  if (r === 'minus') return '\u2212';
  return '\u2013';
}

function ratingClasses(r: RatingValue | null): string {
  if (r === 'plus') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (r === 'plus_minus') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  if (r === 'minus') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-muted text-muted-foreground';
}

function nextRating(current: RatingValue | null): RatingValue {
  if (current === null) return 'plus';
  if (current === 'plus') return 'plus_minus';
  if (current === 'plus_minus') return 'minus';
  return 'plus';
}

function buildRatingKey(subjectId: string, coreValueId: string | null, gwcField: string | null): string {
  return `${subjectId}:${coreValueId ?? ''}:${gwcField ?? ''}`;
}

function generateQuarters(current: string, count: number): string[] {
  const [yearStr, qStr] = current.split('-Q');
  let year = parseInt(yearStr, 10);
  let q = parseInt(qStr, 10);
  const quarters: string[] = [];
  for (let i = 0; i < count; i++) {
    quarters.push(`${year}-Q${q}`);
    q--;
    if (q === 0) {
      q = 4;
      year--;
    }
  }
  return quarters;
}

function hasMinus(
  memberId: string,
  coreValues: CoreValue[],
  ratingMap: Map<string, RatingValue>,
): boolean {
  for (const cv of coreValues) {
    const key = buildRatingKey(memberId, cv.id, null);
    if (ratingMap.get(key) === 'minus') return true;
  }
  for (const gwc of GWC_FIELDS) {
    const key = buildRatingKey(memberId, null, gwc);
    if (ratingMap.get(key) === 'minus') return true;
  }
  return false;
}

function RatingCell({
  value,
  onClick,
  pending,
}: {
  value: RatingValue | null;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <td className="p-0 text-center">
      <button
        type="button"
        className={`w-full px-2 py-2 text-xs font-semibold cursor-pointer transition-colors hover:opacity-80 disabled:opacity-50 ${ratingClasses(value)}`}
        onClick={onClick}
        disabled={pending}
      >
        {ratingDisplay(value)}
      </button>
    </td>
  );
}

export function PeopleMatrix({
  members,
  coreValues,
  initialRatings,
  currentQuarter,
}: {
  members: Member[];
  coreValues: CoreValue[];
  initialRatings: Rating[];
  currentQuarter: string;
}) {
  const quarters = generateQuarters(currentQuarter, 8);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [ratingMap, setRatingMap] = useState<Map<string, RatingValue>>(() => {
    const map = new Map<string, RatingValue>();
    for (const r of initialRatings) {
      map.set(buildRatingKey(r.subjectId, r.coreValueId, r.gwcField), r.rating);
    }
    return map;
  });
  const [isPending, startTransition] = useTransition();

  function handleQuarterChange(quarter: string) {
    setSelectedQuarter(quarter);
    startTransition(async () => {
      const ratings = await listPeopleRatings(quarter);
      const map = new Map<string, RatingValue>();
      for (const r of ratings) {
        map.set(buildRatingKey(r.subjectId, r.coreValueId, r.gwcField), r.rating);
      }
      setRatingMap(map);
    });
  }

  function handleCellClick(
    subjectId: string,
    coreValueId: string | null,
    gwcField: string | null,
  ) {
    const key = buildRatingKey(subjectId, coreValueId, gwcField);
    const current = ratingMap.get(key) ?? null;
    const next = nextRating(current);

    // Optimistic update
    setRatingMap((prev) => {
      const map = new Map(prev);
      map.set(key, next);
      return map;
    });

    startTransition(async () => {
      await setRating({
        subjectId,
        coreValueId: coreValueId ?? undefined,
        gwcField: gwcField ?? undefined,
        rating: next,
        quarter: selectedQuarter,
      });
    });
  }

  const colCount = coreValues.length + GWC_FIELDS.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="quarter-select" className="text-sm font-medium no-print">
          Quarter
        </label>
        <select
          id="quarter-select"
          value={selectedQuarter}
          onChange={(e) => handleQuarterChange(e.target.value)}
          className="flex h-8 rounded-lg border border-input bg-transparent px-3 text-sm no-print"
        >
          {quarters.map((q) => (
            <option key={q} value={q}>
              {q}{q === currentQuarter ? ' (current)' : ''}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print ml-auto inline-flex items-center gap-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-3 py-2 font-medium min-w-[160px]">
                Team Member
              </th>
              {coreValues.map((cv) => (
                <th
                  key={cv.id}
                  className="px-2 py-2 text-xs font-medium text-center min-w-[60px]"
                  title={cv.title}
                >
                  {cv.title}
                </th>
              ))}
              {GWC_FIELDS.map((field) => (
                <th
                  key={field}
                  className="px-2 py-2 text-xs font-medium text-center min-w-[44px] border-l border-border"
                >
                  {GWC_LABELS[field]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={colCount + 1}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No team members found.
                </td>
              </tr>
            )}
            {members.map((member) => {
              const memberHasMinus = hasMinus(member.id, coreValues, ratingMap);
              return (
                <tr key={member.id} className="border-b hover:bg-accent/50">
                  <td
                    className={`px-3 py-2 font-medium ${
                      memberHasMinus
                        ? 'bg-red-50 dark:bg-red-950/30'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {member.profileColor && (
                        <span
                          className="inline-block w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: member.profileColor }}
                        />
                      )}
                      <span className="text-sm">
                        {member.name || 'Unnamed'}
                      </span>
                    </div>
                  </td>
                  {coreValues.map((cv) => {
                    const key = buildRatingKey(member.id, cv.id, null);
                    return (
                      <RatingCell
                        key={cv.id}
                        value={ratingMap.get(key) ?? null}
                        onClick={() => handleCellClick(member.id, cv.id, null)}
                        pending={isPending}
                      />
                    );
                  })}
                  {GWC_FIELDS.map((field) => {
                    const key = buildRatingKey(member.id, null, field);
                    return (
                      <RatingCell
                        key={field}
                        value={ratingMap.get(key) ?? null}
                        onClick={() => handleCellClick(member.id, null, field)}
                        pending={isPending}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {members.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-green-100 dark:bg-green-900/40" />
            + (strong)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/40" />
            +/&minus; (moderate)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-red-100 dark:bg-red-900/40" />
            &minus; (weak)
          </span>
        </div>
      )}
    </div>
  );
}
