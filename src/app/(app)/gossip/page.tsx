"use client";
import { useQuery } from "@tanstack/react-query";
import { TitleRow } from "@/components/shell";
import { Empty, Failed, Skeleton } from "@/components/ui";
import { api } from "@/lib/client";
import type { FeedEvent } from "@/lib/types";

// The Daily Chog. The question: what happened on dates across the collection?
export default function GossipPage() {
  const q = useQuery({ queryKey: ["gossip"], queryFn: () => api<FeedEvent[]>("/api/gossip"), refetchInterval: 20_000 });
  const gifted = useQuery({ queryKey: ["gifted"], queryFn: () => api<{ gifted: number }>("/api/gifted"), refetchInterval: 60_000 });
  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_384px]">
      <div>
        <TitleRow title="Gossip" sub="The Daily Chog: every finished date in the collection, written up." />
        {q.isLoading ? (
          <div className="space-y-6">{[0, 1, 2].map((i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /></div>)}</div>
        ) : q.isError ? (
          <Failed what="the gossip" onRetry={() => q.refetch()} />
        ) : !q.data?.length ? (
          <Empty>Slow news day. No dates have finished yet, so the first one makes the front page.</Empty>
        ) : (
          <ol>
            {q.data.map((e) => {
              const [headline, ...rest] = e.text.split(": ");
              return (
                <li key={e.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 border-t border-rule py-5 first:border-t-0 first:pt-0">
                  <div className="relative h-12 w-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/chogs/${e.tokenId}.webp`} alt="" className="absolute left-0 top-0 h-11 w-11 rounded-full bg-raised object-cover" />
                    {e.otherTokenId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/chogs/${e.otherTokenId}.webp`} alt="" className="absolute left-5 top-1 h-11 w-11 rounded-full bg-raised object-cover ring-2 ring-ground" />
                    )}
                  </div>
                  <article>
                    <h2 className="text-[18px] font-semibold leading-[24px]">{headline}</h2>
                    {rest.length > 0 && <p className="mt-1 text-[14px] leading-[21px] text-muted">{rest.join(": ")}</p>}
                    <p className="num mt-2 text-[12px] text-faint">{new Date(e.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <aside className="lg:pt-[86px]">
        <section className="rounded-card bg-surface p-5" aria-labelledby="gifted">
          <h2 id="gifted" className="text-[14px] text-muted">$CHOG gifted between Chogs</h2>
          <p className="num mt-1 text-[32px] font-semibold leading-none text-accent">{gifted.data ? gifted.data.gifted.toLocaleString() : "-"}</p>
          <p className="mt-3 text-[13px] text-faint">Every rose, dinner and super-like pays the other Chog&apos;s holder 90%, and the builder 10%.</p>
        </section>
      </aside>
    </div>
  );
}
