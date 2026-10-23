import { requireActive, route } from "@/lib/api";
import { burnedForLove } from "@/lib/dating";

export const GET = route(async () => {
  await requireActive();
  return { burned: await burnedForLove() };
});
