import sharp from "sharp";
import { getChogImage } from "@/lib/chogs";

// Fallback for thumbnails not yet in public/chogs (next.config rewrites misses here).
// Fetches the original from IPFS once, resizes, and lets the CDN keep it forever.
const GATEWAYS = ["https://ipfs.filebase.io/ipfs/", "https://gateway.pinata.cloud/ipfs/"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id.replace(/\.webp$/, ""));
  const uri = Number.isInteger(id) && id >= 1 && id <= 1969 ? getChogImage(id) : undefined;
  if (!uri) return new Response("Not found", { status: 404 });
  for (const g of GATEWAYS) {
    try {
      const res = await fetch(uri.replace("ipfs://", g), { signal: AbortSignal.timeout(12_000) });
      if (!res.ok) continue;
      const out = await sharp(Buffer.from(await res.arrayBuffer())).resize(512, 512).webp({ quality: 78 }).toBuffer();
      return new Response(new Uint8Array(out), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
    } catch {}
  }
  return new Response("Image unavailable", { status: 503, headers: { "cache-control": "no-store" } });
}
