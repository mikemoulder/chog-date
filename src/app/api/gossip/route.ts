import { requireActive, route } from "@/lib/api";
import { gossip } from "@/lib/dating";

// Holders only, like everything else.
export const GET = route(async () => {
  await requireActive();
  return gossip();
});
