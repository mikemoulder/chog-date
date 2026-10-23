"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChogFace, Driver } from "@/components/chog";
import { TitleRow } from "@/components/shell";
import { cx, toast } from "@/components/ui";
import { api, useMe } from "@/lib/client";
import type { FeedEvent, Me, Profile } from "@/lib/types";

type Handoff = { firstClaim: boolean; since?: string; events: FeedEvent[]; couples: number };

// Your Chogs. The question: which Chog is dating tonight? Claiming one hands over
// everything it did while it was AI-run.
export default function PickPage() {
  const me = useMe().data as Me;
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
    <div className="pb-10">
      <TitleRow title="Your Chogs" sub={<span className="num">This wallet holds {me.chogs.length} Chog{me.chogs.length === 1 ? "" : "s"}. Pick one to date as; you can switch any time.</span>} />
      <ul className={cx("grid gap-4", me.chogs.length === 1 ? "max-w-[360px]" : me.chogs.length === 2 ? "grid-cols-2 lg:max-w-[760px]" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
        {me.chogs.map((c) => (
          <li key={c.tokenId}>
            <button onClick={() => pick(c)} disabled={busy !== null} aria-busy={busy === c.tokenId} className="group block w-full overflow-hidden rounded-card bg-surface text-left transition-colors hover:bg-active disabled:opacity-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt={c.name} width={512} height={512} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              <span className="block p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[16px] font-semibold">{c.name}</span>
                  {me.activeTokenId === c.tokenId && <span className="pill pill-accent">Dating now</span>}
                </span>
                <span className="mt-0.5 block text-[13px] text-faint">{c.persona.archetype}</span>
                <Driver profile={c} className="mt-2" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const KIND: Record<FeedEvent["kind"], string> = { admirer: "Admirer", match: "Match", date: "Date", stage: "Milestone", breakup: "Breakup", claimed: "Takeover" };

function WhileYouWereGone({ chog, h, onDone }: { chog: Profile; h: Handoff; onDone: () => void }) {
  const count = (k: FeedEvent["kind"]) => h.events.filter((e) => e.kind === k).length;
  const figures: [string, number][] = [["Dates", count("date")], ["Matches", count("match")], ["Admirers", count("admirer")]];
  return (
    <div className="mx-auto max-w-[640px] py-10" style={{ animation: "pop-in 240ms var(--ease) both" }}>
      <div className="flex items-center gap-4">
        <ChogFace chog={chog} size={64} />
        <div>
          <h1 className="text-[24px] font-semibold leading-[30px]">While you were gone</h1>
          <p className="text-[14px] text-muted">{h.firstClaim ? `You just claimed ${chog.name}. Its AI kept dating without you.` : `${chog.name} kept busy since your last visit.`}</p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-3 divide-x divide-border rounded-card bg-surface">
        {figures.map(([label, n]) => (
          <div key={label} className="px-5 py-4">
            <dt className="text-[13px] text-faint">{label}</dt>
            <dd className="num mt-1 text-[24px] font-semibold">{n}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-6">
        {h.events.slice(0, 8).map((e) => (
          <li key={e.id} className="flex items-start gap-3 border-t border-rule py-3 first:border-t-0">
            {e.otherTokenId ? <ChogFace chog={{ tokenId: e.otherTokenId, name: "Chog", image: `/chogs/${e.otherTokenId}.webp` }} size={36} /> : <span className="h-9 w-9" />}
            <div className="text-[14px] leading-[20px]">
              {e.text}
              <p className="text-[12px] text-faint">{KIND[e.kind]}</p>
            </div>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary btn-lg mt-6 w-full" onClick={onDone}>
        {h.couples ? "See your matches" : "Start swiping"}
      </button>
    </div>
  );
}
