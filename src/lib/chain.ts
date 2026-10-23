import "server-only";
import { createPublicClient, http, parseAbi, type Address } from "viem";
import { monad } from "viem/chains";
import { snapshotOwner, snapshotTokensOf } from "./chogs";

// The Monad seam. Live reads with a short cache; the indexed snapshot is the fallback
// so a flaky public RPC degrades to slightly stale ownership instead of a dead app.

export const CHOG_CONTRACT = "0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763" as const;

const abi = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokensOfOwner(address owner) view returns (uint256[])",
]);

export const client = createPublicClient({
  chain: monad,
  transport: http(process.env.MONAD_RPC_URL ?? "https://rpc.monad.xyz", { timeout: 8000, retryCount: 1 }),
});

const TTL = 60_000;
const ownerCache = new Map<number, { owner: string; at: number }>();
const tokensCache = new Map<string, { ids: number[]; at: number }>();

export async function ownerOf(tokenId: number): Promise<string> {
  const hit = ownerCache.get(tokenId);
  if (hit && Date.now() - hit.at < TTL) return hit.owner;
  try {
    const owner = (await client.readContract({ address: CHOG_CONTRACT, abi, functionName: "ownerOf", args: [BigInt(tokenId)] })).toLowerCase();
    ownerCache.set(tokenId, { owner, at: Date.now() });
    return owner;
  } catch (e) {
    console.warn(`[chain] ownerOf(${tokenId}) failed, using snapshot`, (e as Error).message);
    return snapshotOwner(tokenId);
  }
}

export async function tokensOf(address: string, { fresh = false } = {}): Promise<number[]> {
  const key = address.toLowerCase();
  const hit = tokensCache.get(key);
  if (!fresh && hit && Date.now() - hit.at < TTL) return hit.ids;
  try {
    const ids = (await client.readContract({ address: CHOG_CONTRACT, abi, functionName: "tokensOfOwner", args: [key as Address] }))
      .map(Number)
      .sort((a, b) => a - b);
    tokensCache.set(key, { ids, at: Date.now() });
    for (const id of ids) ownerCache.set(id, { owner: key, at: Date.now() });
    return ids;
  } catch (e) {
    console.warn(`[chain] tokensOfOwner(${key}) failed, using snapshot`, (e as Error).message);
    return snapshotTokensOf(key);
  }
}

export async function holds(address: string, tokenId: number): Promise<boolean> {
  return (await ownerOf(tokenId)) === address.toLowerCase();
}

export async function verifySignature(address: string, message: string, signature: `0x${string}`) {
  // publicClient.verifyMessage also handles smart-contract wallets (ERC-1271).
  return client.verifyMessage({ address: address as Address, message, signature });
}
