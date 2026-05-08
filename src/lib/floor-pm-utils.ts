export type PmInput = { cadenceDays: number; lastDoneAt: string | null };
export type PmStatus = {
  level: 'green' | 'yellow' | 'red';
  nextDueAt: string | null; // YYYY-MM-DD
  daysUntilDue: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMidnightFromYmd(ymd: string): number {
  return new Date(`${ymd}T00:00:00Z`).getTime();
}

function nowUtcMidnight(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function formatYmdUtc(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function pmStatus(input: PmInput, now: Date): PmStatus {
  const { cadenceDays, lastDoneAt } = input;

  if (lastDoneAt === null) {
    return { level: 'red', nextDueAt: null, daysUntilDue: null };
  }

  const lastMs = toUtcMidnightFromYmd(lastDoneAt);
  const nextMs = lastMs + cadenceDays * MS_PER_DAY;
  const nowMs = nowUtcMidnight(now);
  const daysUntilDue = Math.round((nextMs - nowMs) / MS_PER_DAY);
  const nextDueAt = formatYmdUtc(nextMs);

  let level: 'green' | 'yellow' | 'red';
  if (daysUntilDue < 0) level = 'red';
  else if (daysUntilDue <= 8) level = 'yellow';
  else level = 'green';

  return { level, nextDueAt, daysUntilDue };
}
