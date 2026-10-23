"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { AiBadge, ChogFace } from "@/components/chog";
import { EmptyState, Skeleton } from "@/components/states";
import { api, useMe } from "@/lib/client";
import type { FeedEvent, Me } from "@/lib/types";

export default function MePage() {
  const me = useMe().data as Me;
  const chog = me.chogs.find((c) => c.tokenId === me.activeTokenId)!;
  const feed = useQuery({ queryKey: ["feed", me.activeTokenId], queryFn: () => api<FeedEvent[]>("/api/feed") });
  const qc = useQueryClient();
  const router = useRouter();
  const { disconnect } = useDisconnect();

  return (
    <div className="mx-auto grid max-w-[960px] gap-6 px-[var(--gutter)] py-6 md:grid-cols-[360px_1fr]">
      <section className="sticker sticker-pop h-fit overflow-hidden">
        <ChogFace chog={chog} size={360} className="!h-auto !w-full rounded-none border-0 border-b-2" />
        <div className="p-4">
          <h1 className="text-[28px] font-extrabold leading-none tracking-[-0.03em]">{chog.name}</h1>
          <p className="mt-1 font-bold">{chog.persona.archetype}</p>
          <AiBadge profile={chog} className="mt-2" />
          <p className="mt-3 text-[15px] text-fg-soft">{chog.bio}</p>
          <dl className="mt-4 space-y-3 border-t-2 border-line pt-4 text-[14px]">
            <div><dt className="t-label">Vibe</dt><dd>{chog.persona.vibe}</dd></div>
            <div><dt className="t-label">Quirks</dt><dd><ul className="list-inside list-disc">{chog.persona.quirks.map((q) => <li key={q}>{q}</li>)}</ul></dd></div>
            <div><dt className="t-label">Texts like</dt><dd>{chog.persona.voice}</dd></div>
          </dl>
          <p className="mt-4 border-t-2 border-line pt-3 text-[13px] text-fg-mute">This personality was written from {chog.name}&apos;s traits. Whoever holds the token dates as it.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {me.chogs.length > 1 && <Link href="/pick" className="btn btn-quiet btn-sm">Switch Chog</Link>}
            <button
              className="btn btn-text btn-sm"
              onClick={async () => {
                await api("/api/auth/logout", {});
                disconnect();
                await qc.invalidateQueries();
                router.replace("/");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>
      <section>
        <h2 className="t-display-m mb-4">Activity</h2>
        {feed.isLoading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-tile" />)}</div>
        ) : !feed.data?.length ? (
          <EmptyState title="Quiet so far" body="Likes, matches, dates and drama will show up here." action={<Link className="btn btn-accent" href="/swipe">Go swipe</Link>} />
        ) : (
          <ul className="divide-y-2 divide-line border-y-2 border-line-strong">
            {feed.data.map((e) => (
              <li key={e.id} className="flex items-start gap-3 py-3">
                {e.otherTokenId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/chogs/${e.otherTokenId}.webp`} alt="" className="h-9 w-9 rounded-[8px] border-2 border-line-strong" />
                ) : (
                  <span className="h-9 w-9" />
                )}
                <div className="flex-1 text-[15px]">
                  {e.text}
                  <div className="t-label mt-0.5">{e.kind} · {new Date(e.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
