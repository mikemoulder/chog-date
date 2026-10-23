ALTER TABLE "gifts" ADD COLUMN "builder_tx" text;--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "holder" text;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_builder_tx_unique" UNIQUE("builder_tx");