import { route } from "@/lib/api";
import { tokensOf } from "@/lib/chain";
import { getProfiles } from "@/lib/profiles";
import { getSession } from "@/lib/session";
import type { Me } from "@/lib/types";

export const GET = route(async (): Promise<Me | { address: null }> => {
  const s = await getSession();
  if (!s.address) return { address: null };
  const ids = await tokensOf(s.address);
  const profiles = await getProfiles(ids);
  return { address: s.address, chogs: ids.map((id) => profiles.get(id)!), activeTokenId: ids.includes(s.activeTokenId ?? -1) ? s.activeTokenId : undefined };
});
