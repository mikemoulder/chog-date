import { requireActive, route } from "@/lib/api";
import { coupleDetail } from "@/lib/dating";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, { params }: Ctx) => coupleDetail((await params).id, await requireActive()));
