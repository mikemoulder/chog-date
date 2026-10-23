import { ChogFace } from "./chog";
import { cx } from "./ui";
import type { Profile } from "@/lib/types";

type Who = Pick<Profile, "tokenId" | "name" | "image">;

// One text in a date. Texts from the same Chog group together; the face and the time sit
// on the last one. Yours are white, theirs are a lighter step of the dark.
export function Bubble({ from, mine, body, delta, author, last = true, time, pending }: { from: Who; mine: boolean; body: string; delta?: number; author?: "human" | "ai" | "gift"; last?: boolean; time?: string; pending?: boolean }) {
  if (author === "gift") {
    return (
      <div className="my-4 flex justify-center" style={{ animation: "pop-in 220ms var(--ease) both" }}>
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-[13px] text-accent">
          <ChogFace chog={from} size={20} />
          <span>
            {mine ? "You" : from.name} {body.replace(/^\p{Extended_Pictographic}\uFE0F?\s/u, "")}
          </span>
          {delta ? <span className="num font-semibold">+{Math.round(delta)}</span> : null}
        </p>
      </div>
    );
  }
  return (
    <div className={cx("flex items-end gap-2", mine && "flex-row-reverse", last ? "mb-3" : "mb-1")} style={{ animation: "bubble-in 180ms var(--ease) both" }}>
      {!mine && (last ? <ChogFace chog={from} size={28} /> : <span className="w-7 shrink-0" />)}
      <div className={cx("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
        <div
          className={cx(
            "px-3.5 py-2 text-[15px] leading-[21px]",
            mine ? "bg-primary text-on-primary" : "bg-raised text-text",
            mine ? (last ? "rounded-[18px] rounded-br-[6px]" : "rounded-[18px]") : last ? "rounded-[18px] rounded-bl-[6px]" : "rounded-[18px]",
            pending && "opacity-60",
          )}
        >
          {body}
        </div>
        {last && (time || delta) ? (
          <div className="mt-1 flex items-center gap-2 px-1 text-[12px] text-faint">
            {pending ? <span>Sending</span> : time && <span>{time}</span>}
            {delta ? <span className={cx("num", delta > 0 ? "text-positive" : "text-negative")}>{delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TypingBubble({ from, mine }: { from: Who; mine: boolean }) {
  return (
    <div className={cx("mb-3 flex items-end gap-2", mine && "flex-row-reverse")} aria-label={`${from.name} is typing`}>
      {!mine && <ChogFace chog={from} size={28} />}
      <div className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
        <div className={cx("inline-flex h-[37px] items-center gap-1 px-3.5", mine ? "rounded-[18px] rounded-br-[6px] bg-primary" : "rounded-[18px] rounded-bl-[6px] bg-raised")}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={cx("h-2 w-2 rounded-full", mine ? "bg-[#777]" : "bg-muted")} style={{ animation: `typing-dot 1s ${i * 160}ms infinite ease-in-out` }} />
          ))}
        </div>
        <span className="mt-1 px-1 text-[12px] text-faint">{mine ? "Your Chog is typing" : `${from.name} is typing`}</span>
      </div>
    </div>
  );
}
