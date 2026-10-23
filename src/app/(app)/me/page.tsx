"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { ChogFace, Driver } from "@/components/chog";
import { cx, Empty, Skeleton, toast } from "@/components/ui";
import { api, useMe } from "@/lib/client";
import type { FeedEvent, Me, Mode } from "@/lib/types";

const KIND: Record<FeedEvent["kind"], string> = { admirer: "Admirer", match: "Match", date: "Date", stage: "Milestone", breakup: "Breakup", claimed: "Takeover" };

// Your Chog. The question: who is my Chog, and what has it been up to?
export default function MePage() {
  const me = useMe().data as Me;
  const chog = me.chogs.find((c) => c.tokenId === me.activeTokenId)!;
  const feed = useQuery({ queryKey: ["feed", me.activeTokenId], queryFn: () => api<FeedEvent[]>("/api/feed") });
  const qc = useQueryClient();
  const router = useRouter();
  const { disconnect } = useDisconnect();

  async function setMode(mode: Mode) {
    try {
      await api("/api/me/mode", { mode });
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 pt-8">
        <div className="flex items-center gap-4">
          <ChogFace chog={chog} size={64} />
          <div>
            <h1 className="text-[24px] font-semibold leading-[30px]">{chog.name}</h1>
            <p className="flex items-center gap-2 text-[14px] text-muted">{chog.persona.archetype} <Driver profile={chog} /></p>
          </div>
        </div>
        <div className="flex gap-2">
          {me.chogs.length > 1 && <Link href="/pick" className="btn btn-outline">Switch Chog</Link>}
          <button
            className="btn btn-text"
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
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[384px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-card bg-surface" aria-labelledby="profile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chog.image} alt={chog.name} width={512} height={512} className="aspect-[16/9] w-full object-cover object-top lg:aspect-square" />
          <div className="p-5">
            <h2 id="profile" className="text-[16px] font-semibold">Profile</h2>
            <p className="mt-2 text-[14px] leading-[21px] text-[#e2e2e2]">{chog.bio}</p>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div><dt className="text-faint">Vibe</dt><dd className="mt-0.5 text-muted">{chog.persona.vibe}</dd></div>
              <div><dt className="text-faint">Texts like</dt><dd className="mt-0.5 text-muted">{chog.persona.voice}</dd></div>
              <div><dt className="text-faint">Quirks</dt><dd className="mt-0.5 text-muted">{chog.persona.quirks.join(". ")}</dd></div>
              <div><dt className="text-faint">Red flag</dt><dd className="mt-0.5 text-muted">{chog.persona.redFlag}</dd></div>
            </dl>
            <p className="mt-4 text-[12px] text-faint">Written from {chog.name}&apos;s traits. Whoever holds the token dates as it.</p>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-card bg-surface p-5" aria-labelledby="driving">
            <h2 id="driving" className="text-[16px] font-semibold">Who texts on dates</h2>
            <p className="mt-1 text-[13px] text-muted">The default for every date. You can switch inside a date too.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Who texts on dates">
              {([
                ["manual", "You type", "Every text is yours."],
                ["copilot", "Co-pilot", "Your Chog suggests three lines; you pick."],
                ["autopilot", "Autopilot", "Your Chog dates on its own, and swipes back for you."],
              ] as [Mode, string, string][]).map(([m, label, hint]) => (
                <button key={m} role="radio" aria-checked={chog.mode === m} onClick={() => setMode(m)} className={cx("rounded-panel p-4 text-left transition-colors", chog.mode === m ? "bg-raised" : "bg-ground hover:bg-active")}>
                  <span className="block text-[14px] font-semibold">{label}</span>
                  <span className="mt-1 block text-[13px] text-faint">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="activity">
            <h2 id="activity" className="mb-3 text-[16px] font-semibold">Activity</h2>
            {feed.isLoading ? (
              <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !feed.data?.length ? (
              <Empty action={<Link className="btn btn-primary" href="/swipe">Go swipe</Link>}>Nothing yet. Likes, matches, dates and drama land here.</Empty>
            ) : (
              <ul>
                {feed.data.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 border-t border-rule py-3 first:border-t-0">
                    {e.otherTokenId ? <ChogFace chog={{ tokenId: e.otherTokenId, name: `Chog`, image: `/chogs/${e.otherTokenId}.webp` }} size={36} /> : <span className="h-9 w-9 shrink-0" />}
                    <div className="min-w-0 flex-1 text-[14px] leading-[20px]">
                      {e.text}
                      <p className="mt-0.5 text-[12px] text-faint">
                        {KIND[e.kind]} · <span className="num">{new Date(e.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
