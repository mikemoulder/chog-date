"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHead } from "@/components/shell";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { api } from "@/lib/client";
import type { FeedEvent } from "@/lib/types";

export default function GossipPage() {
  const q = useQuery({ queryKey: ["gossip"], queryFn: () => api<FeedEvent[]>("/api/gossip"), refetchInterval: 20_000 });
  return (
    <div className="mx-auto max-w-[760px] px-[var(--gutter)] py-6">
      <PageHead title="The Daily Chog" sub="Every finished date across the collection, written up by our gossip columnist." />
      {q.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-tile" />)}</div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="Slow news day" body="No dates have finished yet. Go on one and you'll make the front page." />
      ) : (
        <ol className="divide-y-2 divide-line-strong border-y-2 border-line-strong">
          {q.data.map((e, i) => {
            const [headline, ...rest] = e.text.split(": ");
            return (
              <li key={e.id} className="grid grid-cols-[auto_1fr] gap-4 py-5">
                <span className="t-num w-10 text-[28px] leading-none text-fg-faint">{String(i + 1).padStart(2, "0")}</span>
                <article>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/chogs/${e.tokenId}.webp`} alt="" className="h-8 w-8 rounded-[8px] border-2 border-line-strong" />
                    {e.otherTokenId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/chogs/${e.otherTokenId}.webp`} alt="" className="-ml-3 h-8 w-8 rounded-[8px] border-2 border-line-strong" />
                    )}
                    <span className="t-label">
                      #{e.tokenId} × #{e.otherTokenId} · {new Date(e.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <h2 className="mt-2 text-[22px] font-extrabold leading-tight tracking-[-0.02em]">{headline}</h2>
                  {rest.length > 0 && <p className="mt-1 text-[15px] text-fg-soft">{rest.join(": ")}</p>}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
