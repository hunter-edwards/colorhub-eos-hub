# Floor / Shift Huddle Dashboard — Design

**Date:** 2026-05-07
**Status:** Approved design; ready for implementation plan
**Owner:** Hunter Edwards

## Purpose

A dashboard for the production floor that drives **shift-start** and **shift-handoff** standing meetings, displays live production state on a shop-floor TV during the shift, and records events through the shift so the handoff meeting can show what was accomplished.

Primary surface is a wall-mounted TV viewed from across the floor; the meeting leader interacts with it directly. The interface is built first against partly-mocked data so the UX is validated before mapping every Knack field; Knack wiring follows in a second pass.

## Scope (Phase 1)

- New top-level **Floor** section in the app nav.
- Live Huddle Dashboard at `/floor` — TV-optimized, 4×2 stations grid + bottom strip (people / tasks / events).
- Station expand modal with quick actions (start, pause, complete, log waste, note issue, mark PM done).
- Shift sessions auto-bound to 1st (07:00–15:00) and 2nd (15:00–23:00) shift windows.
- Shift Handoff Recap (`/floor/handoff`) with hero numbers, per-station summary, timeline, "outstanding for next shift," handoff notes.
- Past Shifts browser (`/floor/history`).
- Floor Setup admin (`/floor/setup`) — stations, default operators, PM cadence, task pool, shift settings.
- Hub-managed task pool with the ability to import existing EOS to-dos.
- Hybrid people assignment: defaults from setup, leader overrides per shift.
- All event/assignment/PM/task data lives in the hub's DB (Drizzle/Postgres).
- Mocked Knack-sourced fields behind a mapping layer; replaced with real Knack queries in Phase 2.

## Out of scope (Phase 1)

- Operator-driven event capture (operators triggering job_started / paused themselves). Supervisor-only buttons for now; we'll revisit by piggy-backing on operator activity already happening in Knack.
- Usage-based PM cadence ("every N sheets"). Date-based only.
- Webhooks / live push from Knack. Polling-only.
- Full mobile/tablet "remote" experience — the TV view is single-screen interactive; a separate remote surface can come later.
- Two-shift overlap or 3rd-shift support.

## Information architecture

New nav section **Floor**, slotted between People and Meetings:

- `/floor` — Live Huddle Dashboard (default landing page for the section)
- `/floor/handoff` — Shift Handoff Recap
- `/floor/history` — Past shifts
- `/floor/setup` — Stations, default operators, PM, task pool, shift settings

### Shift lifecycle

The hub knows two shifts: 1st (07:00–15:00) and 2nd (15:00–23:00). When `/floor` first loads inside a shift window, a `shift_session` row is auto-created for that day/shift. The session is what events, assignments, and notes get recorded against. The session record makes the same view work for live and recap.

### Two on-screen modes for `/floor`

Same URL, toggle in header:

- **Huddle mode** — described below; all panels prominent.
- **Run mode** — same data, larger station tiles, smaller bottom strip; ambient view between meetings.

Defaults to Huddle inside a ~10-minute window before/after each shift start and shift end; otherwise Run.

## Live Huddle Dashboard layout (`/floor`)

Vertical split: stations grid (~70%) + bottom strip (~30%). Targets 1080p+ TV viewed from 10+ feet.

### Top header bar (~5%)

- Left: shift name (`1st Shift — Tuesday May 7`), elapsed/remaining, current clock.
- Center: shift session status (`Live` / `Pre-shift` / `Handoff`) + Huddle/Run mode toggle.
- Right: counters — `Operators`, `PMs Due`, `Open Issues`, `Tasks Open`. Tappable; each scrolls/highlights the relevant panel.
- Small sync dot (last poll timestamp).

### Stations grid (top ~70%)

A 4×2 grid in this order (production flow, left→right, top→bottom):

```
[ Press 1 ]   [ Press 2 ]     [ CAD 1 ]      [ CAD 2 ]
[ Rotary ]    [ Gluer/Tape ]  [ Handwork ]   [ Shipping ]
```

**Per tile:**

- **Header:** station name + status pill (`RUNNING` / `SETUP` / `DOWN` / `IDLE`); PM badge in the corner if due/overdue.
- **Body:** big job number, customer name, truncated line-item description, sheets-completed-vs-needed progress bar. Bar continues past 100% in a distinct over-run color with the % over called out.
- **Footer:** assigned operator name(s), `Next: <next job #>` preview.

Tap → expand modal.

### Bottom strip (~30%) — three equal panels

1. **People bench.** "On shift: N." Operator chips with current station assignment; unassigned chips float at top. Drag chip → station tile (or tap → picker) to assign/move.
2. **Tasks pool.** "Tasks · N open." Cards showing title, est. minutes, "good for: <station>" tag. Mark in-progress / complete / new. Top-right `+` opens add-form *and* an "import from EOS to-dos" picker.
3. **Events feed.** "Shift events · live." Reverse-chronological list, auto-scrolling, pin button to freeze. One-line entries: timestamp · station · icon · summary.

### Live feedback

- Expanded tile dims the bottom strip slightly so attention follows.
- New event → its station tile briefly pulses (~1s, subtle scale + border glow); entry slides into the events feed.

## Station expand modal

Tile zooms to ~85% of screen; rest dims. Single-column scrollable. Sections:

1. **Now running** — large job header; sheets-completed-vs-needed bar with raw counts (`4,820 / 5,000 — 96%`); waste counter; sheets-received vs needed as smaller secondary bar; over-run % in distinct color when applicable.
2. **Status & timing** — status pill, time started, time elapsed, active pause + reason if any.
3. **Operator(s)** — assignment chip(s) + override pencil.
4. **Up next (queue)** — next 3–5 jobs with estimated sheets, due date, customer.
5. **PM** — last PM date, next PM due date, status (green/yellow/red), `Mark PM done` button.
6. **Issues / notes** — Knack line-item run notes for current job + any free-text notes added on dashboard. Add-note button.
7. **Quick actions strip** — large buttons: `Start job`, `Pause` (reason picker: setup / material / mechanical / quality / break / other + free text), `Resume`, `Complete job`, `Log waste`, `Note issue`. Supervisor-only in Phase 1.

Close button or tap-outside returns to grid.

## Shift Handoff Recap (`/floor/handoff`)

Read-only "what happened this shift," styled to match the TV view so it feels continuous.

- **Hero numbers band:** total sheets completed, total waste, jobs completed, PMs performed, issues opened, tasks completed.
- **Per-station summary row:** mini station tile per station for *this shift only* — jobs run with final %, total sheets, waste, downtime minutes with reasons.
- **Timeline:** condensed events feed, grouped by station, collapse/expand.
- **Outstanding for next shift:** open issues, unfinished jobs (with progress at handoff), PMs still due, tasks still open.
- **Handoff notes:** outgoing leader's free-text box; saved on the shift session and shown as a banner on the next shift's `/floor`.

Defaults to current shift after it ends; date/shift picker for any past shift. `/floor/history` is just a list of prior shifts that link into this view.

## Floor Setup (`/floor/setup`)

Normal app density (not TV-styled). Tabs:

- **Stations** — list/edit the 8 stations: names, order, group label, default operator(s), PM cadence (date-based: every N days).
- **Task pool** — manage standing misc tasks: title, est. minutes, suggested station, archive.
- **Shift settings** — confirm shift windows, auto-Huddle window minutes, TV display preferences.

## Visual language

`/floor` route uses TV-scaled type and a forced dark theme; setup/handoff/history pages use normal app density and the user's chosen theme.

- **Type scale (1080p target).** Station name and job number ~64–80px; customer/line item ~32–40px; chips/operators ~20–24px; header bar ~22–28px. Implemented as a `floor-*` Tailwind/CSS-variable scale shared across the route so re-tuning is one place.
- **Tile size.** 4×2 grid on 1920×1080 → ~440×360 per tile after padding.
- **Color.** Forced dark on `/floor`. Status: running=green, setup=amber, down=red, idle=neutral. Over-run % in distinct violet (not red — not an error). Color always paired with icon/label.
- **Motion.** Tile pulse on new event (~1s, subtle scale + border glow); events feed slide-in. No spinners on TV; silent refresh.
- **Refresh.** Poll every 15s. Sync dot indicates last successful poll.
- **Click targets.** Tiles fill their cell. Bench chips, task cards, action buttons: ≥56px tall.
- **No mobile responsive design for `/floor`.** TV-only. Other pages remain responsive.

## Data model (hub)

New Drizzle tables. Column names finalized at implementation; this is the shape.

- **`stations`** — `id`, `name`, `kind` (printer / cad / rotary / gluer / handwork / shipping), `display_order`, `group_label`, `knack_machine_center_id` (nullable).
- **`station_default_operators`** — many-to-many station ↔ user (+ priority/weight).
- **`shift_sessions`** — `date`, `shift_number` (1 | 2), `opened_by`, `opened_at`, `closed_at`, `handoff_notes`. One per shift per day; auto-created on first `/floor` load in window.
- **`shift_assignments`** — operator ↔ station for a `shift_session`. Seeded from defaults; overrides written here.
- **`shift_events`** — append-only feed. `shift_session_id`, `station_id` (nullable), `kind` (enum: `job_started` / `job_paused` / `job_resumed` / `job_completed` / `pm_performed` / `issue_noted` / `waste_logged` / `task_completed` / `operator_moved` / `note`), `payload` (jsonb, kind-specific), `occurred_at`, `recorded_by`, `related_knack_job_id` (nullable). Schema designed so machine- and Knack-driven sources can write here later without change.
- **`pm_schedules`** — `station_id`, `label`, `cadence_days`, `last_done_at`. `next_due_at` and status computed at render.
- **`task_pool`** — `title`, `est_minutes`, `suggested_station_id`, `status` (open / in_progress / done / archived), `source` (`hub` | `eos_todo`), `source_todo_id` (nullable, ref to existing todos).
- **`task_pool_assignments`** — task ↔ shift_session ↔ operator (lightweight; may fold into `task_pool` if simpler).

## Knack integration plan

A mapping layer at `src/server/floor-knack.ts` translates Knack records into shapes the UI consumes. Phase 1 returns mocks conforming to those shapes; Phase 2 swaps the mocks for real queries. The UI does not change.

**Fields we'll need to find / map in Phase 2:**

- Job queue per machine center (current + upcoming jobs).
- Sheets-needed per line-item run.
- Sheets-completed per line-item run / per machine.
- Sheets-received per line-item run / per machine.
- Waste sheets per line-item run / per station.
- Routing completion status.
- Issue notes per line-item run.
- Customer / job metadata (name, due date, line-item description).
- Operator/user mapping to hub user accounts.

## Permissions

Phase 1: only authenticated supervisor accounts can use the expand-modal quick actions (Start / Pause / Resume / Complete / Log waste / Note issue / Mark PM done) and edit `/floor/setup`. All authenticated users can view `/floor`, `/floor/handoff`, `/floor/history`. The supervisor-only model is acknowledged as a stop-gap; long-term we want operator activity in Knack to drive events automatically.

## Testing

- **Unit (vitest).** PM status calculator (cadence_days + last_done_at → status); shift-session resolver (now → which shift session); event-feed grouping for recap; % over calculator (zero-needed, over, missing data).
- **Component (vitest + RTL).** Station tile per status; expand modal renders all sections; bench drag-to-assign updates state; tasks pool open/done flow; events feed sorting + pulse-on-new.
- **E2E (Playwright).** Open `/floor` mid-shift, log job_started + pause + complete, verify event feed and per-station summary; advance clock to next shift, verify new session; visit `/floor/handoff?shift=previous`, verify recap matches events.
- **Manual.** Real-TV check before declaring Phase 1 done — type sizes, colors, and tile density only validate on hardware.

## Phasing summary

- **Phase 1 — UI + hub data.** Everything in this doc, with Knack-sourced fields stubbed behind the mapping layer.
- **Phase 2 — Knack wiring.** Find each field above, replace mocks one by one.
- **Phase 3 — Operator-driven events.** Hook into operator activity in Knack so events appear without supervisor input. Revisit permissions at that point.
- **Phase 4+ (later).** Usage-based PM, mobile remote surface, webhooks/push, dashboard auto-rotation across multiple TVs, etc.

## Open questions deferred to implementation

- Exact Tailwind/CSS-var implementation of the `floor-*` type scale.
- Whether `task_pool_assignments` is its own table or folded into `task_pool`.
- Refresh strategy beyond polling (SSE / Supabase Realtime) — defer until Phase 2 reveals constraints.
