CREATE TABLE "knack_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"weeks_updated" integer NOT NULL,
	"weeks_requested" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"ok" boolean NOT NULL
);
