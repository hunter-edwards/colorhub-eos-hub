CREATE TABLE "team_settings" (
	"team_id" uuid PRIMARY KEY NOT NULL,
	"teams_webhook_url" text
);
--> statement-breakpoint
ALTER TABLE "team_settings" ADD CONSTRAINT "team_settings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;