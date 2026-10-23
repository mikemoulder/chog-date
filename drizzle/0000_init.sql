CREATE TABLE "chog_state" (
	"token_id" integer PRIMARY KEY NOT NULL,
	"claimed_by" text,
	"claimed_at" timestamp with time zone,
	"mode" text DEFAULT 'autopilot' NOT NULL,
	"bio" text,
	"persona" jsonb,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "couples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"a_token" integer NOT NULL,
	"b_token" integer NOT NULL,
	"stage" text DEFAULT 'matched' NOT NULL,
	"chemistry" real DEFAULT 30 NOT NULL,
	"dates" integer DEFAULT 0 NOT NULL,
	"session_started_at" timestamp with time zone,
	"last_date_ended_at" timestamp with time zone,
	"unmask_a" text,
	"unmask_b" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" integer NOT NULL,
	"kind" text NOT NULL,
	"other_token" integer,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"date_index" integer NOT NULL,
	"sender_token" integer NOT NULL,
	"body" text NOT NULL,
	"author" text NOT NULL,
	"chemistry_delta" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swipes" (
	"from_token" integer NOT NULL,
	"to_token" integer NOT NULL,
	"liked" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "swipes_from_token_to_token_pk" PRIMARY KEY("from_token","to_token")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "couples_pair_idx" ON "couples" USING btree ("a_token","b_token");--> statement-breakpoint
CREATE INDEX "couples_b_idx" ON "couples" USING btree ("b_token");--> statement-breakpoint
CREATE INDEX "events_token_idx" ON "events" USING btree ("token_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_couple_idx" ON "messages" USING btree ("couple_id","created_at");--> statement-breakpoint
CREATE INDEX "swipes_to_idx" ON "swipes" USING btree ("to_token");