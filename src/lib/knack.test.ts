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
    dateSentToInvoicing: null,
    revenue: 1000,
    ...overrides,
  };
}

describe('computeWeeklyKPIs', () => {
  const weeks = ['2026-04-13']; // Monday Apr 13

  it('counts parent job as shipped when all runs have shipped=true', () => {
    const runs = [
      makeRun({ id: 'r1', partNumber: '1', shipped: true }),
      makeRun({ id: 'r2', partNumber: '2', shipped: true }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsShipped).toBe(1);
  });

  it('does NOT count shipped when one run not shipped', () => {
    const runs = [
      makeRun({ id: 'r1', partNumber: '1', shipped: true }),
      makeRun({ id: 'r2', partNumber: '2', shipped: false }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsShipped).toBe(0);
  });

  it('counts parent job as invoiced when all runs have invoiced=true', () => {
    const runs = [
      makeRun({ id: 'r1', partNumber: '1', invoiced: true }),
      makeRun({ id: 'r2', partNumber: '2', invoiced: true }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsInvoiced).toBe(1);
  });

  it('does NOT count invoiced when one run not invoiced', () => {
    const runs = [
      makeRun({ id: 'r1', partNumber: '1', invoiced: true }),
      makeRun({ id: 'r2', partNumber: '2', invoiced: false }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsInvoiced).toBe(0);
  });

  it('shipped and invoiced are independent — job can be shipped but not invoiced', () => {
    const runs = [
      makeRun({ shipped: true, invoiced: false }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsShipped).toBe(1);
    expect(result[0].parentJobsInvoiced).toBe(0);
  });

  it('calculates avg days order to ship', () => {
    const runs = [
      makeRun({ orderDate: '2026-04-01', shipDate: '2026-04-13' }), // 12 days
      makeRun({ id: 'r2', orderDate: '2026-04-03', shipDate: '2026-04-13', partNumber: '2' }), // 10 days
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].avgDaysOrderToShip).toBe(11);
  });

  it('calculates on-time delivery pct', () => {
    const runs = [
      makeRun({ shipDate: '2026-04-13', dueDate: '2026-04-15' }), // on time
      makeRun({ id: 'r2', shipDate: '2026-04-14', dueDate: '2026-04-10', partNumber: '2' }), // late
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].onTimeDeliveryPct).toBe(50);
  });

  it('sums weekly revenue', () => {
    const runs = [
      makeRun({ revenue: 5000 }),
      makeRun({ id: 'r2', revenue: 3000, partNumber: '2' }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].weeklyRevenue).toBe(8000);
  });

  it('returns null for avg days when no valid dates', () => {
    const runs = [makeRun({ orderDate: null, shipDate: '2026-04-13' })];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].avgDaysOrderToShip).toBeNull();
  });

  it('handles empty runs', () => {
    const result = computeWeeklyKPIs([], weeks);
    expect(result[0].parentJobsShipped).toBe(0);
    expect(result[0].avgDaysOrderToShip).toBeNull();
    expect(result[0].onTimeDeliveryPct).toBeNull();
    expect(result[0].weeklyRevenue).toBe(0);
  });

  it('uses dateSentToInvoicing as effective ship date when available', () => {
    const weeks = ['2026-04-06']; // week of Apr 6
    const runs = [
      makeRun({ shipDate: '2026-04-13', dateSentToInvoicing: '2026-04-07' }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    // Run should land in week of Apr 6 (via dateSentToInvoicing), not Apr 13
    expect(result[0].parentJobsShipped).toBe(1);
  });

  it('falls back to shipDate when dateSentToInvoicing is null', () => {
    const runs = [
      makeRun({ shipDate: '2026-04-13', dateSentToInvoicing: null }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsShipped).toBe(1);
  });

  it('counts multiple parent jobs separately', () => {
    const runs = [
      makeRun({ parentJob: '19000', customer: '036' }),
      makeRun({ id: 'r2', parentJob: '19001', customer: '036', jobId: '036_19001_1' }),
    ];
    const result = computeWeeklyKPIs(runs, weeks);
    expect(result[0].parentJobsShipped).toBe(2);
  });
});
