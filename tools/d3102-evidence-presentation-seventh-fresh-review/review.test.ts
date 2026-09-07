// DISPOSABLE seventh fresh independent review harness — D3102-D3107.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  CORPUS_RESULT_REASON_AUTHORITY,
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  STRUCTURE_PREDICATES,
  assertManifestPresentationRepairAnchors,
  issueRegisteredPresentationQuestion,
  parseCitationOperand,
  parseCorpusResultAbstentionReason,
  presentationWorkflowQuestionAuthorityFixture,
  sourceAttributionRegistryDigest,
} from "../d1862-presentation-adapter-plan/plan.js";

const explorerAdapter = "inspector.corpus@1\0human.explorer.population@1";
const explorerQuestion = "question.explorer_population";

const citation = (text: string) => ({
  content: {
    kind: "authored_summary",
    text,
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

describe("evidence-presentation seventh fresh independent review", () => {
  test("D3102 citation prose is caller-controlled rather than derived from the bound evidence field", () => {
    const grounded = parseCitationOperand(citation("Measured evidence."));
    const invented = parseCitationOperand(citation("Sacrifice the queen; checkmate is forced."));

    expect(grounded.content.binding).toEqual(invented.content.binding);
    expect(grounded.source).toEqual(invented.source);
    expect(invented.content.text).toBe("Sacrifice the queen; checkmate is forced.");
  });

  test("D3103 the Explorer reason parser accepts a fragment that is not a CorpusResult", () => {
    const incomplete = { kind: "abstention", reason: "no_data_at_band" };
    const production = readFileSync("apps/server/src/corpus.ts", "utf8");

    expect(production).toContain("readonly detail: string; readonly population: CorpusPopulation");
    expect(CORPUS_RESULT_REASON_AUTHORITY.operation.symbol).toBe("CorpusResult");
    expect(parseCorpusResultAbstentionReason(incomplete)).toBe("no_data_at_band");
    expect(production).not.toContain("export const CORPUS_RESULT_REASON_AUTHORITY");
  });

  test("D3104 the fixture can bless an arbitrary caller-authored workflow decision", () => {
    const callerDecision = Object.freeze({
      eventHeadSeq: 999,
      cursor: Object.freeze({ branchId: "invented-branch", nodeId: "invented-node" }),
      disclosureBoundarySeq: 42,
      digest: "caller-picked-digest",
    });
    const authority = presentationWorkflowQuestionAuthorityFixture({
      requestId: "caller-picked-request",
      adapterKey: explorerAdapter,
      questionId: explorerQuestion,
    }, callerDecision);

    expect(issueRegisteredPresentationQuestion(authority)).toMatchObject({
      requestId: "caller-picked-request",
      decision: callerDecision,
    });
  });

  test("D3105 named-structure authority points at production exports that do not exist", () => {
    const production = readFileSync("packages/runtime/src/structure.ts", "utf8");
    const authorModel = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");

    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.expression).toEqual({
      source: "packages/runtime/src/structure.ts",
      symbol: "STRUCTURE_PREDICATES",
    });
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.operation).toEqual({
      source: "packages/runtime/src/structure.ts",
      symbol: "evaluateNamedStructureWithWitness",
    });
    expect(production).not.toMatch(/export const STRUCTURE_PREDICATES/u);
    expect(production).not.toMatch(/export function evaluateNamedStructureWithWitness/u);
    expect(authorModel).toMatch(/export const STRUCTURE_PREDICATES/u);
    expect(authorModel).toMatch(/export function evaluateNamedStructureWithWitness/u);
    expect(Object.keys(STRUCTURE_PREDICATES)).toHaveLength(4);
  });

  test("D3106 Checkpoint P accepts decoy strings without resolving or executing an operation", () => {
    const decoys = new Map<string, string[]>();
    const add = (source: string, needle: string): void => {
      decoys.set(source, [...(decoys.get(source) ?? []), needle]);
    };
    for (const repair of MANIFEST_PRESENTATION_REPAIRS) {
      add(repair.operation.source, repair.operation.symbol);
      for (const item of [...repair.preimage, ...repair.postimage]) add(item.source, item.anchor);
    }
    const readDecoy = (source: string): string => (decoys.get(source) ?? []).join("\n");

    expect(() => assertManifestPresentationRepairAnchors(readDecoy)).not.toThrow();
  });

  test("D3107 the registry digest accepts a partial caller-defined semantic image", () => {
    const partial = {
      id: "source-attribution-registry",
      version: 1,
      rows: [],
    };

    expect(sourceAttributionRegistryDigest(partial)).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(sourceAttributionRegistryDigest(partial)).not.toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
  });
});
