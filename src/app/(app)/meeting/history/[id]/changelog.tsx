import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import type { MeetingChangelog as Changelog } from '@/server/meetings';

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EmptySectionMessage({ text }: { text: string }) {
  return (
    <p className="px-3 py-2 text-xs italic text-muted-foreground">{text}</p>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  accent: 'blue' | 'emerald' | 'rose' | 'amber' | 'violet';
}) {
  const bg = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }[accent];
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
      <div className={`rounded-md p-1 ${bg}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function describeRockEvent(kind: string, payload: Record<string, unknown>): string {
  if (kind === 'status_change') {
    const status = String(payload.status ?? '').replace('_', ' ');
    return `marked ${status}`;
  }
  if (kind === 'progress') {
    return `progress set to ${payload.progressPct}%`;
  }
  if (kind === 'subtask') {
    const action = String(payload.action ?? 'updated');
    const title = String(payload.subtaskTitle ?? '');
    return `${action} subtask "${title}"`;
  }
  if (kind === 'comment') {
    const body = String(payload.body ?? '').slice(0, 120);
    return `commented: "${body}${body.length >= 120 ? '…' : ''}"`;
  }
  if (kind === 'mention') {
    return 'was mentioned';
  }
  return kind;
}

function rockEventColor(kind: string, payload: Record<string, unknown>): string {
  if (kind === 'status_change') {
    const s = String(payload.status ?? '');
    if (s === 'done') return 'text-emerald-600 dark:text-emerald-400';
    if (s === 'off_track') return 'text-rose-600 dark:text-rose-400';
  }
  return 'text-foreground';
}

export function MeetingChangelog({ log }: { log: Changelog }) {
  const totalEvents =
    log.issuesCreated.length +
    log.issuesSolved.length +
    log.issuesDropped.length +
    log.todosCreated.length +
    log.todosCompleted.length +
    log.rockEvents.length;

  if (totalEvents === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No tracked changes during this meeting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Issues */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <SectionHeader
          icon={AlertCircle}
          title="Issues"
          count={
            log.issuesCreated.length +
            log.issuesSolved.length +
            log.issuesDropped.length
          }
          accent="rose"
        />
        <div className="divide-y divide-border/40">
          {log.issuesSolved.length > 0 && (
            <SubGroup
              label="Solved"
              icon={CheckCircle2}
              iconColor="text-emerald-600 dark:text-emerald-400"
            >
              {log.issuesSolved.map((i) => (
                <ItemRow key={i.id}>
                  <span className="font-medium">{i.title}</span>
                  {i.ownerName && <OwnerChip name={i.ownerName} />}
                </ItemRow>
              ))}
            </SubGroup>
          )}
          {log.issuesDropped.length > 0 && (
            <SubGroup
              label="Dropped"
              icon={XCircle}
              iconColor="text-muted-foreground"
            >
              {log.issuesDropped.map((i) => (
                <ItemRow key={i.id}>
                  <span>{i.title}</span>
                  {i.ownerName && <OwnerChip name={i.ownerName} />}
                </ItemRow>
              ))}
            </SubGroup>
          )}
          {log.issuesCreated.length > 0 && (
            <SubGroup
              label="New"
              icon={Plus}
              iconColor="text-blue-600 dark:text-blue-400"
            >
              {log.issuesCreated.map((i) => (
                <ItemRow key={i.id}>
                  <span>{i.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {i.list === 'long_term' ? 'Long-term' : 'Short-term'}
                  </span>
                  {i.ownerName && <OwnerChip name={i.ownerName} />}
                </ItemRow>
              ))}
            </SubGroup>
          )}
          {log.issuesCreated.length === 0 &&
            log.issuesSolved.length === 0 &&
            log.issuesDropped.length === 0 && (
              <EmptySectionMessage text="No issue changes." />
            )}
        </div>
      </div>

      {/* To-Dos */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <SectionHeader
          icon={CheckCircle2}
          title="To-Dos"
          count={log.todosCreated.length + log.todosCompleted.length}
          accent="emerald"
        />
        <div className="divide-y divide-border/40">
          {log.todosCompleted.length > 0 && (
            <SubGroup
              label="Completed"
              icon={CheckCircle2}
              iconColor="text-emerald-600 dark:text-emerald-400"
            >
              {log.todosCompleted.map((t) => (
                <ItemRow key={t.id}>
                  <span className="font-medium line-through opacity-75">
                    {t.title}
                  </span>
                  {t.ownerName && <OwnerChip name={t.ownerName} />}
                </ItemRow>
              ))}
            </SubGroup>
          )}
          {log.todosCreated.length > 0 && (
            <SubGroup
              label="New"
              icon={Plus}
              iconColor="text-blue-600 dark:text-blue-400"
            >
              {log.todosCreated.map((t) => (
                <ItemRow key={t.id}>
                  <span>{t.title}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                    Due {formatDate(t.dueDate)}
                  </span>
                  {t.ownerName && <OwnerChip name={t.ownerName} />}
                </ItemRow>
              ))}
            </SubGroup>
          )}
          {log.todosCreated.length === 0 && log.todosCompleted.length === 0 && (
            <EmptySectionMessage text="No to-do changes." />
          )}
        </div>
      </div>

      {/* Rocks */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <SectionHeader
          icon={Target}
          title="Rocks"
          count={log.rockEvents.length}
          accent="amber"
        />
        <div className="divide-y divide-border/40">
          {log.rockEvents.length === 0 && (
            <EmptySectionMessage text="No rock activity." />
          )}
          {log.rockEvents.map((e) => {
            const Icon =
              e.kind === 'status_change'
                ? TrendingUp
                : e.kind === 'comment'
                  ? MessageSquare
                  : e.kind === 'progress'
                    ? TrendingUp
                    : Circle;
            return (
              <div key={e.id} className="flex items-start gap-2.5 px-3 py-2 text-sm">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/rocks/${e.rockId}`}
                      className="font-medium truncate hover:underline"
                    >
                      {e.rockTitle}
                    </Link>
                    <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                      {formatTime(e.createdAt)}
                    </span>
                  </div>
                  <div className={`text-xs ${rockEventColor(e.kind, e.payload)}`}>
                    <span className="text-muted-foreground">
                      {e.actorName ?? 'Someone'}{' '}
                    </span>
                    {describeRockEvent(e.kind, e.payload)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubGroup({
  label,
  icon: Icon,
  iconColor,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>
        <Icon className={`h-3 w-3 ${iconColor}`} />
        {label}
      </div>
      <div className="divide-y divide-border/30">{children}</div>
    </div>
  );
}

function ItemRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm">{children}</div>
  );
}

function OwnerChip({ name }: { name: string }) {
  return (
    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
      {name}
    </span>
  );
}
