# Team Handoff Package Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Produce a self-contained handoff package (`HANDOFF.md`, updated `.env.example`, `handoff/` folder with a DB dump) so the next technical owner can re-deploy `colorhub-eos-hub` from scratch on their own infrastructure.

**Architecture:** Documentation + data. No application code changes. Three new/updated files at the repo root and one new folder. The database dump is captured once via `pg_dump` against the current production Supabase, then committed.

**Tech Stack:** Markdown docs, `pg_dump` (Postgres client tools), git.

**Design doc:** `docs/plans/2026-05-14-team-handoff-design.md`

---

## Task 1: Update `.env.example` with full documentation

**Files:**
- Modify: `.env.example`

**Step 1: Read the current file**

Run: `cat .env.example`

Expected: 12-line file with bare key=value pairs and minimal comments.

**Step 2: Rewrite the file with documentation**

Replace the entire file contents with:

```
# Environment variables for colorhub-eos-hub.
#
# Copy this file to .env.local for local development, and set the same
# values in your hosting provider (Vercel project settings, Fly secrets,
# etc.) for production. See HANDOFF.md for the full setup walkthrough.

# --- Supabase (auth + Postgres) -----------------------------------------
# Create a project at https://supabase.com → Settings → API.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Server-only. Never expose to the browser. Same page as the keys above.
SUPABASE_SERVICE_ROLE_KEY=

# Postgres connection string. Supabase → Settings → Database → Connection
# string (use the "Transaction" / pooled URL for serverless deployments).
DATABASE_URL=

# --- Public site URL ----------------------------------------------------
# Used to build links in Teams messages and Supabase magic-link emails.
# Local dev: http://localhost:3000
# Prod: your deployed origin, e.g. https://colorhub-eos-hub.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# --- Knack (production floor data for /floor) ---------------------------
# Get from the company's Knack builder → Settings → API & Code.
# Required for the /floor dashboard; everything else works without it.
KNACK_APP_ID=
KNACK_API_KEY=

# --- Cron secret --------------------------------------------------------
# Any random string. Used to authenticate the Knack sync endpoint when
# called by a scheduler. Generate with: `openssl rand -hex 32`.
CRON_SECRET=

# --- Anthropic (optional, dev-only) -------------------------------------
# Only used by scripts/dump-knack-routings.ts and other dev tooling.
# The app does not require this to run. Use your own key.
ANTHROPIC_API_KEY=
```

**Step 3: Verify the file**

Run: `wc -l .env.example && grep -c '^[A-Z]' .env.example`

Expected: ~35 lines, 9 env var assignments (count of lines starting with uppercase letter).

**Step 4: Commit**

```bash
git add .env.example
git commit -m "docs: expand .env.example with sources and CRON_SECRET"
```

---

## Task 2: Capture database dump

> **Note:** This task requires the production `DATABASE_URL` and the Postgres client (`pg_dump`). Hunter must run this locally, not Claude. Claude's role here is to verify the result and check it in.

**Files:**
- Create: `handoff/db-snapshot-2026-05-14.sql`

**Step 1: Verify `pg_dump` is installed**

Run: `pg_dump --version`

Expected: `pg_dump (PostgreSQL) 15.x` or newer. If missing, install via `brew install libpq && brew link --force libpq`.

**Step 2: Create the handoff folder**

Run: `mkdir -p handoff`

Expected: folder created, no output.

**Step 3: Pull `DATABASE_URL` from `.env.local`**

Run: `grep '^DATABASE_URL=' .env.local`

Expected: one line with the Supabase Postgres URL. Do **not** echo this into the plan or commit it.

**Step 4: Dump the public schema**

Run (substituting `$DATABASE_URL` with the value from step 3, or `source .env.local && ` first):

```bash
pg_dump "$DATABASE_URL" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file=handoff/db-snapshot-2026-05-14.sql
```

Expected: file created, no errors. Auth schema is excluded (Supabase-managed, won't restore cleanly anywhere else).

**Step 5: Sanity-check the dump**

Run: `wc -l handoff/db-snapshot-2026-05-14.sql && head -20 handoff/db-snapshot-2026-05-14.sql && grep -c 'COPY public' handoff/db-snapshot-2026-05-14.sql`

Expected:
- Non-zero line count (likely a few thousand lines).
- Header showing `-- PostgreSQL database dump`.
- At least one `COPY public.<table>` block per data-bearing table (teams, users, rocks, scorecard_*, knack_routings_snapshot, etc.).

**Step 6: Scan for accidental secrets**

Run: `grep -iE '(api[_-]?key|secret|password|token|bearer)' handoff/db-snapshot-2026-05-14.sql | head -20`

Expected: no real secret values. If anything looks like a live credential, stop and discuss before committing.

**Step 7: Check file size and gzip if large**

Run: `ls -lh handoff/db-snapshot-2026-05-14.sql`

If the file is larger than ~10 MB:

```bash
gzip handoff/db-snapshot-2026-05-14.sql
```

Then update Task 3 paths to use `.sql.gz`.

**Step 8: Commit**

```bash
git add handoff/db-snapshot-2026-05-14.sql
git commit -m "chore(handoff): add 2026-05-14 production db snapshot"
```

---

## Task 3: Write `handoff/README.md`

**Files:**
- Create: `handoff/README.md`

**Step 1: Write the file**

```markdown
# Handoff artifacts

One-time artifacts captured when Hunter Edwards left ColorHub on 2026-05-14.
See `../HANDOFF.md` for the full setup walkthrough.

## Files

- `db-snapshot-2026-05-14.sql` — `pg_dump` of the production Supabase
  database (public schema only). Auth users are not included because
  Supabase manages the `auth.*` schema; recreate users via signup or
  `npm run db:seed` after restoring.

## Restoring the dump

Run these from the repo root after creating a fresh Supabase (or other
Postgres) project and setting `DATABASE_URL` in `.env.local`:

```bash
# 1. Apply Drizzle migrations to create the schema.
npm run db:migrate

# 2. Restore the data dump on top of the empty schema.
#    The dump uses --clean --if-exists, so it drops + recreates tables.
psql "$DATABASE_URL" -f handoff/db-snapshot-2026-05-14.sql
```

If you only want the schema (no real data), skip step 2 and run
`npm run db:seed` instead for a minimal starter dataset.
```

**Step 2: Verify the file**

Run: `cat handoff/README.md | head -5`

Expected: title line and intro paragraph render as expected.

**Step 3: Commit**

```bash
git add handoff/README.md
git commit -m "docs(handoff): add README explaining db snapshot and restore"
```

---

## Task 4: Write `HANDOFF.md` at repo root

**Files:**
- Create: `HANDOFF.md`

**Step 1: Write the file**

```markdown
# Handoff

Written 2026-05-14 by Hunter Edwards. This document is the entry point
for the next technical owner of `colorhub-eos-hub`. It assumes you are
a technical person using Claude Code, starting from zero.

## What this app is

A Next.js app for ColorHub Print that combines two things:

1. **EOS hub** — Rocks, Scorecard, Issues, Todos, People, VTO, Quarterly
   Review, and Meeting tooling. Built around the Entrepreneurial Operating
   System (Traction) framework.
2. **`/floor` Shift Huddle Dashboard** — A TV-scaled production-floor
   dashboard with 8 station tiles, drag-to-assign people bench, and a
   live events feed. Polls Knack (`object_5` routings) every ~30s.

See `AGENTS.md` for the high-level architecture and `docs/plans/` for
historical design and implementation notes (especially the two
`floor-*` docs from 2026-05-07 and 2026-05-08).

## Status at handoff

- Deployed on Hunter's personal Vercel (free tier) at the project's
  `*.vercel.app` URL.
- Database + auth on Hunter's personal Supabase (free tier).
- Source on Hunter's personal GitHub.
- Free tiers will likely keep the app running for a while after Hunter
  leaves, but that is best-effort, not guaranteed.
- The team is not actively using EOS meetings as of the handoff date.
- The most recently shipped feature is the `/floor` Knack integration
  (Phase 2, merged via PR #35).

When you decide to take ownership, plan to re-deploy on your own
accounts rather than trying to recover Hunter's. The data snapshot in
`handoff/` covers the only piece you can't get back from git.

## Quick start with Claude Code

1. Clone this repo to your machine.
2. Open it in Claude Code (or your editor of choice).
3. Ask Claude Code: *"Read HANDOFF.md and help me set this app up
   locally."*
4. Work through "Step-by-step setup" below with Claude's help. The doc
   is written so Claude can execute most steps for you.

## What you need before you start

- A GitHub account (to host the repo going forward).
- A hosting account for the app — Vercel is the path of least
  resistance because the app is already configured for it, but
  anything that runs Next.js works (Fly, Render, self-hosted, etc.).
- A Postgres provider — Supabase is the path of least resistance
  because it also provides the auth layer the app depends on. If you
  switch away from Supabase, the auth code will need to be reworked.
- From the company: the Knack App ID and API key for the production
  Knack builder. Required only if you want `/floor` to show real data.

## Step-by-step setup

### 1. Local dev environment

```bash
git clone <your-fork-url> colorhub-eos-hub
cd colorhub-eos-hub
npm install
cp .env.example .env.local
```

Then fill in `.env.local`. See `.env.example` for descriptions and
sources for each value.

### 2. Create a Supabase project

1. Sign up at https://supabase.com and create a new project.
2. Copy the project URL, anon key, and service role key from
   Settings → API into `.env.local`.
3. Copy the pooled Postgres connection string from
   Settings → Database → Connection string into `DATABASE_URL`.

### 3. Apply the schema and (optionally) restore data

```bash
# Create the tables from Drizzle migrations:
npm run db:migrate

# Either: restore the snapshot from when Hunter left
psql "$DATABASE_URL" -f handoff/db-snapshot-2026-05-14.sql

# Or: start fresh with a minimal seed
npm run db:seed
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Sign up at `/login` to create your first
user (Supabase Auth handles this).

### 5. Deploy

For Vercel:

1. Create a new Vercel project pointing at your GitHub fork.
2. Copy every variable from your `.env.local` into the Vercel project
   settings → Environment Variables.
3. Set `NEXT_PUBLIC_SITE_URL` to your deployed origin (e.g.
   `https://your-project.vercel.app`).
4. Trigger a deploy.

For another host: ensure Node 20+ is available, run `npm run build`
then `npm run start`, and proxy a domain to port 3000.

### 6. (Optional) Wire up Knack sync

The `/floor` dashboard polls Knack on demand whenever the page loads
and the snapshot is older than 30s. That is sufficient on its own.

If you want stronger guarantees (e.g. a once-per-minute refresh even
when nobody is looking at the page), set up a scheduler (Vercel Cron
on a Pro plan, a GitHub Actions schedule, an external cron service)
to hit `POST /api/floor/sync` with the header
`Authorization: Bearer $CRON_SECRET`. The Hobby-plan cron config was
removed in commit 944c0b0 because Vercel Hobby doesn't support it.

## Architecture pointers

- `AGENTS.md` — project-wide conventions and a note that this Next.js
  has breaking changes from public Next.js docs; always check
  `node_modules/next/dist/docs/`.
- `src/db/schema.ts` — Drizzle schema. Source of truth for tables.
- `src/app/(app)/` — authenticated app routes (rocks, scorecard, etc.).
- `src/app/(app)/floor/` — the Shift Huddle Dashboard UI.
- `src/server/floor-knack.ts` — reads from the snapshot table.
- `src/server/floor-knack-sync.ts` — fetches from Knack and replaces
  the snapshot.
- `src/app/api/floor/sync/` — the HTTP entry point for the sync job.
- `docs/plans/2026-05-08-floor-phase-2-knack-wiring-design.md` — the
  most useful single document for understanding the Knack integration,
  including the Knack field map.

## Known gotchas

- **Vercel Hobby plan has no cron.** That's why `vercel.json` doesn't
  define one. The `/floor` route triggers an on-demand sync when the
  snapshot is stale. If you're on Vercel Pro, you can add a cron entry
  back; on any plan, an external scheduler hitting the sync endpoint
  with the `CRON_SECRET` header also works.
- **`.claude/worktrees/` is gitignored.** That folder is local agent
  scratch space. Safe to delete; do not commit it.
- **Auth users don't transfer.** The `db-snapshot-*.sql` covers the
  `public` schema only. Supabase Auth lives in `auth.*` and is
  project-scoped. After restoring the dump, the row in `public.users`
  references an `auth.users` row that no longer exists; sign up the
  same email addresses in the new Supabase project, then update the
  `public.users.id` values to match the new `auth.users.id` values.
  Easiest path: re-seed the small users table with `npm run db:seed`
  after the rest of the restore.
- **Knack credentials.** Rotate them after the handoff. The values
  Hunter used were in his Vercel project settings and not committed
  anywhere.
- **Anthropic API key.** Not in this handoff. The app does not need
  it. If you want to use the dev scripts in `scripts/` that call
  Anthropic, supply your own key.

## Questions for Hunter

If something in this doc is wrong or unclear and Hunter is still
reachable, ask. Otherwise: trust the code, trust git history
(`git log`, `git blame`), and `docs/plans/` is the next-best source
of truth.
```

**Step 2: Verify the file**

Run: `wc -l HANDOFF.md && grep -c '^##' HANDOFF.md`

Expected: 150+ lines, 7+ top-level section headers.

**Step 3: Commit**

```bash
git add HANDOFF.md
git commit -m "docs: add HANDOFF.md for the next technical owner"
```

---

## Task 5: Final verification

**Step 1: Confirm the package is complete**

Run: `ls -la HANDOFF.md .env.example handoff/`

Expected output includes:
- `HANDOFF.md`
- `.env.example` (modified)
- `handoff/README.md`
- `handoff/db-snapshot-2026-05-14.sql` (or `.sql.gz`)

**Step 2: Re-scan the staged changes for accidental secrets one more time**

Run: `git log --since=2026-05-14 --name-only --pretty=format: | sort -u | xargs grep -lE '(eyJ[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|postgres://[^@]+@)' 2>/dev/null`

Expected: empty output. Any hit here is a secret that needs to be removed before pushing.

**Step 3: Open a PR**

```bash
git push -u origin claude/serene-hertz-efaff7
gh pr create --title "docs: team handoff package" --body "$(cat <<'EOF'
## Summary
- Adds `HANDOFF.md` at repo root — entry point for the next technical owner.
- Expands `.env.example` with sources and the missing `CRON_SECRET`.
- Adds `handoff/` with a one-time production db snapshot and restore instructions.

Implements the design in `docs/plans/2026-05-14-team-handoff-design.md`.

## Test plan
- [ ] Restore `handoff/db-snapshot-2026-05-14.sql` into a fresh local Postgres and confirm `npm run dev` works end-to-end.
- [ ] Skim `HANDOFF.md` cold — does someone unfamiliar with the project know what to do?
- [ ] Confirm no secrets in the diff.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.
