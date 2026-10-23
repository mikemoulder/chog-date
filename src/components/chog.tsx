import { cx } from "./primitives";
import type { Profile } from "@/lib/types";

// A Chog's face, as a sticker. The art already has its own outline and background.
export function ChogFace({ chog, size = 56, className, ring }: { chog: Pick<Profile, "tokenId" | "name" | "image">; size?: number; className?: string; ring?: "accent" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chog.image}
      alt={chog.name}
      width={size}
      height={size}
      loading="lazy"
      className={cx("shrink-0 rounded-tile border-2 border-line-strong bg-surface object-cover", ring === "accent" && "outline-2 outline-offset-2 outline-accent", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function AiBadge({ profile, className }: { profile: Pick<Profile, "claimed" | "mode">; className?: string }) {
  if (profile.claimed && profile.mode !== "autopilot") return <span className={cx("chip", className)}>Human at the wheel</span>;
  return <span className={cx("chip bg-surface", className)}>{profile.claimed ? "Autopilot · AI" : "Unclaimed · AI-run"}</span>;
}

const STAGE_LABEL: Record<string, string> = {
  matched: "Matched",
  first_date: "First date",
  dating: "Dating",
  official: "Official",
  married: "Married",
  broken_up: "Broken up",
};

export function StageChip({ stage, className }: { stage: string; className?: string }) {
  return <span className={cx("chip", stage === "married" || stage === "official" ? "bg-accent" : stage === "broken_up" ? "bg-danger-soft" : "", className)}>{STAGE_LABEL[stage] ?? stage}</span>;
}

export const STAGE_ORDER = ["matched", "first_date", "dating", "official", "married"];
export { STAGE_LABEL };
