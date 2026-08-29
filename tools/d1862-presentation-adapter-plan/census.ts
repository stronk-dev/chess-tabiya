// Disposable authoring instrument for D1862. It derives the exact visual binding population.
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";

const machineOnly = (forms: readonly string[]): boolean => forms.every((form) => form === "machine_condition");
const projectionByKey = new Map(
  PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]),
);
const rows = [...new Map(PRIMARY_EVIDENCE_MANIFEST.bindings
  .filter((binding) => !machineOnly(binding.forms))
  .map((binding) => {
    const projectionKey = `${binding.projection.id}@${binding.projection.version}`;
    const consumerKey = `${binding.consumer.id}@${binding.consumer.version}`;
    const projection = projectionByKey.get(projectionKey);
    if (projection === undefined) throw new TypeError(`Missing projection ${projectionKey}`);
    const key = `${consumerKey}\0${projectionKey}`;
    return [key, {
      consumer: consumerKey,
      projection: projectionKey,
      payloadType: projection.payloadType,
      operands: projection.operands,
      forms: binding.forms,
      grounding: projection.grounding,
      disposition: projection.disposition?.kind ?? "bound",
    }] as const;
  })).values()]
  .sort((left, right) => left.consumer.localeCompare(right.consumer) || left.projection.localeCompare(right.projection));

process.stdout.write(`presentation-binding-census: ${rows.length} pairs / ${new Set(rows.map((row) => row.consumer)).size} consumers\n`);
for (const row of rows) {
  process.stdout.write(`${row.consumer}\t${row.projection}\t${row.payloadType}\t${row.forms.join(",")}\t${row.operands.join(",")}\n`);
}
