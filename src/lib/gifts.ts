import { parseAbi, parseEventLogs, type Log } from "viem";

// $CHOG gifts. Shared by the browser (to pay) and the server (to verify). Every gift is
// burned: sent to the dead address, so nobody, including us, ever holds the money.

export const CHOG_TOKEN = "0x350035555e10d9afaf1566aaebfced5ba6c27777" as const; // Chog (CHOG), 18 decimals, Monad
export const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;
export const CHOG_DECIMALS = 18;

export type GiftKind = "rose" | "dinner" | "superlike";

export const GIFTS: Record<GiftKind, { label: string; icon: string; price: number; chemistry: number; blurb: string }> = {
  rose: { label: "Rose", icon: "🌹", price: 100, chemistry: 4, blurb: "+4 chemistry. They'll react in character." },
  dinner: { label: "Candlelit dinner", icon: "🕯️", price: 500, chemistry: 8, blurb: "+8 chemistry, and this date happens over dinner." },
  superlike: { label: "Super-like", icon: "⭐", price: 200, chemistry: 0, blurb: "AI-run Chogs always like back. Humans see it first." },
};

export const DINNER_VENUE = "a candlelit dinner they paid for in $CHOG";

export const erc20TransferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const transferEvent = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]);

// Total of `token` moved from `from` to `to` in a receipt's logs. Pure, so it can be
// checked against real receipts without a server.
export function sumTransfers(logs: Log[], { token, from, to }: { token: string; from: string; to: string }): bigint {
  return parseEventLogs({ abi: transferEvent, logs, eventName: "Transfer" })
    .filter((l) => l.address.toLowerCase() === token.toLowerCase() && l.args.from.toLowerCase() === from.toLowerCase() && l.args.to.toLowerCase() === to.toLowerCase())
    .reduce((sum, l) => sum + l.args.value, BigInt(0));
}
