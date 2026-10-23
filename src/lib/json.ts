import { z } from "zod";

// Models wrap JSON in code fences or add a sentence around it. Take the outermost object
// and validate it; anything that doesn't match the schema counts as no answer.
export function parseJsonAs<T extends z.ZodType>(schema: T, text: string | undefined): z.infer<T> | null {
  if (!text) return null;
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(text.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Strict structured outputs need a closed object and no $schema key.
export function jsonSchemaFor(schema: z.ZodType) {
  const out = { ...z.toJSONSchema(schema), additionalProperties: false } as Record<string, unknown>;
  delete out.$schema;
  return out;
}
