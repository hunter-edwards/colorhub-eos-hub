'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
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

  async function regenerate() {
    setRetrying(true);
    const result = await retrySummary(meetingId);
    if (result.summary) setContent(result.summary);
    setRetrying(false);
  }

  if (!content) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-5 text-center">
        <p className="mb-3 text-sm text-muted-foreground">No AI summary available.</p>
        <Button variant="outline" size="sm" disabled={retrying} onClick={regenerate}>
          <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Generating…' : 'Generate summary'}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm leading-relaxed text-foreground/90">{content}</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={retrying}
          onClick={regenerate}
          title="Regenerate"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
