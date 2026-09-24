import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let schemaDocument: Record<string, unknown> | undefined;

/** The one living drill-pack schema document — the only drill-pack schema the runtime reads. */
export function livingPackSchema(): Record<string, unknown> {
  if (schemaDocument !== undefined) return schemaDocument;
  const path = fileURLToPath(new URL("../../../schemas/drill_pack.schema.json", import.meta.url));
  schemaDocument = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  return schemaDocument;
}
