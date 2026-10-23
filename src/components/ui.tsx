"use client";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="dark"
      toastOptions={{ style: { background: "#2a2a2a", border: "none", color: "#fff", borderRadius: 14, fontFamily: "var(--font)" } }}
    />
  );
}

// Section entrances: anything marked data-rise fades up once when it enters the viewport.
export function RiseRoot() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rise]:not(.in)"));
    if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [path]);
  return null;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

// An empty block keeps its frame and says one sentence, with the action that fills it.
export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-dashed border-control px-5 py-5 text-[14px] text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Failed({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-panel bg-surface px-5 py-4 text-[14px]">
      <p className="text-muted">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-negative align-middle" aria-hidden />
        Couldn&apos;t load {what}.
      </p>
      {onRetry && (
        <button className="btn btn-text" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
