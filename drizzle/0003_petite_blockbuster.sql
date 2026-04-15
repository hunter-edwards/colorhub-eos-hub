CREATE TYPE "public"."meeting_type" AS ENUM('L10', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."scorecard_comparator" AS ENUM('gte', 'lte', 'eq', 'range');--> statement-breakpoint
CREATE TABLE "meeting_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"type" "meeting_type" DEFAULT 'L10' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"rating_avg" numeric,
	"attendees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_summary_md" text,
	"teams_posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scorecard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"value" numeric,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "scorecard_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"goal" numeric,
	"comparator" "scorecard_comparator" DEFAULT 'gte' NOT NULL,
	"goal_min" numeric,
	"goal_max" numeric,
	"unit" text,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_ratings" ADD CONSTRAINT "meeting_ratings_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_ratings" ADD CONSTRAINT "meeting_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_entries" ADD CONSTRAINT "scorecard_entries_metric_id_scorecard_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."scorecard_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_metrics" ADD CONSTRAINT "scorecard_metrics_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_metrics" ADD CONSTRAINT "scorecard_metrics_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;