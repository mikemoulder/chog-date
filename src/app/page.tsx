import { Bubble } from "@/components/bubble";
import { candlesFrom, ChemistryChart, Ticker } from "@/components/chart";
import { ChogFace, StageChip } from "@/components/chog";
import { GateCta } from "@/components/gate-cta";
import { Wordmark } from "@/components/shell";

// An example date between two real Chogs, written from their traits. Labelled as an example.
const A = { tokenId: 2, name: "Chog #1463", image: "/chogs/2.webp" }; // Chog Cap, Mon Hoodie, Modern VR
const B = { tokenId: 12, name: "Chog #1473", image: "/chogs/12.webp" }; // Kings Robe, Gold Tooth, Side Eye
const LINES: [typeof A, string, number][] = [
  [B, "Modern VR goggles on a first date. Bold. Am I being livestreamed?", 2],
  [A, "Only to my 10k TPS heart. Nice robe, your majesty. Is the gold tooth load-bearing?", 6],
  [B, "It's an heirloom. Unlike your hoodie, which is merch.", -4],
  [A, "Monad merch is couture. Also you've side-eyed me four times and I'm counting it as flirting.", 8],
  [B, "…Fine. It's flirting. Don't tell the court.", 9],
];
const FACES = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export default function Gate() {
  const candles = candlesFrom(48, LINES.map((l) => l[2]));
  const chem = candles.at(-1)!.close;
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="border-b-2 border-line-strong">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-[var(--gutter)]">
          <Wordmark />
          <span className="chip bg-accent">Chog Genesis holders only</span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-page items-center gap-10 px-[var(--gutter)] py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div>
            <p className="t-label !text-fg-mute">A dating app for 1,969 NFTs</p>
            <h1 className="t-display-xl mt-4">
              Your Chog
              <br />
              is single.
            </h1>
            <p className="t-lead mt-6 max-w-[34ch] !text-fg-soft">
              Every Chog already has a dating profile, written from its traits. Connect, pick your Chog, and swipe. It dates in character. You&apos;re the wingman.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <GateCta />
              <span className="max-w-[24ch] text-[13px] text-fg-mute">Sign a message to prove you hold a Chog. No transaction, no gas.</span>
            </div>
          </div>

          {/* The signature: a date that trades like a chart */}
          <figure className="sticker sticker-pop overflow-hidden" aria-label="Example date">
            <div className="flex items-center justify-between gap-3 border-b-2 border-line-strong p-3">
              <div className="flex items-center gap-3">
                <div className="flex">
                  <ChogFace chog={A} size={40} />
                  <ChogFace chog={B} size={40} className="-ml-3" />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold leading-tight">
                    {A.name} <span className="text-accent">♥</span> {B.name}
                  </p>
                  <StageChip stage="first_date" className="mt-1" />
                </div>
              </div>
              <Ticker value={chem} delta={LINES.at(-1)![2]} />
            </div>
            <div className="border-b-2 border-line bg-surface px-3 py-2">
              <ChemistryChart candles={candles} height={60} slots={8} />
            </div>
            <div className="space-y-3 bg-ground p-4">
              {LINES.map(([who, body, d], i) => (
                <Bubble key={i} from={who} mine={who === A} body={body} delta={d} />
              ))}
            </div>
            <figcaption className="border-t-2 border-line-strong bg-panel px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-fg-mute">
              Example date · both Chogs on autopilot
            </figcaption>
          </figure>
        </section>

        <div className="marquee border-y-2 border-line-strong bg-accent py-3" aria-hidden>
          <div className="marquee-track flex w-max gap-3">
            {[...FACES, ...FACES].map((id, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={`/chogs/${id}.webp`} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-tile border-2 border-line-strong" />
            ))}
          </div>
        </div>

        <section className="mx-auto max-w-page px-[var(--gutter)] py-[var(--section-y)]">
          <h2 className="t-display-l max-w-[18ch]">The NFT does the dating. You do the wingman work.</h2>
          <ol className="mt-10 grid border-t-2 border-line-strong md:grid-cols-3">
            {[
              ["01", "Every Chog has a profile", "All 1,969 Chogs get a personality written from their traits. Laser eyes, a Kings Robe or a Fwog in hand all change who they are and who they fall for."],
              ["02", "Swipe as your Chog", "Compatibility comes from traits, with reasons on every card. Chogs whose holders haven't arrived are AI-run and answer right away, clearly labelled."],
              ["03", "Date in character", "Type the lines yourself, pick from three your Chog suggests, or put it on autopilot. Every line moves the chemistry. Five good dates and they're married."],
            ].map(([n, t, b]) => (
              <li key={n} className="border-b-2 border-line-strong py-6 md:border-b-0 md:border-r-2 md:px-6 md:first:pl-0 md:last:border-r-0">
                <span className="font-mono text-[12px] font-semibold text-fg-faint">{n}</span>
                <h3 className="t-title mt-2">{t}</h3>
                <p className="mt-2 text-[15px] text-fg-soft">{b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 grid gap-6 border-t-2 border-line-strong pt-8 md:grid-cols-2">
            <p className="text-[17px] font-bold">Sell the Chog and its love life goes with it.</p>
            <p className="text-[15px] text-fg-soft">
              Relationships belong to the token, not the wallet. Ownership is checked on Monad on every action. When a new holder claims a Chog, they see everything it got up to while it was AI-run, and take over from there.
            </p>
          </div>
        </section>
      </main>

      <footer className="overflow-hidden border-t-2 border-line-strong">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-[var(--gutter)] py-6 text-[13px] text-fg-mute">
          <span>Built for Chogathon 2026. Not affiliated with Chog Labs.</span>
          <a href="https://opensea.io/collection/chog-genesis" target="_blank" rel="noreferrer" className="underline underline-offset-4">Chog Genesis on OpenSea</a>
        </div>
        <p className="select-none whitespace-nowrap px-[var(--gutter)] text-[22vw] font-extrabold leading-[0.75] tracking-[-0.06em] text-fg" aria-hidden>
          chog date
        </p>
      </footer>
    </div>
  );
}
