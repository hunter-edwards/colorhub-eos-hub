/**
 * One-time seed script: populates team members, core values, and accountability chart.
 * Run with: node --env-file=.env.local -e "require('tsx/cjs'); require('./src/db/seed-team.ts')"
 */
import { createClient } from '@supabase/supabase-js';
import { db } from './index';
import { users, teams, coreValues, seats } from './schema';
import { eq } from 'drizzle-orm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEAM_MEMBERS = [
  { name: 'Biak Hmun Sang', email: 'biak@colorhub.io', title: 'Production Associate', manager: 'Tyler Valentine' },
  { name: 'Cung Thang', email: 'cung@colorhub.io', title: 'Production Associate', manager: 'Tyler Valentine' },
  { name: 'Hunter Edwards', email: 'h.edwards.327@gmail.com', title: 'Operations and Account Coordinator', manager: 'Tim Harris' },
  { name: 'Javier Alvarez Lopez', email: 'javier@colorhub.io', title: 'Industrial Maintenance Mechanic/Production Lead', manager: 'Tim Harris' },
  { name: 'Jill Harris', email: 'jill@colorhub.io', title: 'Office Admin', manager: 'Tim Harris' },
  { name: 'Jonathan Sang', email: 'jonathan@colorhub.io', title: 'Die Cut Operator', manager: 'Tyler Valentine' },
  { name: 'Kyle Raduski', email: 'kyle@colorhub.io', title: 'Material Handler/Production Associate', manager: 'Tyler Valentine' },
  { name: 'Leigh Tamminga', email: 'leigh@colorhub.io', title: 'Production Associate', manager: 'Tyler Valentine' },
  { name: 'No Thang', email: 'no.thang@colorhub.io', title: 'Production Assistant', manager: 'Tyler Valentine' },
  { name: 'Tim Harris', email: 'tim@colorhub.io', title: 'CEO', manager: null },
  { name: 'Tyler Valentine', email: 'tyler@colorhub.io', title: 'Operations and Account Coordinator', manager: 'Tim Harris' },
  { name: 'Victor Fam-bawl', email: 'victor@colorhub.io', title: 'Production Assistant', manager: 'Tyler Valentine' },
  { name: 'Yoel Alvarez Pozo', email: 'yoel@colorhub.io', title: 'Production Associate', manager: 'Tyler Valentine' },
  { name: 'Ysaias Yerbes', email: 'ysaias@colorhub.io', title: 'Production Associate', manager: 'Tyler Valentine' },
];

const CORE_VALUES = [
  { title: 'Innovation', description: 'We push ourselves to think openly and dream daringly to embrace what\'s next in an ever-changing world.' },
  { title: 'Excellence', description: 'We strive for quality in all that we do, believing that good is not good enough.' },
  { title: 'Drive', description: 'We work hard to deliver outstanding results, fueled by a desire to succeed and flourish.' },
  { title: 'Collaboration', description: 'We leverage each other\'s strengths, coming together as a team to collaborate and celebrate.' },
  { title: 'Integrity', description: 'We don\'t cut corners. We believe what\'s right isn\'t always the same as what\'s easy.' },
  { title: 'Caring', description: 'We seek to serve each other, recognizing that we are real people with real lives, navigating the world with unique dreams and challenges.' },
];

async function main() {
  // Get team ID
  const [team] = await db.select().from(teams);
  if (!team) { console.error('No team found. Run seed.ts first.'); process.exit(1); }
  const teamId = team.id;
  console.log(`Team: ${team.name} (${teamId})`);

  // --- 1. Create/update users ---
  const userMap = new Map<string, string>(); // name → user id

  for (const member of TEAM_MEMBERS) {
    // Check if user already exists in our DB
    const [existing] = await db.select().from(users).where(eq(users.email, member.email));
    if (existing) {
      // Update name if not set
      if (!existing.name) {
        await db.update(users).set({ name: member.name }).where(eq(users.id, existing.id));
        console.log(`  Updated name: ${member.name}`);
      }
      userMap.set(member.name, existing.id);
      console.log(`  Exists: ${member.name} (${existing.id})`);
      continue;
    }

    // Create Supabase auth user (no password — they'll use magic link)
    const { data, error } = await supabase.auth.admin.createUser({
      email: member.email,
      email_confirm: true,
      user_metadata: { name: member.name },
    });

    if (error) {
      console.error(`  Failed to create auth user ${member.email}: ${error.message}`);
      continue;
    }

    const authId = data.user.id;

    // Insert into our users table
    await db.insert(users).values({
      id: authId,
      teamId,
      email: member.email,
      name: member.name,
    }).onConflictDoNothing();

    userMap.set(member.name, authId);
    console.log(`  Created: ${member.name} (${authId})`);
  }

  // --- 2. Seed core values ---
  const existingCVs = await db.select().from(coreValues).where(eq(coreValues.teamId, teamId));
  if (existingCVs.length > 0) {
    console.log(`\nCore values already exist (${existingCVs.length}), skipping.`);
  } else {
    for (let i = 0; i < CORE_VALUES.length; i++) {
      const cv = CORE_VALUES[i];
      await db.insert(coreValues).values({
        teamId,
        title: cv.title,
        description: cv.description,
        orderIdx: i,
      });
    }
    console.log(`\nInserted ${CORE_VALUES.length} core values.`);
  }

  // --- 3. Seed accountability chart (seats) ---
  const existingSeats = await db.select().from(seats).where(eq(seats.teamId, teamId));
  if (existingSeats.length > 0) {
    console.log(`Seats already exist (${existingSeats.length}), skipping.`);
  } else {
    // Create CEO seat first
    const timId = userMap.get('Tim Harris');
    const [ceoSeat] = await db.insert(seats).values({
      teamId,
      title: 'CEO',
      roles: ['Visionary', 'Strategic Leadership', 'Company Direction'],
      personId: timId,
      parentSeatId: null,
      orderIdx: 0,
    }).returning();
    console.log(`\nCreated seat: CEO`);

    // Create direct reports to CEO
    const ceoDirects = TEAM_MEMBERS.filter(m => m.manager === 'Tim Harris');
    const seatMap = new Map<string, string>(); // title → seat id
    seatMap.set('CEO', ceoSeat.id);

    for (let i = 0; i < ceoDirects.length; i++) {
      const m = ceoDirects[i];
      const personId = userMap.get(m.name);
      const [seat] = await db.insert(seats).values({
        teamId,
        title: m.title,
        roles: [],
        personId,
        parentSeatId: ceoSeat.id,
        orderIdx: i,
      }).returning();
      seatMap.set(m.title + ':' + m.name, seat.id);
      console.log(`  Created seat: ${m.title} (${m.name})`);
    }

    // Find Tyler's seat for his reports
    const tylerSeatId = [...seatMap.entries()].find(([k]) => k.includes('Tyler Valentine'))?.[1];

    if (tylerSeatId) {
      const tylerReports = TEAM_MEMBERS.filter(m => m.manager === 'Tyler Valentine');
      for (let i = 0; i < tylerReports.length; i++) {
        const m = tylerReports[i];
        const personId = userMap.get(m.name);
        await db.insert(seats).values({
          teamId,
          title: m.title,
          roles: [],
          personId,
          parentSeatId: tylerSeatId,
          orderIdx: i,
        });
        console.log(`    Created seat: ${m.title} (${m.name})`);
      }
    }

    console.log(`\nAccountability chart seeded.`);
  }

  console.log('\nDone!');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
