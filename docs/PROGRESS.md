# Colorhub EOS Hub — Progress Log

Last session: **2026-04-16**. P1 (Phases 0–12), P2 (Phases 13–18), P3 (Phases 19–21) all complete. Knack integration shipped. GitHub: `hunter-edwards/colorhub-eos-hub`. Deployed on Vercel.

## Where things live

- **This repo (colorhub-eos-hub):** the actual application. Standalone, unrelated to `packagent`.
- **Design + plan docs:** currently in the sibling packagent repo at `/Users/hunteredwards/Downloads/packagent/.claude/worktrees/goofy-noyce/docs/plans/`:
  - `2026-04-15-colorhub-eos-hub-design.md` — design doc (approved)
  - `2026-04-15-colorhub-eos-hub.md` — full 12-phase implementation plan
  - Consider copying these into this repo at `docs/` in a future session.

## Stack

Next.js 16.2.3 (App Router, Turbopack default) + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Supabase (Postgres + Auth) + Drizzle ORM v0.45 + Vitest + Playwright + Anthropic SDK. Single team ("Colorhub"), magic-link + password auth, trust-based permissions (no RLS yet).

**Notable deviations from plan assumptions:** plan was written targeting Next 14, but scaffold landed Next 16 + React 19. Adjustments made:
- `cookies()` and `headers()` are async in Next 16 — all call sites updated with `await`.
- `createClient` in `src/lib/supabase/server.ts` is now `async`.
- `middleware.ts` filename is deprecated in Next 16 in favor of `proxy.ts` (warning only for now; migrate before Next 17).
- Turbopack is default; `turbopack.root` pinned in `next.config.ts` to silence multi-lockfile warning from `~/package-lock.json` up the tree.
- Tailwind v4, lucide-react v1, zod v4 — all new majors (work fine, just newer APIs).
- **`params` is a Promise in Next 16** — dynamic route pages must `await params` (e.g. `const { id } = await params`).
- **shadcn/ui uses Base UI** (not Radix) — `asChild` doesn't exist, use `render` prop instead. Base UI Tabs require explicit `value` on `TabsTrigger` and `TabsContent`.
- **`'use server'` file-level marks ALL exports as server functions** — sync utility functions (like `currentQuarter`, `evaluateEntry`, `getWeekStarts`) must live in separate files (`src/lib/`) to avoid "Server Actions must be async" build errors. Server action files: `src/server/*.ts`. Utility files: `src/lib/*.ts`.

## Phases shipped

### Phase 0 — Repo bootstrap ✅
Next.js scaffold, deps installed, shadcn/ui initialized with 18 components (sonner instead of deprecated toast), Drizzle configured, Vitest configured, env template. HMR-safe DB client singleton on `globalThis`, `dotenv` loading in `drizzle.config.ts`.

### Phase 1 — Data model + migrations ✅
12 tables + 8 enums in Supabase (verified in DB):
- `teams`, `users` (id mirrors `auth.users.id`)
- `rocks`, `rock_subtasks` (cascade), `rock_activity` (cascade, jsonb payload)
- `todos`, `issues`, `headlines`
- `scorecard_metrics`, `scorecard_entries` (unique on `(metric_id, week_start)`)
- `meetings`, `meeting_ratings` (unique on `(meeting_id, user_id)`)

Enums: `rock_status`, `rock_activity_kind`, `todo_status`, `issue_list`, `issue_status`, `headline_kind`, `scorecard_comparator`, `meeting_type`.

FKs added in follow-up migration: `headlines.meeting_id → meetings.id` (cascade), `todos.source_meeting_id → meetings.id` (set null). `rocks.updatedAt` auto-bumps via Drizzle `$onUpdate`.

Seed script inserts one `Colorhub` team row idempotently.

### Phase 2 — Auth + app shell ✅
Supabase SSR clients (server/client/middleware). `/login` route with magic link. `/auth/callback` exchanges code, calls `upsertUser` to mirror Supabase auth user into our `users` table (race-safe via `onConflictDoNothing`, explicit error if no team seeded). Middleware protects all routes except `/login` + `/auth/*`. `(app)` route group with sidebar nav (8 items). Dashboard placeholder at `/`.

### Phase 2.5 — Password auth (not in original plan) ✅
Tabbed `/login`: Magic link | Password. `/settings` page with "Change password" form. Server-side validation (min 8 chars, confirm-match, generic "invalid credentials" message). Magic link remains the onboarding path — users set a password after logging in via magic link.

### Phase 3 — Rocks ✅
`currentQuarter` helper (TDD, 7 tests) in `src/lib/quarters.ts`. Server actions in `src/server/rocks.ts`: `createRock`, `listRocks`, `updateRockStatus`, `updateRockProgress`, `getRock`, `listSubtasks`, `addSubtask`, `toggleSubtask`, `deleteSubtask`, `listActivity`, `addComment`, `listTeamMembers`. Each mutation writes to `rock_activity`. Progress auto-recalculates from subtask completion. Rocks board page at `/rocks` (3-column: On Track / Off Track / Done). Rock detail page at `/rocks/[id]` with subtask list, activity timeline, comments with @mention highlighting. "X days left" with red urgency on due dates.

### Phase 4 — To-Dos ✅
Server actions in `src/server/todos.ts`: `createTodo` (default due +7 days), `listOpenTodos`, `listMyTodos`, `toggleTodo`, `dropTodo` (deletes row), `carryOverTodo` (+7 days). Page at `/todos` with Base UI Tabs (My To-Dos / All Team), sorted by due date, overdue highlighting, inline add with owner select.

### Phase 5 — Issues ✅
Server actions in `src/server/issues.ts`: `createIssue`, `listIssues(list)`, `solveIssue`, `dropIssue`, `moveList`. Page at `/issues` with two-column layout (Short-Term / Long-Term), inline add, hover actions to solve/drop/move.

### Phase 6 — Scorecard ✅
`evaluateEntry` (4 comparators: gte/lte/eq/range, 10 tests) + `getWeekStarts` in `src/lib/scorecard-utils.ts`. Server actions in `src/server/scorecard.ts`: `createMetric`, `listMetrics`, `listEntries`, `setEntry` (upsert on unique constraint). Page at `/scorecard` with 13-week grid, inline-editable cells, red/green cell backgrounds, add metric dialog.

### Phase 7 — L10 Meeting Runner ✅
Server actions in `src/server/meetings.ts`: `startMeeting` (no concurrent guard), `endMeeting` (computes rating avg + triggers AI summary), `joinMeeting`, `rateMeeting`, `addHeadline`, `listHeadlines`, `listMeetings`, `getMeeting`, `getMeetingRatings`. Live page at `/meeting/live` with 7-section agenda rail + per-section countdown timer. All panels implemented:
- Segue: ephemeral good-news inputs
- Scorecard: current week values, red→issue button
- Rock Review: status toggles, off-track auto-creates issue
- Headlines: customer/employee columns, persistent
- To-Do Review: due/overdue split, toggle/carry/drop
- IDS: issue list + discussion pane + solve with to-do creation
- Conclude: cascading message textarea, 1-10 rating buttons, live average, "End & Summarize"

**Deferred from Phase 7:** Realtime sync (7.7) needs Supabase dashboard config. IDS voting table (`issue_votes`) needs DB migration — IDS panel works without voting for now.

### Phase 8 — AI Summary ✅
`collectMeetingContext` gathers ratings, headlines, rock changes, scorecard reds, meeting to-dos from DB. `generateSummary` calls `claude-sonnet-4-6` with prompt caching (`cache_control: ephemeral` on stable context). `endMeeting` auto-generates summary (graceful failure — meeting still ends if API call fails). Meeting history list at `/meeting/history`. Detail page at `/meeting/history/[id]` with markdown rendering (react-markdown) + collapsible raw data + "Retry Summary" button.

### Phase 9 — Teams Webhook ✅
`team_settings` table (PK on `team_id`, FK to `teams`). `buildAdaptiveCard` produces MS Teams Adaptive Card v1.4 with meeting date, rating, attendees, and summary. `postToTeams` POSTs card to webhook URL, returns `{ ok, postedAt }` or `{ ok: false, error }`. 8 unit tests (card structure, fetch mock success/failure). Settings page at `/settings` extended with Teams Integration card — paste webhook URL, save, send test post. `endMeeting` wires it all: after AI summary persists, reads `teamSettings`, posts if URL configured, stamps `meetings.teamsPostedAt`. Graceful failure — meeting still ends if webhook fails.

### Phase 10 — Dashboard ✅
Replaced placeholder with real dashboard at `/`. Three above-fold cards: **Scorecard** (current week, red/green coloring, metric values + units), **My Rocks** (current quarter, progress %, status badge with link to detail), **My To-Dos** (sorted by due date, overdue highlighted red, capped at 8 with "+N more"). Below: **Recent Meetings** table (last 5, date linked to history detail, type, rating, completed/in-progress badge). All cards link to their respective full pages. Server-side data fetching via `Promise.all` for parallel loading.

### Phase 11 — E2E Smoke Test ✅ (deploy deferred)
Playwright config + Chromium. Happy-path test: admin API creates temp test user → password login via UI → navigates all 7 pages (dashboard, rocks, todos, scorecard, issues, meeting live, meeting history, settings). Cleanup deletes test user in `afterAll`. `reuseExistingServer: true` for dev. 1 test, passes in ~8s. **Deploy** (Task 11.2) deferred — user must add env vars to Vercel + Supabase redirect allowlist.

### Phase 12 — Polish ✅
- **Sign-out button** in sidebar (was deferred item, now resolved)
- **Loading skeletons** for dashboard, rocks, todos, issues, scorecard (Next.js `loading.tsx` convention)
- **Optimistic UI** on todo toggle + rock status change via React 19 `useOptimistic`
- **Toast notifications** via sonner on todo add/carry/drop, rock status, password update, webhook save/test
- **Keyboard shortcuts** in meeting runner: 1–7 jump to section, ←→ prev/next, hint text in sidebar rail
- **Empty states** with icons on rocks board columns, todos list, issues board
- **Dark mode** toggle via `next-themes` ThemeProvider + sidebar toggle button
- **Metadata** title fixed from "Create Next App" → "Colorhub EOS Hub"
- **Skipped:** 12.5 email digest (needs Resend setup)

### Phase 13 — User Profiles ✅
`profileColor` column on users. `<UserAvatar>` component (initials or image, 3 sizes). Profile settings form with name, avatar URL, 8-color picker. Server actions `getProfile`/`updateProfile`.

### Phase 14 — Core Values ✅
`core_values` table. CRUD server actions (list, create, update, reorder, delete). Page at `/core-values` with numbered cards, inline edit, drag-to-reorder (dnd-kit), arrow button fallback.

### Phase 15 — V/TO ✅
`vto` table (one per team, upsert). Page at `/vto` with all 8 EOS sections in 2-column layout. Editable: core focus, 10-year target, marketing strategy, 3-year picture, 1-year plan. Read-only: core values, rocks, issues.

### Phase 16 — Accountability Chart ✅
`seats` table (self-referential tree). Page at `/accountability` with tree layout, seat cards (title, 5 roles, person, GWC dots), edit dialog, add/delete seats.

### Phase 17 — People Analyzer ✅
`people_ratings` table + `people_rating_value` enum. Page at `/people` with matrix table (rows=members, cols=core values + GWC). Clickable +/+/-/- cycling, quarter selector, "below the bar" highlighting.

### Phase 18 — Process Documentation ✅
`processes` table. Page at `/processes` with expandable cards, ordered steps (drag-to-reorder), owner assignment, add/remove steps.

### P2 sidebar regroup ✅
Sidebar grouped into Strategy (V/TO, Core Values), Execution (Rocks, Scorecard, To-Dos, Issues), People (Accountability, People Analyzer, Processes), Meetings (L10 Live, History). Settings at bottom.

## P3 — Polish & Features ✅

Full plan at `docs/PLAN-P3.md`.

### 19.1 — UserAvatar wired everywhere ✅
`<UserAvatar>` added to: rock cards, todo owners, meeting panels (rock review, scorecard, todo review, IDS), meeting history ratings.

### 19.2 — middleware.ts → proxy.ts ✅
Renamed to satisfy Next 16 deprecation warning.

### 19.3 — Performance indexes ✅
8 indexes added: `core_values(team_id)`, `seats(team_id)`, `people_ratings(subject_id, quarter)`, `processes(team_id)`, `rocks(quarter)`, `rock_activity(rock_id, created_at)`, `todos(status, owner_id)`, `vto(team_id)`.

### 19.4 — E2E smoke test updated ✅
Added 5 new P2 routes to Playwright happy-path test: `/core-values`, `/vto`, `/accountability`, `/people`, `/processes`.

### 20.1 — Mobile responsive nav ✅
Hamburger menu on mobile (<768px), Sheet-based nav drawer. Desktop sidebar unchanged. Layout adjusts padding for mobile top bar.

### 20.2 — P2 utility tests ✅
42 new tests across 4 files: `quarters.test.ts` (7), `people-utils.test.ts` (14), `accountability-utils.test.ts` (9), `vto-utils.test.ts` (12). Extracted pure utility functions to `src/lib/`. Total suite: 67 tests.

### 20.3 — Drag-and-drop reordering ✅
dnd-kit integration on core values list and process steps. Drag handles (GripVertical), keyboard support. Arrow buttons kept as accessible fallback.

### 21.1 — Data visualization ✅
3 recharts components: scorecard trends (LineChart, 13 weeks), meeting ratings (BarChart, color-coded), rock completion (PieChart/donut). Added "Trends" section to dashboard.

### 21.2 — Quarterly review workflow ✅
4-step guided wizard at `/quarterly-review`: Rock Review → People Review → V/TO Check → Next Quarter Planning. Step indicators, inline rock status updates, read-only people matrix, V/TO accuracy checklist, new rock creation for next quarter. Dashboard link added.

### 21.3 — Export/print ✅
Print buttons on V/TO and People Analyzer pages. CSS print stylesheet hides nav, buttons, backgrounds. Cards get borders, tables shrink for print.

## Knack Integration ✅

Knack production database connected to EOS scorecard. PR #12.

### Knack API connection ✅
`src/lib/knack.ts` — REST client using `X-Knack-Application-Id` + `X-Knack-REST-API-Key` headers. Paginated fetch from object_1 (runs). Env vars: `KNACK_APP_ID`, `KNACK_API_KEY` (must be added to Vercel dashboard — `.env.local` is gitignored).

### Field mapping (object_1 = runs) ✅
| Field | Name | Example |
|-------|------|---------|
| field_1700 | Full job ID | `177_18970_2` (customer_parentJob_part) |
| field_534 | Parent job number | `18970` |
| field_535 | Part number | `2` |
| field_1589 | Customer number | `177` |
| field_34 | Shipped flag | `Yes` / `No` |
| field_798 | Invoiced (passToInvoicing) flag | `Yes` / `No` |
| field_497 | Planned ship date | `03/06/2026` |
| field_2292 | dateSentToInvoicing (actual) | `04/16/2026` — auto-set by Knack rule when field_798→Yes |
| field_969 | Order received date | `01/28/2026` |
| field_972 | Due/promise date | `03/04/2026` |
| field_961 | Revenue | `$7,032.80` (~70% fill rate) |
| field_8 | Ordered qty | |
| field_561 | Shipped qty | |

### 5 KPIs computed weekly ✅
`src/server/knack-sync.ts` — `syncKnackToScorecard(weekCount=13)` fetches runs, computes KPIs, upserts into scorecard entries.

1. **Parent Jobs Shipped** (production KPI) — parent job counts as shipped when ALL runs have `field_34 = "Yes"`. Goal: ≥ 10.
2. **Parent Jobs Invoiced** (financial KPI) — parent job counts as invoiced when ALL runs have `field_798 = "Yes"`. Goal: ≥ 10.
3. **Avg Days Order→Ship** (lead time) — `effectiveShipDate - orderDate`, averaged. Goal: ≤ 14 days.
4. **On-Time Delivery %** (service) — `effectiveShipDate <= dueDate`. Goal: ≥ 90%.
5. **Weekly Revenue** — sum of `field_961`. Goal: ≥ $50,000.

**Effective ship date:** `field_2292 (dateSentToInvoicing) ?? field_497 (planned ship date)`. Historical records use planned date; new records use actual invoicing date once the Knack automation rule populates field_2292.

### Individual KPI charts ✅
`src/app/(app)/scorecard/kpi-charts.tsx` — each KPI gets its own card with bar or line chart, red dashed goal reference line, and footer showing Knack field numbers + formula. Rendered above the scorecard grid on `/scorecard`.

### Metric management ✅
Edit and delete scorecard metrics from the grid UI. Hover pencil/trash icons. Cascade deletes entries.

### Sync button ✅
`src/app/(app)/scorecard/knack-sync-button.tsx` — "Sync from Knack" button, conditionally shown when env vars configured.

### Tests ✅
13 unit tests in `src/lib/knack.test.ts` covering: shipped/invoiced independence, avg days, on-time %, revenue, empty runs, multiple parent jobs, dateSentToInvoicing preference, shipDate fallback.

## Deferred items tracked (will bite if forgotten)

- **`NEXT_PUBLIC_SITE_URL`** — add before Vercel deploy (Task 11.2). The `signInWithMagicLink` server action currently falls back to `http://localhost:3000` if the `origin` header is missing. Fine in dev, wrong in prod.
- ~~**Rename `src/middleware.ts` → `src/proxy.ts`**~~ Resolved in P3 (19.2).
- **No RLS policies** on any table. Trust-based permissions work while the whole team is three people. Revisit before any multi-tenant or before exposing the Supabase anon key to untrusted clients.
- ~~**No performance indexes.**~~ Resolved in P3 (19.3).
- **`meetings.attendees` is jsonb.** Works but forfeits FK integrity. If this grows important, swap to a `meeting_attendees` join table.
- ~~**No sign-out button in sidebar.**~~ Resolved in Phase 12.
- **Password min length mismatch:** server enforces 8, Supabase default is 6. Align via Supabase Auth settings or just keep 8 as the product floor.
- **4 moderate npm audit vulns** in dev deps (never addressed).
- **Open-redirect shape** in `/auth/callback`: always goes to `${origin}/`. If a `next`/`redirectTo` param is added later, validate that it's a relative path.
- **Realtime sync** (Phase 7.7) — Supabase Realtime for live meeting updates. Needs Supabase dashboard config.

## Environment

`.env.local` has real values (do NOT commit):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` — Transaction pooler, port 6543, with real password (NOT `[brackets]` placeholder — common gotcha)
- `ANTHROPIC_API_KEY`
- `KNACK_APP_ID` (optional — enables Knack sync)
- `KNACK_API_KEY` (optional — enables Knack sync)

Supabase project URL allowlist includes `http://localhost:3000/**`.

## Branch info

All phases merged to `main` via PRs on GitHub (`hunter-edwards/colorhub-eos-hub`).

## Meeting workflow v2 (2026-04-22) ✅

Shipped the meeting-workflow upgrade plan at `docs/plans/2026-04-21-meeting-workflow-upgrades.md`. Fourteen tasks landed across four commits on branch `claude/funny-kare-227296`.

**What's new:**
- **Role-based access** — new `user_role` pgEnum (`admin` | `leader` | `member`) with `atLeast(role, required)` helper (`src/lib/auth.ts`) and `requireUser` / `getCurrentUserRole` / `requireRole` server helpers (`src/server/auth-helpers.ts`). Seed updates existing users' role from `TEAM_MEMBERS`. Non-leaders can't start/end meetings; non-admins can't rate on behalf.
- **Meeting state machine** — `meeting_status` pgEnum (`draft` | `live` | `concluded`). `getActiveMeeting` filters on `status = 'live'` (no more `isNull(endedAt)` heuristic). `createDraftMeeting`, `activateMeeting`, `listDraftMeetings`, `setCascadingMessage` server actions.
- **Upcoming meetings UX** — `/meeting/upcoming` lists draft meetings, each with Prepare + Start (leader-only) + RSVP pills (attending / tentative / declined with live counts). `/meeting/[id]/prep` shows previous cascading message, Headlines panel for pre-fill, and links to Issues / To-Dos.
- **Scorecard issue dedupe** — `issues.source_metric_id` FK + `createIssueIfNotExists` prevents multiple open issues being auto-created from the same failing metric week over week.
- **Adaptive Card redesign** — `teams-webhook.ts` now builds sectioned v1.4 cards (health / scorecard / rocks / headlines / issues / to-dos / cascading) with ColumnSet + FactSet and colored section headers. Empty sections drop cleanly.
- **Auto carry-over** — ending an L10 inserts the next draft (`createNextDraftFromConcluded`, 7-day cadence), and `cascadingMessage` copies forward as `previousCascadingMessage`. Open issues/to-dos stay in their tables and surface naturally — no row duplication.
- **Admin controls in live meeting** — `AttendeesManager` popover in the agenda header for leaders (add/remove attendees via `addAttendee` / `removeAttendee`). Conclude panel shows admins a rate-on-behalf list (`rateMeetingOnBehalf`) for any unrated user.
- **Cascading message** — persisted on meetings row (`cascading_message`), editable in Conclude panel during live meeting, surfaced in AI summary context (`ai-summary.ts` uses real value).

**Migrations:** 0008 (user role), 0009 (issues.source_metric_id), 0010 (meeting status + backfill), 0011 (meeting_rsvps with `(meeting_id, user_id)` unique). 0010/0011 applied manually via node `postgres` driver after `drizzle-kit migrate` hung on the existing DB connection — prefer that fallback when migrate stalls.

## Prod incident (2026-04-22) — migration drift

`/meeting/upcoming` returned a 500 in prod right after PR #25 shipped. Root cause: `getCurrentUserRole()` queries `users.role`, but migration `0008_add_user_role.sql` had never run on the prod DB. `0009_add_issue_source_metric.sql` was also missing (would have broken scorecard→issue creation in the next live meeting). 0010/0011 were applied manually but never recorded in `drizzle.__drizzle_migrations`, so the journal was out of sync with reality and `drizzle-kit migrate` would have tried to re-run everything.

Fix applied directly against prod:
- Ran 0008 + 0009 SQL (both are additive — enum + columns + FK, no data loss).
- Promoted `h.edwards.327@gmail.com` to `admin`; everyone else defaults to `member`. Grant `leader` to meeting runners as needed: `UPDATE users SET role='leader' WHERE email IN (...)`.
- Reconciled `drizzle.__drizzle_migrations`: inserted the 6 missing rows (0006, 0007_add_meeting_timestamps, 0008, 0009, 0010, 0011) using `sha256(fileContents)` as the hash — matches drizzle's `readMigrationFiles` algorithm.

**Lesson:** manual SQL without touching the journal silently drifts the schema away from what drizzle thinks is applied. When `drizzle-kit migrate` hangs, the fallback must be: apply the SQL **and** insert the corresponding `drizzle.__drizzle_migrations` row in the same transaction. Script template lives in `scripts/` next time we need it.

**Still an orphan:** `drizzle/0007_performance-indexes.sql` exists as a file but isn't in `meta/_journal.json`, so drizzle-kit ignores it. The indexes inside it (`idx_core_values_team`, etc.) are likely present from a one-off manual apply. Either fold the statements into a new tracked migration or delete the orphan — don't leave it dangling.

**Test coverage:** 108 Vitest tests across 11 files. `auth.test.ts` (6), `carry-over.test.ts` (5), `issues.test.ts` (2), `teams-webhook.test.ts` (17) added in this round. E2E smoke at `tests/e2e/happy-path.spec.ts`.

**Gotchas worth remembering:**
- `import 'server-only'` breaks Vitest — don't add it to files that need to stay unit-testable. `'use server'` at the top of `src/server/*.ts` still enforces the server boundary at build time.
- Button component here has **no `asChild` prop** — use `buttonVariants({ variant, size })` as the `className` on a plain `<Link>` instead.
- When a Next Server Component returns JSX that calls RSC-only data fns per-row, do the fetches in parallel with `Promise.all(rows.map(...))` — avoids N+1 waterfalls (see `upcoming/page.tsx`).

## Known dev-environment gotchas

- `~/Downloads/` is itself a git repo → multi-lockfile warning shows up unless `turbopack.root` is pinned (it is).
- `create-next-app` did not auto-init git because of the parent Downloads git repo — had to `git init -b main` manually.
- `shadcn add form` failed with the short name on shadcn 4.2.0; works with the full registry URL. Fall back to that pattern if other components fail similarly.
- Node `--env-file=.env.local` is how the seed script loads env (not `dotenv` import — that fails because ESM imports hoist before `config()` runs).
- **Worktrees don't get `.env.local`** (gitignored). Symlink it: `ln -s ../../.env.local .claude/worktrees/<name>/.env.local`.

## Resuming

Open this repo (`~/Downloads/colorhub-eos-hub/`) and reference:
- `docs/PROGRESS.md` — where we are
- `docs/PLAN-P2.md` — P2 plan (Phases 13–18, complete)
- `docs/PLAN-P3.md` — P3 plan (Phases 19–21, complete)

All phases through P3 shipped + Knack integration. Remaining work: add `KNACK_APP_ID` + `KNACK_API_KEY` to Vercel dashboard, RLS policies, Supabase Realtime, email digest, AR aging KPI (once field_2292 has enough data).
