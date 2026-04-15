import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { teams } from './schema';

async function main() {
  const existing = await db.select().from(teams);
  if (existing.length === 0) {
    await db.insert(teams).values({ name: 'Colorhub' });
    console.log('Seeded Colorhub team.');
  } else {
    console.log('Team already exists, skipping.');
  }
  process.exit(0);
}
main();
