"use client";
import { useConnect } from "wagmi";
import { GIFTS, type GiftKind } from "@/lib/gifts";
import { CandleIcon, RoseIcon } from "./icons";
import { toast } from "./ui";
import { useGift } from "./use-gift";

const GET_CHOG = "https://dexscreener.com/monad/0x350035555e10d9afaf1566aaebfced5ba6c27777";
const ICON: Partial<Record<GiftKind, () => React.ReactElement>> = { rose: RoseIcon, dinner: CandleIcon };

// Spoil your match in $CHOG: 90% goes to their holder, 10% to the builder.
export function GiftPanel({ coupleId, partnerName, disabled, onGiven }: { coupleId: string; partnerName: string; disabled?: boolean; onGiven: () => void }) {
  const { give, busy, chog, walletReady } = useGift();
  const { connectAsync, connectors } = useConnect();

  async function send(kind: GiftKind) {
    const res = await give<{ chemistry?: number }>(kind, { coupleId });
    if (res) {
      toast.success(`${partnerName} got your ${GIFTS[kind].label.toLowerCase()}`);
      onGiven();
    }
  }

  return (
    <section className="rounded-card bg-surface p-5" aria-labelledby="gifts">
      <div className="flex items-baseline justify-between">
        <h2 id="gifts" className="text-[16px] font-semibold">
          Gifts
        </h2>
        <span className="num text-[13px] text-faint">{walletReady && chog !== undefined ? `${chog.toLocaleString()} $CHOG in wallet` : "Paid in $CHOG"}</span>
      </div>
      <ul className="mt-3">
        {(["rose", "dinner"] as GiftKind[]).map((k) => {
          const Icon = ICON[k]!;
          return (
            <li key={k} className="flex items-center gap-3 border-t border-rule py-3 first:border-t-0">
              <span className="text-muted"><Icon /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">{GIFTS[k].label}</p>
                <p className="text-[13px] text-faint">{GIFTS[k].blurb}</p>
              </div>
              <button className="btn btn-outline !h-8 !px-3 text-[13px]" onClick={() => send(k)} disabled={disabled || !walletReady || busy !== null} aria-busy={busy === k}>
                <span className="num">{GIFTS[k].price}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {!walletReady ? (
        <button className="btn btn-outline mt-2 w-full" onClick={() => connectors[0] && connectAsync({ connector: connectors[0] }).catch(() => toast.error("Couldn't connect a wallet"))}>
          Connect your wallet to send gifts
        </button>
      ) : (
        <p className="mt-2 text-[13px] text-faint">
          90% goes to their holder, 10% to the builder.{" "}
          <a className="text-muted underline underline-offset-2 hover:text-text" href={GET_CHOG} target="_blank" rel="noreferrer">
            Get $CHOG
          </a>
        </p>
      )}
    </section>
  );
}
