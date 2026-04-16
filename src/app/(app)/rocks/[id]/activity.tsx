'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { addComment } from '@/server/rocks';

type ActivityRow = {
  id: string;
  kind: 'status_change' | 'progress' | 'comment' | 'subtask' | 'mention';
  payload: unknown;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatActivity(row: ActivityRow): string {
  const payload = row.payload as Record<string, unknown>;
  switch (row.kind) {
    case 'status_change':
      return `updated status to ${(payload.status as string).replace('_', ' ')}`;
    case 'progress':
      return `updated progress to ${payload.progressPct}%`;
    case 'subtask':
      return `${payload.action} subtask "${payload.subtaskTitle}"`;
    case 'comment':
      return '';
    case 'mention':
      return 'mentioned someone';
    default:
      return '';
  }
}

function renderCommentBody(body: string) {
  // Highlight @mentions
  const parts = body.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <Badge key={i} variant="secondary" className="text-xs">
        {part}
      </Badge>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function Activity({
  rockId,
  activity,
}: {
  rockId: string;
  activity: ActivityRow[];
}) {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Activity</h2>

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          setPosting(true);
          await addComment(rockId, comment.trim());
          setComment('');
          setPosting(false);
        }}
      >
        <Textarea
          placeholder="Add a comment... (use @name to mention)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={posting || !comment.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-3">
        {activity.length === 0 && (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
        {activity.map((row) => {
          const actor = row.actorName || row.actorEmail || 'Unknown';
          const payload = row.payload as Record<string, unknown>;

          if (row.kind === 'comment') {
            return (
              <div key={row.id} className="flex gap-3 text-sm">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                  {actor[0]?.toUpperCase()}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{actor}</span>
                    <span className="text-muted-foreground text-xs">
                      {timeAgo(row.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">
                    {renderCommentBody(payload.body as string)}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={row.id} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
                {actor[0]?.toUpperCase()}
              </div>
              <span>
                <span className="font-medium text-foreground">{actor}</span>{' '}
                {formatActivity(row)}
              </span>
              <span className="text-xs ml-auto">{timeAgo(row.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
