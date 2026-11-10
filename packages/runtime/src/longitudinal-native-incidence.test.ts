import { describe, expect, it } from "vitest";
import { CANDIDATE_EVENTS_SCOPE, CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { nativeSubjectIncidences } from "./internal/longitudinal-native-incidence.js";
import { nativeEventSubject } from "./semantic-native-subject.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";
import { readCandidateUnavailableSources } from "./semantic-source-availability.js";
import { collectProfileSubjectPopulation } from "./internal/profile-subject-facts.js";

function owner(fen: string) {
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error)); return result.receipt;
}

describe("original root native-event incidence", () => {
  it("keeps two stationary heavy subjects in root-square order without a generic file opportunity", () => {
    const receipt = owner("6nk/1R3b1p/8/8/8/2n5/1PP5/1Q5K w - - 0 1");
    const result = nativeSubjectIncidences(receipt, "b2c3");
    expect(result.kind).toBe("available");
    const rows = result.rows.filter(row => row.source === "derived.activity.event.file_access_revealed@1");
    expect(rows).toEqual([
      { source: "derived.activity.event.file_access_revealed@1", subject: { kind: "file_access", piece: { color: "white", role: "queen", square: "b1" }, file: "b" }, parameters: {},
        sign: "gained", occurred: true, legalAlternatives: receipt.packet.candidates.length - 1, matchingAlternatives: 0, comparableAlternatives: receipt.packet.candidates.length - 1 },
      { source: "derived.activity.event.file_access_revealed@1", subject: { kind: "file_access", piece: { color: "white", role: "rook", square: "b7" }, file: "b" }, parameters: {},
        sign: "gained", occurred: true, legalAlternatives: receipt.packet.candidates.length - 1, matchingAlternatives: 0, comparableAlternatives: receipt.packet.candidates.length - 1 },
    ]);
    expect(result.actor).toBe("white"); expect(rows.every(row => !("ordinal" in row))).toBe(true);
    const alternative = nativeSubjectIncidences(receipt, "h1g1");
    expect(alternative.rows.filter(row => row.source === "derived.activity.event.file_access_revealed@1").map(row => [row.occurred, row.matchingAlternatives]))
      .toEqual([[false, 1], [false, 1]]);
  });

  it("preserves different original pawn roots and signs from one played move", () => {
    const receipt = owner("7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1");
    const result = nativeSubjectIncidences(receipt, "d4d5");
    const rows = result.rows.filter(row => row.source === "rules.structural.event.backward_pawn@2").filter(row => row.occurred);
    expect(rows.map(row => row.subject.rootSquare)).toEqual(["d4", "c6", "c7"]);
    expect(new Set(rows.map(row => row.subject.rootSquare)).size).toBe(3);
    expect(rows.every(row => row.legalAlternatives === receipt.packet.candidates.length - 1)).toBe(true);
  });

  it("stores the original two-king root pair even when the played king moves", () => {
    const receipt = owner("4k3/8/4K3/8/8/8/P7/8 w - - 0 1");
    const event = receipt.packet.candidates.find(row => row.moveUci === "e6d6")!.events.find(event => event.projection.id === "rules.structural.event.king_opposition" && event.projection.version === 2)!;
    expect(nativeEventSubject(event)).toMatchObject({ source: "rules.structural.event.king_opposition@2",
      subject: { kind: "king_opposition", whiteRootSquare: "e6", blackRootSquare: "e8" }, parameters: {}, ordinal: 0 });
    expect(() => nativeEventSubject({ ...event })).toThrow();
  });

  it("refuses copied/narrow owners and retains forced zero", () => {
    const receipt = owner("8/8/8/8/8/1r6/2k5/K7 w - - 0 1");
    expect(nativeSubjectIncidences(receipt, "a1a2")).toMatchObject({ kind: "available", actor: "white", rows: [] });
    expect(() => nativeSubjectIncidences({ ...receipt }, "a1a2")).toThrow(/minted/);
    const narrow = compileCandidatePopulation({ beforeFen: receipt.packet.beforeFen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (narrow.kind !== "ready") throw Error("Narrow test root missing");
    // @ts-expect-error Deliberate scope refusal, not an implicit wider authority.
    expect(() => nativeSubjectIncidences(narrow.receipt, "a1a2")).toThrow(/wide/);
  });

  it.each([false, true])("D4200 preserves native evidence despite unrelated original event failures (mirrored=%s)", mirrored => {
    const fen = "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", move = "a2b3";
    const beforeFen = mirrored ? mirrorSemanticFen(fen, "color_and_vertical") : fen;
    const moveUci = mirrored ? mirrorSemanticUci(move, "color_and_vertical") : move;
    const receipt = owner(beforeFen);
    expect(readCandidateUnavailableSources(receipt)).toHaveLength(1);
    const result = nativeSubjectIncidences(receipt, moveUci);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw Error("Complete native sources were discarded");
    expect(result.actor).toBe(mirrored ? "black" : "white");
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.every(row => row.legalAlternatives === 11 && row.comparableAlternatives === 11)).toBe(true);
    // Stored revision9 remains conservative until the coordinated durable coverage upgrade.
    expect(collectProfileSubjectPopulation(beforeFen, moveUci)).toEqual({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
  });

  it("does not turn a genuine risk failure into a failure of the independent native families", () => {
    const fen = "7k/8/8/8/8/8/8/r6K w - - 0 1", receipt = owner(fen);
    expect(readCandidateUnavailableSources(receipt).some(value => value.projection.id === "derived.semantic_avoidance.loose_piece")).toBe(true);
    expect(nativeSubjectIncidences(receipt, "h1h2")).toMatchObject({ kind: "available", actor: "white" });
    expect(collectProfileSubjectPopulation(fen, "h1h2")).toEqual({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
  });
});
