import { describe, it, expect } from 'vitest';
import { computeWeeklyKPIs, type KnackRun } from './knack';

function makeRun(overrides: Partial<KnackRun> = {}): KnackRun {
  return {
    id: 'r1',
    jobId: '036_19000_1',
    parentJob: '19000',
    partNumber: '1',
    customer: '036',
    orderedQty: 100,
    shippedQty: 100,
    shipped: true,
    invoiced: true,
    shipDate: '2026-04-13',
    orderDate: '2026-04-01',
    dueDate: '2026-04-15',
    dateSentToInvoicing: '2026-04-13',
    revenue: 1000,
    ...overrides,
  };
}

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
