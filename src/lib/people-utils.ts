export type Rating = 'plus' | 'plus_minus' | 'minus';

/**
 * Returns false if any rating is 'minus', true otherwise.
 * An empty array is considered "above the bar" (no negative signals).
 */
export function isAboveTheBar(
  ratings: { rating: Rating }[]
): boolean {
  return ratings.every((r) => r.rating !== 'minus');
}

const RATING_CYCLE: Rating[] = ['plus', 'plus_minus', 'minus'];

/**
 * Cycles through ratings: null -> plus -> plus_minus -> minus -> plus -> ...
 */
export function nextRating(
  current: Rating | null
): Rating {
  if (current === null) return 'plus';
  const idx = RATING_CYCLE.indexOf(current);
  return RATING_CYCLE[(idx + 1) % RATING_CYCLE.length];
}

/**
 * Formats a quarter string like '2026-Q2' into 'Q2 2026'.
 */
export function formatQuarter(q: string): string {
  const [year, quarter] = q.split('-');
  return `${quarter} ${year}`;
}
