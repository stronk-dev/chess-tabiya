// DISPOSABLE RFC authoring harness — D1958-D1961. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type Scope = "events" | "readings" | "events_and_readings";
type Input = Readonly<{ id: string }>;
type Packet = Readonly<{ packetId: string; scope: Scope; inputs: readonly Input[] }>;
type Receipt = Readonly<{ packet: Packet }>;
type References = Readonly<{ packet: Packet; inputs: readonly Input[] }>;

const RECEIPTS = new WeakMap<Receipt, References>();

function compileReceipt(packetId: string, scope: Scope, inputs: readonly Input[]): Receipt {
  const retained = Object.freeze([...inputs]);
  const packet = Object.freeze({ packetId, scope, inputs: retained });
  const value = Object.freeze({ packet });
  RECEIPTS.set(value, Object.freeze({ packet, inputs: retained }));
  return value;
}

function assertReceipt(value: unknown): asserts value is Receipt {
  if (typeof value !== "object" || value === null) throw new TypeError("unrecognized candidate receipt");
  const receipt = value as Receipt;
  const expected = RECEIPTS.get(receipt);
  if (expected === undefined || receipt.packet !== expected.packet || receipt.packet.inputs !== expected.inputs) {
    throw new TypeError("unrecognized or mutated candidate receipt");
  }
  receipt.packet.inputs.forEach((input, index) => assert.strictEqual(input, expected.inputs[index]));
}

function projectReceipt(value: Receipt, scope: Exclude<Scope, "events_and_readings">): Receipt {
  assertReceipt(value);
  if (value.packet.scope !== "events_and_readings") throw new TypeError("only a wide receipt projects");
  return compileReceipt(`${value.packet.packetId}:${scope}`, scope, value.packet.inputs);
}

test("D1959 runtime authority rejects a forge/equal rebuild and mints a recognized narrow receipt", () => {
  const inputs = Object.freeze([Object.freeze({ id: "legal" }), Object.freeze({ id: "event" })]);
  const wide = compileReceipt("wide", "events_and_readings", inputs);
  assert.doesNotThrow(() => assertReceipt(wide));
  assert.throws(() => assertReceipt(Object.freeze({ packet: wide.packet })));
  assert.throws(() => assertReceipt(Object.freeze({ packet: Object.freeze({ ...wide.packet }) })));

  const narrow = projectReceipt(wide, "events");
  assert.doesNotThrow(() => assertReceipt(narrow));
  assert.notStrictEqual(narrow, wide);
  assert.notStrictEqual(narrow.packet, wide.packet);
  assert.strictEqual(narrow.packet.inputs[0], wide.packet.inputs[0]);
  assert.strictEqual(narrow.packet.inputs[1], wide.packet.inputs[1]);
});

async function compileCooperatively(
  signal: AbortSignal,
  yieldControl: () => Promise<void>,
): Promise<"completed" | "cancelled"> {
  for (let group = 0; group < 3; group += 1) {
    if (signal.aborted) return "cancelled";
    // A collector group is synchronous; the compiler yields between every group.
    await yieldControl();
    if (signal.aborted) return "cancelled";
  }
  return "completed";
}

test("D1960 cancellation raised after work begins stops before the second collector group", async () => {
  const controller = new AbortController();
  let yields = 0;
  const result = await compileCooperatively(controller.signal, async () => {
    yields += 1;
    controller.abort();
  });
  assert.equal(result, "cancelled");
  assert.equal(yields, 1);
});

test("D1958 and D1961 are literal in the amended RFC", () => {
  const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
  assert.match(rfc, /zero product consumers/u);
  assert.match(rfc, /moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION/u);
  assert.match(rfc, /compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION/u);
  assert.match(rfc, /CANDIDATE_PACKET_ABSTENTION_REASONS/u);
  assert.match(rfc, /CANDIDATE_POPULATION_RECEIPTS = new WeakMap/u);
  assert.match(rfc, /function assertCandidatePopulationReceipt/u);
  assert.match(rfc, /function projectCandidatePopulationReceipt/u);
  assert.match(rfc, /awaits an injected `yieldControl\(\): Promise<void>`/u);
});
