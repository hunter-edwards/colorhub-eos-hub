import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { PencilLine, ArrowLeft } from 'lucide-react';
import { getMeeting } from '@/server/meetings';
import { getCurrentUserRole } from '@/server/auth-helpers';
import { atLeast } from '@/lib/auth';
import { HeadlinesPanel } from '../../live/panels/headlines';
import { ActivateButton } from '../../upcoming/activate-button';

function formatWhen(d: Date | null): string {
  if (!d) return 'Unscheduled';
  return new Date(d).toLocaleString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function MeetingPrepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [meeting, role] = await Promise.all([
    getMeeting(id),
    getCurrentUserRole(),
  ]);
  if (!meeting) notFound();
  if (meeting.status === 'concluded') {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <p>This meeting has already concluded.</p>
        <Link
          href={`/meeting/history/${meeting.id}`}
          className={buttonVariants({ variant: 'outline' })}
        >
          View changelog
        </Link>
      </div>
    );
  }
  if (meeting.status === 'live') {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <p>This meeting is live right now.</p>
        <Link href="/meeting/live" className={buttonVariants()}>
          Join live meeting
        </Link>
      </div>
    );
  }

  const canLead = atLeast(role, 'leader');

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/meeting/upcoming" className="hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Upcoming
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PencilLine className="h-5 w-5" />
            <h1 className="text-2xl font-bold">
              Drafting {meeting.type} for {formatWhen(meeting.scheduledFor)}
            </h1>
          </div>
          <Badge variant="secondary">Pre-meeting prep</Badge>
        </div>
        {canLead && <ActivateButton meetingId={meeting.id} />}
      </div>

      {meeting.previousCascadingMessage && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Previous cascading message
          </div>
          <p className="text-sm">{meeting.previousCascadingMessage}</p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Headlines</h2>
        <HeadlinesPanel meetingId={meeting.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Carry-over lists</h2>
        <p className="text-sm text-muted-foreground">
          Open issues and to-dos automatically surface in the live meeting — no need to copy them forward.
        </p>
        <div className="flex gap-2">
          <Link href="/issues" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View issues
          </Link>
          <Link href="/todos" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View to-dos
          </Link>
        </div>
      </section>
    </div>
  );
}
