CREATE TYPE "public"."shift_event_kind" AS ENUM('job_started', 'job_paused', 'job_resumed', 'job_completed', 'pm_performed', 'issue_noted', 'waste_logged', 'task_completed', 'operator_moved', 'note');--> statement-breakpoint
CREATE TYPE "public"."station_kind" AS ENUM('printer', 'cad', 'rotary', 'gluer', 'handwork', 'shipping');--> statement-breakpoint
CREATE TYPE "public"."task_pool_source" AS ENUM('hub', 'eos_todo');--> statement-breakpoint
CREATE TYPE "public"."task_pool_status" AS ENUM('open', 'in_progress', 'done', 'archived');--> statement-breakpoint
CREATE TABLE "pm_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"label" text NOT NULL,
	"cadence_days" integer NOT NULL,
	"last_done_at" date
);
--> statement-breakpoint
CREATE TABLE "shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_session_id" uuid NOT NULL,
	"station_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "shift_assignments_shift_session_id_station_id_user_id_unique" UNIQUE("shift_session_id","station_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "shift_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_session_id" uuid NOT NULL,
	"station_id" uuid,
	"kind" "shift_event_kind" NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"recorded_by" uuid,
	"related_knack_job_id" text
);
--> statement-breakpoint
CREATE TABLE "shift_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"date" date NOT NULL,
	"shift_number" integer NOT NULL,
	"opened_by" uuid,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"handoff_notes" text,
	CONSTRAINT "shift_sessions_team_id_date_shift_number_unique" UNIQUE("team_id","date","shift_number")
);
--> statement-breakpoint
CREATE TABLE "station_default_operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "station_default_operators_station_id_user_id_unique" UNIQUE("station_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"name" text NOT NULL,
	"kind" "station_kind" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"group_label" text,
	"knack_machine_center_id" text,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"est_minutes" integer,
	"suggested_station_id" uuid,
	"status" "task_pool_status" DEFAULT 'open' NOT NULL,
	"source" "task_pool_source" DEFAULT 'hub' NOT NULL,
	"source_todo_id" uuid,
	"assigned_shift_session_id" uuid,
	"assigned_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pm_schedules" ADD CONSTRAINT "pm_schedules_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_session_id_shift_sessions_id_fk" FOREIGN KEY ("shift_session_id") REFERENCES "public"."shift_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_events" ADD CONSTRAINT "shift_events_shift_session_id_shift_sessions_id_fk" FOREIGN KEY ("shift_session_id") REFERENCES "public"."shift_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_events" ADD CONSTRAINT "shift_events_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_events" ADD CONSTRAINT "shift_events_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_default_operators" ADD CONSTRAINT "station_default_operators_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_default_operators" ADD CONSTRAINT "station_default_operators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_pool" ADD CONSTRAINT "task_pool_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_pool" ADD CONSTRAINT "task_pool_suggested_station_id_stations_id_fk" FOREIGN KEY ("suggested_station_id") REFERENCES "public"."stations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_pool" ADD CONSTRAINT "task_pool_source_todo_id_todos_id_fk" FOREIGN KEY ("source_todo_id") REFERENCES "public"."todos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_pool" ADD CONSTRAINT "task_pool_assigned_shift_session_id_shift_sessions_id_fk" FOREIGN KEY ("assigned_shift_session_id") REFERENCES "public"."shift_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_pool" ADD CONSTRAINT "task_pool_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;