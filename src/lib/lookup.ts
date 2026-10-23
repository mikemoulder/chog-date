import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { allChogs, imageFor, seeded } from "./chogs";
import { noEmoji } from "./text";
import type { Persona } from "./types";

// "Type a Chog": a number finds that Chog by its name (what holders see on OpenSea);
// words find Chogs by trait. Profiles only: no owners, couples or anything wallet-bound.

type Pregen = Record<string, { persona: Persona; bio: string }>;
let personas: Pregen | null = null;
const load = () => (personas ??= JSON.parse(readFileSync(path.join(process.cwd(), "data/personas.json"), "utf8")) as Pregen);

const SHOWN = ["Head", "Eyes", "Body", "Mouth", "Accessory", "Background"];

export type LookupResult = { tokenId: number; name: string; image: string; archetype: string; bio: string; traits: Record<string, string> };

export function lookup(raw: string): { q: string; total: number; results: LookupResult[] } {
  const q = raw.trim().slice(0, 40);
  if (!q) return { q, total: 0, results: [] };
  const num = q.match(/^#?\s*(\d{1,4})$/)?.[1];
  const all = allChogs();
  const matches = num
    ? all.filter((c) => c.name.endsWith(`#${Number(num)}`))
    : all.filter((c) => SHOWN.some((k) => c.traits[k]?.toLowerCase().includes(q.toLowerCase())));
  const p = load();
  const results = [...matches]
    .sort((a, b) => seeded(q.toLowerCase(), a.tokenId) - seeded(q.toLowerCase(), b.tokenId))
    .slice(0, 3)
    .map((c) => ({
      tokenId: c.tokenId,
      name: c.name.replace(/^CHOG/, "Chog"),
      image: imageFor(c.tokenId),
      archetype: p[c.tokenId]?.persona.archetype ?? "",
      bio: noEmoji(p[c.tokenId]?.bio ?? ""),
      traits: Object.fromEntries(SHOWN.filter((k) => c.traits[k]).map((k) => [k, c.traits[k]])),
    }));
  return { q, total: matches.length, results };
}
