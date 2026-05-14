# Team Handoff Package — Design

**Date:** 2026-05-14
**Status:** Approved design; ready for implementation plan
**Owner:** Hunter Edwards (outgoing)

## Purpose

Hunter is leaving ColorHub in a few days. The `colorhub-eos-hub` app currently runs on his personal Vercel, Supabase, and GitHub accounts, with secrets (database URL, Supabase keys) stored only in his Vercel project settings. The company is not actively using EOS meetings anymore and the new owner is unlikely to re-deploy soon — possibly months from now.

Goal: produce a self-contained handoff package so that, whenever the next technical owner picks this up, they can re-deploy from scratch on their own infrastructure without any access to Hunter's accounts.

## Scope

In scope:

- A top-level `HANDOFF.md` written for "technical person + Claude Code, starting cold."
- A documented `.env.example` listing every required and optional env var with a description and where to obtain the value.
- A one-time PostgreSQL data dump checked into `handoff/` so real configuration (teams, users, stations, PM schedules, etc.) can be restored.
- A small `handoff/README.md` explaining what each file in `handoff/` is and how to use it.

Out of scope:

- Transferring any account ownership (GitHub repo, Vercel project, Supabase project). Per decision, the new owner will create fresh accounts when they pick this up.
- Sharing Hunter's Anthropic API key. The app does not require it for normal operation; it is only used by `scripts/dump-knack-routings.ts` and any dev-time Claude tooling. The new owner will use their own key if they want those features.
- Sharing the current Knack API key. Company owns Knack independently and will rotate / replace the credential themselves.
- Continuous uptime guarantees. Free-tier Vercel + Supabase will likely keep running for a while after Hunter leaves, but that is best-effort, not part of this handoff.
- Code documentation beyond what already exists in `CLAUDE.md`, `AGENTS.md`, and `docs/plans/`.

## Environment variables (authoritative list)

Derived from `grep process.env src/`:

| Var | Required? | Source | Notes |
|---|---|---|---|
| `DATABASE_URL` | Required | Supabase project → Connection string (pooled) | Postgres URL used by Drizzle. |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project → Settings → API | Public, safe to expose. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Supabase project → Settings → API | Public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Supabase project → Settings → API | Server-only; never expose. |
| `KNACK_APP_ID` | Required for `/floor` | Knack builder → Settings → API | Company owns. |
| `KNACK_API_KEY` | Required for `/floor` | Knack builder → Settings → API | Company owns; rotate after handoff. |
| `CRON_SECRET` | Required if using cron sync | Any random string | Used to authenticate the Knack sync endpoint. |
| `NEXT_PUBLIC_SITE_URL` | Required | The deployed origin | Used for magic-link emails and Teams links. Defaults to `http://localhost:3000` for dev. |
| `ANTHROPIC_API_KEY` | Optional | Anthropic console | Only used by `scripts/dump-knack-routings.ts` / dev tooling. Not needed to run the app. |

The new owner generates fresh values for the Supabase keys (new project) and `CRON_SECRET`. Knack values come from the company's Knack account.

## Database dump

- One-time `pg_dump` of the current production Supabase database, captured before Hunter leaves.
- Format: plain SQL with `--no-owner --no-privileges` so it restores cleanly into any fresh Postgres instance.
- File: `handoff/db-snapshot-2026-05-14.sql` (committed to the repo).
- Auth users (`auth.users`) are owned by Supabase and will not transfer cleanly. Public schema only — the new owner will recreate auth users via Supabase signup or the seed script.
- Size sanity check before commit: if the dump is larger than ~10 MB, gzip it. Otherwise plain SQL is fine for diffability and Claude Code readability.

## HANDOFF.md structure

Single document at the repo root with these sections:

1. **What this app is** — one paragraph: EOS hub for ColorHub Print, plus the `/floor` Shift Huddle Dashboard that polls Knack.
2. **Status as of handoff** — what's deployed where right now, what's actively used vs dormant.
3. **What you need before you start** — accounts to create (GitHub, Vercel-or-equivalent, Supabase-or-equivalent), Knack credentials from the company.
4. **Quick start with Claude Code** — literally: clone the repo, open Claude Code, point it at this doc, tell it "help me set this up." The doc is written so Claude Code can execute the steps.
5. **Step-by-step setup** — clone → install → create Supabase project → run migrations → restore dump (or seed) → set env vars → deploy.
6. **Architecture pointers** — links into `AGENTS.md`, `docs/plans/`, and the key files for the Floor / Knack integration.
7. **Known gotchas** — Hobby-plan cron limitation (already removed from `vercel.json`), the polling-instead-of-cron fallback in the Floor sync, the worktrees in `.claude/` (gitignored, safe to ignore).

## .env.example updates

- Add a comment block at the top explaining the file's role in handoff.
- Add `CRON_SECRET` (currently missing).
- Add a comment on `ANTHROPIC_API_KEY` clarifying it is optional and dev-only.
- Add inline pointers (one-line each) for where to get each value.

## handoff/ folder

```
handoff/
  README.md              ← short index: what's here and how to use it
  db-snapshot-2026-05-14.sql   ← pg_dump output, public schema only
```

`README.md` notes:
- When the dump was taken.
- That it excludes `auth.*` (Supabase-managed).
- The exact command to restore it.
- The order: run Drizzle migrations first, then restore data (or vice versa — to be settled in the implementation plan after a dry run).

## Risk / failure modes

- **Dump won't restore cleanly into a fresh Postgres.** Mitigation: do a local dry-run restore as part of implementation. Adjust `pg_dump` flags if needed.
- **New owner can't get Knack credentials.** Out of scope per user; flagged in `HANDOFF.md` as a "ask company IT" step.
- **`HANDOFF.md` rots.** Acceptable risk — this is a single-use document; the new owner will likely rewrite it once they're set up.
- **Anthropic key accidentally committed.** Mitigation: scan staged files before committing. Already gitignored via `.env.local`.

## Success criteria

A technical person who has never seen this repo, with no access to Hunter's accounts, can clone the repo and — with Claude Code's help following `HANDOFF.md` — get a working local dev environment within an hour and a working deployment within a few hours.
