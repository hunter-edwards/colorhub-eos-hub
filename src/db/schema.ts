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

export const todoStatus = pgEnum('todo_status', ['open', 'done']);
export const issueList = pgEnum('issue_list', ['short_term', 'long_term']);
export const issueStatus = pgEnum('issue_status', ['open', 'solved', 'dropped']);
export const headlineKind = pgEnum('headline_kind', ['customer', 'employee']);

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  title: text('title').notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  dueDate: date('due_date').notNull(),
  status: todoStatus('status').notNull().default('open'),
  sourceMeetingId: uuid('source_meeting_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const issues = pgTable('issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  title: text('title').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id),
  list: issueList('list').notNull().default('short_term'),
  status: issueStatus('status').notNull().default('open'),
  solvedAt: timestamp('solved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const headlines = pgTable('headlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').notNull(),
  kind: headlineKind('kind').notNull(),
  text: text('text').notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scorecardComparator = pgEnum('scorecard_comparator', ['gte', 'lte', 'eq', 'range']);
export const meetingType = pgEnum('meeting_type', ['L10', 'quarterly', 'annual']);

export const scorecardMetrics = pgTable('scorecard_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  goal: numeric('goal'),
  comparator: scorecardComparator('comparator').notNull().default('gte'),
  goalMin: numeric('goal_min'),
  goalMax: numeric('goal_max'),
  unit: text('unit'),
  orderIdx: integer('order_idx').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const scorecardEntries = pgTable('scorecard_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricId: uuid('metric_id').references(() => scorecardMetrics.id, { onDelete: 'cascade' }).notNull(),
  weekStart: date('week_start').notNull(),
  value: numeric('value'),
  note: text('note'),
});

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  type: meetingType('type').notNull().default('L10'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  ratingAvg: numeric('rating_avg'),
  attendees: jsonb('attendees').notNull().default([]),
  aiSummaryMd: text('ai_summary_md'),
  teamsPostedAt: timestamp('teams_posted_at'),
});

export const meetingRatings = pgTable('meeting_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(),
});
