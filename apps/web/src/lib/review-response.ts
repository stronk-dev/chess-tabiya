import type { ReviewAnalysisPage, ReviewMap } from "./api.js";

const GRAPH_KINDS = new Set(["complete", "partial", "abstained"]);
const ANALYSIS_ABSTENTIONS = new Set(["none", "unattributed", "withheld"]);
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
    && /\(grade-convention@\d+\/(?:review|imported_analysis)\)\.$/u.test(sentence);
}

function fail(message: string): never {
  throw new TypeError(`Invalid review map response: ${message}`);
}

/** Closed shape check for the Review Map payload before any of it renders. */
export function assertReviewMapResponse(value: unknown, subject: { readonly runId: string }): asserts value is ReviewMap {
  const body = record(value) ?? fail("not an object");
  if (body.runId !== subject.runId) fail("runId mismatch");
  if (!text(body.branchId) || !SIDES.has(body.side as string) || typeof body.ready !== "boolean" || !natural(body.pendingEvidence)) fail("header fields");
  if (!text(body.storyTitle)) fail("storyTitle");
  const viewer = record(body.viewer);
  if (viewer === undefined || typeof viewer.mayWrite !== "boolean") fail("viewer");
  if (!Array.isArray(body.rows)) fail("rows");
  const rows = body.rows as unknown[];
  rows.forEach((candidate, index) => {
    const row = record(candidate) ?? fail(`row ${index}`);
    if (!text(row.nodeId) || !text(row.entryNodeId) || !text(row.san) || !text(row.label) || !text(row.fen) || !text(row.moveUci)) fail(`row ${index} identity`);
    if (row.ply !== index + 1 || !natural(row.moveNumber) || !SIDES.has(row.side as string) || typeof row.moment !== "boolean") fail(`row ${index} position`);
    if (/[?!]|\$\d/u.test(row.san as string)) fail(`row ${index} carries an annotation glyph`);
    if (!texts(row.facts) || (row.facts as readonly string[]).length === 0) fail(`row ${index} facts`);
    if (row.grade !== undefined) {
      const grade = record(row.grade) ?? fail(`row ${index} grade`);
      if (!CLASSES.has(grade.klass as string) || !text(grade.sentence) || !isGroundedGradeSentence(grade.klass as string, grade.sentence as string)) fail(`row ${index} grade is not a grounded sentence`);
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

/** Closed check for the explicit Analyze reveal (rfc/review-map.md §7, O7.3). */
export function assertReviewAnalysisResponse(value: unknown, subject: { readonly runId: string; readonly nodeId: string }): asserts value is ReviewAnalysisPage {
  const body = record(value) ?? fail("analysis is not an object");
  if (body.runId !== subject.runId || body.nodeId !== subject.nodeId || !text(body.entryNodeId) || !text(body.branchId) || !text(body.sentence)) fail("analysis identity");
  if (body.kind === "line") {
    const bound = record(body.bound) ?? fail("analysis bound");
    const attributed = (Number.isSafeInteger(bound.requestedMovetimeMs) && (bound.requestedMovetimeMs as number) > 0) || (Number.isSafeInteger(bound.requestedDepth) && (bound.requestedDepth as number) > 0);
    // Law 8: an engine line renders only attributed to its engine and search bound, never as advice.
    if (!attributed || !text(body.engineId) || !(body.sentence as string).startsWith(`${body.engineId as string} (`)) fail("analysis line is not attributed to engine and search bound");
    if (!texts(body.moves) || (body.moves as readonly string[]).length === 0 || !text(body.caveat)) fail("analysis line shape");
    if (/\b(?:best|should|must|strongest|winning)\b/iu.test(`${body.sentence as string} ${body.caveat as string}`)) fail("analysis line is phrased as advice");
    return;
  }
  if (!ANALYSIS_ABSTENTIONS.has(body.kind as string) || "moves" in body) fail("analysis abstention shape");
}
