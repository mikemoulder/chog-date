"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AiBadge, ChogFace, StageChip } from "@/components/chog";
import { PageHead } from "@/components/shell";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { api, useMe } from "@/lib/client";
import type { CoupleSummary, Me } from "@/lib/types";

export default function MatchesPage() {
  const me = useMe().data as Me;
  const q = useQuery({ queryKey: ["couples", me.activeTokenId], queryFn: () => api<CoupleSummary[]>("/api/couples") });

  return (
    <div className="mx-auto max-w-[680px] px-[var(--gutter)] py-6">
      <PageHead title="Matches" sub="Every couple your Chog is in. The relationship belongs to the token, so it stays with the Chog if it's sold." />
      {q.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-tile" />)}</div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="No matches yet" body="Swipe right on a few Chogs. AI-run Chogs answer right away, so your first match is usually one swipe off." action={<Link className="btn btn-accent" href="/swipe">Start swiping</Link>} />
      ) : (
        <ul className="space-y-3">
          {q.data.map((c) => (
            <li key={c.id}>
              <Link href={`/date/${c.id}`} className="sticker flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5">
                <div className="relative">
                  <ChogFace chog={c.partner} size={60} />
                  {c.canDateNow && c.stage !== "broken_up" && <span className="absolute -right-1 -top-1 h-4 w-4 rounded-chip border-2 border-line-strong bg-accent" aria-label="Date ready" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[17px] font-extrabold tracking-tight">{c.partner.name}</span>
                    <StageChip stage={c.stage} />
                  </div>
                  <p className="mt-0.5 truncate text-[14px] text-fg-mute">
                    {c.lastMessage ? `${c.lastMessage.senderTokenId === c.me.tokenId ? "You: " : ""}${c.lastMessage.body}` : c.partner.persona.archetype}
                  </p>
                  <AiBadge profile={c.partner} className="mt-1.5 !h-5 !text-[9px]" />
                </div>
                <div className="text-right">
                  <div className="t-num text-[22px] leading-none">{c.chemistry}</div>
                  <div className="t-label">chem</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
