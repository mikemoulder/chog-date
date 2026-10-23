"use client";
import { useConnect } from "wagmi";
import { GIFTS, type GiftKind } from "@/lib/gifts";
import { cx } from "./primitives";
import { toast } from "./states";
import { useGift } from "./use-gift";

const GET_CHOG = "https://dexscreener.com/monad/0x350035555e10d9afaf1566aaebfced5ba6c27777";

// Spoil your match with $CHOG. Every gift is burned, so nobody pockets it.
export function GiftPanel({ coupleId, partnerName, disabled, onGiven }: { coupleId: string; partnerName: string; disabled?: boolean; onGiven: () => void }) {
  const { give, busy, chog, walletReady } = useGift();
  const { connectAsync, connectors } = useConnect();

  async function send(kind: GiftKind) {
    const res = await give<{ chemistry?: number }>(kind, { coupleId });
    if (res) {
      toast.success(`${GIFTS[kind].icon} ${partnerName} got your ${GIFTS[kind].label.toLowerCase()}`);
      onGiven();
    }
  }

  return (
    <div className="sticker p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="t-label">Spoil them in $CHOG</p>
        {walletReady && chog !== undefined && <span className="font-mono text-[11px] text-fg-mute">{chog.toLocaleString()} $CHOG</span>}
      </div>
      <div className="mt-3 grid gap-2">
        {(["rose", "dinner"] as GiftKind[]).map((k) => (
          <button
            key={k}
            onClick={() => send(k)}
            disabled={disabled || !walletReady || busy !== null}
            aria-busy={busy === k}
            className={cx("btn btn-quiet !h-auto w-full min-w-0 justify-between !whitespace-normal !px-3 !py-2.5 text-left")}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-[20px]" aria-hidden>{GIFTS[k].icon}</span>
              <span>
                <span className="block text-[14px]">{GIFTS[k].label}</span>
                <span className="block text-[12px] font-normal text-fg-mute">{GIFTS[k].blurb}</span>
              </span>
            </span>
            <span className="chip shrink-0 bg-accent">{GIFTS[k].price}</span>
          </button>
        ))}
      </div>
      {!walletReady ? (
        <button
          className="btn btn-text btn-sm mt-2 w-full"
          onClick={() => connectors[0] && connectAsync({ connector: connectors[0] }).catch(() => toast.error("Couldn't connect a wallet"))}
        >
          Connect your wallet to send gifts
        </button>
      ) : (
        <p className="mt-3 text-[12px] text-fg-mute">
          Every gift is burned, not paid to anyone.{" "}
          <a className="underline underline-offset-2" href={GET_CHOG} target="_blank" rel="noreferrer">
            Get $CHOG
          </a>
        </p>
      )}
    </div>
  );
}
