// rfc/module-registration.md §4.5: the Post-commit Nudge payload from `GET /runs/:id/nudge`.
// A closed shape check runs before anything renders: at most two facts, each an exact projection
// id@version with its sentence, and a grade only as its complete grounding sentence.

export interface PostcommitNudgeFact {
  readonly projection: string;
  readonly sentence: string;
  readonly source: string;
}

export type PostcommitNudge =
  | { readonly runId: string; readonly kind: "refused"; readonly nodeId: string; readonly reason: string }
  | {
      readonly runId: string;
      readonly kind: "packet";
      readonly nodeId: string;
      readonly facts: readonly PostcommitNudgeFact[];
      readonly headline: string | null;
      readonly closing: string | null;
      readonly receipt: { readonly offered: number; readonly admitted: number; readonly afterReducers: number; readonly noveltyAbstained: boolean };
    };

/** The module's declared fact backstop (MODULE_POLICIES postcommit_nudge.budgets.maxFacts). */
export const NUDGE_MAX_FACTS = 2;
const EXACT_REF = /^[a-z][a-z0-9_.]*@[1-9]\d*$/u;
const GRADE_SENTENCE = /^(?:Inaccuracy|Mistake|Blunder) — .* a drop of \d+\.\d win-points .*\(grade-convention@\d+\/drill\)\.$/u;

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
const text = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const natural = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

function fail(message: string): never {
  throw new TypeError(`Invalid post-commit nudge response: ${message}`);
}

export function parsePostcommitNudge(value: unknown, subject: { readonly runId: string; readonly nodeId: string }): PostcommitNudge {
  const body = record(value) ?? fail("not an object");
  if (body.runId !== subject.runId || body.nodeId !== subject.nodeId) fail("subject mismatch");
  if (body.kind === "refused") {
    if (!text(body.reason) || Object.keys(body).length !== 4) fail("refusal shape");
    return Object.freeze({ runId: subject.runId, kind: "refused" as const, nodeId: subject.nodeId, reason: body.reason });
  }
  if (body.kind !== "packet" || Object.keys(body).sort().join(",") !== "closing,facts,headline,kind,nodeId,receipt,runId") fail("packet shape");
  if (!Array.isArray(body.facts) || body.facts.length > NUDGE_MAX_FACTS) fail("facts exceed the module budget");
  const facts = (body.facts as unknown[]).map((candidate, index) => {
    const fact = record(candidate) ?? fail(`fact ${index}`);
    if (!text(fact.projection) || !EXACT_REF.test(fact.projection) || !text(fact.sentence) || !text(fact.source) || Object.keys(fact).length !== 3) fail(`fact ${index} shape`);
    if (fact.projection === "derived.grade.move_quality@1" && !GRADE_SENTENCE.test(fact.sentence)) fail(`fact ${index} grade is not a grounded sentence`);
    return Object.freeze({ projection: fact.projection, sentence: fact.sentence, source: fact.source });
  });
  const framed = facts.length > 0;
  if (framed ? !text(body.headline) || !text(body.closing) : body.headline !== null || body.closing !== null) fail("frame must exist exactly when facts do");
  const receipt = record(body.receipt) ?? fail("receipt");
  if (!natural(receipt.offered) || !natural(receipt.admitted) || !natural(receipt.afterReducers) || typeof receipt.noveltyAbstained !== "boolean") fail("receipt fields");
  return Object.freeze({
    runId: subject.runId, kind: "packet" as const, nodeId: subject.nodeId, facts: Object.freeze(facts),
    headline: framed ? body.headline as string : null, closing: framed ? body.closing as string : null,
    receipt: Object.freeze({ offered: receipt.offered, admitted: receipt.admitted, afterReducers: receipt.afterReducers, noveltyAbstained: receipt.noveltyAbstained }),
  });
}
