CREATE TYPE "public"."rock_activity_kind" AS ENUM('status_change', 'progress', 'comment', 'subtask', 'mention');--> statement-breakpoint
CREATE TYPE "public"."rock_status" AS ENUM('on_track', 'off_track', 'done');--> statement-breakpoint
CREATE TABLE "rock_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rock_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"kind" "rock_activity_kind" NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rock_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rock_id" uuid NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"due_date" date,
	"order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"owner_id" uuid NOT NULL,
	"quarter" text NOT NULL,
	"status" "rock_status" DEFAULT 'on_track' NOT NULL,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rock_activity" ADD CONSTRAINT "rock_activity_rock_id_rocks_id_fk" FOREIGN KEY ("rock_id") REFERENCES "public"."rocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rock_activity" ADD CONSTRAINT "rock_activity_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rock_subtasks" ADD CONSTRAINT "rock_subtasks_rock_id_rocks_id_fk" FOREIGN KEY ("rock_id") REFERENCES "public"."rocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rocks" ADD CONSTRAINT "rocks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rocks" ADD CONSTRAINT "rocks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;