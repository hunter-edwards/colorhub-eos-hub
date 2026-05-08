import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventsFeed } from './events-feed';

describe('EventsFeed', () => {
  const stations = [{ id: 's1', name: 'Press 1' }];
  it('renders newest first', () => {
    const events = [
      {
        id: '2',
        stationId: 's1',
        kind: 'job_started',
        payload: { jobNumber: 'J-2' },
        occurredAt: new Date('2026-05-07T10:00Z'),
        shiftSessionId: 'x',
        recordedBy: null,
        relatedKnackJobId: null,
      },
      {
        id: '1',
        stationId: 's1',
        kind: 'job_started',
        payload: { jobNumber: 'J-1' },
        occurredAt: new Date('2026-05-07T08:00Z'),
        shiftSessionId: 'x',
        recordedBy: null,
        relatedKnackJobId: null,
      },
    ];
    render(<EventsFeed events={events as any} stations={stations} />);
    const rows = screen.getAllByText(/Started/i);
    expect(rows[0].textContent).toMatch(/J-2/);
    expect(rows[1].textContent).toMatch(/J-1/);
  });
});
