"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { Bubble, TypingBubble } from "@/components/bubble";
import { candlesFrom, ChemistryChart, Ticker } from "@/components/chart";
import { ChogFace, Driver, STAGE_LABEL, STAGE_ORDER, StageChip } from "@/components/chog";
import { GiftPanel } from "@/components/gift-panel";
import { cx, Failed, Skeleton, toast } from "@/components/ui";
import { api, ApiError, useMe } from "@/lib/client";
import type { CoupleDetail, Me, Mode } from "@/lib/types";

const DATE_LENGTH = 14;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// How long a reply "takes to type": long enough to feel like a person, short enough not to drag.
const typingTime = (text: string) => Math.min(2600, 650 + text.length * 28);
const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// The date. The question: how is this date going? Chemistry answers it, as a figure and as
// one candle per text; the conversation is the main panel; the relationship, gifts and
// unmasking sit in the rail.
export default function DatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { data: meData } = useMe();
  const me = meData as Me;
  const active = me.chogs.find((c) => c.tokenId === me.activeTokenId)!;
  const q = useQuery({
    queryKey: ["couple", id, me.activeTokenId],
    queryFn: () => api<CoupleDetail>(`/api/couples/${id}`),
    refetchInterval: (query) => (query.state.data && query.state.data.partner.claimed && query.state.data.partner.mode !== "autopilot" ? 4000 : false),
  });
  const [mode, setModeState] = useState<Mode>(active.mode === "autopilot" ? "autopilot" : active.mode);
  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState(false);
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const stop = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  const c = q.data;
  const msgs = useMemo(() => c?.session.messages ?? [], [c]);

  // Staged reveal: history appears at once; new texts from the other side arrive one at a
  // time, each after a typing pause sized to its length. Your own texts appear instantly.
  const [shown, setShown] = useState<number | null>(null);
  const shownRef = useRef(0);
  const visibleCount = Math.min(shown ?? msgs.length, msgs.length);
  shownRef.current = visibleCount;
  const msgCount = useRef(0);
  msgCount.current = msgs.length;
  useEffect(() => {
    if (!c) return;
    if (shown === null || msgs.length < shown) return setShown(msgs.length); // first load or a new date
    if (shown >= msgs.length) return;
    const next = msgs[shown];
    const instant = next.senderTokenId === c.me.tokenId && next.author !== "ai";
    const t = setTimeout(() => setShown(shown + 1), instant || next.author === "gift" ? 0 : typingTime(next.body));
    return () => clearTimeout(t);
  }, [c, msgs, shown]);
  const revealing = visibleCount < msgs.length ? msgs[visibleCount] : null;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [visibleCount, running, pending, outgoing]);

  // Resolves once every text that has arrived has been "typed" on screen.
  async function caughtUp() {
    while (shownRef.current < msgCount.current) await sleep(120);
  }

  async function changeMode(m: Mode) {
    setModeState(m);
    try {
      await api("/api/me/mode", { mode: m });
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function afterTurn(res: { done: boolean; stageChanged?: boolean; stage?: string }) {
    if (res.done) {
      stop.current = true;
      if (res.stageChanged && res.stage) toast.success(res.stage === "broken_up" ? "It's over." : `You're ${STAGE_LABEL[res.stage]?.toLowerCase()} now`);
      qc.invalidateQueries({ queryKey: ["couples"] });
    }
  }

  async function letThemTalk() {
    setRunning(true);
    stop.current = false;
    try {
      while (!stop.current) {
        const res = await api<{ done: boolean; stageChanged?: boolean; stage?: string }>(`/api/couples/${id}/auto`, {});
        await q.refetch();
        await caughtUp();
        afterTurn(res);
        if (!stop.current) await sleep(700 + Math.random() * 900); // a beat to read it before answering
      }
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 409)) toast.error((e as Error).message);
      else toast("Their human has the next line");
    } finally {
      setRunning(false);
      q.refetch();
    }
  }

  async function say(text: string) {
    setPending(true);
    setOutgoing(text.trim());
    try {
      const res = await api<{ done: boolean; stageChanged?: boolean; stage?: string }>(`/api/couples/${id}/say`, { text });
      // Everything already on screen stays put; our text is real now, their reply gets typed out.
      setShown(msgCount.current);
      await q.refetch();
      setOutgoing(null);
      await caughtUp();
      afterTurn(res);
      return true;
    } catch (e) {
      setOutgoing(null);
      toast.error((e as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }

  if (q.isLoading) return <DateSkeleton />;
  if (q.isError || !c) return <div className="py-8"><Failed what="this date" onRetry={() => q.refetch()} /></div>;

  const visible = msgs.slice(0, visibleCount);
  const deltas = msgs.map((m) => m.chemistryDelta);
  const start = c.chemistry - deltas.reduce((a, d) => a + d * 0.9, 0);
  const candles = candlesFrom(start, visible.map((m) => m.chemistryDelta).filter((d, i, all) => d !== 0 || i === all.length - 1));
  const shownChem = candles.at(-1)?.close ?? start;
  const lastDelta = [...visible].reverse().find((m) => m.chemistryDelta !== 0)?.chemistryDelta;
  const texts = msgs.filter((m) => m.author !== "gift").length;
  const inProgress = msgs.length > 0 && !c.session.done;
  const partnerHuman = c.partner.claimed && c.partner.mode !== "autopilot";
  const profileOf = (tokenId: number) => (tokenId === c.me.tokenId ? c.me : c.partner);

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_384px]">
      <section className="flex h-[calc(100dvh-160px)] min-h-[560px] flex-col overflow-hidden rounded-card bg-surface md:h-[calc(100dvh-96px)]" aria-label={`Date with ${c.partner.name}`}>
        {/* The object header: who, how far along, and the answer */}
        <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <ChogFace chog={c.partner} size={48} />
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold leading-[24px]">{c.partner.name}</h1>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-faint">
                <StageChip stage={c.stage} />
                <span className="num">Date {c.session.index}{inProgress ? ` · ${texts} of ${DATE_LENGTH} texts` : ""}</span>
                {c.venue && <span className="pill pill-accent">Candlelit dinner</span>}
              </p>
            </div>
          </div>
          <Ticker value={shownChem} delta={lastDelta} className="shrink-0" />
        </header>
        <div className="px-5 pb-3">
          {candles.length ? (
            <ChemistryChart candles={candles} height={56} slots={14} />
          ) : (
            <p className="flex h-14 items-center text-[13px] text-faint">Every text prints a candle: filled when it lands, hollow when it flops.</p>
          )}
        </div>

        {/* The conversation */}
        <div ref={scroller} className="flex-1 overflow-y-auto border-t border-border bg-ground px-4 py-5 sm:px-5" aria-live="polite">
          {msgs.length === 0 && !c.session.done && (
            <div className="mx-auto max-w-[380px] py-10 text-center">
              <p className="text-[16px] font-semibold">Date {c.session.index} hasn&apos;t started</p>
              <p className="mt-1 text-[14px] text-muted">
                {partnerHuman ? `${c.partner.name}'s human is at the wheel. Say something good.` : `${c.partner.name} is AI-run. It texts back in its own voice, shaped by its traits.`}
              </p>
            </div>
          )}
          {visible.map((m, i) => {
            const next = visible[i + 1];
            const last = !next || next.senderTokenId !== m.senderTokenId || next.author === "gift" || (outgoing !== null && i === visible.length - 1);
            return <Bubble key={m.id} from={profileOf(m.senderTokenId)} mine={m.senderTokenId === c.me.tokenId} body={m.body} delta={m.chemistryDelta} author={m.author} last={last} time={clock(m.createdAt)} />;
          })}
          {outgoing && <Bubble from={c.me} mine body={outgoing} pending />}
          {revealing ? (
            revealing.author !== "gift" && !(revealing.senderTokenId === c.me.tokenId && revealing.author !== "ai") && <TypingBubble from={profileOf(revealing.senderTokenId)} mine={revealing.senderTokenId === c.me.tokenId} />
          ) : pending ? (
            !partnerHuman && <TypingBubble from={c.partner} mine={false} />
          ) : running ? (
            <TypingBubble from={visible.at(-1)?.senderTokenId === c.me.tokenId ? c.partner : c.me} mine={visible.at(-1)?.senderTokenId !== c.me.tokenId} />
          ) : null}
          {c.session.done && !revealing && <Recap c={c} />}
        </div>

        {/* The controls */}
        <footer className="border-t border-border bg-surface p-3 sm:p-4">
          {c.stage === "broken_up" ? (
            <Link href="/swipe" className="btn btn-primary w-full">Back to swiping</Link>
          ) : !c.canDateNow ? (
            <p className="py-1 text-center text-[14px] text-muted">
              Next date {c.nextDateAt ? <span className="num text-text">{relative(c.nextDateAt)}</span> : "soon"}. Leave it too long and the chemistry fades.
            </p>
          ) : (
            <Composer mode={mode} onMode={changeMode} running={running} pending={pending} partnerHuman={partnerHuman} coupleId={id} onSay={say} onAuto={letThemTalk} onStop={() => (stop.current = true)} />
          )}
        </footer>
      </section>

      <aside className="space-y-4">
        <Relationship c={c} />
        <GiftPanel coupleId={c.id} partnerName={c.partner.name} disabled={c.stage === "broken_up"} onGiven={() => q.refetch()} />
        <Unmask c={c} onDone={() => q.refetch()} />
      </aside>
    </div>
  );
}

function Composer(props: { mode: Mode; onMode: (m: Mode) => void; running: boolean; pending: boolean; partnerHuman: boolean; coupleId: string; onSay: (t: string) => Promise<boolean>; onAuto: () => void; onStop: () => void }) {
  const { mode, running, pending } = props;
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  async function suggest() {
    setSuggesting(true);
    try {
      setOptions((await api<{ options: string[] }>(`/api/couples/${props.coupleId}/suggest`, {})).options);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSuggesting(false);
    }
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim()) return;
    if (await props.onSay(text)) {
      setText("");
      setOptions([]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex shrink-0 rounded-full bg-ground p-1" role="radiogroup" aria-label="Who's texting">
          {(["manual", "copilot", "autopilot"] as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => props.onMode(m)} disabled={running} className={cx("h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-colors", mode === m ? "bg-raised text-text" : "text-faint hover:text-muted")}>
              {m === "manual" ? "You type" : m === "copilot" ? "Co-pilot" : "Autopilot"}
            </button>
          ))}
        </div>
        {mode === "copilot" && (
          <button className="btn btn-text" onClick={suggest} aria-busy={suggesting} disabled={pending}>
            {options.length ? "Other lines" : "Suggest lines"}
          </button>
        )}
      </div>

      {mode === "autopilot" ? (
        running ? (
          <button className="btn btn-outline btn-lg w-full" onClick={props.onStop}>Stop after this text</button>
        ) : (
          <button className="btn btn-primary btn-lg w-full" onClick={props.onAuto}>
            {props.partnerHuman ? "Let your Chog send the next text" : "Let them talk"}
          </button>
        )
      ) : (
        <>
          {mode === "copilot" && options.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {options.map((o) => (
                <button key={o} onClick={() => setText(o)} className="rounded-[14px] bg-ground px-3.5 py-2 text-left text-[14px] text-muted transition-colors hover:bg-raised hover:text-text">
                  {o}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={send} className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={280} placeholder="Text them as your Chog" aria-label="Your Chog's next text" className="field !h-11" disabled={pending} />
            <button className="btn btn-primary !h-11" aria-busy={pending} disabled={!text.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function Recap({ c }: { c: CoupleDetail }) {
  const [headline, ...rest] = (c.session.summary ?? "Date over.").split(": ");
  return (
    <div className="mx-auto mt-4 max-w-[460px] rounded-panel bg-surface p-5" style={{ animation: "pop-in 240ms var(--ease) both" }}>
      <p className="text-[12px] text-faint">The Daily Chog · date {c.session.index}</p>
      <p className="mt-1 text-[18px] font-semibold leading-[24px]">{headline}</p>
      {rest.length > 0 && <p className="mt-2 text-[14px] text-muted">{rest.join(": ")}</p>}
    </div>
  );
}

function Relationship({ c }: { c: CoupleDetail }) {
  const at = STAGE_ORDER.indexOf(c.stage);
  return (
    <section className="rounded-card bg-surface p-5" aria-labelledby="rel">
      <div className="flex items-baseline justify-between">
        <h2 id="rel" className="text-[16px] font-semibold">Relationship</h2>
        <span className="num text-[13px] text-faint">{c.dates} date{c.dates === 1 ? "" : "s"} so far</span>
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-1.5">
        {STAGE_ORDER.map((s, i) => (
          <li key={s}>
            <div className={cx("h-1.5 rounded-full", i <= at ? "bg-accent" : "bg-raised")} />
            <span className={cx("mt-2 block text-[12px]", i === at ? "text-text" : "text-faint")}>{STAGE_LABEL[s]}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[13px] text-muted">{nextStep(c)}</p>
      <div className="mt-5 flex gap-3 border-t border-rule pt-4">
        <ChogFace chog={c.partner} size={44} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14px] font-semibold">{c.partner.name} <Driver profile={c.partner} /></p>
          <p className="text-[13px] text-faint">{c.partner.persona.archetype}</p>
          <p className="mt-2 text-[13px] leading-[19px] text-muted">{c.partner.bio}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <div><dt className="text-faint">Love language</dt><dd className="mt-0.5">{c.partner.persona.loveLanguage}</dd></div>
        <div><dt className="text-faint">Red flag</dt><dd className="mt-0.5">{c.partner.persona.redFlag}</dd></div>
      </dl>
    </section>
  );
}

// The rule for the next stage, from the same thresholds the server uses.
function nextStep(c: CoupleDetail) {
  const rules: Record<string, [string, number, number]> = { first_date: ["Dating", 2, 50], matched: ["Dating", 2, 50], dating: ["Official", 3, 65], official: ["Married", 5, 82] };
  if (c.stage === "married") return "Married. It doesn't get more official than this.";
  if (c.stage === "broken_up") return "It's over. Chemistry dropped too low.";
  const [next, dates, chem] = rules[c.stage];
  const needDates = Math.max(0, dates - c.dates), needChem = Math.max(0, chem - c.chemistry);
  if (!needDates && !needChem) return `${next} after this date ends.`;
  return `${next} needs ${[needDates && `${needDates} more date${needDates === 1 ? "" : "s"}`, needChem && `chemistry ${chem}`].filter(Boolean).join(" and ")}.`;
}

function Unmask({ c, onDone }: { c: CoupleDetail; onDone: () => void }) {
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const unlocked = c.stage === "official" || c.stage === "married";
  if (!unlocked || !c.partner.claimed) {
    return (
      <section className="rounded-card border border-dashed border-control p-5" aria-labelledby="unmask">
        <h2 id="unmask" className="text-[16px] font-semibold">Unmask</h2>
        <p className="mt-1 text-[13px] text-muted">
          {!c.partner.claimed ? `${c.partner.name} has no human yet. When its holder claims it and you're Official, you can both reveal yourselves.` : "Once you're Official, you can both choose to reveal the humans behind the Chogs."}
        </p>
      </section>
    );
  }
  if (c.unmask.partnerHandle) {
    return (
      <section className="rounded-card bg-surface p-5" aria-labelledby="unmask">
        <h2 id="unmask" className="text-[16px] font-semibold">Unmasked</h2>
        <p className="mt-2 text-[13px] text-faint">The human behind {c.partner.name}</p>
        <p className="text-[24px] font-semibold">@{c.unmask.partnerHandle}</p>
      </section>
    );
  }
  return (
    <section className="rounded-card bg-surface p-5" aria-labelledby="unmask">
      <h2 id="unmask" className="text-[16px] font-semibold">Unmask</h2>
      <p className="mt-1 text-[13px] text-muted">{c.unmask.me ? "Your handle is in. They see it only if they reveal theirs too." : "Share your X or Discord handle. They only see it if they share theirs."}</p>
      {!c.unmask.me && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api(`/api/couples/${c.id}/unmask`, { handle });
              onDone();
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <input className="field" placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="Your handle" />
          <button className="btn btn-primary" aria-busy={busy} disabled={!handle.trim()}>Reveal</button>
        </form>
      )}
    </section>
  );
}

function DateSkeleton() {
  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_384px]" aria-busy>
      <div className="space-y-4 rounded-card bg-surface p-5">
        <div className="flex items-center gap-3"><Skeleton className="h-12 w-12 !rounded-full" /><h1 className="text-[18px] font-semibold text-faint">Loading the date</h1></div>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-10 w-2/3 !rounded-[18px]" />
        <Skeleton className="ml-auto h-10 w-1/2 !rounded-[18px]" />
      </div>
      <Skeleton className="h-72 w-full !rounded-card" />
    </div>
  );
}

function relative(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600_000), m = Math.ceil((ms % 3600_000) / 60_000);
  return h ? `in ${h} h ${m} m` : `in ${m} m`;
}
