// DISPOSABLE research harness — D1900-D1903/D1943-D1947. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type Scope = "events" | "readings" | "events_and_readings";
type Input = Readonly<{ id: string }>;
type Receipt = Readonly<{ packetId: string; scope: Scope; inputs: readonly Input[] }>;

const RECEIPTS = new WeakSet<object>();

function receipt(packetId: string, scope: Scope, inputs: readonly Input[]): Receipt {
  const value = Object.freeze({ packetId, scope, inputs: Object.freeze([...inputs]) });
  RECEIPTS.add(value);
  return value;
}

function assertReceipt(value: Receipt, expectedInputs: readonly Input[]): void {
  assert.equal(RECEIPTS.has(value), true, "receipt must come from the packet compiler");
  assert.equal(value.inputs.length, expectedInputs.length);
  value.inputs.forEach((input, index) => assert.strictEqual(input, expectedInputs[index]));
}

test("D1900 caches a neutral factual receipt with no consumer authority", () => {
  const cached = receipt("packet-a", "events_and_readings", [{ id: "legal" }, { id: "event" }]);
  assert.equal("consumer" in cached, false);
  assert.equal("view" in cached, false);
  assert.doesNotThrow(() => assertReceipt(cached, cached.inputs));
});

test("D1901 runtime scope truth is a compiler receipt, not a declaration-graph claim", () => {
  const legal = Object.freeze({ id: "legal" });
  const event = Object.freeze({ id: "event" });
  const value = receipt("packet-b", "events", [legal, event]);
  assert.doesNotThrow(() => assertReceipt(value, [legal, event]));

  const equalRebuild = Object.freeze({ id: "event" });
  assert.throws(() => assertReceipt(value, [legal, equalRebuild]));
  assert.throws(() => assertReceipt(Object.freeze({ ...value }), [legal, event]));
  assert.throws(() => assertReceipt(value, [legal]));
});

test("D1902 first landing names the real semantic path and does not invent a bot", () => {
  const catalogue = readFileSync(new URL("../../apps/server/src/bot-policy-catalog.ts", import.meta.url), "utf8");
  assert.match(catalogue, /BOT_POLICY_PROFILES\s*=\s*compileBotPolicyCatalog\(\[\]\)/u);

  const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
  assert.match(rfc, /first landing has one real semantic/u);
  assert.match(rfc, /does not inject a packet operation into\s+`OpponentSelector`/u);
});

type RootScore =
  | Readonly<{ kind: "centipawns"; value: number }>
  | Readonly<{ kind: "mate"; outcome: "root_mates" | "root_is_mated"; distance: number; unit: "moves" }>;

type RootTable = Readonly<{
  requestFen: string;
  scoreFrame: "root_side_to_move";
  rows: readonly Readonly<{ moveUci: string; score: RootScore }>[];
}>;

function join(packet: Readonly<{ beforeFen: string; legalMoves: readonly string[] }>, table: RootTable): readonly RootScore[] {
  assert.equal(table.requestFen, packet.beforeFen);
  assert.deepEqual([...table.rows.map((row) => row.moveUci)].sort(), [...packet.legalMoves].sort());
  return packet.legalMoves.map((move) => table.rows.find((row) => row.moveUci === move)!.score);
}

test("D1903/D1943 use one complete root-side table, not N child evaluations", () => {
  const packet = Object.freeze({ beforeFen: "root", legalMoves: Object.freeze(["a", "b"]) });
  const table: RootTable = Object.freeze({
    requestFen: "root",
    scoreFrame: "root_side_to_move",
    rows: Object.freeze([
      Object.freeze({ moveUci: "a", score: Object.freeze({ kind: "centipawns", value: -25 }) }),
      Object.freeze({ moveUci: "b", score: Object.freeze({ kind: "mate", outcome: "root_mates", distance: 3, unit: "moves" }) }),
    ]),
  });
  assert.deepEqual(join(packet, table), [
    { kind: "centipawns", value: -25 },
    { kind: "mate", outcome: "root_mates", distance: 3, unit: "moves" },
  ]);
  assert.throws(() => join(packet, { ...table, rows: table.rows.slice(0, 1) }));
  assert.throws(() => join(packet, { ...table, requestFen: "child-a" }));
});

test("D1944 provider evidence retains delivery and acquisition around the table", () => {
  const acquisition = Object.freeze({ generation: 4, requestDigest: "r", responseDigest: "s" });
  const delivery = Object.freeze({ kind: "retained_exact", cacheIdentity: "cache-a", acquisition, payload: { scoreFrame: "root_side_to_move" } });
  assert.strictEqual(delivery.acquisition, acquisition);
  assert.equal(delivery.payload.scoreFrame, "root_side_to_move");
  assert.notDeepEqual(delivery.payload, delivery);
});

test("D1945 removes future-only packet bindings instead of pretending they are complete", () => {
  const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
  assert.match(rfc, /No\s+aggregate projection, adapter, binding,/u);
  assert.doesNotMatch(rfc, /interface CandidatePopulationAdmission/u);
});

test("D1946 refuses a possible-vocabulary list as one value's derivation conjunction", () => {
  const possibleVocabulary = Object.freeze(["legal", "quiet", "capture", "promotion", "checkmate"]);
  const quietRootInputs = Object.freeze(["legal", "quiet"]);
  assert.equal(possibleVocabulary.every((input) => quietRootInputs.includes(input)), false);

  const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
  assert.match(rfc, /packet is \*\*not an\s+F1 projection\*\*/u);
  assert.match(rfc, /code-derived registry and migration guard, never a claim/u);
});

test("D1947 composes the first landing at the actual semantic executable, not the application", () => {
  const application = readFileSync(new URL("../../apps/server/src/application.ts", import.meta.url), "utf8");
  const semanticCheck = readFileSync(new URL("../../apps/server/src/semantic-evidence-check.ts", import.meta.url), "utf8");
  const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
  assert.doesNotMatch(application, /selectLocalSemanticEvidence|SemanticSelectionOperation/u);
  assert.match(semanticCheck, /selectLocalSemanticEvidence/u);
  assert.match(rfc, /`createApplication` remains unchanged/u);
  assert.match(rfc, /`semantic-evidence-check\.ts` constructs one packet service/u);
});
