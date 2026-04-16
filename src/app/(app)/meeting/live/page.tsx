import { getActiveMeeting } from '@/server/meetings';
import { Agenda } from './agenda';
import { StartMeetingButton } from './start-meeting-button';

export default async function MeetingLivePage() {
  const meeting = await getActiveMeeting();

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <h1 className="text-2xl font-bold">L10 Meeting</h1>
        <p className="text-muted-foreground">No meeting in progress.</p>
        <StartMeetingButton />
      </div>
    );
  }

  return <Agenda meetingId={meeting.id} startedAt={meeting.startedAt} />;
}
