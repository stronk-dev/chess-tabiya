import { describe, expect, it } from "vitest";
import { STRUCTURAL_CONVENTION_REFS as REFS } from "@chess-tabiya/schema/drill-pack";
import { declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason);
  return result.value;
}
const position = (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
const opposition = (fen: string) => available(invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: position(fen) }));
const backward = (fen: string) => available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: position(fen) }));
function outposts(fen: string) {
  const root = position(fen), future = available(invokeEvidenceValueRoute("derived.square.reading.future_file_challenge@1", { position: root }));
  const control = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: root.payload.fen });
  return available(invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", { control, future }));
}
function reseal<T>(source: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const r = evidenceValueReceipt(source);
  return declareEvidence(source.producer, source.projection, source.payload, { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, ...(r.convention === undefined ? {} : { convention: r.convention }) });
}

describe("exact selected predicate leaves over genuine complete snapshots", () => {
  it.each([
    ["8/8/8/8/8/4k3/8/4K3 b - - 0 1", "direct"],
    ["8/8/8/4k3/8/8/8/4K3 b - - 0 1", "distant"],
    ["8/4k3/8/8/8/8/8/4K3 b - - 0 1", "distant"],
  ] as const)("maps unobstructed opposition %s to the requested %s form", (fen, form) => {
    const source = opposition(fen), feature = { kind: "king_opposition", color: "white", form, conventionRef: REFS.king_opposition } as const;
    const value = invokeEvidenceValueRoute("rules.structural.predicate.king_opposition@2", { source, feature });
    expect(value.payload).toMatchObject({ fen: source.payload.fen, feature, matched: true, subjects: [{ kings: source.payload.kings, opposition: source.payload.opposition }] });
    expect(invokeEvidenceValueRoute("rules.structural.predicate.king_opposition@2", { source, feature: { ...feature, color: "black" } }).payload).toMatchObject({ matched: false, subjects: [] });
    expect(invokeEvidenceValueRoute("rules.structural.predicate.king_opposition@2", { source, feature: { ...feature, form: form === "direct" ? "distant" : "direct" } }).payload.matched).toBe(false);
  });

  it("reports available false over an explicit blocked/null opposition source", () => {
    const source = opposition("8/8/8/4k3/8/4P3/8/4K3 b - - 0 1");
    expect(source.payload.opposition).toBeNull();
    const value = invokeEvidenceValueRoute("rules.structural.predicate.king_opposition@2", { source, feature: { kind: "king_opposition", color: "white", form: "distant", conventionRef: REFS.king_opposition } });
    expect(value.payload).toMatchObject({ matched: false, subjects: [] });
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(source).payloadDigest]);
  });

  it("retains every matching backward pawn on the requested color/file, including occupied stops", () => {
    const source = backward("7k/8/2p5/2p5/1P6/1P6/8/7K w - - 0 1");
    const feature = { kind: "backward_pawn", color: "white", file: "b", conventionRef: REFS.backward_pawn } as const;
    const value = invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source, feature });
    expect(value.payload.subjects.map(row => row.pawn)).toEqual(["b3", "b4"]);
    expect(value.payload.subjects.map(row => row.stopOccupancy.kind)).toEqual(["own", "empty"]);
    expect(value.payload.subjects).toEqual(source.payload.pawns.filter(row => row.color === "white" && row.pawn[0] === "b"));
    expect(value.payload.matched).toBe(true);
    expect(invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source, feature: { ...feature, file: "a" } }).payload).toMatchObject({ matched: false, subjects: [] });
    const empty = backward("7k/8/8/8/8/8/8/7K w - - 0 1");
    expect(empty.payload.pawnDomain).toEqual([]);
    expect(invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source: empty, feature }).payload).toMatchObject({ matched: false, subjects: [] });
  });

  it("uses future-file candidacy regardless of occupation and preserves legacy maximal reach", () => {
    const feature = { kind: "outpost", color: "white", square: "e5", conventionRef: REFS.outpost } as const;
    for (const piece of ["4N3", "8", "4n3"]) {
      const fen = `7k/2p5/8/${piece}/3P4/8/8/7K w - - 0 1`, source = outposts(fen);
      const value = invokeEvidenceValueRoute("rules.structural.predicate.outpost@2", { source, feature });
      expect(value.payload.matched).toBe(true);
      expect(value.payload.subjects).toEqual(source.payload.candidates.filter(row => row.color === "white" && row.square === "e5"));
      const { conventionRef: _ref, ...legacy } = feature;
      expect(invokeEvidenceValueRoute("rules.structural.predicate.outpost@1", { fen, feature: legacy }).payload.matched).toBe(false);
    }
    const challenged = outposts("7k/5p2/8/4N3/3P4/8/8/7K w - - 0 1");
    expect(invokeEvidenceValueRoute("rules.structural.predicate.outpost@2", { source: challenged, feature }).payload).toMatchObject({ matched: false, subjects: [] });
  });

  it("requires the selected exact ref and original factory source before even false results", () => {
    const source = backward("7k/8/8/8/8/8/8/7K w - - 0 1");
    const feature = { kind: "backward_pawn", color: "white", file: "b", conventionRef: REFS.backward_pawn } as const;
    expect(invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source, feature }).payload.matched).toBe(false);
    for (const candidate of [reseal(source), { ...source }, position(source.payload.fen)]) expect(() => invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source: candidate, feature } as never)).toThrow();
    for (const invalid of [{ kind: "backward_pawn", color: "white", file: "b" }, { ...feature, conventionRef: REFS.outpost }, { ...feature, conventionRef: { ...REFS.backward_pawn, extra: true } }, { ...feature, color: "green" }, { ...feature, file: "i" }, { ...feature, matched: true }]) expect(() => invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source, feature: invalid } as never)).toThrow();
    for (const extra of [{ fen: source.payload.fen }, { subjects: [] }, { matched: false }]) expect(() => invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source, feature, ...extra } as never)).toThrow();
  });

  it("replaces only predecessor conventions and retains actual transitive source inputs", () => {
    const cases = [
      { route: "rules.structural.predicate.king_opposition@2", source: opposition("8/8/8/8/8/4k3/8/4K3 b - - 0 1"), feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: REFS.king_opposition }, forbidden: "king-opposition-blocker-blind" },
      { route: "rules.structural.predicate.backward_pawn@2", source: backward("7k/8/2p5/2p5/1P6/1P6/8/7K w - - 0 1"), feature: { kind: "backward_pawn", color: "white", file: "b", conventionRef: REFS.backward_pawn }, forbidden: "backward-pawn-legacy" },
      { route: "rules.structural.predicate.outpost@2", source: outposts("7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1"), feature: { kind: "outpost", color: "white", square: "e5", conventionRef: REFS.outpost }, forbidden: "maximal_pawn_reach" },
    ];
    for (const c of cases) {
      const value = invokeEvidenceValueRoute(c.route as "rules.structural.predicate.king_opposition@2", { source: c.source, feature: c.feature } as never);
      expect(value.payload.matched).toBe(true);
      const direct = directProjectionConventions(c.route);
      expect(direct).toEqual([c.feature.conventionRef]);
      const expected = [...new Map([...direct, ...(evidenceValueReceipt(c.source).convention?.refs ?? [])].map(ref => [`${ref.id}@${ref.version}`, ref])).values()].sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version);
      expect(evidenceValueReceipt(value).convention?.refs).toEqual(expected);
      expect(expected.map(ref => ref.id)).not.toContain(c.forbidden);
      expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(c.source).payloadDigest]);
    }
  });
});
