// rfc/longitudinal-store.md §B.1 — the closed decision algebra over one exact prefix. It is cheap
// (no legal-move population, no semantic census), so both the worker's projector and the HTTP-side
// profile consumer share this one authority for *which* decisions are the owner's; the population
// enumeration stays in `longitudinal-projector.ts`, off the HTTP process module graph.
import { classifyPhase, type DrillRun } from "@chess-tabiya/runtime";

import {
  compareDecisionRefs,
  type DecisionRef,
  type LongitudinalDecisionClass,
  type LongitudinalPhase,
} from "./longitudinal-contract.js";
import { LongitudinalSnapshotError, type LongitudinalSourceImageV4 } from "./longitudinal-source.js";

export interface NormativeDecision {
  readonly ref: DecisionRef;
  readonly phase: LongitudinalPhase;
  readonly decisionClass: LongitudinalDecisionClass;
  readonly beforeFen: string;
  readonly moveUci: string;
}

function snapshotFail(code: string, detail?: string): never {
  throw new LongitudinalSnapshotError(code, detail);
}

/** §B.1 rules 1–4: the closed decision algebra over one exact prefix. */
export function normativeDecisions(image: LongitudinalSourceImageV4, run: DrillRun): readonly NormativeDecision[] {
  const nodes = new Map(run.nodes.map((node) => [node.id, node] as const));
  const authorship = new Map(image.moveAuthorship.map((row) => [row.eventSeq, row] as const));
  const primaryBranchId = run.branches[0]?.id;
  const decisions: NormativeDecision[] = [];
  const predictionKeys = new Set<string>();
  const ownerAuthored = (seq: number): boolean => authorship.get(seq)?.learnerId === image.ownerLearnerId;
  // Predictions carry no actor id at HEAD ([[D1510]]): provable only on a run that provably never
  // shared write access. A pre-migration legacy run cannot prove that, so its predictions abstain
  // even where its journal-less move commits resolve to the owner (§B.1 rule 1).
  const predictionsProvable = image.structureAttribution === "single_player";
  const events = [...image.runPrefix.events].sort((left, right) => left.seq - right.seq);
  for (const event of events) {
    if (event.type === "move.committed") {
      const node = event.data.node;
      if (node.actor !== "user" || node.parentId === null) continue;
      if (!ownerAuthored(event.seq)) continue;
      const parent = nodes.get(node.parentId);
      if (parent === undefined || node.moveUci === null) snapshotFail("LONGITUDINAL_DECISION_NODE_MISSING", node.id);
      const game = run.sessionKind === "imported" && image.importedMainlinePlies !== null
        && node.branchId === primaryBranchId && node.ply <= image.importedMainlinePlies;
      decisions.push(Object.freeze({
        ref: Object.freeze({ kind: "move", nodeId: node.id, eventSeq: event.seq }),
        phase: classifyPhase(parent.fen).phase,
        decisionClass: game ? "game" : "played",
        beforeFen: parent.fen,
        moveUci: node.moveUci,
      }));
    } else if (event.type === "prediction.recorded") {
      if (!predictionsProvable) continue;
      const key = `${event.data.nodeId}\0${event.data.checkpointId}`;
      if (predictionKeys.has(key)) continue;
      predictionKeys.add(key);
      const node = nodes.get(event.data.nodeId);
      if (node === undefined) snapshotFail("LONGITUDINAL_PREDICTION_NODE_MISSING", event.data.nodeId);
      decisions.push(Object.freeze({
        ref: Object.freeze({ kind: "prediction", nodeId: node.id, checkpointId: event.data.checkpointId, eventSeq: event.seq }),
        phase: classifyPhase(node.fen).phase,
        decisionClass: "predicted",
        beforeFen: node.fen,
        moveUci: event.data.predictedUci,
      }));
    }
  }
  return Object.freeze(decisions.sort((left, right) => compareDecisionRefs(left.ref, right.ref)));
}
