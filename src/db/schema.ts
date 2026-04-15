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

export const rockStatus = pgEnum('rock_status', ['on_track', 'off_track', 'done']);
export const rockActivityKind = pgEnum('rock_activity_kind',
  ['status_change', 'progress', 'comment', 'subtask', 'mention']);

export const rocks = pgTable('rocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  title: text('title').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  quarter: text('quarter').notNull(), // e.g. '2026-Q2'
  status: rockStatus('status').notNull().default('on_track'),
  progressPct: integer('progress_pct').notNull().default(0),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rockSubtasks = pgTable('rock_subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  rockId: uuid('rock_id').references(() => rocks.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  dueDate: date('due_date'),
  orderIdx: integer('order_idx').notNull().default(0),
});

export const rockActivity = pgTable('rock_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  rockId: uuid('rock_id').references(() => rocks.id, { onDelete: 'cascade' }).notNull(),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  kind: rockActivityKind('kind').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
