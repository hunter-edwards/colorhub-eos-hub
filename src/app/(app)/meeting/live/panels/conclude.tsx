'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  endMeeting,
  rateMeeting,
  rateMeetingOnBehalf,
  getMeetingRatings,
  setCascadingMessage,
  getMeeting,
} from '@/server/meetings';
import { useRouter } from 'next/navigation';

type Rating = {
  userId: string;
  rating: number;
  userName: string | null;
  userEmail: string | null;
};

type Attendee = { id: string; name: string | null; email: string };

export function ConcludePanel({
  meetingId,
  canLead = false,
  canAdmin = false,
  isAttendee = false,
}: {
  meetingId: string;
  canLead?: boolean;
  canAdmin?: boolean;
  isAttendee?: boolean;
}) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [cascading, setCascading] = useState('');
  const [ending, setEnding] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const router = useRouter();

  useEffect(() => {
    getMeetingRatings(meetingId).then(setRatings);
    getMeeting(meetingId).then((m) => {
      if (m?.cascadingMessage) setCascading(m.cascadingMessage);
      if (m?.attendees) setAttendees(m.attendees as Attendee[]);
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

  async function submitRatingFor(userId: string, value: number) {
    await rateMeetingOnBehalf(meetingId, userId, value);
    setRatings(await getMeetingRatings(meetingId));
  }

  const ratingByUser = new Map(ratings.map((r) => [r.userId, r.rating]));
  const unrated = attendees.filter((u) => !ratingByUser.has(u.id));

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
        {isAttendee ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            Only attendees of this meeting can submit a rating.
          </p>
        )}
        <div className="text-sm text-muted-foreground">
          Average: <span className="font-medium text-foreground">{avg}</span>
          {' '}({ratings.length} rating{ratings.length !== 1 ? 's' : ''})
        </div>
      </div>

      {canAdmin && unrated.length > 0 && (
        <div className="space-y-3 rounded-md border border-dashed p-3">
          <h3 className="font-medium text-sm">Rate on behalf (admin)</h3>
          <p className="text-xs text-muted-foreground">
            Record ratings for attendees who couldn&apos;t submit one themselves.
          </p>
          <ul className="space-y-2">
            {unrated.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <span className="text-sm flex-1 truncate">{u.name ?? u.email}</span>
                <select
                  defaultValue=""
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                  onChange={async (e) => {
                    const val = Number(e.target.value);
                    if (!val) return;
                    await submitRatingFor(u.id, val);
                  }}
                >
                  <option value="">Rate…</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

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
