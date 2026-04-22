import { getActiveMeeting } from '@/server/meetings';
import { getCurrentUserRole } from '@/server/auth-helpers';
import { atLeast } from '@/lib/auth';
import { Agenda } from './agenda';
import { StartMeetingButton } from './start-meeting-button';

export default async function MeetingLivePage() {
  const [meeting, role] = await Promise.all([
    getActiveMeeting(),
    getCurrentUserRole(),
  ]);
  const canLead = atLeast(role, 'leader');

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <h1 className="text-2xl font-bold">L10 Meeting</h1>
        <p className="text-muted-foreground">No meeting in progress.</p>
        {canLead ? (
          <StartMeetingButton />
        ) : (
          <p className="text-sm text-muted-foreground">Only leaders can start meetings.</p>
        )}
      </div>
    );
  }

  return <Agenda meetingId={meeting.id} startedAt={meeting.startedAt} canLead={canLead} />;
}
