// rfc/module-registration.md §4.5 — Post-commit Nudge, the first production caller of the module
// layer at the post_commit timing. For one committed learner move it offers the module exactly the
// evidence a production operation can seal today — the one-edge semantic closure of that edge and,
// when both recorded evaluations exist, `derived.grade.move_quality@1` — and lets
// `compileModulePacket` admit, order, deduplicate and backstop it (maxFacts 2). Every sentence is a
// fixed template over retained operands or the grade's own grounding sentence; no chess judgement
// is authored here, and silence is the declared empty state.

import { branchPath } from "./branch-path.js";
import type { DeclaredEvidence, EvidenceGrounding, EvidenceRole } from "./evidence-contract.js";
import { assertMoveQualityGradeSentence, renderMoveQualityGrade, type GradeSide, type MoveQualityGrade } from "./grade.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { compileModulePacket, type ModulePacketRefusal } from "./module-packets.js";
import type { ModuleFact, ReductionQualityRecorder } from "./module-reducers.js";
import { localSemanticEventClosure } from "./semantic-evidence.js";
import { evidenceGroundingLabel } from "./story.js";
import type { DrillRun, EvidencePayload, Node } from "./types.js";

export const POSTCOMMIT_NUDGE_TEMPLATES = Object.freeze({
  /** The shipped guard's frame (§4.5: kept as the module's card frame). */
  headline: "The consequence exposed something concrete.",
  closing: "Your played line stays preserved.",
  relation: "Recorded from this move: {family} ({projection}; {source}).",
} as const);

export interface PostcommitNudgeFact {
  /** Exact `id@version` of the admitted projection. */
  readonly projection: string;
  readonly sentence: string;
  readonly source: string;
}

export type PostcommitNudgePacket =
  | { readonly kind: "refused"; readonly nodeId: string; readonly reason: ModulePacketRefusal | "not_a_learner_move" | "unknown_node" }
  | {
      readonly kind: "packet";
      readonly nodeId: string;
      /** Empty is the declared `silent` behaviour: no seat, no all-clear. */
      readonly facts: readonly PostcommitNudgeFact[];
      readonly headline: string | null;
      readonly closing: string | null;
      readonly receipt: { readonly offered: number; readonly admitted: number; readonly afterReducers: number; readonly noveltyAbstained: boolean };
    };

export interface PostcommitNudgeInput {
  readonly run: DrillRun;
  readonly nodeId: string;
  readonly role: EvidenceRole;
  readonly session: string;
  readonly recorder?: ReductionQualityRecorder;
}

function evaluationPacket(run: DrillRun, nodeId: string): EvidencePayload | undefined {
  const event = [...run.events].reverse().find((candidate) =>
    candidate.type === "evidence.attached" && candidate.data.nodeId === nodeId &&
    candidate.data.payload.kind === "eval" && candidate.data.payload.source === "engine_validated");
  if (event?.type !== "evidence.attached") return undefined;
  const { kind, source, values } = event.data.payload;
  return Object.freeze({ kind, source, values });
}

/** The evidence a production operation can seal for one committed edge today. */
export function postcommitEdgeEvidence(run: DrillRun, parent: Node, node: Node): readonly DeclaredEvidence<unknown>[] {
  const events = localSemanticEventClosure(parent.fen, node.moveUci!, node.fen).events.map((event) => event.evidence);
  const before = evaluationPacket(run, parent.id);
  const after = evaluationPacket(run, node.id);
  if (before === undefined || after === undefined) return Object.freeze(events);
  const mover: GradeSide = parent.fen.split(" ")[1] === "b" ? "black" : "white";
  const graded = invokeEvidenceValueRoute("derived.grade.move_quality@1", {
    before: invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: before }),
    after: invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: after }),
    mover, context: "drill",
  });
  return Object.freeze([...(graded.kind === "available" ? graded.value : []), ...events]);
}

const familyOf = (projectionId: string): string => (projectionId.split(".").at(-1) ?? projectionId).replaceAll("_", " ");

function renderFact(fact: ModuleFact): PostcommitNudgeFact {
  const projection = `${fact.projection.id}@${fact.projection.version}`;
  const source = evidenceGroundingLabel(fact.projection.grounding as Exclude<EvidenceGrounding, never>);
  if (projection === "derived.grade.move_quality@1") {
    const grade = fact.evidence.payload as MoveQualityGrade;
    const sentence = renderMoveQualityGrade(grade);
    assertMoveQualityGradeSentence(grade, sentence);
    return Object.freeze({ projection, sentence, source });
  }
  const sentence = POSTCOMMIT_NUDGE_TEMPLATES.relation
    .replace("{family}", familyOf(fact.projection.id)).replace("{projection}", projection).replace("{source}", source);
  return Object.freeze({ projection, sentence, source });
}

/** The admitted (unreduced) facts of one earlier learner edge, for bounded novelty. */
function ancestorFacts(input: PostcommitNudgeInput, path: readonly Node[], index: number): readonly ModuleFact[] {
  const node = path[index]!;
  const parent = path[index - 1]!;
  const packet = compileModulePacket({ module: "postcommit_nudge", timing: "post_commit", role: input.role, session: input.session, evidence: postcommitEdgeEvidence(input.run, parent, node), mode: "admit" });
  return packet.kind === "packet" ? packet.facts : Object.freeze([]);
}

/** Post-commit Nudge for the learner move at `nodeId` (`module.postcommit_nudge@1`). */
export function postcommitNudgePacket(input: PostcommitNudgeInput): PostcommitNudgePacket {
  const node = input.run.nodes.find((candidate) => candidate.id === input.nodeId);
  if (node === undefined) return Object.freeze({ kind: "refused" as const, nodeId: input.nodeId, reason: "unknown_node" as const });
  const path = branchPath(input.run, node.branchId);
  const index = path.findIndex((candidate) => candidate.id === node.id);
  if (node.actor !== "user" || node.moveUci === null || index < 1) return Object.freeze({ kind: "refused" as const, nodeId: node.id, reason: "not_a_learner_move" as const });
  const window = 3;
  const ancestors: (readonly ModuleFact[])[] = [];
  for (let cursor = index - 1; cursor >= 1 && ancestors.length < window; cursor -= 1) {
    if (path[cursor]!.actor === "user" && path[cursor]!.moveUci !== null) ancestors.push(ancestorFacts(input, path, cursor));
  }
  const packet = compileModulePacket({
    module: "postcommit_nudge", timing: "post_commit", role: input.role, session: input.session,
    evidence: postcommitEdgeEvidence(input.run, path[index - 1]!, node), ancestorFacts: ancestors,
    ...(input.recorder === undefined ? {} : { recorder: input.recorder }),
  });
  if (packet.kind === "refused") return Object.freeze({ kind: "refused" as const, nodeId: node.id, reason: packet.reason });
  const facts = Object.freeze(packet.facts.map(renderFact));
  return Object.freeze({
    kind: "packet" as const, nodeId: node.id, facts,
    headline: facts.length === 0 ? null : POSTCOMMIT_NUDGE_TEMPLATES.headline,
    closing: facts.length === 0 ? null : POSTCOMMIT_NUDGE_TEMPLATES.closing,
    receipt: Object.freeze({ offered: packet.offered, admitted: packet.admitted, afterReducers: packet.afterReducers, noveltyAbstained: packet.noveltyAbstained }),
  });
}
