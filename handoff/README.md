# Handoff artifacts

One-time artifacts captured when Hunter Edwards left ColorHub on 2026-05-14.
See [`../HANDOFF.md`](../HANDOFF.md) for the full setup walkthrough.

## Files

- `db-snapshot-2026-05-14.sql` — `pg_dump` of the production Supabase
  database (public schema only). Auth users are not included because
  Supabase manages the `auth.*` schema and it is project-scoped;
  recreate users via signup or `npm run db:seed` after restoring.

## Restoring the dump

Run these from the repo root after creating a fresh Supabase (or other
Postgres) project and setting `DATABASE_URL` in `.env.local`:

```bash
# 1. Apply Drizzle migrations to create the schema.
npm run db:migrate

# 2. Restore the data dump on top of the empty schema.
#    The dump uses --clean --if-exists, so it drops and recreates tables.
psql "$DATABASE_URL" -f handoff/db-snapshot-2026-05-14.sql
```

If you only want the schema (no real data), skip step 2 and run
`npm run db:seed` instead for a minimal starter dataset.
