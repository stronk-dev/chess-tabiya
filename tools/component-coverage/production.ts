// The production input of `make component-coverage`: the compiled manifest, the sealed adapter
// registry and the production consumer classification. Nothing here is hand-listed.
import { readFileSync } from "node:fs";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { PRESENTATION_ADAPTERS, PRESENTATION_SELECTION_ONLY } from "../../packages/runtime/src/presentation-contract.js";
import { PRESENTATION_CONSUMER_CLASSES, presentationConsumerClass } from "../../packages/runtime/src/presentation-consumer-adapters.js";
import type { CoverageInput } from "./coverage.js";

const refKey = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;

export function productionCoverageInput(): CoverageInput {
  return {
    bindings: PRIMARY_EVIDENCE_MANIFEST.bindings.map((binding) => ({ consumer: refKey(binding.consumer), projection: refKey(binding.projection), forms: [...binding.forms] })),
    adapters: PRESENTATION_ADAPTERS.map((adapter) => ({
      consumer: refKey(adapter.consumer), projection: refKey(adapter.projection), component: adapter.component,
      ...(adapter.composition === undefined ? {} : { composition: adapter.composition }),
      forms: adapter.forms, sourceOperands: adapter.sourceOperands, assertions: adapter.assertions,
    })),
    operands: new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [refKey(projection), [...(projection.operands ?? [])]])),
    classOf: presentationConsumerClass,
    selectionOnly: PRESENTATION_SELECTION_ONLY,
  };
}

/** §2.3: every class row's anchor file exists and names its operation symbol. */
export function unresolvedClassAnchors(root: string): readonly string[] {
  return PRESENTATION_CONSUMER_CLASSES.flatMap((row) => {
    let source: string;
    try { source = readFileSync(`${root}/${row.reachabilityAnchor}`, "utf8"); } catch { return [`${row.consumer}: anchor ${row.reachabilityAnchor} is unreadable`]; }
    return source.includes(row.operation) ? [] : [`${row.consumer}: anchor ${row.reachabilityAnchor} does not name ${row.operation}`];
  });
}
