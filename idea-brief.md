# Idea brief: Chog Date

## The sentence

> We built **Chog Date** for **Chog Genesis holders**, letting them **swipe, date and
> fall in love as their Chog**, using **each NFT's traits as a living personality** to
> make **an NFT that has its own love life** possible.

## The rules we build under

- **Holders only.** No wallet holding a Chog Genesis NFT, no entry. There is no
  spectator or non-holder role, because that would make the NFT optional.
- **The Chog is the dater, not a profile picture.** Traits decide personality,
  compatibility and how dates go. The relationship belongs to the token.
- **Judges hold Chogs**, so the real holder flow is the judged flow. No demo bypass.

## Problem

**Who:** a Chog Genesis holder who has had the NFT in their wallet for months.
**Pain:** the Chog does nothing. It is a picture and a floor price, so there is no
reason to open anything daily, and no way to meet the other holders through the
character they actually chose.
**Evidence:** the hackathon's brief asks for exactly this, "a new way to use or
interact with NFTs", and gates on the NFT being essential.

## Solution

Every one of the 1,969 Chogs already has a dating profile, a personality written from
its traits. Holders swipe for their Chog, match, and go on in-character dates that
they type themselves, co-write with an AI, or hand over to the AI entirely. Chogs whose
owners have not arrived yet are run by the AI, clearly labelled. When a real owner
claims one, they inherit its relationships. Couples who get serious can unmask and
meet the humans behind the Chogs.

## Why now

Cheap, fast LLMs make it possible to give 1,969 NFTs a consistent, trait-grounded
personality and to run thousands of in-character conversations for pennies. Chog
Genesis is a fresh, culturally loud collection whose art is a character, not an
abstraction.

## Why this technology

| Technology | Used for | Depth | Remove it and… |
|---|---|---|---|
| Chog Genesis NFT | Identity, personality (traits), sign-in gate, relationship owner | Essential | There is no dater, no profile, no access. The app does not exist |
| Wallet sign-in + ownership check | Proving you control the Chog you date as; handing control to a new owner on transfer | Essential | Anyone could date as any Chog |
| LLM (OpenAI) | Persona generation, AI-run Chogs, co-pilot lines, chemistry scoring | Essential | Unclaimed Chogs go silent and the deck is empty on day one |
| $CHOG | Roses, super-likes, date venues, wedding gifts | Valuable (bonus) | Dating still works; gifting and the bonus points go |

## The aha moment

**At 0:30 the judge sees:** their own Chog's dating profile, already written from its
traits, then a match, then the two Chogs flirting live in character while a chemistry
meter climbs.

**Why it lands:** visible (it happens on screen), fast (under 30 seconds), unexpected
(their NFT has a personality they did not write), legible (everyone knows Tinder).

## Demo script

| Time | What you do | What appears | What the system is doing |
|---|---|---|---|
| 0:00 | "What if your Chog could find its soulmate?" Connect wallet | "Chog #1204 is ready to mingle", its profile and bio | Verifies ownership, loads the trait-generated persona |
| 0:15 | Swipe through three Chogs | Profiles, compatibility %, "Unclaimed · AI-run" badges | Trait compatibility scoring |
| 0:30 | Swipe right, it's a match | Match screen | AI-run Chog accepts based on compatibility |
| 0:45 | Start a date in co-pilot mode, pick and edit a line | In-character chat, chemistry meter moving | LLM plays the other Chog, scores chemistry per turn |
| 1:30 | Switch to a second wallet that just claimed a Chog | "While you were gone: 3 dates, 2 admirers" | Claim handoff, relationship history inherited |
| 2:00 | Show a couple at "Official", both owners unmask | Out-of-character chat with X / Discord revealed | Mutual opt-in reveal |
| 2:30 | Send a rose with $CHOG, show the streak and stage bar | "Day 4 streak · Dating → Official" | $CHOG transfer, relationship progression |
| 2:50 | "Your Chog's love life lives on the token. Sell it, and the drama goes with it." | Logo | |

**Fallback:** a recorded run of the same script, cut to under three minutes, used for
the submission video anyway.

## MVP

```text
MUST HAVE       the aha moment cannot happen without these
  - Index all 1,969 Chogs: token ID, image, traits, current owner
  - Persona generator: trait-grounded bio + personality, pre-generated and cached
  - Wallet sign-in, holder gate, pick which Chog you're dating as
  - Swipe deck with trait compatibility score
  - Matching: mutual like for claimed Chogs, AI decides for unclaimed ones
  - Date chat in-character, three modes: manual / co-pilot / autopilot
  - AI-run Chogs, clearly labelled "Unclaimed · AI-run"
  - Chemistry meter and relationship stages
    (Matched → First date → Dating → Official → Married)
  - Claim handoff inbox: "While you were gone…"
  - Ownership follows the token: transfer = new owner inherits relationships

SHOULD HAVE     build only after every MUST is done and deployed
  - Unmask: mutual opt-in reveal of X / Discord at Official or later
  - Daily limits: swipes per day, one date per couple per day, streaks
  - Neglect decay and breakups
  - $CHOG gifts: roses, super-likes, date venues

NICE TO HAVE    build only if you are ahead
  - The Daily Chog: gossip column generated from the day's matches and breakups
  - Power-couple leaderboard
  - Shareable date-transcript cards for X

CUT             decided, written down, not revisited
  - Any non-holder role (spectators, matchmakers, betting)
  - Onchain relationship contracts / soulbound tokens
  - Breeding, baby Chogs, generated art
  - Voice or video dates
  - Mobile app (responsive web only)
```

## Scope check

```text
Build hours available:       TBD (14-day window; team size and hours per day needed)
Honest estimate for MUST:    TBD once team is known
Ratio:                       must be under 0.5
Riskiest component:          reading traits + current owner for all 1,969 tokens
                             reliably (chain, contract, metadata source); prove day 1
```

## Risks

| Risk | If it happens | Mitigation |
|---|---|---|
| **Technical** | Metadata or ownership lookups are slow or unreliable | Index once into our DB, refresh owners on a schedule and on sign-in |
| **Technical** | LLM costs balloon from autopilot vs autopilot dates | Daily date limits, small fast model for AI-run turns, cache personas |
| **Product** | Personas feel generic, every Chog sounds the same | Map each trait to concrete personality hooks; hand-tune the prompt on 20 Chogs |
| **Product** | Inappropriate content in manual mode | Moderation pass on every human message, report and block |
| **Demo** | AI date stalls or rambles live | Short turns, streaming, recorded fallback |

## The hard question

**They will ask:** "Isn't this just a chatbot wearing NFT art?"
**You answer:** "No. The traits are the personality, they decide compatibility and how
the date goes, and the relationship is attached to the token. Holders date as
themselves through their Chog, AI only covers Chogs whose owners haven't arrived, and
when an owner claims one they inherit its whole love life. Take the NFT away and there
is no dater, no profile and no way in."

**What is hardcoded:** the trait-to-personality mapping and the compatibility formula
are hand-written rules; personas are pre-generated, not regenerated per visit.

## Tracks targeted

| Track / sponsor | Prize | Why we qualify | Integration depth |
|---|---|---|---|
| Chogathon main pool | $15K pool, 50 winners, 1st $4,500 | NFT is the dater, the identity and the gate | rung 4 |
| $CHOG bonus | Bonus points | Gifts, super-likes and venues paid in $CHOG | rung 2 |

## Handoff

```text
demo.hero_screen      The live date: two Chogs in-character chat with the chemistry meter
Owner per MUST item   TBD, assign before anyone opens an editor
Next skill            /skillz:architecture, then /skillz:frontend
```
