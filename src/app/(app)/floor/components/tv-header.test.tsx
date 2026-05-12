import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TVHeader } from './tv-header';

describe('TVHeader', () => {
  const baseProps = {
    shift: { shiftNumber: 1 as const, date: '2026-05-07' },
    sessionStatus: 'live' as const,
    mode: 'huddle' as const,
    counts: { operators: 14, pmsDue: 2, openIssues: 3, tasksOpen: 5 },
    lastSyncAt: new Date(),
    floorSync: {
      syncedAt: new Date(),
      status: 'ok' as const,
      errorMessage: null,
    },
    onModeChange: vi.fn(),
    onCounterClick: vi.fn(),
  };

  it('renders shift name, status pill, and all four counters', () => {
    render(<TVHeader {...baseProps} />);
    expect(screen.getByText(/1st Shift/i)).toBeInTheDocument();
    expect(screen.getByText(/Live/i)).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument(); // operators
    expect(screen.getByText('5')).toBeInTheDocument(); // tasks
  });

  it('counter buttons call onCounterClick with the right panel', () => {
    const handler = vi.fn();
    render(<TVHeader {...baseProps} onCounterClick={handler} />);
    fireEvent.click(screen.getByRole('button', { name: /operators/i }));
    expect(handler).toHaveBeenCalledWith('people');
  });

  describe('sync dot', () => {
    const FIXED_NOW = new Date('2026-05-12T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function renderWithSync(floorSync: typeof baseProps.floorSync | null) {
      render(<TVHeader {...baseProps} floorSync={floorSync} />);
      // The dot container has data-sync-status; query by attribute.
      const el = document.querySelector('[data-sync-status]') as HTMLElement | null;
      expect(el).not.toBeNull();
      return el!;
    }

    it('green when synced 10s ago', () => {
      const el = renderWithSync({
        syncedAt: new Date(FIXED_NOW.getTime() - 10_000),
        status: 'ok',
        errorMessage: null,
      });
      expect(el.getAttribute('data-sync-status')).toBe('green');
    });

    it('amber when synced 2min ago', () => {
      const el = renderWithSync({
        syncedAt: new Date(FIXED_NOW.getTime() - 2 * 60_000),
        status: 'ok',
        errorMessage: null,
      });
      expect(el.getAttribute('data-sync-status')).toBe('amber');
    });

    it('red when last sync has error status', () => {
      const el = renderWithSync({
        syncedAt: new Date(FIXED_NOW.getTime() - 10_000),
        status: 'error',
        errorMessage: 'Knack 500',
      });
      expect(el.getAttribute('data-sync-status')).toBe('red');
      // tooltip mentions the error
      expect(el.getAttribute('title')).toMatch(/Knack 500/);
    });

    it('red when floorSync is null (no sync yet)', () => {
      const el = renderWithSync(null);
      expect(el.getAttribute('data-sync-status')).toBe('red');
    });
  });
});
