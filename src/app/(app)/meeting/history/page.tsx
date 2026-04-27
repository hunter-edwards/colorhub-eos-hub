import Link from 'next/link';
import { listMeetings } from '@/server/meetings';
import { Badge } from '@/components/ui/badge';

export default async function MeetingHistoryPage() {
  const meetings = await listMeetings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Meeting History</h1>

      {meetings.length === 0 && (
        <p className="text-muted-foreground">No meetings yet.</p>
      )}

      <div className="space-y-2">
        {meetings.map((m) => {
          const isDraft = m.status === 'draft';
          const isLive = m.status === 'live';
          const dateSource = isDraft && m.scheduledFor ? m.scheduledFor : m.startedAt;
          const href = isDraft
            ? `/meeting/${m.id}/prep`
            : isLive
              ? '/meeting/live'
              : `/meeting/history/${m.id}`;
          return (
            <Link
              key={m.id}
              href={href}
              className="flex items-center gap-4 px-4 py-3 rounded-md hover:bg-accent"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {new Date(dateSource).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isDraft ? (
                    <>Scheduled {new Date(dateSource).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                  ) : (
                    <>
                      {new Date(m.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.endedAt && (
                        <> — {new Date(m.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </>
                  )}
                </div>
              </div>
              <Badge variant="secondary">{m.type}</Badge>
              {m.ratingAvg && (
                <span className="text-sm font-medium">{m.ratingAvg}/10</span>
              )}
              {isDraft ? (
                <Badge variant="outline">Upcoming</Badge>
              ) : isLive ? (
                <Badge variant="default">In progress</Badge>
              ) : m.aiSummaryMd ? (
                <Badge variant="default">Summary</Badge>
              ) : (
                <Badge variant="destructive">No summary</Badge>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
