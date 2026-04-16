'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { retrySummary } from './actions';

export function SummaryView({
  meetingId,
  summary,
}: {
  meetingId: string;
  summary: string | null;
}) {
  const [retrying, setRetrying] = useState(false);
  const [content, setContent] = useState(summary);

  if (!content) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center space-y-3">
        <p className="text-muted-foreground">No AI summary available.</p>
        <Button
          variant="outline"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            const result = await retrySummary(meetingId);
            if (result.summary) setContent(result.summary);
            setRetrying(false);
          }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Generating...' : 'Retry Summary'}
        </Button>
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <Markdown>{content}</Markdown>
    </div>
  );
}
