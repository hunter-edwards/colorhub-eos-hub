import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getMeeting, getMeetingRatings, listHeadlines, getMeetingChangelog } from '@/server/meetings';
import { UserAvatar } from '@/components/user-avatar';
import { SummaryView } from './summary-view';
import { MeetingChangelog } from './changelog';

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [meeting, ratings, hdls, changelogResult] = await Promise.all([
    getMeeting(id),
    getMeetingRatings(id),
    listHeadlines(id),
    // Don't 500 the whole page if changelog query blows up — just hide the section.
    getMeetingChangelog(id).catch((e) => {
      console.error('getMeetingChangelog failed:', e);
      return null;
    }),
  ]);
  const changelog = changelogResult;

  if (!meeting) notFound();

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

      {/* Structured changelog of what changed during the meeting */}
      {changelog && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What changed
          </h2>
          <MeetingChangelog log={changelog} />
        </section>
      )}

      {/* Raw data */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Raw meeting data
        </summary>
        <div className="mt-3 space-y-4">
          {ratings.length > 0 && (
            <div>
              <h3 className="font-medium mb-1">Ratings</h3>
              {ratings.map((r) => (
                <div key={r.userId} className="flex items-center gap-1.5 text-muted-foreground">
                  <UserAvatar user={{ name: r.userName }} size="sm" />
                  {r.userName || r.userEmail}: {r.rating}/10
                </div>
              ))}
            </div>
          )}
          {hdls.length > 0 && (
            <div>
              <h3 className="font-medium mb-1">Headlines</h3>
              {hdls.map((h) => (
                <div key={h.id} className="text-muted-foreground">
                  [{h.kind}] {h.text} — {h.authorName}
                </div>
              ))}
            </div>
          )}
          <div>
            <h3 className="font-medium mb-1">Attendees</h3>
            <div className="text-muted-foreground">
              {(meeting.attendees as { name?: string; email?: string }[])
                .map((a) => a.name || a.email)
                .join(', ') || 'None recorded'}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
