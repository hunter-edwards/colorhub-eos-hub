# Colorhub EOS Hub — Progress Log

Last session: **2026-04-15**. 22 commits on `main`, 8 on `claude/sad-khorana` (Phases 3–8). Phases 9–11 on `claude/adoring-benz`.

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

## Not yet started

### Phase 11 — E2E Smoke Test ✅ (deploy deferred)
Playwright config + Chromium. Happy-path test: admin API creates temp test user → password login via UI → navigates all 7 pages (dashboard, rocks, todos, scorecard, issues, meeting live, meeting history, settings). Cleanup deletes test user in `afterAll`. `reuseExistingServer: true` for dev. 1 test, passes in ~8s. **Deploy** (Task 11.2) deferred — user must add env vars to Vercel + Supabase redirect allowlist.

### Phase 12 — Polish backlog
Loading skeletons, optimistic UI on toggles, toast (via sonner) on action success/failure, keyboard shortcuts in meeting runner, email digest Mondays, empty states, dark mode.

## Deferred items tracked (will bite if forgotten)

- **`NEXT_PUBLIC_SITE_URL`** — add before Vercel deploy (Task 11.2). The `signInWithMagicLink` server action currently falls back to `http://localhost:3000` if the `origin` header is missing. Fine in dev, wrong in prod.
- **Rename `src/middleware.ts` → `src/proxy.ts`** — Next 16 warning only; breaks in Next 17.
- **No RLS policies** on any table. Trust-based permissions work while the whole team is three people. Revisit before any multi-tenant or before exposing the Supabase anon key to untrusted clients.
- **No performance indexes.** Flagged targets: `rocks.quarter`, `rock_activity(rock_id, created_at)`, `todos(status, owner_id)`, `scorecard_entries(metric_id, week_start)` (already covered by the unique). Fine at zero scale.
- **`meetings.attendees` is jsonb.** Works but forfeits FK integrity. If this grows important, swap to a `meeting_attendees` join table.
- **No sign-out button in sidebar.** Users have to clear cookies to sign out. Easy add in a future session.
- **Password min length mismatch:** server enforces 8, Supabase default is 6. Align via Supabase Auth settings or just keep 8 as the product floor.
- **4 moderate npm audit vulns** in dev deps (never addressed).
- **Open-redirect shape** in `/auth/callback`: always goes to `${origin}/`. If a `next`/`redirectTo` param is added later, validate that it's a relative path.

## Environment

`.env.local` has real values (do NOT commit):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` — Transaction pooler, port 6543, with real password (NOT `[brackets]` placeholder — common gotcha)
- `ANTHROPIC_API_KEY`

Supabase project URL allowlist includes `http://localhost:3000/**`.

## Branch info

Phases 3–8 were built on branch `claude/sad-khorana` (worktree at `.claude/worktrees/sad-khorana`). Merge into `main` when ready:
```bash
git merge claude/sad-khorana
```

## Known dev-environment gotchas

- `~/Downloads/` is itself a git repo → multi-lockfile warning shows up unless `turbopack.root` is pinned (it is).
- `create-next-app` did not auto-init git because of the parent Downloads git repo — had to `git init -b main` manually.
- `shadcn add form` failed with the short name on shadcn 4.2.0; works with the full registry URL. Fall back to that pattern if other components fail similarly.
- Node `--env-file=.env.local` is how the seed script loads env (not `dotenv` import — that fails because ESM imports hoist before `config()` runs).
- **Worktrees don't get `.env.local`** (gitignored). Symlink it: `ln -s ../../.env.local .claude/worktrees/<name>/.env.local`.

## Resuming

To resume in a new session, open either:
- This repo (`~/Downloads/colorhub-eos-hub/`) directly and reference `docs/PROGRESS.md` + the plan docs in the packagent repo.
- The packagent worktree (where the plan lives) and work across both.

Next practical step: **Phase 9 — Teams webhook**. Then Phase 10 (Dashboard), Phase 11 (E2E + deploy). Also need to merge `claude/sad-khorana` into `main` before or during next session.
