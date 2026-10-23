import chogsJson from "../../data/chogs.json";
import type { ChogMeta, Traits } from "./types";

// The indexed snapshot of all 1,969 Chog Genesis tokens (scripts/index-chogs.mjs).
// Traits never change; the owner field is only a fallback for when the RPC is down.

type Raw = { tokenId: number; name: string; image: string; traits: Traits; owner: string };

export const SUPPLY = 1969;
const all: ChogMeta[] = (chogsJson as Raw[]).map((c) => ({ tokenId: c.tokenId, name: c.name, traits: c.traits, owner: c.owner.toLowerCase() }));
const images = new Map((chogsJson as Raw[]).map((c) => [c.tokenId, c.image]));
const byId = new Map(all.map((c) => [c.tokenId, c]));

export function allChogs(): ChogMeta[] {
  return all;
}

export function getChog(tokenId: number): ChogMeta {
  const c = byId.get(tokenId);
  if (!c) throw new Error(`Unknown Chog #${tokenId}`);
  return c;
}

export function imageFor(tokenId: number): string {
  return `/chogs/${tokenId}.webp`;
}

export function getChogImage(tokenId: number): string | undefined {
  return images.get(tokenId);
}

export function snapshotOwner(tokenId: number): string {
  return getChog(tokenId).owner;
}

export function snapshotTokensOf(address: string): number[] {
  const a = address.toLowerCase();
  return all.filter((c) => c.owner === a).map((c) => c.tokenId);
}

// Deterministic per-pair / per-token randomness, so the same Chog always has the same
// personality and the same pair always gets the same compatibility.
export function seeded(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const ch of parts.join(":")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
