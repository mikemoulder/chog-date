import Link from "next/link";
import { Lookup } from "@/components/landing/lookup";
import { PrimaryAction } from "@/components/landing/cta";
import { Roses } from "@/components/landing/roses";
import { Stages } from "@/components/landing/stages";
import { Logo } from "@/components/shell";
import { allChogs, imageFor } from "@/lib/chogs";
import { lookup } from "@/lib/lookup";

// The page: "the sentence is the layout" (taste-skill, seed 62795678).
// Idea: the 1,969 Chog faces become the word "Chog" in "Your Chog is single."

const OPENSEA = "https://opensea.io/collection/chog-genesis";
const DEX = "https://dexscreener.com/monad/0x350035555e10d9afaf1566aaebfced5ba6c27777";

// One Chog per background colour, so the strip shows the collection's range.
function stripFaces() {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const c of allChogs()) {
    const bg = c.traits.Background;
    if (seen.has(bg) || c.traits.Form === "Skull") continue;
    seen.add(bg);
    out.push(c.tokenId);
    if (out.length === 14) break;
  }
  return out;
}

export default function Home() {
  const faces = stripFaces();
  const strip = [...faces, ...faces];
  return (
    <main className="overflow-x-clip bg-orange text-[17px] leading-[1.5] text-ink">
      {/* Hero: the sentence, with the faces where the word would be */}
      <section className="relative flex min-h-svh flex-col px-4 sm:px-7">
        <nav className="flex h-16 items-center justify-between text-[17px]" aria-label="Main">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex gap-6">
            <a href="#how" className="hover:underline">
              How it works
            </a>
            <a href={OPENSEA} target="_blank" rel="noreferrer" className="hover:underline">
              Get a Chog
            </a>
          </div>
        </nav>

        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-[16vw] font-semibold tracking-[-0.045em] sm:text-[clamp(64px,8.6vw,168px)]" style={{ lineHeight: 0.95 }}>
            <span className="flex flex-col items-start gap-[0.12em] sm:flex-row sm:items-baseline sm:gap-[0.22em]">
              <span>Your</span>
              <span className="sr-only">Chog</span>
              <span
                aria-hidden
                className="relative block aspect-[2/1] w-full overflow-hidden rounded-[14px] bg-ink sm:aspect-auto sm:h-[0.74em] sm:flex-1 sm:self-center sm:translate-y-[0.06em]"
                style={{ animation: "shutter 1.1s var(--ease) both" }}
              >
                <span className="absolute inset-0 flex" style={{ animation: "settle 1.4s var(--ease) both" }}>
                  <span className="flex h-full w-max" style={{ animation: "strip 46s linear infinite" }}>
                    {strip.map((id, n) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={n} src={imageFor(id)} alt="" width={512} height={512} className="h-full w-auto shrink-0 object-cover" />
                    ))}
                  </span>
                </span>
              </span>
              <span className="whitespace-nowrap">is single.</span>
            </span>
          </h1>
          <div className="mt-10 flex justify-center sm:mt-[min(150px,12vh)]">
            <PrimaryAction />
          </div>
        </div>

        <p className="mx-auto mb-12 mt-10 max-w-[44ch] text-center text-[18px] leading-[1.45] sm:text-[22px]">
          A dating app for the 1,969 Chog Genesis NFTs. Your Chog swipes, texts and falls in love in character. You&apos;re the wingman.
        </p>
      </section>

      {/* Showcase: the headline is an input */}
      <section className="min-h-[88svh] bg-paper px-4 py-16 sm:px-7 lg:py-24" aria-labelledby="profiles">
        <h2 id="profiles" className="max-w-[18ch] font-semibold tracking-[-0.03em]" style={{ fontSize: "var(--step-head)", lineHeight: 1 }} data-rise>
          Every Chog already has a profile.
        </h2>
        <p className="mt-4 max-w-[52ch] text-[17px]" data-rise style={{ "--d": "80ms" } as React.CSSProperties}>
          All 1,969 have a personality written from their traits, before their holder ever signs in. Try one.
        </p>
        <div className="mt-10" data-rise style={{ "--d": "160ms" } as React.CSSProperties}>
          <Lookup initial={lookup("Kings Robe")} />
        </div>
      </section>

      {/* How it works: drag through the stages */}
      <section id="how" aria-label="How it works">
        <Stages />
      </section>

      {/* Stats: the figure is the visitor's own */}
      <section aria-label="Roses">
        <Roses />
      </section>

      {/* CTA: a question at both edges */}
      <section className="relative flex h-svh min-h-[560px] flex-col items-center justify-between bg-ink px-4 py-8 text-orange sm:px-7">
        <h2 className="flex h-full w-full flex-col items-center justify-between text-center font-semibold tracking-[-0.045em]" style={{ fontSize: "clamp(64px, 8.6vw, 168px)", lineHeight: 1 }}>
          <span>Got a Chog?</span>
          <span>Want one?</span>
        </h2>
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 sm:inset-x-7">
          <div className="flex w-[72%] flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-0">
            <PrimaryAction tone="orange" size="lg" />
            <span className="text-[17px] text-orange/70 sm:mx-14">or</span>
            <a className="btn btn-lg !bg-paper !text-ink hover:!bg-[#eee]" href={OPENSEA} target="_blank" rel="noreferrer">
              Find one on OpenSea
            </a>
          </div>
          <p className="mt-2 text-center text-[17px] text-orange/80">Connecting asks for one signature to prove you hold a Chog. No transaction, no gas.</p>
        </div>
      </section>

      {/* Footer: an invitation over the cropped name */}
      <footer className="relative flex min-h-svh flex-col overflow-hidden bg-orange px-4 pt-16 sm:px-7">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7" data-rise>
            <h2 className="max-w-[14ch] font-semibold tracking-[-0.04em]" style={{ fontSize: "var(--step-head)", lineHeight: 0.98 }}>
              Your Chog&apos;s first date is waiting.
            </h2>
            <div className="mt-8">
              <PrimaryAction />
            </div>
          </div>
          <ul className="space-y-2 text-[17px] lg:col-span-3 lg:col-start-10" data-rise style={{ "--d": "100ms" } as React.CSSProperties}>
            <li><a className="hover:underline" href={OPENSEA} target="_blank" rel="noreferrer">Chog Genesis on OpenSea</a></li>
            <li><a className="hover:underline" href={DEX} target="_blank" rel="noreferrer">$CHOG on DEX Screener</a></li>
            <li><a className="hover:underline" href="https://chogathon.chog.xyz" target="_blank" rel="noreferrer">Built for Chogathon 2026</a></li>
          </ul>
        </div>
        <div className="mt-auto">
          <div className="flex flex-wrap justify-between gap-2 pb-3 text-[13px] text-ink-soft">
            <span>Chog artwork: Chog Genesis by ChogLabs, shown for its holders. Not affiliated with ChogLabs.</span>
            <span>Gifts pay the other Chog&apos;s holder: 90% to them, 10% to the builder.</span>
          </div>
          <p className="select-none whitespace-nowrap font-semibold tracking-[-0.06em]" style={{ fontSize: "clamp(120px, 28vw, 520px)", lineHeight: 0.8, transform: "translateY(22%)" }} aria-hidden>
            chog date
          </p>
        </div>
      </footer>
    </main>
  );
}
