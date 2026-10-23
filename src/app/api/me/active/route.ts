import { body, route } from "@/lib/api";
import { claim } from "@/lib/dating";
import { getSession, requireChog } from "@/lib/session";

// Choose which Chog to date as. Claiming hands over everything it did while AI-run.
export const POST = route(async (req: Request) => {
  const { tokenId } = await body<{ tokenId: number }>(req);
  const address = await requireChog(Number(tokenId));
  const s = await getSession();
  s.activeTokenId = Number(tokenId);
  await s.save();
  return claim(Number(tokenId), address);
});
