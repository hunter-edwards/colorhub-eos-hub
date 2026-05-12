export const STATION_KEYS = [
  'press_1', 'press_2', 'cad', 'rotary',
  'gluer_tape', 'handwork', 'shipping',
] as const;

export type StationKey = typeof STATION_KEYS[number];

const STATION_MAP: Record<string, StationKey> = {
  'PRINT - BRN':          'press_1',
  'COAT ONLY PASS - BRN': 'press_1',
  'PRINT - Durst':        'press_2',
  'CAD':                  'cad',
  'DIE':                  'rotary',
  'GLUE':                 'gluer_tape',
  'TAPE':                 'gluer_tape',
  'HAND FULFILLMENT':     'handwork',
  'SHIP PREP':            'shipping',
  'SHIP READY':           'shipping',
  'SHIPPED':              'shipping',
};

export function mapRoutingStepToStation(routingStep: string): StationKey | null {
  return STATION_MAP[routingStep] ?? null;
}

export type QtyRollup = {
  produced: number | null;
  needed: number | null;
  tolerancePlus: number | null;
  toleranceMinus: number | null;
  received: number | null;
  jobCount: number | null;
};

function numOrNull(s: string | undefined): number | null {
  if (s === undefined || s === '') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function parseQtyRollup(input: string): QtyRollup {
  const text = (input ?? '').replace(/<br\s*\/?>/gi, '\n');
  // produced / needed: capture group 2 may be empty when needed is missing in the rollup
  const pn = text.match(/([\d,]+)\s*\/\s*([\d,]*)/);
  const tol = text.match(/\(\+(\d+)%\/-(\d+)%\)/);
  const rcvd = text.match(/Rcvd\s*=\s*([\d,]+)/i);
  const jobs = text.match(/#Jobs\s*=\s*([\d,]+)/i);
  return {
    produced: numOrNull(pn?.[1]),
    needed: numOrNull(pn?.[2]),
    tolerancePlus: numOrNull(tol?.[1]),
    toleranceMinus: numOrNull(tol?.[2]),
    received: numOrNull(rcvd?.[1]),
    jobCount: numOrNull(jobs?.[1]),
  };
}

export function parseCustomerAndItem(input: string): {
  customer: string | null;
  itemName: string | null;
} {
  if (!input) return { customer: null, itemName: null };
  const cleaned = input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { customer: null, itemName: null };
  const [customer, ...rest] = lines;
  return {
    customer: customer || null,
    itemName: rest.length ? rest.join(' ') : null,
  };
}

export function yesNoToBool(v: string | null | undefined): boolean {
  if (!v) return false;
  return v.trim().toLowerCase() === 'yes';
}

export function parseKnackInt(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}
