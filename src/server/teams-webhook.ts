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

type Block = Record<string, unknown>;

function sectionHeader(text: string, color: 'accent' | 'attention' | 'good' | 'warning' | 'default' = 'accent'): Block {
  return {
    type: 'TextBlock',
    text,
    weight: 'Bolder',
    size: 'Medium',
    color,
    spacing: 'Medium',
  };
}

function healthSection(ctx: MeetingContext): Block {
  return {
    type: 'Container',
    items: [
      sectionHeader('Meeting Health'),
      {
        type: 'ColumnSet',
        columns: [
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: 'Rating', isSubtle: true, size: 'Small' },
              { type: 'TextBlock', text: `${ctx.ratingAvg}/10`, weight: 'Bolder', size: 'Large' },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: 'Attendees', isSubtle: true, size: 'Small' },
              { type: 'TextBlock', text: `${ctx.attendees.length}`, weight: 'Bolder', size: 'Large' },
            ],
          },
        ],
      },
      {
        type: 'TextBlock',
        text: ctx.attendees.map((a) => `${a.name} (${a.rating}/10)`).join(' · '),
        wrap: true,
        isSubtle: true,
        size: 'Small',
        spacing: 'Small',
      },
    ],
  };
}

function scorecardSection(ctx: MeetingContext): Block | null {
  if (ctx.scorecardReds.length === 0) return null;
  return {
    type: 'Container',
    separator: true,
    items: [
      sectionHeader('Scorecard — Metrics in Red', 'attention'),
      {
        type: 'FactSet',
        facts: ctx.scorecardReds.map((r) => ({
          title: r.metric,
          value: `${r.value} (goal ${r.goal}) — ${r.owner}`,
        })),
      },
    ],
  };
}

function rockSection(ctx: MeetingContext): Block | null {
  if (ctx.rockChanges.length === 0) return null;
  return {
    type: 'Container',
    separator: true,
    items: [
      sectionHeader('Rock Pulse', 'good'),
      {
        type: 'FactSet',
        facts: ctx.rockChanges.map((r) => ({
          title: r.title,
          value: `${r.owner} → ${r.newStatus}`,
        })),
      },
    ],
  };
}

function headlinesSection(ctx: MeetingContext): Block | null {
  if (ctx.headlines.length === 0) return null;
  return {
    type: 'Container',
    separator: true,
    items: [
      sectionHeader('Headlines'),
      ...ctx.headlines.map((h) => ({
        type: 'TextBlock',
        text: `**${h.kind === 'customer' ? 'Customer' : 'Employee'}** — ${h.text}`,
        wrap: true,
        spacing: 'Small',
      })),
    ],
  };
}

function issuesSection(ctx: MeetingContext): Block | null {
  if (ctx.issuesSolved.length === 0) return null;
  return {
    type: 'Container',
    separator: true,
    items: [
      sectionHeader('Issues Worked', 'good'),
      {
        type: 'FactSet',
        facts: ctx.issuesSolved.map((i) => ({
          title: i.title,
          value: `${i.toDosCreated} to-do${i.toDosCreated === 1 ? '' : 's'} created`,
        })),
      },
    ],
  };
}

function todosSection(ctx: MeetingContext): Block | null {
  if (ctx.toDos.length === 0) return null;
  return {
    type: 'Container',
    separator: true,
    items: [
      sectionHeader('Action Items', 'warning'),
      {
        type: 'FactSet',
        facts: ctx.toDos.map((t) => ({
          title: t.title,
          value: `${t.owner} · due ${t.dueDate}`,
        })),
      },
    ],
  };
}

function cascadingSection(ctx: MeetingContext): Block | null {
  if (!ctx.cascadingMessage?.trim()) return null;
  return {
    type: 'Container',
    separator: true,
    style: 'emphasis',
    items: [
      sectionHeader('Cascading Message'),
      { type: 'TextBlock', text: ctx.cascadingMessage, wrap: true },
    ],
  };
}

export function buildAdaptiveCard(
  ctx: MeetingContext,
  summary: string,
  meetingUrl?: string
): AdaptiveCard {
  const trimmedSummary = summary?.trim();
  const narrativeBlock: Block | null = trimmedSummary
    ? {
        type: 'TextBlock',
        text: `_${trimmedSummary}_`,
        wrap: true,
        isSubtle: true,
        spacing: 'Small',
      }
    : null;

  const sections: Block[] = [
    {
      type: 'TextBlock',
      size: 'Large',
      weight: 'Bolder',
      text: `L10 Meeting — ${ctx.meetingDate}`,
    },
    narrativeBlock,
    healthSection(ctx),
    scorecardSection(ctx),
    rockSection(ctx),
    headlinesSection(ctx),
    issuesSection(ctx),
    todosSection(ctx),
    cascadingSection(ctx),
  ].filter((s): s is Block => s !== null);

  const content: AdaptiveCard['attachments'][0]['content'] = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body: sections,
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
