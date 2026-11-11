// DISPOSABLE complete actual-source equality; CLI-free, no producer or authority issuer.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { readCandidateFoundationSources } from "../../packages/runtime/src/candidate-population.js";
import { evidenceValueReceipt, isDeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { assertRepeatedSources, assertWide, collect, LITERAL_POSITIONS, reviewPositions } from "./workload.js";
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const workload = (smoke: boolean) => smoke ? LITERAL_POSITIONS.slice(0, 2) : reviewPositions();

export function completeEquality(smoke: boolean) {
  const service = new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity });
  return workload(smoke).map(position => {
    const lookup = service.wide(position.fen); assert.equal(lookup.kind, "ready");
    if (lookup.kind !== "ready") throw Error("Actual complete source required");
    assertWide(lookup.receipt); assert(position.move !== null);
    const before = collect(lookup.receipt, position.move), again = collect(lookup.receipt, position.move);
    assertRepeatedSources(before.events, again.events);
    assert.deepEqual(again.events.map(event => evidenceValueReceipt(event.evidence)), before.events.map(event => evidenceValueReceipt(event.evidence)));
    const familySummary = (families: typeof before.families) => families.map(({ family, kind, events }) => ({ family, kind, events }));
    assert.deepEqual(familySummary(again.families), familySummary(before.families));
    const graph = { packet: lookup.receipt.packet, foundation: readCandidateFoundationSources(lookup.receipt), outcomes: before.events,
      availability: familySummary(before.families) };
    const seen = new Set<object>(), receipts: unknown[] = [];
    const visit = (value: unknown): void => {
      if (value === null || typeof value !== "object" || seen.has(value)) return;
      seen.add(value);
      if (isDeclaredEvidence(value)) receipts.push(evidenceValueReceipt(value));
      Object.values(value).forEach(visit);
    };
    visit(graph);
    return { id: position.id, digest: hash({ graph, receipts }), receipts: receipts.length, outcomes: before.events.length };
  });
}
