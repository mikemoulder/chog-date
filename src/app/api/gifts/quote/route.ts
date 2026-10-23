import { body, requireActive, route } from "@/lib/api";
import { giftQuote } from "@/lib/dating";
import type { GiftKind } from "@/lib/gifts";
import { requireChog } from "@/lib/session";

// Before the wallet opens: who receives the 90% (the Chog's current holder) and the 10% (the builder).
export const POST = route(async (req: Request) => {
  const me = await requireActive();
  const address = await requireChog(me);
  const { kind, coupleId, target } = await body<{ kind: GiftKind; coupleId?: string; target?: number }>(req);
  return giftQuote(me, address, kind, { coupleId, target: target === undefined ? undefined : Number(target) });
});
