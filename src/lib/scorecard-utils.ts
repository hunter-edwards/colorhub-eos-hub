export type MetricConfig = {
  comparator: string;
  goal?: string | null;
  goalMin?: string | null;
  goalMax?: string | null;
};

export function evaluateEntry(
  metric: MetricConfig,
  value: number
): 'red' | 'green' | null {
  const { comparator, goal, goalMin, goalMax } = metric;
  switch (comparator) {
    case 'gte':
      return goal != null ? (value >= Number(goal) ? 'green' : 'red') : null;
    case 'lte':
      return goal != null ? (value <= Number(goal) ? 'green' : 'red') : null;
    case 'eq':
      return goal != null ? (value === Number(goal) ? 'green' : 'red') : null;
    case 'range':
      if (goalMin == null || goalMax == null) return null;
      return value >= Number(goalMin) && value <= Number(goalMax)
        ? 'green'
        : 'red';
    default:
      return null;
  }
}

export function getWeekStarts(count: number): string[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  // Shift back to the Monday of the *previous* completed week — we meet on
  // Wednesdays, so "this week" in the app always refers to the most recent
  // Mon–Fri that actually finished.
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) - 7);
  monday.setHours(0, 0, 0, 0);

  const weeks: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() - i * 7);
    weeks.push(d.toISOString().slice(0, 10));
  }
  return weeks;
}
