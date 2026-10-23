# Chog Date

Tinder for Chog Genesis NFTs: holders swipe, match and date *as their Chog*. Built for
Chogathon 2026 (https://chogathon.chog.xyz). North star: `idea-brief.md`.
Architecture and verified chain facts: `docs/architecture.md`.

## Rules

- **The NFT must be essential.** Holders only. No guest mode, no non-holder role.
  Ownership is re-checked on-chain on every action; relationships belong to the token.
- **AI-run Chogs are always labelled** "Unclaimed · AI-run". Never let a human think
  an AI is a person.
- Every external call goes through its seam (`src/lib/llm.ts` (OpenAI, model chain in `OPENAI_MODELS`), `src/lib/chain.ts`) and
  has a fallback. The app must run with no API key (`LLM_FIXTURES=1`). Never spend live model calls on profiles: personas come from `data/personas.json`.
- Shared types live in `src/lib/types.ts`. Change them deliberately.
- Secrets server-side only. Nothing secret behind `NEXT_PUBLIC_`.
- Judged on: Novelty 30, Fun 20, Retention 20, Clarity 15, Execution 15, $CHOG bonus.

## Commands

```bash
npm run dev                      # local, PGlite in .pglite/
npm run build                    # must pass before every commit to main
node scripts/index-chogs.mjs     # re-snapshot traits + owners into data/chogs.json
npm run thumbs                   # regenerate public/chogs/*.webp
npm run db:generate              # after editing src/lib/db/schema.ts
npx tsx --env-file=.env.local scripts/gen-personas.mts   # write all 1,969 personas (resumable)
```

## Env

`OPENAI_API_KEY`, `OPENAI_MODELS`, `OPENAI_REASONING`, `DATABASE_URL` (prod), `SESSION_SECRET` (32+ chars),
`MONAD_RPC_URL` (optional), `LLM_FIXTURES=1` (force fixtures), `DATE_COOLDOWN_HOURS`, `DEV_LOGIN=1` (dev only: `/dev` signs in as any Chog's real holder).
