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
        {meetings.map((m) => (
          <Link
            key={m.id}
            href={`/meeting/history/${m.id}`}
            className="flex items-center gap-4 px-4 py-3 rounded-md hover:bg-accent"
          >
            <div className="flex-1">
              <div className="text-sm font-medium">
                {new Date(m.startedAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(m.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {m.endedAt && (
                  <> — {new Date(m.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                )}
              </div>
            </div>
            <Badge variant="secondary">{m.type}</Badge>
            {m.ratingAvg && (
              <span className="text-sm font-medium">{m.ratingAvg}/10</span>
            )}
            {m.aiSummaryMd ? (
              <Badge variant="default">Summary</Badge>
            ) : m.endedAt ? (
              <Badge variant="destructive">No summary</Badge>
            ) : (
              <Badge variant="outline">In progress</Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
