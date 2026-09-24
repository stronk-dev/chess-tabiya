import { branchPath } from "./branch-path.js";
import { renderEndgameClassification, type EndgameClassification } from "./endgame.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import { pivotalMarkerEvidenceItems, renderPivotalMarker, type PivotalKind, type PivotalMarker } from "./pivotal.js";
import { renderShapeFiring, type ShapeTriggerSource } from "./shape-firing.js";
import type { DrillRun, Node, RunOutcome } from "./types.js";
import { assertConsumerEvidenceView, evidenceForConsumer, renderEvidenceItems, type ConsumerEvidenceView, type DeclaredEvidence, type EvidenceRendererRegistry, type RenderedEvidenceView } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

export type StoryMomentKind = PivotalKind | "eval_pivot" | "last_level" | "endgame_entry" | "shape_span" | "outcome";
export interface StoryEvaluation {
  readonly centipawns: number;
  readonly engineId: string;
  readonly requestedMovetimeMs?: number;
}
export interface StoryMoment {
  readonly nodeId: string;
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly sentences: readonly string[];
  readonly evidence: readonly DeclaredEvidence<unknown>[];
  readonly evalBefore?: StoryEvaluation;
  readonly evalAfter?: StoryEvaluation;
  readonly phase: DetectedPhase;
  readonly endgame?: EndgameClassification;
}
export interface StoryProjection { readonly moments: readonly StoryMoment[]; readonly rank: readonly string[]; readonly evidence: readonly DeclaredEvidence<unknown>[]; }
export interface StoryTitleInput { readonly side: "white" | "black"; readonly outcome: { readonly kind: "board_terminal" | "recorded_result" | "unfinished"; readonly result?: RunOutcome | "1-0" | "0-1" | "1/2-1/2" | "*" }; readonly moments: readonly StoryMoment[]; readonly rank: readonly string[]; }
export const STORY_MATE_CP = 1000;
export const STORY_PIVOT_CP = 150;
const STORY_MOMENT_PRIORITY: Readonly<Record<StoryMomentKind, number>> = Object.freeze({
  outcome: 0,
  eval_pivot: 1,
  last_level: 2,
  phase_change: 3,
  endgame_entry: 4,
  shape_span: 6,
  human_divergence: 7,
  option_collapse: 7,
  irreversibility: 8,
});
const ref = (id: string) => ({ id, version: 1 } as const);

type StoryRenderable = Pick<DeclaredEvidence<unknown>, "projection" | "payload">;

function renderRecordedOutcome(evidence: StoryRenderable): readonly string[] {
  const payload = evidence.payload as { readonly context?: unknown; readonly terminal?: unknown; readonly outcome?: unknown; readonly result?: unknown };
  if (payload.context !== "story") throw new TypeError(`${evidence.projection.id} has the wrong rendering context`);
  if (evidence.projection.id === "run.record.imported_result") return Object.freeze([`The PGN records the game result as ${String(payload.result)}; the board is not terminal here.`]);
  if (payload.terminal !== true) throw new TypeError("Story consequence omitted its board-terminal state");
  return Object.freeze([`Board-terminal result for the learner: ${String(payload.outcome)}.`]);
}

function signedStoryPawns(centipawns: number): string {
  if (!Number.isSafeInteger(centipawns)) throw new TypeError("Story evaluation must be a safe centipawn integer");
  const pawns = centipawns / 100;
  return `${pawns >= 0 ? "+" : "−"}${Math.abs(pawns).toFixed(2)}`;
}

/** Renders the learner-oriented operands stored by Story without leaking centipawn protocol units. */
export function renderStoryEvaluationChange(after: StoryEvaluation, deltaCentipawns: number): string {
  if (typeof after.engineId !== "string" || after.engineId.length === 0) throw new TypeError("Story evaluation omitted its engine identity");
  const delta = signedStoryPawns(deltaCentipawns);
  const search = after.requestedMovetimeMs === undefined ? "" : `, ${after.requestedMovetimeMs} ms`;
  return `Recorded evaluation change from the learner's side: ${delta} pawns across this move (${after.engineId}${search}).`;
}

/** Renders the two learner-oriented Story readings used by the visible trajectory. */
export function renderStoryEvaluationTrajectory(beforeCentipawns: number, afterCentipawns: number): string {
  return `Recorded evaluation from the learner's side: ${signedStoryPawns(beforeCentipawns)} → ${signedStoryPawns(afterCentipawns)} pawns.`;
}

function renderStoryEvalShift(evidence: StoryRenderable): readonly string[] {
  const payload = evidence.payload as { readonly after?: StoryEvaluation; readonly delta?: unknown };
  if (payload.after === undefined || !Number.isSafeInteger(payload.delta)) throw new TypeError("Story evaluation shift omitted structured operands");
  return Object.freeze([renderStoryEvaluationChange(payload.after, payload.delta as number)]);
}

const renderMarker = (evidence: StoryRenderable) => renderPivotalMarker(evidence.payload as PivotalMarker);
const STORY_PAYLOAD_RENDERERS: Readonly<Record<string, (evidence: StoryRenderable) => readonly string[]>> = Object.freeze({
  "derived.pivotal.irreversibility@1": renderMarker,
  "derived.pivotal.phase_change@1": renderMarker,
  "derived.pivotal.human_divergence@1": renderMarker,
  "derived.pivotal.option_collapse@1": renderMarker,
  "theory.shapes.firing@1": (evidence) => renderShapeFiring(evidence.payload as Parameters<typeof renderShapeFiring>[0]),
  "run.record.consequence@1": renderRecordedOutcome,
  "run.record.imported_result@1": renderRecordedOutcome,
  "rules.endgame.classification@1": (evidence) => renderEndgameClassification(evidence.payload as EndgameClassification),
  "derived.story.eval_shift@1": renderStoryEvalShift,
  "derived.story.last_level@1": () => Object.freeze(["The last recorded moment within a pawn of level — Tabiya's recorded-evaluation convention."]),
  "derived.story.rank@1": () => Object.freeze([]),
  "derived.story.title@1": (evidence) => { const title = (evidence.payload as { readonly title?: unknown }).title; if (typeof title !== "string") throw new TypeError("Story title payload omitted title"); return Object.freeze([title]); },
});
const REVIEW_STORY_RENDERERS: EvidenceRendererRegistry = STORY_PAYLOAD_RENDERERS;

export function renderReviewStoryEvidence(view: ConsumerEvidenceView<unknown>): RenderedEvidenceView<unknown> {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "review.story" || view.consumer.version !== 1) throw new TypeError("Expected review.story@1 consumer view");
  return renderEvidenceItems(view, REVIEW_STORY_RENDERERS);
}

/**
 * Re-renders review-story evidence carried across a JSON boundary, for a byte-consistency check of
 * the server's sentences only. Transport payloads are NEVER sealed or admitted as evidence here:
 * rfc/evidence-value-authority.md removes every caller-payload rehydration route. Each item must
 * name an exact producer/projection pair that review.story@1 binds.
 */
export function renderSerializedReviewStoryEvidence(values: readonly unknown[]): readonly string[] {
  if (!Array.isArray(values)) throw new TypeError("Serialized Story evidence must be an array");
  const bound = new Set(PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.consumer.id === "review.story" && binding.consumer.version === 1).map((binding) => `${binding.producer.id}@${binding.producer.version}:${binding.projection.id}@${binding.projection.version}`));
  const sentences = values.flatMap((value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("Serialized Story evidence must be an object");
    const item = value as Record<string, unknown>;
    if (Object.keys(item).some((key) => !["producer", "projection", "payload"].includes(key)) || !("payload" in item)) throw new TypeError("Serialized Story evidence has an open shape");
    const versioned = (candidate: unknown, label: string): { readonly id: string; readonly version: number } => {
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) throw new TypeError(`Serialized Story ${label} is invalid`);
      const record = candidate as Record<string, unknown>;
      if (Object.keys(record).some((key) => key !== "id" && key !== "version") || typeof record.id !== "string" || !Number.isSafeInteger(record.version)) throw new TypeError(`Serialized Story ${label} is invalid`);
      return { id: record.id, version: record.version as number };
    };
    const producer = versioned(item.producer, "producer");
    const projection = versioned(item.projection, "projection");
    const key = `${producer.id}@${producer.version}:${projection.id}@${projection.version}`;
    if (!bound.has(key)) throw new TypeError(`Serialized Story evidence ${key} is not bound to review.story@1`);
    if (typeof item.payload !== "object" || item.payload === null || Array.isArray(item.payload)) throw new TypeError("Serialized Story payload must be an object");
    return STORY_PAYLOAD_RENDERERS[`${projection.id}@${projection.version}`]!({ projection, payload: item.payload });
  });
  return Object.freeze([...new Set(sentences)]);
}

function reviewStoryEvidence(declared: readonly DeclaredEvidence<unknown>[]): RenderedEvidenceView<unknown> {
  return renderReviewStoryEvidence(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("review.story"), declared));
}

export function suggestTitle(story: StoryTitleInput): string {
  const top = story.moments.find((moment) => moment.nodeId === story.rank[0]) ?? story.moments[0];
  const move = top === undefined ? "the finish" : `move ${Math.max(1, Math.ceil(top.ply / 2))}`;
  const family = top?.endgame?.type?.label;
  const result = story.outcome.result;
  const recordedLoss = result === "1-0" || result === "0-1" ? learnerLost(result, story.side) : false;
  const recordedWin = (result === "1-0" || result === "0-1") && !recordedLoss;
  const verb = result === "draw" || result === "1/2-1/2" ? "Held" : result === "win" || recordedWin ? "Won" : result === "loss" || recordedLoss ? "The turning point" : "A game story";
  return family === undefined ? `${verb} at ${move}` : `${verb} from the ${family.toLowerCase()} at ${move}`;
}

export function storyDeclaredEvidence(story: StoryTitleInput & { readonly evidence?: readonly DeclaredEvidence<unknown>[] }): readonly DeclaredEvidence<unknown>[] {
  const carried = story.evidence ?? story.moments.flatMap((moment) => moment.evidence);
  const rank = carried.find((item) => item.projection.id === "derived.story.rank" && item.projection.version === 1)
    ?? invokeEvidenceValueRoute("derived.story.rank@1", { moments: story.moments });
  const title = invokeEvidenceValueRoute("derived.story.title@1", { story: { side: story.side, outcome: story.outcome, moments: story.moments, rank: story.rank }, rank: rank as DeclaredEvidence<{ readonly rank: readonly string[] }> });
  return Object.freeze([title, ...carried]);
}

export function reviewStoryTitle(story: StoryTitleInput): string {
  const titleEvidence = storyDeclaredEvidence(story)[0]!;
  return reviewStoryEvidence([titleEvidence]).items[0]!.sentences[0]!;
}

/** Ranks only for bounded selection. Irreversibility alone is deliberately the final family. */
export function rankStoryMoments(moments: readonly StoryMoment[]): readonly string[] {
  const priority = (moment: StoryMoment): number => moment.kinds.length === 0
    ? 7
    : Math.min(...moment.kinds.map((kind) => STORY_MOMENT_PRIORITY[kind]));
  return Object.freeze([...moments]
    .sort((left, right) => priority(left) - priority(right)
      || Math.abs((right.evalAfter?.centipawns ?? 0) - (right.evalBefore?.centipawns ?? 0))
        - Math.abs((left.evalAfter?.centipawns ?? 0) - (left.evalBefore?.centipawns ?? 0))
      || left.ply - right.ply)
    .map((moment) => moment.nodeId));
}

const STORY_SOURCE_LABELS = Object.freeze({
  position_rules: "Board rules",
  declared_convention: "Tabiya convention",
  bounded_search: "Recorded engine analysis",
  tablebase_exact: "Exact tablebase",
  human_model: "Human-move model",
  human_corpus: "Human game corpus",
  cited_theory: "Cited chess theory",
  authored_claim: "Authored catalogue",
  recorded_run: "Recorded game",
} as const);

/** The learner-facing label of one declared grounding class, shared by story and review footers. */
export function evidenceGroundingLabel(grounding: keyof typeof STORY_SOURCE_LABELS): string {
  return STORY_SOURCE_LABELS[grounding];
}

/** Resolves each admitted story fact to the leaf grounding sources declared by the evidence manifest. */
export function storyEvidenceSourceLabels(
  moment: Pick<StoryMoment, "evidence">,
): readonly string[] {
  const byProjection = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));
  const labels = new Set<string>();
  const visiting = new Set<string>();
  const visit = (projectionId: string, version: number): void => {
    const key = `${projectionId}@${version}`;
    if (visiting.has(key)) return;
    const projection = byProjection.get(key);
    if (projection === undefined) throw new TypeError(`Story evidence names undeclared projection ${key}`);
    visiting.add(key);
    if (projection.plane === "derived" && projection.derivation?.inputs !== undefined) {
      for (const input of projection.derivation.inputs) visit(input.id, input.version);
    } else {
      labels.add(STORY_SOURCE_LABELS[projection.grounding]);
    }
    visiting.delete(key);
  };
  for (const evidence of moment.evidence) visit(evidence.projection.id, evidence.projection.version);
  return Object.freeze([...labels]);
}

/** The learner-side recorded engine evaluation at one node, from the run's engine_validated events. */
export function storyEvaluation(run: DrillRun, node: Node): StoryEvaluation | undefined {
  const event = [...run.events].reverse().find((candidate) =>
    candidate.type === "evidence.attached" && candidate.data.nodeId === node.id &&
    candidate.data.payload.kind === "eval" && candidate.data.payload.source === "engine_validated",
  );
  if (event?.type !== "evidence.attached") return undefined;
  const values = event.data.payload.values;
  let cp: number | undefined;
  if (Number.isSafeInteger(values.centipawns)) cp = values.centipawns as number;
  else if (Number.isSafeInteger(values.mateIn)) cp = (values.mateIn as number) < 0 ? -STORY_MATE_CP : STORY_MATE_CP;
  if (cp === undefined) return undefined;
  const sideToMove = node.fen.split(" ")[1] === "w" ? "white" : "black";
  // The Stockfish evidence executor declares White's perspective; readings without a declared
  // perspective follow the recorded-run convention (side to move).
  const orientedBy = values.perspective === "white" ? "white" : sideToMove;
  const learnerCp = Math.max(-STORY_MATE_CP, Math.min(STORY_MATE_CP, orientedBy === run.start.side ? cp : -cp));
  return Object.freeze({
    centipawns: learnerCp,
    engineId: typeof values.engineId === "string" ? values.engineId : "recorded engine",
    ...(Number.isSafeInteger(values.requestedMovetimeMs) ? { requestedMovetimeMs: values.requestedMovetimeMs as number } : {}),
  });
}

function learnerLost(result: "1-0" | "0-1" | "1/2-1/2" | "*" | undefined, side: "white" | "black"): boolean {
  return (side === "white" && result === "0-1") || (side === "black" && result === "1-0");
}

export function storyMoments(
  run: DrillRun,
  branchId: string,
  options: { readonly shapes?: readonly ShapeTriggerSource[]; readonly recordedResult?: "1-0" | "0-1" | "1/2-1/2" | "*" } = {},
): StoryProjection {
  const path = branchPath(run, branchId);
  const byId = new Map(path.map((node) => [node.id, node]));
  const accum = new Map<string, { kinds: Set<StoryMomentKind>; evidence: DeclaredEvidence<unknown>[]; before?: StoryEvaluation; after?: StoryEvaluation; endgame?: EndgameClassification }>();
  const item = (nodeId: string) => {
    let value = accum.get(nodeId);
    if (value === undefined) { value = { kinds: new Set(), evidence: [] }; accum.set(nodeId, value); }
    return value;
  };
  for (const marker of pivotalMarkerEvidenceItems(run, branchId)) {
    const value = item(marker.payload.nodeId); value.kinds.add(marker.payload.kind); value.evidence.push(marker);
  }
  for (const shift of invokeEvidenceValueRoute("derived.story.eval_shift@1", { run, branchId })) {
    const payload = shift.evidence.payload as { readonly before: StoryEvaluation; readonly after: StoryEvaluation };
    const value = item(shift.nodeId); value.kinds.add("eval_pivot"); value.before = payload.before; value.after = payload.after;
    value.evidence.push(shift.evidence);
  }
  if (options.recordedResult !== undefined && options.recordedResult !== "*") {
    for (const level of invokeEvidenceValueRoute("derived.story.last_level@1", { run, branchId, recordedResult: options.recordedResult })) {
      const value = item(level.nodeId); value.kinds.add("last_level"); value.evidence.push(level.evidence);
    }
  }
  for (const node of path) {
    const reading = invokeEvidenceValueRoute("rules.endgame.classification@1", { fen: node.fen })[0];
    if (reading !== undefined) { const value = item(node.id); value.kinds.add("endgame_entry"); value.endgame = reading.payload as EndgameClassification; value.evidence.push(reading); break; }
  }
  for (const firing of invokeEvidenceValueRoute("theory.shapes.firing@1", { entries: options.shapes ?? [], path: path.map((node) => ({ id: node.id, fen: node.fen })) })) {
    const value = item((firing.payload as { readonly firstNodeId: string }).firstNodeId); value.kinds.add("shape_span"); value.evidence.push(firing);
  }
  const outcome = [...run.events].reverse().find((event) => event.type === "outcome.reached" && byId.has(event.data.nodeId));
  const consequence = invokeEvidenceValueRoute("run.record.consequence@1", { run, branchId })[0];
  if (consequence !== undefined) {
    const value = item(consequence.nodeId); value.kinds.add("outcome"); value.evidence.push(consequence.evidence);
  } else if (options.recordedResult !== undefined && options.recordedResult !== "*") {
    const imported = invokeEvidenceValueRoute("run.record.imported_result@1", { run, branchId, recordedResult: options.recordedResult })[0]!;
    const value = item(imported.nodeId); value.kinds.add("outcome"); value.evidence.push(imported.evidence);
  }
  const moments = [...accum.entries()].flatMap(([nodeId, value]) => {
    const node = byId.get(nodeId); if (node === undefined) return [];
    const terminal = value.kinds.has("outcome") && outcome?.type === "outcome.reached" && outcome.data.nodeId === nodeId;
    const rendered = reviewStoryEvidence(value.evidence);
    return [Object.freeze({
      nodeId,
      entryNodeId: terminal ? (node.parentId ?? node.id) : node.id,
      ply: node.ply,
      san: node.moveSan,
      fen: node.fen,
      kinds: Object.freeze([...value.kinds].sort()),
      sentences: Object.freeze([...new Set(rendered.items.flatMap((entry) => entry.sentences))]),
      evidence: Object.freeze(rendered.items.map((entry) => entry.evidence)),
      ...(value.before === undefined ? {} : { evalBefore: value.before }),
      ...(value.after === undefined ? {} : { evalAfter: value.after }),
      phase: classifyPhase(node.fen).phase,
      ...(value.endgame === undefined ? {} : { endgame: value.endgame }),
    })];
  }).sort((left, right) => left.ply - right.ply || left.nodeId.localeCompare(right.nodeId));
  const rank = rankStoryMoments(moments);
  const rankEvidence = invokeEvidenceValueRoute("derived.story.rank@1", { moments });
  if ((rankEvidence.payload as { readonly rank: readonly string[] }).rank.join("|") !== rank.join("|")) throw new TypeError("Story rank factory disagrees with the moment ranking");
  const renderedRank = reviewStoryEvidence([rankEvidence]);
  const admittedRank = (renderedRank.items[0]!.evidence.payload as { readonly rank: readonly string[] }).rank;
  const evidence = Object.freeze([...moments.flatMap((moment) => moment.evidence), renderedRank.items[0]!.evidence]);
  return Object.freeze({ moments: Object.freeze(moments), rank: Object.freeze(admittedRank), evidence });
}
