'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { endMeeting, rateMeeting, getMeetingRatings, setCascadingMessage, getMeeting } from '@/server/meetings';
import { useRouter } from 'next/navigation';

type Rating = {
  userId: string;
  rating: number;
  userName: string | null;
  userEmail: string | null;
};

export function ConcludePanel({ meetingId, canLead = false }: { meetingId: string; canLead?: boolean }) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [cascading, setCascading] = useState('');
  const [ending, setEnding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getMeetingRatings(meetingId).then(setRatings);
    getMeeting(meetingId).then((m) => {
      if (m?.cascadingMessage) setCascading(m.cascadingMessage);
    });
  }, [meetingId]);

  const avg =
    ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : '–';

  async function submitRating(value: number) {
    setMyRating(value);
    await rateMeeting(meetingId, value);
    setRatings(await getMeetingRatings(meetingId));
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-3">
        <h3 className="font-medium">Cascading Message</h3>
        <Textarea
          placeholder="Key message to cascade to your teams..."
          value={cascading}
          onChange={(e) => setCascading(e.target.value)}
          onBlur={() => {
            if (canLead) void setCascadingMessage(meetingId, cascading);
          }}
          rows={3}
          disabled={!canLead}
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Rate this meeting (1–10)</h3>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={myRating === n ? 'default' : 'outline'}
              size="sm"
              className="w-9 h-9"
              onClick={() => submitRating(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Average: <span className="font-medium text-foreground">{avg}</span>
          {' '}({ratings.length} rating{ratings.length !== 1 ? 's' : ''})
        </div>
      </div>

      {canLead ? (
        <Button
          size="lg"
          className="w-full"
          disabled={ending}
          onClick={async () => {
            setEnding(true);
            const result = await endMeeting(meetingId);
            router.push(`/meeting/history/${result.meetingId}`);
          }}
        >
          {ending ? 'Ending...' : 'End & Summarize'}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Only leaders can end the meeting.
        </p>
      )}
    </div>
  );
}
