import "server-only";
import { errorResponse, getSession, HttpError, requireChog } from "./session";

// Route helpers: every dating action runs as the session's active Chog, re-verified on-chain.

export async function requireActive(): Promise<number> {
  const s = await getSession();
  if (!s.activeTokenId) throw new HttpError(400, "Pick which Chog you're dating as");
  await requireChog(s.activeTokenId);
  return s.activeTokenId;
}

export function route<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      return Response.json(await fn(...args));
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Bad request body");
  }
}

// Spend guard for the routes that call the model: per Chog, in memory (per server
// instance). A full date is ~11 calls, so this never bites a real user.
const hits = new Map<number, number[]>();
export function limitModelCalls(tokenId: number, max = 40, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(tokenId) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) throw new HttpError(429, "Easy, Romeo. Your Chog needs a few minutes before the next line.");
  recent.push(now);
  hits.set(tokenId, recent);
}
