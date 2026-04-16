CREATE TYPE "public"."people_rating_value" AS ENUM('plus', 'plus_minus', 'minus');--> statement-breakpoint
CREATE TABLE "core_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"core_value_id" uuid,
	"gwc_field" text,
	"rating" "people_rating_value" NOT NULL,
	"quarter" text NOT NULL,
	CONSTRAINT "people_ratings_subject_value_quarter_unique" UNIQUE("subject_id","core_value_id","gwc_field","quarter")
);
--> statement-breakpoint
CREATE TABLE "processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" text NOT NULL,
	"owner_id" uuid,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" text NOT NULL,
	"roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"parent_seat_id" uuid,
	"person_id" uuid,
	"gwc_gets_it" boolean,
	"gwc_wants_it" boolean,
	"gwc_capacity" boolean,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"core_focus_purpose" text,
	"core_focus_niche" text,
	"ten_year_target" text,
	"marketing_strategy_target_market" text,
	"marketing_strategy_uniques" jsonb,
	"marketing_strategy_proven_process" text,
	"marketing_strategy_guarantee" text,
	"three_year_picture_date" date,
	"three_year_picture_revenue" text,
	"three_year_picture_profit" text,
	"three_year_picture_measurables" jsonb,
	"one_year_plan_date" date,
	"one_year_plan_revenue" text,
	"one_year_plan_profit" text,
	"one_year_plan_goals" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vto_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_color" text;--> statement-breakpoint
ALTER TABLE "core_values" ADD CONSTRAINT "core_values_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_ratings" ADD CONSTRAINT "people_ratings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_ratings" ADD CONSTRAINT "people_ratings_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_ratings" ADD CONSTRAINT "people_ratings_core_value_id_core_values_id_fk" FOREIGN KEY ("core_value_id") REFERENCES "public"."core_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processes" ADD CONSTRAINT "processes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processes" ADD CONSTRAINT "processes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_person_id_users_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vto" ADD CONSTRAINT "vto_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;