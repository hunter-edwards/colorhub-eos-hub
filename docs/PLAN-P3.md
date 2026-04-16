# Colorhub EOS Hub — Phase 3 (P3) Polish & Features

**Goal:** Improve UX, add missing coverage, and build advanced EOS features.

---

## Quick Wins

### 19.1 — Wire UserAvatar everywhere
Add `<UserAvatar>` to: rock cards, todo owners, meeting panels (rock review, scorecard, todo review, IDS), meeting history attendees. ~10 locations.

### 19.2 — Rename middleware.ts → proxy.ts
Next 16 deprecation warning. Must happen before Next 17.

### 19.3 — Performance indexes
Add indexes: `core_values(team_id)`, `seats(team_id)`, `people_ratings(subject_id, quarter)`, `processes(team_id)`, `rocks(quarter)`, `rock_activity(rock_id, created_at)`, `todos(status, owner_id)`.

### 19.4 — Update E2E smoke test
Add 6 new routes to Playwright smoke test: `/core-values`, `/vto`, `/accountability`, `/people`, `/processes`, `/settings` (profile).

---

## Medium Effort

### 20.1 — Mobile responsive nav
Sheet-based mobile menu. Hamburger button visible < 768px, sidebar hidden on mobile.

### 20.2 — P2 server action tests
Unit tests for: core-values (CRUD + reorder), vto (upsert), accountability (tree ops), people-analyzer (rating upsert), processes (CRUD).

### 20.3 — Drag-and-drop reordering
Replace arrow buttons with dnd-kit for: core values, process steps, accountability seats.

---

## Features

### 21.1 — Data visualization
Scorecard trends line chart (13 weeks), rock completion rate bar chart, meeting rating trend. Use recharts.

### 21.2 — Quarterly review workflow
Guided flow: review rocks → review people analyzer → update V/TO → set next quarter rocks. Page at `/quarterly-review`.

### 21.3 — Export/Print
V/TO as printable page (CSS print styles). People Analyzer as printable matrix.

---

## Implementation order

| Phase | What | Approach |
|-------|------|----------|
| 19.1-19.4 | Quick wins | Parallel agents |
| 20.1-20.3 | Medium | Parallel agents |
| 21.1-21.3 | Features | Parallel agents |
