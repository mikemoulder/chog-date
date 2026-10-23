"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { Bubble } from "@/components/bubble";
import { candlesFrom, ChemistryChart, Ticker } from "@/components/chart";
import { AiBadge, ChogFace, STAGE_LABEL, STAGE_ORDER, StageChip } from "@/components/chog";
import { cx } from "@/components/primitives";
import { ErrorState, Skeleton, toast } from "@/components/states";
import { api, ApiError, useMe } from "@/lib/client";
import type { CoupleDetail, Me, Mode } from "@/lib/types";

const DATE_LENGTH = 10;

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
  const stop = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  const c = q.data;
  const msgs = c?.session.messages ?? [];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, running, pending]);

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
        afterTurn(res);
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
    try {
      const res = await api<{ done: boolean; stageChanged?: boolean; stage?: string }>(`/api/couples/${id}/say`, { text });
      await q.refetch();
      afterTurn(res);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }

  if (q.isLoading) return <DateSkeleton />;
  if (q.isError || !c) return <div className="mx-auto max-w-[560px] p-6"><ErrorState onRetry={() => q.refetch()} /></div>;

  const deltas = msgs.map((m) => m.chemistryDelta);
  const start = c.chemistry - deltas.reduce((a, d) => a + d * 0.9, 0);
  const candles = candlesFrom(start, deltas);
  const lastDelta = msgs.at(-1)?.chemistryDelta;
  const inProgress = msgs.length > 0 && !c.session.done;
  const partnerHuman = c.partner.claimed && c.partner.mode !== "autopilot";
  const profileOf = (tokenId: number) => (tokenId === c.me.tokenId ? c.me : c.partner);

  return (
    <div className="mx-auto grid max-w-page gap-6 px-[var(--gutter)] py-5 lg:grid-cols-[1fr_340px]">
      <section className="sticker sticker-pop flex h-[calc(100dvh-180px)] min-h-[520px] flex-col overflow-hidden md:h-[calc(100dvh-112px)]">
        {/* The date header: who, how serious, and the chart */}
        <header className="border-b-2 border-line-strong">
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0">
                <ChogFace chog={c.me} size={44} />
                <ChogFace chog={c.partner} size={44} className="-ml-3" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-extrabold leading-tight tracking-tight">
                  <span className="hidden sm:inline">{c.me.name} </span>
                  <span className="text-accent">♥</span> {c.partner.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StageChip stage={c.stage} />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-fg-mute">
                    Date #{c.session.index}
                    {inProgress && ` · line ${msgs.length}/${DATE_LENGTH}`}
                  </span>
                </div>
              </div>
            </div>
            <Ticker value={c.chemistry} delta={lastDelta} className="shrink-0" />
          </div>
          <div className="border-t-2 border-line bg-surface px-3 py-2">
            {candles.length ? (
              <ChemistryChart candles={candles} height={64} />
            ) : (
              <p className="flex h-16 items-center justify-center font-mono text-[11px] uppercase tracking-wider text-fg-faint">Every line prints a candle</p>
            )}
          </div>
        </header>

        {/* The chat */}
        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto bg-ground p-4" aria-live="polite">
          {msgs.length === 0 && !c.session.done && (
            <div className="mx-auto max-w-[360px] py-8 text-center">
              <p className="t-title">Date #{c.session.index} hasn&apos;t started</p>
              <p className="mt-2 text-[15px] text-fg-mute">
                {partnerHuman ? `${c.partner.name}'s human is at the wheel. Say something good.` : `${c.partner.name} is AI-run. It'll answer in character, using its traits.`}
              </p>
            </div>
          )}
          {msgs.map((m) => (
            <Bubble key={m.id} from={profileOf(m.senderTokenId)} mine={m.senderTokenId === c.me.tokenId} body={m.body} delta={m.chemistryDelta} author={m.author} />
          ))}
          {(running || pending) && <Typing />}
          {c.session.done && <Recap c={c} />}
        </div>

        {/* The controls */}
        <footer className="border-t-2 border-line-strong bg-panel p-3">
          {c.stage === "broken_up" ? (
            <Link href="/swipe" className="btn btn-action w-full">Back to swiping</Link>
          ) : !c.canDateNow ? (
            <p className="py-2 text-center text-[14px] text-fg-mute">
              Next date unlocks {c.nextDateAt ? <b>{relative(c.nextDateAt)}</b> : "soon"}. Absence makes the heart grow fonder. Too much absence and it fades.
            </p>
          ) : (
            <Composer mode={mode} onMode={changeMode} running={running} pending={pending} partnerHuman={partnerHuman} coupleId={id} onSay={say} onAuto={letThemTalk} onStop={() => (stop.current = true)} />
          )}
        </footer>
      </section>

      <aside className="space-y-4">
        <Couple c={c} />
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
      <div className="grid grid-cols-3 gap-1 rounded-button border-2 border-line-strong p-1" role="radiogroup" aria-label="Who's talking">
        {(["manual", "copilot", "autopilot"] as Mode[]).map((m) => (
          <button key={m} role="radio" aria-checked={mode === m} onClick={() => props.onMode(m)} disabled={running} className={cx("h-9 rounded-[8px] font-mono text-[11px] font-semibold uppercase tracking-wider", mode === m ? "bg-fg text-ground" : "hover:bg-fill")}>
            {m === "manual" ? "You type" : m === "copilot" ? "Co-pilot" : "Autopilot"}
          </button>
        ))}
      </div>

      {mode === "autopilot" ? (
        running ? (
          <button className="btn btn-quiet w-full" onClick={props.onStop}>Stop after this line</button>
        ) : (
          <button className="btn btn-accent w-full" onClick={props.onAuto}>
            {props.partnerHuman ? "Let your Chog say the next line" : "Let them talk"}
          </button>
        )
      ) : (
        <>
          {mode === "copilot" && (
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <button key={o} onClick={() => setText(o)} className="sticker !shadow-none px-3 py-2 text-left text-[14px] hover:bg-accent-soft">
                  {o}
                </button>
              ))}
              <button className="btn btn-quiet btn-sm" onClick={suggest} aria-busy={suggesting} disabled={pending}>
                {options.length ? "More lines" : "Suggest lines"}
              </button>
            </div>
          )}
          <form onSubmit={send} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              placeholder="Say something, in character"
              aria-label="Your Chog's next line"
              className="field-input h-12 flex-1 !border-2 !border-line-strong"
              disabled={pending}
            />
            <button className="btn btn-action" aria-busy={pending} disabled={!text.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-chip bg-fg-faint" style={{ animation: `bubble-in 600ms ${i * 150}ms infinite alternate` }} />
        ))}
      </span>
      thinking in character
    </div>
  );
}

function Recap({ c }: { c: CoupleDetail }) {
  const [headline, ...rest] = (c.session.summary ?? "Date over.").split(": ");
  return (
    <div className="sticker mx-auto max-w-[460px] overflow-hidden text-center" style={{ animation: "pop-in 240ms var(--motion-out) both" }}>
      <div className="border-b-2 border-line-strong bg-accent px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider">The Daily Chog · date #{c.session.index}</div>
      <div className="p-4">
        <p className="text-[20px] font-extrabold leading-tight tracking-tight">{headline}</p>
        {rest.length > 0 && <p className="mt-2 text-[15px] text-fg-soft">{rest.join(": ")}</p>}
      </div>
    </div>
  );
}

function Couple({ c }: { c: CoupleDetail }) {
  const at = STAGE_ORDER.indexOf(c.stage);
  return (
    <div className="sticker p-4">
      <p className="t-label">Relationship</p>
      <ol className="mt-3 grid grid-cols-5 gap-1">
        {STAGE_ORDER.map((s, i) => (
          <li key={s} className="text-center">
            <div className={cx("h-2.5 rounded-chip border-2 border-line-strong", i <= at ? "bg-accent" : "bg-surface")} />
            <span className={cx("mt-1 block font-mono text-[9px] uppercase tracking-wider", i === at ? "text-fg" : "text-fg-faint")}>{STAGE_LABEL[s]}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-3 border-t-2 border-line pt-4">
        <ChogFace chog={c.partner} size={64} />
        <div className="min-w-0">
          <p className="text-[16px] font-extrabold leading-tight">{c.partner.name}</p>
          <p className="text-[13px] font-bold">{c.partner.persona.archetype}</p>
          <AiBadge profile={c.partner} className="mt-1.5" />
        </div>
      </div>
      <p className="mt-3 text-[14px] text-fg-soft">{c.partner.bio}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
        <div><dt className="t-label">Love language</dt><dd>{c.partner.persona.loveLanguage}</dd></div>
        <div><dt className="t-label">Red flag</dt><dd>{c.partner.persona.redFlag}</dd></div>
      </dl>
      <p className="mt-4 border-t-2 border-line pt-3 text-[13px] text-fg-mute">Dates so far: {c.dates}. Married takes 5 dates and chemistry over 82.</p>
    </div>
  );
}

function Unmask({ c, onDone }: { c: CoupleDetail; onDone: () => void }) {
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const unlocked = c.stage === "official" || c.stage === "married";
  const partnerHuman = c.partner.claimed;
  if (!unlocked || !partnerHuman) {
    return (
      <div className="sticker !shadow-none border-dashed p-4">
        <p className="t-label">Unmask</p>
        <p className="mt-2 text-[14px] text-fg-mute">
          {!partnerHuman ? `${c.partner.name} has no human yet. When its holder claims it, you can meet them once you're Official.` : "Get to Official and you can both choose to reveal the humans behind the Chogs."}
        </p>
      </div>
    );
  }
  if (c.unmask.partnerHandle) {
    return (
      <div className="sticker bg-accent-soft p-4">
        <p className="t-label !text-fg">Unmasked</p>
        <p className="mt-2 text-[15px]">The human behind {c.partner.name} is <b>@{c.unmask.partnerHandle}</b>. Say hi.</p>
      </div>
    );
  }
  return (
    <div className="sticker p-4">
      <p className="t-label">Unmask</p>
      <p className="mt-2 text-[14px] text-fg-soft">
        {c.unmask.me ? "You've revealed your handle. Waiting for their human to do the same." : "You're Official. Reveal your X or Discord handle; they only see it if they reveal theirs too."}
      </p>
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
          <input className="field-input h-11 flex-1 !border-2 !border-line-strong" placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="Your handle" />
          <button className="btn btn-action !h-11" aria-busy={busy} disabled={!handle.trim()}>Reveal</button>
        </form>
      )}
    </div>
  );
}

function DateSkeleton() {
  return (
    <div className="mx-auto max-w-page px-[var(--gutter)] py-5" aria-busy>
      <div className="sticker space-y-3 p-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="ml-auto h-12 w-2/3" />
      </div>
    </div>
  );
}

function relative(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600_000), m = Math.ceil((ms % 3600_000) / 60_000);
  return h ? `in ${h}h ${m}m` : `in ${m}m`;
}
