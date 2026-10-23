// Pre-generate a persona + bio for every Chog, written to data/personas.json so the swipe
// deck never waits on a model and never spends live quota. Resumable: rerun and it skips
// what's done. Uses the first model in OPENAI_MODELS (falls back down the chain).
//
// Usage: npx tsx --env-file=.env.local scripts/gen-personas.mts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import OpenAI from "openai";
import { jsonSchemaFor, parseJsonAs } from "../src/lib/json";
import { deepNoDashes } from "../src/lib/text";
import { PERSONA_SYSTEM, PersonaSchema, personaPrompt } from "../src/lib/persona-prompt";

const OUT = "data/personas.json";
const MODELS = (process.env.OPENAI_MODELS ?? "gpt-6-luna,gpt-5-nano").split(",").map((m) => m.trim());
const WORKERS = Number(process.env.WORKERS ?? 8);

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set (use --env-file=.env.local)");
const client = new OpenAI({ timeout: 60_000, maxRetries: 3 }); // the SDK backs off on 429 here: a batch can wait

type Chog = { tokenId: number; name: string; traits: Record<string, string> };
const chogs: Chog[] = JSON.parse(readFileSync("data/chogs.json", "utf8"));
const done: Record<string, unknown> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const schema = jsonSchemaFor(PersonaSchema);

async function generate(c: Chog) {
  for (const model of MODELS) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: PERSONA_SYSTEM },
          { role: "user", content: personaPrompt(c.name, c.traits) },
        ],
        max_completion_tokens: 3000,
        reasoning_effort: "low",
        response_format: { type: "json_schema", json_schema: { name: "persona", schema, strict: true } },
      });
      const out = parseJsonAs(PersonaSchema, res.choices[0]?.message.content ?? undefined);
      if (out) return deepNoDashes(out);
    } catch (err) {
      console.warn(`#${c.tokenId} ${model}:`, (err as Error).message?.slice(0, 160));
    }
  }
  return null;
}

const todo = chogs.filter((c) => !done[c.tokenId]);
console.log(`${todo.length} personas to write with ${MODELS[0]}, ${Object.keys(done).length} already done`);
let ok = 0, failed = 0;
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    for (let c; (c = todo.shift()); ) {
      const out = await generate(c);
      if (!out) { failed++; continue; }
      const { bio, ...persona } = out;
      done[c.tokenId] = { persona, bio };
      if (++ok % 25 === 0) {
        writeFileSync(OUT, JSON.stringify(done));
        console.log(`${Object.keys(done).length}/${chogs.length}`);
      }
    }
  }),
);
writeFileSync(OUT, JSON.stringify(done));
console.log(`wrote ${OUT}: ${Object.keys(done).length}/${chogs.length} (${failed} failed this run, rerun to retry)`);
