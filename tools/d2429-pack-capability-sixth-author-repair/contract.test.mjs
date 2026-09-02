// DISPOSABLE sixth author contract. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const rest = read("apps/server/src/rest.ts");
const session = read("packages/runtime/src/session.ts");

const operationType = rfc.slice(
  rfc.indexOf("type CapabilityOperationId ="),
  rfc.indexOf("type CreateSessionCapabilitySource ="),
);
const operationTable = rfc.slice(
  rfc.indexOf("| method + route | body branch | operation id | capability source |"),
  rfc.indexOf("The table has 32 route rows"),
);

const expectedOperations = [
  "pack.register",
  "run.create.pack", "run.create.position", "run.create.imported",
  "opponent.select",
  "run.group_reply", "run.branch_decidedness", "run.analysis", "run.simulate",
  "run.prediction", "run.voice", "run.speech", "run.reasoning_review",
  "run.marks.replace", "run.marks.rescope", "run.deletion_preview", "run.delete",
  "run.distill", "run.share", "run.flip", "run.lease", "run.reveal", "run.duplicate",
  "run.schedule", "run.grant", "run.revoke", "run.group", "run.move.user",
  "run.move.opponent_received", "run.rewind", "run.fork", "run.compare",
  "run.simulate_enter", "run.reasoning.record", "run.evidence.apply",
].sort();

test("D2429: creation has three non-interchangeable source arms", () => {
  assert.match(operationType, /"run\.create\.pack" \| "run\.create\.position" \| "run\.create\.imported"/u);
  assert.match(rfc, /type CreateSessionCapabilitySource =/u);
  for (const kind of ["pack", "position", "imported"]) {
    assert.match(session, new RegExp(`readonly kind: "${kind}"`, "u"));
    assert.match(operationTable, new RegExp(`run\\.create\\.${kind}`.replace("\\.imported", "\\.imported"), "u"));
  }
  assert.match(rfc, /A mode with no requirement yields an explicit empty derived set/u);
  assert.match(rfc, /position\/imported source[\s\S]{0,180}cannot select `registered_pack`/u);
  assert.match(rest, /kind === "position"[\s\S]*?kind: "position" as const/u);
  assert.match(rest, /url\.pathname === "\/runs\/import"/u);
});

test("D2430: one operation vocabulary covers every exact branch", () => {
  const declared = [...operationType.matchAll(/"([a-z][a-z0-9_.]+)"/gu)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(declared, expectedOperations);

  const tableOperations = new Set(
    [...operationTable.matchAll(/`([a-z][a-z0-9_.]+)`/gu)]
      .map((match) => match[1])
      .filter((value) => expectedOperations.includes(value)),
  );
  assert.deepEqual([...tableOperations].sort(), expectedOperations);
  assert.match(rfc, /`CAPABILITY_ROUTE_BRANCHES` is one literal typed table and the sole authority/u);
  assert.match(rfc, /checked generator emits[\s\S]{0,140}`CapabilityOperationId` and `CAPABILITY_OPERATION_BINDINGS`/u);
  assert.match(rfc, /The table has 32 route rows and 35 operation branches/u);

  assert.match(rest, /route\.action === "moves"[\s\S]*?value\.selection[\s\S]*?service\.opponentPly[\s\S]*?service\.move/u);
  assert.match(rest, /request\.method === "PUT" && route\.action === "marks"[\s\S]*?rescopeFrom[\s\S]*?rescopeMarks[\s\S]*?replaceMarks/u);
  assert.match(rest, /route\.action === "grants"[\s\S]*?op !== "grant" && op !== "revoke"/u);
  assert.doesNotMatch(rfc, /Every other current mutating run action is mechanically set-equal to an explicit no-provider set/u);
});

test("D2431: the public wire carries the safe fact required by transient validation", () => {
  const publicBlock = rfc.match(/export type PublicCapabilitySemanticDispositionV1 =[\s\S]*?export interface PackCapabilitiesPublicProjectionV1 \{[\s\S]*?\n\}/u)?.[0] ?? "";
  assert.match(publicBlock, /readonly availability: "local" \| "recorded" \| "provider" \| "build_time"/u);
  assert.doesNotMatch(publicBlock, /providerId|endpoint|token|healthDiagnostic/u);
  assert.match(rfc, /`reachability\.kind === "temporarily_unavailable"` requires\s+`availability === "provider"`/u);

  const validate = ({ availability, reachability }) =>
    reachability.kind !== "temporarily_unavailable" || availability === "provider";
  assert.equal(validate({ availability: "provider", reachability: { kind: "temporarily_unavailable" } }), true);
  for (const availability of ["local", "recorded", "build_time"]) {
    assert.equal(validate({ availability, reachability: { kind: "temporarily_unavailable" } }), false);
    assert.equal(validate({ availability, reachability: { kind: "supported" } }), true);
  }
});
