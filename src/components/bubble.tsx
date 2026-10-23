import { cx } from "./primitives";
import { ChogFace } from "./chog";
import type { Profile } from "@/lib/types";

type Who = Pick<Profile, "tokenId" | "name" | "image">;

// One text in a date. Consecutive texts from the same Chog group together: the avatar
// and the time sit on the last one, like any messaging app.
export function Bubble({ from, mine, body, delta, author, last = true, time, pending }: { from: Who; mine: boolean; body: string; delta?: number; author?: "human" | "ai" | "gift"; last?: boolean; time?: string; pending?: boolean }) {
  if (author === "gift") {
    // A $CHOG gift: an event in the date, not a line of dialogue.
    return (
      <div className="my-3 flex justify-center" style={{ animation: "pop-in 220ms var(--motion-out) both" }}>
        <div className="sticker inline-flex items-center gap-2 !rounded-chip bg-accent px-3 py-1.5 text-[13px] font-bold">
          <ChogFace chog={from} size={22} className="!rounded-chip !border" />
          <span>{mine ? "You" : from.name} {body}</span>
          {delta ? <span className="font-mono text-[11px]">+{Math.round(delta)}</span> : null}
        </div>
      </div>
    );
  }
  return (
    <div className={cx("flex items-end gap-2", mine && "flex-row-reverse", last ? "mb-3" : "mb-1")} style={{ animation: "bubble-in 180ms var(--motion-out) both" }}>
      {last ? <ChogFace chog={from} size={30} /> : <span className="w-[30px] shrink-0" />}
      <div className={cx("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
        <div
          className={cx(
            "border-2 border-line-strong px-3.5 py-2 text-[15px] leading-snug",
            mine ? "bg-accent-soft" : "bg-panel",
            // the tail corner sits on the last text of a group
            mine ? (last ? "rounded-[18px] rounded-br-[6px]" : "rounded-[18px]") : last ? "rounded-[18px] rounded-bl-[6px]" : "rounded-[18px]",
            last && "shadow-card",
            pending && "opacity-60",
          )}
        >
          {body}
        </div>
        {last && (time || delta) ? (
          <div className="mt-1 flex items-center gap-2 px-1 font-mono text-[10px] text-fg-faint">
            {pending ? <span>sending…</span> : time && <span>{time}</span>}
            {delta ? <span className={delta > 0 ? "text-success" : "text-danger"}>{delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)} chem</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TypingBubble({ from, mine }: { from: Who; mine: boolean }) {
  return (
    <div className={cx("mb-3 flex items-end gap-2", mine && "flex-row-reverse")} aria-label={`${from.name} is typing`}>
      <ChogFace chog={from} size={30} />
      <div className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
        <div className={cx("inline-flex h-[38px] items-center gap-1 border-2 border-line-strong px-3.5", mine ? "rounded-[18px] rounded-br-[6px] bg-accent-soft" : "rounded-[18px] rounded-bl-[6px] bg-panel")}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-chip bg-fg-mute" style={{ animation: `typing-dot 1s ${i * 160}ms infinite ease-in-out` }} />
          ))}
        </div>
        <span className="mt-1 px-1 font-mono text-[10px] text-fg-faint">{mine ? "your Chog is typing" : `${from.name} is typing`}</span>
      </div>
    </div>
  );
}
