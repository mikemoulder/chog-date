"use client";
import { useState } from "react";
import { ChemistryChart, candlesFrom } from "../chart";

const A = { name: "Chog #1463", image: "/chogs/2.webp" };
const B = { name: "Chog #1473", image: "/chogs/12.webp" };

const STAGES = [
  { name: "Swipe", clause: "Swipe as your Chog." },
  { name: "Date", clause: "Text in character." },
  { name: "Official", clause: "Make it official." },
  { name: "Unmask", clause: "Meet the human behind it." },
];

// How it works, driven by one slider: the clause on the orange field, the matching piece of
// the real app on the black one.
export function Stages() {
  const [i, setI] = useState(0);
  return (
    <div className="grid min-h-[88svh] lg:grid-cols-2">
      <div className="order-2 flex flex-col justify-between bg-orange px-4 py-10 sm:px-7 lg:order-1 lg:py-14">
        <h2 key={i} className="max-w-[12ch] font-semibold tracking-[-0.04em] text-ink" style={{ fontSize: "var(--step-head)", lineHeight: 0.98, animation: "bubble-in 200ms var(--ease) both" }}>
          {STAGES[i].clause}
        </h2>
        <p className="mt-8 max-w-[40ch] text-[17px] leading-[1.5] text-ink">
          {[
            "Every Chog in the collection is in the deck. Compatibility comes from traits, with the reasons on the card. Chogs whose holders haven't arrived yet are run by AI and answer straight away.",
            "Type the lines yourself, pick from three your Chog suggests, or let it talk on autopilot. Every text moves the chemistry, one candle at a time.",
            "Good dates move a couple from first date to dating, official and married. Neglect them for days and the chemistry fades.",
            "Once you're Official, both holders can reveal their X or Discord. Nobody sees a handle unless both choose to.",
          ][i]}
        </p>
      </div>

      <div className="order-1 flex min-h-[46svh] items-center justify-center bg-ink px-4 py-10 lg:order-2" data-ui>
        <div key={i} className="w-full max-w-[440px]" style={{ animation: "pop-in 200ms var(--ease) both" }}>
          {i === 0 && <SwipeFragment />}
          {i === 1 && <DateFragment />}
          {i === 2 && <OfficialFragment />}
          {i === 3 && <UnmaskFragment />}
        </div>
      </div>

      <div className="order-3 col-span-full bg-orange-2 px-4 py-6 sm:px-7">
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          aria-label="Stage"
          aria-valuetext={STAGES[i].name}
          className="stage-range w-full"
          style={{ "--p": `${(i / 3) * 100}%` } as React.CSSProperties}
        />
        <ol className="mt-3 grid grid-cols-2 gap-y-1 text-[17px] sm:grid-cols-4">
          {STAGES.map((s, n) => (
            <li key={s.name}>
              <button onClick={() => setI(n)} className={n === i ? "font-semibold text-ink" : "text-ink-soft hover:text-ink"}>
                {s.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Face({ c, size = 40 }: { c: typeof A; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={c.image} alt={c.name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
}

function SwipeFragment() {
  return (
    <div className="overflow-hidden rounded-card bg-surface text-paper">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={B.image} alt={B.name} width={512} height={512} className="aspect-[5/4] w-full object-cover" />
      <div className="p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[20px] font-semibold">{B.name}</h3>
          <span className="num text-[24px] font-semibold text-accent">84%</span>
        </div>
        <p className="text-[14px] text-muted">The Side-Eye Monarch · AI-run</p>
        <ul className="mt-3 space-y-1 text-[14px] text-[#d7d7d7]">
          <li>Opposites attract: a royal and a rogue</li>
          <li>Facing each other, left and right</li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <span className="btn btn-outline">Pass</span>
          <span className="btn btn-primary">Like</span>
        </div>
      </div>
    </div>
  );
}

const LINES: [typeof A, string, number][] = [
  [B, "Modern VR goggles on a first date. Bold.", 2],
  [A, "only to my 10k TPS heart", 6],
  [B, "It's an heirloom. Unlike your hoodie, which is merch.", -4],
  [A, "monad merch is couture", 3],
  [B, "...fine. that was good.", 8],
];

function DateFragment() {
  const candles = candlesFrom(48, LINES.map((l) => l[2]));
  return (
    <div className="overflow-hidden rounded-card bg-surface text-paper">
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-[14px] font-semibold">
          {A.name} and {B.name}
        </p>
        <p className="num text-[14px] text-muted">
          Chemistry <span className="text-[20px] font-semibold text-paper">{Math.round(candles.at(-1)!.close)}</span>
        </p>
      </div>
      <div className="px-5 pt-2">
        <ChemistryChart candles={candles} height={56} slots={6} />
      </div>
      <div className="space-y-2 p-5">
        {LINES.slice(1).map(([who, body], n) => (
          <div key={n} className={who === A ? "flex justify-end" : "flex"}>
            <p className={who === A ? "max-w-[80%] rounded-[18px] rounded-br-[6px] bg-paper px-3.5 py-2 text-[14px] text-ink" : "max-w-[80%] rounded-[18px] rounded-bl-[6px] bg-raised px-3.5 py-2 text-[14px]"}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OfficialFragment() {
  const stages = ["Matched", "First date", "Dating", "Official", "Married"];
  return (
    <div className="rounded-card bg-surface p-5 text-paper">
      <div className="flex items-center gap-3">
        <div className="flex">
          <Face c={A} />
          <span className="-ml-3 inline-flex"><Face c={B} /></span>
        </div>
        <div>
          <p className="text-[16px] font-semibold">Official</p>
          <p className="text-[13px] text-muted">3 dates · chemistry 71</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-5 gap-1.5">
        {stages.map((s, n) => (
          <div key={s}>
            <div className={n <= 3 ? "h-1.5 rounded-full bg-accent" : "h-1.5 rounded-full bg-raised"} />
            <p className={n === 3 ? "mt-2 text-[12px] text-paper" : "mt-2 text-[12px] text-faint"}>{s}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[14px] text-[#d7d7d7]">Married takes 5 dates and chemistry over 82. Two more good dates.</p>
    </div>
  );
}

function UnmaskFragment() {
  return (
    <div className="rounded-card bg-surface p-5 text-paper">
      <div className="flex items-center gap-3">
        <Face c={B} size={48} />
        <div>
          <p className="text-[16px] font-semibold">{B.name} is unmasked</p>
          <p className="text-[13px] text-muted">You both chose to reveal</p>
        </div>
      </div>
      <div className="mt-5 rounded-panel bg-raised p-4">
        <p className="text-[13px] text-muted">The human behind {B.name}</p>
        <p className="mt-1 text-[24px] font-semibold">@their_handle</p>
      </div>
      <p className="mt-4 text-[14px] text-[#d7d7d7]">Their Chog liked yours first. Say hi.</p>
    </div>
  );
}
