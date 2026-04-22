# Meeting Workflow Upgrades — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn meetings from on-the-fly creations into pre-staged, RSVP-able events with proper permissions, de-duped scorecard issues, a redesigned Teams summary, admin-side attendee and rating controls, and automatic carry-over from the previous meeting.

**Architecture:** Introduce a `meeting.status` state machine (`draft` → `live` → `concluded`) so meetings can be pre-populated before they start. On conclude, auto-create the next `draft` meeting and carry forward unfinished work (open issues, open to-dos, last cascading message). Add a `users.role` enum (`admin | leader | member`) gating start/end/attendee-edit/rate-on-behalf actions. Dedupe scorecard-red issues by checking for an existing open issue per metric. Redesign the Teams Adaptive Card with ColumnSets, colored FactSet values, and a clearer summary hierarchy.

**Tech Stack:** Next.js 16 App Router (async `proxy.ts`), React 19, Drizzle ORM v0.45 + Postgres, Supabase Auth, shadcn/ui + Base UI, Tailwind v4, Vitest, recharts, Knack REST API.

---

## Current State (as of 2026-04-21, branch `claude/dazzling-grothendieck`)

- Meetings are created with `startMeeting()` and immediately go live. No draft state.
- `meetings.attendees` is jsonb, populated as users click "Join". No RSVP/pre-attendance.
- `users` table has no role field. Every authenticated user can do everything.
- Scorecard panel in `/meeting/live` creates a new issue every time a metric cell turns red — no dedupe.
- Teams webhook posts a plain text-heavy Adaptive Card (body = `TextBlock` with the full AI summary). Works but not scannable.
- `collectMeetingContext` hardcodes `cascadingMessage: ''` — the field isn't saved anywhere.
- `toggleTodo` now sets `completedAt`; `dropIssue` now sets `droppedAt` (both shipped in PR #22).
- Changelog on meeting detail page works (PR #22, fix in PR #23).

## Feature Decisions Locked (from planning session)

| Decision | Choice |
|---|---|
| Roles | 3 roles: admin / leader / member |
| Dedupe | One open issue per metric at a time |
| Carry-over | Open issues (both lists) + open to-dos + last cascading message |
| RSVP | Ship in v1 alongside draft meetings |

---

## Phase 1 — Foundations (independent, low risk)

These can ship in any order and don't block each other.

### Task 1: Add `users.role` enum + admin seed

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/NNNN_add_user_role.sql` (auto-generated)
- Modify: `src/db/seed-team.ts` (set Tim Harris + Tyler Valentine as admin, Hunter Edwards as leader)
- Modify: `src/lib/auth.ts`
- Create: `src/lib/auth.test.ts`

**Step 1: Add enum and column to schema**

```ts
// src/db/schema.ts — near other enums
export const userRole = pgEnum('user_role', ['admin', 'leader', 'member']);

// in users pgTable definition, add:
role: userRole('role').notNull().default('member'),
```

**Step 2: Generate and apply migration**

Run: `npx drizzle-kit generate --name add_user_role`
Then: `npx drizzle-kit migrate`
Expected: new migration file in `drizzle/` and the `users.role` column exists.

Verify with:
```bash
node --env-file=.env.local -e "
const p = require('postgres');
const sql = p(process.env.DATABASE_URL, { prepare: false });
(async () => {
  const cols = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='role'\`;
  console.log(cols);
  await sql.end();
})();
"
```

**Step 3: Update seed-team.ts to assign roles**

Add a `role` key to the `TEAM_MEMBERS` array (e.g. Tim Harris = 'admin', Tyler Valentine = 'admin', Hunter Edwards = 'leader', everyone else = 'member'). When inserting into users, include `role: member.role`. Also set role for existing users via a single UPDATE at the end.

**Step 4: Write failing test for requireRole helper**

```ts
// src/lib/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { requireRole, atLeast } from './auth';

describe('atLeast', () => {
  it('admin satisfies leader', () => { expect(atLeast('admin', 'leader')).toBe(true); });
  it('leader satisfies member', () => { expect(atLeast('leader', 'member')).toBe(true); });
  it('member does NOT satisfy leader', () => { expect(atLeast('member', 'leader')).toBe(false); });
  it('leader does NOT satisfy admin', () => { expect(atLeast('leader', 'admin')).toBe(false); });
});
```

Run: `npx vitest run src/lib/auth.test.ts` → FAIL (atLeast undefined).

**Step 5: Implement the helper**

```ts
// src/lib/auth.ts — add alongside existing helpers
export type UserRole = 'admin' | 'leader' | 'member';

const RANK: Record<UserRole, number> = { member: 0, leader: 1, admin: 2 };

export function atLeast(userRole: UserRole, required: UserRole): boolean {
  return RANK[userRole] >= RANK[required];
}
```

Also add a server-side `requireRole(required: UserRole)` that calls the existing `requireUser()`, fetches the user's role from the DB, and throws if `!atLeast(userRole, required)`. Place it in `src/server/auth-helpers.ts` (new file) so it can be imported by any server action without circular imports.

**Step 6: Run tests, commit**

```bash
npx vitest run src/lib/auth.test.ts  # all 4 pass
git add -A
git commit -m "feat: add user roles (admin/leader/member) with requireRole helper"
```

---

### Task 2: Gate meeting actions behind role

**Files:**
- Modify: `src/server/meetings.ts` — `startMeeting`, `endMeeting`
- Modify: `src/server/meetings.ts` — add `addAttendee`, `removeAttendee`, `rateOnBehalf` (see Tasks 11 and 12)
- Modify: `src/app/(app)/meeting/live/panels/conclude.tsx` — hide End button for non-leaders

**Step 1: Import + use requireRole**

```ts
// src/server/meetings.ts
import { requireRole } from './auth-helpers';

export async function startMeeting(...) {
  await requireRole('leader');  // was: await requireUser()
  ...
}

export async function endMeeting(...) {
  await requireRole('leader');  // was: await requireUser()
  ...
}
```

**Step 2: Hide UI**

In the meeting live page, fetch the current user's role (or use a new `getCurrentUserRole` server action) and conditionally render the End/Start buttons. Keep rating/joining open to all members.

**Step 3: Smoke-test in dev**

Start meeting as a non-admin → expect a toast "Not authorized" or equivalent.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: gate startMeeting/endMeeting behind leader role"
```

---

### Task 3: Dedupe scorecard-red issues

**Files:**
- Modify: `src/app/(app)/meeting/live/panels/scorecard.tsx`
- Modify: `src/server/issues.ts` — add `createIssueIfNotExists`
- Create: `src/server/issues.test.ts` (if missing)

**Step 1: Write a failing test**

```ts
// src/server/issues.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// mock db; test that calling createIssueIfNotExists twice for the same
// metric only creates one row.
```

Use a simple drizzle mock OR run against a test DB if the project already has one set up (check if `DATABASE_URL_TEST` exists).

**Step 2: Implement createIssueIfNotExists**

```ts
// src/server/issues.ts
export async function createIssueIfNotExists(input: {
  title: string;
  ownerId?: string;
  list?: 'short_term' | 'long_term';
  metricId?: string;  // new: lets us dedupe by metric
}) {
  await requireUser();
  if (input.metricId) {
    const existing = await db
      .select()
      .from(issues)
      .where(
        and(
          eq(issues.status, 'open'),
          eq(issues.sourceMetricId, input.metricId)
        )
      )
      .limit(1);
    if (existing.length > 0) return existing[0];
  }
  const [created] = await db.insert(issues).values({ ...input }).returning();
  revalidatePath('/issues');
  revalidatePath('/meeting/live');
  return created;
}
```

**Step 3: Add `sourceMetricId` column to issues**

Small schema migration: `sourceMetricId: uuid('source_metric_id').references(() => scorecardMetrics.id, { onDelete: 'set null' })`.
Generate + apply migration.

**Step 4: Update scorecard panel to use new function**

Replace the `createIssue(...)` call in `src/app/(app)/meeting/live/panels/scorecard.tsx` (wherever it creates "Scorecard: X missed goal") with `createIssueIfNotExists({ ..., metricId: m.id })`.

**Step 5: Commit**

```bash
git commit -m "feat: dedupe scorecard-red issues by metric"
```

---

### Task 4: Redesigned Teams Adaptive Card

**Files:**
- Modify: `src/server/teams-webhook.ts` — `buildAdaptiveCard`
- Modify: `src/server/teams-webhook.test.ts`

**Design goals:** scannable structure, visual hierarchy, no raw markdown dumped into a single TextBlock.

**Step 1: Update the card body**

Replace the current single-TextBlock summary with structured ColumnSets and FactSets per section (Health / Scorecard reds / Rock pulse / Issues worked / Action items / Cascading message). Use `color` on TextBlocks (`good`, `warning`, `attention`, `accent`) for visual emphasis. Use horizontal rules (`type: 'Container', separator: true`) between sections.

Reference structure:

```ts
{
  type: 'Container',
  items: [
    { type: 'TextBlock', text: 'Meeting Health', weight: 'Bolder', size: 'Medium', color: 'accent' },
    {
      type: 'ColumnSet',
      columns: [
        { type: 'Column', width: 'stretch', items: [
          { type: 'TextBlock', text: 'Rating', isSubtle: true, size: 'Small' },
          { type: 'TextBlock', text: `${ctx.ratingAvg}/10`, weight: 'Bolder', size: 'Large' },
        ]},
        { type: 'Column', width: 'stretch', items: [
          { type: 'TextBlock', text: 'Attendees', isSubtle: true, size: 'Small' },
          { type: 'TextBlock', text: `${ctx.attendees.length}`, weight: 'Bolder', size: 'Large' },
        ]},
      ],
    },
  ],
},
```

For Scorecard reds, use a FactSet with red-colored values:
```ts
{
  type: 'Container',
  separator: true,
  items: [
    { type: 'TextBlock', text: 'Scorecard — Metrics in Red', weight: 'Bolder', color: 'attention' },
    {
      type: 'FactSet',
      facts: ctx.scorecardReds.map(r => ({
        title: r.metric,
        value: `${r.value} (goal ${r.goal}) — ${r.owner}`
      }))
    }
  ]
}
```

Keep the existing "View full changelog" action.

**Step 2: Update tests**

Each section presence test:
```ts
it('includes a Meeting Health section', () => {
  const card = buildAdaptiveCard(mockCtx, mockSummary);
  const s = JSON.stringify(card);
  expect(s).toContain('Meeting Health');
});
```

**Step 3: Visual-verify in Teams**

Send a test post via the existing Settings → Teams test button. Screenshot-compare. Iterate if columns look cramped on mobile.

**Step 4: Commit**

```bash
git commit -m "feat: redesign Teams summary card with scannable sections"
```

---

## Phase 2 — Draft meetings + carry-over

### Task 5: Add `meeting.status` state machine

**Files:**
- Modify: `src/db/schema.ts` — add `meetingStatus` enum and `status` column
- Migration
- Modify: `src/server/meetings.ts` — all state transitions

**Step 1: Schema**

```ts
// src/db/schema.ts
export const meetingStatus = pgEnum('meeting_status', ['draft', 'live', 'concluded']);

// in meetings table:
status: meetingStatus('status').notNull().default('draft'),
scheduledFor: timestamp('scheduled_for'),  // optional: when this meeting is expected to run
cascadingMessage: text('cascading_message'),  // from the Conclude panel (finally persisted!)
```

**Step 2: Migration**

```bash
npx drizzle-kit generate --name meeting_status
npx drizzle-kit migrate
```

Then: backfill existing rows. All existing meetings have `endedAt` set → `status = 'concluded'`. Active meetings (no endedAt) → `status = 'live'`. Run:

```sql
UPDATE meetings SET status = 'concluded' WHERE ended_at IS NOT NULL;
UPDATE meetings SET status = 'live' WHERE ended_at IS NULL;
```

**Step 3: Refactor startMeeting/endMeeting**

`startMeeting` is now split into two functions:
- `createDraftMeeting({ type, scheduledFor })` — inserts with `status: 'draft'`. Anyone with leader role.
- `activateMeeting(meetingId)` — flips `draft → live`, sets `startedAt = now()`. This is the "Play" button. Leader role.

`endMeeting` now flips `live → concluded`, sets `endedAt`, ratingAvg, triggers summary + Teams webhook (as today), and ALSO creates the next draft meeting (see Task 7).

**Step 4: Commit**

```bash
git commit -m "feat: add meeting.status state machine (draft/live/concluded)"
```

---

### Task 6: Persist cascading message

**Files:**
- Modify: `src/app/(app)/meeting/live/panels/conclude.tsx` — save on blur
- Modify: `src/server/meetings.ts` — add `setCascadingMessage(meetingId, text)`
- Modify: `src/server/ai-summary.ts` — `collectMeetingContext` reads the persisted field

**Step 1: Server action**

```ts
export async function setCascadingMessage(meetingId: string, text: string) {
  await requireRole('leader');
  await db.update(meetings).set({ cascadingMessage: text }).where(eq(meetings.id, meetingId));
  revalidatePath('/meeting/live');
}
```

**Step 2: Client side**

On blur or Enter in the existing textarea in conclude.tsx, call `setCascadingMessage`. No optimistic UI needed; the input stores locally.

**Step 3: Wire into context**

```ts
// src/server/ai-summary.ts
cascadingMessage: meeting.cascadingMessage ?? '',
```

**Step 4: Commit**

```bash
git commit -m "feat: persist cascading message on meetings"
```

---

### Task 7: Auto-create next draft meeting + carry-over

**Files:**
- Modify: `src/server/meetings.ts` — `endMeeting` tail
- Create: `src/server/carry-over.ts` (isolate the logic for testability)
- Create: `src/server/carry-over.test.ts`

**Step 1: Define carry-over rules (writeup)**

From the concluded meeting → new draft:
- All **open** issues (both lists) are NOT copied — they stay in the `issues` table as-is. They'll appear in the next meeting's IDS panel naturally because it queries `status = 'open'`. (No DB change needed.)
- All **open** to-dos NOT past due (or past due — highlighted) similarly stay in the `todos` table. They appear in the To-Do Review panel in the next meeting automatically.
- The concluded meeting's `cascadingMessage` is copied to the new meeting's `previousCascadingMessage` column (add this column too).

Note: items "carry over" by simple persistence, not by duplication. The only thing explicitly copied is the previous cascading message.

**Step 2: Schema add**

```ts
// meetings table
previousCascadingMessage: text('previous_cascading_message'),
```

**Step 3: Implementation**

```ts
// src/server/meetings.ts — end of endMeeting
const nextScheduled = addDays(new Date(), 7);  // weekly cadence
await db.insert(meetings).values({
  type: meeting.type,
  status: 'draft',
  scheduledFor: nextScheduled,
  previousCascadingMessage: meeting.cascadingMessage ?? null,
});
```

**Step 4: Test**

```ts
// carry-over.test.ts
it('creates a draft meeting 7 days out when a meeting ends', async () => { ... });
it('copies cascading message forward', async () => { ... });
```

**Step 5: Commit**

```bash
git commit -m "feat: auto-create next draft meeting and carry cascading message"
```

---

### Task 8: Pre-fill UX on draft meetings

**Files:**
- Create: `src/app/(app)/meeting/[id]/prep/page.tsx` — the "prepare meeting" page
- Modify: sidebar nav — add "Upcoming" link pointing to `/meeting/upcoming`
- Create: `src/app/(app)/meeting/upcoming/page.tsx` — list of draft meetings

**Step 1: Upcoming page**

Shows all meetings where `status = 'draft'`. Each card:
- Date (scheduledFor)
- Type
- RSVP count (once Task 10 lands)
- "Prepare" button → `/meeting/<id>/prep`
- "Start" button (leader+ only) → calls `activateMeeting`, then navigates to `/meeting/live`

**Step 2: Prep page**

Reuses the existing panel components (Headlines, Issues add, To-Do add, Scorecard) but with `status = 'draft'` so endMeeting flows are disabled. Attendees can:
- Add headlines
- Add issues (go into `short_term` or `long_term` list; they show up in IDS when meeting goes live)
- Add to-dos with `sourceMeetingId = <this draft meeting>`
- Scorecard is read-only here (values are always the current week)

Visually distinct header: "Drafting L10 for Thursday, Apr 24" with a subtle badge "Pre-meeting prep".

**Step 3: Commit**

```bash
git commit -m "feat: draft meeting prep page"
```

---

## Phase 3 — Attendance management

### Task 9: RSVP data model + server actions

**Files:**
- Modify: `src/db/schema.ts` — new `meeting_rsvps` table
- Migration
- Create: `src/server/rsvp.ts`
- Create: `src/server/rsvp.test.ts`

**Step 1: Schema**

```ts
export const rsvpStatus = pgEnum('rsvp_status', ['attending', 'declined', 'tentative']);

export const meetingRsvps = pgTable('meeting_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: rsvpStatus('status').notNull().default('tentative'),
  respondedAt: timestamp('responded_at').defaultNow().notNull(),
}, (t) => ({
  meetingUserUnique: unique('meeting_rsvps_meeting_user_unique').on(t.meetingId, t.userId),
}));
```

**Step 2: Migration**

```bash
npx drizzle-kit generate --name add_rsvps
npx drizzle-kit migrate
```

**Step 3: Server actions**

```ts
// src/server/rsvp.ts
export async function setRsvp(meetingId: string, status: RsvpStatus) { ... }
export async function listRsvps(meetingId: string) { ... }
export async function rsvpCountsByStatus(meetingId: string) { ... }
```

**Step 4: Test**

Upsert behavior (on conflict, update status). Counts query returns `{ attending, declined, tentative }`.

**Step 5: Commit**

```bash
git commit -m "feat: RSVP data model + server actions"
```

---

### Task 10: RSVP UI on Upcoming page

**Files:**
- Modify: `src/app/(app)/meeting/upcoming/page.tsx`
- Create: `src/app/(app)/meeting/upcoming/rsvp-button.tsx`

**Step 1: UI**

On each upcoming meeting card, show:
- RSVP pill buttons: Attending · Tentative · Declined
- Current user's pick is highlighted
- Counts: "5 attending · 2 tentative · 1 declined"
- Tooltip on counts lists names

**Step 2: Commit**

```bash
git commit -m "feat: RSVP UI on upcoming meetings"
```

---

### Task 11: Admin adds/removes attendees live

**Files:**
- Modify: `src/server/meetings.ts` — add `addAttendee`, `removeAttendee`
- Modify: `src/app/(app)/meeting/live/page.tsx` — admin-only attendee editor

**Step 1: Server actions**

```ts
export async function addAttendee(meetingId: string, userId: string) {
  await requireRole('leader');
  // Fetch user, add to meetings.attendees jsonb if not present.
}
export async function removeAttendee(meetingId: string, userId: string) {
  await requireRole('leader');
  // Remove from meetings.attendees jsonb.
  // Also delete any meetingRatings row for that (meetingId, userId).
}
```

**Step 2: UI**

At the top of the live meeting page, a small "Attendees (5)" chip with a chevron. Leader+ clicks to expand. Shows team members with checkboxes — toggling calls add/remove. Only visible to leader+ via `atLeast(userRole, 'leader')`.

**Step 3: Commit**

```bash
git commit -m "feat: admin attendee management during live meeting"
```

---

### Task 12: Rate on behalf of attendees

**Files:**
- Modify: `src/server/meetings.ts` — `rateMeetingOnBehalf(meetingId, userId, rating)`
- Modify: `src/app/(app)/meeting/live/panels/conclude.tsx` — show an admin-only "Rate for…" section

**Step 1: Server action**

Mirror `rateMeeting` but take an explicit `userId` and gate on `requireRole('leader')`.

**Step 2: UI**

In the Conclude panel, if `atLeast(role, 'leader')`, render a small table of attendees with rating pickers (1–10 buttons). Clicking sets the rating on their behalf. Show a subtle "by [admin name]" tag so it's clear the rating wasn't self-reported.

**Step 3: Commit**

```bash
git commit -m "feat: leader/admin can rate meetings on behalf of attendees"
```

---

## Phase 4 — Polish & ship

### Task 13: Documentation + PROGRESS.md

**Files:**
- Modify: `docs/PROGRESS.md`
- Modify: `AGENTS.md` if any new conventions added (unlikely)

Add a "Meeting Workflow v2" section to PROGRESS.md describing the new flow end-to-end: draft → RSVP → prep → activate (Play) → live → conclude → auto-create next draft → Teams post with new card design.

Note role assignments. Call out that existing meetings in prod got backfilled to `concluded`.

**Step 1: Commit**

```bash
git commit -m "docs: meeting workflow v2 changelog"
```

---

### Task 14: End-to-end Playwright smoke test

**Files:**
- Modify: `tests/e2e/happy-path.spec.ts` (or create a new one if separation makes sense)

Add steps:
1. Sign in as admin
2. Visit /meeting/upcoming
3. Click "Start" on a draft
4. Land on /meeting/live with status = live
5. Click End & Summarize
6. Verify redirect to /meeting/history/<id>
7. Verify a new draft meeting appeared on /meeting/upcoming

Plus a permissions smoke: sign in as a member, verify the "Start" button is hidden.

**Step 1: Commit**

```bash
git commit -m "test: e2e coverage for draft meeting workflow + permissions"
```

---

## Open Questions (park for later unless asked)

1. **Scheduling cadence:** Task 7 hardcodes +7 days for L10s. Quarterly/annual meetings should probably not auto-create. Either skip auto-create unless `type === 'L10'`, or add a `cadenceDays` field per meeting type.

2. **Deleting draft meetings:** Should an admin be able to delete a draft meeting entirely (e.g. holiday week)? Probably yes; low priority, can be added in Phase 4.

3. **Scorecard issue wording:** If a metric goes red, is solved, then goes red again the next week → a second issue is created (correct by our dedupe rule). If the issue is dropped, then red again → second issue. Confirm this is the desired behavior.

4. **RSVP email reminders:** Out of scope for v1. Could tie to Task 12.5 email digest (deferred).

5. **Role assignment UI:** Initial admin roles are set via seed-team.ts. For adding/removing admins later, we'll need a Settings → Team Members page. Track as Phase 4+ polish.

6. **What if someone RSVP'd declined but shows up?** No enforcement; `addAttendee` by admin overrides. RSVP is informational.

7. **Cascading message on Teams card:** Add a dedicated Container for `ctx.cascadingMessage` in the redesigned card so it's prominent.

---

## Build Order & Rationale

1. **Phase 1** first because it's independent and low-risk. Roles unlock permission gates used later. Dedupe and Teams redesign are pure wins you'll notice immediately.
2. **Phase 2** is the biggest feature and depends on roles (Task 1) being in place. Do the schema state machine first (Task 5) — everything else sits on top.
3. **Phase 3** depends on Phase 2 (draft meetings need to exist for RSVPs to be meaningful).
4. **Phase 4** is docs + polish.

Each task commits on its own so a reviewer can bisect if something breaks.

## Verification Checklist (run after each phase)

- [ ] `npx tsc --noEmit` clean
- [ ] `npx vitest run` all pass
- [ ] Smoke test in dev: sign in as each role, attempt each gated action
- [ ] Vercel preview deploy: verify Teams webhook from a test meeting
- [ ] No raw SQL in app code; use drizzle helpers or `or()/and()` when combining conditions
