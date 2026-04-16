# Colorhub EOS Hub — Phase 2 Implementation Plan

**Goal:** Evolve from a weekly-execution tool into a full EOS Hub — adding the strategic layer (V/TO, core values, accountability chart), people tools (people analyzer, user profiles), and process documentation.

**Prerequisite:** Phases 0–12 shipped and deployed.

---

## Phase 13 — User Profiles

Users can set their display name, profile color, and upload/choose an avatar. Currently `users.name` and `users.avatarUrl` exist but aren't editable.

### Task 13.1: Profile settings form

**Files:**
- Modify: `src/app/(app)/settings/page.tsx`
- Create: `src/app/(app)/settings/profile-form.tsx`
- Modify: `src/app/(app)/settings/actions.ts`
- Modify: `src/db/schema.ts` — add `profileColor` text column to `users`

**Steps:**
1. Add `profileColor` column to `users` table (text, nullable, stores hex like `#4f46e5`).
2. Migration + push.
3. Server actions: `updateProfile({ name, profileColor })`. Avatar URL stored as a URL string (external link or future upload).
4. Profile form: name input, color picker (6-8 preset colors + custom hex), current avatar display.
5. Show profile color as colored dot/ring next to user name throughout the app (sidebar, rock cards, todo owners, meeting attendees).

### Task 13.2: Avatar support

**Files:**
- Create: `src/components/user-avatar.tsx`
- Modify: profile form

**Steps:**
1. Reusable `<UserAvatar>` component: shows image if `avatarUrl` set, otherwise shows initials on `profileColor` background.
2. Use `<UserAvatar>` in sidebar (current user), rock cards, todo owner labels, meeting attendee list.
3. Allow avatar URL paste in profile form (Supabase Storage upload is a stretch goal — URL paste is simpler and works).

---

## Phase 14 — Core Values

The foundation of EOS. Every company running EOS has 3-7 core values. These get referenced in people analyzer, V/TO, and quarterly conversations.

### Task 14.1: Core values schema + CRUD

**Files:**
- Modify: `src/db/schema.ts` — add `core_values` table
- Create: `src/server/core-values.ts`
- Create: `src/app/(app)/core-values/page.tsx`

**Schema:**
```
core_values: id, team_id, title, description, order_idx, active
```

**Steps:**
1. Schema + migration.
2. Server actions: `listCoreValues`, `createCoreValue`, `updateCoreValue`, `reorderCoreValues`, `deleteCoreValue`.
3. Page at `/core-values`: display as numbered cards with title + description. Inline edit. Add/remove. Drag-to-reorder (or arrow buttons).
4. Add "Core Values" to sidebar nav (use `Heart` or `Star` icon from lucide).

---

## Phase 15 — Vision/Traction Organizer (V/TO)

The V/TO is the single most important EOS document. It captures the company's vision and traction plan on one page.

### Task 15.1: V/TO schema

**Files:**
- Modify: `src/db/schema.ts` — add `vto` table

**Schema:**
```
vto: id (PK), team_id (FK, unique — one V/TO per team),
  core_focus_purpose text,
  core_focus_niche text,
  ten_year_target text,
  marketing_strategy_target_market text,
  marketing_strategy_uniques jsonb,       -- string[]
  marketing_strategy_proven_process text,
  marketing_strategy_guarantee text,
  three_year_picture_date date,
  three_year_picture_revenue text,
  three_year_picture_profit text,
  three_year_picture_measurables jsonb,   -- string[]
  one_year_plan_date date,
  one_year_plan_revenue text,
  one_year_plan_profit text,
  one_year_plan_goals jsonb,              -- string[]
  updated_at timestamp
```

**Steps:**
1. Schema + migration.
2. Single row per team (upsert pattern).

### Task 15.2: V/TO page

**Files:**
- Create: `src/server/vto.ts`
- Create: `src/app/(app)/vto/page.tsx`
- Create: `src/app/(app)/vto/vto-form.tsx`

**Steps:**
1. Server actions: `getVTO`, `saveVTO` (upsert).
2. Page at `/vto` — structured form matching the EOS V/TO layout:
   - **Core Values** section (read-only, pulled from `core_values` table, link to `/core-values` to edit)
   - **Core Focus** — Purpose/Cause/Passion + Niche
   - **10-Year Target** — single big goal
   - **Marketing Strategy** — target market, 3 uniques, proven process, guarantee
   - **3-Year Picture** — date, revenue, profit, measurables list
   - **1-Year Plan** — date, revenue, profit, goals list
   - **Quarterly Rocks** (read-only, pulled from current quarter's rocks)
   - **Issues List** (read-only, pulled from issues)
3. All fields auto-save on blur or have explicit Save button.
4. Add "V/TO" to sidebar nav (use `Compass` icon).

---

## Phase 16 — Accountability Chart

Role-based org chart. Each "seat" has a title, 5 roles (responsibilities), and a person assigned. Seats can be nested (reports-to relationship).

### Task 16.1: Accountability chart schema

**Files:**
- Modify: `src/db/schema.ts` — add `seats` table

**Schema:**
```
seats: id, team_id, title text, roles jsonb (string[]),
  parent_seat_id uuid (FK self-ref, nullable — top is null),
  person_id uuid (FK users, nullable — seat can be open),
  gwc_gets_it boolean, gwc_wants_it boolean, gwc_capacity boolean,
  order_idx integer,
  created_at, updated_at
```

**Steps:**
1. Schema + migration.
2. Self-referential FK allows tree structure.

### Task 16.2: Accountability chart page

**Files:**
- Create: `src/server/accountability.ts`
- Create: `src/app/(app)/accountability/page.tsx`
- Create: `src/app/(app)/accountability/chart.tsx`

**Steps:**
1. Server actions: `listSeats`, `createSeat`, `updateSeat`, `deleteSeat`, `assignPerson`.
2. Page at `/accountability` — tree layout (visionary + integrator at top, departments below).
3. Each seat card shows: title, 5 roles, person assigned (with `<UserAvatar>`), GWC indicators.
4. Click seat to edit: change title, roles, assign person, set GWC.
5. Add/remove seats. Drag to reparent (or dropdown to pick parent).
6. Add "Accountability" to sidebar nav (use `Users` icon).

---

## Phase 17 — People Analyzer

Rate each team member against core values and GWC. Used in quarterly conversations.

### Task 17.1: People analyzer schema

**Files:**
- Modify: `src/db/schema.ts` — add `people_ratings` table

**Schema:**
```
people_rating_value enum: 'plus', 'plus_minus', 'minus'

people_ratings: id, team_id, subject_id (FK users — who is being rated),
  core_value_id (FK core_values, nullable — null means GWC rating),
  gwc_field text (nullable — 'gets_it' | 'wants_it' | 'capacity', null when core_value_id set),
  rating people_rating_value,
  quarter text,
  unique on (subject_id, core_value_id, gwc_field, quarter)
```

**Steps:**
1. Schema + migration.

### Task 17.2: People analyzer page

**Files:**
- Create: `src/server/people-analyzer.ts`
- Create: `src/app/(app)/people/page.tsx`

**Steps:**
1. Server actions: `listPeopleRatings(quarter)`, `setRating`.
2. Page at `/people` — matrix table: rows = team members, columns = each core value + G + W + C.
3. Each cell is a clickable badge cycling through +, +/-, -.
4. "Bar" indicator: highlight people below the bar (configurable — e.g. must have no minuses, no more than 1 +/-).
5. Quarter selector to compare over time.
6. Add "People" to sidebar nav (use `UserCheck` icon).

---

## Phase 18 — Process Documentation

Document the company's core processes — the "EOS way" of doing things.

### Task 18.1: Process documentation schema

**Files:**
- Modify: `src/db/schema.ts` — add `processes` table

**Schema:**
```
processes: id, team_id, title text, owner_id (FK users),
  steps jsonb (string[] — the 20% of steps),
  description text,
  order_idx integer,
  updated_at timestamp
```

**Steps:**
1. Schema + migration.

### Task 18.2: Process documentation page

**Files:**
- Create: `src/server/processes.ts`
- Create: `src/app/(app)/processes/page.tsx`

**Steps:**
1. Server actions: `listProcesses`, `createProcess`, `updateProcess`, `deleteProcess`.
2. Page at `/processes` — list of process cards. Each shows title, owner, step count.
3. Click to expand/edit: title, owner, description, ordered list of steps (add/remove/reorder).
4. Add "Processes" to sidebar nav (use `FileText` icon).

---

## Sidebar nav update

After all phases, sidebar grows from 8 to 13 items. Group them:

**Strategy:** V/TO, Core Values
**Execution:** Rocks, Scorecard, To-Dos, Issues
**People:** Accountability, People Analyzer, Processes
**Meetings:** L10 Live, Meeting History
**Other:** Dashboard (top), Settings (bottom)

---

## Implementation order recommendation

| Phase | What | Why this order |
|-------|------|----------------|
| 13 | User Profiles | Quick win, improves all existing pages |
| 14 | Core Values | Foundation — needed by V/TO and People Analyzer |
| 15 | V/TO | Strategic backbone, references core values + rocks + issues |
| 16 | Accountability Chart | Org structure, references users |
| 17 | People Analyzer | References core values + users |
| 18 | Process Documentation | Standalone, lowest dependency |

---

## Definition of Done (P2)

- [ ] Users can customize name, color, and avatar
- [ ] Core values editable and visible across the app
- [ ] V/TO filled out with all 8 sections, auto-pulls rocks + issues
- [ ] Accountability chart shows org structure with seats and people
- [ ] People analyzer rates team against core values + GWC
- [ ] Core processes documented with steps
- [ ] Sidebar grouped logically
- [ ] All new pages have loading skeletons + empty states
