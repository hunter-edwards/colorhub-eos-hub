CREATE TYPE "public"."headline_kind" AS ENUM('customer', 'employee');--> statement-breakpoint
CREATE TYPE "public"."issue_list" AS ENUM('short_term', 'long_term');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('open', 'solved', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."todo_status" AS ENUM('open', 'done');--> statement-breakpoint
CREATE TABLE "headlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"kind" "headline_kind" NOT NULL,
	"text" text NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"owner_id" uuid,
	"list" "issue_list" DEFAULT 'short_term' NOT NULL,
	"status" "issue_status" DEFAULT 'open' NOT NULL,
	"solved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"due_date" date NOT NULL,
	"status" "todo_status" DEFAULT 'open' NOT NULL,
	"source_meeting_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "headlines" ADD CONSTRAINT "headlines_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;