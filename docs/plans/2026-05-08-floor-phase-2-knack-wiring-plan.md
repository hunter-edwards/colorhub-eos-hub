# Floor Phase 2 — Knack Wiring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Phase 1 Knack mock in `src/server/floor-knack.ts` with real data from Knack `object_5` (routings), via a hub-cached snapshot table refreshed by a sync function.

**Architecture:** New Drizzle table `knack_routings_snapshot` is the read source for the UI. Server function `syncFloorRoutings()` paginates Knack, parses fields, and transactionally replaces the snapshot. Vercel cron triggers it every 1 min plus an on-demand trigger from `/floor` page load. Three pure parse helpers (TDD) translate Knack's quirky string fields. `floor-knack.ts` becomes a thin reader over the snapshot table. UI gets minor adjustments: status pill semantics, sheets-received bar, sync-dot states, and a manual "Sync now" button on `/floor/setup`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Drizzle ORM + Postgres (Supabase), Vercel Cron, vitest + RTL, Playwright.

**Reference docs:**
- Design: `docs/plans/2026-05-08-floor-phase-2-knack-wiring-design.md` — read first.
- Phase 1 design: `docs/plans/2026-05-07-floor-shift-huddle-design.md`.
- Existing Knack client: `src/lib/knack.ts` (fetch helper, parsing patterns to mirror).
- Existing scorecard sync (model for ours): `src/server/knack-sync.ts`.
- Existing `floor-knack.ts` (current mock to replace).
- Knack schema dump (used during brainstorm): `/tmp/knack-object_5-fields.json`, `/tmp/knack-object_5-sample.json` — regenerate via `npx tsx --env-file=.env.local scripts/dump-knack-routings.ts` if needed.

**Conventions enforced throughout:**
- TDD for every pure helper and every server function. Failing test first, watch it fail, minimal impl, watch it pass, commit.
- One commit per task unless the task says otherwise.
- Drizzle: `snake_case` columns, `camelCase` TS field names. Mirror `src/db/schema.ts`.
- Never write to Knack.
- Knack network access stays inside `src/server/floor-knack-sync.ts` (sync) and the existing `src/lib/knack.ts` (other features). `src/server/floor-knack.ts` becomes a pure DB reader — no Knack imports.

---

## Phase 2.0 — Foundation

### Task 1: Drizzle schema for `knack_routings_snapshot`

**Files:**
- Modify: `src/db/schema.ts` (append after the floor tables added in Phase 1)
- Create: `drizzle/00XX_floor_knack_snapshot.sql` (auto-named by drizzle-kit)

**Step 1: Append schema**

Add to `src/db/schema.ts`:

```ts
export const knackRoutingsSnapshot = pgTable('knack_routings_snapshot', {
  knackRecordId: text('knack_record_id').primaryKey(),
  knackRunId: text('knack_run_id'),
  jobNumber: text('job_number'),
  customer: text('customer'),
  itemName: text('item_name'),
  routingStep: text('routing_step').notNull(),
  stationKey: text('station_key').notNull(),
  complete: boolean('complete').notNull(),
  artReady: boolean('art_ready').notNull(),
  materialReady: boolean('material_ready').notNull(),
  routingIsReady: boolean('routing_is_ready').notNull(),
  productionPriority: integer('production_priority'),
  highPriority: boolean('high_priority').notNull().default(false),
  sheetsNeeded: integer('sheets_needed'),
  sheetsProduced: integer('sheets_produced'),
  sheetsReceived: integer('sheets_received'),
  wasteExternal: integer('waste_external'),
  wasteInternal: integer('waste_internal'),
  issueNotes: text('issue_notes'),
  wcNotesToProd: text('wc_notes_to_prod'),
  wcNotesByProd: text('wc_notes_by_prod'),
  runDueDate: date('run_due_date'),
  routingCompleteAt: timestamp('routing_complete_at'),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (t) => [
  index('idx_routings_station_priority').on(t.stationKey, t.productionPriority),
  index('idx_routings_complete').on(t.complete),
]);
```

Also extend the existing `knack_sync_runs` table (in `schema.ts`) with a `kind` column if it doesn't already discriminate. If the table is currently single-purpose for scorecard, add:

```ts
// inside the existing knackSyncRuns table definition
kind: text('kind').notNull().default('scorecard'),
status: text('status').notNull().default('ok'),
errorMessage: text('error_message'),
fetched: integer('fetched'),
inserted: integer('inserted'),
hiddenSkipped: integer('hidden_skipped'),
```

If `knack_sync_runs` doesn't exist as a Drizzle table (it lives only as a query), create it now with the columns above plus `id`, `syncedAt`.

**Step 2: Generate migration**

```bash
npm run db:generate
```

Expected: a new `drizzle/00XX_*.sql` is produced. Inspect to confirm only CREATE TABLE for `knack_routings_snapshot` (and any modifications to `knack_sync_runs`). No destructive ALTERs on unrelated tables.

**Step 3: Apply migration**

```bash
npm run db:migrate
```

If `DATABASE_URL` is unavailable in worktree, commit without applying and note in commit body. (User will apply against Supabase prod via SQL editor as in Phase 1.)

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/00XX_*.sql drizzle/meta/
git commit -m "feat(floor): add knack_routings_snapshot table + extend sync runs log"
```

---

### Task 2: `mapRoutingStepToStation` helper (TDD)

**Files:**
- Create: `src/lib/floor-knack-parse.ts`
- Create: `src/lib/floor-knack-parse.test.ts`

**Step 1: Failing tests**

```ts
// src/lib/floor-knack-parse.test.ts
import { describe, it, expect } from 'vitest';
import { mapRoutingStepToStation, STATION_KEYS } from './floor-knack-parse';

describe('mapRoutingStepToStation', () => {
  it('maps PRINT - BRN and COAT ONLY PASS - BRN to press_1', () => {
    expect(mapRoutingStepToStation('PRINT - BRN')).toBe('press_1');
    expect(mapRoutingStepToStation('COAT ONLY PASS - BRN')).toBe('press_1');
  });
  it('maps PRINT - Durst to press_2', () => {
    expect(mapRoutingStepToStation('PRINT - Durst')).toBe('press_2');
  });
  it('maps CAD to cad', () => {
    expect(mapRoutingStepToStation('CAD')).toBe('cad');
  });
  it('maps DIE to rotary', () => {
    expect(mapRoutingStepToStation('DIE')).toBe('rotary');
  });
  it('maps GLUE and TAPE to gluer_tape', () => {
    expect(mapRoutingStepToStation('GLUE')).toBe('gluer_tape');
    expect(mapRoutingStepToStation('TAPE')).toBe('gluer_tape');
  });
  it('maps HAND FULFILLMENT to handwork', () => {
    expect(mapRoutingStepToStation('HAND FULFILLMENT')).toBe('handwork');
  });
  it('maps all SHIP variants to shipping', () => {
    expect(mapRoutingStepToStation('SHIP PREP')).toBe('shipping');
    expect(mapRoutingStepToStation('SHIP READY')).toBe('shipping');
    expect(mapRoutingStepToStation('SHIPPED')).toBe('shipping');
  });
  it('returns null for hidden steps', () => {
    expect(mapRoutingStepToStation('SLIT')).toBeNull();
    expect(mapRoutingStepToStation('FIN')).toBeNull();
    expect(mapRoutingStepToStation('OUTSOURCE')).toBeNull();
    expect(mapRoutingStepToStation('QUALITY HOLD')).toBeNull();
    expect(mapRoutingStepToStation('MISTAKE WASTE')).toBeNull();
  });
  it('returns null for unknown step values', () => {
    expect(mapRoutingStepToStation('NEW STEP THAT WE HAVE NOT SEEN')).toBeNull();
    expect(mapRoutingStepToStation('')).toBeNull();
  });
});

describe('STATION_KEYS', () => {
  it('exports the 7 station keys', () => {
    expect(STATION_KEYS).toEqual([
      'press_1', 'press_2', 'cad', 'rotary',
      'gluer_tape', 'handwork', 'shipping',
    ]);
  });
});
```

Run: `npx vitest run src/lib/floor-knack-parse.test.ts` — expect FAIL.

**Step 2: Implement**

```ts
// src/lib/floor-knack-parse.ts
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
```

**Step 3: Re-run** until green.

**Step 4: Commit**

```bash
git add src/lib/floor-knack-parse.ts src/lib/floor-knack-parse.test.ts
git commit -m "feat(floor): add routingStep → stationKey mapping helper"
```

---

### Task 3: `parseQtyRollup` helper (TDD)

**Files:**
- Modify: `src/lib/floor-knack-parse.ts` (add `parseQtyRollup`)
- Modify: `src/lib/floor-knack-parse.test.ts` (add tests)

**Step 1: Failing tests**

```ts
describe('parseQtyRollup', () => {
  it('parses full rollup with all fields', () => {
    const input = '4820 / 5000 (+10%/-0%)\nRcvd = 4500\n#Jobs = 3';
    expect(parseQtyRollup(input)).toEqual({
      produced: 4820,
      needed: 5000,
      tolerancePlus: 10,
      toleranceMinus: 0,
      received: 4500,
      jobCount: 3,
    });
  });
  it('handles HTML <br /> separators (Knack default)', () => {
    const input = '0 / <br />(+10%/-0%)<br /><br />Rcvd = 0<br />#Jobs = 0';
    expect(parseQtyRollup(input)).toEqual({
      produced: 0, needed: null, tolerancePlus: 10, toleranceMinus: 0,
      received: 0, jobCount: 0,
    });
  });
  it('handles comma-formatted numbers', () => {
    const input = '12,400 / 50,000\nRcvd = 25,000\n#Jobs = 1';
    expect(parseQtyRollup(input)?.produced).toBe(12400);
    expect(parseQtyRollup(input)?.needed).toBe(50000);
    expect(parseQtyRollup(input)?.received).toBe(25000);
  });
  it('returns nulls for empty input', () => {
    expect(parseQtyRollup('')).toEqual({
      produced: null, needed: null, tolerancePlus: null,
      toleranceMinus: null, received: null, jobCount: null,
    });
  });
  it('returns nulls for sparse input (no Rcvd line)', () => {
    const input = '0 / 5000';
    const r = parseQtyRollup(input);
    expect(r?.produced).toBe(0);
    expect(r?.needed).toBe(5000);
    expect(r?.received).toBeNull();
    expect(r?.jobCount).toBeNull();
  });
  it('parses negative tolerance', () => {
    const input = '0 / 100 (+5%/-2%)';
    expect(parseQtyRollup(input)?.tolerancePlus).toBe(5);
    expect(parseQtyRollup(input)?.toleranceMinus).toBe(2);
  });
});
```

**Step 2: Implement**

```ts
export type QtyRollup = {
  produced: number | null;
  needed: number | null;
  tolerancePlus: number | null;
  toleranceMinus: number | null;
  received: number | null;
  jobCount: number | null;
};

function num(s: string | undefined): number | null {
  if (s === undefined || s === '') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function parseQtyRollup(input: string): QtyRollup {
  // Normalize <br /> → \n, collapse whitespace
  const text = input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/ /g, ' ');

  // produced / needed
  const pn = text.match(/([\d,]+)\s*\/\s*([\d,]*)/);
  // tolerance
  const tol = text.match(/\(\+(\d+)%\/-(\d+)%\)/);
  // received
  const rcvd = text.match(/Rcvd\s*=\s*([\d,]+)/i);
  // jobs
  const jobs = text.match(/#Jobs\s*=\s*([\d,]+)/i);

  return {
    produced: num(pn?.[1]),
    needed: num(pn?.[2]),
    tolerancePlus: num(tol?.[1]),
    toleranceMinus: num(tol?.[2]),
    received: num(rcvd?.[1]),
    jobCount: num(jobs?.[1]),
  };
}
```

**Step 3:** Re-run tests until green.

**Step 4: Commit**

```bash
git add src/lib/floor-knack-parse.ts src/lib/floor-knack-parse.test.ts
git commit -m "feat(floor): add qty rollup parser for Knack field_1706"
```

---

### Task 4: `parseCustomerAndItem` helper (TDD)

**Files:**
- Modify: `src/lib/floor-knack-parse.ts`
- Modify: `src/lib/floor-knack-parse.test.ts`

**Step 1: Failing tests**

```ts
describe('parseCustomerAndItem', () => {
  it('parses standard rollup', () => {
    const input = 'Shoreline Container<br /><br />100001732';
    expect(parseCustomerAndItem(input)).toEqual({
      customer: 'Shoreline Container',
      itemName: '100001732',
    });
  });
  it('handles multi-line item', () => {
    const input = 'Acme Corp<br /><br />Part A<br />Part B';
    expect(parseCustomerAndItem(input)).toEqual({
      customer: 'Acme Corp',
      itemName: 'Part A Part B',
    });
  });
  it('returns nulls for empty input', () => {
    expect(parseCustomerAndItem('')).toEqual({ customer: null, itemName: null });
  });
  it('handles single line (customer only)', () => {
    expect(parseCustomerAndItem('Solo Customer')).toEqual({
      customer: 'Solo Customer',
      itemName: null,
    });
  });
  it('strips HTML entities and trims', () => {
    const input = '  Customer &amp; Co<br /><br />   Item Name   ';
    expect(parseCustomerAndItem(input)).toEqual({
      customer: 'Customer & Co',
      itemName: 'Item Name',
    });
  });
});
```

**Step 2: Implement**

```ts
export function parseCustomerAndItem(input: string): {
  customer: string | null;
  itemName: string | null;
} {
  if (!input) return { customer: null, itemName: null };
  const cleaned = input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')      // strip remaining tags
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
```

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/lib/floor-knack-parse.ts src/lib/floor-knack-parse.test.ts
git commit -m "feat(floor): add customer/item parser for Knack field_1707"
```

---

### Task 5: Knack value coercion helpers (TDD)

**Files:**
- Modify: `src/lib/floor-knack-parse.ts`
- Modify: `src/lib/floor-knack-parse.test.ts`

**Step 1: Failing tests**

```ts
describe('yesNoToBool', () => {
  it('treats Yes (any case) as true', () => {
    expect(yesNoToBool('Yes')).toBe(true);
    expect(yesNoToBool('yes')).toBe(true);
    expect(yesNoToBool('YES')).toBe(true);
  });
  it('treats No and falsy as false', () => {
    expect(yesNoToBool('No')).toBe(false);
    expect(yesNoToBool('')).toBe(false);
    expect(yesNoToBool(null)).toBe(false);
    expect(yesNoToBool(undefined)).toBe(false);
  });
});

describe('parseKnackInt', () => {
  it('parses numbers', () => {
    expect(parseKnackInt(20)).toBe(20);
    expect(parseKnackInt(0)).toBe(0);
  });
  it('parses Knack number strings', () => {
    expect(parseKnackInt('20.0')).toBe(20);
    expect(parseKnackInt('1,500')).toBe(1500);
  });
  it('returns null for empty / invalid', () => {
    expect(parseKnackInt('')).toBeNull();
    expect(parseKnackInt(null)).toBeNull();
    expect(parseKnackInt(undefined)).toBeNull();
    expect(parseKnackInt('abc')).toBeNull();
  });
});
```

**Step 2: Implement**

```ts
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
```

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/lib/floor-knack-parse.ts src/lib/floor-knack-parse.test.ts
git commit -m "feat(floor): add Knack value coercion helpers"
```

---

## Phase 2.1 — Sync function

### Task 6: Knack 429 retry in shared helper

**Files:**
- Modify: `src/lib/knack.ts` (the existing `knackFetch` function)

**Step 1: Add retry**

Wrap the existing fetch with a single retry on HTTP 429. Use `Retry-After` header if present (seconds), else linear 500ms.

```ts
async function knackFetch(config: KnackConfig, path: string, attempt = 0): Promise<unknown> {
  const res = await fetch(`${KNACK_BASE}${path}`, { headers: {...} });
  if (res.status === 429 && attempt < 1) {
    const ra = parseInt(res.headers.get('Retry-After') || '', 10);
    await new Promise(r => setTimeout(r, Number.isFinite(ra) ? ra * 1000 : 500));
    return knackFetch(config, path, attempt + 1);
  }
  if (!res.ok) throw new Error(`Knack API ${res.status}: ${await res.text()}`);
  return res.json();
}
```

**Step 2:** No new test for retry (would require mocking the global `fetch` and timing). Manually verify by running existing scorecard sync once; confirm no behavior change.

**Step 3: Commit**

```bash
git add src/lib/knack.ts
git commit -m "feat(knack): single retry-with-backoff on 429 in knackFetch"
```

---

### Task 7: `syncFloorRoutings` server function (TDD)

**Files:**
- Create: `src/server/floor-knack-sync.ts`
- Create: `src/server/floor-knack-sync.test.ts`

**Step 1: Failing tests**

```ts
import { describe, it, expect, vi } from 'vitest';

// Hoisted state for db mock
const state = vi.hoisted(() => ({
  deleted: 0,
  inserted: [] as any[],
  syncRuns: [] as any[],
}));

vi.mock('@/db', () => {
  const db = {
    transaction: async (fn: any) => fn({
      delete: () => ({ then: undefined, returning: async () => { state.deleted++; return []; }, async execute() { state.deleted++; return []; } }),
      insert: (table: any) => ({
        values: async (rows: any[]) => { state.inserted.push(...rows); return []; },
      }),
    }),
    insert: (table: any) => ({ values: async (row: any) => state.syncRuns.push(row) }),
  };
  return { db };
});

vi.mock('@/lib/knack', () => ({
  knackFetch: vi.fn(),
  getKnackConfig: () => ({ appId: 'a', apiKey: 'k' }),
}));

import { knackFetch } from '@/lib/knack';
import { syncFloorRoutings } from './floor-knack-sync';

describe('syncFloorRoutings', () => {
  it('paginates, parses, and writes', async () => {
    state.deleted = 0; state.inserted = []; state.syncRuns = [];
    (knackFetch as any).mockResolvedValue({
      total_pages: 1,
      records: [
        // visible — PRINT - BRN, complete=No
        {
          id: 'rec1',
          field_43: 'PRINT - BRN',
          field_44_raw: [{ id: 'run1' }],
          field_460: 'No',
          field_460_raw: false,
          field_517: 'Yes',
          field_516: 'Yes',
          field_574_raw: true,
          field_495: '10.0',
          field_1052: 'No',
          field_929: 5000,
          field_575: 0,
          field_1706: '0 / 5000 (+10%/-0%)\nRcvd = 4500\n#Jobs = 1',
          field_1707: 'Acme Corp<br /><br />Part A',
          field_1698: '055_19141_1',
          field_2097: '05/26/2026',
        },
        // hidden — SLIT
        {
          id: 'rec2',
          field_43: 'SLIT',
          field_460: 'No', field_460_raw: false,
          field_517: 'Yes', field_516: 'Yes', field_574_raw: true,
          field_495: '20.0', field_1052: 'No',
          field_1706: '', field_1707: '',
        },
      ],
    });
    const result = await syncFloorRoutings();
    expect(result.fetched).toBe(2);
    expect(result.hiddenSkipped).toBe(1);
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0]).toMatchObject({
      knackRecordId: 'rec1',
      stationKey: 'press_1',
      customer: 'Acme Corp',
      itemName: 'Part A',
      sheetsNeeded: 5000,
      sheetsReceived: 4500,
      productionPriority: 10,
    });
    expect(state.syncRuns).toHaveLength(1);
    expect(state.syncRuns[0]).toMatchObject({ kind: 'floor_routings', status: 'ok' });
  });

  it('logs error on Knack failure and leaves snapshot alone', async () => {
    state.deleted = 0; state.inserted = []; state.syncRuns = [];
    (knackFetch as any).mockRejectedValue(new Error('boom'));
    await expect(syncFloorRoutings()).rejects.toThrow('boom');
    expect(state.inserted).toHaveLength(0);
    expect(state.syncRuns[0]).toMatchObject({ kind: 'floor_routings', status: 'error' });
  });
});
```

Run: `npx vitest run src/server/floor-knack-sync.test.ts` — expect FAIL.

**Step 2: Implement**

```ts
// src/server/floor-knack-sync.ts
import { db } from '@/db';
import { knackRoutingsSnapshot, knackSyncRuns } from '@/db/schema';
import { knackFetch, getKnackConfig } from '@/lib/knack';
import {
  mapRoutingStepToStation,
  parseQtyRollup,
  parseCustomerAndItem,
  yesNoToBool,
  parseKnackInt,
} from '@/lib/floor-knack-parse';

const FILTER = encodeURIComponent(JSON.stringify({
  match: 'and',
  rules: [
    { field: 'field_460', operator: 'is', value: 'No' },
    { field: 'field_517', operator: 'is', value: 'Yes' },
    { field: 'field_516', operator: 'is', value: 'Yes' },
  ],
}));

export async function syncFloorRoutings(): Promise<{
  fetched: number; inserted: number; hiddenSkipped: number;
  status: 'ok' | 'skipped' | 'error'; syncedAt: Date;
}> {
  const startedAt = new Date();
  let fetched = 0, hiddenSkipped = 0;
  const rows: typeof knackRoutingsSnapshot.$inferInsert[] = [];

  try {
    const config = getKnackConfig();
    let page = 1, totalPages = 1;
    while (page <= totalPages) {
      const data = await knackFetch(config,
        `/objects/object_5/records?filters=${FILTER}&rows_per_page=1000&page=${page}`
      ) as { total_pages: number; records: Record<string, any>[] };
      totalPages = data.total_pages;
      fetched += data.records.length;
      for (const r of data.records) {
        const stationKey = mapRoutingStepToStation(String(r.field_43 ?? ''));
        if (!stationKey) { hiddenSkipped++; continue; }
        const qty = parseQtyRollup(String(r.field_1706 ?? ''));
        const ci  = parseCustomerAndItem(String(r.field_1707 ?? ''));
        rows.push({
          knackRecordId: r.id,
          knackRunId: r.field_44_raw?.[0]?.id ?? null,
          jobNumber: r.field_1698 ?? null,
          customer: ci.customer,
          itemName: ci.itemName,
          routingStep: String(r.field_43),
          stationKey,
          complete: r.field_460_raw ?? false,
          artReady: yesNoToBool(r.field_517),
          materialReady: yesNoToBool(r.field_516),
          routingIsReady: r.field_574_raw ?? false,
          productionPriority: parseKnackInt(r.field_495),
          highPriority: yesNoToBool(r.field_1052),
          sheetsNeeded: qty.needed ?? parseKnackInt(r.field_929),
          sheetsProduced: qty.produced ?? parseKnackInt(r.field_575),
          sheetsReceived: qty.received,
          wasteExternal: parseKnackInt(r.field_1556),
          wasteInternal: parseKnackInt(r.field_1557),
          issueNotes: r.field_1583 ?? null,
          wcNotesToProd: r.field_538 ?? null,
          wcNotesByProd: r.field_1564 ?? null,
          runDueDate: parseKnackDate(r.field_2097), // reuse from lib/knack
          routingCompleteAt: null, // can revisit when needed
        });
      }
      page++;
    }

    await db.transaction(async (tx) => {
      // advisory lock
      await tx.execute(sql`SELECT pg_advisory_xact_lock(429000001)`);
      await tx.delete(knackRoutingsSnapshot);
      if (rows.length) await tx.insert(knackRoutingsSnapshot).values(rows);
    });

    await db.insert(knackSyncRuns).values({
      kind: 'floor_routings',
      status: 'ok',
      fetched, inserted: rows.length, hiddenSkipped,
      syncedAt: new Date(),
    });

    return { fetched, inserted: rows.length, hiddenSkipped, status: 'ok', syncedAt: new Date() };
  } catch (err: any) {
    await db.insert(knackSyncRuns).values({
      kind: 'floor_routings',
      status: 'error',
      errorMessage: String(err?.message ?? err),
      syncedAt: new Date(),
    }).catch(() => {});
    throw err;
  }
}
```

Note: `parseKnackDate` and `getKnackConfig` may need to be exported from `src/lib/knack.ts` if they aren't already. Check and add `export` keywords as needed in a small follow-up edit (same commit).

**Step 3:** Run tests until green. May need iteration on the db mock shape.

**Step 4: Commit**

```bash
git add src/server/floor-knack-sync.ts src/server/floor-knack-sync.test.ts src/lib/knack.ts
git commit -m "feat(floor): syncFloorRoutings fetches and snapshots active Knack routings"
```

---

### Task 8: Cron API route + on-demand trigger

**Files:**
- Create: `src/app/api/floor/sync/route.ts` (POST handler invoked by cron + the manual button)
- Modify: `vercel.json` (create if absent) — add a cron entry
- Modify: `src/app/(app)/floor/page.tsx` — call `maybeTriggerSync()` server-side

**Step 1: API route**

```ts
// src/app/api/floor/sync/route.ts
import { NextResponse } from 'next/server';
import { syncFloorRoutings } from '@/server/floor-knack-sync';

export async function POST(req: Request) {
  // Vercel cron sends a header; the manual button also calls this route from a server action.
  const auth = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  // Accept either valid cron token or trust the existing app session (Supabase) — the manual
  // button goes through a server action that runs in our authenticated context.
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    // fall through to allow other authenticated callers; manual sync handled via server action
    // (which doesn't hit this route directly). For now, require cron secret here.
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncFloorRoutings();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
```

**Step 2: Cron config**

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/floor/sync", "schedule": "* * * * *" }
  ]
}
```

Note: Vercel cron jobs are GET by default; if Vercel sends GET, also export `GET` in the route handler that delegates to the same logic. Re-read `node_modules/next/dist/docs/02-app/02-api-reference/02-file-conventions/01-route.mdx` if needed.

**Step 3: On-demand trigger**

In `src/app/(app)/floor/page.tsx`, near the top of the server component, after the existing data fetch:

```ts
// Fire-and-forget background sync if the last one was a while ago.
const last = await getLastFloorSync();
const ageMs = last ? Date.now() - last.syncedAt.getTime() : Infinity;
if (ageMs > 30_000) {
  // Don't await — render with current snapshot, sync in background.
  void syncFloorRoutings().catch(() => {});
}
```

Add a small helper `getLastFloorSync()` to `src/server/floor-knack-sync.ts` returning the latest `knack_sync_runs` row where `kind = 'floor_routings'`.

**Step 4: Manual test**

`npm run dev`, navigate to `/floor`, check the server console for one sync log.

**Step 5: Commit**

```bash
git add src/app/api/floor/sync vercel.json src/app/\(app\)/floor/page.tsx src/server/floor-knack-sync.ts
git commit -m "feat(floor): Vercel cron + on-demand trigger for routing sync"
```

---

## Phase 2.2 — Read path

### Task 9: Replace `floor-knack.ts` mock with snapshot reader

**Files:**
- Modify: `src/server/floor-knack.ts` (rewrite)
- Modify: `src/server/floor-knack.test.ts` (rewrite tests against DB mock)

**Step 1: Failing tests**

Replace the existing tests with snapshot-driven tests:

```ts
import { describe, it, expect, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as any[] }));

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => state.rows,
        }),
      }),
    }),
  },
}));

import { getFloorView } from './floor-knack';

describe('getFloorView (snapshot)', () => {
  it('returns one entry per stationId; current = top priority routing', async () => {
    state.rows = [
      // press_1 has two routings
      { stationKey: 'press_1', productionPriority: 10, knackRecordId: 'a', jobNumber: 'J-1', customer: 'Acme', itemName: 'Part A', sheetsNeeded: 5000, sheetsProduced: 0, sheetsReceived: 4500, wasteInternal: 0, wasteExternal: 0, issueNotes: null, complete: false, runDueDate: null },
      { stationKey: 'press_1', productionPriority: 20, knackRecordId: 'b', jobNumber: 'J-2', customer: 'Globex', itemName: 'Part B', sheetsNeeded: 1000, sheetsProduced: 0, sheetsReceived: 0, wasteInternal: 0, wasteExternal: 0, issueNotes: null, complete: false, runDueDate: null },
      // press_2 has none
    ];
    const view = await getFloorView(['press_1', 'press_2']);
    expect(view).toHaveLength(2);
    const p1 = view.find(v => v.stationId === 'press_1')!;
    expect(p1.status).toBe('running');
    expect(p1.current?.jobNumber).toBe('J-1');
    expect(p1.queue).toHaveLength(1);
    expect(p1.queue[0].jobNumber).toBe('J-2');
    const p2 = view.find(v => v.stationId === 'press_2')!;
    expect(p2.status).toBe('idle');
    expect(p2.current).toBeNull();
    expect(p2.queue).toEqual([]);
  });
});
```

**Step 2: Implement**

```ts
// src/server/floor-knack.ts
import { db } from '@/db';
import { knackRoutingsSnapshot } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { FloorJob, FloorStationView, StationId } from '@/lib/floor-types';

function rowToJob(r: typeof knackRoutingsSnapshot.$inferSelect): FloorJob {
  return {
    id: r.knackRecordId,
    jobNumber: r.jobNumber ?? '',
    customer: r.customer ?? '',
    lineItem: r.itemName ?? '',
    sheetsNeeded: r.sheetsNeeded ?? 0,
    sheetsCompleted: r.sheetsProduced ?? 0,
    sheetsReceived: r.sheetsReceived ?? 0,
    wasteSheets: (r.wasteInternal ?? 0) + (r.wasteExternal ?? 0),
    routingComplete: r.complete,
    dueDate: r.runDueDate ?? null,
    issueNotes: r.issueNotes ? [r.issueNotes] : [],
  };
}

export async function getFloorView(stationIds: StationId[]): Promise<FloorStationView[]> {
  const results: FloorStationView[] = [];
  for (const stationId of stationIds) {
    const rows = await db.select().from(knackRoutingsSnapshot)
      .where(eq(knackRoutingsSnapshot.stationKey, stationId))
      .orderBy(asc(knackRoutingsSnapshot.productionPriority));
    const [current, ...queue] = rows;
    results.push({
      stationId,
      status: rows.length > 0 ? 'running' : 'idle',
      current: current ? rowToJob(current) : null,
      queue: queue.map(rowToJob),
    });
  }
  return results;
}
```

**Step 3:** Run tests until green.

**Step 4: Commit**

```bash
git add src/server/floor-knack.ts src/server/floor-knack.test.ts
git commit -m "feat(floor): replace mock with snapshot reader"
```

---

### Task 10: Map `stations.id` ↔ `stationKey`

**Files:**
- Modify: `src/server/floor-stations.ts` (or wherever the default-station seed lives)
- Modify: `src/app/(app)/floor/page.tsx` (the place that calls `getFloorView(stationIds)`)

**Step 1:** Update the default-station seed so each row has a populated `knackMachineCenterId` containing its stationKey (`press_1`, `press_2`, …). This couples the hub's station row to the Knack-side queue without adding a new column.

```ts
// In seedDefaultStations() or similar
{ name: 'Press 1', kind: 'printer', knackMachineCenterId: 'press_1', displayOrder: 1, groupLabel: 'Printing' },
{ name: 'Press 2', kind: 'printer', knackMachineCenterId: 'press_2', displayOrder: 2, groupLabel: 'Printing' },
{ name: 'CAD 1',   kind: 'cad',     knackMachineCenterId: 'cad',     displayOrder: 3, groupLabel: 'Cutting' },
{ name: 'CAD 2',   kind: 'cad',     knackMachineCenterId: 'cad',     displayOrder: 4, groupLabel: 'Cutting' },
{ name: 'Rotary',  kind: 'rotary',  knackMachineCenterId: 'rotary',  displayOrder: 5, groupLabel: 'Cutting' },
{ name: 'Gluer/Tape', kind: 'gluer', knackMachineCenterId: 'gluer_tape', displayOrder: 6, groupLabel: 'Finishing' },
{ name: 'Handwork', kind: 'handwork', knackMachineCenterId: 'handwork',  displayOrder: 7, groupLabel: 'Finishing' },
{ name: 'Shipping', kind: 'shipping', knackMachineCenterId: 'shipping',  displayOrder: 8, groupLabel: 'Shipping' },
```

Note: this drops the `unique (team_id, knack_machine_center_id)` constraint we added in Phase 1's 0014 migration — CAD 1 and CAD 2 share `'cad'`. We need to relax that constraint.

**Step 2:** Generate a follow-up migration to drop the unique constraint.

```bash
npm run db:generate
```

Should produce `DROP CONSTRAINT stations_team_id_knack_machine_center_id_unique`.

**Step 3:** In `page.tsx`, call `getFloorView(stations.map(s => s.knackMachineCenterId!).filter(Boolean))` deduped — or pass each station's id alongside its key and group on the client. Choose the simpler one: build a `Map<stationId, FloorStationView>` keyed by hub station id; for stations sharing a stationKey, both receive the same `FloorStationView`.

Concretely:

```ts
const keys = Array.from(new Set(stations.map(s => s.knackMachineCenterId).filter(Boolean)));
const viewsByKey = new Map((await getFloorView(keys)).map(v => [v.stationId, v]));
const initial = stations.map(s => ({
  station: s,
  view: viewsByKey.get(s.knackMachineCenterId!) ?? emptyView(s.knackMachineCenterId!),
}));
```

**Step 4:** Update any downstream prop types if `FloorBoard` expected per-station-id views. The change is: same `stationKey` → same view object reused.

**Step 5: Commit**

```bash
git add src/server/floor-stations.ts src/app/\(app\)/floor/page.tsx drizzle/
git commit -m "feat(floor): wire hub stations to Knack stationKey (shared CAD queue)"
```

---

## Phase 2.3 — UI tweaks

### Task 11: Sheets-received bar in expand modal

**Files:**
- Modify: `src/app/(app)/floor/components/station-modal.tsx`

**Step 1:** In the "Now running" section, below the existing produced-vs-needed bar, add a second slim bar bound to `current.sheetsReceived / current.sheetsNeeded`. Color red when `received < needed`. Hide entirely when `sheetsReceived` is null/undefined or `sheetsNeeded` is 0.

Pattern:

```tsx
{current.sheetsReceived != null && current.sheetsNeeded > 0 && (
  <div className="mt-2">
    <div className="floor-chip text-muted-foreground">Received</div>
    <Progress
      value={(current.sheetsReceived / current.sheetsNeeded) * 100}
      tone={current.sheetsReceived < current.sheetsNeeded ? 'warning' : 'neutral'}
    />
    <div className="floor-chip">
      {current.sheetsReceived.toLocaleString()} / {current.sheetsNeeded.toLocaleString()}
      {current.sheetsReceived < current.sheetsNeeded && ' — material short'}
    </div>
  </div>
)}
```

If `Progress` doesn't support `tone`, add a thin wrapper or use a `className`.

**Step 2:** Component test extending existing `station-modal.test.tsx`: renders a "material short" indicator when received < needed; hides when received is null.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/components/station-modal.tsx src/app/\(app\)/floor/components/station-modal.test.tsx
git commit -m "feat(floor): sheets-received bar in station expand modal"
```

---

### Task 12: Sync status dot in TV header

**Files:**
- Modify: `src/app/(app)/floor/components/tv-header.tsx`
- Modify: `src/app/(app)/floor/page.tsx` (pass last-sync data down)

**Step 1:** TV header receives a prop `floorSync: { syncedAt: Date|null, status: 'ok'|'error'|null, errorMessage?: string }`. Render the dot with color logic:

```ts
const ageMs = floorSync.syncedAt ? Date.now() - floorSync.syncedAt.getTime() : Infinity;
const color =
  floorSync.status === 'error' || ageMs > 5*60*1000 ? 'red' :
  ageMs > 90*1000 ? 'amber' :
  'green';
```

Tooltip shows `Last sync <relative time>` plus error if any.

**Step 2:** Server-side: fetch `getLastFloorSync()` in `page.tsx`, pass through.

**Step 3:** Component test: status='error' yields red; age=2min yields amber; age=10s yields green.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): sync status dot in TV header"
```

---

### Task 13: "Awaiting first sync" banner

**Files:**
- Modify: `src/app/(app)/floor/floor-board.tsx`

**Step 1:** If `floorSync.syncedAt === null` AND all tiles are idle (no snapshot yet), render a centered banner over the stations grid: "Awaiting first sync from Knack…". Disappears once first sync completes.

**Step 2: Commit**

```bash
git add src/app/\(app\)/floor/floor-board.tsx
git commit -m "feat(floor): empty-snapshot banner before first Knack sync"
```

---

### Task 14: CAD shared-queue subtitle

**Files:**
- Modify: `src/app/(app)/floor/components/station-tile.tsx`

**Step 1:** When two or more hub stations share the same `knackMachineCenterId`, render a subtitle under the station name: `"<key> queue · N jobs"`. Compute "sharing" by passing all stations through to the tile or via a memoized client-side group lookup.

Keep it small (`.floor-chip` class). Skip the subtitle when stationKey is unique.

**Step 2: Commit**

```bash
git add src/app/\(app\)/floor/components/station-tile.tsx
git commit -m "feat(floor): shared-queue subtitle for CAD tiles"
```

---

### Task 15: "Sync now" button on `/floor/setup`

**Files:**
- Modify: `src/app/(app)/floor/setup/stations-tab.tsx`
- Create: `src/app/(app)/floor/setup/sync-now-action.ts` (server action wrapper)

**Step 1: Server action**

```ts
'use server';
import { syncFloorRoutings } from '@/server/floor-knack-sync';
import { requireSupervisor } from '@/lib/auth';

export async function syncNow() {
  await requireSupervisor();
  return syncFloorRoutings();
}
```

(If `requireSupervisor` doesn't exist, gate the action with the same check used by other supervisor-only actions in `floor-actions.ts`.)

**Step 2: UI**

At the top of the Stations tab, add a small panel:

```
Last sync · 32s ago · 47 routings · 3 skipped (hidden)   [ Sync now ]
```

`Sync now` calls the action; on success, toast `Synced 47 routings (3 hidden)`. Re-fetch the last-sync row.

**Step 3:** Component test: button click calls server action; renders new last-sync info.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor/setup
git commit -m "feat(floor): manual Sync now button + last-sync display on setup"
```

---

## Phase 2.4 — Tests + polish

### Task 16: Update Playwright E2E

**Files:**
- Modify: `tests/e2e/floor.spec.ts`

**Step 1:** Choose mode:
- Option A: pre-seed `knack_routings_snapshot` rows in the test setup (more realistic, requires the test DB).
- Option B: gate `getFloorView` on `NEXT_PUBLIC_FLOOR_MOCK=1` to return mock data, set in `playwright.config.ts`.

Recommended: Option A. Add a small `tests/e2e/helpers/seed-floor-snapshot.ts` that the test calls before navigating to `/floor`. Use it to insert 2–3 routings across stations to verify status pill, current job, queue.

**Step 2:** Update the existing happy-path test to:
1. Seed snapshot with one `press_1` routing.
2. Visit `/floor`. Assert Press 1 tile shows `RUNNING` + job number + customer.
3. Click → Start job → confirm event recorded.
4. Continue with existing pause/complete/handoff steps.

**Step 3:** Run `npx playwright test floor` until green.

**Step 4: Commit**

```bash
git add tests/e2e
git commit -m "test(floor): E2E uses pre-seeded snapshot for real-data path"
```

---

### Task 17: Lint, build, manual TV verification

**Files:** as needed.

**Step 1:** `npm run lint` — fix.
**Step 2:** `npm run test:run` — all green.
**Step 3:** `npx playwright test` — green.
**Step 4:** `npm run build` — green.
**Step 5:** Open PR. Manual post-merge checks (write into PR body):
- After deploy, visit `/floor/setup`, click `Sync now`, see toast with count.
- Open Supabase SQL editor: `SELECT station_key, count(*) FROM knack_routings_snapshot GROUP BY 1` returns rows for each active station.
- Visit `/floor` on a real TV. Confirm tiles show real job numbers/customers from Knack. Spot-check one row in Knack to make sure numbers match.
- Wait 90s; verify sync dot pulses and last-sync time updates.

**Step 6: Commit any polish**

```bash
git add -A
git commit -m "chore(floor): polish from lint/tests/build pass"
```

**Step 7: Open PR**

```bash
gh pr create --title "feat(floor): Phase 2 — Knack wiring" --body "$(cat <<'EOF'
## Summary
- Replace the Phase 1 mock with real Knack data from object_5 (routings).
- New `knack_routings_snapshot` table, `syncFloorRoutings()` function, Vercel cron @ 1 min + on-demand page-load trigger.
- Three pure parse helpers (TDD): routingStep mapping, qty rollup parser, customer/item parser.
- UI: status pill from queue presence, sheets-received bar, sync dot states, empty-snapshot banner, CAD shared-queue subtitle, manual Sync now button on setup.

Design: docs/plans/2026-05-08-floor-phase-2-knack-wiring-design.md
Plan: docs/plans/2026-05-08-floor-phase-2-knack-wiring-plan.md

## Test plan
- [ ] vitest all green
- [ ] Playwright E2E green
- [ ] After deploy: Sync now on /floor/setup → toast shows counts
- [ ] Supabase: `SELECT station_key, count(*) FROM knack_routings_snapshot GROUP BY 1` returns rows
- [ ] /floor on a TV shows real job numbers/customers
- [ ] Spot-check one row against Knack
- [ ] Sync dot transitions green → amber after 90s without sync

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done criteria

- All 17 tasks committed.
- `/floor` shows real routings on a TV, refreshed at least every minute.
- `floor-knack.ts` contains no mock generator code (or only as a clearly test-marked path).
- Knack credentials never leak to the client; Sync now button gated to supervisors.
- Sync failure leaves the snapshot intact and surfaces in the header dot.

## Open decisions to confirm during implementation

- `knack_sync_runs` schema: extend or replace? (Plan assumes extend with `kind`.)
- Exact endpoint for `GET` vs `POST` in the Vercel cron path. Vercel cron uses GET by default; route handler should accept both.
- Whether the `unique(team_id, knack_machine_center_id)` constraint from Phase 1's 0014 migration needs to be dropped (CAD 1 + CAD 2 share `'cad'`). Plan assumes yes — confirmed in Task 10.
