import { body, requireActive, route } from "@/lib/api";
import { unmask } from "@/lib/dating";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (req: Request, { params }: Ctx) => {
  const me = await requireActive();
  const { handle } = await body<{ handle: string }>(req);
  await unmask((await params).id, me, String(handle ?? ""));
  return { ok: true };
});
