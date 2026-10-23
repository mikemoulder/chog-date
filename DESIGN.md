# DESIGN: Chog Date

Fast path (frontend skill). Uncalibrated; direction tokens adapted once, reasons below.

## 1. Distill

- **What:** your Chog swipes, dates and falls in love; you're the wingman.
- **For:** a Chog Genesis holder, on their phone, between trades.
- **The one action:** swipe right, then watch (or steer) the date.
- **Mechanism:** traits → personality → an in-character date whose every line moves a chemistry score.
- **Feels:** cheeky, loud, warm. **Never:** corporate, sleazy, crypto-dashboard grey.
- **Proof on screen:** the date itself, live, with the meter moving.

## 2. Signature: the chemistry chart

Candidates: heart thermometer (generic, 8) · swipe stack (every dating app, 7) ·
**chemistry candles (14)** · wedding bells timeline (9) · love-letter envelope (8).

**Chosen: the chemistry chart.** A date is traded like a token. Every line printed in
the chat prints a candle: green when it landed, red when it flopped, and the ticker
above reads `CHEM 64 ▲ +6`. Crypto-native, funny, and it makes the invisible
(how the date is going) legible in one glance. Chogs literally wear Green Candle and
Red Candle accessories.

- Still frame: 8 candles, mostly green, last one tall green, ticker up.
- Motion: a new candle grows from its open to its close in 160ms; ticker counts.
- Reduced motion: candles drawn at final size.
- Phone: chart is a 64px strip pinned under the date header.

## 3. Direction: bold-signal, sticker variant (light)

Bone ground, ink 2px outlines and hard offset shadows: the same language as the Chog
art (thick black outlines, flat fills). One accent: **hot pink `#FF3D8B`, meaning
"love / like / match"**, used as a fill, never as body text. Green/red come only from
state tokens and only on candles and deltas.

Deviation from the direction's tokens, on purpose: corners are **14px** (tiles),
**12px** (buttons), not 0. The art is round; square boxes around round cartoons read
as a template.

Fonts: Bricolage Grotesque (400, 700, 800) + JetBrains Mono for labels.

## 4. Storyboard (app, mobile-first)

1. **Gate `/`**: "Your Chog is single." Connect, sign, holders only. A band of real Chogs scrolls under it.
2. **Pick `/pick`**: choose which Chog you date as. Claiming opens "While you were gone".
3. **Swipe `/swipe`**: one card. Art, archetype, bio, compatibility with reasons. AI-run badge.
4. **Match**: full-screen moment, both faces, "Start the date".
5. **Date `/date/[id]`** (hero): faces + stage, chemistry chart, chat, composer by mode.
6. **Matches `/matches`**: rows, stage chip, chemistry, date-ready dot.
7. **Gossip `/gossip`**: The Daily Chog, recaps of dates across the collection.
8. **Me `/me`**: your Chog's profile, mode, feed.

## 5. Screenshot sentence

> Two cartoon Chogs flirting in a chat while a green-and-red candle chart of their
> chemistry pumps above them.

## 6. Thesis

A dating app where the NFT is the one dating, and the date trades like a chart.
