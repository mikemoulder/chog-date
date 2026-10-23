"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useConfig, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { monad } from "wagmi/chains";
import { api, useMe } from "@/lib/client";
import { BURN_ADDRESS, CHOG_DECIMALS, CHOG_TOKEN, erc20TransferAbi, GIFTS, type GiftKind } from "@/lib/gifts";
import { toast } from "./states";

// Burn $CHOG from the signed-in wallet, wait for Monad to confirm, then hand the tx hash
// to the server, which verifies the burn on-chain before applying the gift.
export function useGift() {
  const { data: me } = useMe();
  const signedIn = me?.address ?? null;
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<GiftKind | null>(null);

  const balance = useReadContract({
    address: CHOG_TOKEN,
    abi: erc20TransferAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: monad.id,
    query: { enabled: !!address },
  });
  const chog = balance.data === undefined ? undefined : Number(balance.data / BigInt(10) ** BigInt(CHOG_DECIMALS));

  async function give<T>(kind: GiftKind, to: { coupleId?: string; target?: number }): Promise<T | null> {
    const gift = GIFTS[kind];
    if (!isConnected || !address) {
      toast.error("Connect the wallet you signed in with to send $CHOG gifts.");
      return null;
    }
    if (signedIn && address.toLowerCase() !== signedIn) {
      toast.error("Switch your wallet to the one you signed in with.");
      return null;
    }
    if (chog !== undefined && chog < gift.price) {
      toast.error(`You need ${gift.price} $CHOG for a ${gift.label.toLowerCase()}. This wallet has ${chog}.`);
      return null;
    }
    setBusy(kind);
    try {
      if (chainId !== monad.id) await switchChainAsync({ chainId: monad.id });
      const hash = await writeContractAsync({
        address: CHOG_TOKEN,
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [BURN_ADDRESS, parseUnits(String(gift.price), CHOG_DECIMALS)],
        chainId: monad.id,
      });
      toast(`${gift.icon} Burning ${gift.price} $CHOG…`);
      await waitForTransactionReceipt(config, { hash, chainId: monad.id });
      const res = await api<T>("/api/gifts", { kind, txHash: hash, ...to });
      balance.refetch();
      qc.invalidateQueries({ queryKey: ["burned"] });
      return res;
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (!/reject|denied|cancel/i.test(msg)) toast.error(msg.split("\n")[0]);
      return null;
    } finally {
      setBusy(null);
    }
  }

  return { give, busy, chog, walletReady: isConnected && !!address && (!signedIn || address.toLowerCase() === signedIn) };
}
