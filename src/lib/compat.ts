import { getChog, seeded } from "./chogs";
import { CLASHES, OPPOSITES, TAG_LABEL, tagsFor, traitBehind } from "./vibes";
import type { Compatibility } from "./types";

// Trait-based compatibility. Deterministic: the same pair always scores the same, and
// every point comes with a reason a person can read on the card.
export function compatibility(aId: number, bId: number): Compatibility {
  const a = getChog(aId), b = getChog(bId);
  const ta = tagsFor(a.traits), tb = tagsFor(b.traits);
  const reasons: { text: string; weight: number }[] = [];
  let score = 30;

  for (const tag of ta.slice(0, 5)) {
    if (!tb.slice(0, 5).includes(tag)) continue;
    const wa = traitBehind(a.traits, tag), wb = traitBehind(b.traits, tag);
    score += 9;
    reasons.push({
      text: wa && wb && wa !== wb ? `Both ${TAG_LABEL[tag]}s (${wa} × ${wb})` : `Both ${TAG_LABEL[tag]}s`,
      weight: 9,
    });
  }
  for (const [x, y, why] of OPPOSITES) {
    if ((ta.includes(x) && tb.includes(y)) || (ta.includes(y) && tb.includes(x))) {
      score += 11;
      reasons.push({ text: `Opposites attract: ${why}`, weight: 11 });
    }
  }
  for (const [x, y, why] of CLASHES) {
    if ((ta.includes(x) && tb.includes(y)) || (ta.includes(y) && tb.includes(x))) {
      score -= 10;
      reasons.push({ text: `Red flag: ${why}`, weight: 8 });
    }
  }
  if (a.traits.Background === b.traits.Background) {
    score += 6;
    reasons.push({ text: `Same ${a.traits.Background} sky`, weight: 6 });
  }
  if (a.traits.Side !== b.traits.Side) {
    score += 4;
    reasons.push({ text: "Facing each other (left × right)", weight: 4 });
  }
  if (a.traits.Head && a.traits.Head === b.traits.Head) {
    score += 7;
    reasons.push({ text: `Matching ${a.traits.Head}`, weight: 7 });
  }

  score += Math.round((seeded(Math.min(aId, bId), Math.max(aId, bId)) - 0.5) * 16); // the inexplicable spark
  score = Math.max(3, Math.min(99, score));
  if (!reasons.length) reasons.push({ text: score > 50 ? "Inexplicable spark" : "Nothing in common. Yet.", weight: 1 });

  return { score, reasons: reasons.sort((p, q) => q.weight - p.weight).slice(0, 3).map((r) => r.text) };
}
