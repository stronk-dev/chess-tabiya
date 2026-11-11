// Test-only process-local lifetime control; the parent runs the actual service with explicit GC.
import assert from "node:assert/strict";
import { CandidatePopulationService, type CandidatePopulationEntry } from "../candidate-population-service.js";
import { readCandidateOutcomeSources, type CandidateFoundationReceipt } from "../../../../packages/runtime/src/candidate-population.js";

const A = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
const B = "7k/8/8/3p4/2P5/8/3P4/7K b - - 0 1";
function begin(service: CandidatePopulationService, fen: string): CandidatePopulationEntry {
  const result = service.begin(fen); assert.equal(result.kind, "started");
  if (result.kind !== "started") throw Error("Actual service entry required"); return result.entry;
}
function core(service: CandidatePopulationService, token: CandidatePopulationEntry): CandidateFoundationReceipt {
  for (let steps = 0; steps < 1000; steps++) {
    const result = service.advance(token, "foundation");
    if (result.kind === "ready") return result.receipt;
    assert.equal(result.kind, "pending");
  }
  throw Error("Finite core failed to complete");
}
function weakCore(service: CandidatePopulationService, token: CandidatePopulationEntry) { return new WeakRef(core(service, token)); }
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
async function gc() { await tick(); globalThis.gc!(); await tick(); globalThis.gc!(); }

assert.equal(typeof globalThis.gc, "function", "Actual lifecycle child must run with explicit GC");
const service = new CandidatePopulationService({ capacity: 1 });
const heldRetiredToken = begin(service, A), weak = weakCore(service, heldRetiredToken);
await gc(); assert(weak.deref() !== undefined, "The live service must retain its completed core");
const current = begin(service, B);
assert.equal(service.read(heldRetiredToken, "foundation").kind, "retired");
let collected = false;
for (let attempt = 0; attempt < 24; attempt++) {
  await gc();
  if (weak.deref() === undefined) { collected = true; break; }
}
assert(collected, "A strongly held retired token must not retain the evicted construction's core receipt");
assert.equal(service.read(heldRetiredToken, "foundation").kind, "retired"); // Keep the token alive through collection.
const heldCompletedFact = core(service, current), original = readCandidateOutcomeSources(heldCompletedFact);
begin(service, A); await gc();
assert.strictEqual(readCandidateOutcomeSources(heldCompletedFact), original, "Genuinely held completed facts remain valid after eviction");
process.stdout.write("Active owner retained; held retired token released core; held completed receipt stayed valid.\n");
