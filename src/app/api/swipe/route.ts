import { body, requireActive, route } from "@/lib/api";
import { swipe } from "@/lib/dating";

export const POST = route(async (req: Request) => {
  const me = await requireActive();
  const { target, liked } = await body<{ target: number; liked: boolean }>(req);
  return swipe(me, Number(target), !!liked);
});
