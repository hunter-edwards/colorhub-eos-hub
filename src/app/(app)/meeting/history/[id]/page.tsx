import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Megaphone } from 'lucide-react';
import { getMeeting, getMeetingRatings, listHeadlines, getMeetingChangelog } from '@/server/meetings';
import { collectMeetingContext } from '@/server/ai-summary';
import { UserAvatar } from '@/components/user-avatar';
import { SummaryView } from './summary-view';
import { MeetingChangelog } from './changelog';

type Attendee = { id?: string; name?: string | null; email?: string };

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [meeting, ratings, hdls, changelog, context] = await Promise.all([
    getMeeting(id),
    getMeetingRatings(id),
    listHeadlines(id),
    getMeetingChangelog(id).catch((e) => {
      console.error('getMeetingChangelog failed:', e);
      return null;
    }),
    collectMeetingContext(id).catch((e) => {
      console.error('collectMeetingContext failed:', e);
      return null;
    }),
  ]);

  if (!meeting) notFound();

  const attendees = (meeting.attendees ?? []) as Attendee[];
  const ratingByUser = new Map(ratings.map((r) => [r.userId, r.rating]));
  const scorecardReds = context?.scorecardReds ?? [];
  const cascadingMessage = meeting.cascadingMessage?.trim();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/meeting/history"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to History
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {meeting.type} Meeting —{' '}
          {new Date(meeting.startedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h1>
        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
          <span>
            {new Date(meeting.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {meeting.endedAt && (
              <> — {new Date(meeting.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </span>
          {meeting.ratingAvg && <span>Rating: {meeting.ratingAvg}/10</span>}
        </div>
      </div>

      <SummaryView meetingId={id} summary={meeting.aiSummaryMd} />

      {/* Meeting Health */}
      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Meeting Health
        </h2>
        <div className="flex items-start gap-10">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg rating</div>
            <div className="text-3xl font-bold tabular-nums">
              {meeting.ratingAvg ?? '–'}
              <span className="text-base font-normal text-muted-foreground">/10</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Attendees</div>
            <div className="text-3xl font-bold tabular-nums">{attendees.length}</div>
          </div>
        </div>
        {attendees.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {attendees.map((a, idx) => {
              const displayName = a.name || a.email || 'Unknown';
              const r = a.id ? ratingByUser.get(a.id) : undefined;
              return (
                <li
                  key={a.id ?? idx}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs"
                >
                  <UserAvatar user={{ name: a.name ?? null }} size="sm" />
                  <span>{displayName}</span>
                  {r != null && (
                    <span className="tabular-nums text-muted-foreground">{r}/10</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Scorecard reds */}
      {scorecardReds.length > 0 && (
        <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Scorecard — in the red
          </h2>
          <ul className="space-y-1.5 text-sm">
            {scorecardReds.map((r) => (
              <li key={r.metric} className="flex items-center gap-2">
                <span className="font-medium">{r.metric}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.value} / goal {r.goal}
                </span>
                {r.owner && (
                  <span className="ml-auto text-xs text-muted-foreground">{r.owner}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Headlines shared during the meeting */}
      {hdls.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Headlines shared</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(['customer', 'employee'] as const).map((kind) => {
              const items = hdls.filter((h) => h.kind === kind);
              if (items.length === 0) return null;
              return (
                <div key={kind} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {kind === 'customer' ? 'Customer' : 'Employee'}
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {items.map((h) => (
                      <li key={h.id} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span>
                          {h.text}{' '}
                          {h.authorName && (
                            <span className="text-xs text-muted-foreground">— {h.authorName}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cascading message */}
      {cascadingMessage && (
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Megaphone className="h-3.5 w-3.5" />
            Cascading Message
          </h2>
          <p className="whitespace-pre-wrap text-sm">{cascadingMessage}</p>
        </section>
      )}

      {/* Structured changelog of what changed during the meeting */}
      {changelog && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What changed
          </h2>
          <MeetingChangelog log={changelog} />
        </section>
      )}
    </div>
  );
}
