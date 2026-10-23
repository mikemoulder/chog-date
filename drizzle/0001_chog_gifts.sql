CREATE TABLE "gifts" (
	"tx_hash" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"from_token" integer NOT NULL,
	"to_token" integer NOT NULL,
	"couple_id" uuid,
	"amount" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "couples" ADD COLUMN "venue" text;--> statement-breakpoint
CREATE INDEX "gifts_to_idx" ON "gifts" USING btree ("to_token");