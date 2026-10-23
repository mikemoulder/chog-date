import { lookup } from "@/lib/lookup";

// Public and read-only: powers the landing page's "type a Chog" line.
export function GET(req: Request) {
  return Response.json(lookup(new URL(req.url).searchParams.get("q") ?? ""), { headers: { "cache-control": "public, max-age=3600" } });
}
