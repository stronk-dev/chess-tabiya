import { normalizeMove } from "chessops/chess";
import { Chess } from "chessops/chess";
import { parseSan } from "chessops/san";
import { parseUci } from "chessops/util";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { candidateMajorityReading, harassmentPressureSequence, pawnContactTimingSequence, pawnContactsReading, pawnDynamicsEvents, pawnTransitionEvents, promotionRaceGeometry, promotionRaceTablebase, type RecordedMoveAnchor } from "./pawn-dynamics.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const next = after(current, moveUci);
    const value = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen: next };
    current = next;
    return value;
  });
}

function sanAnchors(sans: readonly string[]): readonly RecordedMoveAnchor[] {
  const position = Chess.default();
  return sans.map((san, index) => {
    const beforeFen = canonicalFen(position);
    const move = parseSan(position, san)!;
    expect(position.isLegal(move)).toBe(true);
    const moveUci = makeUci(move);
    position.play(move);
    return { beforeNodeId: `s${index}`, afterNodeId: `s${index + 1}`, beforeFen, moveUci, afterFen: canonicalFen(position) };
  });
}

describe("identity-retaining pawn dynamics", () => {
  it("distinguishes directed contacts, direct locks, blockers, protection, and connected passers", () => {
    const contact = pawnContactsReading("4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1");
    expect(contact.contacts).toContainEqual({
      attacker: { square: "e4", piece: { color: "white", role: "pawn", promoted: false } },
      target: { square: "d5", piece: { color: "black", role: "pawn", promoted: false } },
    });

    const lock = pawnContactsReading("4k3/8/8/4p3/4P3/8/8/4K3 w - - 0 1");
    expect(lock.locks).toEqual([expect.objectContaining({ white: expect.objectContaining({ square: "e4" }), black: expect.objectContaining({ square: "e5" }) })]);
    expect(pawnContactsReading("4k3/8/8/5p2/4P3/8/8/4K3 w - - 0 1").locks).toEqual([]);

    const blocked = pawnContactsReading("4k3/8/8/2p5/3P4/8/8/4K3 w - - 0 1").passed.find((value) => value.pawn.square === "d4")!;
    expect(blocked).toMatchObject({ passed: false, blockers: [expect.objectContaining({ square: "c5" })] });

    const protectedPasser = pawnContactsReading("4k3/8/8/3P4/2P5/8/8/4K3 w - - 0 1").passed.find((value) => value.pawn.square === "d5")!;
    expect(protectedPasser).toMatchObject({ passed: true, protectedBy: [expect.objectContaining({ square: "c4" })] });
    const nonPawnDefender = pawnContactsReading("4k3/8/8/3P4/2B5/8/8/4K3 w - - 0 1").passed.find((value) => value.pawn.square === "d5")!;
    expect(nonPawnDefender).toMatchObject({ passed: true, protectedBy: [] });

    const connected = pawnContactsReading("4k3/8/3P4/8/2P5/8/8/4K3 w - - 0 1");
    expect(connected.connectedPassedPairs).toContainEqual(expect.objectContaining({ first: expect.objectContaining({ square: "c4" }), second: expect.objectContaining({ square: "d6" }) }));
    expect(pawnContactsReading("4k3/8/2P5/8/2P5/8/8/4K3 w - - 0 1").connectedPassedPairs).toEqual([]);
  });

  it("pins the candidate-majority orientation and equality boundary", () => {
    const equality = candidateMajorityReading("4k3/8/8/2p5/3P4/2P5/8/4K3 w - - 0 1");
    expect(equality.candidates).toContainEqual(expect.objectContaining({
      pawn: expect.objectContaining({ square: "d4" }),
      supports: [expect.objectContaining({ square: "c3" })],
      blockers: [expect.objectContaining({ square: "c5" })],
      supportCount: 1,
      blockerCount: 1,
    }));

    const supportAhead = candidateMajorityReading("4k3/8/2p5/2P5/3P4/8/8/4K3 w - - 0 1");
    expect(supportAhead.candidates.some((value) => value.pawn.square === "d4")).toBe(false);
    const sameFile = candidateMajorityReading("4k3/8/3p4/8/3P4/2P5/8/4K3 w - - 0 1");
    expect(sameFile.candidates.some((value) => value.pawn.square === "d4")).toBe(false);

    const mirror = candidateMajorityReading("4k3/8/2p5/3p4/2P5/8/8/4K3 b - - 0 1");
    expect(mirror.candidates).toContainEqual(expect.objectContaining({
      pawn: expect.objectContaining({ square: "d5", piece: expect.objectContaining({ color: "black" }) }),
      supports: [expect.objectContaining({ square: "c6" })],
      blockers: [expect.objectContaining({ square: "c4" })],
    }));
  });

  it("emits newly gained lock and harassment relations only", () => {
    const lockFen = "4k3/8/8/4p3/8/8/4P3/4K3 w - - 0 1";
    expect(pawnDynamicsEvents(lockFen, "e2e4", after(lockFen, "e2e4"))).toContainEqual(expect.objectContaining({ kind: "locked_pair_gained" }));

    const harassmentFen = "4k3/8/8/8/6n1/8/7P/4K3 w - - 0 1";
    expect(pawnDynamicsEvents(harassmentFen, "h2h3", after(harassmentFen, "h2h3"))).toContainEqual(expect.objectContaining({
      kind: "minor_harassed",
      subjects: { pawn: expect.objectContaining({ square: "h3" }), minor: expect.objectContaining({ square: "g4" }) },
    }));
  });

  it("emits protected, connected, and candidate gains at the move that creates them", () => {
    const protectedFen = "4k3/8/8/3P4/8/8/2P5/4K3 w - - 0 1";
    expect(pawnDynamicsEvents(protectedFen, "c2c4", after(protectedFen, "c2c4"))).toContainEqual(expect.objectContaining({
      kind: "protected_passer_gained",
      subjects: expect.objectContaining({ pawn: expect.objectContaining({ square: "d5" }), protectedBy: [expect.objectContaining({ square: "c4" })] }),
    }));

    const connectedFen = "4k3/8/8/3r4/2P1P3/8/8/4K3 w - - 0 1";
    expect(pawnDynamicsEvents(connectedFen, "e4d5", after(connectedFen, "e4d5"))).toContainEqual(expect.objectContaining({
      kind: "connected_passer_pair_gained",
      subjects: expect.objectContaining({ first: expect.objectContaining({ square: "c4" }), second: expect.objectContaining({ square: "d5" }) }),
    }));

    const candidateFen = "4k3/8/3p4/4p3/3P1P2/8/8/4K3 w - - 0 1";
    expect(pawnDynamicsEvents(candidateFen, "d4e5", after(candidateFen, "d4e5"))).toContainEqual(expect.objectContaining({
      kind: "candidate_majority_gained",
      subjects: expect.objectContaining({ pawn: expect.objectContaining({ square: "e5" }) }),
    }));
  });

  it("joins contact execution and passed-pawn transitions to exact move identity", () => {
    const captureFen = "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1";
    const captureEvents = pawnTransitionEvents(captureFen, "e4d5", after(captureFen, "e4d5"));
    expect(captureEvents.map((value) => value.kind)).toEqual([
      "contact_executed",
      "moved_pawn_became_passed",
      "capture_created_moved_passer",
    ]);
    expect(captureEvents[0]).toMatchObject({
      pawn: { before: { square: "e4" }, after: { square: "d5" } },
      contact: { attacker: { square: "e4" }, target: { square: "d5" } },
      capture: { family: "capture", from: "e4", to: "d5" },
    });

    const advanceFen = "4k3/8/8/3P4/8/8/8/4K3 w - - 0 1";
    expect(pawnTransitionEvents(advanceFen, "d5d6", after(advanceFen, "d5d6"))).toContainEqual(expect.objectContaining({ kind: "passed_pawn_advanced" }));
  });

  it("retains candidate identity across an advance", () => {
    const fen = "4k3/8/2p5/8/3P4/2P5/8/4K3 w - - 0 1";
    expect(pawnDynamicsEvents(fen, "d4d5", after(fen, "d4d5"))).toContainEqual(expect.objectContaining({
      kind: "candidate_majority_advanced",
      subjects: { before: expect.objectContaining({ pawn: expect.objectContaining({ square: "d4" }) }), after: expect.objectContaining({ pawn: expect.objectContaining({ square: "d5" }) }) },
    }));
  });

  it("requires exact boundaries and pawn identity for two- and three-edge contact timing", () => {
    const path = anchors("4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", ["e2e4", "e8f7", "e4d5"]);
    expect(pawnContactTimingSequence(path.slice(0, 2))).toMatchObject({
      kind: "created_survived_reply",
      pawn: { color: "white", from: "e2", contactSquare: "e4" },
      contactedPawn: { square: "d5" },
      nodes: [{ nodeId: "n0" }, { nodeId: "n1" }, { nodeId: "n2" }],
    });
    expect(pawnContactTimingSequence(path)).toMatchObject({ kind: "created_executed_next_own_move", nodes: [{ nodeId: "n0" }, { nodeId: "n1" }, { nodeId: "n2" }, { nodeId: "n3" }] });
    expect(() => pawnContactTimingSequence([path[0]!, { ...path[1]!, beforeNodeId: "wrong" }])).toThrow(/broken node\/FEN boundary/u);
  });

  it("retains the exact bishop, screen, and target through immediate harassment pressure", () => {
    const line = sanAnchors(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bh5"]);
    expect(harassmentPressureSequence(line.slice(6, 8))).toMatchObject({
      kind: "harassment_pressure_retained",
      pawn: { square: "h3" },
      minor: { before: { square: "g4", piece: { role: "bishop" } }, after: { square: "h5", piece: { role: "bishop" } } },
      pressure: { before: { screen: { square: "f3" }, target: { square: "d1" } }, after: { screen: { square: "f3" }, target: { square: "d1" } } },
    });
    const broken = sanAnchors(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bf5"]);
    expect(harassmentPressureSequence(broken.slice(6, 8))).toBeUndefined();
  });

  it("orders unblocked promotion arrivals without turning geometry into an outcome", () => {
    const fen = "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1";
    const result = promotionRaceGeometry(fen);
    expect(result).toMatchObject({ kind: "available", value: { arrivalConvention: "race-arrival@1", sideToMove: "white", ordering: [{ arrivalPly: 9, pawns: [expect.objectContaining({ square: "a2" })] }, { arrivalPly: 10, pawns: [expect.objectContaining({ square: "h7" })] }] } });
    if (result.kind === "available") expect(JSON.stringify(result.value)).not.toMatch(/winning|losing|drawing|win|loss|draw/u);

    expect(promotionRaceGeometry("4k3/7p/8/8/8/p7/P7/4K3 w - - 0 1")).toEqual({ kind: "unavailable", reason: "blocked_or_capturable_path_outside_convention" });
    expect(promotionRaceGeometry(fen, false)).toEqual({ kind: "unavailable", reason: "input_abstained" });
  });

  it("keeps Syzygy outcome in a separate exact source join", () => {
    const fen = "4k3/P7/8/8/8/8/7p/4K3 w - - 0 1";
    const geometry = promotionRaceGeometry(fen);
    expect(promotionRaceTablebase(geometry, { category: "win", dtz: 1, preciseDtz: 1, provider: "fixture", pieceCount: 4 })).toMatchObject({
      kind: "available",
      value: { category: "win", provider: "fixture", immediatePromotion: expect.arrayContaining(["a7a8q"]), promotionWithCheck: expect.arrayContaining(["a7a8q"]) },
    });
    expect(promotionRaceTablebase(geometry, undefined)).toEqual({ kind: "unavailable", reason: "provider_unavailable" });
    expect(promotionRaceTablebase(geometry, { category: "win", dtz: 1, preciseDtz: 1, provider: "fixture", pieceCount: 5 })).toEqual({ kind: "unavailable", reason: "outside_tablebase_domain" });
  });
});
