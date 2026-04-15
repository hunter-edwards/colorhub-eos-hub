import { pgTable, uuid, text, timestamp, integer, numeric, date, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Single team for now; team_id reserved for future multi-tenant.
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches auth.users.id from Supabase Auth
  teamId: uuid('team_id').references(() => teams.id),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
