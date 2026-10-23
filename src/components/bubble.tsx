import { cx } from "./primitives";
import { ChogFace } from "./chog";
import type { Profile } from "@/lib/types";

export function Bubble({ from, mine, body, delta, author }: { from: Pick<Profile, "tokenId" | "name" | "image">; mine: boolean; body: string; delta?: number; author?: "human" | "ai" }) {
  return (
    <div className={cx("flex items-end gap-2", mine && "flex-row-reverse")} style={{ animation: "bubble-in 200ms var(--motion-out) both" }}>
      <ChogFace chog={from} size={34} />
      <div className={cx("max-w-[78%]", mine && "items-end text-right")}>
        <div className={cx("sticker inline-block px-3.5 py-2.5 text-left text-[15px] leading-snug", mine ? "!bg-accent-soft" : "")}>{body}</div>
        <div className={cx("mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-fg-faint", mine && "justify-end")}>
          {author === "human" ? <span>{mine ? "typed by you" : "typed by their human"}</span> : author === "ai" ? <span>{mine ? "your chog, on its own" : "in character"}</span> : null}
          {delta !== undefined && delta !== 0 && <span className={delta > 0 ? "text-success" : "text-danger"}>{delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}</span>}
        </div>
      </div>
    </div>
  );
}
