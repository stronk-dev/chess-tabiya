import type { ReviewMap } from "./api.js";

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
}
