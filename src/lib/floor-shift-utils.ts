export const FLOOR_TZ = 'America/Chicago';

type TzParts = { year: string; month: string; day: string; hour: string; minute: string };

function getTzParts(now: Date): TzParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: FLOOR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const out: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') out[p.type] = p.value;
  // Intl can return "24" for hour at midnight in some runtimes; normalize to "00".
  if (out.hour === '24') out.hour = '00';
  return out as unknown as TzParts;
}

export function resolveShift(now: Date): { shiftNumber: 1 | 2; date: string } | null {
  const { year, month, day, hour } = getTzParts(now);
  const h = parseInt(hour, 10);
  const date = `${year}-${month}-${day}`;
  if (h >= 7 && h < 15) return { shiftNumber: 1, date };
  if (h >= 15 && h < 23) return { shiftNumber: 2, date };
  return null;
}

export function isInHuddleWindow(now: Date, minutes = 10): boolean {
  const { hour, minute } = getTzParts(now);
  const mod = parseInt(hour, 10) * 60 + parseInt(minute, 10);
  const anchors = [7 * 60, 15 * 60, 23 * 60];
  return anchors.some((a) => Math.abs(mod - a) <= minutes);
}
