'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const activeIdx = SECTIONS.findIndex((s) => s.key === active);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // 1-7: jump to section
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) {
        setActive(SECTIONS[num - 1].key);
        return;
      }

      // ArrowRight / Space: next section
      if ((e.key === 'ArrowRight' || e.key === ' ') && activeIdx < SECTIONS.length - 1) {
        e.preventDefault();
        setActive(SECTIONS[activeIdx + 1].key);
        return;
      }

      // ArrowLeft: previous section
      if (e.key === 'ArrowLeft' && activeIdx > 0) {
        e.preventDefault();
        setActive(SECTIONS[activeIdx - 1].key);
      }
    },
    [activeIdx]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
            <kbd className="text-[10px] opacity-50 font-mono w-3">{i + 1}</kbd>
            {s.label}
          </button>
        ))}
        <p className="text-[10px] text-muted-foreground px-3 pt-3">
          Keys: 1-7 jump · ←→ prev/next
        </p>
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
