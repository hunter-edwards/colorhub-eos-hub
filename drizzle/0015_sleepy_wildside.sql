CREATE TABLE "knack_routings_snapshot" (
	"knack_record_id" text PRIMARY KEY NOT NULL,
	"knack_run_id" text,
	"job_number" text,
	"customer" text,
	"item_name" text,
	"routing_step" text NOT NULL,
	"station_key" text NOT NULL,
	"complete" boolean NOT NULL,
	"art_ready" boolean NOT NULL,
	"material_ready" boolean NOT NULL,
	"routing_is_ready" boolean NOT NULL,
	"production_priority" integer,
	"high_priority" boolean DEFAULT false NOT NULL,
	"sheets_needed" integer,
	"sheets_produced" integer,
	"sheets_received" integer,
	"waste_external" integer,
	"waste_internal" integer,
	"issue_notes" text,
	"wc_notes_to_prod" text,
	"wc_notes_by_prod" text,
	"run_due_date" date,
	"routing_complete_at" timestamp,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knack_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"fetched" integer,
	"inserted" integer,
	"hidden_skipped" integer,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE INDEX "idx_routings_station_priority" ON "knack_routings_snapshot" USING btree ("station_key","production_priority");--> statement-breakpoint
CREATE INDEX "idx_routings_complete" ON "knack_routings_snapshot" USING btree ("complete");