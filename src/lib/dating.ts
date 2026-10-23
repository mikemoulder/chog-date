import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, ne, or, sql } from "drizzle-orm";
import { allChogs, seeded } from "./chogs";
import { compatibility } from "./compat";
import { getDb, schema } from "./db";
import { dateReply, scoreLine, suggestLines, summarizeDate, type DateContext, type Speaker } from "./llm";
import { aiRun, getProfile, getProfiles } from "./profiles";
import { ownerOf, tokensOf, verifyGiftPayment } from "./chain";
import { DINNER_VENUE, GIFTS, HOLDER_SHARE_BPS, splitGift, type GiftKind } from "./gifts";
import { HttpError } from "./http";
import { noDashes } from "./text";
import type { CoupleDetail, CoupleSummary, DeckCard, FeedEvent, Message, Mode, Profile, Stage } from "./types";

// The rules of Chog Date. Everything is keyed by token id, never by wallet:
// relationships belong to the NFT and move with it.

export const SWIPES_PER_DAY = 30;
export const DATE_LENGTH = 14; // texts per date (double texts count)
const COOLDOWN_MS = Number(process.env.DATE_COOLDOWN_HOURS ?? 12) * 3600_000;
const DECAY_AFTER_MS = 3 * 86400_000;

type CoupleRow = typeof schema.couples.$inferSelect;

const startOfDay = () => new Date(new Date().toISOString().slice(0, 10));
const pair = (x: number, y: number) => (x < y ? [x, y] : [y, x]) as [number, number];
const partnerOf = (c: CoupleRow, me: number) => (c.aToken === me ? c.bToken : c.aToken);

async function event(tokenId: number, kind: FeedEvent["kind"], text: string, otherToken?: number) {
  const db = await getDb();
  await db.insert(schema.events).values({ tokenId, kind, text, otherToken });
}

// ── Claiming ─────────────────────────────────────────────────────────────────

export type Handoff = { firstClaim: boolean; since?: string; events: FeedEvent[]; couples: number };

// A holder signs in as their Chog. If someone else held it before, or nobody ever did,
// the new holder inherits everything the Chog did while they were away.
export async function claim(tokenId: number, address: string): Promise<Handoff> {
  const db = await getDb();
  const [row] = await db.select().from(schema.chogState).where(eq(schema.chogState.tokenId, tokenId));
  const newHolder = row?.claimedBy !== address;
  const since = newHolder ? row?.claimedAt ?? null : row?.lastSeenAt ?? null;

  await db
    .insert(schema.chogState)
    .values({ tokenId, claimedBy: address, claimedAt: new Date(), mode: "copilot", lastSeenAt: new Date() })
    .onConflictDoUpdate({
      target: schema.chogState.tokenId,
      set: newHolder ? { claimedBy: address, claimedAt: new Date(), mode: "copilot", lastSeenAt: new Date() } : { lastSeenAt: new Date() },
    });

  const evs = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.tokenId, tokenId), since && !newHolder ? gt(schema.events.createdAt, since) : sql`true`))
    .orderBy(desc(schema.events.createdAt))
    .limit(20);
  const couples = await db.select({ id: schema.couples.id, a: schema.couples.aToken, b: schema.couples.bToken }).from(schema.couples)
    .where(or(eq(schema.couples.aToken, tokenId), eq(schema.couples.bToken, tokenId)));

  if (newHolder) {
    const me = await getProfile(tokenId);
    for (const c of couples) {
      const other = c.a === tokenId ? c.b : c.a;
      await event(other, "claimed", `A human just took over ${me.name}. Things might get real.`, tokenId);
    }
  }
  return { firstClaim: newHolder, since: since?.toISOString(), events: evs.map(toFeed), couples: couples.length };
}

export async function setMode(tokenId: number, mode: Mode) {
  const db = await getDb();
  await db.update(schema.chogState).set({ mode }).where(eq(schema.chogState.tokenId, tokenId));
}

// ── Swiping ──────────────────────────────────────────────────────────────────

export async function deck(me: number, limit = 12): Promise<DeckCard[]> {
  const db = await getDb();
  const swiped = await db.select({ to: schema.swipes.toToken }).from(schema.swipes).where(eq(schema.swipes.fromToken, me));
  const coupled = await db.select().from(schema.couples).where(or(eq(schema.couples.aToken, me), eq(schema.couples.bToken, me)));
  // Never your own Chogs: everything this Chog's holder owns is out of the deck.
  const siblings = await tokensOf(await ownerOf(me));
  const exclude = new Set([me, ...siblings, ...swiped.map((s) => s.to), ...coupled.map((c) => partnerOf(c, me))]);

  // Chogs that already liked me, and Chogs with a human at the wheel, go first.
  const admirers = new Set(
    (await db.select({ from: schema.swipes.fromToken }).from(schema.swipes).where(and(eq(schema.swipes.toToken, me), eq(schema.swipes.liked, true)))).map((r) => r.from),
  );
  const superAdmirers = new Set(
    (await db.select({ from: schema.gifts.fromToken }).from(schema.gifts).where(and(eq(schema.gifts.toToken, me), eq(schema.gifts.kind, "superlike")))).map((r) => r.from),
  );
  const humans = new Map(
    (await db.select({ id: schema.chogState.tokenId, mode: schema.chogState.mode, seen: schema.chogState.lastSeenAt }).from(schema.chogState)
      .where(sql`${schema.chogState.claimedBy} is not null`)).map((r) => [r.id, r]),
  );

  // Strict tiers, then compatibility within each: super-liked you, liked you, Chogs with a
  // human at the wheel, then AI-run Chogs. A real person always beats a better AI match.
  const day = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const ranked = allChogs()
    .filter((c) => !exclude.has(c.tokenId))
    .map((c) => {
      const compat = compatibility(me, c.tokenId);
      const human = humans.get(c.tokenId);
      let rank = compat.score;
      if (superAdmirers.has(c.tokenId)) rank += 4000;
      else if (admirers.has(c.tokenId)) rank += 3000;
      else if (human) {
        rank += 2000;
        if (human.mode !== "autopilot") rank += 100; // typing their own lines
        const hoursAway = human.seen ? (now - human.seen.getTime()) / 3600_000 : Infinity;
        rank += hoursAway < 24 ? 50 : hoursAway < 24 * 7 ? 25 : 0; // recently around
      } else rank += seeded(me, c.tokenId, day) * 45; // AI-run: shuffle a little each day
      return { id: c.tokenId, compat, rank };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit);

  const profiles = await getProfiles(ranked.map((r) => r.id));
  return ranked.map((r) => ({ ...profiles.get(r.id)!, compatibility: r.compat, likesYou: admirers.has(r.id), superLikesYou: superAdmirers.has(r.id) }));
}

export type SwipeResult = { matched: boolean; coupleId?: string; decidedBy?: "ai" | "human"; swipesLeft: number };

export async function swipe(me: number, target: number, liked: boolean, { superLike = false } = {}): Promise<SwipeResult> {
  if (me === target) throw new HttpError(400, "You can't date yourself. Yet.");
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.swipes)
    .where(and(eq(schema.swipes.fromToken, me), gte(schema.swipes.createdAt, startOfDay())));
  // A super-like is already paid for on-chain by the time it gets here, so it never bounces off the daily limit.
  if (n >= SWIPES_PER_DAY && !superLike) throw new HttpError(429, "Out of swipes for today. Your Chog needs its beauty sleep.");

  await db.insert(schema.swipes).values({ fromToken: me, toToken: target, liked }).onConflictDoUpdate({
    target: [schema.swipes.fromToken, schema.swipes.toToken],
    set: { liked, createdAt: new Date() },
  });
  const swipesLeft = Math.max(0, SWIPES_PER_DAY - n - 1);
  if (!liked) return { matched: false, swipesLeft };

  const [mine, theirs] = [await getProfile(me), await getProfile(target)];
  const [back] = await db.select().from(schema.swipes).where(and(eq(schema.swipes.fromToken, target), eq(schema.swipes.toToken, me)));

  let decidedBy: "ai" | "human" | undefined;
  let likesBack = back?.liked === true;
  if (likesBack) decidedBy = "human";
  else if (superLike && aiRun(theirs)) {
    // A super-like paid in $CHOG always lands with an AI-run Chog.
    likesBack = true;
    await db.insert(schema.swipes).values({ fromToken: target, toToken: me, liked: true }).onConflictDoUpdate({ target: [schema.swipes.fromToken, schema.swipes.toToken], set: { liked: true } });
    decidedBy = "ai";
  } else if (!back && aiRun(theirs)) {
    // The AI swipes for Chogs whose holder isn't at the wheel: the odds follow compatibility.
    const { score } = compatibility(me, target);
    likesBack = seeded("swipe", target, me) < Math.min(0.95, Math.max(0.15, (score - 15) / 60));
    await db.insert(schema.swipes).values({ fromToken: target, toToken: me, liked: likesBack }).onConflictDoNothing();
    decidedBy = "ai";
  }

  if (!likesBack) {
    await event(target, "admirer", superLike ? `${mine.name} super-liked you. ${Math.round((GIFTS.superlike.price * HOLDER_SHARE_BPS) / 10000)} $CHOG went to your wallet.` : `${mine.name} swiped right on you.`, me);
    return { matched: false, swipesLeft };
  }

  const [a, b] = pair(me, target);
  const { score } = compatibility(me, target);
  const [couple] = await db.insert(schema.couples).values({ aToken: a, bToken: b, chemistry: 25 + score * 0.25 })
    .onConflictDoUpdate({ target: [schema.couples.aToken, schema.couples.bToken], set: { stage: "matched" } })
    .returning();
  await event(me, "match", `It's a match with ${theirs.name}!`, target);
  await event(target, "match", `It's a match with ${mine.name}!`, me);
  return { matched: true, coupleId: couple.id, decidedBy, swipesLeft };
}

// ── Couples ──────────────────────────────────────────────────────────────────

async function loadCouple(id: string, me: number): Promise<CoupleRow> {
  const db = await getDb();
  const [c] = await db.select().from(schema.couples).where(eq(schema.couples.id, id));
  if (!c || (c.aToken !== me && c.bToken !== me)) throw new HttpError(404, "Not your couple");
  return applyDecay(c);
}

// Neglect has consequences: chemistry fades after 3 days without a date.
async function applyDecay(c: CoupleRow): Promise<CoupleRow> {
  if (c.stage === "broken_up" || !c.lastDateEndedAt) return c;
  const idle = Date.now() - c.lastDateEndedAt.getTime() - DECAY_AFTER_MS;
  if (idle <= 0) return c;
  const decayed = Math.max(0, c.chemistry - (idle / 86400_000) * 6);
  if (Math.abs(decayed - c.chemistry) < 1) return c;
  const db = await getDb();
  const stage: Stage = decayed < 10 ? "broken_up" : (c.stage as Stage);
  const [u] = await db.update(schema.couples).set({ chemistry: decayed, stage, lastDateEndedAt: new Date(Date.now() - DECAY_AFTER_MS) })
    .where(eq(schema.couples.id, c.id)).returning();
  if (stage === "broken_up") {
    await event(c.aToken, "breakup", "You drifted apart. Nobody went on a date for days.", c.bToken);
    await event(c.bToken, "breakup", "You drifted apart. Nobody went on a date for days.", c.aToken);
  }
  return u;
}

function canDate(c: CoupleRow) {
  if (c.stage === "broken_up") return { ok: false };
  if (c.sessionStartedAt) return { ok: true };
  if (!c.lastDateEndedAt) return { ok: true };
  const next = c.lastDateEndedAt.getTime() + COOLDOWN_MS;
  return next <= Date.now() ? { ok: true } : { ok: false, next: new Date(next).toISOString() };
}

export async function listCouples(me: number): Promise<CoupleSummary[]> {
  const db = await getDb();
  const rows = await Promise.all(
    (await db.select().from(schema.couples).where(or(eq(schema.couples.aToken, me), eq(schema.couples.bToken, me))).orderBy(desc(schema.couples.createdAt))).map(applyDecay),
  );
  const profiles = await getProfiles([me, ...rows.map((c) => partnerOf(c, me))]);
  const last = rows.length
    ? await db.selectDistinctOn([schema.messages.coupleId]).from(schema.messages)
        .where(inArray(schema.messages.coupleId, rows.map((c) => c.id)))
        .orderBy(schema.messages.coupleId, desc(schema.messages.createdAt))
    : [];
  const lastBy = new Map(last.map((m) => [m.coupleId, m]));
  return rows.map((c) => summary(c, me, profiles, lastBy.get(c.id)));
}

function summary(c: CoupleRow, me: number, profiles: Map<number, Profile>, last?: typeof schema.messages.$inferSelect): CoupleSummary {
  const d = canDate(c);
  return {
    id: c.id,
    me: profiles.get(me)!,
    partner: profiles.get(partnerOf(c, me))!,
    stage: c.stage as Stage,
    chemistry: Math.round(c.chemistry),
    dates: c.dates,
    lastMessage: last ? { body: noDashes(last.body), senderTokenId: last.senderToken, at: last.createdAt.toISOString() } : undefined,
    canDateNow: d.ok,
    nextDateAt: d.next,
  };
}

export async function coupleDetail(id: string, me: number): Promise<CoupleDetail> {
  const c = await loadCouple(id, me);
  const db = await getDb();
  const profiles = await getProfiles([c.aToken, c.bToken]);
  const dateIndex = c.sessionStartedAt ? c.dates + 1 : c.dates;
  const msgs = dateIndex
    ? await db.select().from(schema.messages).where(and(eq(schema.messages.coupleId, id), eq(schema.messages.dateIndex, dateIndex))).orderBy(asc(schema.messages.createdAt))
    : [];
  const [recap] = c.sessionStartedAt ? [] : await db.select().from(schema.events)
    .where(and(eq(schema.events.tokenId, me), eq(schema.events.kind, "date"), eq(schema.events.otherToken, partnerOf(c, me))))
    .orderBy(desc(schema.events.createdAt)).limit(1);
  const mineIsA = c.aToken === me;
  const [mine, theirs] = mineIsA ? [c.unmaskA, c.unmaskB] : [c.unmaskB, c.unmaskA];
  return {
    ...summary(c, me, profiles, msgs.at(-1)),
    session: { index: Math.max(dateIndex, 1), messages: msgs.map(toMessage), done: !c.sessionStartedAt && dateIndex > 0, summary: recap?.text },
    unmask: { me: !!mine, partner: !!theirs, partnerHandle: mine && theirs ? theirs : undefined },
    venue: c.venue ?? undefined,
  };
}

// ── Dates ────────────────────────────────────────────────────────────────────

function speaker(p: Profile): Speaker {
  return { tokenId: p.tokenId, name: p.name, traits: p.traits, persona: p.persona };
}

async function context(c: CoupleRow, speakerId: number): Promise<{ ctx: DateContext; dateIndex: number; count: number }> {
  const db = await getDb();
  const profiles = await getProfiles([c.aToken, c.bToken]);
  const dateIndex = c.dates + 1;
  const msgs = await db.select().from(schema.messages).where(and(eq(schema.messages.coupleId, c.id), eq(schema.messages.dateIndex, dateIndex))).orderBy(asc(schema.messages.createdAt));
  return {
    dateIndex,
    count: msgs.length,
    ctx: {
      me: speaker(profiles.get(speakerId)!),
      partner: speaker(profiles.get(partnerOf(c, speakerId))!),
      stage: c.stage as Stage,
      chemistry: c.chemistry,
      dateNumber: dateIndex,
      history: msgs.map((m) => ({ from: m.senderToken, body: m.body })),
      venue: c.venue ?? undefined,
    },
  };
}

async function startIfNeeded(c: CoupleRow): Promise<CoupleRow> {
  if (c.sessionStartedAt) return c;
  if (!canDate(c).ok) throw new HttpError(429, c.stage === "broken_up" ? "It's over. Time to swipe again." : "Your Chogs need a break before the next date.");
  const db = await getDb();
  const [u] = await db.update(schema.couples).set({ sessionStartedAt: new Date(), stage: c.stage === "matched" ? "first_date" : c.stage })
    .where(eq(schema.couples.id, c.id)).returning();
  return u;
}

async function append(c: CoupleRow, dateIndex: number, sender: number, body: string, author: "human" | "ai" | "gift", delta: number): Promise<CoupleRow> {
  const db = await getDb();
  await db.insert(schema.messages).values({ coupleId: c.id, dateIndex, senderToken: sender, body: body.slice(0, 400), author, chemistryDelta: delta });
  const [u] = await db.update(schema.couples).set({ chemistry: Math.max(0, Math.min(100, c.chemistry + delta * 0.9)) })
    .where(eq(schema.couples.id, c.id)).returning();
  return u;
}

// A turn can be a double or triple text. The chemistry change rides on the last one,
// with a small stagger in created_at so the order is stable.
async function appendTexts(c: CoupleRow, dateIndex: number, sender: number, reply: { texts: string[]; chemistryDelta: number }): Promise<CoupleRow> {
  for (const [i, t] of reply.texts.entries()) {
    c = await append(c, dateIndex, sender, t, "ai", i === reply.texts.length - 1 ? reply.chemistryDelta : 0);
  }
  return c;
}

// A holder types a line as their Chog (manual or co-pilot). If the other side is
// AI-run, it answers in character.
export async function sendLine(id: string, me: number, body: string) {
  const text = body.trim();
  if (!text) throw new HttpError(400, "Say something");
  let c = await startIfNeeded(await loadCouple(id, me));
  const partner = await getProfile(partnerOf(c, me));
  const { ctx, dateIndex } = await context(c, partnerOf(c, me));

  if (aiRun(partner)) {
    c = await append(c, dateIndex, me, text, "human", 0);
    const reply = await dateReply({ ...ctx, history: [...ctx.history, { from: me, body: text }], chemistry: c.chemistry });
    c = await appendTexts(c, dateIndex, partner.tokenId, reply);
  } else {
    const delta = await scoreLine(ctx, text);
    c = await append(c, dateIndex, me, text, "human", delta);
  }
  return finishIfDone(c, me);
}

// Advance an AI-to-AI date by one line. The holder watches their Chog on autopilot.
export async function autoStep(id: string, me: number) {
  let c = await startIfNeeded(await loadCouple(id, me));
  const { ctx: probe } = await context(c, me);
  const last = probe.history.at(-1);
  const next = !last || last.from !== me ? me : partnerOf(c, me);
  const nextProfile = await getProfile(next);
  if (next !== me && !aiRun(nextProfile)) throw new HttpError(409, "Waiting on their human to reply.");
  const { ctx, dateIndex } = await context(c, next);
  const reply = await dateReply(ctx);
  c = await appendTexts(c, dateIndex, next, reply);
  return finishIfDone(c, me);
}

const STAGE_RULES: [Stage, number, number][] = [
  // stage, min completed dates, min chemistry
  ["married", 5, 82],
  ["official", 3, 65],
  ["dating", 2, 50],
  ["first_date", 1, 0],
];

async function finishIfDone(c: CoupleRow, me: number) {
  const db = await getDb();
  const dateIndex = c.dates + 1;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.messages)
    .where(and(eq(schema.messages.coupleId, c.id), eq(schema.messages.dateIndex, dateIndex), ne(schema.messages.author, "gift")));
  if (n < DATE_LENGTH) return { done: false, stageChanged: false };

  const { ctx } = await context(c, me);
  const recap = await summarizeDate(ctx);
  const dates = c.dates + 1;
  let stage = (STAGE_RULES.find(([, d, chem]) => dates >= d && c.chemistry >= chem)?.[0] ?? "first_date") as Stage;
  if (c.chemistry < 12) stage = "broken_up";
  const order = ["matched", "first_date", "dating", "official", "married"];
  if (stage !== "broken_up" && order.indexOf(stage) < order.indexOf(c.stage)) stage = c.stage as Stage; // no demotion

  await db.update(schema.couples).set({ dates, stage, sessionStartedAt: null, lastDateEndedAt: new Date(), venue: null }).where(eq(schema.couples.id, c.id));
  const text = `${recap.headline}: ${recap.summary}`;
  await event(c.aToken, "date", text, c.bToken);
  await event(c.bToken, "date", text, c.aToken);
  const changed = stage !== c.stage;
  if (changed) {
    const label = stage === "broken_up" ? "It's over." : `Now ${stage.replace("_", " ")}!`;
    await event(c.aToken, stage === "broken_up" ? "breakup" : "stage", label, c.bToken);
    await event(c.bToken, stage === "broken_up" ? "breakup" : "stage", label, c.aToken);
  }
  return { done: true, stageChanged: changed, stage, recap };
}

// ── Unmask ───────────────────────────────────────────────────────────────────

export async function unmask(id: string, me: number, handle: string) {
  const c = await loadCouple(id, me);
  if (!["official", "married"].includes(c.stage)) throw new HttpError(403, "Unmasking unlocks once you're Official.");
  const partner = await getProfile(partnerOf(c, me));
  if (aiRun(partner)) throw new HttpError(409, "Their Chog is AI-run. There's no human to meet yet.");
  const clean = handle.trim().replace(/^@/, "").slice(0, 40);
  if (!/^[A-Za-z0-9_.#-]{2,40}$/.test(clean)) throw new HttpError(400, "Enter your X or Discord handle");
  const db = await getDb();
  await db.update(schema.couples).set(c.aToken === me ? { unmaskA: clean } : { unmaskB: clean }).where(eq(schema.couples.id, id));
}

// ── Feed ─────────────────────────────────────────────────────────────────────

export async function feed(me: number, limit = 30): Promise<FeedEvent[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.events).where(eq(schema.events.tokenId, me)).orderBy(desc(schema.events.createdAt)).limit(limit);
  return rows.map(toFeed);
}

// The Daily Chog: the latest date recaps across the whole collection.
export async function gossip(limit = 20): Promise<(FeedEvent & { tokenId: number })[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.events).where(and(eq(schema.events.kind, "date"), sql`${schema.events.tokenId} < ${schema.events.otherToken}`))
    .orderBy(desc(schema.events.createdAt)).limit(limit);
  return rows.map(toFeed);
}

// Stored text passes the house style on the way out too, so older rows can never show a dash.
function toFeed(e: typeof schema.events.$inferSelect): FeedEvent {
  return { id: e.id, kind: e.kind as FeedEvent["kind"], tokenId: e.tokenId, otherTokenId: e.otherToken ?? undefined, text: noDashes(e.text), createdAt: e.createdAt.toISOString() };
}

function toMessage(m: typeof schema.messages.$inferSelect): Message {
  return { id: m.id, senderTokenId: m.senderToken, body: noDashes(m.body), author: m.author as Message["author"], chemistryDelta: m.chemistryDelta, createdAt: m.createdAt.toISOString() };
}

// Co-pilot: three lines in the Chog's own voice for the holder to pick from.
export async function suggestFor(id: string, me: number): Promise<string[]> {
  const c = await loadCouple(id, me);
  const { ctx } = await context(c, me);
  return suggestLines(ctx);
}

// ── $CHOG gifts ──────────────────────────────────────────────────────────────

export type GiftResult = { kind: GiftKind; paid: number; swipe?: SwipeResult; chemistry?: number };
export type GiftQuote = { kind: GiftKind; price: number; holder: string; holderAmount: string; builder: string; builderAmount: string; recipient: string };

function builderAddress(): string {
  const b = process.env.BUILDER_ADDRESS?.trim().toLowerCase();
  if (!b || !/^0x[0-9a-f]{40}$/.test(b)) throw new HttpError(503, "Gifts aren't switched on yet.");
  return b;
}

// Who a gift is for: the partner in a couple, or the Chog being super-liked.
async function giftTarget(me: number, kind: GiftKind, to: { coupleId?: string; target?: number }) {
  if (!GIFTS[kind]) throw new HttpError(400, "Unknown gift");
  if (kind === "superlike") {
    if (!to.target || to.target === me) throw new HttpError(400, "Super-like who?");
    return { target: to.target, couple: undefined as CoupleRow | undefined };
  }
  if (!to.coupleId) throw new HttpError(400, "Gifts go to a match");
  const couple = await loadCouple(to.coupleId, me);
  if (couple.stage === "broken_up") throw new HttpError(409, "It's over. Roses won't fix this one.");
  return { target: partnerOf(couple, me), couple };
}

// Step one, before the wallet opens: where each share goes, right now.
export async function giftQuote(me: number, address: string, kind: GiftKind, to: { coupleId?: string; target?: number }): Promise<GiftQuote> {
  const { target } = await giftTarget(me, kind, to);
  const holder = await ownerOf(target);
  if (holder === address.toLowerCase()) throw new HttpError(400, "That Chog is in your own wallet.");
  const split = splitGift(kind);
  const recipient = (await getProfile(target)).name;
  return { kind, price: GIFTS[kind].price, holder, holderAmount: split.holder.toString(), builder: builderAddress(), builderAmount: split.builder.toString(), recipient };
}

// Step two, after both transfers confirm: verify them on Monad against the Chog's current
// holder and the builder, spend each tx exactly once, then apply the gift.
export async function giveGift(me: number, address: string, kind: GiftKind, txHashes: `0x${string}`[], to: { coupleId?: string; target?: number }): Promise<GiftResult> {
  const hashes = [...new Set(txHashes.map((h) => h.toLowerCase() as `0x${string}`))];
  if (!hashes.length || hashes.length > 2 || hashes.some((h) => !/^0x[0-9a-f]{64}$/.test(h))) throw new HttpError(400, "Those aren't transaction hashes");
  const gift = GIFTS[kind];
  const { target, couple } = await giftTarget(me, kind, to);
  const holder = await ownerOf(target);
  if (holder === address.toLowerCase()) throw new HttpError(400, "That Chog is in your own wallet.");
  const builder = builderAddress();
  const db = await getDb();

  const used = await db.select({ h: schema.gifts.txHash }).from(schema.gifts)
    .where(or(inArray(schema.gifts.txHash, hashes), inArray(schema.gifts.builderTx, hashes)));
  if (used.length) throw new HttpError(409, "That transaction already paid for a gift.");

  const split = splitGift(kind);
  const paid = await verifyGiftPayment(hashes, address, { holder, builder }, { holder: split.holder, builder: split.builder });
  const [row] = await db.insert(schema.gifts)
    .values({ txHash: hashes[0], builderTx: hashes[1] ?? null, kind, fromToken: me, toToken: target, coupleId: couple?.id, amount: String(gift.price), holder })
    .onConflictDoNothing()
    .returning();
  if (!row) throw new HttpError(409, "That transaction already paid for a gift.");
  const whole = Number(paid / BigInt(10) ** BigInt(18));

  if (kind === "superlike") return { kind, paid: whole, swipe: await swipe(me, target, true, { superLike: true }) };

  let c = couple!;
  const [mine, partner] = [await getProfile(me), await getProfile(target)];
  if (kind === "dinner") {
    const [u] = await db.update(schema.couples).set({ venue: DINNER_VENUE }).where(eq(schema.couples.id, c.id)).returning();
    c = u;
  }
  const dateIndex = c.sessionStartedAt ? c.dates + 1 : Math.max(c.dates, 1);
  const line = kind === "rose" ? `sent a rose (${gift.price} $CHOG)` : `booked a candlelit dinner (${gift.price} $CHOG)`;
  c = await append(c, dateIndex, me, line, "gift", gift.chemistry);
  await event(target, "date", `${mine.name} ${kind === "rose" ? "sent you a rose" : "booked you a candlelit dinner"}. ${Math.round((gift.price * HOLDER_SHARE_BPS) / 10000)} $CHOG went to your wallet.`, me);

  // An AI-run partner reacts in character, if they're mid-date.
  if (c.sessionStartedAt && aiRun(partner)) {
    const { ctx } = await context(c, partner.tokenId);
    c = await appendTexts(c, dateIndex, partner.tokenId, await dateReply(ctx));
  }
  return { kind, paid: whole, chemistry: Math.round(c.chemistry) };
}

export async function giftedTotal(): Promise<number> {
  const db = await getDb();
  const [{ total }] = await db.select({ total: sql<number>`coalesce(sum(${schema.gifts.amount}::numeric), 0)::int` }).from(schema.gifts);
  return total;
}

