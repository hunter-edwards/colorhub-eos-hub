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
 *   field_798   passToInvoicing     "Yes" / "No" (Knack label; trails workflow)
 *   field_497   orderDueDate        e.g. "03/06/2026" — customer due date (equation, falls back to runDueDate)
 *   field_969   internalReprintEnteredDateStamp (NOT order-received; only set on reprints)
 *   field_972   shippedButtonDateStamp (NOT due date; the "shipped" button click time)
 *   field_961   revenue             e.g. "$7,032.80" (~70% fill rate)
 *   field_2292  dateSentToInvoicing e.g. "04/16/2026" (auto-set by rule when field_798→Yes)
 *   field_510   customer name       e.g. "Harbor 3D LLC"
 */

const KNACK_BASE = 'https://api.knack.com/v1';

export type KnackConfig = {
  appId: string;
  apiKey: string;
};

export type KnackInvoice = {
  id: string;
  number: string;            // field_77 (invoiceAutoNumber, e.g. "I-5076")
  postedDate: string | null; // ISO YYYY-MM-DD (field_121)
  status: string;            // field_764
  amount: number;            // field_805 (newGrandTotalInvoiceAmount)
  runIds: string[];          // field_80 — connected run record IDs
};

/** Invoice status that signals "fully posted, sent to QuickBooks". */
export const INVOICE_STATUS_SENT = 'Added Into Quickbooks and Sent';

export type KnackRun = {
  id: string;
  jobId: string;       // field_1700
  parentJob: string;   // field_534
  partNumber: string;  // field_535
  customer: string;    // field_1589
  customerName: string; // field_510
  orderedQty: number;  // field_8
  shippedQty: number;  // field_561
  shipped: boolean;    // field_34
  invoiced: boolean;   // field_798
  orderDate: string | null;   // field_969 → ISO date (only set on reprints; mostly null)
  dueDate: string | null;     // field_497 → ISO date (orderDueDate)
  /**
   * Canonical "run completed" date: the day the shipping team clicked
   * the "shipped" button (field_972 / shippedButtonDateStamp). This is
   * the source for runsCompleted, jobsCompleted, on-time delivery, and
   * the order→complete duration. Stable historically; not subject to
   * Knack rule re-fires (unlike field_2292).
   */
  shippedDate: string | null;
  /**
   * dateSentToInvoicing (field_2292). Used only for the
   * Avg Days Sent→Invoiced metric. Frequently overwritten by rule
   * re-fires (e.g. 04/21 + 04/28 bulk stamps), so DO NOT use as a
   * completion signal.
   */
  dateSentToInvoicing: string | null;
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
  // Knack dates come as "MM/DD/YYYY" or "MM/DD/YYYY H:MMam|pm" for datetime fields.
  // Take the date part; drop any trailing time.
  const datePart = val.trim().split(' ')[0];
  const parts = datePart.split('/');
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts;
  if (!/^\d{4}$/.test(yyyy) || !/^\d{1,2}$/.test(mm) || !/^\d{1,2}$/.test(dd)) return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/**
 * Parse the dateSentToInvoicing field (field_2292), filtering out values
 * that were bulk-stamped when the Knack rule was first activated.
 *
 * Known artifact: on 2026-04-21 before 07:50 AM local, a retroactive rule
 * fire stamped ~21k existing records with the rule execution time.
 * Treating those as null so they don't pollute KPIs; real invoicings from
 * 07:50 AM onward that day and any other date pass through unchanged.
 */
export function parseInvoicingDate(val: string | null | undefined): string | null {
  if (!val || !val.trim()) return null;
  const [datePart, timePart] = val.trim().split(' ');

  if (datePart === '04/21/2026' && timePart) {
    const match = timePart.match(/^(\d+):(\d+)(am|pm)$/i);
    if (match) {
      const h = Number(match[1]);
      const m = Number(match[2]);
      const pm = match[3].toLowerCase() === 'pm';
      let hour24 = h === 12 ? 0 : h;
      if (pm) hour24 += 12;
      // Before 07:50 AM → bulk-stamp artifact
      if (hour24 < 7 || (hour24 === 7 && m < 50)) return null;
    }
  }

  return parseKnackDate(val);
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
    customerName: String(rec.field_510 ?? ''),
    orderedQty: Number(rec.field_8) || 0,
    shippedQty: Number(rec.field_561) || 0,
    shipped: rec.field_34 === 'Yes',
    invoiced: rec.field_798 === 'Yes',
    orderDate: parseKnackDate(rec.field_969 as string),
    dueDate: parseKnackDate(rec.field_497 as string),
    shippedDate: parseKnackDate(rec.field_972 as string),
    dateSentToInvoicing: parseInvoicingDate(rec.field_2292 as string),
    revenue: parseMoney(rec.field_961 as string),
  };
}

/**
 * Fetch all completed runs within a date range.
 *
 * "Completed" = field_972 (shippedButtonDateStamp) — the day the shipping
 * team clicked the "shipped" button — falls in the window. This is a
 * stable per-record event timestamp; unlike field_2292, it is not subject
 * to Knack rule re-fires that bulk-overwrite values.
 *
 * To fully evaluate "Jobs Completed" (all runs across all parts shipped),
 * callers also need runs OUTSIDE the window — fetched separately via
 * fetchRunsForParentJobs().
 *
 * Paginates automatically (Knack max 1000/page).
 */
export async function fetchCompletedRuns(
  config: KnackConfig,
  startDate: string,  // ISO YYYY-MM-DD inclusive
  endDate: string     // ISO YYYY-MM-DD exclusive
): Promise<KnackRun[]> {
  // Knack date operators are exclusive on both sides. Pad the start by
  // one day and post-filter in JS to keep boundary semantics clear.
  const startMinus1 = addIsoDays(startDate, -1);
  const filters = JSON.stringify([
    { field: 'field_972', operator: 'is after', value: toKnackDate(startMinus1) },
    { field: 'field_972', operator: 'is before', value: toKnackDate(endDate) },
  ]);
  const all = await paginate(config, filters);
  return all.filter(
    (r) => r.shippedDate !== null && r.shippedDate >= startDate && r.shippedDate < endDate
  );
}

/**
 * Fetch every run for a given set of parent job numbers (any customer).
 * Used to determine if ALL runs for a parent job are completed, since
 * some of them may fall outside the completion-date window.
 *
 * Filters go in the query string, and Knack (and any proxy in front of it)
 * will reject URLs where the `filters` param gets too large — the dreaded
 * 431. We batch the OR list so each request stays well under that limit,
 * then run batches in parallel with a small concurrency cap.
 */
const PARENT_JOB_BATCH = 25;
const PARENT_JOB_CONCURRENCY = 4;

export async function fetchRunsForParentJobs(
  config: KnackConfig,
  parentJobs: string[]
): Promise<KnackRun[]> {
  if (parentJobs.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < parentJobs.length; i += PARENT_JOB_BATCH) {
    batches.push(parentJobs.slice(i, i + PARENT_JOB_BATCH));
  }

  const results: KnackRun[] = [];
  for (let i = 0; i < batches.length; i += PARENT_JOB_CONCURRENCY) {
    const slice = batches.slice(i, i + PARENT_JOB_CONCURRENCY);
    const batchResults = await Promise.all(
      slice.map((batch) => {
        const filters = JSON.stringify({
          match: 'or',
          rules: batch.map((pj) => ({ field: 'field_534', operator: 'is', value: pj })),
        });
        return paginate(config, filters);
      })
    );
    for (const runs of batchResults) results.push(...runs);
  }

  // De-duplicate by id in case a parent job appears via multiple batches.
  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

// ── Invoice fetch helpers ──────────────────────────────────────────

function parseInvoiceRecord(rec: Record<string, unknown>): KnackInvoice {
  const conn = (rec.field_80_raw as Array<{ id?: string }>) ?? [];
  return {
    id: String(rec.id ?? ''),
    number: String(rec.field_77 ?? ''),
    postedDate: parseKnackDate(rec.field_121 as string),
    status: String(rec.field_764 ?? ''),
    amount: parseMoney(rec.field_805 as string),
    runIds: conn.map((c) => c?.id).filter((x): x is string => !!x),
  };
}

/**
 * Fetch invoices (object_10) whose postedDate (field_121) falls in the
 * given window AND whose status (field_764) is "Added Into Quickbooks
 * and Sent". This is our canonical signal for "this run was actually
 * billed to the customer".
 *
 * Knack date operators are exclusive on both sides. We pad the start
 * boundary by one day and post-filter in JS to make the intent clear.
 */
export async function fetchSentInvoicesInRange(
  config: KnackConfig,
  startDate: string, // ISO YYYY-MM-DD inclusive
  endDate: string    // ISO YYYY-MM-DD exclusive
): Promise<KnackInvoice[]> {
  const startMinus1 = addIsoDays(startDate, -1);
  const filters = JSON.stringify([
    { field: 'field_764', operator: 'is', value: INVOICE_STATUS_SENT },
    { field: 'field_121', operator: 'is after', value: toKnackDate(startMinus1) },
    { field: 'field_121', operator: 'is before', value: toKnackDate(endDate) },
  ]);

  const all: KnackInvoice[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await knackFetch(
      config,
      `/objects/object_10/records?filters=${encodeURIComponent(filters)}&rows_per_page=1000&page=${page}`
    ) as { total_pages: number; records: Record<string, unknown>[] };
    totalPages = data.total_pages;
    for (const rec of data.records) all.push(parseInvoiceRecord(rec));
    page++;
  }

  return all.filter(
    (inv) => inv.postedDate !== null && inv.postedDate >= startDate && inv.postedDate < endDate
  );
}

/**
 * Fetch run records (object_1) by their record IDs. Knack only exposes
 * single-record GETs by ID, so we call them concurrently with a small
 * cap to stay polite.
 */
const RUN_BY_ID_CONCURRENCY = 8;

export async function fetchRunsByIds(
  config: KnackConfig,
  ids: string[]
): Promise<KnackRun[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const results: KnackRun[] = [];
  for (let i = 0; i < unique.length; i += RUN_BY_ID_CONCURRENCY) {
    const slice = unique.slice(i, i + RUN_BY_ID_CONCURRENCY);
    const batch = await Promise.all(
      slice.map(async (id) => {
        try {
          const data = await knackFetch(config, `/objects/object_1/records/${id}`) as Record<string, unknown>;
          return parseRunRecord(data);
        } catch {
          return null;
        }
      })
    );
    for (const r of batch) if (r) results.push(r);
  }
  return results;
}

function addIsoDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function paginate(config: KnackConfig, filters: string): Promise<KnackRun[]> {
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
  runsCompleted: number;
  jobsCompleted: number;
  avgDaysOrderToComplete: number | null;
  onTimeDeliveryPct: number | null;
};

export type WeeklyInvoiceKPIs = {
  weekStart: string;
  runsInvoiced: number;            // unique runs across invoices posted this week
  avgDaysShippedToInvoiced: number | null; // avg(postedDate − run.shippedDate)
  weeklyRevenue: number;           // sum of invoice.amount (field_805) for invoices posted this week
};

/**
 * Compute weekly invoice-side KPIs from invoice records (object_10) and
 * the run records they reference (object_1).
 *
 *   runsInvoiced              = unique run IDs across invoices posted in the week
 *   avgDaysShippedToInvoiced  = avg of (postedDate − run.shippedDate)
 *                               for each unique run, using the EARLIEST
 *                               posted-date when a run is on multiple invoices.
 *                               Runs without a shippedDate are skipped in the
 *                               average but still counted in runsInvoiced.
 *   weeklyRevenue             = sum of invoice.amount across invoices posted in week
 */
export function computeInvoiceKPIs(
  invoices: KnackInvoice[],
  invoicedRuns: KnackRun[],
  weekStarts: string[]
): WeeklyInvoiceKPIs[] {
  const runById = new Map(invoicedRuns.map((r) => [r.id, r]));

  // First, map each runId to the EARLIEST postedDate across all invoices.
  const earliestPostedByRun = new Map<string, string>();
  for (const inv of invoices) {
    if (!inv.postedDate) continue;
    for (const runId of inv.runIds) {
      const prev = earliestPostedByRun.get(runId);
      if (!prev || inv.postedDate < prev) {
        earliestPostedByRun.set(runId, inv.postedDate);
      }
    }
  }

  return weekStarts.map((weekStart) => {
    const weekEnd = addDays(weekStart, 7);
    const runsInWeek: string[] = [];
    const dayDiffs: number[] = [];

    for (const [runId, postedDate] of earliestPostedByRun) {
      if (postedDate < weekStart || postedDate >= weekEnd) continue;
      runsInWeek.push(runId);

      const run = runById.get(runId);
      if (!run?.shippedDate) continue;
      const shipped = new Date(run.shippedDate + 'T00:00:00Z').getTime();
      const posted = new Date(postedDate + 'T00:00:00Z').getTime();
      const days = (posted - shipped) / (1000 * 60 * 60 * 24);
      // A run cannot be invoiced before it ships. If the data shows that,
      // skip rather than poison the average with a negative.
      if (days < 0) continue;
      dayDiffs.push(days);
    }

    const avg =
      dayDiffs.length === 0
        ? null
        : Math.round((dayDiffs.reduce((a, b) => a + b, 0) / dayDiffs.length) * 10) / 10;

    // Revenue: sum field_805 across invoices posted in the week. Unlike
    // the per-run sums, this counts every invoice line — multiple invoices
    // for the same run both contribute (intentional; they are distinct
    // billings from accounting's POV).
    const weeklyRevenue = invoices.reduce((sum, inv) => {
      if (!inv.postedDate || inv.postedDate < weekStart || inv.postedDate >= weekEnd) return sum;
      return sum + inv.amount;
    }, 0);

    return {
      weekStart,
      runsInvoiced: runsInWeek.length,
      avgDaysShippedToInvoiced: avg,
      weeklyRevenue,
    };
  });
}

/**
 * Compute weekly KPIs using field_972 (shippedDate) as the canonical
 * "completion" signal. Runs are grouped into ISO weeks (Mon–Sun) by
 * the day the shipped button was clicked.
 *
 * @param completedRuns runs whose shippedDate falls in the overall window
 * @param allJobRuns    every run for the parent jobs touched by completedRuns.
 *                      Needed to verify that ALL runs across ALL parts shipped.
 * @param weekStarts    ISO Monday dates (one bucket per week)
 */
export function computeWeeklyKPIs(
  completedRuns: KnackRun[],
  allJobRuns: KnackRun[],
  weekStarts: string[]
): WeeklyKPIs[] {
  return weekStarts.map((weekStart) => {
    const weekEnd = addDays(weekStart, 7);
    const weekRuns = completedRuns.filter(
      (r) => r.shippedDate && r.shippedDate >= weekStart && r.shippedDate < weekEnd
    );

    return {
      weekStart,
      runsCompleted: weekRuns.length,
      jobsCompleted: countJobsCompleted(weekRuns, allJobRuns),
      avgDaysOrderToComplete: avgDaysOrderToComplete(weekRuns),
      onTimeDeliveryPct: onTimeDeliveryPct(weekRuns),
    };
  });
}

/**
 * Count parent jobs completed in the week.
 *
 * A parent job is "completed" when every run (across every part) has
 * shippedDate set. Its week = MAX(shippedDate) across those runs.
 */
function countJobsCompleted(weekRuns: KnackRun[], allJobRuns: KnackRun[]): number {
  const parentJobsThisWeek = new Set(
    weekRuns
      .filter((r) => r.parentJob)
      .map((r) => `${r.customer}_${r.parentJob}`)
  );

  let count = 0;

  for (const pjKey of parentJobsThisWeek) {
    const [customer, parentJob] = pjKey.split('_');
    const runsForJob = allJobRuns.filter(
      (r) => r.customer === customer && r.parentJob === parentJob
    );

    const allShipped = runsForJob.length > 0 && runsForJob.every((r) => r.shippedDate);
    if (!allShipped) continue;

    // Parent job's completion week = week containing MAX(shippedDate)
    const maxDate = runsForJob.reduce(
      (max, r) => (r.shippedDate && r.shippedDate > max ? r.shippedDate : max),
      ''
    );
    if (!maxDate) continue;

    if (weekRuns.some(
      (r) => r.shippedDate && getWeekStartForDate(r.shippedDate) === getWeekStartForDate(maxDate)
    )) {
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

function avgDaysOrderToComplete(runs: KnackRun[]): number | null {
  const diffs: number[] = [];
  for (const r of runs) {
    if (r.orderDate && r.shippedDate) {
      const order = new Date(r.orderDate + 'T00:00:00');
      const complete = new Date(r.shippedDate + 'T00:00:00');
      diffs.push((complete.getTime() - order.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  if (diffs.length === 0) return null;
  return Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10;
}

function onTimeDeliveryPct(runs: KnackRun[]): number | null {
  const withDue = runs.filter((r) => r.dueDate && r.shippedDate);
  if (withDue.length === 0) return null;
  const onTime = withDue.filter((r) => r.shippedDate! <= r.dueDate!).length;
  return Math.round((onTime / withDue.length) * 1000) / 10;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
