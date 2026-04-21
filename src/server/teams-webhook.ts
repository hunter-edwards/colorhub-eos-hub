import type { MeetingContext } from './ai-summary';

type AdaptiveCard = {
  type: 'message';
  attachments: [{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: {
      $schema: string;
      type: 'AdaptiveCard';
      version: string;
      body: Record<string, unknown>[];
      actions?: Record<string, unknown>[];
    };
  }];
};

export function buildAdaptiveCard(
  ctx: MeetingContext,
  summary: string,
  meetingUrl?: string
): AdaptiveCard {
  const attendeeList = ctx.attendees.map((a) => `${a.name} (${a.rating}/10)`).join(', ');

  const content: AdaptiveCard['attachments'][0]['content'] = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        size: 'Large',
        weight: 'Bolder',
        text: `L10 Meeting — ${ctx.meetingDate}`,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Rating', value: `${ctx.ratingAvg}/10` },
          { title: 'Attendees', value: attendeeList },
        ],
      },
      {
        type: 'TextBlock',
        text: summary,
        wrap: true,
      },
    ],
  };

  if (meetingUrl) {
    content.actions = [
      {
        type: 'Action.OpenUrl',
        title: 'View full changelog',
        url: meetingUrl,
      },
    ];
  }

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content,
    }],
  };
}

type PostResult =
  | { ok: true; postedAt: Date }
  | { ok: false; error: string };

export async function postToTeams(
  ctx: MeetingContext,
  summary: string,
  webhookUrl: string,
  meetingUrl?: string,
): Promise<PostResult> {
  const card = buildAdaptiveCard(ctx, summary, meetingUrl);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!res.ok) {
      return { ok: false, error: `Teams webhook returned ${res.status}: ${await res.text()}` };
    }

    return { ok: true, postedAt: new Date() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
