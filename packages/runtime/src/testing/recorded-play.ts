// Test assertions only. Provider deliveries may append evidence, never rewrite played nodes.
import assert from "node:assert/strict";
import type { DrillRun, Node } from "../types.js";

export function assertRecordedNodesPreserved(before: readonly Node[], after: readonly Node[]): void {
  assert.equal(after.length, before.length, "recorded node count changed");
  for (const [index, previous] of before.entries()) {
    const { evidenceRefs: oldRefs, ...oldPlay } = previous;
    const { evidenceRefs: newRefs, ...newPlay } = after[index]!;
    assert.deepEqual(newPlay, oldPlay, "recorded play changed");
    assert.deepEqual(newRefs.slice(0, oldRefs.length), oldRefs, "recorded evidence was removed or replaced");
    assert.equal(new Set(newRefs).size, newRefs.length, "duplicate evidence reference");
  }
}

export function assertOnlyEvidenceAppended(before: DrillRun["events"], after: DrillRun["events"]): void {
  assert.deepEqual(after.slice(0, before.length), before, "recorded event prefix changed");
  for (const event of after.slice(before.length)) {
    assert.equal(event.type, "evidence.attached", "a play event was appended by a read-only action");
  }
}
