"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ChogFace, Driver, StageChip } from "@/components/chog";
import { TitleRow } from "@/components/shell";
import { cx, Empty, Failed, Skeleton } from "@/components/ui";
import { api, useMe } from "@/lib/client";
import type { CoupleSummary, Me } from "@/lib/types";

const TABS = [
  { id: "all", label: "All", test: () => true },
  { id: "ready", label: "Ready", test: (c: CoupleSummary) => c.canDateNow && c.stage !== "broken_up" },
  { id: "serious", label: "Serious", test: (c: CoupleSummary) => c.stage === "official" || c.stage === "married" },
  { id: "over", label: "Over", test: (c: CoupleSummary) => c.stage === "broken_up" },
] as const;

// Matches. The question: which date should my Chog go on next? Rows that are ready carry the action.
export default function MatchesPage() {
  const me = useMe().data as Me;
  const q = useQuery({ queryKey: ["couples", me.activeTokenId], queryFn: () => api<CoupleSummary[]>("/api/couples") });
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const all = q.data ?? [];
  const rows = all.filter(TABS.find((t) => t.id === tab)!.test);
  const ready = all.filter(TABS[1].test).length;

  return (
    <div className="pb-10">
      <TitleRow
        title="Matches"
        sub={q.data ? (all.length ? <span className="num">{all.length} couple{all.length === 1 ? "" : "s"} · {ready} ready for a date</span> : "Every couple your Chog is in. They belong to the token, so they stay with it if it's sold.") : " "}
      >
        <Link href="/swipe" className="btn btn-outline">Find more</Link>
      </TitleRow>

      <div className="-mx-4 flex gap-6 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:px-0" role="tablist">
        {TABS.map((t) => {
          const n = all.filter(t.test).length;
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cx("-mb-px shrink-0 border-b-2 pb-3 text-[14px] font-semibold", tab === t.id ? "border-text text-text" : "border-transparent text-faint hover:text-muted")}>
              {t.label} <span className="num font-normal text-faint">{n}</span>
            </button>
          );
        })}
      </div>

      {q.isLoading ? (
        <div className="mt-2">{[0, 1, 2, 3].map((i) => <div key={i} className="flex items-center gap-4 py-4"><Skeleton className="h-12 w-12 !rounded-full" /><Skeleton className="h-4 w-48" /></div>)}</div>
      ) : q.isError ? (
        <div className="mt-6"><Failed what="your matches" onRetry={() => q.refetch()} /></div>
      ) : !all.length ? (
        <div className="mt-6"><Empty action={<Link className="btn btn-primary" href="/swipe">Start swiping</Link>}>No matches yet. AI-run Chogs answer straight away, so your first one is usually a swipe or two off.</Empty></div>
      ) : !rows.length ? (
        <div className="mt-6"><Empty>Nothing here right now.</Empty></div>
      ) : (
        <ul>
          <li className="hidden grid-cols-[minmax(0,1fr)_120px_96px_150px] gap-4 py-3 text-[12px] text-faint md:grid">
            <span>Chog</span>
            <span>Stage</span>
            <span className="text-right">Chemistry</span>
            <span className="text-right">Next date</span>
          </li>
          {rows.map((c) => (
            <li key={c.id} className="border-t border-rule first:border-t-0 md:first:border-t">
              <Link href={`/date/${c.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-panel py-3 transition-colors hover:bg-surface md:-mx-3 md:grid-cols-[minmax(0,1fr)_120px_96px_150px] md:px-3">
                <span className="flex min-w-0 items-center gap-3">
                  <ChogFace chog={c.partner} size={48} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold">{c.partner.name}</span>
                      <Driver profile={c.partner} />
                    </span>
                    <span className="block truncate text-[13px] text-faint">
                      {c.lastMessage ? `${c.lastMessage.senderTokenId === c.me.tokenId ? "You: " : ""}${c.lastMessage.body.replace(/\s*\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*/gu, "")}` : c.partner.persona.archetype}
                    </span>
                    <span className="mt-1 flex items-center gap-2 md:hidden">
                      <StageChip stage={c.stage} />
                      <span className="num text-[13px] text-muted">{c.chemistry} chemistry</span>
                    </span>
                  </span>
                </span>
                <span className="hidden md:block"><StageChip stage={c.stage} /></span>
                <span className="num hidden text-right text-[16px] font-semibold md:block">
                  {c.chemistry}
                  <span className="text-[13px] font-normal text-faint"> /100</span>
                </span>
                <span className="text-right text-[14px]">
                  {c.stage === "broken_up" ? (
                    <span className="text-faint">Over</span>
                  ) : c.canDateNow ? (
                    <span className="font-semibold text-text">Go on a date</span>
                  ) : (
                    <span className="text-faint">{c.nextDateAt ? relative(c.nextDateAt) : "Soon"}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function relative(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Now";
  const h = Math.floor(ms / 3600_000), m = Math.ceil((ms % 3600_000) / 60_000);
  return h ? `In ${h} h ${m} m` : `In ${m} m`;
}
