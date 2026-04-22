CREATE TYPE "public"."user_role" AS ENUM('admin', 'leader', 'member');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'member' NOT NULL;