// Materialize only the closed kind/ref fields; keep unrelated schema bytes and formatting intact.
import { readFileSync, writeFileSync } from "node:fs";
import { materializeStructuralConventionSchema } from "./structural-convention-materializer.ts";

const args = process.argv.slice(2);
if (args.some(arg => arg !== "--write") || args.length > 1) throw new TypeError("Use structural-convention-schemas.mjs [--write]");
const write = args.includes("--write"), failures = [];
for (const path of ["schemas/drill_pack.schema.json", "schemas/shape_entry.schema.json"]) {
  const original = readFileSync(path, "utf8");
  const rendered = materializeStructuralConventionSchema(original);
  if (rendered !== original) {
    if (write) writeFileSync(path, rendered);
    else failures.push(path);
  }
}
if (failures.length) throw new Error(`Structural kind/ref schemas disagree with the shared table: ${failures.join(", ")}; run make structural-convention-schemas-update`);
console.log(`structural-convention-schemas: ${write ? "updated" : "checked"} both schema copies`);
