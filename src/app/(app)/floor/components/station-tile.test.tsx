import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StationTile } from './station-tile';

const baseStation = {
  id: 's1', name: 'Press 1', kind: 'printer' as const,
  displayOrder: 1, groupLabel: 'Printing', knackMachineCenterId: null,
  archivedAt: null, createdAt: new Date(), teamId: 't1',
};

const runningView = {
  stationId: 's1',
  status: 'running' as const,
  current: {
    id: 'j1', jobNumber: 'J-1234', customer: 'Acme Corp',
    lineItem: '5x7 Postcards', sheetsNeeded: 5000, sheetsCompleted: 4820,
    sheetsReceived: 5000, wasteSheets: 142, routingComplete: false,
    dueDate: '2026-05-09', issueNotes: [],
  },
  queue: [],
};

const idleView = { stationId: 's1', status: 'idle' as const, current: null, queue: [] };

describe('StationTile', () => {
  it('renders RUNNING tile with job number, customer, and operator names', () => {
    render(
      <div data-floor-tv="true">
        <StationTile station={baseStation} view={runningView} operators={['Alex Kim']} pm={null} onExpand={() => {}} />
      </div>
    );
    expect(screen.getByText('Press 1')).toBeInTheDocument();
    expect(screen.getByText(/J-1234/)).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText('Alex Kim')).toBeInTheDocument();
    expect(screen.getByText(/RUNNING/i)).toBeInTheDocument();
  });

  it('renders IDLE tile with no current job', () => {
    render(
      <div data-floor-tv="true">
        <StationTile station={baseStation} view={idleView} operators={[]} pm={null} onExpand={() => {}} />
      </div>
    );
    expect(screen.getByText(/IDLE/i)).toBeInTheDocument();
  });

  it('shows over-run % in distinct color when sheets exceed needed', () => {
    const overView = {
      ...runningView,
      current: { ...runningView.current!, sheetsCompleted: 5402 }
    };
    render(
      <div data-floor-tv="true">
        <StationTile station={baseStation} view={overView} operators={[]} pm={null} onExpand={() => {}} />
      </div>
    );
    const el = screen.getByText(/108\.0%|108%/);
    expect(el).toBeInTheDocument();
    // distinct color signaled by class containing "over" or violet token
    expect(el.className).toMatch(/over|violet/);
  });

  it('shows red PM badge when level=red', () => {
    render(
      <div data-floor-tv="true">
        <StationTile
          station={baseStation}
          view={runningView}
          operators={[]}
          pm={{ level: 'red', daysUntilDue: -2, label: 'Daily clean' }}
          onExpand={() => {}}
        />
      </div>
    );
    const badge = screen.getByText(/PM/i);
    expect(badge.className).toMatch(/red|destructive/);
  });

  it('calls onExpand with stationId when clicked', () => {
    const onExpand = vi.fn();
    render(
      <div data-floor-tv="true">
        <StationTile station={baseStation} view={runningView} operators={[]} pm={null} onExpand={onExpand} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /Press 1/i }));
    expect(onExpand).toHaveBeenCalledWith('s1');
  });

  it('shows shared-queue subtitle when isSharedQueue is true', () => {
    const cadStation = { ...baseStation, name: 'CAD 1', knackMachineCenterId: 'cad' };
    const cadView = {
      ...runningView,
      queue: [
        { ...runningView.current!, id: 'q1', jobNumber: 'J-2' },
        { ...runningView.current!, id: 'q2', jobNumber: 'J-3' },
      ],
    };
    render(
      <div data-floor-tv="true">
        <StationTile
          station={cadStation}
          view={cadView}
          operators={[]}
          pm={null}
          isSharedQueue
          onExpand={() => {}}
        />
      </div>
    );
    // current (1) + queue (2) = 3 jobs total
    expect(screen.getByText(/CAD queue · 3 jobs/)).toBeInTheDocument();
  });

  it('does not show shared-queue subtitle when isSharedQueue is false', () => {
    render(
      <div data-floor-tv="true">
        <StationTile
          station={{ ...baseStation, knackMachineCenterId: 'press_1' }}
          view={runningView}
          operators={[]}
          pm={null}
          isSharedQueue={false}
          onExpand={() => {}}
        />
      </div>
    );
    expect(screen.queryByText(/queue ·/)).not.toBeInTheDocument();
  });
});
