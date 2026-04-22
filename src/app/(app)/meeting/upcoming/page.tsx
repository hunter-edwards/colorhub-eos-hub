import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { CalendarClock, PencilLine } from 'lucide-react';
import { listDraftMeetings } from '@/server/meetings';
import { getCurrentUserRole } from '@/server/auth-helpers';
import { atLeast } from '@/lib/auth';
import { ActivateButton } from './activate-button';
import { RsvpPills } from './rsvp-pills';
import { getMyRsvp, rsvpCountsByStatus } from '@/server/rsvp';

function formatWhen(d: Date | null): string {
  if (!d) return 'Unscheduled';
  return new Date(d).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function UpcomingMeetingsPage() {
  const [drafts, role] = await Promise.all([
    listDraftMeetings(),
    getCurrentUserRole(),
  ]);
  const canLead = atLeast(role, 'leader');
  const rsvpData = await Promise.all(
    drafts.map(async (m) => ({
      meetingId: m.id,
      mine: await getMyRsvp(m.id),
      counts: await rsvpCountsByStatus(m.id),
    })),
  );
  const rsvpById = new Map(rsvpData.map((r) => [r.meetingId, r]));

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Upcoming Meetings</h1>
      </div>

      {drafts.length === 0 ? (
        <p className="text-muted-foreground">No draft meetings scheduled.</p>
      ) : (
        <div className="space-y-3">
          {drafts.map((m) => {
            const rsvp = rsvpById.get(m.id);
            return (
              <div
                key={m.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1">
                  <div className="font-medium">{m.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatWhen(m.scheduledFor)}
                  </div>
                  {m.previousCascadingMessage && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      Previous cascade: {m.previousCascadingMessage}
                    </div>
                  )}
                  <div className="mt-3">
                    <RsvpPills
                      meetingId={m.id}
                      initialStatus={rsvp?.mine ?? null}
                      counts={rsvp?.counts ?? { attending: 0, declined: 0, tentative: 0 }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/meeting/${m.id}/prep`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <PencilLine className="h-4 w-4 mr-1" /> Prepare
                  </Link>
                  {canLead && <ActivateButton meetingId={m.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
