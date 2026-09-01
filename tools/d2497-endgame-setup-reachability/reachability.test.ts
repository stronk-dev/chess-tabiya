import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildOnePlyControl, type TablebaseControl } from "./control.js";
import { quantifiedReachability, type ReachabilityNode } from "./reachability.js";

function complete(turn: "beneficiary" | "opponent", children: readonly ReachabilityNode[], target = false): ReachabilityNode {
  return { target, turn, expansion: { kind: "complete", children } };
}

const target = complete("opponent", [], true);
const miss = complete("opponent", []);

describe("quantified reachability proof states", () => {
  it("separates possibility, forceability and inevitability at complete finite forks", () => {
    expect(quantifiedReachability(complete("opponent", [target, miss]), { claimHorizon: 1, searchPlyBudget: 1 })).toMatchObject({
      possible: "proved_true", forceable: "proved_false", inevitable: "proved_false",
    });
    expect(quantifiedReachability(complete("beneficiary", [target, miss]), { claimHorizon: 1, searchPlyBudget: 1 })).toMatchObject({
      possible: "proved_true", forceable: "proved_true", inevitable: "proved_false",
    });
  });

  it("does not turn an operational horizon into a false unbounded claim", () => {
    expect(quantifiedReachability(complete("opponent", [target, complete("beneficiary", [target])]), { claimHorizon: null, searchPlyBudget: 1 })).toMatchObject({
      possible: "proved_true", forceable: "unknown_horizon", inevitable: "unknown_horizon",
    });
  });

  it("propagates missing provider coverage unless another branch proves the quantifier", () => {
    const unavailable: ReachabilityNode = { turn: "opponent", expansion: { kind: "provider_unavailable" } };
    expect(quantifiedReachability(complete("beneficiary", [target, unavailable]), { claimHorizon: 2, searchPlyBudget: 2 }).possible).toBe("proved_true");
    expect(quantifiedReachability(complete("opponent", [target, unavailable]), { claimHorizon: 2, searchPlyBudget: 2 }).forceable).toBe("unknown_provider");
  });

  it("recognizes a complete terminal miss as false even for an unbounded question", () => {
    expect(quantifiedReachability(miss, { claimHorizon: null, searchPlyBudget: 0 })).toMatchObject({
      possible: "proved_false", forceable: "proved_false", inevitable: "proved_false",
    });
  });
});

describe("source-snapshotted KRPKR controls", () => {
  const fixture = JSON.parse(readFileSync(resolve("tools/d2497-endgame-setup-reachability/fixtures.json"), "utf8")) as { controls: readonly TablebaseControl[] };

  it("contains every legal root move and admits only exact outcome-preserving edges", () => {
    const rows = Object.fromEntries(fixture.controls.map((control) => [control.id, buildOnePlyControl(control)]));
    expect(rows.lucena_opponent_can_enter).toMatchObject({ legalMoves: 5, outcomePreservingMoves: 5, targetMoves: ["d7e6", "d7e7", "d7e8"], rootOutcome: "win" });
    expect(rows.philidor_defender_can_enter).toMatchObject({ legalMoves: 13, outcomePreservingMoves: 5, targetMoves: ["b4b3"], rootOutcome: "draw" });
    expect(rows.vancura_defender_can_enter).toMatchObject({ legalMoves: 16, outcomePreservingMoves: 4, targetMoves: ["g6b6", "g6e6", "g6f6", "g7h7"], rootOutcome: "draw" });
  });

  it("proves only the scoped one-ply claims that each side-to-move quantifier permits", () => {
    const readings = Object.fromEntries(fixture.controls.map((control) => {
      const built = buildOnePlyControl(control);
      return [control.id, quantifiedReachability(built.root, { claimHorizon: 1, searchPlyBudget: 1 })];
    }));
    expect(readings.lucena_opponent_can_enter).toMatchObject({ possible: "proved_true", forceable: "proved_false", inevitable: "proved_false" });
    expect(readings.philidor_defender_can_enter).toMatchObject({ possible: "proved_true", forceable: "proved_true", inevitable: "proved_false" });
    expect(readings.vancura_defender_can_enter).toMatchObject({ possible: "proved_true", forceable: "proved_true", inevitable: "proved_true" });
  });

  it("abstains beyond the snapshotted frontier instead of treating it as terminal", () => {
    const readings = Object.fromEntries(fixture.controls.map((control) => {
      const built = buildOnePlyControl(control);
      return [control.id, quantifiedReachability(built.root, { claimHorizon: null, searchPlyBudget: 1 })];
    }));
    expect(readings.lucena_opponent_can_enter).toMatchObject({ possible: "proved_true", forceable: "unknown_provider", inevitable: "unknown_provider" });
    expect(readings.philidor_defender_can_enter).toMatchObject({ possible: "proved_true", forceable: "proved_true", inevitable: "unknown_provider" });
    expect(readings.vancura_defender_can_enter).toMatchObject({ possible: "proved_true", forceable: "proved_true", inevitable: "proved_true" });
  });
});
