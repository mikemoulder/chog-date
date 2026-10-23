# Chog Date: architecture

One Next.js app, one deploy, one Postgres. Everything that leaves the process goes
through a seam with a fallback, so the demo survives a dead RPC or a missing API key.

```
 Browser (wagmi, injected wallet)
    │  sign-in message, swipes, chat
    ▼
 Next.js App Router ── src/app/api/*  (route handlers = the backend)
    │            │                 │
    ▼            ▼                 ▼
 Postgres     Monad RPC          OpenAI API
 (Drizzle)    src/lib/chain.ts   src/lib/llm.ts
              ownerOf,           personas, in-character
              tokensOfOwner      replies, chemistry scoring
    ▲
 data/chogs.json  (snapshot of all 1,969 tokens: traits + image, from scripts/index-chogs.mjs)
```

## Verified facts (spiked, 2026-10-23)

| Fact | Value |
|---|---|
| Chain | Monad mainnet, chain id 143, `https://rpc.monad.xyz` |
| Contract | Chog Genesis `0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763` (ERC721A) |
| Token ids | 1 … 1969 (`ownerOf(0)` and `ownerOf(1970)` revert) |
| Owned tokens | `tokensOfOwner(address)` works (ERC721A queryable), one call |
| Metadata | `ipfs://bafybeid4y…/N.json`, token id ≠ file number (shuffled reveal), so always read `tokenURI` |
| Traits | Background, Base, Skin, Side, Body, Mouth, Eyes, Head, Accessory, Aura, Form, Tier, Naked |
| Images | 1000px webp, ~300KB, on IPFS. Thumbnails generated into `public/chogs/` |
| Gateways | Public IPFS gateways rate-limit; `ipfs.filebase.io` and `gateway.pinata.cloud` answer |

## Stack

Next.js 15 App Router + Tailwind v4 · Drizzle on Postgres (PGlite in dev, `DATABASE_URL`
in prod) · viem/wagmi for Monad · iron-session cookie for the signed-in wallet ·
`openai` with strict JSON-schema structured outputs and a fallback model chain · Vercel.

## Where the NFT is load-bearing

- **Sign-in gate:** a signed message proves the wallet; `tokensOfOwner` decides which
  Chogs it can act as. No Chog, no entry.
- **Every action re-checks ownership** (`ownerOf`, cached 60s). Sell the Chog and the
  next request from the old wallet is refused; the buyer inherits its relationships.
- **Traits drive behaviour:** persona, compatibility and the date prompt are all
  derived from the token's traits.

## State

| Table | Holds |
|---|---|
| `chog_state` | per token: claimed-by address, mode (manual/copilot/autopilot), generated bio, last seen |
| `swipes` | from token → to token, liked, day |
| `couples` | pair of tokens, stage, chemistry, date count, unmask flags + handles |
| `messages` | couple, sender token, body, author (human/ai), chemistry delta |
| `events` | per token feed: admirer, match, date, stage change; drives "While you were gone" |
| `gifts` | $CHOG gifts: holder tx hash (primary key) and builder tx hash (unique), so each transfer pays once; kind, from/to token, price, holder address |

## $CHOG gifts

Rose (250), super-like (500) and candlelit dinner (1,000) cost $CHOG (`0x3500…7777`, 18
decimals). Each is two transfers from the signed-in wallet: 90% to whoever holds the
receiving Chog right now (`ownerOf`), 10% to the builder (`BUILDER_ADDRESS`). The browser
asks `/api/gifts/quote` for both addresses, sends both, waits for confirmation, then posts
the two hashes. The server re-reads the holder, fetches both receipts from Monad and
requires matching $CHOG `Transfer`s for each share (`verifyGiftPayment` in
`src/lib/chain.ts`, `sumTransfers` in `src/lib/gifts.ts`). Gifting a Chog in your own wallet
is refused. Paid super-likes skip the daily swipe limit, since they are already paid for.

## Seams

| Dependency | Module | Fallback |
|---|---|---|
| OpenAI | `src/lib/llm.ts` | Next model in `OPENAI_MODELS` on a rate limit, error or timeout; then deterministic template replies (`LLM_FIXTURES=1` or no key) |
| Personas | `data/personas.json` (`scripts/gen-personas.mts`) | Trait-based template persona. Never generated at request time |
| Monad RPC | `src/lib/chain.ts` | Snapshot owners from `data/chogs.json` when the RPC fails |
| Images | `public/chogs/*.webp` | Served locally, no gateway at runtime |
