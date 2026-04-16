/**
 * Knack API client and KPI calculation logic.
 *
 * Knack field map (object_1 = runs):
 *   field_1700  full job ID         e.g. "177_18970_2"
 *   field_534   parent job number   e.g. "18970"
 *   field_535   part number         e.g. "2"
 *   field_1589  customer number     e.g. "177"
 *   field_8     ordered qty
 *   field_561   shipped qty (total pieces shipped)
 *   field_34    shipped flag        "Yes" / "No"
 *   field_798   invoiced flag       "Yes" / "No"
 *   field_497   ship date           e.g. "03/06/2026"
 *   field_969   order received date e.g. "01/28/2026"
 *   field_972   due/promise date    e.g. "03/04/2026"
 *   field_961   revenue             e.g. "$7,032.80" (~70% fill rate)
 */

const KNACK_BASE = 'https://api.knack.com/v1';

export type KnackConfig = {
  appId: string;
  apiKey: string;
};

export type KnackRun = {
  id: string;
  jobId: string;       // field_1700
  parentJob: string;   // field_534
  partNumber: string;  // field_535
  customer: string;    // field_1589
  orderedQty: number;  // field_8
  shippedQty: number;  // field_561
  shipped: boolean;    // field_34
  invoiced: boolean;   // field_798
  shipDate: string | null;    // field_497 → ISO date
  orderDate: string | null;   // field_969 → ISO date
  dueDate: string | null;     // field_972 → ISO date
  revenue: number;     // field_961
};

// ── Knack API helpers ──────────────────────────────────────────────

async function knackFetch(
  config: KnackConfig,
  path: string
): Promise<unknown> {
  const res = await fetch(`${KNACK_BASE}${path}`, {
    headers: {
      'X-Knack-Application-Id': config.appId,
      'X-Knack-REST-API-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Knack API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function parseKnackDate(val: string | null | undefined): string | null {
  if (!val || !val.trim()) return null;
  // Knack dates come as "MM/DD/YYYY"
  const parts = val.split('/');
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function parseMoney(val: string | null | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,]/g, '')) || 0;
}

function parseRunRecord(rec: Record<string, unknown>): KnackRun {
  return {
    id: rec.id as string,
    jobId: (rec.field_1700 as string) || '',
    parentJob: String(rec.field_534 ?? ''),
    partNumber: String(rec.field_535 ?? ''),
    customer: String(rec.field_1589 ?? ''),
    orderedQty: Number(rec.field_8) || 0,
    shippedQty: Number(rec.field_561) || 0,
    shipped: rec.field_34 === 'Yes',
    invoiced: rec.field_798 === 'Yes',
    shipDate: parseKnackDate(rec.field_497 as string),
    orderDate: parseKnackDate(rec.field_969 as string),
    dueDate: parseKnackDate(rec.field_972 as string),
    revenue: parseMoney(rec.field_961 as string),
  };
}

/**
 * Fetch all shipped runs within a date range (by ship date field_497).
 * Paginates automatically (Knack max 1000/page).
 */
export async function fetchShippedRuns(
  config: KnackConfig,
  startDate: string,  // ISO YYYY-MM-DD
  endDate: string     // ISO YYYY-MM-DD
): Promise<KnackRun[]> {
  // Convert ISO dates to Knack format MM/DD/YYYY
  const start = toKnackDate(startDate);
  const end = toKnackDate(endDate);

  const filters = JSON.stringify([
    { field: 'field_34', operator: 'is', value: 'Yes' },
    { field: 'field_497', operator: 'is after', value: start },
    { field: 'field_497', operator: 'is before', value: end },
  ]);

  const allRuns: KnackRun[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await knackFetch(
      config,
      `/objects/object_1/records?filters=${encodeURIComponent(filters)}&rows_per_page=1000&page=${page}`
    ) as { total_pages: number; records: Record<string, unknown>[] };

    totalPages = data.total_pages;
    for (const rec of data.records) {
      allRuns.push(parseRunRecord(rec));
    }
    page++;
  }

  return allRuns;
}

function toKnackDate(iso: string): string {
  const [yyyy, mm, dd] = iso.split('-');
  return `${mm}/${dd}/${yyyy}`;
}

// ── KPI calculations ───────────────────────────────────────────────

export type WeeklyKPIs = {
  weekStart: string;  // ISO date (Monday)
  parentJobsShipped: number;
  parentJobsInvoiced: number;
  avgDaysOrderToShip: number | null;
  onTimeDeliveryPct: number | null;
  weeklyRevenue: number;
};

/**
 * Given a set of shipped runs, compute weekly KPIs.
 * Groups runs into ISO weeks (Mon–Sun).
 */
export function computeWeeklyKPIs(runs: KnackRun[], weekStarts: string[]): WeeklyKPIs[] {
  return weekStarts.map((weekStart) => {
    const weekEnd = addDays(weekStart, 7);
    const weekRuns = runs.filter(
      (r) => r.shipDate && r.shipDate >= weekStart && r.shipDate < weekEnd
    );

    return {
      weekStart,
      parentJobsShipped: countParentJobsByFlag(weekRuns, runs, 'shipped'),
      parentJobsInvoiced: countParentJobsByFlag(weekRuns, runs, 'invoiced'),
      avgDaysOrderToShip: avgDaysOrderToShip(weekRuns),
      onTimeDeliveryPct: onTimeDeliveryPct(weekRuns),
      weeklyRevenue: weekRuns.reduce((sum, r) => sum + r.revenue, 0),
    };
  });
}

/**
 * Count parent jobs where ALL runs have a given flag set.
 *
 * "shipped": all runs have field_34=Yes (production KPI)
 * "invoiced": all runs have field_798=Yes (financial KPI)
 *
 * The parent job's week = week containing the MAX ship date across all
 * its runs (the week the last run was shipped).
 */
function countParentJobsByFlag(
  weekRuns: KnackRun[],
  allRuns: KnackRun[],
  flag: 'shipped' | 'invoiced'
): number {
  const parentJobsThisWeek = new Set(
    weekRuns
      .filter((r) => r.parentJob)
      .map((r) => `${r.customer}_${r.parentJob}`)
  );

  let count = 0;

  for (const pjKey of parentJobsThisWeek) {
    const [customer, parentJob] = pjKey.split('_');
    const allJobRuns = allRuns.filter(
      (r) => r.customer === customer && r.parentJob === parentJob
    );

    const allFlagged = allJobRuns.every((r) => r[flag]);
    if (!allFlagged) continue;

    const completionDate = allJobRuns.reduce(
      (max, r) => (r.shipDate && r.shipDate > max ? r.shipDate : max),
      ''
    );
    if (!completionDate) continue;

    if (weekRuns.some((r) => r.shipDate && getWeekStartForDate(r.shipDate) === getWeekStartForDate(completionDate))) {
      count++;
    }
  }

  return count;
}

function getWeekStartForDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay();
  const diff = (day + 6) % 7; // 0=Mon, 6=Sun
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function avgDaysOrderToShip(runs: KnackRun[]): number | null {
  const diffs: number[] = [];
  for (const r of runs) {
    if (r.orderDate && r.shipDate) {
      const order = new Date(r.orderDate + 'T00:00:00');
      const ship = new Date(r.shipDate + 'T00:00:00');
      diffs.push((ship.getTime() - order.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  if (diffs.length === 0) return null;
  return Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10;
}

function onTimeDeliveryPct(runs: KnackRun[]): number | null {
  const withDue = runs.filter((r) => r.dueDate && r.shipDate);
  if (withDue.length === 0) return null;
  const onTime = withDue.filter((r) => r.shipDate! <= r.dueDate!).length;
  return Math.round((onTime / withDue.length) * 1000) / 10;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
