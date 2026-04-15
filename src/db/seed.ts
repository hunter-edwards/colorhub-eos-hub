import { db } from './index';
import { teams } from './schema';

async function main() {
  try {
    const existing = await db.select().from(teams);
    if (existing.length === 0) {
      await db.insert(teams).values({ name: 'Colorhub' });
      console.log('Seeded Colorhub team.');
    } else {
      console.log('Team already exists, skipping.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}
main();
