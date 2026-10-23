import { requireActive, route } from "@/lib/api";
import { giftedTotal } from "@/lib/dating";

export const GET = route(async () => {
  await requireActive();
  return { gifted: await giftedTotal() };
});
