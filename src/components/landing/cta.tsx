"use client";
import Link from "next/link";
import { useMe } from "@/lib/client";
import { SignInButton } from "../signin";

// The one action, wherever it appears: connect, or go straight in if this wallet already did.
export function PrimaryAction({ tone = "ink", size = "lg" }: { tone?: "ink" | "orange" | "white"; size?: "lg" | "md" }) {
  const { data } = useMe();
  const cls = `btn ${size === "lg" ? "btn-lg" : ""} ${tone === "ink" ? "!bg-ink !text-orange hover:!bg-[#13222c]" : tone === "orange" ? "!bg-orange !text-ink hover:!bg-orange-2" : "!bg-paper !text-ink hover:!bg-[#eee]"}`;
  if (data?.address && "chogs" in data && data.chogs.length) {
    return (
      <Link className={cls} href={data.activeTokenId ? "/swipe" : "/pick"}>
        Open Chog Date
      </Link>
    );
  }
  return <SignInButton className={cls} />;
}
