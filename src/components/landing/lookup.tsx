"use client";
import { useEffect, useRef, useState } from "react";
import type { LookupResult } from "@/lib/lookup";

const EXAMPLES = ["Rainbow Puke", "#1462", "BTC Glass"];

// The page's live thing: the headline is an input. Type a Chog's number or a trait and its
// real dating profile answers underneath.
export function Lookup({ initial }: { initial: { q: string; total: number; results: LookupResult[] } }) {
  const [q, setQ] = useState(initial.q);
  const [data, setData] = useState(initial);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (q === data.q) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/lookup?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    }, 180);
    return () => (clearTimeout(t), ctrl.abort());
  }, [q, data.q]);

  const isNumber = /^#?\s*\d+$/.test(q.trim());
  const summary = !q.trim()
    ? "Type a Chog's number, or anything it might be wearing."
    : data.total === 0
      ? `No Chog ${isNumber ? `called #${q.replace(/\D/g, "")}` : `wears “${q}”`}. There are 1,969 to try.`
      : isNumber
        ? "Here's its profile, written from its traits."
        : `${data.total.toLocaleString()} Chog${data.total === 1 ? "" : "s"} match${data.total === 1 ? "es" : ""} “${q}”. Here ${data.total === 1 ? "is" : "are"} ${Math.min(3, data.total)}.`;

  return (
    <div>
      <label className="block" data-ui>
        <span className="sr-only">Type a Chog number or a trait</span>
        <span className="flex items-baseline">
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, 40))}
            spellCheck={false}
            autoComplete="off"
            className="w-full min-w-0 bg-transparent font-semibold tracking-[-0.04em] text-ink caret-ink outline-none"
            style={{ fontSize: "clamp(44px, 8.6vw, 124px)", lineHeight: 1.05 }}
          />
        </span>
      </label>
      <p className="mt-4 text-[17px] text-ink" aria-live="polite">
        {summary}
      </p>

      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        {data.results.map((r) => (
          <article key={r.tokenId} className="flex gap-4 rounded-panel bg-ink p-4 text-paper lg:flex-col" style={{ animation: "pop-in 240ms var(--ease) both" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.image} alt={r.name} width={512} height={512} loading="lazy" className="h-28 w-28 shrink-0 rounded-media object-cover lg:h-auto lg:w-full" />
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold leading-tight">{r.name}</h3>
              <p className="mt-0.5 text-[17px] text-[#ff9a52]">{r.archetype}</p>
              <p className="mt-2 text-[17px] leading-[1.45] text-[#e2e2e2]">{r.bio}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => (setQ(e), input.current?.focus())}
            className="h-11 rounded-full bg-ink/10 px-4 text-[17px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
