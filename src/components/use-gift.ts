"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount, useConfig, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { monad } from "wagmi/chains";
import { api, useMe } from "@/lib/client";
import { CHOG_DECIMALS, CHOG_TOKEN, erc20TransferAbi, GIFTS, type GiftKind } from "@/lib/gifts";
import { toast } from "./ui";

type Quote = { holder: Address; holderAmount: string; builder: Address; builderAmount: string; recipient: string };
type To = { coupleId?: string; target?: number };

// A gift is two $CHOG transfers from the signed-in wallet: 90% to whoever holds the Chog
// receiving it, 10% to the builder. The server quotes both addresses first and verifies
// both transfers on Monad afterwards. If the sender stops after the first transfer, it is
// remembered, so trying again only asks for the second.
export function useGift() {
  const { data: me } = useMe();
  const signedIn = me?.address ?? null;
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<GiftKind | null>(null);
  const paidHolder = useRef(new Map<string, `0x${string}`>());

  const balance = useReadContract({
    address: CHOG_TOKEN,
    abi: erc20TransferAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: monad.id,
    query: { enabled: !!address },
  });
  const chog = balance.data === undefined ? undefined : Number(balance.data / BigInt(10) ** BigInt(CHOG_DECIMALS));

  async function transfer(to: Address, amount: string) {
    const hash = await writeContractAsync({ address: CHOG_TOKEN, abi: erc20TransferAbi, functionName: "transfer", args: [to, BigInt(amount)], chainId: monad.id });
    await waitForTransactionReceipt(config, { hash, chainId: monad.id });
    return hash;
  }

  async function give<T>(kind: GiftKind, to: To): Promise<T | null> {
    const gift = GIFTS[kind];
    if (!isConnected || !address) {
      toast.error("Connect the wallet you signed in with to send gifts.");
      return null;
    }
    if (signedIn && address.toLowerCase() !== signedIn) {
      toast.error("Switch your wallet to the one you signed in with.");
      return null;
    }
    const key = `${kind}:${to.coupleId ?? to.target}`;
    if (chog !== undefined && chog < gift.price && !paidHolder.current.has(key)) {
      toast.error(`A ${gift.label.toLowerCase()} is ${gift.price} $CHOG. This wallet has ${chog.toLocaleString()}.`);
      return null;
    }
    setBusy(kind);
    try {
      const quote = await api<Quote>("/api/gifts/quote", { kind, ...to });
      if (chainId !== monad.id) await switchChainAsync({ chainId: monad.id });
      let first = paidHolder.current.get(key);
      if (!first) {
        toast(`1 of 2: ${Number(BigInt(quote.holderAmount) / BigInt(10) ** BigInt(CHOG_DECIMALS))} $CHOG to ${quote.recipient}'s holder`);
        first = await transfer(quote.holder, quote.holderAmount);
        paidHolder.current.set(key, first);
      }
      toast(`2 of 2: ${Number(BigInt(quote.builderAmount) / BigInt(10) ** BigInt(CHOG_DECIMALS))} $CHOG to the builder`);
      const second = await transfer(quote.builder, quote.builderAmount);
      const res = await api<T>("/api/gifts", { kind, txHashes: [first, second], ...to });
      paidHolder.current.delete(key);
      balance.refetch();
      qc.invalidateQueries({ queryKey: ["gifted"] });
      return res;
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (paidHolder.current.has(key) && /reject|denied|cancel/i.test(msg)) toast("The holder got their share. Try again to finish with the builder's 10%.");
      else if (!/reject|denied|cancel/i.test(msg)) toast.error(msg.split("\n")[0]);
      return null;
    } finally {
      setBusy(null);
    }
  }

  return { give, busy, chog, walletReady: isConnected && !!address && (!signedIn || address.toLowerCase() === signedIn) };
}
