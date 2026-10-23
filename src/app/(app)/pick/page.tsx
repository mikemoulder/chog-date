"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiBadge, ChogFace } from "@/components/chog";
import { PageHead } from "@/components/shell";
import { toast } from "@/components/states";
import { api, useMe } from "@/lib/client";
import type { FeedEvent, Me, Profile } from "@/lib/types";

type Handoff = { firstClaim: boolean; since?: string; events: FeedEvent[]; couples: number };

export default function PickPage() {
  const { data } = useMe();
  const me = data as Me;
  const qc = useQueryClient();
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [handoff, setHandoff] = useState<{ chog: Profile; h: Handoff } | null>(null);

  async function pick(chog: Profile) {
    setBusy(chog.tokenId);
    try {
      const h = await api<Handoff>("/api/me/active", { tokenId: chog.tokenId });
      await qc.invalidateQueries({ queryKey: ["me"] });
      if (h.events.length) setHandoff({ chog, h });
      else router.push("/swipe");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (handoff) return <WhileYouWereGone {...handoff} onDone={() => router.push(handoff.h.couples ? "/matches" : "/swipe")} />;

  return (
    <div className="mx-auto max-w-[760px] px-[var(--gutter)] py-8">
      <PageHead title="Who's dating tonight?" sub={`This wallet holds ${me.chogs.length} Chog${me.chogs.length === 1 ? "" : "s"}. Pick one to swipe as. You can switch any time.`} />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {me.chogs.map((c) => (
          <li key={c.tokenId}>
            <button onClick={() => pick(c)} disabled={busy !== null} aria-busy={busy === c.tokenId} className="sticker group block w-full overflow-hidden text-left transition-transform hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60">
              <ChogFace chog={c} size={400} className="!h-auto !w-full rounded-none border-0 border-b-2" />
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[17px] font-extrabold tracking-tight">{c.name}</span>
                  {me.activeTokenId === c.tokenId && <span className="chip bg-accent">Active</span>}
                </div>
                <p className="mt-0.5 text-[13px] text-fg-mute">{c.persona.archetype}</p>
                <AiBadge profile={c} className="mt-2" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const KIND_ICON: Record<FeedEvent["kind"], string> = { admirer: "♥", match: "✦", date: "☕", stage: "↑", breakup: "✕", claimed: "◉" };

function WhileYouWereGone({ chog, h, onDone }: { chog: Profile; h: Handoff; onDone: () => void }) {
  const counts = h.events.reduce<Record<string, number>>((acc, e) => ((acc[e.kind] = (acc[e.kind] ?? 0) + 1), acc), {});
  return (
    <div className="mx-auto max-w-[560px] px-[var(--gutter)] py-8">
      <div className="sticker sticker-pop overflow-hidden" style={{ animation: "pop-in 240ms var(--motion-out) both" }}>
        <div className="flex items-center gap-4 border-b-2 border-line-strong bg-accent p-5">
          <ChogFace chog={chog} size={72} />
          <div>
            <p className="t-label !text-fg">{h.firstClaim ? "You just claimed" : "Welcome back"}</p>
            <h1 className="t-display-m">While you were gone</h1>
          </div>
        </div>
        <div className="p-5">
          <p className="text-[16px] text-fg-soft">
            {chog.name} has been on the market without you. The AI kept things going: {counts.date ?? 0} date{counts.date === 1 ? "" : "s"}, {counts.match ?? 0} match{counts.match === 1 ? "" : "es"}, {counts.admirer ?? 0} admirer{counts.admirer === 1 ? "" : "s"}. It&apos;s your love life now.
          </p>
          <ul className="mt-5 divide-y-2 divide-line">
            {h.events.slice(0, 8).map((e) => (
              <li key={e.id} className="flex gap-3 py-3 text-[15px]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-chip border-2 border-line-strong bg-panel text-[13px]">{KIND_ICON[e.kind]}</span>
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-action mt-5 w-full" onClick={onDone}>
            {h.couples ? "See your matches" : "Start swiping"}
          </button>
        </div>
      </div>
    </div>
  );
}
