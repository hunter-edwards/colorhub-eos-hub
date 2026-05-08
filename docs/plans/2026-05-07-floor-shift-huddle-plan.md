# Floor / Shift Huddle Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship Phase 1 of the Floor / Shift Huddle Dashboard — a TV-optimized live dashboard at `/floor` plus setup, handoff, and history pages — with all UI working end-to-end against hub-stored data and a mocked Knack mapping layer. Knack wiring (Phase 2) is deferred.

**Architecture:** Next.js 16 App Router. New route group at `src/app/(app)/floor/`. New Drizzle tables for stations, shift sessions, assignments, events, PM, task pool. Pure helpers in `src/lib/floor-*.ts` (TDD). Server-side data access in `src/server/floor-*.ts`. Knack mocks behind a single mapping layer in `src/server/floor-knack.ts` so the UI never touches Knack directly. Forced dark theme + bespoke `floor-*` type scale only on `/floor`; `/floor/setup`, `/floor/handoff`, `/floor/history` use the normal app shell.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM + Postgres (Supabase), Supabase Auth, Tailwind v4, shadcn/Radix UI, @dnd-kit, vitest + RTL, Playwright.

**Reference docs:**
- Design: `docs/plans/2026-05-07-floor-shift-huddle-design.md` — read first.
- AGENTS.md note: this version of Next.js has breaking changes — read `node_modules/next/dist/docs/` for any unfamiliar API before writing code.
- Existing patterns to mirror: `src/db/schema.ts` (Drizzle conventions), `src/server/scorecard.ts` (server action shape), `src/app/(app)/scorecard/page.tsx` (server component + client island pattern), `src/lib/scorecard-utils.ts` + `*.test.ts` (pure helpers + vitest).
- Knack: `src/lib/knack.ts`, `src/server/knack-sync.ts` — the patterns we'll later mirror; Phase 1 only mocks.

**Conventions enforced throughout:**
- TDD for every pure helper and every server function. Failing test first, watch it fail, minimal impl, watch it pass, commit.
- Bite-sized commits — one task per commit unless the task explicitly says otherwise.
- Drizzle: `snake_case` SQL columns, `camelCase` TS field names. Reuse `teams` / `users` for tenancy/auth.
- Never write to Knack. Never read Knack outside `src/server/floor-knack.ts`.
- Never put TV-scale styles on non-`/floor` routes.

---

## Phase 1.0 — Foundation (DB + helpers)

### Task 1: Drizzle schema for Floor tables

**Files:**
- Modify: `src/db/schema.ts` (append to end)
- Create: `drizzle/0009_floor.sql` (generated)

**Step 1: Add schema definitions**

Append the following pgTable + pgEnum exports to `src/db/schema.ts`:

```ts
// ----- FLOOR -----
export const stationKind = pgEnum('station_kind',
  ['printer', 'cad', 'rotary', 'gluer', 'handwork', 'shipping']);

export const stations = pgTable('stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  name: text('name').notNull(),
  kind: stationKind('kind').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  groupLabel: text('group_label'),
  knackMachineCenterId: text('knack_machine_center_id'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stationDefaultOperators = pgTable('station_default_operators', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id').references(() => stations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  priority: integer('priority').notNull().default(0),
}, (t) => [unique().on(t.stationId, t.userId)]);

export const shiftSessions = pgTable('shift_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  date: date('date').notNull(),
  shiftNumber: integer('shift_number').notNull(), // 1 or 2
  openedBy: uuid('opened_by').references(() => users.id),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  handoffNotes: text('handoff_notes'),
}, (t) => [unique().on(t.teamId, t.date, t.shiftNumber)]);

export const shiftAssignments = pgTable('shift_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  shiftSessionId: uuid('shift_session_id').references(() => shiftSessions.id, { onDelete: 'cascade' }).notNull(),
  stationId: uuid('station_id').references(() => stations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [unique().on(t.shiftSessionId, t.stationId, t.userId)]);

export const shiftEventKind = pgEnum('shift_event_kind', [
  'job_started', 'job_paused', 'job_resumed', 'job_completed',
  'pm_performed', 'issue_noted', 'waste_logged', 'task_completed',
  'operator_moved', 'note',
]);

export const shiftEvents = pgTable('shift_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shiftSessionId: uuid('shift_session_id').references(() => shiftSessions.id, { onDelete: 'cascade' }).notNull(),
  stationId: uuid('station_id').references(() => stations.id, { onDelete: 'set null' }),
  kind: shiftEventKind('kind').notNull(),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  recordedBy: uuid('recorded_by').references(() => users.id),
  relatedKnackJobId: text('related_knack_job_id'),
});

export const pmSchedules = pgTable('pm_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id').references(() => stations.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  cadenceDays: integer('cadence_days').notNull(),
  lastDoneAt: date('last_done_at'),
});

export const taskPoolStatus = pgEnum('task_pool_status', ['open', 'in_progress', 'done', 'archived']);
export const taskPoolSource = pgEnum('task_pool_source', ['hub', 'eos_todo']);

export const taskPool = pgTable('task_pool', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  title: text('title').notNull(),
  estMinutes: integer('est_minutes'),
  suggestedStationId: uuid('suggested_station_id').references(() => stations.id, { onDelete: 'set null' }),
  status: taskPoolStatus('status').notNull().default('open'),
  source: taskPoolSource('source').notNull().default('hub'),
  sourceTodoId: uuid('source_todo_id').references(() => todos.id, { onDelete: 'set null' }),
  assignedShiftSessionId: uuid('assigned_shift_session_id').references(() => shiftSessions.id, { onDelete: 'set null' }),
  assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});
```

**Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: a new `drizzle/0009_*.sql` file is created. Inspect it — confirm it CREATEs the tables and enums above and nothing destructive.

**Step 3: Apply migration locally**

Run: `npm run db:migrate`
Expected: applied without error.

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/0009_*.sql
git commit -m "feat(floor): add Drizzle schema for stations, shifts, events, PM, task pool"
```

---

### Task 2: Shift-session resolver helper (TDD)

**Files:**
- Create: `src/lib/floor-shift-utils.ts`
- Create: `src/lib/floor-shift-utils.test.ts`

**Step 1: Failing tests**

```ts
// src/lib/floor-shift-utils.test.ts
import { describe, it, expect } from 'vitest';
import { resolveShift, isInHuddleWindow } from './floor-shift-utils';

describe('resolveShift', () => {
  it('returns shift 1 for 07:00–15:00', () => {
    expect(resolveShift(new Date('2026-05-07T07:00:00-05:00'))).toMatchObject({ shiftNumber: 1, date: '2026-05-07' });
    expect(resolveShift(new Date('2026-05-07T14:59:00-05:00')).shiftNumber).toBe(1);
  });
  it('returns shift 2 for 15:00–23:00', () => {
    expect(resolveShift(new Date('2026-05-07T15:00:00-05:00')).shiftNumber).toBe(2);
    expect(resolveShift(new Date('2026-05-07T22:59:00-05:00')).shiftNumber).toBe(2);
  });
  it('returns null off-hours', () => {
    expect(resolveShift(new Date('2026-05-07T05:00:00-05:00'))).toBeNull();
    expect(resolveShift(new Date('2026-05-07T23:30:00-05:00'))).toBeNull();
  });
});

describe('isInHuddleWindow', () => {
  it('true within ±10min of 07:00 and 15:00', () => {
    expect(isInHuddleWindow(new Date('2026-05-07T06:55:00-05:00'))).toBe(true);
    expect(isInHuddleWindow(new Date('2026-05-07T15:05:00-05:00'))).toBe(true);
  });
  it('false in the middle of a shift', () => {
    expect(isInHuddleWindow(new Date('2026-05-07T11:00:00-05:00'))).toBe(false);
  });
});
```

Run: `npx vitest run src/lib/floor-shift-utils.test.ts`
Expected: FAIL — module not found.

**Step 2: Implement minimal**

Use the project's local timezone. Pull tz from a constant `FLOOR_TZ = 'America/Chicago'` (Colorhub is in Tulsa — confirm if different). Implementations must format the date in that tz; recommend `Intl.DateTimeFormat` with `timeZone`.

Implement `resolveShift(now)` returning `{ shiftNumber: 1|2, date: 'YYYY-MM-DD' } | null`.
Implement `isInHuddleWindow(now, minutes = 10)` returning boolean for ±10min around 07:00, 15:00, 23:00.

**Step 3:** Re-run tests until green.

**Step 4: Commit**

```bash
git add src/lib/floor-shift-utils.ts src/lib/floor-shift-utils.test.ts
git commit -m "feat(floor): add shift-session resolver + huddle window helpers"
```

---

### Task 3: PM status calculator (TDD)

**Files:**
- Create: `src/lib/floor-pm-utils.ts`
- Create: `src/lib/floor-pm-utils.test.ts`

**Step 1: Failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { pmStatus } from './floor-pm-utils';

describe('pmStatus', () => {
  const today = new Date('2026-05-07');
  it('green when next due > 7 days out', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: '2026-05-01' }, today).level).toBe('green');
  });
  it('yellow when due within 7 days', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: '2026-04-15' }, today).level).toBe('yellow');
  });
  it('red when overdue', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: '2026-04-01' }, today).level).toBe('red');
  });
  it('red when never done', () => {
    expect(pmStatus({ cadenceDays: 30, lastDoneAt: null }, today).level).toBe('red');
  });
});
```

Run: `npx vitest run src/lib/floor-pm-utils.test.ts` — expect FAIL.

**Step 2: Implement minimal `pmStatus`**

Returns `{ level: 'green'|'yellow'|'red', nextDueAt: string|null, daysUntilDue: number|null }`. Yellow = 0..7 days; red = < 0.

**Step 3:** Re-run tests until green.

**Step 4: Commit**

```bash
git add src/lib/floor-pm-utils.ts src/lib/floor-pm-utils.test.ts
git commit -m "feat(floor): add PM status calculator"
```

---

### Task 4: Sheets / waste / over-run math (TDD)

**Files:**
- Create: `src/lib/floor-progress-utils.ts`
- Create: `src/lib/floor-progress-utils.test.ts`

**Step 1: Failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { progress } from './floor-progress-utils';

describe('progress', () => {
  it('computes pct under 100', () => {
    expect(progress({ completed: 4820, needed: 5000 }).pct).toBeCloseTo(96.4, 1);
    expect(progress({ completed: 4820, needed: 5000 }).overBy).toBe(0);
    expect(progress({ completed: 4820, needed: 5000 }).isOver).toBe(false);
  });
  it('handles over-run', () => {
    expect(progress({ completed: 5402, needed: 5000 }).pct).toBeCloseTo(108.04, 1);
    expect(progress({ completed: 5402, needed: 5000 }).overBy).toBe(402);
    expect(progress({ completed: 5402, needed: 5000 }).isOver).toBe(true);
  });
  it('handles 0 needed safely', () => {
    expect(progress({ completed: 100, needed: 0 }).pct).toBe(0);
  });
  it('handles missing fields', () => {
    expect(progress({ completed: null, needed: 5000 }).pct).toBe(0);
  });
});
```

**Step 2:** Implement `progress`. Return `{ pct, overBy, isOver, completed, needed }`.

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/lib/floor-progress-utils.ts src/lib/floor-progress-utils.test.ts
git commit -m "feat(floor): add sheet progress / over-run helper"
```

---

### Task 5: Event-feed grouping helper (TDD)

**Files:**
- Create: `src/lib/floor-events-utils.ts`
- Create: `src/lib/floor-events-utils.test.ts`

**Step 1: Failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { groupEventsByStation, summarizeEvent } from './floor-events-utils';

describe('groupEventsByStation', () => {
  it('groups by stationId, preserving chrono order', () => {
    const evs = [
      { id: '1', stationId: 'a', kind: 'job_started', occurredAt: new Date('2026-05-07T07:05Z'), payload: {} },
      { id: '2', stationId: 'b', kind: 'job_started', occurredAt: new Date('2026-05-07T07:10Z'), payload: {} },
      { id: '3', stationId: 'a', kind: 'job_completed', occurredAt: new Date('2026-05-07T09:00Z'), payload: {} },
    ];
    const grouped = groupEventsByStation(evs as any);
    expect(grouped.get('a')).toHaveLength(2);
    expect(grouped.get('b')).toHaveLength(1);
  });
});

describe('summarizeEvent', () => {
  it('formats a job_paused with reason', () => {
    expect(summarizeEvent({ kind: 'job_paused', payload: { reason: 'material', note: 'waiting on stock' } } as any))
      .toBe('Paused — material (waiting on stock)');
  });
  it('formats job_completed with sheets', () => {
    expect(summarizeEvent({ kind: 'job_completed', payload: { sheets: 5000 } } as any))
      .toBe('Completed — 5,000 sheets');
  });
});
```

**Step 2:** Implement; cover all 10 event kinds with reasonable summaries.

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/lib/floor-events-utils.ts src/lib/floor-events-utils.test.ts
git commit -m "feat(floor): add event grouping + summary helpers"
```

---

## Phase 1.1 — Knack mapping layer (mocked)

### Task 6: Floor view-model types

**Files:**
- Create: `src/lib/floor-types.ts`

**Step 1:** Define the shapes the UI will consume from `floor-knack`:

```ts
export type StationId = string;
export type FloorJob = {
  id: string;            // knack record id (or mock)
  jobNumber: string;
  customer: string;
  lineItem: string;
  sheetsNeeded: number;
  sheetsCompleted: number;
  sheetsReceived: number;
  wasteSheets: number;
  routingComplete: boolean;
  dueDate: string | null;
  issueNotes: string[];
};
export type FloorStationView = {
  stationId: StationId;
  status: 'running' | 'setup' | 'down' | 'idle';
  current: FloorJob | null;
  queue: FloorJob[];
};
```

**Step 2:** No tests for types alone.

**Step 3: Commit**

```bash
git add src/lib/floor-types.ts
git commit -m "feat(floor): add view-model types for Knack-sourced station data"
```

---

### Task 7: Mocked Knack mapping layer

**Files:**
- Create: `src/server/floor-knack.ts`
- Create: `src/server/floor-knack.test.ts`

**Step 1: Failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { getFloorView } from './floor-knack';

describe('getFloorView (mock)', () => {
  it('returns one entry per station id passed in', async () => {
    const view = await getFloorView(['s1', 's2', 's3']);
    expect(view).toHaveLength(3);
    expect(view.every(v => v.current === null || typeof v.current.jobNumber === 'string')).toBe(true);
  });
  it('produces deterministic mock data per stationId', async () => {
    const a = await getFloorView(['s1']);
    const b = await getFloorView(['s1']);
    expect(a).toEqual(b);
  });
});
```

**Step 2:** Implement `getFloorView(stationIds: StationId[]): Promise<FloorStationView[]>` returning deterministic mocked data (seed off the stationId hash). Comment at top of file: `// PHASE 1: returns mocks. PHASE 2: replace with real Knack queries; do not change return shape.`

Add a TODO list of fields to find in Knack (mirror the design doc's list).

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/server/floor-knack.ts src/server/floor-knack.test.ts
git commit -m "feat(floor): add mocked Knack mapping layer (Phase 1 stub)"
```

---

## Phase 1.2 — Hub data layer

### Task 8: Stations server functions

**Files:**
- Create: `src/server/floor-stations.ts`
- Create: `src/server/floor-stations.test.ts`

**Step 1:** Tests for `listStations`, `createStation`, `updateStation`, `archiveStation`, `setDefaultOperators(stationId, userIds[])`. Use a transaction-rollback pattern if the project has one (check `src/server/scorecard.test.ts` for example); otherwise, mock the db calls.

**Step 2:** Implement minimally. Sort by `displayOrder`, then `name`. Exclude archived from `listStations` by default; provide `includeArchived: true` option.

**Step 3: Seed default stations**

Add a helper `seedDefaultStations()` that, if `stations` is empty for the team, inserts the 8 stations in order:

```
1 Press 1 (printer)        2 Press 2 (printer)
3 CAD 1 (cad)              4 CAD 2 (cad)
5 Rotary (rotary)          6 Gluer/Tape (gluer)
7 Handwork (handwork)      8 Shipping (shipping)
```

Group labels: Printing / Printing / Cutting / Cutting / Cutting / Finishing / Finishing / Shipping.

**Step 4:** Re-run tests until green.

**Step 5: Commit**

```bash
git add src/server/floor-stations.ts src/server/floor-stations.test.ts
git commit -m "feat(floor): add stations server functions + default seed"
```

---

### Task 9: Shift session + assignments server functions

**Files:**
- Create: `src/server/floor-shifts.ts`
- Create: `src/server/floor-shifts.test.ts`

**Step 1:** Tests:
- `getOrOpenCurrentShift(now, userId)` creates a session if one doesn't exist for `(date, shiftNumber)`, returns existing if it does.
- `getOrOpenCurrentShift` outside a shift window returns `null`.
- `listAssignments(shiftSessionId)` returns one row per (station, user) tuple.
- `setAssignment(shiftSessionId, stationId, userId)` upserts.
- `removeAssignment(shiftSessionId, stationId, userId)` removes.
- On first call for a new session, default operators are auto-seeded into assignments.

**Step 2:** Implement. Use `resolveShift` from Task 2.

**Step 3:** Re-run tests until green.

**Step 4: Commit**

```bash
git add src/server/floor-shifts.ts src/server/floor-shifts.test.ts
git commit -m "feat(floor): add shift session + assignment server functions"
```

---

### Task 10: Shift events server functions

**Files:**
- Create: `src/server/floor-events.ts`
- Create: `src/server/floor-events.test.ts`

**Step 1:** Tests:
- `recordEvent({ shiftSessionId, stationId, kind, payload, recordedBy })` inserts and returns the row.
- `listEventsForShift(shiftSessionId)` returns events newest-first.
- `listEventsForShift` accepts `{ limit, since }` options.

**Step 2:** Implement.

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/server/floor-events.ts src/server/floor-events.test.ts
git commit -m "feat(floor): add shift events server functions"
```

---

### Task 11: PM schedule server functions

**Files:**
- Create: `src/server/floor-pm.ts`
- Create: `src/server/floor-pm.test.ts`

**Step 1:** Tests:
- `listPmStatuses(stationIds[], now)` returns `{ stationId, level, daysUntilDue, nextDueAt }[]` using `pmStatus` helper.
- `markPmDone(stationId, userId, shiftSessionId, now)` updates `lastDoneAt` and writes a `pm_performed` event.

**Step 2:** Implement.

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/server/floor-pm.ts src/server/floor-pm.test.ts
git commit -m "feat(floor): add PM status + mark-done server functions"
```

---

### Task 12: Task pool server functions

**Files:**
- Create: `src/server/floor-tasks.ts`
- Create: `src/server/floor-tasks.test.ts`

**Step 1:** Tests:
- `listTasks({ statuses })` filters and orders by `createdAt` desc.
- `createTask({ title, estMinutes, suggestedStationId })` returns row, source defaults to `hub`.
- `importFromTodo(todoId)` creates a task with `source='eos_todo'` and `sourceTodoId` set; copies title.
- `markTask(taskId, status)` updates and stamps `completedAt` when `done`.
- `assignTask(taskId, shiftSessionId, userId)` writes assignment fields and emits a `task_completed` event when status flips to done.

**Step 2:** Implement.

**Step 3:** Re-run until green.

**Step 4: Commit**

```bash
git add src/server/floor-tasks.ts src/server/floor-tasks.test.ts
git commit -m "feat(floor): add task pool server functions + EOS todo import"
```

---

## Phase 1.3 — Routing, nav, type scale

### Task 13: Add 'Floor' section to AppNav

**Files:**
- Modify: `src/components/app-nav.tsx`

**Step 1:** In the `sections` array, after the `People` section and before `Meetings`, insert:

```ts
{
  label: 'Floor',
  items: [
    { href: '/floor', label: 'Live Huddle', icon: Activity },
    { href: '/floor/handoff', label: 'Handoff', icon: ClipboardList },
    { href: '/floor/history', label: 'History', icon: History },
    { href: '/floor/setup', label: 'Setup', icon: Wrench },
  ],
},
```

Import the new icons from `lucide-react` (note `History` is already imported). Pick icons from the existing icon import — adjust if any name conflicts.

**Step 2:** Manual sanity: `npm run dev`, navigate to `/floor` (will 404 until Task 14). Confirm the new nav section renders.

**Step 3: Commit**

```bash
git add src/components/app-nav.tsx
git commit -m "feat(floor): add Floor section to app nav"
```

---

### Task 14: `/floor` route group + dark-themed layout

**Files:**
- Create: `src/app/(app)/floor/layout.tsx`
- Create: `src/app/(app)/floor/page.tsx` (placeholder — replaced in Task 22)
- Create: `src/app/(app)/floor/setup/page.tsx` (placeholder)
- Create: `src/app/(app)/floor/handoff/page.tsx` (placeholder)
- Create: `src/app/(app)/floor/history/page.tsx` (placeholder)

**Step 1:** Layout forces dark theme on `/floor` (live page only — not the sub-pages). Use `next-themes`. Read `node_modules/next/dist/docs/02-app/01-building-your-application/01-routing/03-layouts-and-templates.mdx` if any layout API differs from your training data.

`/floor/layout.tsx`:

```tsx
export default function FloorLayout({ children }: { children: React.ReactNode }) {
  return <div className="floor-root">{children}</div>;
}
```

The "force dark" applies only to the live dashboard, so put the dark-forcing class on the `/floor/page.tsx` root element instead of the layout (so setup/handoff/history pages stay user-themed). Add a `data-floor-tv="true"` attribute on the live page's outermost div for CSS targeting.

**Step 2:** Each placeholder page returns `<h1>Floor — <name></h1>`. Confirm all four URLs render in `npm run dev`.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): scaffold /floor route group + page placeholders"
```

---

### Task 15: Floor TV type scale

**Files:**
- Modify: `src/app/globals.css` (add a `@layer utilities` or theme variables block scoped to `[data-floor-tv]`)

**Step 1:** Add CSS:

```css
[data-floor-tv] {
  /* Locked dark + custom type scale; only applied when present */
  color-scheme: dark;
  --floor-fg: oklch(0.98 0 0);
  --floor-bg: oklch(0.16 0 0);
  --floor-card: oklch(0.21 0 0);
  --floor-muted: oklch(0.65 0 0);

  background: var(--floor-bg);
  color: var(--floor-fg);
}
[data-floor-tv] .floor-display { font-size: clamp(48px, 5vw, 80px); font-weight: 700; line-height: 1; }
[data-floor-tv] .floor-title   { font-size: clamp(28px, 2.4vw, 40px); font-weight: 600; }
[data-floor-tv] .floor-body    { font-size: clamp(18px, 1.4vw, 24px); }
[data-floor-tv] .floor-chip    { font-size: clamp(16px, 1.2vw, 20px); }
[data-floor-tv] .floor-header  { font-size: clamp(20px, 1.5vw, 28px); }
```

**Step 2:** No test — visual.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(floor): add TV-scaled type utilities scoped to [data-floor-tv]"
```

---

## Phase 1.4 — Floor Setup pages

### Task 16: `/floor/setup` shell with tabs

**Files:**
- Modify: `src/app/(app)/floor/setup/page.tsx`
- Create: `src/app/(app)/floor/setup/stations-tab.tsx` (placeholder)
- Create: `src/app/(app)/floor/setup/tasks-tab.tsx` (placeholder)
- Create: `src/app/(app)/floor/setup/shift-tab.tsx` (placeholder)

**Step 1:** Use `Tabs` from shadcn (check `components.json` to confirm it's installed; install via `npx shadcn@latest add tabs` if not). Three tabs: Stations / Task Pool / Shift Settings. Default to Stations.

**Step 2:** Render placeholders.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/setup
git commit -m "feat(floor): add /floor/setup shell with three tabs"
```

---

### Task 17: Stations tab — list + edit + reorder

**Files:**
- Modify: `src/app/(app)/floor/setup/stations-tab.tsx`
- Create: `src/app/(app)/floor/setup/stations-tab-actions.ts` (server actions)

**Step 1: Tests** (server actions only)

In `src/server/floor-stations.test.ts` (existing) add coverage for `updateStation` reordering and `archiveStation` if not already present.

**Step 2: UI**

- Table of stations (Name, Kind, Group, Default operators, Order, Archive).
- Inline edit name + group label.
- Up/Down arrows to reorder (or @dnd-kit if installed — it is).
- Add station form at the bottom.
- "Reset to defaults" button when stations is empty (calls `seedDefaultStations`).

Use server actions in `stations-tab-actions.ts` per the existing pattern (inspect `src/app/(app)/scorecard/grid.tsx` and friends).

**Step 3: Manual check** — `/floor/setup`, Stations tab, do CRUD.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor/setup
git commit -m "feat(floor): stations tab — list, edit, reorder, archive"
```

---

### Task 18: Default operators per station

**Files:**
- Modify: `src/app/(app)/floor/setup/stations-tab.tsx`

**Step 1:** Inside each station row, add a multi-select for default operators (pull users via `listTeamMembers` from `src/server/rocks.ts`). Save calls `setDefaultOperators`.

**Step 2:** Manual check.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/setup/stations-tab.tsx
git commit -m "feat(floor): default operator multi-select per station"
```

---

### Task 19: PM cadence per station

**Files:**
- Modify: `src/app/(app)/floor/setup/stations-tab.tsx`
- Create: `src/server/floor-pm-schedules.ts` (CRUD for `pm_schedules`)
- Create: `src/server/floor-pm-schedules.test.ts`

**Step 1: Tests** for CRUD + listing for a station.

**Step 2:** Per station row, an "Edit PM" link opens a small panel: list of PM schedules (label, cadenceDays, lastDoneAt). Add/edit/delete inline.

**Step 3: Commit**

```bash
git add src/server/floor-pm-schedules.ts src/server/floor-pm-schedules.test.ts src/app/\(app\)/floor/setup/stations-tab.tsx
git commit -m "feat(floor): PM cadence editor per station"
```

---

### Task 20: Task pool tab

**Files:**
- Modify: `src/app/(app)/floor/setup/tasks-tab.tsx`

**Step 1:** Table of tasks with CRUD: title, est. minutes, suggested station, status, archive. Status filter chips: Open / In progress / Done / Archived.

**Step 2:** Manual check.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/setup/tasks-tab.tsx
git commit -m "feat(floor): task pool admin tab"
```

---

### Task 21: Shift settings tab

**Files:**
- Modify: `src/app/(app)/floor/setup/shift-tab.tsx`

**Step 1:** Read-only display of shift windows (1st: 07:00–15:00, 2nd: 15:00–23:00) + huddle window minutes (10). Note: editing requires schema change; mark "edit coming Phase 2."

**Step 2:** Commit.

```bash
git add src/app/\(app\)/floor/setup/shift-tab.tsx
git commit -m "feat(floor): shift settings tab (read-only Phase 1)"
```

---

## Phase 1.5 — Live dashboard

### Task 22: `/floor` server data layer

**Files:**
- Modify: `src/app/(app)/floor/page.tsx`
- Create: `src/app/(app)/floor/floor-board.tsx` (client component)

**Step 1: Server component — `page.tsx`**

```tsx
export default async function FloorPage() {
  const now = new Date();
  const shift = resolveShift(now);
  // 1. ensure session
  // 2. listStations
  // 3. listAssignments(session.id) (or empty if no shift)
  // 4. getFloorView(stationIds)  ← MOCK
  // 5. listEventsForShift(session.id)
  // 6. listPmStatuses(stationIds, now)
  // 7. listTasks({ statuses: ['open','in_progress'] })
  // 8. handoff banner from previous shift session
  return <FloorBoard initial={...} />;
}
```

Pass everything to `<FloorBoard initial={...} />`. Add `<div data-floor-tv="true" className="...">` as outermost element.

**Step 2:** `<FloorBoard>` is a client component skeleton — header bar, stations grid, bottom strip — all empty for now.

**Step 3:** `npm run dev`; navigate to `/floor`; confirm dark theme + scaffolding visible.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): /floor server data fetch + client board scaffold"
```

---

### Task 23: TV header bar component

**Files:**
- Create: `src/app/(app)/floor/components/tv-header.tsx`

**Step 1:** Renders left/center/right per design (shift name + clock; status pill + Huddle/Run toggle; counters). Counters are buttons that call `onCounterClick(panel: 'people'|'pm'|'issues'|'tasks')` — wire to scroll/highlight in Task 31.

Keep the mode-toggle state lifted in `FloorBoard`.

**Step 2:** Component test: renders all three regions; counters call the click handler.

**Step 3:** Commit:

```bash
git add src/app/\(app\)/floor/components/tv-header.tsx
git commit -m "feat(floor): TV header bar with shift, status, counters"
```

---

### Task 24: Station tile component (TDD)

**Files:**
- Create: `src/app/(app)/floor/components/station-tile.tsx`
- Create: `src/app/(app)/floor/components/station-tile.test.tsx`

**Step 1: Failing component tests**

```tsx
// renders RUNNING tile with job number, customer, % bar, operator names
// renders IDLE tile with no job
// shows over-run % in distinct color
// shows PM badge red when overdue
// click → calls onExpand(stationId)
```

**Step 2:** Implement using `progress` and `pmStatus` helpers. Use Tailwind + `floor-display`/`floor-title` classes. Status pill colors per design.

**Step 3:** Re-run tests until green.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor/components/station-tile*
git commit -m "feat(floor): station tile component"
```

---

### Task 25: Stations grid layout

**Files:**
- Modify: `src/app/(app)/floor/floor-board.tsx`
- Create: `src/app/(app)/floor/components/stations-grid.tsx`

**Step 1:** 4×2 CSS grid; renders 8 `<StationTile>`s in `displayOrder`. Container fills upper ~70% of viewport; tiles are equal size with min-height that scales to viewport.

**Step 2:** Visual sanity in `npm run dev`.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): stations grid layout"
```

---

### Task 26: People bench panel (read-only)

**Files:**
- Create: `src/app/(app)/floor/components/people-bench.tsx`

**Step 1:** Renders chips for users on shift (initially: union of users in any default-operator row + users with a current shift assignment). Each chip shows name + assigned station label, or "unassigned." Sort: unassigned first, then by station displayOrder.

**Step 2:** Component test: chip count, sort order.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/components/people-bench.tsx
git commit -m "feat(floor): people bench panel (read-only)"
```

---

### Task 27: People bench drag-to-assign

**Files:**
- Modify: `src/app/(app)/floor/components/people-bench.tsx`
- Modify: `src/app/(app)/floor/components/stations-grid.tsx`
- Create: `src/app/(app)/floor/floor-board-actions.ts` (server actions: assign / unassign)

**Step 1:** Add @dnd-kit dnd context wrapping bench + grid. Drag chip onto a station tile → calls `setAssignment` server action; optimistic UI update; emits `operator_moved` event via `recordEvent`.

**Step 2:** Tap-to-pick fallback: clicking a chip opens a popover with "Move to..." list of stations.

**Step 3:** Component test: drag end calls action with correct args.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): drag-to-assign people bench"
```

---

### Task 28: Tasks pool panel

**Files:**
- Create: `src/app/(app)/floor/components/tasks-panel.tsx`

**Step 1:** List of `taskPool` items where `status in (open, in_progress)`. Each card: title, est. minutes, suggested station tag, action menu (Mark in progress / Mark done / Archive). Top-right `+` opens a small create form (title, est. minutes, suggested station). Calls `createTask` action.

**Step 2:** Component test: marks task done → calls `markTask` with `done`.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/components/tasks-panel.tsx
git commit -m "feat(floor): tasks pool panel with inline CRUD"
```

---

### Task 29: EOS to-do importer (in tasks panel)

**Files:**
- Modify: `src/app/(app)/floor/components/tasks-panel.tsx`
- Create: `src/server/floor-tasks-import.ts` (server action wrapping `importFromTodo`)

**Step 1:** Add a "Import from EOS to-dos" link next to the `+`. Opens a modal that lists open EOS to-dos (use `listTodos` from existing `src/server/todos.ts` if present; otherwise inspect that server file and add a minimal `listOpenTodos`). User picks one or more → server action imports each as a hub task.

**Step 2:** Component test for the modal flow.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/components/tasks-panel.tsx src/server/floor-tasks-import.ts
git commit -m "feat(floor): import from EOS to-dos into floor task pool"
```

---

### Task 30: Events feed panel

**Files:**
- Create: `src/app/(app)/floor/components/events-feed.tsx`

**Step 1:** Reverse-chronological list of `shiftEvents`. Each row: timestamp, station name, kind icon, summary (use `summarizeEvent`). Auto-scroll to top on new event. Pin/unpin button toggles auto-scroll.

**Step 2:** Component test: renders events sorted desc; pin disables scroll.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor/components/events-feed.tsx
git commit -m "feat(floor): live events feed panel"
```

---

### Task 31: Polling + pulse-on-new-event

**Files:**
- Create: `src/app/(app)/floor/floor-poller.ts` (client hook `useFloorPoll`)
- Modify: `src/app/(app)/floor/floor-board.tsx`

**Step 1:** Hook polls a server function `getFloorSnapshot(shiftSessionId, sinceEventId)` every 15 seconds while the page is visible. Uses Page Visibility API to pause when hidden. Returns a delta to merge.

**Step 2:** When new events arrive, the affected station tile receives a `data-pulse` attribute briefly (1 second). Tile CSS animates a subtle scale + border glow.

**Step 3:** Last-sync dot in TV header reflects last successful poll.

**Step 4:** Commit:

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): 15s polling + pulse-on-new-event"
```

---

### Task 32: Huddle/Run mode toggle

**Files:**
- Modify: `src/app/(app)/floor/floor-board.tsx`

**Step 1:** Add `mode: 'huddle'|'run'` state; default chosen by `isInHuddleWindow(now)`. Toggle in TV header. In Run mode, increase tile font sizes by 1.1× (CSS class) and shrink the bottom strip from 30% to 20% by adjusting grid template.

**Step 2:** Commit:

```bash
git add src/app/\(app\)/floor/floor-board.tsx
git commit -m "feat(floor): Huddle/Run mode toggle on /floor"
```

---

## Phase 1.6 — Station expand modal

### Task 33: Modal shell + sections

**Files:**
- Create: `src/app/(app)/floor/components/station-modal.tsx`
- Modify: `src/app/(app)/floor/floor-board.tsx` (mount modal, manage open state)

**Step 1:** Use Radix Dialog from shadcn (`Dialog` component). Click on tile → opens modal with sections per design (Now Running, Status, Operators, Up Next, PM, Issues, Quick Actions). Bottom strip dims via a `[data-modal-open]` attribute on the floor root.

**Step 2:** Render data; quick action buttons are non-functional placeholders.

**Step 3:** Component test: opens on tile click; renders all sections.

**Step 4: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): station expand modal scaffold"
```

---

### Task 34: Quick action — Start job

**Files:**
- Modify: `src/app/(app)/floor/components/station-modal.tsx`
- Create: `src/app/(app)/floor/floor-actions.ts` (consolidated server actions for the modal)

**Step 1:** `startJob(stationId, knackJobId)` records a `job_started` event with payload `{ knackJobId, jobNumber, customer }`. Wire button.

**Step 2:** Component test for the button → server action call.

**Step 3: Commit**

```bash
git add src/app/\(app\)/floor
git commit -m "feat(floor): Start job quick action"
```

---

### Task 35: Quick action — Pause + reason picker

**Files:**
- Modify: `src/app/(app)/floor/components/station-modal.tsx`

**Step 1:** Pause button opens a small picker: setup / material / mechanical / quality / break / other (+ free-text note). Submit calls `recordEvent({ kind: 'job_paused', payload: { reason, note } })`. Until a `job_resumed` is recorded, station status renders as paused (use latest event to derive — handled in `getFloorView` enrichment).

Add a tiny derivation helper `deriveStationStatus(events, stationId): 'running'|'setup'|'down'|'idle'` in `floor-events-utils.ts` (TDD).

**Step 2: Commit**

```bash
git add src/app/\(app\)/floor src/lib/floor-events-utils*
git commit -m "feat(floor): Pause + reason picker; derive station status from events"
```

---

### Task 36: Quick actions — Resume + Complete

**Files:**
- Modify: `src/app/(app)/floor/components/station-modal.tsx`

**Step 1:** Resume → `job_resumed`. Complete → `job_completed` (capture final sheets value via a small confirm dialog).

**Step 2: Commit**

```bash
git add src/app/\(app\)/floor/components/station-modal.tsx
git commit -m "feat(floor): Resume + Complete quick actions"
```

---

### Task 37: Quick actions — Log waste, Note issue, Mark PM done

**Files:**
- Modify: `src/app/(app)/floor/components/station-modal.tsx`

**Step 1:** Log waste → small form (sheets, optional reason) → `waste_logged`. Note issue → multiline text → `issue_noted`. Mark PM done → confirm + `markPmDone` (Task 11) which also writes `pm_performed`.

**Step 2: Commit**

```bash
git add src/app/\(app\)/floor/components/station-modal.tsx
git commit -m "feat(floor): Log waste / Note issue / Mark PM done"
```

---

## Phase 1.7 — Handoff & history

### Task 38: `/floor/handoff` hero + per-station summary

**Files:**
- Modify: `src/app/(app)/floor/handoff/page.tsx`
- Create: `src/server/floor-recap.ts` + test
- Create: `src/lib/floor-recap-utils.ts` + test

**Step 1: TDD recap helpers**

`computeRecap(events, stations) → { hero: {sheets, waste, jobs, pms, issues, tasks}, perStation: [{stationId, jobs, sheets, waste, downtimeMinutes, pauseReasons[]}], outstanding: {...} }`. Pure function. Test thoroughly.

**Step 2: Server function**

`getRecap({ date, shiftNumber })` loads session, events, stations, and runs `computeRecap`.

**Step 3: Page**

Server component renders hero band + per-station mini-tiles. Date/shift picker at top.

**Step 4: Commit**

```bash
git add src/lib/floor-recap-utils* src/server/floor-recap* src/app/\(app\)/floor/handoff
git commit -m "feat(floor): handoff recap — hero + per-station summary"
```

---

### Task 39: Handoff timeline + outstanding panel

**Files:**
- Modify: `src/app/(app)/floor/handoff/page.tsx`
- Create: `src/app/(app)/floor/handoff/timeline.tsx`

**Step 1:** Timeline component: events grouped by station (`groupEventsByStation`), each group collapsible.

**Step 2:** Outstanding for next shift: open issues, unfinished jobs (jobs with `job_started` but no `job_completed` in the shift), PMs still due, tasks still open. Computed in `floor-recap-utils`.

**Step 3: Commit**

```bash
git add src/lib/floor-recap-utils* src/app/\(app\)/floor/handoff
git commit -m "feat(floor): handoff timeline + outstanding panel"
```

---

### Task 40: Handoff notes editor + banner on `/floor`

**Files:**
- Modify: `src/app/(app)/floor/handoff/page.tsx`
- Modify: `src/app/(app)/floor/floor-board.tsx`
- Modify: `src/server/floor-shifts.ts` (add `setHandoffNotes(shiftSessionId, notes)`)

**Step 1:** Free-text editor saved to `shift_sessions.handoff_notes` via server action. Edit only allowed if shift `closedAt` is null OR within 1 hour after shift end (UI hint, not enforced strictly).

**Step 2:** On `/floor` (live), if the *previous* shift session has handoff notes, show a banner above the stations grid: "From last shift: <notes>" with a dismiss button (state in `localStorage` keyed by session id).

**Step 3: Commit**

```bash
git add src/server/floor-shifts.ts src/app/\(app\)/floor
git commit -m "feat(floor): handoff notes editor + carry-forward banner"
```

---

### Task 41: `/floor/history` list

**Files:**
- Modify: `src/app/(app)/floor/history/page.tsx`

**Step 1:** Server component lists past `shift_sessions` (most recent first, paginated 20/page). Each row: date, shift number, sheets total, jobs completed, link to `/floor/handoff?date=...&shift=...`.

**Step 2: Commit**

```bash
git add src/app/\(app\)/floor/history/page.tsx
git commit -m "feat(floor): /floor/history list of past shifts"
```

---

## Phase 1.8 — E2E + polish

### Task 42: Playwright E2E happy path

**Files:**
- Create: `tests/floor.spec.ts`

**Step 1:** Test:
1. Login as a supervisor seed user.
2. Set system clock (via Playwright's `page.clock.install({ time: ... })`) to 07:30 of a known date.
3. Navigate to `/floor`. Confirm header reads "1st Shift", grid renders 8 tiles, no events feed entries.
4. Click first station tile → modal opens.
5. Click `Start job` → modal closes, events feed shows `Started — <job#>`.
6. Click tile again → click `Pause` → choose `material` reason + note.
7. Click `Resume` then `Complete` (sheets = 5000).
8. Advance clock to 15:30 — `/floor` now shows 2nd Shift session.
9. Visit `/floor/handoff?date=...&shift=1` — confirm hero shows 1 job completed, 5000 sheets, etc.

**Step 2:** Run `npx playwright test floor` until green.

**Step 3: Commit**

```bash
git add tests/floor.spec.ts
git commit -m "test(floor): Playwright E2E for shift huddle happy path"
```

---

### Task 43: Polish + manual TV check

**Files:** as needed.

**Step 1:** Run `npm run lint` — fix.
**Step 2:** Run `npm run test:run` — fix.
**Step 3:** Run `npx playwright test` — fix.
**Step 4:** Run `npm run build` — fix.
**Step 5:** Manual checklist on the actual shop-floor TV (with stub data):
- Tile text legible from ~10 ft.
- 4×2 grid fills cleanly without overflow.
- Status colors readable in shop lighting.
- Modal scroll works on TV resolution.
- Events feed update animation visible but not distracting.
- People bench drag-to-assign works on the actual input device used in front of TV (touchscreen / mouse / remote).

**Step 6: Commit any TV adjustments**

```bash
git add -A
git commit -m "chore(floor): polish from lint/tests/build/TV pass"
```

**Step 7:** Open PR.

```bash
gh pr create --title "feat(floor): Phase 1 — Shift Huddle Dashboard" --body "$(cat <<'EOF'
## Summary
- New Floor section with Live Huddle (`/floor`), Handoff, History, Setup
- TV-optimized 4×2 stations grid with bottom strip (people / tasks / events)
- Shift sessions, assignments, events, PM, task pool persisted in hub DB
- Knack-sourced fields stubbed behind `src/server/floor-knack.ts` (Phase 2 wires real data)

Design: docs/plans/2026-05-07-floor-shift-huddle-design.md
Plan: docs/plans/2026-05-07-floor-shift-huddle-plan.md

## Test plan
- [ ] vitest passes
- [ ] Playwright E2E passes
- [ ] Manual TV check from ~10 ft

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done criteria for Phase 1

- All 43 tasks committed.
- `/floor`, `/floor/setup`, `/floor/handoff`, `/floor/history` all reachable from the nav.
- A live shift can be opened, events recorded, and a recap viewed without ever editing the database directly.
- Knack mocks return believable data; no Knack API calls anywhere except the (still mocked) mapping layer.
- TV check passes for legibility from across the floor.
