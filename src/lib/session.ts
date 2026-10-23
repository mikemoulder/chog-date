import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { holds } from "./chain";
import { HttpError } from "./http";

export type SessionData = {
  address?: string; // lowercase, set after a verified signature
  nonce?: string;
  activeTokenId?: number; // the Chog this wallet is currently dating as
};

function options(): SessionOptions {
  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? undefined : "dev-only-secret-chog-date-0123456789abcdef");
  if (!secret) throw new Error("SESSION_SECRET is required in production");
  return {
    cookieName: "chogdate",
    password: secret,
    cookieOptions: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true },
    ttl: 60 * 60 * 24 * 14,
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), options());
}

export { HttpError };

export async function requireAddress(): Promise<string> {
  const s = await getSession();
  if (!s.address) throw new HttpError(401, "Connect your wallet first");
  return s.address;
}

// Every action is taken *as a Chog*. Ownership is checked on-chain each time:
// sell the NFT and the old wallet loses it on the next request.
export async function requireChog(tokenId: number): Promise<string> {
  const address = await requireAddress();
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > 1969) throw new HttpError(400, "Unknown Chog");
  if (!(await holds(address, tokenId))) throw new HttpError(403, `This wallet doesn't hold Chog #${tokenId}`);
  return address;
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
