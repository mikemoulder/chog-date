// Download every Chog image once and write a 512px webp to public/chogs/<tokenId>.webp,
// so the app never depends on an IPFS gateway at runtime.
// Usage: node scripts/thumbs.mjs   (reads .cache/meta, written by index-chogs.mjs)
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

const GATEWAYS = ["https://ipfs.filebase.io/ipfs/"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => stat(p).then(() => true, () => false);

await mkdir("public/chogs", { recursive: true });
const ids = (await readdir(".cache/meta")).map((f) => Number(f.replace(".json", ""))).sort((a, b) => a - b);

async function fetchImage(uri) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(uri.replace("ipfs://", GATEWAYS[i % GATEWAYS.length]), { signal: AbortSignal.timeout(20000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {}
    await sleep(500 * 2 ** i);
  }
  throw new Error(`gave up: ${uri}`);
}

let done = 0, failed = 0;
const queue = [...ids];
await Promise.all(Array.from({ length: Number(process.env.CONCURRENCY ?? 4) }, async () => {
  for (let id; (id = queue.shift()) !== undefined; ) {
    const out = `public/chogs/${id}.webp`;
    if (await exists(out)) { done++; continue; }
    try {
      const meta = JSON.parse(await readFile(`.cache/meta/${id}.json`, "utf8"));
      const img = await fetchImage(meta.image);
      await writeFile(out, await sharp(img).resize(512, 512).webp({ quality: 78 }).toBuffer());
    } catch (e) { failed++; console.warn(`#${id}: ${e.message}`); }
    if (++done % 200 === 0) console.log(`thumbs: ${done}/${ids.length}`);
  }
}));
console.log(`thumbs: ${done} done, ${failed} failed`);
