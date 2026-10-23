import { limitModelCalls, requireActive, route } from "@/lib/api";
import { autoStep } from "@/lib/dating";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 60;

export const POST = route(async (_req: Request, { params }: Ctx) => {
  const me = await requireActive();
  limitModelCalls(me);
  return autoStep((await params).id, me);
});
