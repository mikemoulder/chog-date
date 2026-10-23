import type { Traits } from "./types";

// Trait values → personality tags. This is the part that makes the NFT the dater:
// every tag below comes from what the Chog is wearing, holding or radiating.

export const TAGS = [
  "degen", "monad", "bitcoin", "royal", "chaotic", "melancholy", "wholesome", "flirty",
  "tough", "mystic", "street", "sporty", "cozy", "fancy", "unhinged", "clown",
  "weeb", "nerd", "broke", "hustler", "rebel", "zen", "fiery", "cursed",
] as const;
export type Tag = (typeof TAGS)[number];

const RULES: [RegExp, Tag[]][] = [
  // Head
  [/mon cap|mon beanie|10k tps|chog cap|choggie|mega chog|mcga|mmga/, ["monad"]],
  [/btc|buttcoin/, ["bitcoin", "degen"]],
  [/eth cap/, ["nerd"]],
  [/wagmi|jeet|dollar cap|green candle|red candle|coin$|sb$/, ["degen", "hustler"]],
  [/wizard|3rd eye|holy seal|thorn|wreath|jesus|virgin/, ["mystic"]],
  [/crown|king|royal|golden armor|gold$|noble|ceo/, ["royal", "fancy"]],
  [/spartan|army|squid game guard|knife|robber|gangster|thug|prisoner|inmate/, ["tough", "street"]],
  [/durag|chug life|trackset|bucket cap|homeless|zero thots/, ["street"]],
  [/horny|boob|milf|lip bite|heart|rose|six seven|bbc|boner/, ["flirty"]],
  [/clown|rainbow wig|8 ball|taped banana|banana suit|duck float/, ["clown", "chaotic"]],
  [/retard|tism|neet|rainbow puke|drooling|xd|mixed/, ["unhinged", "chaotic"]],
  [/sad|crying|tear|teary|worried|tired|dead|grey|smoke/, ["melancholy"]],
  [/happy|smile|bubblegum|peace|cloud|star cap|mint|lemon|sunlight|peach/, ["wholesome"]],
  [/anime|gojo|guko|japan|yukata|chinese|dragon|squid game$/, ["weeb"]],
  [/vr|visor|sci fi|astro|glitch|electro|3d glass|retro glass/, ["nerd"]],
  [/jersey|sleeveless|tank|headband|plumber|sporty/, ["sporty"]],
  [/hoodie|beanie|tee$|cozy|shirt$/, ["cozy"]],
  [/tuxedo|vest|suit$|cigar|robe/, ["fancy"]],
  [/broke|homeless/, ["broke"]],
  [/laser|fire|burning|fiery|thunder|electric|grit|angry|demon|red horn/, ["fiery"]],
  [/skull|radioactive|mummy|void|horn|blood|dead/, ["cursed"]],
  [/side eye|smirk|mog|chog viper|russian/, ["rebel"]],
  [/aura|clean|wind|mist|scent/, ["zen"]],
  [/fwog|pepe|frog/, ["degen", "chaotic"]],
  [/gold tooth|mon coin|btc coin/, ["hustler"]],
];

export function tagsFor(traits: Traits): Tag[] {
  const counts = new Map<Tag, number>();
  for (const [type, value] of Object.entries(traits)) {
    if (type === "Side" || type === "Tier" || value === "No") continue;
    const v = value.toLowerCase();
    for (const [re, tags] of RULES) if (re.test(v)) for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  if (traits.Naked === "Yes") counts.set("flirty", (counts.get("flirty") ?? 0) + 2);
  if (traits.Form === "Skull") counts.set("cursed", (counts.get("cursed") ?? 0) + 2);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

// Which trait produced a tag, for "Both rock BTC gear" style reasons.
export function traitBehind(traits: Traits, tag: Tag): string | undefined {
  for (const [type, value] of Object.entries(traits)) {
    if (type === "Side" || type === "Tier") continue;
    const v = value.toLowerCase();
    if (RULES.some(([re, tags]) => tags.includes(tag) && re.test(v))) return value;
  }
}

export const TAG_LABEL: Record<Tag, string> = {
  degen: "degen", monad: "Monad maxi", bitcoin: "BTC believer", royal: "royalty", chaotic: "chaos agent",
  melancholy: "sad boi", wholesome: "wholesome", flirty: "flirt", tough: "tough guy", mystic: "mystic",
  street: "street", sporty: "sporty", cozy: "cozy", fancy: "fancy", unhinged: "unhinged", clown: "clown",
  weeb: "weeb", nerd: "nerd", broke: "broke", hustler: "hustler", rebel: "rebel", zen: "zen", fiery: "hothead",
  cursed: "cursed",
};

// Pairs that attract even though they're different.
export const OPPOSITES: [Tag, Tag, string][] = [
  ["melancholy", "wholesome", "one cries, the other brings snacks"],
  ["royal", "street", "a royal and a rogue"],
  ["royal", "broke", "rags-to-riches arc pending"],
  ["fiery", "zen", "fire meets calm"],
  ["unhinged", "zen", "someone has to be the adult"],
  ["flirty", "nerd", "the nerd has never been flirted with"],
  ["tough", "wholesome", "big softie energy"],
  ["cursed", "mystic", "spiritually compatible"],
  ["clown", "melancholy", "laughter is the medicine"],
  ["fancy", "chaotic", "black-tie chaos"],
  ["bitcoin", "monad", "old money meets new chain"],
];

// Pairs that clash.
export const CLASHES: [Tag, Tag, string][] = [
  ["fiery", "fiery", "two hotheads, one kitchen"],
  ["hustler", "broke", "money talk will get awkward"],
  ["royal", "rebel", "will not bow"],
];
