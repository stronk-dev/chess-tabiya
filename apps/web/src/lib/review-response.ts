import { parsePresentationReceipt, presentedSentence, reviewMoveNumber, reviewText, WORKFLOW_CONTEXTS } from "@chess-tabiya/runtime/client";
import { parseReviewDecision } from "./review-analyze.js";

import type { ReviewMap } from "./api.js";

const GRAPH_KINDS = new Set(["complete", "partial", "abstained"]);
const SIDES = new Set(["white", "black"]);
const CLASSES = new Set(["inaccuracy", "mistake", "blunder"]);
const ACCURACY_KINDS = new Set(["rendered", "abstained", "no_decisions"]);

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
const text = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const natural = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const texts = (value: unknown): value is readonly string[] => Array.isArray(value) && value.every(text);

/** A grade chip is admitted only as its complete grounding sentence (rfc/review-map.md §3 rule 2). */
export function isGroundedGradeSentence(klass: string, sentence: string): boolean {
  const word = `${klass[0]!.toUpperCase()}${klass.slice(1)}`;
  return sentence.startsWith(`${word} — `)
    && /[+−]\d+\.\d{2} \(\d+\.\d%\)|mate #\d+/u.test(sentence)
    && /a drop of \d+\.\d win-points/u.test(sentence)
    && /requested (?:depth \d+|\d+ (?:ms|nodes)); single move-loss convention, version 2\)\.$/u.test(sentence)
    && /recorded provider delivery, generation \d+|pinned pack report, Threads \d+, Hash \d+ MiB, MultiPV 1/u.test(sentence);
}
function fail(message: string): never {
  throw new TypeError(`Invalid review map response: ${message}`);
}

/** Closed shape check for the Review Map payload before any of it renders. */
export function assertReviewMapResponse(value: unknown, subject: { readonly runId: string; readonly branchId?: string }): asserts value is ReviewMap {
  const body = record(value) ?? fail("not an object");
  if (body.runId !== subject.runId) fail("runId mismatch");
  parseReviewDecision(body.decision);
  if (!(WORKFLOW_CONTEXTS as readonly unknown[]).includes(body.workflowContext)) fail("workflow context");
  if (subject.branchId !== undefined && body.branchId !== subject.branchId) fail("branchId mismatch");
  if (!text(body.branchId) || !SIDES.has(body.side as string) || typeof body.ready !== "boolean" || !natural(body.pendingEvidence)) fail("header fields");
  if (!text(body.storyTitle)) fail("storyTitle");
  if (body.campaignOrigin !== undefined && body.campaignOrigin !== null) {
    const origin = record(body.campaignOrigin);
    if (origin === undefined || !text(origin.campaignRunId) || !text(origin.nodeId) || typeof origin.campaignDocumentDigest !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(origin.campaignDocumentDigest)) fail("campaign origin");
  }
  const viewer = record(body.viewer);
  if (viewer === undefined || typeof viewer.mayWrite !== "boolean") fail("viewer");
  if (!Array.isArray(body.rows)) fail("rows");
  const rows = body.rows as unknown[];
  rows.forEach((candidate, index) => {
    const row = record(candidate) ?? fail(`row ${index}`);
    if (!text(row.nodeId) || !text(row.entryNodeId) || !text(row.san) || !text(row.label) || !text(row.fen) || !text(row.moveUci)) fail(`row ${index} identity`);
    if (row.ply !== index + 1 || !natural(row.moveNumber) || !SIDES.has(row.side as string) || typeof row.moment !== "boolean") fail(`row ${index} position`);
    let number: number;
    try { number = reviewMoveNumber(row.fen as string, true); } catch { return fail(`row ${index} recorded move number`); }
    if (row.moveNumber !== number || row.label !== reviewText(row.side === "white" ? "moves.row.white" : "moves.row.black", { number, san: row.san as string })) fail(`row ${index} recorded move number`);
    if (/[?!]|\$\d/u.test(row.san as string)) fail(`row ${index} carries an annotation glyph`);
    if (!texts(row.facts) || (row.facts as readonly string[]).length === 0) fail(`row ${index} facts`);
    // rfc/review-evidence-compiler.md: the typed packet components travel as one closed presentation
    // receipt whose equivalent sentences are exactly the tail of the row's facts.
    let packet: ReturnType<typeof parsePresentationReceipt>;
    try { packet = parsePresentationReceipt(row.packet); } catch (error) { return fail(`row ${index} packet: ${error instanceof Error ? error.message : String(error)}`); }
    for (const item of packet) {
      if (item.adapter.consumer.id !== "module.review_map" || item.adapter.consumer.version !== 2) fail(`row ${index} packet has a foreign consumer`);
      const objectiveSource = item.adapter.projection.id === "run.record.objective_transition";
      const objectiveRenderer = item.component.id === "fact_statement" && item.component.operand.rendererId === "review.objective_transition@1";
      if ((objectiveSource || objectiveRenderer) && (!objectiveSource || item.adapter.projection.version !== 2 || !objectiveRenderer)) fail(`row ${index} objective has a different renderer or source`);
    }
    const facts = row.facts as readonly string[];
    const tail = facts.slice(facts.length - packet.length);
    if (packet.length > facts.length || packet.some((item, position) => presentedSentence(item) !== tail[position])) fail(`row ${index} packet sentences are not its facts`);
    if (row.grade !== undefined) {
      const grade = record(row.grade) ?? fail(`row ${index} grade`);
      if (!CLASSES.has(grade.klass as string) || !text(grade.sentence) || !isGroundedGradeSentence(grade.klass as string, grade.sentence as string)) fail(`row ${index} grade is not a grounded sentence`);
      const admitted = packet.filter(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "grade.move_quality@2");
      if (admitted.length !== 1 || presentedSentence(admitted[0]!) !== grade.sentence) fail(`row ${index} grade does not match its complete typed component`);
    }
  });
  if (!Array.isArray(body.moments) || (body.moments as unknown[]).length > 3) fail("moments");
  for (const candidate of body.moments as unknown[]) {
    const moment = record(candidate) ?? fail("moment");
    if (!text(moment.nodeId) || !text(moment.entryNodeId) || !text(moment.heading) || !text(moment.moveLabel) || !text(moment.fen) || !texts(moment.sentences) || !texts(moment.sourceLabels) || !text(moment.sourcesSentence)) fail("moment fields");
  }
  if (!text(body.momentsSentence) || !natural(body.considered)) fail("moment selection");
  const accuracy = record(body.accuracy) ?? fail("accuracy");
  for (const side of ["white", "black"]) {
    const entry = record(accuracy[side]) ?? fail(`accuracy ${side}`);
    if (!ACCURACY_KINDS.has(entry.kind as string) || !text(entry.sentence) || !natural(entry.decisions) || !natural(entry.evaluated)) fail(`accuracy ${side} shape`);
    if (entry.kind === "rendered" && (typeof entry.value !== "number" || entry.evaluated !== entry.decisions)) fail(`accuracy ${side} rendered below full coverage`);
    if (entry.kind !== "rendered" && "value" in entry) fail(`accuracy ${side} carries a value while abstaining`);
  }
  const coverage = record(body.coverage) ?? fail("coverage");
  if (!natural(coverage.evaluated) || !natural(coverage.positions) || !text(coverage.sentence)) fail("coverage shape");
  const footer = record(body.footer) ?? fail("footer");
  if (!texts(footer.labels) || !text(footer.sentence)) fail("footer shape");

  // §6 eval graph: one point per row, and a drawn point only where a recorded evaluation exists.
  const graph = record(body.evalGraph) ?? fail("evalGraph");
  if (!GRAPH_KINDS.has(graph.kind as string) || !SIDES.has(graph.side as string) || graph.side !== body.side || !text(graph.caption) || !text(graph.coverage) || !natural(graph.evaluated)) fail("evalGraph shape");
  if (!Array.isArray(graph.points) || graph.points.length !== rows.length) fail("evalGraph points must cover every row");
  let drawn = 0;
  (graph.points as unknown[]).forEach((candidate, index) => {
    const point = record(candidate) ?? fail(`evalGraph point ${index}`);
    const row = record(rows[index])!;
    if (point.nodeId !== row.nodeId || point.ply !== row.ply || !text(point.sentence)) fail(`evalGraph point ${index} identity`);
    if (point.kind === "evaluated") {
      if (typeof point.percent !== "number" || point.percent < 0 || point.percent > 100) fail(`evalGraph point ${index} percent`);
      if (typeof point.joinFromPrevious !== "boolean" || point.joinFromPrevious && (index === 0 || record((graph.points as unknown[])[index - 1])?.kind !== "evaluated")) fail(`evalGraph point ${index} has an invalid comparison segment`);
      drawn += 1;
    } else if (point.kind !== "missing" || "percent" in point) fail(`evalGraph point ${index} draws without a recorded evaluation`);
  });
  const expectedKind = drawn === 0 ? "abstained" : drawn === rows.length ? "complete" : "partial";
  if (graph.evaluated !== drawn || graph.kind !== expectedKind) fail("evalGraph coverage does not match its points");
  if (!Array.isArray(graph.gaps) || (graph.gaps as unknown[]).some((gap) => { const entry = record(gap); return entry === undefined || !natural(entry.fromPly) || !natural(entry.toPly) || !text(entry.sentence); })) fail("evalGraph gaps");
  if (drawn < rows.length && (graph.gaps as unknown[]).length === 0) fail("evalGraph must state where it abstains");

  // §4 compare handoff: the shipped N-way compare's input, reviewed line first.
  if (!Array.isArray(body.compareDoors)) fail("compareDoors");
  for (const candidate of body.compareDoors as unknown[]) {
    const door = record(candidate) ?? fail("compare door");
    if (!text(door.entryNodeId) || !texts(door.branchIds) || (door.branchIds as readonly string[]).length < 2 || (door.branchIds as readonly string[]).length > 8 || (door.branchIds as readonly string[])[0] !== body.branchId || new Set(door.branchIds as readonly string[]).size !== (door.branchIds as readonly string[]).length || !natural(door.omitted)) fail("compare door shape");
  }
  if (body.openRetryEntryNodeId !== null && !text(body.openRetryEntryNodeId)) fail("openRetryEntryNodeId");

  // §7 / criterion 12: the ordinary map carries no engine line; only the explicit Analyze action does.
  if (/"(?:bestMoveUci|movesUci|pv|bestline)":/u.test(JSON.stringify(body))) fail("the ordinary map carries an engine line");
}
