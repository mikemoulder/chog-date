// Snapshot every Chog Genesis token: tokenURI, metadata (traits), owner.
// Reads straight from Monad, metadata from IPFS via Pinata. Writes data/chogs.json.
// Usage: node scripts/index-chogs.mjs
import { writeFile, mkdir, readFile } from "node:fs/promises";

const RPC = process.env.MONAD_RPC_URL ?? "https://rpc.monad.xyz";
const CONTRACT = "0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763";
// Public gateways rate-limit hard; rotate across the ones that answer.
const GATEWAYS = (process.env.IPFS_GATEWAYS ?? "https://ipfs.filebase.io/ipfs/").split(",");
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 12);
const PACE_MS = Number(process.env.PACE_MS ?? 0); // spacing between requests per worker, for strict gateways
const SUPPLY = 1969;
const CACHE = ".cache/meta";

const pad = (n) => n.toString(16).padStart(64, "0");
const decodeString = (hex) => {
  const len = parseInt(hex.slice(66, 130), 16);
  return Buffer.from(hex.slice(130, 130 + len * 2), "hex").toString("utf8");
};
const ipfs = (uri, n = 0) => uri.replace("ipfs://", GATEWAYS[n % GATEWAYS.length]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The public RPC caps batch size and rate, so: small batches, retry until every id resolves.
async function batchCall(selector, ids) {
  const results = new Map();
  for (let attempt = 0; results.size < ids.length; attempt++) {
    if (attempt > 8) throw new Error(`rpc: gave up on ${ids.length - results.size} ids`);
    const pending = ids.filter((id) => !results.has(id));
    const body = pending.map((id) => ({
      jsonrpc: "2.0", id, method: "eth_call",
      params: [{ to: CONTRACT, data: selector + pad(id) }, "latest"],
    }));
    try {
      const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const out = await res.json();
      for (const r of Array.isArray(out) ? out : []) if (r.result) results.set(r.id, r.result);
    } catch {}
    if (results.size < ids.length) await sleep(500 * 2 ** attempt);
  }
  return results;
}

async function fetchJson(uri, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const url = ipfs(uri, i);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return await res.json();
      if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    } catch (e) { if (i === tries - 1) throw e; }
    await sleep(Math.max(500, PACE_MS) * 2 ** i);
  }
  throw new Error(`gave up: ${uri}`);
}

await mkdir(CACHE, { recursive: true });
await mkdir("data", { recursive: true });

const ids = Array.from({ length: SUPPLY }, (_, i) => i + 1);
const uris = new Map(), owners = new Map();
for (let i = 0; i < ids.length; i += 20) {
  const chunk = ids.slice(i, i + 20);
  for (const [id, r] of await batchCall("0xc87b56dd", chunk)) uris.set(id, decodeString(r));
  for (const [id, r] of await batchCall("0x6352211e", chunk)) owners.set(id, "0x" + r.slice(26));
}
console.log(`rpc: ${uris.size} uris, ${owners.size} owners`);

const chogs = [];
const missing = [];
let done = 0;
async function worker(queue) {
  for (let id; (id = queue.shift()) !== undefined; ) {
    const file = `${CACHE}/${id}.json`;
    let meta;
    try { meta = JSON.parse(await readFile(file, "utf8")); }
    catch {
      try { meta = await fetchJson(uris.get(id)); await writeFile(file, JSON.stringify(meta)); await sleep(PACE_MS); }
      catch (e) { missing.push(id); console.warn(`#${id}: ${e.message}`); continue; }
    }
    chogs.push({
      tokenId: id,
      name: meta.name,
      image: meta.image,
      metadataUri: uris.get(id),
      traits: Object.fromEntries(meta.attributes.map((a) => [a.trait_type, a.value])),
      owner: owners.get(id),
    });
    if (++done % 100 === 0) console.log(`meta: ${done}/${SUPPLY}`);
  }
}
const queue = [...ids];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
if (missing.length) {
  console.error(`missing ${missing.length} tokens, rerun to retry (cached ones are skipped)`);
  process.exit(2);
}
chogs.sort((a, b) => a.tokenId - b.tokenId);
await writeFile("data/chogs.json", JSON.stringify(chogs));
console.log(`wrote data/chogs.json (${chogs.length} chogs)`);
