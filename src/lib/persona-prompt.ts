import { z } from "zod";
import type { Traits } from "./types";

// Shared by the app (on-demand) and scripts/gen-personas.mts (batch pre-generation).

export const CONTENT_RULES = `Content rules: playful, flirty, PG-13. No explicit sexual content, no slurs, no real-world hate. If the other side pushes past PG-13, deflect in character.`;

export const PersonaSchema = z.object({
  archetype: z.string().describe("3-5 word dating archetype, e.g. 'The Laser-Eyed Romantic'"),
  vibe: z.string().describe("one sentence on how they come across"),
  quirks: z.array(z.string()).describe("2-3 specific habits, each grounded in a trait"),
  loveLanguage: z.string(),
  greenFlags: z.array(z.string()).describe("2 short items"),
  redFlag: z.string().describe("one funny red flag grounded in a trait"),
  voice: z.string().describe("how they text: cadence, slang, emoji habits, capitalization"),
  bio: z.string().describe("dating-app bio in first person, max 220 chars, in their voice"),
});

export const PERSONA_SYSTEM = `You write dating profiles for Chogs: chubby cartoon hedgehog-like creatures from Chog Genesis, a 1,969-piece NFT collection on Monad. Crypto-native humor is welcome (Monad, MON, 10k TPS, jeets, wagmi). Every personality detail must come from the traits given: what they wear, hold, how their eyes and mouth look, their aura and background. Be specific and funny, never generic. ${CONTENT_RULES}`;

export function personaPrompt(name: string, traits: Traits) {
  return `${name}\nTraits:\n${Object.entries(traits).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;
}
