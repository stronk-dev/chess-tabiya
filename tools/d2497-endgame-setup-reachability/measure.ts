import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildOnePlyControl, type TablebaseControl } from "./control.js";
import { quantifiedReachability } from "./reachability.js";

const fixturePath = resolve(process.argv[2] ?? "tools/d2497-endgame-setup-reachability/fixtures.json");
const outputPath = resolve(process.argv[3] ?? "planning/endgame-setup-reachability/results.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
  readonly schema: string;
  readonly fetchedAt: string;
  readonly source: string;
  readonly controls: readonly TablebaseControl[];
};

const controls = fixture.controls.map((control) => {
  const built = buildOnePlyControl(control);
  return Object.freeze({
    id: control.id,
    technique: control.technique,
    beneficiary: control.beneficiary,
    rootFen: control.fen,
    rootOutcome: built.rootOutcome,
    legalMoves: built.legalMoves,
    exactOutcomePreservingMoves: built.outcomePreservingMoves,
    targetMoves: built.targetMoves,
    withinOnePly: quantifiedReachability(built.root, { claimHorizon: 1, searchPlyBudget: 1 }),
    unboundedQuestionWithOnePlySearch: quantifiedReachability(built.root, { claimHorizon: null, searchPlyBudget: 1 }),
  });
});

const report = Object.freeze({
  schema: "tabiya.research.endgame-setup-reachability.v1",
  boundary: "Exact one-ply setup reachability on complete tablebase root move sets; no eventual reachability, best-method or advice claim",
  sourceSnapshot: Object.freeze({ fixtureSchema: fixture.schema, fetchedAt: fixture.fetchedAt, endpoint: fixture.source }),
  proofVocabulary: Object.freeze(["proved_true", "proved_false", "unknown_horizon", "unknown_provider"]),
  constraints: Object.freeze({ targetConvention: "d2495.canonical-krpkr-geometry.v1", edgeFilter: "exact beneficiary WDL preservation", finiteClaimHorizonPlies: 1, operationalSearchBudgetPlies: 1 }),
  nodeBudget: Object.freeze({ maximumVisitedPerControl: Math.max(...controls.map((control) => control.withinOnePly.visitedNodes)), totalVisitedFiniteControls: controls.reduce((total, control) => total + control.withinOnePly.visitedNodes, 0) }),
  controls: Object.freeze(controls),
});

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`endgame-setup-reachability: ${controls.length} complete roots; ${report.nodeBudget.totalVisitedFiniteControls} visited nodes\n`);
