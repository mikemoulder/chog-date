"use client";
import { useState } from "react";
import { GIFTS, HOLDER_SHARE_BPS } from "@/lib/gifts";

// Stats: the figure is the visitor's own. Roses in, $CHOG to the other holder out, from the real prices.
export function Roses() {
  const [roses, setRoses] = useState(12);
  const toHolder = (roses * GIFTS.rose.price * HOLDER_SHARE_BPS) / 10000;
  const chemistry = Math.min(100, roses * GIFTS.rose.chemistry);
  return (
    <div className="flex min-h-[88svh] flex-col justify-between bg-paper px-4 py-14 text-ink sm:px-7 lg:py-20">
      <div data-rise>
        <h2 className="font-semibold tracking-[-0.03em]" style={{ fontSize: "var(--step-head)", lineHeight: 1 }}>
          How many roses?
        </h2>
        <label className="mt-7 block w-full max-w-[400px]" data-ui>
          <span className="flex items-baseline justify-between text-[17px]">
            <span>Roses for your date</span>
            <span className="num font-semibold">{roses}</span>
          </span>
          <input
            type="range"
            min={1}
            max={25}
            value={roses}
            onChange={(e) => setRoses(Number(e.target.value))}
            className="stage-range mt-2 w-full"
            style={{ "--p": `${((roses - 1) / 24) * 100}%` } as React.CSSProperties}
            aria-valuetext={`${roses} roses`}
          />
        </label>
      </div>
      <div className="mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between" data-rise style={{ "--d": "120ms" } as React.CSSProperties}>
        <p className="num font-semibold tracking-[-0.05em]" style={{ fontSize: "clamp(96px, 19vw, 320px)", lineHeight: 0.8 }}>
          {toHolder.toLocaleString()}
          <span className="ml-[0.08em] tracking-[-0.02em]" style={{ fontSize: "0.22em" }}>
            $CHOG to their holder
          </span>
        </p>
        <p className="max-w-[30ch] text-[17px] leading-[1.5] lg:pb-3">
          Each rose is {GIFTS.rose.price} $CHOG: 90% lands in the wallet of whoever holds the Chog you&apos;re dating, 10% goes to the builder, and it adds {GIFTS.rose.chemistry} chemistry. {roses} roses add {chemistry} chemistry, and a date tops out at 100.
        </p>
      </div>
    </div>
  );
}
