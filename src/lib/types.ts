// Shared contract between the UI and the API. Change deliberately.

export type Traits = Record<string, string>;

export type ChogMeta = {
  tokenId: number;
  name: string;
  traits: Traits;
  owner: string; // snapshot owner, lowercase
};

export type Mode = "manual" | "copilot" | "autopilot";

export type Persona = {
  archetype: string; // "The Degen Romantic"
  vibe: string; // one line, how they come across
  quirks: string[]; // 2-3 concrete habits drawn from traits
  loveLanguage: string;
  greenFlags: string[];
  redFlag: string;
  voice: string; // how they talk: cadence, slang, emoji use
};

export type Profile = {
  tokenId: number;
  name: string;
  image: string; // local thumbnail path
  traits: Traits;
  persona: Persona;
  bio: string;
  claimed: boolean; // a holder has signed in as this Chog
  mode: Mode; // unclaimed Chogs are always autopilot
};

export type Compatibility = {
  score: number; // 0-100
  reasons: string[]; // human-readable, shown on the card
};

export type DeckCard = Profile & { compatibility: Compatibility; likesYou: boolean };

export const STAGES = ["matched", "first_date", "dating", "official", "married", "broken_up"] as const;
export type Stage = (typeof STAGES)[number];

export type CoupleSummary = {
  id: string;
  me: Profile;
  partner: Profile;
  stage: Stage;
  chemistry: number; // 0-100
  dates: number; // completed date sessions
  lastMessage?: { body: string; senderTokenId: number; at: string };
  canDateNow: boolean;
  nextDateAt?: string;
};

export type Message = {
  id: string;
  senderTokenId: number;
  body: string;
  author: "human" | "ai";
  chemistryDelta: number;
  createdAt: string;
};

export type DateSession = {
  index: number; // 1-based date number
  messages: Message[];
  done: boolean;
  summary?: string;
};

export type CoupleDetail = CoupleSummary & {
  session: DateSession;
  unmask: { me: boolean; partner: boolean; partnerHandle?: string };
};

export type FeedEvent = {
  id: string;
  kind: "admirer" | "match" | "date" | "stage" | "breakup" | "claimed";
  tokenId: number;
  otherTokenId?: number;
  text: string;
  createdAt: string;
};

export type Me = {
  address: string;
  chogs: Profile[]; // Chogs this wallet holds right now
  activeTokenId?: number;
};
