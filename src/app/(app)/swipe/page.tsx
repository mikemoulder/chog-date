"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiBadge, ChogFace } from "@/components/chog";
import { cx } from "@/components/primitives";
import { EmptyState, ErrorState, Skeleton, toast } from "@/components/states";
import { useGift } from "@/components/use-gift";
import { GIFTS } from "@/lib/gifts";
import { api, useMe } from "@/lib/client";
import type { DeckCard, Me, Profile } from "@/lib/types";

type SwipeResult = { matched: boolean; coupleId?: string; decidedBy?: "ai" | "human"; swipesLeft: number };

export default function SwipePage() {
  const { data: meData } = useMe();
  const me = meData as Me;
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

  const decide = useCallback(
    async (liked: boolean) => {
      if (!card || busy.current) return;
      busy.current = true;
      setLeaving(liked ? "right" : "left");
      try {
        const [res] = await Promise.all([api<SwipeResult>("/api/swipe", { target: card.tokenId, liked }), new Promise((r) => setTimeout(r, 220))]);
        setLeft(res.swipesLeft);
        if (res.matched && res.coupleId) {
          setMatch({ partner: card, coupleId: res.coupleId, decidedBy: res.decidedBy });
          qc.invalidateQueries({ queryKey: ["couples"] });
        }
        setIndex((i) => i + 1);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLeaving(null);
        busy.current = false;
      }
    },
    [card, qc],
  );

  // Super-like: burn $CHOG first, then the server verifies it and swipes with it.
  async function superLike() {
    if (!card || busy.current) return;
    busy.current = true;
    try {
      const res = await give<{ swipe: SwipeResult }>("superlike", { target: card.tokenId });
      if (!res) return;
      setLeaving("right");
      await new Promise((r) => setTimeout(r, 220));
      setLeft(res.swipe.swipesLeft);
      if (res.swipe.matched && res.swipe.coupleId) {
        setMatch({ partner: card, coupleId: res.swipe.coupleId, decidedBy: res.swipe.decidedBy });
        qc.invalidateQueries({ queryKey: ["couples"] });
      } else toast.success(`⭐ ${card.name}'s human will see your super-like first`);
      setIndex((i) => i + 1);
    } finally {
      setLeaving(null);
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

  // Reached the end of this batch: fetch the next one.
  useEffect(() => {
    if (deck.data && index >= deck.data.length && deck.data.length > 0) {
      setIndex(0);
      deck.refetch();
    }
  }, [index, deck]);

  return (
    <div className="mx-auto max-w-[520px] px-[var(--gutter)] py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="t-title">Swiping for {active.name}</h1>
        {left !== null && <span className="chip">{left} swipes left today</span>}
      </div>

      {deck.isLoading ? (
        <div className="sticker overflow-hidden" aria-busy>
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <p className="px-4 pb-4 text-[13px] text-fg-mute">Reading traits, writing bios…</p>
        </div>
      ) : deck.isError ? (
        <ErrorState onRetry={() => deck.refetch()} />
      ) : !card ? (
        <EmptyState title="That's everyone for now" body="You've seen every Chog in today's deck. Come back tomorrow, or go check on your matches." action={<Link className="btn btn-action" href="/matches">See your matches</Link>} />
      ) : (
        <>
          <Card key={card.tokenId} card={card} leaving={leaving} />
          <div className="sticky bottom-[72px] z-20 mt-4 grid grid-cols-[1fr_auto_1fr] gap-3 md:static md:mt-5">
            <button className="btn btn-quiet h-14 text-[16px]" onClick={() => decide(false)} disabled={!!leaving} aria-label={`Pass on ${card.name}`}>
              ✕ Pass
            </button>
            <button
              className="btn btn-quiet h-14 !px-3 text-[14px]"
              onClick={superLike}
              disabled={!!leaving || paying !== null}
              aria-busy={paying === "superlike"}
              title={walletReady ? `${GIFTS.superlike.blurb} Burns ${GIFTS.superlike.price} $CHOG.` : "Connect the wallet you signed in with to super-like"}
              aria-label={`Super-like ${card.name} for ${GIFTS.superlike.price} $CHOG`}
            >
              ⭐ <span className="font-mono text-[11px]">{GIFTS.superlike.price}</span>
            </button>
            <button className="btn btn-accent h-14 text-[16px]" onClick={() => decide(true)} disabled={!!leaving} aria-label={`Like ${card.name}`}>
              ♥ Like
            </button>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-wider text-fg-faint">← → keys work too</p>
        </>
      )}

      {match && <MatchMoment me={active} partner={match.partner} coupleId={match.coupleId} decidedBy={match.decidedBy} onClose={() => setMatch(null)} />}
    </div>
  );
}

function Card({ card, leaving }: { card: DeckCard; leaving: "left" | "right" | null }) {
  const traits = ["Head", "Eyes", "Body", "Accessory", "Aura"].filter((k) => card.traits[k]);
  return (
    <article
      className={cx("sticker sticker-pop overflow-hidden transition-transform duration-200", leaving === "right" && "translate-x-[120%] rotate-12", leaving === "left" && "-translate-x-[120%] -rotate-12")}
      style={{ animation: leaving ? undefined : "pop-in 200ms var(--motion-out) both" }}
    >
      <div className="relative">
        <ChogFace chog={card} size={520} className="!h-[44dvh] !w-full rounded-none border-0 border-b-2 object-top md:!h-auto md:max-h-none" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {card.superLikesYou ? <span className="chip bg-accent">⭐ Super-liked you</span> : card.likesYou && <span className="chip bg-accent">Likes you</span>}
          <AiBadge profile={card} />
        </div>
        <div className="absolute bottom-3 right-3 grid h-[72px] w-[72px] place-items-center rounded-chip border-2 border-line-strong bg-panel text-center shadow-card">
          <div>
            <div className="t-num text-[24px] leading-none">{card.compatibility.score}%</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-fg-mute">match</div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[26px] font-extrabold leading-none tracking-[-0.03em]">{card.name}</h2>
          <span className="t-label">{card.traits.Tier}</span>
        </div>
        <p className="mt-1 text-[15px] font-bold">{card.persona.archetype}</p>
        <p className="mt-2 text-[15px] text-fg-soft">{card.bio}</p>
        <ul className="mt-3 space-y-1">
          {card.compatibility.reasons.map((r) => (
            <li key={r} className={cx("text-[14px]", r.startsWith("Red flag") ? "text-danger" : "text-fg-soft")}>
              {r.startsWith("Red flag") ? "⚑" : "✦"} {r}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {traits.map((k) => (
            <span key={k} className="chip !h-6 !border bg-surface !text-[10px]">
              {card.traits[k]}
            </span>
          ))}
        </div>
        <p className="mt-3 border-t-2 border-line pt-3 text-[14px]">
          <span className="font-bold">Red flag:</span> <span className="text-fg-soft">{card.persona.redFlag}</span>
        </p>
      </div>
    </article>
  );
}

function MatchMoment({ me, partner, coupleId, decidedBy, onClose }: { me: Profile; partner: DeckCard; coupleId: string; decidedBy?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgb(17_14_20/0.55)] p-4" role="dialog" aria-modal aria-label="It's a match">
      <div className="sticker sticker-pop w-full max-w-[440px] overflow-hidden text-center" style={{ animation: "pop-in 260ms var(--motion-out) both" }}>
        <div className="bg-accent px-6 pb-6 pt-8">
          <div className="flex items-center justify-center">
            <ChogFace chog={me} size={112} className="-rotate-6" />
            <span className="z-10 -mx-3 grid h-12 w-12 place-items-center rounded-chip border-2 border-line-strong bg-panel text-[22px]">♥</span>
            <ChogFace chog={partner} size={112} className="rotate-6" />
          </div>
          <h2 className="t-display-l mt-5">It&apos;s a match</h2>
          <p className="mt-2 text-[15px]">
            {partner.name} liked {me.name} back{decidedBy === "ai" ? ". Their AI did the swiping, their human hasn't shown up yet." : "."}
          </p>
        </div>
        <div className="grid gap-3 p-5">
          <Link className="btn btn-action" href={`/date/${coupleId}`}>
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
