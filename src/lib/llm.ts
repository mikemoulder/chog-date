import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { seeded } from "./chogs";
import { jsonSchemaFor, parseJsonAs } from "./json";
import { deepNoDashes } from "./text";
import { CONTENT_RULES } from "./persona-prompt";
import { TAG_LABEL, tagsFor, type Tag } from "./vibes";
import type { Persona, Stage, Traits } from "./types";

// The OpenAI seam. Every call walks the model chain in OPENAI_MODELS (next model on a
// rate limit, overload or timeout) and has a deterministic fixture behind it, used when
// there is no key, when LLM_FIXTURES=1, or when every model fails. The demo never stalls.

export const MODELS = (process.env.OPENAI_MODELS ?? "gpt-6-luna,gpt-5-nano").split(",").map((m) => m.trim()).filter(Boolean);
// Banter needs speed, not deliberation. Original gpt-5 models bottom out at "minimal";
// newer ones accept "none". OPENAI_REASONING overrides ("" omits the parameter).
const effortFor = (model: string): OpenAI.ReasoningEffort | undefined => {
  const env = process.env.OPENAI_REASONING;
  if (env !== undefined) return (env || undefined) as OpenAI.ReasoningEffort | undefined;
  return /^gpt-5(-mini|-nano)?$/.test(model) ? "minimal" : "none";
};
const live = !!process.env.OPENAI_API_KEY && process.env.LLM_FIXTURES !== "1";
// No SDK retries: a slow or rate-limited model hands over to the next one instead of stalling the date.
const client = live ? new OpenAI({ timeout: 20_000, maxRetries: 0 }) : null;

const RULES = CONTENT_RULES;

async function ask<T extends z.ZodType>(schema: T, system: string, user: string): Promise<z.infer<T> | null> {
  if (!client) return null;
  const json = jsonSchemaFor(schema);
  for (const model of MODELS) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_completion_tokens: 2000,
        ...(effortFor(model) ? { reasoning_effort: effortFor(model) } : {}),
        response_format: { type: "json_schema", json_schema: { name: "answer", schema: json, strict: true } },
      });
      const choice = res.choices[0];
      if (choice?.message.refusal) return null;
      const out = parseJsonAs(schema, choice?.message.content ?? undefined);
      if (out) return deepNoDashes(out);
      console.warn(`[llm] ${model} returned unusable JSON (${choice?.finish_reason}), trying the next model`);
    } catch (err) {
      const status = err instanceof OpenAI.APIError ? err.status : undefined;
      console.warn(`[llm] ${model} failed${status ? ` (${status})` : ""}:`, (err as Error).message?.slice(0, 200));
    }
  }
  return null;
}

export const llmIsLive = live;

// ── Personas ─────────────────────────────────────────────────────────────────

const ARCHETYPES: Partial<Record<Tag, string>> = {
  degen: "The Leveraged Romantic", monad: "The Monad Maxi Lover", bitcoin: "The HODL-Hearted", royal: "Royalty Seeking Commoner",
  chaotic: "The Beautiful Disaster", melancholy: "The Sad Boi Poet", wholesome: "The Golden Retriever Chog", flirty: "The Shameless Flirt",
  tough: "The Softie in Armor", mystic: "The Cosmic Matchmaker", street: "The Block's Sweetheart", sporty: "The Gym Rat Romantic",
  cozy: "The Hoodie Cuddler", fancy: "The Black-Tie Charmer", unhinged: "The Red Flag Collector", clown: "The Class Clown",
  weeb: "The Anime Protagonist", nerd: "The Lovable Nerd", broke: "The Broke but Loyal", hustler: "The Grindset Lover",
  rebel: "The Side-Eye Rebel", zen: "The Calm in Your Storm", fiery: "The Laser-Eyed Hothead", cursed: "The Haunted Heartthrob",
};

export function fixturePersona(name: string, traits: Traits): { persona: Persona; bio: string } {
  const tags = tagsFor(traits);
  const main = tags[0] ?? "wholesome";
  const t = (k: string) => traits[k] ?? (k === "Body" ? "Nothing" : "something mysterious");
  const persona: Persona = {
    archetype: ARCHETYPES[main] ?? "The Mysterious Chog",
    vibe: `A ${tags.slice(0, 2).map((x) => TAG_LABEL[x]).join(", ") || "mysterious"} Chog in a ${t("Body")} who means every word.`,
    quirks: [`Never takes off the ${t("Head")}`, `Makes ${t("Mouth").toLowerCase()} faces when nervous`, `Swears the ${t("Eyes")} eyes are natural`],
    loveLanguage: main === "fancy" || main === "royal" ? "Gifts" : main === "cozy" || main === "wholesome" ? "Quality time" : "Words of affirmation",
    greenFlags: ["Texts back fast (10k TPS)", "Will share their last MON"],
    redFlag: traits.Accessory ? `Brings the ${traits.Accessory} on every date` : `Has opinions about ${t("Background")} backgrounds`,
    voice: main === "unhinged" || main === "chaotic" ? "all lowercase, chaotic, too many emojis" : main === "fancy" || main === "royal" ? "Proper. Full sentences. Slightly theatrical." : "casual, warm, a little crypto slang",
  };
  const bio = `${name.replace("CHOG", "Chog")} • ${t("Body")} on, ${t("Head")} on, heart open. ${persona.redFlag}. Looking for someone who can handle my ${t("Eyes").toLowerCase()} energy.`.slice(0, 220);
  return { persona, bio };
}

// ── Dates ────────────────────────────────────────────────────────────────────

export type Speaker = { tokenId: number; name: string; traits: Traits; persona: Persona };
export type Line = { from: number; body: string };
export type DateContext = { me: Speaker; partner: Speaker; stage: Stage; chemistry: number; dateNumber: number; history: Line[]; venue?: string };

function dateSystem(ctx: DateContext) {
  const p = ctx.me.persona;
  const traits = (t: Traits) => Object.entries(t).filter(([k, v]) => !["Side", "Base", "Form", "Naked"].includes(k) && v !== "No").map(([k, v]) => `${k} ${v}`).join(", ");
  return `You are ${ctx.me.name}, a Chog (a chubby cartoon creature from the Chog Genesis NFT collection on Monad), texting your date ${ctx.partner.name} in the Chog Date app.

Who you are: "${p.archetype}". ${p.vibe} Quirks: ${p.quirks.join("; ")}. Red flag: ${p.redFlag}. Love language: ${p.loveLanguage}.
How you text: ${p.voice}
What you look like (you know this, you don't announce it): ${traits(ctx.me.traits)}.
Them: "${ctx.partner.persona.archetype}". ${ctx.partner.persona.vibe} They look like: ${traits(ctx.partner.traits)}.
Where things stand: ${ctx.stage.replace("_", " ")}, date #${ctx.dateNumber}${ctx.venue ? `, tonight's date is ${ctx.venue}` : ""}. Chemistry ${Math.round(ctx.chemistry)}/100.

Text like a real person on a date, not a customer service agent:
- Vary length a lot. Some texts are one word ("lol", "wait", "stop", "ok fair"). Most are under 12 words.
- React more than you interview. Most texts are reactions, opinions or little stories, not questions. Never end two texts in a row with a question.
- Reply to what they actually said. Call back to something from earlier. Disagree sometimes. Tease.
- Have a mood that shifts: nervous, dry, flustered, distracted, smitten, unimpressed. You don't have to like them, and you don't have to agree to everything.
- Looks come up only when it's natural, at most every few messages. Never describe your own outfit. Never list traits.
- Most texts have no emoji at all. No hashtags, no stage directions like *smiles*, no quotation marks.
- A little mess is human: a fragment, a tangent, starting a thought in one text and finishing it in the next.
- Never use em dashes or en dashes. Use commas, periods or "..." instead.
- Follow your texting voice above, including capitalisation.
${RULES}`;
}

function transcript(ctx: DateContext) {
  if (!ctx.history.length) return "(Nobody has said anything yet. You text first.)";
  return ctx.history.map((l) => `${l.from === ctx.me.tokenId ? "You" : "Them"}: ${l.body}`).join("\n");
}

const ReplySchema = z.object({
  texts: z.array(z.string()).describe("your next 1 to 3 texts, in order. Usually 1."),
  chemistryDelta: z.number().describe("-10 to +10: how their last text landed with you. Be a tough critic: generic or boring is 0 or below, +5 and up only for a genuinely great moment"),
});

// A nudge per turn so the rhythm varies like a real conversation instead of settling
// into one neat sentence each. Deterministic per couple and turn.
const BEATS = [
  "Keep this one very short, a few words at most.",
  "Send two quick texts in a row this time.",
  "Just react to what they said. No question.",
  "Tease them a little about what they just said.",
  "Tell a tiny story or confession, one or two lines.",
  "Give a strong opinion, even a slightly unpopular one.",
  "Answer, then change the subject to something you care about.",
  "Be a little awkward or flustered.",
];

function beat(ctx: DateContext) {
  if (!ctx.history.length) return "Open with something specific about their profile, not a generic hi.";
  return BEATS[Math.floor(seeded(ctx.me.tokenId, ctx.partner.tokenId, ctx.dateNumber, ctx.history.length) * BEATS.length)];
}

const EMOJI = /\p{Extended_Pictographic}/u;
// People don't sign every text with an emoji. If this Chog used one in its last text, drop them now.
function pace(ctx: DateContext, texts: string[]) {
  const mine = ctx.history.filter((l) => l.from === ctx.me.tokenId);
  let used = EMOJI.test(mine.at(-1)?.body ?? "");
  return texts.map((t) => {
    const out = used ? t.replace(/\s*\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*/gu, "").trim() || t : t;
    used = EMOJI.test(out);
    return out;
  });
}

export async function dateReply(ctx: DateContext): Promise<{ texts: string[]; chemistryDelta: number }> {
  const out = await ask(ReplySchema, dateSystem(ctx), `${transcript(ctx)}\n\nYour turn. ${beat(ctx)}`);
  const texts = out ? pace(ctx, out.texts.map((t) => t.trim()).filter(Boolean).slice(0, 3)) : undefined;
  if (out && texts?.length) return { texts, chemistryDelta: clamp(out.chemistryDelta, -10, 10) };
  const f = fixtureReply(ctx);
  return { texts: [f.reply], chemistryDelta: f.chemistryDelta };
}

const SuggestSchema = z.object({ options: z.array(z.string()).describe("exactly 3 different next texts: one sweet, one bold, one funny. Each under 15 words.") });

export async function suggestLines(ctx: DateContext): Promise<string[]> {
  const out = await ask(SuggestSchema, dateSystem(ctx), `${transcript(ctx)}\n\nYour human is picking your next text. Offer 3 options in your voice, each one short and different.`);
  if (out?.options.length) return out.options.slice(0, 3);
  const r = fixtureReply(ctx).reply;
  return [r, `Ok but that ${ctx.partner.traits.Head ?? "look"} is doing things to me`, `Be honest, how many Chogs have you said that to?`];
}

const ScoreSchema = z.object({ chemistryDelta: z.number().describe("-10 to +10") });

// Scores a message written by a human holder, from the receiving Chog's point of view.
export async function scoreLine(ctx: DateContext, body: string): Promise<number> {
  const out = await ask(ScoreSchema, dateSystem(ctx), `${transcript(ctx)}\nThem: ${body}\n\nHow did that last text land with you? Score the change in chemistry.`);
  if (out) return clamp(out.chemistryDelta, -10, 10);
  return Math.round((seeded(body) - 0.35) * 12);
}

const SummarySchema = z.object({
  summary: z.string().describe("2 sentence recap of how the date went, gossip-column tone, third person"),
  headline: z.string().describe("tabloid headline under 70 chars"),
});

export async function summarizeDate(ctx: DateContext): Promise<{ summary: string; headline: string }> {
  const out = await ask(
    SummarySchema,
    `You write the gossip column for Chog Date, the dating app for Chog Genesis NFTs on Monad. Juicy, funny, affectionate, and specific to what was actually said. Never use em dashes or en dashes. ${RULES}`,
    `${ctx.me.name} and ${ctx.partner.name} (${ctx.stage.replace("_", " ")}, chemistry ${Math.round(ctx.chemistry)}/100) just finished date #${ctx.dateNumber}.\n\n${ctx.history.map((l) => `${l.from === ctx.me.tokenId ? ctx.me.name : ctx.partner.name}: ${l.body}`).join("\n")}`,
  );
  if (out) return out;
  const good = ctx.chemistry >= 55;
  return {
    headline: good ? `${ctx.me.name} and ${ctx.partner.name}: it's getting serious` : `Awkward silence spotted at ${ctx.me.name}'s table`,
    summary: good
      ? `Sources say ${ctx.me.name} couldn't stop staring at ${ctx.partner.name}'s ${ctx.partner.traits.Eyes ?? "eyes"}. A second date is all but confirmed.`
      : `${ctx.me.name} and ${ctx.partner.name} split the bill and left separately. Insiders blame the ${ctx.partner.traits.Accessory ?? ctx.partner.traits.Head ?? "vibes"}.`,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const OPENERS = [
  (c: DateContext) => `So… is that ${c.partner.traits.Head ?? "hat"} a statement or a cry for help? Asking because I like it.`,
  (c: DateContext) => `I almost didn't come. Then I saw your ${c.partner.traits.Body ?? "fit"} in the photos. Here I am.`,
  (c: DateContext) => `Hi. I'm told my ${c.me.traits.Eyes ?? "eyes"} are intimidating. Are you intimidated?`,
];
const LINES = [
  (c: DateContext) => `Ok that was smooth. Is that from the ${c.partner.traits.Body ?? "outfit"} or is it natural?`,
  (c: DateContext) => `My ${c.me.traits.Aura ?? c.me.traits.Background ?? "aura"} just flickered. That never happens.`,
  (c: DateContext) => `Hot take: ${c.me.traits.Head ?? "my hat"} > your ${c.partner.traits.Head ?? "hat"}. Fight me. Gently.`,
  () => `If this goes well I'm telling the whole collection. If it doesn't, I was never here.`,
  () => `Be honest. Would you still date me if I sold for floor?`,
  (c: DateContext) => `I'll be real, I've never matched with a ${c.partner.persona.archetype.replace(/^The /, "")} before.`,
  () => `You're funny. Annoyingly funny. I came here to be the funny one.`,
];

function fixtureReply(ctx: DateContext): { reply: string; chemistryDelta: number } {
  const n = ctx.history.length;
  const said = new Set(ctx.history.map((l) => l.body));
  const pool = (n === 0 ? OPENERS : LINES).map((f) => f(ctx)).filter((line) => !said.has(line));
  const reply = pool.length ? pool[Math.floor(seeded(ctx.me.tokenId, ctx.partner.tokenId, n) * pool.length)] : "Ok. I like you. Don't make it weird.";
  return { reply, chemistryDelta: Math.round((seeded(ctx.partner.tokenId, n) - 0.3) * 10) };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
