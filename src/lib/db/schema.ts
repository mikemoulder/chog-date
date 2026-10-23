import { boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// One row per Chog that has been touched (claimed, or had a bio generated).
export const chogState = pgTable("chog_state", {
  tokenId: integer("token_id").primaryKey(),
  claimedBy: text("claimed_by"), // lowercase address of the holder who signed in as this Chog
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  mode: text("mode").notNull().default("autopilot"),
  bio: text("bio"),
  persona: jsonb("persona"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const swipes = pgTable(
  "swipes",
  {
    fromToken: integer("from_token").notNull(),
    toToken: integer("to_token").notNull(),
    liked: boolean("liked").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.fromToken, t.toToken] }), index("swipes_to_idx").on(t.toToken)],
);

// aToken < bToken always, so a pair has exactly one row.
export const couples = pgTable(
  "couples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    aToken: integer("a_token").notNull(),
    bToken: integer("b_token").notNull(),
    stage: text("stage").notNull().default("matched"),
    chemistry: real("chemistry").notNull().default(30),
    dates: integer("dates").notNull().default(0),
    sessionStartedAt: timestamp("session_started_at", { withTimezone: true }),
    lastDateEndedAt: timestamp("last_date_ended_at", { withTimezone: true }),
    venue: text("venue"), // set by a $CHOG candlelit dinner; cleared when that date ends
    unmaskA: text("unmask_a"), // handle the owner of A chose to reveal
    unmaskB: text("unmask_b"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("couples_pair_idx").on(t.aToken, t.bToken), index("couples_b_idx").on(t.bToken)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coupleId: uuid("couple_id").notNull(),
    dateIndex: integer("date_index").notNull(),
    senderToken: integer("sender_token").notNull(),
    body: text("body").notNull(),
    author: text("author").notNull(), // human | ai
    chemistryDelta: real("chemistry_delta").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_couple_idx").on(t.coupleId, t.createdAt)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenId: integer("token_id").notNull(),
    kind: text("kind").notNull(),
    otherToken: integer("other_token"),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_token_idx").on(t.tokenId, t.createdAt)],
);

// $CHOG gifts: 90% to the receiving Chog's holder, 10% to the builder, in two transfers.
// Both tx hashes are unique, so a transfer can only ever pay for one gift.
export const gifts = pgTable(
  "gifts",
  {
    txHash: text("tx_hash").primaryKey(), // the transfer to the holder
    builderTx: text("builder_tx").unique(), // the transfer to the builder
    kind: text("kind").notNull(), // rose | dinner | superlike
    fromToken: integer("from_token").notNull(),
    toToken: integer("to_token").notNull(),
    coupleId: uuid("couple_id"),
    amount: text("amount").notNull(), // whole $CHOG, the full price
    holder: text("holder"), // the address that received the 90%
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("gifts_to_idx").on(t.toToken)],
);
