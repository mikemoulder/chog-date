import { body, limitModelCalls, requireActive, route } from "@/lib/api";
import { sendLine } from "@/lib/dating";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 60;

export const POST = route(async (req: Request, { params }: Ctx) => {
  const me = await requireActive();
  limitModelCalls(me);
  const { text } = await body<{ text: string }>(req);
  return sendLine((await params).id, me, String(text ?? ""));
});
