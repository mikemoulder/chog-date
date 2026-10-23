import { route } from "@/lib/api";
import { getSession } from "@/lib/session";

export const POST = route(async () => {
  (await getSession()).destroy();
  return { ok: true };
});
