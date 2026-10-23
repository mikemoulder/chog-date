import { body, requireActive, route } from "@/lib/api";
import { setMode } from "@/lib/dating";
import { HttpError } from "@/lib/session";
import type { Mode } from "@/lib/types";

export const POST = route(async (req: Request) => {
  const me = await requireActive();
  const { mode } = await body<{ mode: Mode }>(req);
  if (!["manual", "copilot", "autopilot"].includes(mode)) throw new HttpError(400, "Unknown mode");
  await setMode(me, mode);
  return { mode };
});
