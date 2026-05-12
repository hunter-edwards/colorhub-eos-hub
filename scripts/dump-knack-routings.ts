/**
 * One-off exploration script: dump Knack object_5 (routings) field
 * metadata and a handful of sample records. Used to discover field IDs
 * for the Floor Phase 2 wiring. Not part of the app build.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/dump-knack-routings.ts
 *
 * Writes:
 *   /tmp/knack-object_5-fields.json
 *   /tmp/knack-object_5-sample.json
 */

import { writeFile } from 'node:fs/promises';

const APP_ID = process.env.KNACK_APP_ID;
const API_KEY = process.env.KNACK_API_KEY;
if (!APP_ID || !API_KEY) {
  console.error('Missing KNACK_APP_ID or KNACK_API_KEY in env');
  process.exit(1);
}

const BASE = 'https://api.knack.com/v1';
const HEADERS = {
  'X-Knack-Application-Id': APP_ID,
  'X-Knack-REST-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

async function get(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Knack ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log('Fetching object_5 field metadata...');
  const fields = (await get('/objects/object_5/fields')) as { fields: unknown[] };
  await writeFile('/tmp/knack-object_5-fields.json', JSON.stringify(fields, null, 2));
  console.log(`  -> /tmp/knack-object_5-fields.json (${fields.fields?.length ?? 0} fields)`);

  console.log('Fetching object_5 sample records (10)...');
  const sample = await get('/objects/object_5/records?rows_per_page=10&page=1');
  await writeFile('/tmp/knack-object_5-sample.json', JSON.stringify(sample, null, 2));
  console.log('  -> /tmp/knack-object_5-sample.json');

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
