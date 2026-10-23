// House style: no em or en dashes anywhere a person reads. Models love them, so every
// model output passes through here. "great again—one sunset" → "great again, one sunset".
export function noDashes(s: string): string {
  return s
    .replace(/\s*[—–]\s*(?=[.,!?)]|$)/g, "") // a trailing dash before punctuation or the end: drop it
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2") // ranges: 3–5 → 3-5
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/^,\s*/, "");
}

export function deepNoDashes<T>(value: T): T {
  if (typeof value === "string") return noDashes(value) as T;
  if (Array.isArray(value)) return value.map(deepNoDashes) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepNoDashes(v)])) as T;
  return value;
}

const EMOJI = /\s*\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
export function noEmoji(s: string): string {
  return s.replace(EMOJI, "").trim();
}
export function deepNoEmoji<T>(value: T): T {
  if (typeof value === "string") return noEmoji(value) as T;
  if (Array.isArray(value)) return value.map(deepNoEmoji) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepNoEmoji(v)])) as T;
  return value;
}
