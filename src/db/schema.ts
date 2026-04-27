import { pgTable, uuid, text, timestamp, integer, numeric, date, boolean, pgEnum, jsonb, unique } from 'drizzle-orm/pg-core';

// Single team for now; team_id reserved for future multi-tenant.
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRole = pgEnum('user_role', ['admin', 'leader', 'member']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches auth.users.id from Supabase Auth
  teamId: uuid('team_id').references(() => teams.id),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  profileColor: text('profile_color'),
  role: userRole('role').notNull().default('member'),
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
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
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
  sourceMeetingId: uuid('source_meeting_id').references(() => meetings.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
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
  droppedAt: timestamp('dropped_at'),
  sourceMetricId: uuid('source_metric_id').references(() => scorecardMetrics.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const headlines = pgTable('headlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  kind: headlineKind('kind').notNull(),
  text: text('text').notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scorecardComparator = pgEnum('scorecard_comparator', ['gte', 'lte', 'eq', 'range']);
export const meetingType = pgEnum('meeting_type', ['L10', 'quarterly', 'annual']);
export const meetingStatus = pgEnum('meeting_status', ['draft', 'live', 'concluded']);

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
}, (t) => ({
  metricWeekUnique: unique('scorecard_entries_metric_week_unique').on(t.metricId, t.weekStart),
}));

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id),
  type: meetingType('type').notNull().default('L10'),
  status: meetingStatus('status').notNull().default('draft'),
  scheduledFor: timestamp('scheduled_for'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  ratingAvg: numeric('rating_avg'),
  attendees: jsonb('attendees').notNull().default([]),
  aiSummaryMd: text('ai_summary_md'),
  teamsPostedAt: timestamp('teams_posted_at'),
  cascadingMessage: text('cascading_message'),
  previousCascadingMessage: text('previous_cascading_message'),
});

export const rsvpStatus = pgEnum('rsvp_status', ['attending', 'declined', 'tentative']);

export const meetingRsvps = pgTable('meeting_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: rsvpStatus('status').notNull().default('tentative'),
  respondedAt: timestamp('responded_at').defaultNow().notNull(),
}, (t) => ({
  meetingUserUnique: unique('meeting_rsvps_meeting_user_unique').on(t.meetingId, t.userId),
}));

export const meetingRatings = pgTable('meeting_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(),
}, (t) => ({
  meetingUserUnique: unique('meeting_ratings_meeting_user_unique').on(t.meetingId, t.userId),
}));

export const teamSettings = pgTable('team_settings', {
  teamId: uuid('team_id').references(() => teams.id).primaryKey(),
  teamsWebhookUrl: text('teams_webhook_url'),
});

export const knackSyncLog = pgTable('knack_sync_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
  weeksUpdated: integer('weeks_updated').notNull(),
  weeksRequested: integer('weeks_requested').notNull(),
  durationMs: integer('duration_ms').notNull(),
  ok: boolean('ok').notNull(),
});

// --- Phase 13: User Profiles (profileColor added to users) ---

// Phase 14: Core Values
export const coreValues = pgTable('core_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  orderIdx: integer('order_idx').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

// Phase 15: V/TO
export const vto = pgTable('vto', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull().unique(),
  coreFocusPurpose: text('core_focus_purpose'),
  coreFocusNiche: text('core_focus_niche'),
  tenYearTarget: text('ten_year_target'),
  marketingStrategyTargetMarket: text('marketing_strategy_target_market'),
  marketingStrategyUniques: jsonb('marketing_strategy_uniques').$type<string[]>(),
  marketingStrategyProvenProcess: text('marketing_strategy_proven_process'),
  marketingStrategyGuarantee: text('marketing_strategy_guarantee'),
  threeYearPictureDate: date('three_year_picture_date'),
  threeYearPictureRevenue: text('three_year_picture_revenue'),
  threeYearPictureProfit: text('three_year_picture_profit'),
  threeYearPictureMeasurables: jsonb('three_year_picture_measurables').$type<string[]>(),
  oneYearPlanDate: date('one_year_plan_date'),
  oneYearPlanRevenue: text('one_year_plan_revenue'),
  oneYearPlanProfit: text('one_year_plan_profit'),
  oneYearPlanGoals: jsonb('one_year_plan_goals').$type<string[]>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Phase 16: Accountability Chart
export const seats = pgTable('seats', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  title: text('title').notNull(),
  roles: jsonb('roles').$type<string[]>().notNull().default([]),
  parentSeatId: uuid('parent_seat_id'),
  personId: uuid('person_id').references(() => users.id),
  gwcGetsIt: boolean('gwc_gets_it'),
  gwcWantsIt: boolean('gwc_wants_it'),
  gwcCapacity: boolean('gwc_capacity'),
  orderIdx: integer('order_idx').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Phase 17: People Analyzer
export const peopleRatingValue = pgEnum('people_rating_value', ['plus', 'plus_minus', 'minus']);

export const peopleRatings = pgTable('people_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  subjectId: uuid('subject_id').references(() => users.id).notNull(),
  coreValueId: uuid('core_value_id').references(() => coreValues.id),
  gwcField: text('gwc_field'),
  rating: peopleRatingValue('rating').notNull(),
  quarter: text('quarter').notNull(),
}, (t) => ({
  subjectValueQuarterUnique: unique('people_ratings_subject_value_quarter_unique')
    .on(t.subjectId, t.coreValueId, t.gwcField, t.quarter),
}));

// Phase 18: Process Documentation
export const processes = pgTable('processes', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  title: text('title').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  steps: jsonb('steps').$type<string[]>().notNull().default([]),
  description: text('description'),
  orderIdx: integer('order_idx').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});
