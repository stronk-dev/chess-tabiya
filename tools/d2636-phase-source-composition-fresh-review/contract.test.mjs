import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/phase-source-composition.md");
const opening = read("apps/server/src/opening-catalogue.ts");
const pathRfc = read("rfc/recorded-semantic-path.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const prototype = read("tools/d2485-phase-source-composition/compose.ts");
const endgame = read("packages/runtime/src/endgame.ts");

function block(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker ${end}`);
  return source.slice(from, to);
}

test("D2636 the required opening namespace is rejected by the forbidden root-name guard", () => {
  const point = block(rfc, "interface PhaseSourcePoint {", "\n}\n```");
  const forbidden = block(rfc, "#### 2.3 Forbidden aggregate fields", "### 3. Ordered arc");
  assert.match(point, /readonly opening:/u);
  assert.match(forbidden, /no top-level `phase`, `stage`, `inBook`, `opening`,/u);
  assert.match(forbidden, /property-name guard/u);
});

test("D2637 opening results cannot prove the promised full-six-field FEN join", () => {
  const endpoint = block(opening, "export type CurrentOpeningEndpoint =", "\n\nexport type OpeningCatalogueMembership");
  const membership = block(opening, "export type OpeningCatalogueMembership =", "\n\nexport interface RecordedPosition");
  assert.match(endpoint, /positionKey: string/u);
  assert.match(membership, /positionKey: string/u);
  assert.doesNotMatch(endpoint, /readonly fen:/u);
  assert.doesNotMatch(membership, /readonly fen:/u);
  assert.match(opening, /transposeKey\(fen\)/u);
  assert.match(rfc, /canonicalizes its full six-field FEN once and\s+requires every position-bound successful input and receipt to bind that same FEN/su);
});

test("D2638 arc input bypasses the sole recorded path authority", () => {
  assert.match(rfc, /`compilePhaseArc\(path, inputs\)` accepts one explicit root-to-leaf run path/u);
  assert.match(pathRfc, /caller supplies only `run` and `branchId`/u);
  assert.match(pathRfc, /`branchPath\(run, branchId\)` is the sole path authority/u);
  const dependency = rfc.split("\n").find((line) => line.startsWith("- **Depends on:**")) ?? "";
  assert.doesNotMatch(dependency, /recorded-semantic-path/u);
  assert.doesNotMatch(rfc, /RecordedSemanticPathResult/u);
});

test("D2639 outside-domain tablebase truth does not fit the declared live slot", () => {
  const slots = block(rfc, "type TablebaseRecordedSlot =", "\n```\n\n`domain`");
  assert.match(slots, /kind: "not_requested"/u);
  assert.match(slots, /kind: "available"/u);
  assert.match(slots, /kind: "unavailable"/u);
  assert.doesNotMatch(slots, /local_domain_result|outside_domain/u);
  assert.match(provider, /type ProviderLocalDomainResult</u);
  assert.match(provider, /`rules\.endgame\.tablebase_domain@1` is the separate local\/sync exact fact/u);
  assert.match(rfc, /`domain` is locally computed/u);
});

test("D2640 recorded tablebase absence is a caller digest without a snapshot authority", () => {
  const recorded = block(rfc, "type TablebaseRecordedSlot =", "\n\ntype TablebaseLiveSlot");
  assert.match(recorded, /kind: "not_recorded"; readonly snapshotDigest: string/u);
  assert.doesNotMatch(recorded, /receipt|snapshotId|sourceRevision|fen|nodeId/u);
  assert.doesNotMatch(rfc, /assertRecordedTablebaseSnapshot|RecordedTablebaseSnapshotReceipt/u);
});

test("D2641 the mandatory web inspector handoff has no declared projection boundary", () => {
  assert.match(rfc, /server-package internal/u);
  assert.match(rfc, /If the view is later persisted,\s+serialized to the web client or exported across a package boundary/su);
  const handoff = block(rfc, "### 5. Production handoffs", "### 6. Availability and failure behavior");
  assert.match(handoff, /advanced inspector/u);
  assert.match(handoff, /Total: \*\*5\*\*/u);
  const dependency = rfc.split("\n").find((line) => line.startsWith("- **Depends on:**")) ?? "";
  assert.doesNotMatch(dependency, /evidence-presentation/u);
  assert.doesNotMatch(rfc, /PhaseSource(?:Inspector|Wire|Projection|Receipt)/u);
});

test("D2642 the endgame applicability corpus invariant is green by construction", () => {
  assert.match(prototype, /const phase = classifyPhase\(canonical\)/u);
  assert.match(prototype, /const endgame = endgameReading\(canonical\)/u);
  assert.match(prototype, /\(phase\.phase === "endgame"\) !== \(endgame !== null\)/u);
  assert.match(endgame, /if \(classifyPhase\(fen\)\.phase !== "endgame"\) return null/u);
});
