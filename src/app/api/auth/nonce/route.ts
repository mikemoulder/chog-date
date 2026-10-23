import { randomBytes } from "node:crypto";
import { route } from "@/lib/api";
import { getSession } from "@/lib/session";

export const POST = route(async () => {
  const s = await getSession();
  s.nonce = randomBytes(12).toString("hex");
  await s.save();
  return { nonce: s.nonce };
});
