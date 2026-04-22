'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { activateMeeting } from '@/server/meetings';
import { useRouter } from 'next/navigation';

export function ActivateButton({ meetingId }: { meetingId: string }) {
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  return (
    <Button
      size="sm"
      disabled={starting}
      onClick={async () => {
        setStarting(true);
        try {
          await activateMeeting(meetingId);
          router.push('/meeting/live');
        } catch {
          setStarting(false);
        }
      }}
    >
      <Play className="h-4 w-4 mr-1" />
      {starting ? 'Starting...' : 'Start'}
    </Button>
  );
}
