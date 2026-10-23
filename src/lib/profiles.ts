import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { getChog, imageFor } from "./chogs";
import { getDb, schema } from "./db";
import { fixturePersona } from "./llm";
import type { Mode, Persona, Profile } from "./types";

// A Chog's dating profile: traits from the snapshot, persona + bio written once from
// those traits, claim state from the DB. Personas come from data/personas.json
// (scripts/gen-personas.mts), else a deterministic trait-based fixture.

type Pregen = Record<string, { persona: Persona; bio: string }>;
let pregen: Pregen | null = null;
function pregenerated(tokenId: number) {
  if (!pregen) {
    try {
      pregen = JSON.parse(readFileSync(path.join(process.cwd(), "data/personas.json"), "utf8")) as Pregen;
    } catch {
      pregen = {};
    }
  }
  return pregen[tokenId];
}

type StateRow = typeof schema.chogState.$inferSelect;

export async function getProfiles(tokenIds: number[]): Promise<Map<number, Profile>> {
  const db = await getDb();
  const ids = [...new Set(tokenIds)];
  const rows = ids.length ? await db.select().from(schema.chogState).where(inArray(schema.chogState.tokenId, ids)) : [];
  const byId = new Map<number, StateRow>(rows.map((r) => [r.tokenId, r]));

  const out = new Map<number, Profile>();
  await Promise.all(
    ids.map(async (id) => {
      const chog = getChog(id);
      const row = byId.get(id);
      const pre = pregenerated(id);
      let persona = pre?.persona ?? (row?.persona as Persona | null) ?? null;
      let bio = pre?.bio ?? row?.bio ?? null;
      if (!persona || !bio) {
        // Never spend live quota on profiles: pre-generated, or the trait-based fixture.
        const generated = pregenerated(id) ?? fixturePersona(chog.name, chog.traits);
        persona = generated.persona;
        bio = generated.bio;
        await db
          .insert(schema.chogState)
          .values({ tokenId: id, persona, bio })
          .onConflictDoUpdate({ target: schema.chogState.tokenId, set: { persona, bio } });
      }
      const claimed = !!row?.claimedBy;
      out.set(id, {
        tokenId: id,
        name: chog.name.replace(/^CHOG/, "Chog"),
        image: imageFor(id),
        traits: chog.traits,
        persona,
        bio,
        claimed,
        mode: claimed ? ((row?.mode as Mode) ?? "copilot") : "autopilot",
      });
    }),
  );
  return out;
}

export async function getProfile(tokenId: number): Promise<Profile> {
  return (await getProfiles([tokenId])).get(tokenId)!;
}

export async function getState(tokenId: number): Promise<StateRow | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(schema.chogState).where(eq(schema.chogState.tokenId, tokenId));
  return row;
}

// Is this Chog spoken for by a human right now? Unclaimed and autopilot Chogs are AI-run.
export function aiRun(p: Profile) {
  return !p.claimed || p.mode === "autopilot";
}
