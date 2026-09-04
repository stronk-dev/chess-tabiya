import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packetRfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const valueRfc = readFileSync("rfc/evidence-value-authority.md", "utf8");

test("D2625 the prerequisite deletes the adapter file the later RFC claims", () => {
  assert.match(valueRfc, /`evidence-source-adapters\.ts` is deleted/u);
  assert.match(valueRfc, /`packages\/runtime\/src\/evidence-factories\.ts` is the sole non-test production module/u);
  assert.match(packetRfc, /\| 1b \| `packages\/runtime\/src\/evidence-source-adapters\.ts`/u);
  assert.match(packetRfc, /Depends on:[\s\S]*draft `rfc\/evidence-value-authority\.md`/u);
});

function idFor(fen, scope) {
  return `${fen}:${scope}`;
}

function compile(fen, scope, collector) {
  return Object.freeze({
    id: idFor(fen, scope),
    scope,
    events: Object.freeze(collector(Object.freeze({ beforeFen: fen, scope }))),
  });
}

function projectWideToEvents(packet) {
  return Object.freeze({ id: idFor(packet.beforeFen ?? "root", "events"), scope: "events", events: packet.events });
}

test("D2626 scope-aware collectors permit two factual values under one target id", () => {
  assert.match(packetRfc, /readonly scope: CandidatePacketScope;/u);
  const collector = ({ scope }) => [scope === "events_and_readings" ? "wide fact" : "events fact"];
  const direct = compile("root", "events", collector);
  const wide = Object.freeze({ ...compile("root", "events_and_readings", collector), beforeFen: "root" });
  const projected = projectWideToEvents(wide);
  assert.equal(direct.id, projected.id);
  assert.notDeepEqual(direct.events, projected.events);
});

function visibleWeight(packet) {
  return packet.candidates.reduce(
    (sum, row) => sum + row.events.length + 5 * row.readings.length,
    0,
  );
}

test("D2627 the declared cache weight omits retained receipt categories", () => {
  assert.match(packetRfc, /packetWeight = eventCount \+ 5 × readingCount/u);
  assert.match(packetRfc, /executionOutcomes: readonly SealedCandidateCollectorOutcome\[\]/u);
  assert.match(packetRfc, /readonly legalMoves: readonly ExactLegalMove\[\]/u);
  const quietPacket = Object.freeze({
    candidates: Object.freeze([
      Object.freeze({ events: Object.freeze([]), readings: Object.freeze([]) }),
    ]),
  });
  const smallReceipt = Object.freeze({ packet: quietPacket, legalMoves: Object.freeze(["a2a3"]), executionOutcomes: Object.freeze([]) });
  const largeReceipt = Object.freeze({ packet: quietPacket, legalMoves: Object.freeze(Array.from({ length: 80 }, (_, index) => `move-${index}`)), executionOutcomes: Object.freeze(Array.from({ length: 5_000 }, (_, index) => Object.freeze({ index }))) });
  assert.equal(visibleWeight(smallReceipt.packet), 0);
  assert.equal(visibleWeight(largeReceipt.packet), 0);
  assert.ok(JSON.stringify(largeReceipt).length > JSON.stringify(smallReceipt).length * 100);
});
