"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/shell";
import { toast } from "@/components/states";
import { api } from "@/lib/client";

export function DevLogin() {
  const [tokenId, setTokenId] = useState("1");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/dev/login", { tokenId: Number(tokenId) });
      await qc.invalidateQueries({ queryKey: ["me"] });
      router.push("/pick");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center gap-6 px-[var(--gutter)] py-12">
      <Wordmark />
      <span className="chip w-fit bg-warning-soft">Local test mode</span>
      <h1 className="t-display-m">Test as a Chog holder</h1>
      <p className="text-[15px] text-fg-soft">
        Pick any Chog by token id (1 to 1969). You&apos;ll be signed in as whoever holds it on Monad right now, and see every Chog in their wallet. Nothing is signed or sent on-chain. This page only exists in local dev.
      </p>
      <form onSubmit={go} className="flex gap-2">
        <input
          className="field-input h-12 flex-1 !border-2 !border-line-strong"
          inputMode="numeric"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          aria-label="Token id"
        />
        <button className="btn btn-accent" aria-busy={busy}>
          Sign in as holder
        </button>
      </form>
      <p className="text-[13px] text-fg-mute">Tip: use two browsers (or a private window) with two different token ids to test human-to-human dates and unmasking.</p>
    </main>
  );
}
