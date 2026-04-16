import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getMeeting, getMeetingRatings, listHeadlines } from '@/server/meetings';
import { SummaryView } from './summary-view';

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [meeting, ratings, hdls] = await Promise.all([
    getMeeting(id),
    getMeetingRatings(id),
    listHeadlines(id),
  ]);

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
                <div key={r.userId} className="text-muted-foreground">
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
