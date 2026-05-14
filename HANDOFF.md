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

See `AGENTS.md` for project-wide conventions and `docs/plans/` for
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
removed in commit `944c0b0` because Vercel Hobby doesn't support it.

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
  project-scoped. After restoring the dump, the rows in `public.users`
  reference `auth.users` rows that no longer exist; sign up the same
  email addresses in the new Supabase project, then update the
  `public.users.id` values to match the new `auth.users.id` values.
  Easiest path: clear `public.users` and re-seed with `npm run db:seed`
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
