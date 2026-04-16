'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Timer } from './timer';
import { SeguePanel } from './panels/segue';
import { HeadlinesPanel } from './panels/headlines';
import { ScorecardPanel } from './panels/scorecard';
import { RockReviewPanel } from './panels/rock-review';
import { TodoReviewPanel } from './panels/todo-review';
import { IDSPanel } from './panels/ids';
import { ConcludePanel } from './panels/conclude';

const SECTIONS = [
  { key: 'segue', label: 'Segue', time: 300 },
  { key: 'scorecard', label: 'Scorecard', time: 300 },
  { key: 'rocks', label: 'Rock Review', time: 300 },
  { key: 'headlines', label: 'Headlines', time: 300 },
  { key: 'todos', label: 'To-Do Review', time: 300 },
  { key: 'ids', label: 'IDS', time: 3600 },
  { key: 'conclude', label: 'Conclude', time: 300 },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export function Agenda({
  meetingId,
  startedAt,
}: {
  meetingId: string;
  startedAt: Date;
}) {
  const [active, setActive] = useState<SectionKey>('segue');
  const section = SECTIONS.find((s) => s.key === active)!;

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      {/* Left rail */}
      <div className="w-48 shrink-0 space-y-1">
        <p className="text-xs text-muted-foreground px-3 py-2">
          Started {new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2',
              active === s.key
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-accent'
            )}
          >
            <span className="text-xs opacity-60">{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{section.label}</h2>
          <Timer key={active} seconds={section.time} />
        </div>
        <div className="flex-1 overflow-auto">
          {active === 'segue' && <SeguePanel meetingId={meetingId} />}
          {active === 'scorecard' && <ScorecardPanel meetingId={meetingId} />}
          {active === 'rocks' && <RockReviewPanel meetingId={meetingId} />}
          {active === 'headlines' && <HeadlinesPanel meetingId={meetingId} />}
          {active === 'todos' && <TodoReviewPanel meetingId={meetingId} />}
          {active === 'ids' && <IDSPanel meetingId={meetingId} />}
          {active === 'conclude' && <ConcludePanel meetingId={meetingId} />}
        </div>
      </div>
    </div>
  );
}
