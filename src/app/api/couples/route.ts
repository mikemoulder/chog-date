import { requireActive, route } from "@/lib/api";
import { listCouples } from "@/lib/dating";

export const GET = route(async () => listCouples(await requireActive()));
