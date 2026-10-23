"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChogFace, Driver } from "@/components/chog";
import { CrossIcon, HeartIcon, StarIcon } from "@/components/icons";
import { TitleRow } from "@/components/shell";
import { cx, Empty, Failed, Skeleton, toast } from "@/components/ui";
import { useGift } from "@/components/use-gift";
import { api, useMe } from "@/lib/client";
import { GIFTS } from "@/lib/gifts";
import type { DeckCard, Me, Profile } from "@/lib/types";

type SwipeResult = { matched: boolean; coupleId?: string; decidedBy?: "ai" | "human"; swipesLeft: number };

// Swipe. The screen's question: who should my Chog date next? The candidate's portrait and
// compatibility answer it; Like is one click (or the right arrow) away.
export default function SwipePage() {
  const me = useMe().data as Me;
  const active = me.chogs.find((c) => c.tokenId === me.activeTokenId)!;
  const qc = useQueryClient();
  const deck = useQuery({ queryKey: ["deck", me.activeTokenId], queryFn: () => api<DeckCard[]>("/api/deck") });
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const [match, setMatch] = useState<{ partner: DeckCard; coupleId: string; decidedBy?: string } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const busy = useRef(false);
  const { give, busy: paying, walletReady } = useGift();

  const cards = deck.data ?? [];
  const card = cards[index];
  const upNext = cards.slice(index + 1, index + 7);

  const settle = useCallback(
    (res: SwipeResult, c: DeckCard) => {
      setLeft(res.swipesLeft);
      if (res.matched && res.coupleId) {
        setMatch({ partner: c, coupleId: res.coupleId, decidedBy: res.decidedBy });
        qc.invalidateQueries({ queryKey: ["couples"] });
      }
      setIndex((i) => i + 1);
    },
    [qc],
  );

  const decide = useCallback(
    async (liked: boolean) => {
      if (!card || busy.current) return;
      busy.current = true;
      setLeaving(liked ? "right" : "left");
      try {
        const [res] = await Promise.all([api<SwipeResult>("/api/swipe", { target: card.tokenId, liked }), new Promise((r) => setTimeout(r, 200))]);
        settle(res, card);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLeaving(null);
        busy.current = false;
      }
    },
    [card, settle],
  );

  async function superLike() {
    if (!card || busy.current) return;
    busy.current = true;
    try {
      const res = await give<{ swipe: SwipeResult }>("superlike", { target: card.tokenId });
      if (!res) return;
      if (!res.swipe.matched) toast.success(`${card.name}'s human will see your super-like first`);
      settle(res.swipe, card);
    } finally {
      busy.current = false;
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight") decide(true);
      if (e.key === "ArrowLeft") decide(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, match]);

  useEffect(() => {
    if (deck.data && index >= deck.data.length && deck.data.length > 0) {
      setIndex(0);
      deck.refetch();
    }
  }, [index, deck]);

  return (
    <div className="pb-10">
      <TitleRow title="Swipe" sub={<>Dating as {active.name}{left !== null && <span className="num"> · {left} swipes left today</span>}</>} />

      {deck.isLoading ? (
        <CardSkeleton />
      ) : deck.isError ? (
        <Failed what="today's Chogs" onRetry={() => deck.refetch()} />
      ) : !card ? (
        <Empty action={<Link className="btn btn-outline" href="/matches">See matches</Link>}>You&apos;ve seen every Chog in today&apos;s deck. Come back tomorrow.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
          <article
            key={card.tokenId}
            className={cx(
              "grid overflow-hidden rounded-card bg-surface transition-[transform,opacity] duration-200 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
              leaving === "right" && "translate-x-[8%] opacity-0",
              leaving === "left" && "-translate-x-[8%] opacity-0",
            )}
            style={{ animation: leaving ? undefined : "pop-in 200ms var(--ease) both" }}
            aria-label={`${card.name}, ${card.compatibility.score}% match`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.image} alt={card.name} width={512} height={512} className="aspect-square w-full bg-raised object-cover md:h-full" />
            <div className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[20px] font-semibold leading-[26px]">{card.name}</h2>
                  <p className="text-[14px] text-muted">{card.persona.archetype}</p>
                </div>
                <div className="text-right">
                  <div className="num text-[32px] font-semibold leading-none text-accent">
                    {card.compatibility.score}
                    <span className="text-[16px] font-normal">%</span>
                  </div>
                  <div className="mt-1 text-[12px] text-faint">match</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.superLikesYou ? <span className="pill pill-accent">Super-liked you</span> : card.likesYou && <span className="pill pill-accent">Likes you</span>}
                <Driver profile={card} />
                <span className="pill">{card.traits.Tier}</span>
              </div>
              <p className="mt-4 text-[15px] leading-[22px] text-[#e2e2e2]">{card.bio}</p>
              <ul className="mt-4 space-y-1.5 text-[14px]">
                {card.compatibility.reasons.map((r) => (
                  <li key={r} className={r.startsWith("Red flag") ? "text-negative" : "text-muted"}>
                    {r}
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-4 text-[13px]">
                {["Head", "Eyes", "Body", "Accessory"].filter((k) => card.traits[k]).map((k) => (
                  <div key={k}>
                    <dt className="text-faint">{k}</dt>
                    <dd>{card.traits[k]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[13px] text-faint">
                Red flag: <span className="text-muted">{card.persona.redFlag}</span>
              </p>
              <div className="mt-auto grid grid-cols-[1fr_auto_1fr] gap-2 pt-6">
                <button className="btn btn-outline btn-lg" onClick={() => decide(false)} disabled={!!leaving} aria-label={`Pass on ${card.name}`}>
                  <CrossIcon /> Pass
                </button>
                <button
                  className="btn btn-outline btn-lg !px-4"
                  onClick={superLike}
                  disabled={!!leaving || paying !== null}
                  aria-busy={paying === "superlike"}
                  title={walletReady ? `${GIFTS.superlike.blurb} Burns ${GIFTS.superlike.price} $CHOG.` : "Connect the wallet you signed in with to super-like"}
                  aria-label={`Super-like ${card.name} for ${GIFTS.superlike.price} $CHOG`}
                >
                  <StarIcon /> <span className="num">{GIFTS.superlike.price}</span>
                </button>
                <button className="btn btn-primary btn-lg" onClick={() => decide(true)} disabled={!!leaving} aria-label={`Like ${card.name}`}>
                  <HeartIcon /> Like
                </button>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <section className="rounded-card bg-surface p-5" aria-labelledby="next">
              <div className="flex items-baseline justify-between">
                <h2 id="next" className="text-[16px] font-semibold">Up next</h2>
                <span className="text-[13px] text-faint">Humans first</span>
              </div>
              <ul className="mt-3">
                {upNext.map((c) => (
                  <li key={c.tokenId} className="flex items-center gap-3 py-2">
                    <ChogFace chog={c} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{c.name}</p>
                      <p className="truncate text-[13px] text-faint">{c.persona.archetype}</p>
                    </div>
                    <span className="num text-[14px] text-muted">{c.compatibility.score}%</span>
                  </li>
                ))}
                {!upNext.length && <li className="py-2 text-[14px] text-faint">This is the last one in today&apos;s deck.</li>}
              </ul>
            </section>
            <p className="px-1 text-[13px] text-faint">Use the left and right arrow keys to pass and like.</p>
          </aside>
        </div>
      )}

      {match && <MatchMoment me={active} partner={match.partner} coupleId={match.coupleId} decidedBy={match.decidedBy} onClose={() => setMatch(null)} />}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px]" aria-busy>
      <div className="grid overflow-hidden rounded-card bg-surface md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full !rounded-none" />
        <div className="space-y-3 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-20 w-full" />
          <p className="text-[13px] text-faint">Reading traits, writing bios.</p>
        </div>
      </div>
      <Skeleton className="h-64 w-full !rounded-card" />
    </div>
  );
}

function MatchMoment({ me, partner, coupleId, decidedBy, onClose }: { me: Profile; partner: DeckCard; coupleId: string; decidedBy?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgb(0_0_0/0.75)] p-4" role="dialog" aria-modal aria-label="It's a match">
      <div className="w-full max-w-[420px] rounded-card bg-surface p-6 text-center shadow-float" style={{ animation: "pop-in 240ms var(--ease) both" }}>
        <div className="flex items-center justify-center">
          <ChogFace chog={me} size={104} />
          <ChogFace chog={partner} size={104} className="-ml-5 ring-4 ring-surface" />
        </div>
        <h2 className="mt-5 text-[24px] font-semibold">It&apos;s a match</h2>
        <p className="mt-1 text-[14px] text-muted">
          {partner.name} liked {me.name} back.{decidedBy === "ai" ? " Its AI did the swiping; its human hasn't arrived yet." : ""}
        </p>
        <div className="mt-6 grid gap-2">
          <Link className="btn btn-primary btn-lg" href={`/date/${coupleId}`}>
            Start the first date
          </Link>
          <button className="btn btn-text" onClick={onClose}>
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
