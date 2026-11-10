// TEST/DIAGNOSTIC-ONLY fixed revision-pair population. No content or admission authority.
// Shared by the permanent revision-pair test and opt-in D4018 incidence measurement so the
// diagnostic cannot silently substitute positions or omit an inconvenient original fixture.
import type { DrillRun } from "@chess-tabiya/runtime";
import { canonicalFen, positionFromFen } from "../../../packages/runtime/src/chess.js";
import { OCCUPIED_TARGET_IDENTITY_CASES } from "../../../packages/runtime/src/testing/occupied-target-fixtures.js";
import { play, positionRun } from "./longitudinal-test-fixtures.js";

export const LONGITUDINAL_SUCCESSOR_FIXTURES = [
  ["white material capture", "1n2k3/8/8/8/8/8/n7/R3K3 w - - 7 1", "a1a2", "white", "derived.material.event.role_asymmetry", true],
  ["black material capture", "3k3r/7N/8/8/8/8/8/3K2N1 b - - 7 1", "h8h7", "black", "derived.material.event.role_asymmetry", true],
  ["white material quiet", "1n2k3/8/8/8/8/8/n7/R3K3 w - - 7 1", "a1b1", "white", "derived.material.event.role_asymmetry", false],
  ["black material quiet", "3k3r/7N/8/8/8/8/8/3K2N1 b - - 7 1", "h8g8", "black", "derived.material.event.role_asymmetry", false],
  ["white exposure", "rn2k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", "white", "derived.tactic.defender_exposure", true],
  ["black exposure", "3k3r/8/8/8/5b2/6N1/8/3K2NR b - - 0 1", "f4g3", "black", "derived.tactic.defender_exposure", true],
  ["white retained defender", "rn2k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5d4", "white", "derived.tactic.defender_exposure", false],
  ["black retained defender", "3k3r/8/8/8/5b2/6N1/8/3K2NR b - - 0 1", "f4e5", "black", "derived.tactic.defender_exposure", false],
] as const;

/** Every original revision-pair run in unchanged order, then the eight accepted successor arms. */
export function longitudinalRevisionFixtures(): readonly DrillRun[] {
  return [
    play(positionRun("revision-fixture"), "e2e4", "e7e5", "g1f3"),
    play(positionRun("revision-promotion", "2R4r/1P6/7k/8/8/8/8/K7 w - - 0 1"), "b7b8n"),
    play(positionRun("revision-retained", "2R4r/1P6/7k/8/8/8/8/K7 w - - 0 1"), "b7b8r"),
    play(positionRun("revision-castling", "4k3/8/8/8/8/8/3P4/4K2R w K - 0 1"), "e1h1"),
    play(positionRun("revision-en-passant", "4k3/8/8/8/4p3/8/3P4/4K3 w - - 0 1"), "d2d4"),
    play(positionRun("revision-white-pawn", "4k3/8/8/2PP4/2P5/8/8/4K3 w - - 0 1"), "d5d6"),
    play(positionRun("revision-black-pawn", "4k3/8/8/2p5/2pp4/8/8/4K3 b - - 0 1", "black"), "d4d3"),
    ...OCCUPIED_TARGET_IDENTITY_CASES.map(value => play(positionRun(`revision-target-${value.name}`, canonicalFen(positionFromFen(value.fen)), value.side), value.uci)),
    ...LONGITUDINAL_SUCCESSOR_FIXTURES.map(([name, fen, move, side]) => play(positionRun(`revision-${name}`, fen, side), move)),
  ];
}
