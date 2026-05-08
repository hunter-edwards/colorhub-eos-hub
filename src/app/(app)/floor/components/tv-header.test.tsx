import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TVHeader } from './tv-header';

describe('TVHeader', () => {
  const baseProps = {
    shift: { shiftNumber: 1 as const, date: '2026-05-07' },
    sessionStatus: 'live' as const,
    mode: 'huddle' as const,
    counts: { operators: 14, pmsDue: 2, openIssues: 3, tasksOpen: 5 },
    lastSyncAt: new Date(),
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
});
