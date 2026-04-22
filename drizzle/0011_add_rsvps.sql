CREATE TYPE "public"."rsvp_status" AS ENUM('attending', 'declined', 'tentative');--> statement-breakpoint
CREATE TABLE "meeting_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "rsvp_status" DEFAULT 'tentative' NOT NULL,
	"responded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_rsvps_meeting_user_unique" UNIQUE("meeting_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "meeting_rsvps" ADD CONSTRAINT "meeting_rsvps_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_rsvps" ADD CONSTRAINT "meeting_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;