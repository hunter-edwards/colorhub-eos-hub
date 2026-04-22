import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAdaptiveCard, postToTeams } from './teams-webhook';
import type { MeetingContext } from './ai-summary';

const mockCtx: MeetingContext = {
  meetingDate: '2026-04-15',
  attendees: [
    { name: 'Alice', rating: 8 },
    { name: 'Bob', rating: 9 },
  ],
  ratingAvg: 8.5,
  scorecardReds: [
    { metric: 'Revenue', owner: 'Alice', value: 90, goal: 100 },
  ],
  rockChanges: [
    { title: 'Launch Widget', owner: 'Bob', newStatus: 'done' },
  ],
  headlines: [{ kind: 'customer', text: 'Big deal signed' }],
  issuesSolved: [{ title: 'Slow API', toDosCreated: 2 }],
  toDos: [
    { title: 'Fix latency', owner: 'Alice', dueDate: '2026-04-22' },
  ],
  cascadingMessage: 'Ship it!',
};

const mockSummary = '## Meeting Health\nRating: 8.5/10\n\n## Action Items\n- Fix latency (Alice)';

describe('buildAdaptiveCard', () => {
  it('returns valid adaptive card JSON', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    expect(card.type).toBe('message');
    expect(card.attachments).toHaveLength(1);
    const attachment = card.attachments[0];
    expect(attachment.contentType).toBe('application/vnd.microsoft.card.adaptive');
    expect(attachment.content.$schema).toBe('http://adaptivecards.io/schemas/adaptive-card.json');
    expect(attachment.content.version).toBe('1.4');
  });

  it('includes meeting date in header', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    const body = card.attachments[0].content.body;
    const headerText = JSON.stringify(body);
    expect(headerText).toContain('2026-04-15');
  });

  it('includes rating average', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    const bodyStr = JSON.stringify(card.attachments[0].content.body);
    expect(bodyStr).toContain('8.5');
  });

  it('includes summary text', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    const bodyStr = JSON.stringify(card.attachments[0].content.body);
    expect(bodyStr).toContain('Fix latency');
  });

  it('includes attendee names', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    const bodyStr = JSON.stringify(card.attachments[0].content.body);
    expect(bodyStr).toContain('Alice');
    expect(bodyStr).toContain('Bob');
  });

  it('includes a View full changelog action when meetingUrl provided', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary, 'https://app.example.com/meeting/history/abc-123');
    const actions = card.attachments[0].content.actions;
    expect(actions).toHaveLength(1);
    expect(actions?.[0]).toMatchObject({
      type: 'Action.OpenUrl',
      title: 'View full changelog',
      url: 'https://app.example.com/meeting/history/abc-123',
    });
  });

  it('omits the action when meetingUrl is not provided', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    expect(card.attachments[0].content.actions).toBeUndefined();
  });

  it('includes a Meeting Health section', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    expect(JSON.stringify(card)).toContain('Meeting Health');
  });

  it('includes a Scorecard section when reds exist', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    const s = JSON.stringify(card);
    expect(s).toContain('Scorecard');
    expect(s).toContain('Revenue');
  });

  it('omits Scorecard section when no reds', () => {
    const card = buildAdaptiveCard({ ...mockCtx, scorecardReds: [] }, mockSummary);
    expect(JSON.stringify(card)).not.toContain('Metrics in Red');
  });

  it('includes Rock Pulse section when rocks changed', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    expect(JSON.stringify(card)).toContain('Rock Pulse');
  });

  it('includes Cascading Message when present', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    const s = JSON.stringify(card);
    expect(s).toContain('Cascading Message');
    expect(s).toContain('Ship it!');
  });

  it('omits Cascading Message when blank', () => {
    const card = buildAdaptiveCard({ ...mockCtx, cascadingMessage: '   ' }, mockSummary);
    expect(JSON.stringify(card)).not.toContain('Cascading Message');
  });

  it('uses attention color on scorecard reds header', () => {
    const card = buildAdaptiveCard(mockCtx, mockSummary);
    expect(JSON.stringify(card)).toContain('"color":"attention"');
  });
});

describe('postToTeams', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts card to webhook URL and returns ok', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('1', { status: 200 })
    );

    const result = await postToTeams(mockCtx, mockSummary, 'https://webhook.example.com/hook');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://webhook.example.com/hook');
    expect(opts?.method).toBe('POST');
    expect(opts?.headers).toEqual({ 'Content-Type': 'application/json' });
    const body = JSON.parse(opts?.body as string);
    expect(body.type).toBe('message');
    expect(result).toEqual({ ok: true, postedAt: expect.any(Date) });
  });

  it('returns error on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Bad Request', { status: 400 })
    );

    const result = await postToTeams(mockCtx, mockSummary, 'https://webhook.example.com/hook');

    expect(result).toEqual({ ok: false, error: expect.stringContaining('400') });
  });

  it('returns error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await postToTeams(mockCtx, mockSummary, 'https://webhook.example.com/hook');

    expect(result).toEqual({ ok: false, error: 'Network error' });
  });
});
