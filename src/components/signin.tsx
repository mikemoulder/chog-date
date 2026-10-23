"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { api } from "@/lib/client";
import { signInMessage } from "@/lib/signin";
import { toast } from "./states";

// Connect → sign a nonce → the server checks the signature and asks the contract
// which Chogs this wallet holds. No Chog, no entry.
export function SignInButton({ className = "" }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      let addr = address;
      if (!isConnected || !addr) {
        const connector = connectors[0];
        if (!connector) throw new Error("No wallet found. Install Rabby, MetaMask or Phantom.");
        addr = (await connectAsync({ connector })).accounts[0];
      }
      const { nonce } = await api<{ nonce: string }>("/api/auth/nonce", {});
      const signature = await signMessageAsync({ message: signInMessage(addr, nonce) });
      const res = await api<{ holds: number }>("/api/auth/verify", { address: addr, signature });
      await qc.invalidateQueries({ queryKey: ["me"] });
      if (res.holds === 0) router.push("/no-chog");
      else router.push("/pick");
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (!/reject|denied|cancel/i.test(msg)) toast.error(msg.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={`btn btn-accent btn-lg ${className}`} onClick={go} aria-busy={busy}>
      Connect wallet
    </button>
  );
}
