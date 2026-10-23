import { route } from "@/lib/api";
import { ownerOf } from "@/lib/chain";
import { getSession, HttpError } from "@/lib/session";

// Local testing only: sign in as the real current holder of a Chog, without a wallet.
// Ownership checks still run against the chain, so everything else behaves exactly as
// it would for that holder. Disabled unless NODE_ENV=development and DEV_LOGIN=1.
export const POST = route(async (req: Request) => {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_LOGIN !== "1") throw new HttpError(404, "Not found");
  const { address, tokenId } = (await req.json()) as { address?: string; tokenId?: number };
  const id = Number(tokenId);
  const holder = address ?? (Number.isInteger(id) && id >= 1 && id <= 1969 ? await ownerOf(id) : undefined);
  if (!holder) throw new HttpError(400, "Give a token id between 1 and 1969");
  const s = await getSession();
  s.address = holder.toLowerCase();
  s.activeTokenId = undefined;
  await s.save();
  return { address: s.address };
});
