// DISPOSABLE research harness — D1071/D1072, extended for the packet RFC. Not production code.
//
// The sibling `candidate-packet.test.ts` falsified the *opponent adapter*. This file falsifies the
// other half of the same claim: that the SHIPPED selection path already owns a complete candidate
// population. It does not. The population is supplied by the caller, is never checked against the
// edge it is supplied for, and the statistic that reports it is not a measurement.
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { candidateFeatureVector } from "../../apps/server/src/candidate-evidence.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import {
  legalAlternativeEdges,
  localSemanticEvents,
  selectLocalSemanticEvidence,
  selectSemanticEvidence,
  type SemanticEvidenceEvent,
} from "../../packages/runtime/src/semantic-evidence.js";

const POLICY = Object.freeze({ id: "research.r2_candidate", version: 1 });

/** A quiet middlegame with an open file, rooks and a real branching factor. */
const MID = "r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 10";
const PLAYED = "d4c5";

interface Edge { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function edge(beforeFen: string, uci: string): Edge {
  const board = position(beforeFen);
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal fixture ${uci}`);
  board.play(move);
  return Object.freeze({ beforeFen, moveUci: makeUci(move), afterFen: makeFen(board.toSetup()) });
}

function destinationCount(fen: string): number {
  let total = 0;
  for (const [, destinations] of position(fen).allDests()) total += destinations.size();
  return total;
}

function wide(current: Edge): readonly SemanticEvidenceEvent[] {
  return localSemanticEvents(current.beforeFen, current.moveUci, current.afterFen);
}

function families(result: ReturnType<typeof selectSemanticEvidence>): readonly string[] {
  return Object.freeze(result.selected.map((fact) => `${fact.event.projection.id}:${fact.event.sign}`).sort());
}

describe("D1071 population integrity at HEAD", () => {
  it("the alternative enumerator is complete but excludes the committed move", () => {
    const played = edge(MID, PLAYED);
    const alternatives = legalAlternativeEdges(played.beforeFen, played.moveUci);
    // No promotions are available here, so destination count equals the legal-move count.
    expect(alternatives).toHaveLength(destinationCount(MID) - 1);
    expect(alternatives.some((row) => row.moveUci === played.moveUci)).toBe(false);
    // A packet consumer that needs the bot's own candidate row needs the committed move back.
  });

  it("`evaluatedAlternatives` reports the legal count even when nothing was evaluated", () => {
    const played = edge(MID, PLAYED);
    const playedEvents = wide(played);
    const honest = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, POLICY, {
      ...played, playedEvents, evaluateAlternative: (alternative) => wide(alternative),
    });
    const unevaluated = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, POLICY, {
      ...played, playedEvents, evaluateAlternative: () => [],
    });
    const forged = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, POLICY, {
      ...played, playedEvents, evaluateAlternative: () => playedEvents,
    });

    // The statistic is identical in all three. It is asserted by construction, not measured.
    expect(unevaluated.population).toEqual(honest.population);
    expect(forged.population).toEqual(honest.population);
    expect(honest.population.evaluatedAlternatives).toBe(honest.population.legalAlternatives);

    // And the empty population is not merely unsound, it is FLATTERING: every played event scores a
    // 0.000 same-family share, so families the complete population refuses are admitted instead.
    const honestFamilies = families(honest);
    const unevaluatedFamilies = families(unevaluated);
    expect(unevaluatedFamilies).not.toEqual(honestFamilies);
    expect(unevaluatedFamilies.some((family) => !honestFamilies.includes(family))).toBe(true);
    for (const fact of unevaluated.selected) {
      if (fact.kind === "played_event") expect(fact.sameFamilyShare).toBe(0);
    }
    // Answering every alternative with the played edge's own events is also accepted; the anchor
    // dedupe at semantic-evidence.ts:1019 bounds the inflation to one, it does not refuse it.
    expect(families(forged)).toEqual(unevaluatedFamilies);
  });

  it("the two shipped enumerators disagree on the closure, so they select different evidence", () => {
    const played = edge(MID, PLAYED);
    const narrow = selectLocalSemanticEvidence(POLICY, played);
    const broad = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, POLICY, {
      ...played, playedEvents: wide(played), evaluateAlternative: (alternative) => wide(alternative),
    });
    expect(narrow.population).toEqual(broad.population);
    expect(families(narrow)).not.toEqual(families(broad));
    // The difference is causal: breadth families exist in one enumerator and not the other.
    const broadFamilies = new Set(wide(played).map((event) => event.projection.id));
    expect(broadFamilies.has("derived.pawn.event.transitions")).toBe(true);
    expect(families(narrow).some((family) => family.startsWith("derived.pawn.event.transitions"))).toBe(false);
  });

  it("compiling the complete population is the expensive part, and it is position-derived", () => {
    const played = edge(MID, PLAYED);
    const alternatives = legalAlternativeEdges(played.beforeFen, played.moveUci);
    const started = performance.now();
    let events = 0;
    for (const alternative of alternatives) events += wide(alternative).length;
    const coldMs = performance.now() - started;
    expect(events).toBeGreaterThan(1000);
    expect(coldMs).toBeGreaterThan(0);
    // Reported rather than gated: a wall-clock threshold in a unit test is a flake, and the
    // acceptance measurement this RFC owes is an end-to-end one on a declared machine.
    console.log(`population: ${alternatives.length} alternatives, ${events} sealed events, ${coldMs.toFixed(0)} ms cold`);
  });

  it("the opponent adapter still accepts a strict legal subset at HEAD", () => {
    const vector = candidateFeatureVector({
      beforeFen: MID,
      engine: { id: "research-only", name: "Unverified caller bytes", version: "0", seedHonored: true, searchBound: { kind: "nodes", value: 25_000 } },
      candidates: [{ moveUci: "d4c5", scoreCp: 12 }],
    });
    expect(vector.candidates).toHaveLength(1);
    expect(destinationCount(MID)).toBeGreaterThan(1);
  });
});
