# Floor Phase 2 — Knack Wiring — Design

**Date:** 2026-05-08
**Status:** Approved design; ready for implementation plan
**Owner:** Hunter Edwards
**Builds on:** `docs/plans/2026-05-07-floor-shift-huddle-design.md` (Phase 1 — UI + hub data + Knack mock)

## Purpose

Replace the Phase 1 mock in `src/server/floor-knack.ts` with real Knack data, sourced from `object_5` (routings). The TV layout and the rest of the Floor feature stay put; only the Knack data path changes. After this PR ships, the live dashboard shows real shop-floor work queues.

## Scope (Phase 2)

- New Drizzle table `knack_routings_snapshot` storing one row per active Knack routing.
- New `floor-knack-sync.ts` server function that fetches active routings from Knack, parses them, and replaces the snapshot table (transactionally).
- Vercel cron triggering sync every 1 minute; on-demand trigger when `/floor` loads if last sync > 30s old.
- Three pure parse helpers (TDD): `mapRoutingStepToStation`, `parseQtyRollup`, `parseCustomerAndItem`.
- Rewrite `floor-knack.ts` to read from the snapshot table (same `FloorStationView` return shape).
- UI behavior tweaks: status pill semantics, shared-queue display for CAD 1 / CAD 2, sheets-received bar in expand modal, empty/stale handling, manual "Sync now" button on `/floor/setup`.

## Out of scope

- Operator-driven event capture from Knack (deferred to Phase 3).
- Real-time push from Knack (webhooks). Polling-based sync only.
- Live Knack writes (we do not write to Knack from the hub).
- Per-physical-machine routing assignment (CAD 1 vs CAD 2 stays a shared queue; deferred).
- Usage-based PM (still date-based).
- E2E against live Knack (manual post-merge verification only).

## Knack data model (recap)

- `object_33` = Order (parent job) — contains items.
- `object_34` = Item (part) — contains runs.
- `object_1` = Run — has routings.
- `object_5` = Routing — `field_43 routingStep` designates the machine; `field_460 complete` is the done flag; sheets / waste / notes are entered here.

## Station mapping (locked in during brainstorm)

```
station_key   tile name       Knack routingStep values
----------    ----------      ------------------------
press_1       Press 1 (BRN)   PRINT - BRN, COAT ONLY PASS - BRN
press_2       Press 2 (Durst) PRINT - Durst
cad           CAD 1 + CAD 2   CAD                       (shared queue, 2 tiles)
rotary        Rotary          DIE
gluer_tape    Gluer/Tape      GLUE, TAPE
handwork      Handwork        HAND FULFILLMENT
shipping      Shipping        SHIP PREP, SHIP READY, SHIPPED
hidden        — (skip)        SLIT, FIN, OUTSOURCE, QUALITY HOLD, MISTAKE WASTE
```

The mapping is dev-managed via a constant in `src/lib/floor-knack-parse.ts`. Unknown routingStep values are logged during sync and skipped.

## Knack field map (object_5)

| Snapshot column | Knack field | Notes |
|---|---|---|
| `knack_record_id` | `id` | Routing record id; PK of snapshot. |
| `knack_run_id` | `field_44_raw[0].id` | Connection to `object_1` (run). |
| `job_number` | `field_1698` | `jobNumberForOrderRun`, e.g. `055_19141_1`. |
| `customer` | parsed from `field_1707` | First non-empty line. |
| `item_name` | parsed from `field_1707` | Remaining lines, HTML stripped. |
| `routing_step` | `field_43` | Raw Knack value, kept for debugging. |
| `station_key` | computed | Via `mapRoutingStepToStation(field_43)`. |
| `complete` | `field_460_raw` | Boolean. |
| `art_ready` | `field_517` Yes/No | Coerced via `yesNoToBool`. |
| `material_ready` | `field_516` Yes/No | Coerced. |
| `routing_is_ready` | `field_574_raw` | Boolean. |
| `production_priority` | `field_495` | Integer; ASC sort (lowest = highest priority). |
| `high_priority` | `field_1052` Yes/No | Optional boost. |
| `sheets_needed` | `field_929` | Fallback if rollup unparseable. |
| `sheets_produced` | `field_575` | Fallback if rollup unparseable. |
| `sheets_received` | parsed `Rcvd = N` from `field_1706` | Only source we have for this. |
| `waste_external` | `field_1556` | Number, may be empty string. |
| `waste_internal` | `field_1557` | |
| `issue_notes` | `field_1583` | `issuesNotes_ByRouting`. |
| `wc_notes_to_prod` | `field_538` | |
| `wc_notes_by_prod` | `field_1564` | |
| `run_due_date` | `field_2097` ISO | `runDueDateFromRun`. |
| `routing_complete_at` | `field_903` | Timestamp. |
| `fetched_at` | `now()` | Bookkeeping. |

### `field_1706` rollup parsing

The Knack rollup string looks like:

```
0 / 5000 (+10%/-0%)
Rcvd = 4500
#Jobs = 3
```

Parsed shape: `{ produced, needed, tolerancePlus, toleranceMinus, received, jobCount }`. Tolerant regex; any missing field returns `null` for that slot; the sync function falls back to `field_929` / `field_575` for `produced` / `needed` when the rollup is sparse. `received` only comes from this rollup.

### `field_1707` customer/item parsing

Strip HTML, split on collapsed newlines, first non-empty = customer, rest joined = item name.

## Sync function

`syncFloorRoutings()` in `src/server/floor-knack-sync.ts`. Returns `{ fetched, inserted, hiddenSkipped, syncedAt }`.

Algorithm:

1. Read `KNACK_APP_ID` / `KNACK_API_KEY` from env.
2. Acquire Postgres advisory lock (`pg_try_advisory_lock`) for a constant id. If held, return `{ status: 'skipped' }`.
3. Fetch `object_5/records` with filters:
   - `field_460 (complete) is "No"`
   - `field_517 (runArtReady) is "Yes"`
   - `field_516 (runMaterialReady) is "Yes"`
   - Paginate (1000/page).
4. For each record:
   - Compute `station_key = mapRoutingStepToStation(field_43)`. If `null`, skip + increment `hiddenSkipped`.
   - Parse `field_1706` for `received`/`produced`/`needed`. Fallback for `produced`/`needed`.
   - Parse `field_1707` for `customer`/`item_name`.
   - Coerce Yes/No and numeric strings.
5. In a single transaction: `DELETE FROM knack_routings_snapshot` then bulk `INSERT`. UI never sees an empty table mid-sync.
6. Stamp `knack_sync_runs` (or analogous) with `kind = 'floor_routings'`, `syncedAt`, counts, status.
7. Release advisory lock (auto-released on transaction end).

Error handling: wrap in try/catch; on failure log to `knack_sync_runs` with `status = 'error'`, `error_message`; leave previous snapshot intact. One retry on Knack 429 with linear backoff in `knackFetch`.

## Refresh triggers

- **Vercel Cron** entry in `vercel.json` calling a `/api/floor/sync` route, every 1 minute (Vercel's floor).
- **On-demand page-load trigger.** When `/floor` server component runs, if `last syncedAt > 30s ago`, fire `syncFloorRoutings()` server-side (don't await; render current snapshot now, sync in the background). Avoids waiting for the next cron tick when a supervisor opens the page at shift start.

## UI behavior changes

### Status pill semantics

- Snapshot has matching active routings for the tile → `RUNNING` (green).
- Snapshot has none → `IDLE` (neutral).
- `setup` / `down` are removed from automatic derivation. The enum values stay in `floor-types.ts` for Phase 3.

### Shared CAD queue

Both CAD 1 and CAD 2 tiles read `station_key = 'cad'`. Both show the same top-priority routing. The only visual difference is the operator chip on each tile. Expand modal on either CAD tile shows the same queue. Subtitle on each: `"CAD queue · N jobs"`.

Same pattern available for any other shared queue we add later.

### Sheets-received bar (expand modal)

New secondary bar under the existing primary `sheets_produced / sheets_needed` bar:

```
Produced  ███████████████░░  4,820 / 5,000 — 96%
Received  ███████████████░░  4,500 / 5,000 — material short
```

Red when `received < needed`. Hidden when `received` is null.

### Empty / stale handling

- Snapshot empty (initial deploy before first sync): each tile shows `IDLE`; TV header shows "Awaiting first sync…".
- Sync dot in header: green within 90s of last successful sync; amber 90s–5 min; red after 5 min. Tooltip shows last error if any.

### `/floor/setup` additions

- **Last sync** read-only line on the Stations tab: `Last sync · 32s ago · 47 routings · 3 skipped (hidden)`.
- **Sync now** button — supervisor-only — that calls `syncFloorRoutings()` directly and shows a toast with the result.

### Pages unaffected

`/floor/handoff` and `/floor/history` are pure hub reads. No changes.

## Security & limits

- Knack secrets stay server-only.
- Manual "Sync now" gated to supervisors (same gate as existing modal quick actions).
- Advisory lock prevents concurrent syncs.
- Single retry-with-backoff on Knack 429.

## Testing

- **Unit (vitest).** `mapRoutingStepToStation` (16 known + unknown), `parseQtyRollup` (8+ shapes including empty / malformed / HTML noise / comma numbers / partial), `parseCustomerAndItem` (5 shapes), `yesNoToBool`, `parseKnackInt`.
- **Integration (vitest with `vi.mock('@/db', ...)` pattern).** `syncFloorRoutings` — mock `knackFetch` with fixed payload (running, complete, hidden-step, malformed rollup); assert correct inserts, hiddenSkipped count, sync-run stamp.
- **Integration — request shape.** Mock `fetch` to verify the URL/filters Knack receives.
- **No live E2E.** Manual post-merge verification: deploy, click Sync now, eyeball snapshot in Supabase against a known routing in Knack.
- **Existing `floor.spec.ts`** keeps the mock path via a test-only export, or pre-seeds the snapshot table directly (decided in plan).

## Phasing summary

- **Phase 1 (shipped):** UI + hub data + Knack mock.
- **Phase 2 (this doc):** Knack snapshot, sync, UI lights up.
- **Phase 3 (future):** Operator-driven events from Knack; per-physical-machine routing assignment; usage-based PM; webhook push.

## Open decisions deferred to plan

- Should `knack_sync_runs` reuse the existing scorecard-sync log table with a `kind` discriminator, or be its own table? (Lean: reuse + add `kind` column.)
- Exact format of the Vercel cron endpoint URL and authentication (likely a `CRON_SECRET` header).
- How `floor.spec.ts` interacts with the snapshot — mock-mode flag vs pre-seeded table.
