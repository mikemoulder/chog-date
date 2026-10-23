import { body, route } from "@/lib/api";
import { tokensOf, verifySignature } from "@/lib/chain";
import { getSession, HttpError } from "@/lib/session";
import { signInMessage } from "@/lib/signin";

export const POST = route(async (req: Request) => {
  const { address, signature } = await body<{ address: string; signature: `0x${string}` }>(req);
  const s = await getSession();
  if (!s.nonce || !address || !signature) throw new HttpError(400, "Missing sign-in data");
  const ok = await verifySignature(address, signInMessage(address, s.nonce), signature).catch(() => false);
  if (!ok) throw new HttpError(401, "Signature didn't check out");
  const chogs = await tokensOf(address, { fresh: true });
  s.address = address.toLowerCase();
  s.nonce = undefined;
  if (s.activeTokenId && !chogs.includes(s.activeTokenId)) s.activeTokenId = undefined;
  await s.save();
  return { address: s.address, holds: chogs.length };
});
