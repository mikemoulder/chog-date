import { route } from "@/lib/api";
import { ownerOf } from "@/lib/chain";
import { claim } from "@/lib/dating";
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

// Same, as a link: /api/dev/login?token=42&next=/swipe signs in, picks that Chog, redirects.
// Lets a headless browser (the design inspector) open app screens. Dev only, like above.
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_LOGIN !== "1") return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("token"));
  if (!Number.isInteger(id) || id < 1 || id > 1969) return new Response("Give ?token=1..1969", { status: 400 });
  const s = await getSession();
  s.address = (await ownerOf(id)).toLowerCase();
  s.activeTokenId = id;
  await s.save();
  await claim(id, s.address);
  const next = url.searchParams.get("next") ?? "/swipe";
  // Relative, so the cookie and the redirect stay on the same host.
  return new Response(null, { status: 302, headers: { Location: next.startsWith("/") ? next : "/swipe" } });
}
