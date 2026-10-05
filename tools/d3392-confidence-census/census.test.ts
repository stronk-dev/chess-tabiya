/** Disposable research controls over the actual production image; never a green implementation claim. */
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { confidenceCensus } from "./census.js";

describe("D3391/D3392 production confidence contract census", () => {
  it("finds the complete local correction chain and the incompatible citation members", () => {
    const before = JSON.stringify(PRIMARY_EVIDENCE_MANIFEST);
    const report = confidenceCensus(PRIMARY_EVIDENCE_MANIFEST);
    expect(report.corrections).toEqual([
      "bounded_return", "immediate", "named_material_target",
    ].map(id => ({ projection: `derived.bounded_target.${id}@1`, declared: "exact", required: "not_applicable" })));
    expect(report.conflicts.map(row => row.projection)).toEqual(["derived.citation.attribution@1"]);
    const citation = report.conflicts[0]!;
    expect(citation.members.filter(member => member.required === "not_applicable").map(member => member.inputs)).toEqual([
      ["run.record.evidence_ref_resolution@1", "live.syzygy.result@1"],
    ]);
    expect(citation.members.filter(member => member.required === "reported").map(member => member.inputs)).toEqual([
      "live.stockfish.eval@1", "live.stockfish.wdl@1", "live.stockfish.pv@1", "human.maia.event@1",
    ].map(source => ["run.record.evidence_ref_resolution@1", source]));
    expect(JSON.stringify(PRIMARY_EVIDENCE_MANIFEST)).toBe(before);
  });
});
