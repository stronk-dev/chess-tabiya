// rfc/longitudinal-store.md §A/§B.1 — the normative event projector. Pure and synchronous: it runs
// only inside the worker thread, the once-operator and the rebuild instrument, never on a request path.
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import {
  canonicalMoveUci,
  classifyPhase,
  legalAlternativeEdges,
  localSemanticEvents,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
  type Node,
} from "@chess-tabiya/runtime";

import {
  compareDecisionRefs,
  compareText,
  observationSortKey,
  parseLongitudinalDenominatorRow,
  parseLongitudinalObservationRow,
  parseLongitudinalStructureStatRow,
  type DecisionRef,
  type LongitudinalDecisionClass,
  type LongitudinalDenominatorRow,
  type LongitudinalObservationRow,
  type LongitudinalPhase,
  type LongitudinalStructureStatRow,
} from "./longitudinal-contract.js";
import { LONGITUDINAL_ADMITTED_IDENTITIES, OBSERVATION_DERIVATION_REV, identityKey, type AdmittedIdentity } from "./longitudinal-registry.js";
import { LongitudinalSnapshotError, type LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { rootKey } from "./progress.js";

export interface LongitudinalEdge { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }

export interface PopulationDependencies {
  readonly alternatives: (beforeFen: string, committedMoveUci: string) => readonly LongitudinalEdge[];
  readonly events: (beforeFen: string, moveUci: string, afterFen: string) => readonly { readonly projection: { readonly id: string; readonly version: number }; readonly sign: string }[] | undefined;
}

export const RUNTIME_POPULATION_DEPENDENCIES: PopulationDependencies = Object.freeze({
  alternatives: legalAlternativeEdges,
  events: localSemanticEvents,
});

export interface NormativeDecision {
  readonly ref: DecisionRef;
  readonly phase: LongitudinalPhase;
  readonly decisionClass: LongitudinalDecisionClass;
  readonly beforeFen: string;
  readonly moveUci: string;
}

export type { LongitudinalProjection } from "./longitudinal-store.js";
import type { LongitudinalProjection } from "./longitudinal-store.js";

export interface ProjectOptions {
  /** Synchronous progress checkpoint after every decision (lease renewal lives here, never a timer). */
  readonly checkpoint?: (completedDecisions: number, totalDecisions: number) => void;
  readonly dependencies?: PopulationDependencies;
  readonly derivedRev?: number;
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

function committedEdge(beforeFen: string, moveUci: string): LongitudinalEdge {
  const position = Chess.fromSetup(parseFen(beforeFen).unwrap()).unwrap();
  const canonicalBefore = makeFen(position.toSetup());
  const canonicalUci = canonicalMoveUci(beforeFen, moveUci);
  const parsed = parseUci(canonicalUci);
  if (parsed === undefined) snapshotFail("LONGITUDINAL_DECISION_MOVE_INVALID", moveUci);
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) snapshotFail("LONGITUDINAL_DECISION_MOVE_ILLEGAL", moveUci);
  const child = position.clone();
  child.play(move);
  return Object.freeze({ beforeFen: canonicalBefore, moveUci: canonicalUci, afterFen: makeFen(child.toSetup()) });
}

export type DecisionPopulation =
  | { readonly kind: "available"; readonly memberships: ReadonlyMap<string, { readonly opportunity: boolean; readonly occurred: boolean; readonly share: number }> }
  | { readonly kind: "unavailable"; readonly reason: "population_incomplete" | "forced_move" };

/** §A complete-population algebra ([[D2066]]) for one decision over every admitted identity. */
export function decisionPopulation(
  beforeFen: string,
  moveUci: string,
  identities: readonly AdmittedIdentity[] = LONGITUDINAL_ADMITTED_IDENTITIES,
  dependencies: PopulationDependencies = RUNTIME_POPULATION_DEPENDENCIES,
): DecisionPopulation {
  let alternatives: readonly LongitudinalEdge[];
  let committed: LongitudinalEdge;
  try {
    committed = committedEdge(beforeFen, moveUci);
    alternatives = dependencies.alternatives(beforeFen, moveUci);
  } catch (error) {
    if (error instanceof LongitudinalSnapshotError) throw error;
    snapshotFail("LONGITUDINAL_DECISION_MOVE_ILLEGAL", error instanceof Error ? error.message : String(error));
  }
  if (alternatives.length === 0) return Object.freeze({ kind: "unavailable", reason: "forced_move" });
  const edges = [committed, ...alternatives];
  const exhibited: Set<string>[] = [];
  for (const edge of edges) {
    let events: ReturnType<PopulationDependencies["events"]>;
    try {
      events = dependencies.events(edge.beforeFen, edge.moveUci, edge.afterFen);
    } catch {
      events = undefined;
    }
    if (events === undefined) return Object.freeze({ kind: "unavailable", reason: "population_incomplete" });
    // Multiple operands with one projection/sign on an edge deduplicate to one Boolean membership.
    exhibited.push(new Set(events.filter((event) => event.projection.version === 1).map((event) => `${event.projection.id}\0${event.sign}`)));
  }
  const memberships = new Map<string, { readonly opportunity: boolean; readonly occurred: boolean; readonly share: number }>();
  for (const identity of identities) {
    const target = `${identity.matchProjectionId}\0${identity.matchSign}`;
    let exhibiting = 0;
    let counterfactualExhibiting = 0;
    exhibited.forEach((set, index) => {
      if (!set.has(target)) return;
      exhibiting += 1;
      if (index > 0) counterfactualExhibiting += 1;
    });
    const opportunity = exhibiting > 0 && exhibiting < edges.length;
    if (!opportunity) continue;
    const playedExhibits = exhibited[0]!.has(target);
    memberships.set(identityKey(identity), Object.freeze({
      opportunity,
      occurred: identity.kind === "edge" ? playedExhibits : !playedExhibits,
      share: counterfactualExhibiting / alternatives.length,
    }));
  }
  return Object.freeze({ kind: "available", memberships });
}

function eventBranch(event: DrillRunEvent, nodes: ReadonlyMap<string, Node>): { readonly branchId: string; readonly counter: "rewound" | "forked" | "group" | "outcome" } | null {
  const resolved = (nodeId: string): string => {
    const node = nodes.get(nodeId);
    if (node === undefined) snapshotFail("LONGITUDINAL_STRUCTURE_NODE_MISSING", nodeId);
    return node.branchId;
  };
  if (event.type === "run.rewound") return { branchId: event.data.branchId, counter: "rewound" };
  if (event.type === "branch.forked") return { branchId: event.data.branch.id, counter: "forked" };
  if (event.type === "group.created") return { branchId: resolved(event.data.sourceNodeId), counter: "group" };
  if (event.type === "outcome.reached") return { branchId: resolved(event.data.nodeId), counter: "outcome" };
  return null;
}

interface StructureAccumulator { rootNodeId: string; branches: Set<string>; rewound: number; forked: number; group: number; outcome: number }

/** §B.1 root algebra: single-player only at revision 1; both unattributable arms emit nothing. */
export function structureStatistics(image: LongitudinalSourceImageV4, run: DrillRun): readonly Omit<LongitudinalStructureStatRow, "learnerId" | "runId" | "observedAt" | "derivedRev">[] {
  if (image.structureAttribution !== "single_player") return Object.freeze([]);
  const nodes = new Map(run.nodes.map((node) => [node.id, node] as const));
  const branches = new Map(run.branches.map((branch) => [branch.id, branch] as const));
  const byRoot = new Map<string, StructureAccumulator>();
  const rootFor = (branchId: string): StructureAccumulator => {
    const branch = branches.get(branchId);
    const root = branch === undefined ? undefined : nodes.get(branch.forkNodeId);
    if (branch === undefined || root === undefined) snapshotFail("LONGITUDINAL_STRUCTURE_ROOT_MISSING", branchId);
    const key = rootKey(run.sessionKind, run.packId, root.transposeKey);
    const stat = byRoot.get(key) ?? { rootNodeId: root.id, branches: new Set<string>(), rewound: 0, forked: 0, group: 0, outcome: 0 };
    stat.branches.add(branchId);
    byRoot.set(key, stat);
    return stat;
  };
  for (const branch of run.branches) rootFor(branch.id);
  for (const event of [...image.runPrefix.events].sort((left, right) => left.seq - right.seq)) {
    const subject = eventBranch(event, nodes);
    if (subject === null) continue;
    const stat = rootFor(subject.branchId);
    stat[subject.counter] += 1;
  }
  return Object.freeze([...byRoot.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, stat]) => Object.freeze({
      rootKey: key, rootNodeId: stat.rootNodeId, sessionKind: run.sessionKind,
      packId: run.sessionKind === "pack" ? run.packId : null,
      branchCount: stat.branches.size, rewoundCount: stat.rewound, forkedCount: stat.forked,
      groupCount: stat.group, outcomeCount: stat.outcome,
    })));
}

interface FamilyAccumulator {
  readonly identity: AdmittedIdentity;
  readonly phase: LongitudinalPhase;
  readonly decisionClass: LongitudinalDecisionClass;
  opportunities: number;
  occurred: number;
  share: number;
  readonly occurredRefs: DecisionRef[];
  readonly opportunityRefs: DecisionRef[];
}

/**
 * `projectObservations`: one immutable contiguous prefix → the three derived row families.
 * Denominators are computed family-independently per `(phase, decision_class)` ([[D1614]]), then
 * family numerators accumulate in ascending event order so the REAL sums are byte-deterministic.
 */
export function projectObservations(image: LongitudinalSourceImageV4, options: ProjectOptions = {}): LongitudinalProjection {
  const derivedRev = options.derivedRev ?? OBSERVATION_DERIVATION_REV;
  let run: DrillRun;
  try {
    run = readBackReplay(image.runPrefix.events).run;
  } catch (error) {
    snapshotFail("LONGITUDINAL_SOURCE_REPLAY_FAILED", error instanceof Error ? error.message : String(error));
  }
  const startedAt = image.runPrefix.events.find((event) => event.type === "run.started")?.at;
  if (startedAt === undefined) snapshotFail("LONGITUDINAL_RUN_STARTED_MISSING");
  const observedAt = new Date(Date.parse(startedAt)).toISOString();
  const learnerId = image.ownerLearnerId;
  const runId = image.runPrefix.runId;
  const decisions = normativeDecisions(image, run);
  const denominatorCounts = new Map<string, number>();
  const families = new Map<string, FamilyAccumulator>();
  decisions.forEach((decision, index) => {
    const band = `${decision.phase}\0${decision.decisionClass}`;
    denominatorCounts.set(band, (denominatorCounts.get(band) ?? 0) + 1);
    const population = decisionPopulation(decision.beforeFen, decision.moveUci, LONGITUDINAL_ADMITTED_IDENTITIES, options.dependencies);
    if (population.kind === "available") {
      for (const identity of LONGITUDINAL_ADMITTED_IDENTITIES) {
        const membership = population.memberships.get(identityKey(identity));
        if (membership === undefined) continue;
        const key = `${identityKey(identity)}\0${band}`;
        const family = families.get(key) ?? {
          identity, phase: decision.phase, decisionClass: decision.decisionClass,
          opportunities: 0, occurred: 0, share: 0, occurredRefs: [], opportunityRefs: [],
        };
        family.opportunities += 1;
        family.share += membership.share;
        family.opportunityRefs.push(decision.ref);
        if (membership.occurred) {
          family.occurred += 1;
          family.occurredRefs.push(decision.ref);
        }
        families.set(key, family);
      }
    }
    options.checkpoint?.(index + 1, decisions.length);
  });
  const sessionKind = run.sessionKind;
  const packId = sessionKind === "pack" ? run.packId : null;
  const denominators = [...denominatorCounts.entries()]
    .map(([band, decisionsInBand]) => {
      const [phase, decisionClass] = band.split("\0") as [LongitudinalPhase, LongitudinalDecisionClass];
      return parseLongitudinalDenominatorRow({ learnerId, runId, phase, decisionClass, decisions: decisionsInBand, observedAt, derivedRev });
    })
    .sort((left, right) => compareText(`${left.phase}\0${left.decisionClass}`, `${right.phase}\0${right.decisionClass}`));
  const observations = [...families.values()]
    .map((family) => parseLongitudinalObservationRow({
      learnerId, runId, phase: family.phase, decisionClass: family.decisionClass,
      decisions: denominatorCounts.get(`${family.phase}\0${family.decisionClass}`)!,
      observedAt, derivedRev,
      projectionId: family.identity.projectionId, projectionVersion: family.identity.projectionVersion,
      semanticSign: family.identity.semanticSign, sourceSign: family.identity.sourceSign,
      sessionKind, packId, opportunities: family.opportunities, occurred: family.occurred,
      alternativeShareSum: family.share, occurredRefs: family.occurredRefs, opportunityRefs: family.opportunityRefs,
    }))
    .sort((left, right) => compareText(observationSortKey(left), observationSortKey(right)));
  const structureStats = structureStatistics(image, run).map((row) => parseLongitudinalStructureStatRow({ ...row, learnerId, runId, observedAt, derivedRev }));
  return Object.freeze({ denominators: Object.freeze(denominators), observations: Object.freeze(observations), structureStats: Object.freeze(structureStats) });
}
