// Pure shared byte convention; no catalogue, renderer, query or value-factory imports.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { evidenceDigest } from "./evidence-contract.js";

/** Omits absent optional properties so they have no wire image; everything else is kept. */
export function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) if (entry !== undefined) result[key] = withoutUndefined(entry);
    return result;
  }
  return value;
}
/** `sha256:<hex>` over `<domain>\n<canonical JSON>`; invalid JSON numbers/strings refuse. */
export function presentationDigest(domain: string, value: unknown): string {
  return `sha256:${evidenceDigest(`${domain}\n${canonicalizeJson(withoutUndefined(value))}`)}`;
}
