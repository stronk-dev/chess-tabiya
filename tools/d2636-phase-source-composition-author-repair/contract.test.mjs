import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/phase-source-composition.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  assert.notEqual(from, -1, `missing ${start}`);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

test("D2636 openingSources is admitted and the aggregate-key guard remains failable", () => {
  const point = section("interface PhaseSourcePoint {", "\n}\n```");
  const guard = section("#### 2.3 Forbidden aggregate fields", "### 3. Ordered arc");
  assert.match(point, /readonly openingSources:/u);
  assert.doesNotMatch(point, /readonly opening:/u);
  assert.doesNotMatch(guard, /`opening`,/u);
  assert.match(guard, /negative fixture adds every forbidden key one at a\s+time/su);
});

test("D2637 opening results are derived once from the retained occurrence", () => {
  const join = section("#### 2.1 Exact-position and opening-operation join", "#### 2.2 Recorded and live tablebase slots");
  assert.match(join, /Callers supply `OpeningCatalogueAvailability`, not\s+endpoint or membership payloads/su);
  assert.match(join, /openingIdentityAt\(availability, position\.payload\.fen, position\.payload\.ply\)/u);
  assert.match(join, /retaining the exact position item\s+and both returned payloads by reference/su);
  assert.match(join, /four-field catalogue key is not\s+relabeled as a full-FEN claim/su);
});

test("D2638 the arc invokes the sole recorded path operation from run and branch", () => {
  const arc = section("### 3. Ordered arc", "### 4. Endgame technique boundary");
  assert.match(arc, /compilePhaseArc\(run, branchId, sourceDependencies\)/u);
  assert.match(arc, /recordedSemanticPath\(run, branchId\)/u);
  assert.match(arc, /No overload accepts nodes, FENs, a path array, semantic events or evidence/u);
  assert.match(rfc, /rfc\/recorded-semantic-path\.md/u);
});

test("D2639 the live slot retains every provider result arm without local domain recomputation", () => {
  const tablebase = section("#### 2.2 Recorded and live tablebase slots", "#### 2.3 Forbidden aggregate fields");
  for (const arm of ["ProviderSuccess", "ProviderLocalDomainResult", "ProviderSourceFailure"]) {
    assert.match(tablebase, new RegExp(`\\b${arm}\\b`, "u"));
  }
  assert.match(tablebase, /composer does not compute tablebase domain/u);
  assert.match(tablebase, /neither provider failure nor a locally\s+recomputed field/su);
});

test("D2640 recorded absence comes only from a sealed digest-matched snapshot resolver", () => {
  const tablebase = section("#### 2.2 Recorded and live tablebase slots", "#### 2.3 Forbidden aggregate fields");
  assert.match(tablebase, /interface RecordedEvidenceSnapshotReceipt/u);
  for (const field of ["packId", "packDigest", "ledgerDigest", "tablebaseFens"]) {
    assert.match(tablebase, new RegExp(`readonly ${field}:`, "u"));
  }
  assert.match(tablebase, /`compileRecordedEvidenceSnapshot\(packRecord\)` is the sole private snapshot constructor/u);
  assert.match(tablebase, /resolveRecordedTablebase\(position,\s+snapshot\)/su);
  assert.match(tablebase, /caller digest, map, item or Boolean is not an\s+accepted input/su);
});

test("D2641 the private view has four server consumers and inspector stays presentation-owned", () => {
  const handoff = section("### 5. Production handoffs", "### 6. Availability and failure behavior");
  assert.match(handoff, /Total: \*\*4\*\*/u);
  assert.match(handoff, /advanced inspector is deliberately \*\*not\*\* a fifth handoff/u);
  assert.match(handoff, /No\s+phase-source object, source-result union or private brand is serialized/su);
  assert.match(handoff, /module-registration.*evidence-presentation/su);
});

test("D2642 applicability uses independent declared controls and demotes the circular counter", () => {
  const criteria = section("## Acceptance criteria", "## Discharges");
  assert.match(criteria, /historic applicability counter\s+is reach telemetry only/su);
  assert.match(criteria, /independently supplied declared phase\/endgame results/su);
  assert.match(criteria, /No control compares `classifyPhase` to a reader that calls\s+`classifyPhase` internally/su);
});
