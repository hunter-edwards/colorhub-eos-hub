'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { startMeeting, joinMeeting } from '@/server/meetings';
import { useRouter } from 'next/navigation';

export function StartMeetingButton() {
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  return (
    <Button
      size="lg"
      disabled={starting}
      onClick={async () => {
        setStarting(true);
        try {
          const m = await startMeeting();
          await joinMeeting(m.id);
          router.refresh();
        } catch {
          setStarting(false);
        }
      }}
    >
      <Video className="mr-2 h-5 w-5" />
      {starting ? 'Starting...' : 'Start L10'}
    </Button>
  );
}
