import { describe, expect, it } from "vitest";

import {
  appendOpponentPly,
  attachEvidence,
  commitMove,
  createRun,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { applyRecordedEngineGuard, applyRulesGuard } from "./guard.js";

const at = "2026-08-14T12:00:00.000Z";
const selection = (moveUci: string): OpponentSelection => ({
  moveUci,
  policyModeApplied: "human_common",
  engine: { id: "mock", name: "Mock", version: "1", seedHonored: true },
});
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

function run(fen: string, side: "white" | "black" = "white") {
  return createRun({
    id: `guard-${side}`,
    session: {
      kind: "pack",
      packId: "guard-pack",
      packDigest: `sha256:${"a".repeat(64)}`,
      start: { fen, side },
      feedbackPolicy: "immediate_guard",
      opponentPolicy: { mode: "human_common" },
    },
    sessionDigest: `sha256:${"b".repeat(64)}`,
    policyConfig,
    seed: 1,
    createdAt: at,
  });
}

const pack = { guard: {}, feedbackPolicy: "immediate_guard" } as unknown as DrillPackDefinition;
const tunedPack = (fen: string, guard: NonNullable<DrillPackDefinition["guard"]>): DrillPackDefinition => ({
  ...pack,
  id: "guard-pack",
  start: { fen, side: "white" },
  checkpoints: [],
  objective: { type: "play_until_checkpoint" },
  opponentPolicy: { mode: "human_common" },
  guard,
} as unknown as DrillPackDefinition);

describe("post-commit guard", () => {
  it("records a material loss only after the opponent starts the consequence", () => {
    let played = commitMove(run("3rk3/8/8/8/8/8/7P/3Q2K1 w - - 0 1"), "h2h3", { at }).run;
    expect(played.events.some((event) => event.type === "feedback.generated")).toBe(false);
    played = appendOpponentPly(played, selection("d8d1"), { at }).run;
    const result = applyRulesGuard(pack, played, played.activeCursor.nodeId, at);
    expect(result.emitted).toMatchObject([{
      type: "feedback.generated",
      data: { nodeId: played.activeCursor.nodeId, evidenceRefs: ["rules:material"] },
    }]);
  });

  it("records the exact direct-attack-count fact for an undefended piece", () => {
    let played = commitMove(run("4kb2/8/8/8/8/2N5/7P/4K3 w - - 0 1"), "h2h3", { at }).run;
    played = appendOpponentPly(played, selection("f8b4"), { at }).run;
    const result = applyRulesGuard(pack, played, played.activeCursor.nodeId, at);
    expect(result.emitted[0]).toMatchObject({
      type: "feedback.generated",
      data: { evidenceRefs: ["rules:structure-direct-attack-count"] },
    });
  });

  it("keeps the geometric scope visible: a pinned attacker still counts", () => {
    let played = commitMove(
      run("4k3/p3n3/8/3N4/8/8/7P/4R1K1 w - - 0 1"),
      "h2h3",
      { at },
    ).run;
    played = appendOpponentPly(played, selection("a7a6"), { at }).run;
    expect(applyRulesGuard(pack, played, played.activeCursor.nodeId, at).emitted[0]).toMatchObject({
      data: { evidenceRefs: ["rules:structure-direct-attack-count"] },
    });
  });

  it("does not fire when a pinned defender is still present in the geometric count", () => {
    let played = commitMove(
      run("k3r3/p7/5n2/3N4/8/4N3/7P/4K3 w - - 0 1"),
      "h2h3",
      { at },
    ).run;
    played = appendOpponentPly(played, selection("a7a6"), { at }).run;
    expect(applyRulesGuard(pack, played, played.activeCursor.nodeId, at).emitted).toEqual([]);
  });

  it("abstains on an opponent-first root ply", () => {
    let played = appendOpponentPly(
      run("4k3/8/8/8/8/8/7P/4K3 b - - 0 1"),
      selection("e8f7"),
      { at },
    ).run;
    const result = applyRulesGuard(pack, played, played.activeCursor.nodeId, at);
    expect(result.emitted).toEqual([]);
  });

  it("fires from a completed recorded eval pair and deduplicates the consequence", () => {
    let played = appendOpponentPly(
      run("4k3/8/8/8/8/8/7P/4K3 b - - 0 1"),
      selection("e8f7"),
      { at },
    ).run;
    const previousId = played.activeCursor.nodeId;
    played = commitMove(played, "h2h3", { at }).run;
    played = appendOpponentPly(played, selection("f7g6"), { at }).run;
    const consequenceId = played.activeCursor.nodeId;
    played = attachEvidence(played, previousId, ["engine:before"], {
      kind: "eval", source: "engine_validated", values: { centipawns: 100 },
    }, at).run;
    played = attachEvidence(played, consequenceId, ["engine:after"], {
      kind: "eval", source: "engine_validated", values: { centipawns: -150 },
    }, at).run;
    const fired = applyRecordedEngineGuard(pack, played, consequenceId, ["engine:after"], at);
    expect(fired.emitted[0]).toMatchObject({
      type: "feedback.generated",
      data: { nodeId: consequenceId, evidenceRefs: ["engine:after"] },
    });
    expect(applyRecordedEngineGuard(pack, fired.run, previousId, ["engine:before"], at).emitted).toEqual([]);
  });

  it("lets a pack disable the engine tier without disabling rule tiers", () => {
    const disabled = { ...pack, guard: { evalSwingCp: null } } as DrillPackDefinition;
    let played = appendOpponentPly(
      run("4k3/8/8/8/8/8/7P/4K3 b - - 0 1"),
      selection("e8f7"),
      { at },
    ).run;
    const previousId = played.activeCursor.nodeId;
    played = commitMove(played, "h2h3", { at }).run;
    played = appendOpponentPly(played, selection("f7g6"), { at }).run;
    const consequenceId = played.activeCursor.nodeId;
    played = attachEvidence(played, previousId, ["engine:before"], { kind: "eval", source: "engine_validated", values: { centipawns: 200 } }, at).run;
    played = attachEvidence(played, consequenceId, ["engine:after"], { kind: "eval", source: "engine_validated", values: { centipawns: -200 } }, at).run;
    expect(applyRecordedEngineGuard(disabled, played, consequenceId, ["engine:after"], at).emitted).toEqual([]);
  });

  it("fires forced mate independently of a disabled centipawn threshold", () => {
    const fen = "4k3/8/8/8/8/8/7P/4K3 b - - 0 1";
    const document = tunedPack(fen, { evalSwingCp: null, fireOnMate: true });
    let played = appendOpponentPly(run(fen), selection("e8f7"), { at }).run;
    const previousId = played.activeCursor.nodeId;
    played = commitMove(played, "h2h3", { at }).run;
    played = appendOpponentPly(played, selection("f7g6"), { at }).run;
    const consequenceId = played.activeCursor.nodeId;
    played = attachEvidence(played, previousId, ["engine:before"], { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }, at).run;
    played = attachEvidence(played, consequenceId, ["engine:after"], { kind: "eval", source: "engine_validated", values: { mateIn: -1 } }, at).run;
    expect(applyRecordedEngineGuard(document, played, consequenceId, ["engine:after"], at).emitted).toHaveLength(1);
  });

  it("applies atStart threshold overrides and the inclusive guard window", () => {
    const fen = "4k3/8/8/8/8/8/7P/4K3 b - - 0 1";
    const document = tunedPack(fen, { evalSwingCp: 250, window: { fromPly: 1, toPly: 3 }, overrides: [{ at: { atStart: true }, evalSwingCp: 120 }] });
    let played = appendOpponentPly(run(fen), selection("e8f7"), { at }).run;
    const previousId = played.activeCursor.nodeId;
    played = commitMove(played, "h2h3", { at }).run;
    played = appendOpponentPly(played, selection("f7g6"), { at }).run;
    const consequenceId = played.activeCursor.nodeId;
    played = attachEvidence(played, previousId, ["engine:before"], { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }, at).run;
    played = attachEvidence(played, consequenceId, ["engine:after"], { kind: "eval", source: "engine_validated", values: { centipawns: -130 } }, at).run;
    expect(applyRecordedEngineGuard(document, played, consequenceId, ["engine:after"], at).emitted).toHaveLength(1);
    expect(applyRecordedEngineGuard(tunedPack(fen, { evalSwingCp: 120, window: { fromPly: 4, toPly: 8 } }), played, consequenceId, ["engine:after"], at).emitted).toEqual([]);
  });

  it("lets rulesTier disable deterministic material feedback", () => {
    const fen = "3rk3/8/8/8/8/8/7P/3Q2K1 w - - 0 1";
    let played = commitMove(run(fen), "h2h3", { at }).run;
    played = appendOpponentPly(played, selection("d8d1"), { at }).run;
    expect(applyRulesGuard(tunedPack(fen, { rulesTier: false }), played, played.activeCursor.nodeId, at).emitted).toEqual([]);
  });
});
