CREATE TYPE "public"."meeting_status" AS ENUM('draft', 'live', 'concluded');--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "status" "meeting_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "cascading_message" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "previous_cascading_message" text;--> statement-breakpoint
UPDATE "meetings" SET "status" = 'concluded' WHERE "ended_at" IS NOT NULL;--> statement-breakpoint
UPDATE "meetings" SET "status" = 'live' WHERE "ended_at" IS NULL;