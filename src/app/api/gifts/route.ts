import { body, limitModelCalls, requireActive, route } from "@/lib/api";
import { giveGift } from "@/lib/dating";
import type { GiftKind } from "@/lib/gifts";
import { requireChog } from "@/lib/session";

export const maxDuration = 60;

// Called after the browser has burned $CHOG. The burn is verified on Monad before anything happens.
export const POST = route(async (req: Request) => {
  const me = await requireActive();
  const address = await requireChog(me);
  limitModelCalls(me);
  const { kind, txHash, coupleId, target } = await body<{ kind: GiftKind; txHash: `0x${string}`; coupleId?: string; target?: number }>(req);
  return giveGift(me, address, kind, txHash, { coupleId, target: target === undefined ? undefined : Number(target) });
});
