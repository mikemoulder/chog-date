"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMe } from "@/lib/client";
import { ChogFace } from "./chog";
import { cx } from "./primitives";
import { Skeleton } from "./states";
import type { Me } from "@/lib/types";

const TABS = [
  { href: "/swipe", label: "Swipe" },
  { href: "/matches", label: "Matches" },
  { href: "/gossip", label: "Gossip" },
  { href: "/me", label: "Me" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx("font-display text-[22px] font-extrabold tracking-[-0.04em]", className)}>
      chog<span className="mx-0.5 inline-block -translate-y-px rounded-chip border-2 border-line-strong bg-accent px-1.5 text-[16px] leading-[20px]">♥</span>date
    </Link>
  );
}

// Holders only: every app screen sits behind a signed-in wallet with an active Chog.
export function AppShell({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMe();
  const router = useRouter();
  const path = usePathname();
  const me = data && data.address ? (data as Me) : null;
  const active = me?.chogs.find((c) => c.tokenId === me.activeTokenId);

  useEffect(() => {
    if (isLoading || !data) return;
    if (!data.address) router.replace("/");
    else if (!(data as Me).chogs.length) router.replace("/no-chog");
    else if (!(data as Me).activeTokenId && path !== "/pick") router.replace("/pick");
  }, [data, isLoading, path, router]);

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b-2 border-line-strong bg-glass backdrop-blur">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-[var(--gutter)]">
          <Wordmark />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={cx("rounded-button px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-wider", path.startsWith(t.href) ? "bg-fg text-ground" : "hover:bg-fill")}>
                {t.label}
              </Link>
            ))}
          </nav>
          {active ? (
            <Link href="/me" className="flex items-center gap-2" aria-label={`Dating as ${active.name}`}>
              <span className="hidden text-right sm:block">
                <span className="t-label block">Dating as</span>
                <span className="block text-[14px] font-bold leading-tight">{active.name}</span>
              </span>
              <ChogFace chog={active} size={40} />
            </Link>
          ) : (
            <Skeleton className="h-10 w-10 rounded-tile" />
          )}
        </div>
      </header>
      <main>{me && (me.activeTokenId || path === "/pick") ? children : <ShellSkeleton />}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-2 border-line-strong bg-panel md:hidden" aria-label="Main">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={cx("flex h-16 items-center justify-center font-mono text-[11px] font-semibold uppercase tracking-wider", path.startsWith(t.href) ? "bg-fg text-ground" : "")}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto max-w-[560px] space-y-4 px-[var(--gutter)] py-8" aria-busy>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="aspect-square w-full rounded-panel" />
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="t-display-m">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-fg-mute">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
