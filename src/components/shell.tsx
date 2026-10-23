"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMe } from "@/lib/client";
import type { Me } from "@/lib/types";
import { ChogFace } from "./chog";
import { cx, Skeleton } from "./ui";

const TABS = [
  { href: "/swipe", label: "Swipe" },
  { href: "/matches", label: "Matches" },
  { href: "/gossip", label: "Gossip" },
  { href: "/me", label: "Profile" },
];

// The logo: chog ❤️ date.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-[0.12em] font-semibold tracking-[-0.02em]", className)} aria-label="Chog Date">
      chog
      {/* the heart badge: a pink pill, ink outline, ink heart */}
      <span aria-hidden className="mx-[0.06em] inline-flex h-[1.3em] w-[1.85em] translate-y-[0.04em] items-center justify-center rounded-full border-[0.11em] border-[#110e14] bg-[#ff3d8b] text-[0.95em] leading-none text-[#110e14]">
        ♥
      </span>
      date
    </span>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="text-[16px]">
      <Logo />
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
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-ground">
        <div className="mx-auto flex h-12 max-w-[1152px] items-center justify-between gap-6 px-4 lg:px-0">
          <Wordmark />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={cx("text-[14px] font-semibold transition-colors", path.startsWith(t.href) ? "text-text" : "text-faint hover:text-muted")}>
                {t.label}
              </Link>
            ))}
          </nav>
          {active ? (
            <Link href="/me" className="flex items-center gap-2.5 text-[14px]" aria-label={`Dating as ${active.name}`}>
              <span className="hidden text-muted sm:inline">
                Dating as <span className="font-semibold text-text">{active.name}</span>
              </span>
              <ChogFace chog={active} size={30} />
            </Link>
          ) : (
            <Skeleton className="h-[30px] w-[30px] !rounded-full" />
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1152px] px-4 lg:px-0">{me && (me.activeTokenId || path === "/pick") ? children : <ShellSkeleton />}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-border bg-ground md:hidden" aria-label="Main">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={cx("flex items-center justify-center text-[13px] font-semibold", path.startsWith(t.href) ? "text-text" : "text-faint")}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// Loading: the final layout with flat bars in place of the content, so nothing jumps.
function ShellSkeleton() {
  return (
    <div className="pb-10" aria-busy>
      <div className="pb-6 pt-8">
        <h1 className="text-[24px] font-semibold leading-[30px] text-faint">Loading</h1>
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <Skeleton className="h-[520px] w-full !rounded-card" />
        <Skeleton className="h-72 w-full !rounded-card" />
      </div>
    </div>
  );
}

// An app screen's title row: a noun at 24px, an optional line about the data, actions on the right.
export function TitleRow({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-8">
      <div>
        <h1 className="text-[24px] font-semibold leading-[30px] tracking-[-0.01em]">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
