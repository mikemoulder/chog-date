import { cx } from "./ui";
import type { Profile } from "@/lib/types";

// A Chog's face. People and tokens are circles; the art keeps its own background.
export function ChogFace({ chog, size = 48, className, square }: { chog: Pick<Profile, "tokenId" | "name" | "image">; size?: number; className?: string; square?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chog.image}
      alt={chog.name}
      width={size}
      height={size}
      loading="lazy"
      className={cx("shrink-0 bg-raised object-cover", square ? "rounded-media" : "rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

// Who is behind a Chog. AI-run Chogs are always labelled.
export function Driver({ profile, className }: { profile: Pick<Profile, "claimed" | "mode">; className?: string }) {
  if (profile.claimed && profile.mode !== "autopilot") return <span className={cx("pill pill-positive", className)}>Human</span>;
  return <span className={cx("pill", className)}>{profile.claimed ? "Autopilot" : "AI-run"}</span>;
}

export const STAGE_LABEL: Record<string, string> = {
  matched: "Matched",
  first_date: "First date",
  dating: "Dating",
  official: "Official",
  married: "Married",
  broken_up: "Broken up",
};
export const STAGE_ORDER = ["matched", "first_date", "dating", "official", "married"];

export function StageChip({ stage, className }: { stage: string; className?: string }) {
  return <span className={cx("pill", stage === "official" || stage === "married" ? "pill-accent" : stage === "broken_up" ? "pill-negative" : "", className)}>{STAGE_LABEL[stage] ?? stage}</span>;
}
