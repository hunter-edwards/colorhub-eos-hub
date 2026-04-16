/**
 * Returns the next quarter string.
 * '2026-Q2' -> '2026-Q3', '2026-Q4' -> '2027-Q1'
 */
export function nextQuarter(q: string): string {
  const [yearStr, qPart] = q.split('-');
  const year = parseInt(yearStr, 10);
  const quarter = parseInt(qPart.replace('Q', ''), 10);

  if (quarter === 4) {
    return `${year + 1}-Q1`;
  }
  return `${year}-Q${quarter + 1}`;
}

/**
 * Returns the completion rate (0-100) of rocks that have status 'done'.
 * Returns 0 for an empty array.
 */
export function completionRate(
  rocks: { status: string }[]
): number {
  if (rocks.length === 0) return 0;
  const done = rocks.filter((r) => r.status === 'done').length;
  return Math.round((done / rocks.length) * 100);
}
