import { requireActive, route } from "@/lib/api";
import { feed } from "@/lib/dating";

export const GET = route(async () => feed(await requireActive()));
