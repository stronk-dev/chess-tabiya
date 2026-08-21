import { branchPath } from "./branch-path.js";
import { endgameReading, renderEndgameReading, type EndgameReading } from "./endgame.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import { pivotalMarkers, renderPivotalMarker, type PivotalKind } from "./pivotal.js";
import { shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import type { DrillRun, Node, RunOutcome } from "./types.js";
import { assertConsumerEvidenceView, declareEvidence, evidenceForConsumer, renderEvidenceItems, type ConsumerEvidenceView, type DeclaredEvidence, type EvidenceRendererRegistry, type RenderedEvidenceView } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";

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
  readonly endgame?: EndgameReading;
}
export interface StoryProjection { readonly moments: readonly StoryMoment[]; readonly rank: readonly string[]; readonly evidence: readonly DeclaredEvidence<unknown>[]; }
export interface StoryTitleInput { readonly outcome: { readonly kind: "board_terminal" | "recorded_result" | "unfinished"; readonly result?: RunOutcome | "1-0" | "0-1" | "1/2-1/2" | "*" }; readonly moments: readonly StoryMoment[]; readonly rank: readonly string[]; }
export const STORY_MATE_CP = 1000;
export const STORY_PIVOT_CP = 150;
const ref = (id: string) => ({ id, version: 1 } as const);
const sentenceEvidence = (projection: string, sentence: string, values: Readonly<Record<string, unknown>> = {}): DeclaredEvidence<unknown> => declareEvidence(ref("derived.story"), ref(projection), Object.freeze({ ...values, sentence }));

function recordedSentence(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const sentence = (evidence.payload as { readonly sentence?: unknown }).sentence;
  if (typeof sentence !== "string") throw new TypeError(`${evidence.projection.id} omitted its registered sentence`);
  return Object.freeze([sentence]);
}

const REVIEW_STORY_RENDERERS: EvidenceRendererRegistry = Object.freeze({
  "rules.pivotal.marker@1": (evidence) => renderPivotalMarker(evidence.payload as Parameters<typeof renderPivotalMarker>[0]),
  "theory.shapes.firing@1": (evidence) => { const firing = evidence.payload as { readonly id: string; readonly entryId?: string }; return Object.freeze([`Shape ${firing.entryId ?? firing.id} begins here under its recorded catalogue trigger.`]); },
  "run.record.consequence@1": recordedSentence,
  "run.record.imported_result@1": recordedSentence,
  "rules.endgame.reading@1": (evidence) => renderEndgameReading(evidence.payload as EndgameReading),
  "derived.story.eval_shift@1": recordedSentence,
  "derived.story.last_level@1": recordedSentence,
  "derived.story.rank@1": () => Object.freeze([]),
  "derived.story.title@1": (evidence) => { const title = (evidence.payload as { readonly title?: unknown }).title; if (typeof title !== "string") throw new TypeError("Story title payload omitted title"); return Object.freeze([title]); },
});

export function renderReviewStoryEvidence(view: ConsumerEvidenceView<unknown>): RenderedEvidenceView<unknown> {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "review.story" || view.consumer.version !== 1) throw new TypeError("Expected review.story@1 consumer view");
  return renderEvidenceItems(view, REVIEW_STORY_RENDERERS);
}

function reviewStoryEvidence(declared: readonly DeclaredEvidence<unknown>[]): RenderedEvidenceView<unknown> {
  return renderReviewStoryEvidence(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("review.story"), declared));
}

export function suggestTitle(story: StoryTitleInput): string {
  const top = story.moments.find((moment) => moment.nodeId === story.rank[0]) ?? story.moments[0];
  const move = top === undefined ? "the finish" : `move ${Math.max(1, Math.ceil(top.ply / 2))}`;
  const family = top?.endgame?.type?.label;
  const result = story.outcome.result;
  const verb = result === "draw" || result === "1/2-1/2" ? "Held" : result === "win" || result === "1-0" ? "Won" : result === "loss" || result === "0-1" ? "The turning point" : "A game story";
  return family === undefined ? `${verb} at ${move}` : `${verb} from the ${family.toLowerCase()} at ${move}`;
}

export function storyDeclaredEvidence(story: StoryTitleInput & { readonly evidence?: readonly DeclaredEvidence<unknown>[] }): readonly DeclaredEvidence<unknown>[] {
  const title = suggestTitle(story);
  return Object.freeze([sentenceEvidence("derived.story.title", title, { title, rank: story.rank, outcome: story.outcome }), ...(story.evidence ?? story.moments.flatMap((moment) => moment.evidence))]);
}

export function reviewStoryTitle(story: StoryTitleInput): string {
  const titleEvidence = storyDeclaredEvidence(story)[0]!;
  return reviewStoryEvidence([titleEvidence]).items[0]!.sentences[0]!;
}

function evaluation(run: DrillRun, node: Node): StoryEvaluation | undefined {
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
  const learnerCp = Math.max(-STORY_MATE_CP, Math.min(STORY_MATE_CP, sideToMove === run.start.side ? cp : -cp));
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
  const accum = new Map<string, { kinds: Set<StoryMomentKind>; evidence: DeclaredEvidence<unknown>[]; before?: StoryEvaluation; after?: StoryEvaluation; endgame?: EndgameReading }>();
  const item = (nodeId: string) => {
    let value = accum.get(nodeId);
    if (value === undefined) { value = { kinds: new Set(), evidence: [] }; accum.set(nodeId, value); }
    return value;
  };
  for (const marker of pivotalMarkers(run, branchId)) {
    const value = item(marker.nodeId); value.kinds.add(marker.kind); value.evidence.push(declareEvidence(ref("rules.pivotal"), ref("rules.pivotal.marker"), marker));
  }
  const evaluations = path.map((node) => evaluation(run, node));
  for (let index = 1; index < path.length; index += 1) {
    const before = evaluations[index - 1], after = evaluations[index];
    if (before === undefined || after === undefined) continue;
    const delta = after.centipawns - before.centipawns;
    if (Math.abs(delta) < STORY_PIVOT_CP) continue;
    const value = item(path[index]!.id); value.kinds.add("eval_pivot"); value.before = before; value.after = after;
    const sentence = `The recorded evaluation moved ${delta >= 0 ? "+" : ""}${delta} cp across this move (${after.engineId}${after.requestedMovetimeMs === undefined ? "" : `, ${after.requestedMovetimeMs} ms`}).`;
    value.evidence.push(sentenceEvidence("derived.story.eval_shift", sentence, { before, after, delta }));
  }
  if (learnerLost(options.recordedResult, run.start.side)) {
    let last = -1;
    for (let index = 0; index < evaluations.length; index += 1) if ((evaluations[index]?.centipawns ?? -101) >= -100) last = index;
    if (last >= 0) { const value = item(path[last]!.id); const sentence = "The last recorded moment within a pawn of level — Tabiya's recorded-evaluation convention."; value.kinds.add("last_level"); value.evidence.push(sentenceEvidence("derived.story.last_level", sentence, { recordedResult: options.recordedResult, evaluation: evaluations[last] })); }
  }
  let endgameSeen = false;
  for (const node of path) {
    const reading = endgameReading(node.fen);
    if (!endgameSeen && reading !== null) { endgameSeen = true; const value = item(node.id); value.kinds.add("endgame_entry"); value.endgame = reading; value.evidence.push(declareEvidence(ref("rules.endgame"), ref("rules.endgame.reading"), reading)); }
  }
  for (const firing of shapeFirings(options.shapes ?? [], path)) {
    const value = item(firing.firstNodeId); value.kinds.add("shape_span"); value.evidence.push(declareEvidence(ref("theory.shapes"), ref("theory.shapes.firing"), Object.freeze({ id: firing.entryId, ...firing })));
  }
  const outcome = [...run.events].reverse().find((event) => event.type === "outcome.reached" && byId.has(event.data.nodeId));
  if (outcome?.type === "outcome.reached") {
    const value = item(outcome.data.nodeId); const sentence = `Board-terminal result for the learner: ${outcome.data.outcome}.`; value.kinds.add("outcome"); value.evidence.push(declareEvidence(ref("run.record"), ref("run.record.consequence"), Object.freeze({ sentence, terminal: true, outcome: outcome.data.outcome })));
  } else if (options.recordedResult !== undefined && options.recordedResult !== "*") {
    const leaf = path.at(-1)!; const value = item(leaf.id); const sentence = `The PGN records the game result as ${options.recordedResult}; the board is not terminal here.`; value.kinds.add("outcome"); value.evidence.push(declareEvidence(ref("run.record"), ref("run.record.imported_result"), Object.freeze({ sentence, result: options.recordedResult })));
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
  const priority = (moment: StoryMoment): number => moment.kinds.includes("outcome") ? 0 : moment.kinds.includes("eval_pivot") ? 1 : moment.kinds.includes("last_level") ? 2 : moment.kinds.includes("phase_change") ? 3 : moment.kinds.includes("endgame_entry") ? 4 : moment.kinds.includes("irreversibility") ? 5 : moment.kinds.includes("shape_span") ? 6 : 7;
  const rank = [...moments].sort((left, right) => priority(left) - priority(right) || Math.abs((right.evalAfter?.centipawns ?? 0) - (right.evalBefore?.centipawns ?? 0)) - Math.abs((left.evalAfter?.centipawns ?? 0) - (left.evalBefore?.centipawns ?? 0)) || left.ply - right.ply).map((moment) => moment.nodeId);
  const rankEvidence = declareEvidence(ref("derived.story"), ref("derived.story.rank"), Object.freeze({ rank: Object.freeze(rank) }));
  const renderedRank = reviewStoryEvidence([rankEvidence]);
  const admittedRank = (renderedRank.items[0]!.evidence.payload as { readonly rank: readonly string[] }).rank;
  const evidence = Object.freeze([...moments.flatMap((moment) => moment.evidence), renderedRank.items[0]!.evidence]);
  return Object.freeze({ moments: Object.freeze(moments), rank: Object.freeze(admittedRank), evidence });
}
