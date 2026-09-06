// DISPOSABLE sixth author contract for D3035-D3041; not production presentation code.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  CORPUS_RESULT_REASON_AUTHORITY,
  MANIFEST_PRESENTATION_REPAIRS,
  PRESENTATION_ABSTENTION_ROWS,
  SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
  STRUCTURE_PREDICATES,
  assertManifestPresentationRepairAnchors,
  assertRegisteredPresentationQuestion,
  constructExplorerCountOperands,
  evaluateNamedStructureWithWitness,
  issueRegisteredPresentationQuestion,
  parseCitationOperand,
  presentationWorkflowQuestionAuthorityFixture,
  sourceAttributionRegistryDigest,
} from "../d1862-presentation-adapter-plan/plan.js";

const explorerAdapter = "inspector.corpus@1\0human.explorer.population@1";
const explorerQuestion = "question.explorer_population";
const decision = Object.freeze({
  eventHeadSeq: 7,
  cursor: Object.freeze({ branchId: "b1", nodeId: "n4" }),
  disclosureBoundarySeq: null,
  digest: "decision-7",
});

const citation = () => ({
  content: {
    kind: "authored_summary",
    text: "Measured evidence.",
    binding: {
      projection: { id: "run.record.evidence_ref_resolution", version: 1 },
      field: "text",
      evidenceDigest: `sha256:${"0".repeat(64)}`,
    },
  },
  source: {
    source: { id: "live.stockfish.eval", version: 1 },
    title: "Stockfish engine reading",
    locator: "deployment-artifact:stockfish",
    licence: { authority: "source-attribution-registry@1", value: "GPL-3.0-only" },
    url: "https://stockfishchess.org/",
    revision: { authority: "deployment-receipt@1", value: `sha256:${"1".repeat(64)}` },
  },
});

describe("evidence-presentation sixth author repair", () => {
  test("D3035 delegates canonical bytes to the shared fail-closed serializer", () => {
    expect(sourceAttributionRegistryDigest(SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE)).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(() => sourceAttributionRegistryDigest({ value: Number.POSITIVE_INFINITY })).toThrow(/finite/u);
    expect(() => sourceAttributionRegistryDigest({ value: "\udfff" })).toThrow(/lone low surrogate/u);
  });

  test("D3036 closes content, field binding, source, licence and revision together", () => {
    const valid = citation();
    expect(parseCitationOperand(valid)).toEqual(valid);
    expect(() => parseCitationOperand({ ...valid, content: { ...valid.content, kind: "generated_advice" } })).toThrow();
    expect(() => parseCitationOperand({ ...valid, content: { ...valid.content, binding: { ...valid.content.binding, field: "bestMoveUci" } } })).toThrow();
    expect(() => parseCitationOperand({ ...valid, source: { ...valid.source, source: { id: "unknown", version: 1 } } })).toThrow();
    expect(() => parseCitationOperand({ ...valid, source: { ...valid.source, licence: { authority: "deployment-receipt@1", value: "GPL-3.0-only" } } })).toThrow();
    expect(() => parseCitationOperand({ ...valid, source: { ...valid.source, revision: { authority: "deployment-receipt@1", value: "moving-head" } } })).toThrow();
  });

  test("D3037 uses the exact Explorer operation-result union without a synonym", () => {
    const row = PRESENTATION_ABSTENTION_ROWS.find((entry) => entry.adapterKey === explorerAdapter);
    expect(row?.sourceReasonMap.map((entry) => entry.sourceReason)).toEqual(CORPUS_RESULT_REASON_AUTHORITY.resultReasons);
    expect(row?.sourceReasonMap.some((entry) => entry.sourceReason === "empty_population")).toBe(false);
  });

  test("D3038 question identity is subordinate to one sealed request and decision", () => {
    const authority = presentationWorkflowQuestionAuthorityFixture({ requestId: "r7", adapterKey: explorerAdapter, questionId: explorerQuestion }, decision);
    const question = issueRegisteredPresentationQuestion(authority);
    expect(() => assertRegisteredPresentationQuestion(question, explorerAdapter, explorerQuestion, "r7", decision)).not.toThrow();
    expect(() => assertRegisteredPresentationQuestion(question, explorerAdapter, explorerQuestion, "other", decision)).toThrow();
    expect(() => assertRegisteredPresentationQuestion(question, explorerAdapter, explorerQuestion, "r7", { ...decision, eventHeadSeq: 8 })).toThrow();
    expect(() => issueRegisteredPresentationQuestion(structuredClone(authority))).toThrow();
  });

  test("D3039 one expression traversal decides the match and returns its positive square witnesses", () => {
    const fen = "4k3/8/3p4/8/2P1P3/8/8/4K3 w - - 0 1";
    expect(evaluateNamedStructureWithWitness(fen, "maroczy-bind")?.squares).toEqual(["c4", "e4"]);
    expect(evaluateNamedStructureWithWitness("4k3/8/3p4/8/4P3/8/8/4K3 w - - 0 1", "maroczy-bind")).toBeNull();
    const expression = STRUCTURE_PREDICATES["maroczy-bind"];
    expect(expression.kind).toBe("all");
    if (expression.kind !== "all") throw new TypeError("fixture requires the registered all-expression");
    const changed = { ...STRUCTURE_PREDICATES, "maroczy-bind": { ...expression, of: [{ kind: "pieceOnSquare", square: "c3", piece: { color: "white", role: "pawn" } }, ...expression.of.slice(1)] } } as typeof STRUCTURE_PREDICATES;
    expect(evaluateNamedStructureWithWitness(fen, "maroczy-bind", changed)).toBeNull();
  });

  test("D3040 distinguishes an absent committed edge from a malformed one", () => {
    const input = { nodeId: "n1", result: { kind: "stats" as const, total: 100, moves: [{ san: "e4", uci: "e2e4", playedCount: 60, white: 30, draws: 10, black: 20 }] } };
    expect(constructExplorerCountOperands({ ...input, committedMoveUci: null })[0]?.committedMove).toBe(false);
    expect(constructExplorerCountOperands({ ...input, committedMoveUci: "e2e4" })[0]?.committedMove).toBe(true);
    expect(() => constructExplorerCountOperands({ ...input, committedMoveUci: "not-a-move" })).toThrow();
  });

  test("D3041 every P row resolves an operation and non-empty executable pre/postimage anchors", () => {
    const readSource = (path: string): string => readFileSync(path, "utf8");
    expect(MANIFEST_PRESENTATION_REPAIRS).toHaveLength(8);
    expect(() => assertManifestPresentationRepairAnchors(readSource)).not.toThrow();
    const changed = MANIFEST_PRESENTATION_REPAIRS.map((row, index) => index === 3
      ? { ...row, operation: { ...row.operation, symbol: "missingOperation" } }
      : row);
    expect(() => assertManifestPresentationRepairAnchors(readSource, changed)).toThrow(/operation anchor/u);
  });
});
