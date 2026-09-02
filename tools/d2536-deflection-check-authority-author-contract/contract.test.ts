import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { selectDeflectionDerivationArm, type RecordedEdgeIdentity } from "./model.js";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
const source = readFileSync("packages/runtime/src/semantic-evidence.ts", "utf8");
const edge: RecordedEdgeIdentity = Object.freeze({ beforeFen: "before", moveUci: "a1a8", afterFen: "after" });
const check = Object.freeze({ projection: "rules.tactic.event.check@1" as const, anchor: edge });

describe("D2536 deflection check authority author contract", () => {
  it("reproduces the current manifest and emitter gap at HEAD", () => {
    const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((row) => row.id === "derived.tactic.deflection_observed")!;
    expect(projection.derivation).toEqual({ inputs: [
      { id: "run.record.move", version: 1 },
      { id: "rules.tactic.reading.defender_duty_set", version: 1 },
      { id: "rules.transition.event.capture", version: 1 },
      { id: "rules.exchange.predicate.legal_exchange", version: 1 },
    ] });
    const signature = source.slice(source.indexOf("export function deflectionObservedSemanticEvent"), source.indexOf("export function attractionObservedSemanticEvent"));
    expect(signature).not.toMatch(/checkEvidence/u);
  });

  it("selects one deterministic alternative and refuses unnecessary authority", () => {
    expect(selectDeflectionDerivationArm({ baitCaptureMatched: true, firstEdgeIsCheck: true, firstEdge: edge })).toMatchObject({ kind: "bait_capture" });
    expect(() => selectDeflectionDerivationArm({ baitCaptureMatched: true, firstEdgeIsCheck: true, firstEdge: edge, checkEvent: check })).toThrow(/unnecessary check/u);
    expect(selectDeflectionDerivationArm({ baitCaptureMatched: false, firstEdgeIsCheck: true, firstEdge: edge, checkEvent: check })).toMatchObject({
      kind: "check_induced",
      inputs: expect.arrayContaining(["rules.tactic.event.check@1"]),
    });
  });

  it("refuses absent and crossed check evidence on the check-induced arm", () => {
    expect(() => selectDeflectionDerivationArm({ baitCaptureMatched: false, firstEdgeIsCheck: true, firstEdge: edge })).toThrow(/requires sealed check/u);
    expect(() => selectDeflectionDerivationArm({ baitCaptureMatched: false, firstEdgeIsCheck: true, firstEdge: edge, checkEvent: { ...check, anchor: { ...edge, moveUci: "h1h8" } } })).toThrow(/crossed check/u);
    expect(() => selectDeflectionDerivationArm({ baitCaptureMatched: false, firstEdgeIsCheck: false, firstEdge: edge })).toThrow(/no validated induction/u);
  });

  it("pins the exact amendment, call sites, and permanent negatives", () => {
    expect(rfc).toMatch(/Deflection check-authority amendment — D2536/u);
    expect(rfc).toMatch(/derivation: \{ anyOf:/u);
    expect(rfc).toMatch(/deflectionObservedSemanticEvent\([\s\S]*checkEvent\?: SemanticEvidenceEvent/u);
    for (const site of ["semantic-tactic-sequences.test.ts", "d1930-recorded-path-cost-harness", "d1931-recorded-path-source-harness"]) expect(rfc).toContain(site);
    for (const negative of ["missing-check", "crossed-edge-check", "unnecessary-check"]) expect(rfc).toContain(negative);
  });
});
