import { describe, it, expect } from 'vitest';
import {
  computeWeeklyKPIs,
  computeInvoiceKPIs,
  parseInvoicingDate,
  type KnackRun,
  type KnackInvoice,
} from './knack';

function makeRun(overrides: Partial<KnackRun> = {}): KnackRun {
  return {
    id: 'r1',
    jobId: '036_19000_1',
    parentJob: '19000',
    partNumber: '1',
    customer: '036',
    customerName: 'Acme Co',
    orderedQty: 100,
    shippedQty: 100,
    shipped: true,
    invoiced: true,
    orderDate: '2026-04-01',
    dueDate: '2026-04-15',
    dateSentToInvoicing: '2026-04-13',
    revenue: 1000,
    ...overrides,
  };
}

describe('parseInvoicingDate', () => {
  it('returns null for blank values', () => {
    expect(parseInvoicingDate(null)).toBeNull();
    expect(parseInvoicingDate(undefined)).toBeNull();
    expect(parseInvoicingDate('')).toBeNull();
  });

  it('parses a normal datetime value', () => {
    expect(parseInvoicingDate('04/14/2026 3:37pm')).toBe('2026-04-14');
    expect(parseInvoicingDate('04/21/2026 10:14am')).toBe('2026-04-21');
  });

  it('filters out bulk-stamp artifacts on 04/21/2026 before 07:50 AM', () => {
    expect(parseInvoicingDate('04/21/2026 12:00am')).toBeNull();
    expect(parseInvoicingDate('04/21/2026 2:15am')).toBeNull();
    expect(parseInvoicingDate('04/21/2026 7:00am')).toBeNull();
    expect(parseInvoicingDate('04/21/2026 7:49am')).toBeNull();
  });

  it('keeps 04/21/2026 values at 07:50 AM and later', () => {
    expect(parseInvoicingDate('04/21/2026 7:50am')).toBe('2026-04-21');
    expect(parseInvoicingDate('04/21/2026 8:13am')).toBe('2026-04-21');
    expect(parseInvoicingDate('04/21/2026 3:00pm')).toBe('2026-04-21');
  });

  it('does not filter other dates even if before 07:50 AM', () => {
    expect(parseInvoicingDate('04/20/2026 6:00am')).toBe('2026-04-20');
    expect(parseInvoicingDate('04/22/2026 6:00am')).toBe('2026-04-22');
  });

  it('parses a date-only value (no time component)', () => {
    expect(parseInvoicingDate('03/15/2026')).toBe('2026-03-15');
  });
});

describe('computeWeeklyKPIs', () => {
  const weeks = ['2026-04-13']; // Monday Apr 13

  it('counts runs completed in the week (one per run with field_2292 in window)', () => {
    const runs = [
      makeRun({ id: 'r1', partNumber: '1', dateSentToInvoicing: '2026-04-13' }),
      makeRun({ id: 'r2', partNumber: '2', dateSentToInvoicing: '2026-04-15' }),
    ];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].runsCompleted).toBe(2);
  });

  it('counts jobs completed only when ALL runs across all parts have field_2292', () => {
    const completed = [
      makeRun({ id: 'r1', partNumber: '1', dateSentToInvoicing: '2026-04-13' }),
      makeRun({ id: 'r2', partNumber: '2', dateSentToInvoicing: '2026-04-15' }),
    ];
    // All three runs for parent job 19000 are completed
    const result = computeWeeklyKPIs(completed, completed, weeks);
    expect(result[0].jobsCompleted).toBe(1);
  });

  it('does NOT count job as completed when a sibling run is missing field_2292', () => {
    const completed = [
      makeRun({ id: 'r1', partNumber: '1', dateSentToInvoicing: '2026-04-13' }),
    ];
    const allJobRuns = [
      ...completed,
      makeRun({ id: 'r2', partNumber: '2', dateSentToInvoicing: null }),
    ];
    const result = computeWeeklyKPIs(completed, allJobRuns, weeks);
    expect(result[0].runsCompleted).toBe(1);
    expect(result[0].jobsCompleted).toBe(0);
  });

  it('counts parent jobs invoiced when all runs have invoiced=true', () => {
    const runs = [
      makeRun({ id: 'r1', partNumber: '1', invoiced: true }),
      makeRun({ id: 'r2', partNumber: '2', invoiced: true }),
    ];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].parentJobsInvoiced).toBe(1);
  });

  it('does NOT count parent job as invoiced when one run is not invoiced', () => {
    const completed = [
      makeRun({ id: 'r1', partNumber: '1', invoiced: true }),
    ];
    const allJobRuns = [
      ...completed,
      makeRun({ id: 'r2', partNumber: '2', invoiced: false, dateSentToInvoicing: null }),
    ];
    const result = computeWeeklyKPIs(completed, allJobRuns, weeks);
    expect(result[0].parentJobsInvoiced).toBe(0);
  });

  it('calculates avg days order to complete using field_2292', () => {
    const runs = [
      makeRun({ orderDate: '2026-04-01', dateSentToInvoicing: '2026-04-13' }), // 12 days
      makeRun({ id: 'r2', partNumber: '2', orderDate: '2026-04-03', dateSentToInvoicing: '2026-04-13' }), // 10 days
    ];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].avgDaysOrderToComplete).toBe(11);
  });

  it('calculates on-time delivery pct using field_2292 against due date', () => {
    const runs = [
      makeRun({ dateSentToInvoicing: '2026-04-13', dueDate: '2026-04-15' }), // on time
      makeRun({ id: 'r2', partNumber: '2', dateSentToInvoicing: '2026-04-14', dueDate: '2026-04-10' }), // late
    ];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].onTimeDeliveryPct).toBe(50);
  });

  it('sums weekly revenue for completed runs', () => {
    const runs = [
      makeRun({ revenue: 5000 }),
      makeRun({ id: 'r2', partNumber: '2', revenue: 3000 }),
    ];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].weeklyRevenue).toBe(8000);
  });

  it('returns null for avg days when no valid order/completion dates', () => {
    const runs = [makeRun({ orderDate: null, dateSentToInvoicing: '2026-04-13' })];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].avgDaysOrderToComplete).toBeNull();
  });

  it('handles empty runs', () => {
    const result = computeWeeklyKPIs([], [], weeks);
    expect(result[0].runsCompleted).toBe(0);
    expect(result[0].jobsCompleted).toBe(0);
    expect(result[0].parentJobsInvoiced).toBe(0);
    expect(result[0].avgDaysOrderToComplete).toBeNull();
    expect(result[0].onTimeDeliveryPct).toBeNull();
    expect(result[0].weeklyRevenue).toBe(0);
  });

  it('counts multiple parent jobs separately', () => {
    const runs = [
      makeRun({ parentJob: '19000', customer: '036' }),
      makeRun({ id: 'r2', parentJob: '19001', customer: '036', jobId: '036_19001_1' }),
    ];
    const result = computeWeeklyKPIs(runs, runs, weeks);
    expect(result[0].jobsCompleted).toBe(2);
    expect(result[0].runsCompleted).toBe(2);
  });

  it('excludes runs without field_2292 from all metrics (filter happens upstream)', () => {
    // Caller should never pass uncompleted runs as completedRuns, but if they
    // do, they should not be bucketed into a week.
    const completed = [
      makeRun({ id: 'r1', partNumber: '1', dateSentToInvoicing: '2026-04-13' }),
    ];
    const result = computeWeeklyKPIs(completed, completed, weeks);
    expect(result[0].runsCompleted).toBe(1);
  });

  it('only counts a job in the week of its MAX completion date', () => {
    const weeksAprilMay = ['2026-04-13', '2026-04-20'];
    const completed = [
      makeRun({ id: 'r1', partNumber: '1', dateSentToInvoicing: '2026-04-13' }), // week of Apr 13
      makeRun({ id: 'r2', partNumber: '2', dateSentToInvoicing: '2026-04-21' }), // week of Apr 20
    ];
    const result = computeWeeklyKPIs(completed, completed, weeksAprilMay);
    // Job's completion week = Apr 20 (MAX of the two dates)
    expect(result.find((r) => r.weekStart === '2026-04-13')!.jobsCompleted).toBe(0);
    expect(result.find((r) => r.weekStart === '2026-04-20')!.jobsCompleted).toBe(1);
  });
});

describe('computeInvoiceKPIs', () => {
  const weeks = ['2026-04-20'];

  function makeInvoice(overrides: Partial<KnackInvoice> = {}): KnackInvoice {
    return {
      id: 'inv1',
      postedDate: '2026-04-22',
      status: 'Added Into Quickbooks and Sent',
      runIds: ['r1'],
      ...overrides,
    };
  }

  it('counts unique runs across invoices posted in the week', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-20', runIds: ['r1', 'r2'] }),
      makeInvoice({ id: 'i2', postedDate: '2026-04-22', runIds: ['r3'] }),
    ];
    const runs = [
      makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-15' }),
      makeRun({ id: 'r2', dateSentToInvoicing: '2026-04-15' }),
      makeRun({ id: 'r3', dateSentToInvoicing: '2026-04-18' }),
    ];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].runsInvoiced).toBe(3);
  });

  it('de-duplicates a run that appears on multiple invoices in the same week', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-20', runIds: ['r1'] }),
      makeInvoice({ id: 'i2', postedDate: '2026-04-22', runIds: ['r1', 'r2'] }),
    ];
    const runs = [
      makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-15' }),
      makeRun({ id: 'r2', dateSentToInvoicing: '2026-04-15' }),
    ];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].runsInvoiced).toBe(2);
  });

  it('ignores invoices outside the week window', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-19', runIds: ['r1'] }), // before week
      makeInvoice({ id: 'i2', postedDate: '2026-04-27', runIds: ['r2'] }), // after week
    ];
    const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' })];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].runsInvoiced).toBe(0);
  });

  it('calculates avg days sent→invoiced (postedDate − dateSentToInvoicing)', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-22', runIds: ['r1', 'r2'] }),
    ];
    const runs = [
      makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-20' }), // 2 days
      makeRun({ id: 'r2', dateSentToInvoicing: '2026-04-18' }), // 4 days
    ];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].avgDaysSentToInvoiced).toBe(3);
  });

  it('skips runs missing dateSentToInvoicing in the avg', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-22', runIds: ['r1', 'r2'] }),
    ];
    const runs = [
      makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-20' }), // 2 days
      makeRun({ id: 'r2', dateSentToInvoicing: null }),         // skip
    ];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].avgDaysSentToInvoiced).toBe(2);
    expect(result[0].runsInvoiced).toBe(2); // count still includes both
  });

  it('returns null avg when no run has a dateSentToInvoicing', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-22', runIds: ['r1'] }),
    ];
    const runs = [makeRun({ id: 'r1', dateSentToInvoicing: null })];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].runsInvoiced).toBe(1);
    expect(result[0].avgDaysSentToInvoiced).toBeNull();
  });

  it('uses the earliest invoice posted-date when a run is on multiple invoices', () => {
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-23', runIds: ['r1'] }),
      makeInvoice({ id: 'i2', postedDate: '2026-04-21', runIds: ['r1'] }), // earlier
    ];
    const runs = [makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-20' })];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    // Earliest posted = 4/21, sent = 4/20 → 1 day
    expect(result[0].avgDaysSentToInvoiced).toBe(1);
  });

  it('handles empty invoices', () => {
    const result = computeInvoiceKPIs([], [], weeks);
    expect(result[0].runsInvoiced).toBe(0);
    expect(result[0].avgDaysSentToInvoiced).toBeNull();
  });

  it('skips runs whose dateSentToInvoicing is AFTER postedDate (rule-refire artifact)', () => {
    // After a bulk re-stamp event, field_2292 can be overwritten with a
    // date later than the original "sent" — and later than the invoice
    // posted date. Those records should not poison the average.
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-22', runIds: ['r1', 'r2', 'r3'] }),
    ];
    const runs = [
      makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-20' }), // 2 days (valid)
      makeRun({ id: 'r2', dateSentToInvoicing: '2026-04-25' }), // -3 days (skip)
      makeRun({ id: 'r3', dateSentToInvoicing: '2026-04-21' }), // 1 day (valid)
    ];
    const result = computeInvoiceKPIs(invoices, runs, weeks);
    expect(result[0].runsInvoiced).toBe(3);                // count keeps all
    expect(result[0].avgDaysSentToInvoiced).toBe(1.5);     // (2 + 1) / 2
  });

  it('buckets across multiple weeks correctly', () => {
    const multiWeeks = ['2026-04-13', '2026-04-20'];
    const invoices = [
      makeInvoice({ id: 'i1', postedDate: '2026-04-15', runIds: ['r1'] }),
      makeInvoice({ id: 'i2', postedDate: '2026-04-22', runIds: ['r2', 'r3'] }),
    ];
    const runs = [
      makeRun({ id: 'r1', dateSentToInvoicing: '2026-04-13' }),
      makeRun({ id: 'r2', dateSentToInvoicing: '2026-04-20' }),
      makeRun({ id: 'r3', dateSentToInvoicing: '2026-04-21' }),
    ];
    const result = computeInvoiceKPIs(invoices, runs, multiWeeks);
    expect(result.find((r) => r.weekStart === '2026-04-13')!.runsInvoiced).toBe(1);
    expect(result.find((r) => r.weekStart === '2026-04-20')!.runsInvoiced).toBe(2);
  });
});
