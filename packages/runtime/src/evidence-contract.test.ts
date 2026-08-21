import { describe, expect, it } from "vitest";

import {
  EVIDENCE_MANIFEST_ERROR_CODES,
  EvidenceManifestError,
  compileEvidenceManifest,
  declareEvidence,
  evidenceForConsumer,
  type AdapterDeclaration,
  type ConsumerDeclaration,
  type EvidenceContractDeclarations,
  type ProducerDeclaration,
  type ProjectionDeclaration,
} from "./evidence-contract.js";

const ERROR_TABLE = Object.freeze([
  "EVIDENCE_PRODUCER_DUPLICATE", "EVIDENCE_PROJECTION_DUPLICATE", "EVIDENCE_PROJECTION_ORPHANED",
  "EVIDENCE_CONSUMER_ORPHANED", "EVIDENCE_BINDING_UNDECLARED", "EVIDENCE_BINDING_WILDCARD",
  "EVIDENCE_BINDING_WIDENS", "EVIDENCE_PROJECTION_INCOMPLETE", "EVIDENCE_DEPENDENCY_MISSING",
  "EVIDENCE_DEPENDENCY_CYCLE", "EVIDENCE_GENERIC_BYPASS", "EVIDENCE_PROVIDER_FALLBACK_MISSING",
] as const);

function projection(id = "p.output", producerId = "p"): ProjectionDeclaration {
  return { id, version: 1, producer: { id: producerId, version: 1 }, role: "reading", plane: "rules", payloadType: "Fixture", semantics: "Exact fixture fact.", operands: ["fen"], signs: ["state"], grounding: "position_rules", exactness: "exact", confidence: "not_applicable", abstention: { possible: false, reasons: [] }, answerContent: ["fact"], forms: ["panel"], dependsOn: [], limitations: [] };
}

function producer(output = projection(), id = "p", availability: ProducerDeclaration["availability"] = "local"): ProducerDeclaration {
  return { id, version: 1, plane: "rules", implementation: `fixture/${id}.ts`, availability, latency: availability === "provider" ? "interactive" : "sync", outputs: [output] };
}

function consumer(accepts = [{ id: "p.output", version: 1 }]): ConsumerDeclaration {
  return { id: "c", version: 1, implementation: "fixture/c.ts", accepts, timing: ["analysis"], roles: ["operator"], sessions: ["pack"], forms: ["panel"], answerContent: ["fact"], latency: { mode: "interactive", maxMs: 100 }, budget: { maxFacts: 2, maxForms: 1 }, providerOff: "available" };
}

function adapter(overrides: Partial<AdapterDeclaration> = {}): AdapterDeclaration {
  return { id: "a", version: 1, implementation: "fixture/a.ts", producer: { id: "p", version: 1 }, projection: { id: "p.output", version: 1 }, consumer: { id: "c", version: 1 }, timing: ["analysis"], roles: ["operator"], sessions: ["pack"], forms: ["panel"], answerContent: ["fact"], latency: { mode: "interactive", maxMs: 100 }, budget: { maxFacts: 2, maxForms: 1 }, ...overrides };
}

function base(): EvidenceContractDeclarations {
  return { producers: [producer()], consumers: [consumer()], adapters: [adapter()] };
}

function code(value: EvidenceContractDeclarations): string | undefined {
  try { compileEvidenceManifest(value); return undefined; }
  catch (error) { return error instanceof EvidenceManifestError ? error.code : String(error); }
}

describe("evidence manifest compiler", () => {
  it("keeps the executable error-code set equal to the RFC table", () => {
    expect(EVIDENCE_MANIFEST_ERROR_CODES).toEqual(ERROR_TABLE);
  });

  it("raises each of the twelve stable error families from an isolated negative", () => {
    const qProjection = projection("p.output", "q");
    const disposedProjection = { ...projection(), disposition: { kind: "retired" as const, reason: "fixture" } };
    const missingConsumer = consumer([{ id: "missing.output", version: 1 }]);
    const cases: Readonly<Record<(typeof ERROR_TABLE)[number], EvidenceContractDeclarations>> = {
      EVIDENCE_PRODUCER_DUPLICATE: { ...base(), producers: [producer(), producer()] },
      EVIDENCE_PROJECTION_DUPLICATE: { ...base(), producers: [producer(), producer(qProjection, "q")] },
      EVIDENCE_PROJECTION_ORPHANED: { producers: [producer()], consumers: [{ ...consumer(), disposition: { kind: "retired", reason: "fixture" } }], adapters: [] },
      EVIDENCE_CONSUMER_ORPHANED: { producers: [producer(disposedProjection)], consumers: [missingConsumer], adapters: [] },
      EVIDENCE_BINDING_UNDECLARED: { ...base(), adapters: [adapter({ projection: { id: "missing.output", version: 1 } })] },
      EVIDENCE_BINDING_WILDCARD: { ...base(), adapters: [adapter({ projection: { id: "p.*", version: 1 } })] },
      EVIDENCE_BINDING_WIDENS: { ...base(), adapters: [adapter({ forms: ["panel", "arrows"], budget: { maxFacts: 3, maxForms: 1 } })] },
      EVIDENCE_PROJECTION_INCOMPLETE: { ...base(), producers: [producer({ ...projection(), semantics: "" })] },
      EVIDENCE_DEPENDENCY_MISSING: { ...base(), producers: [producer({ ...projection(), dependsOn: [{ id: "missing.output", version: 1 }] })] },
      EVIDENCE_DEPENDENCY_CYCLE: { producers: [producer({ ...projection(), dependsOn: [{ id: "q.output", version: 1 }] }), producer({ ...projection("q.output", "q"), dependsOn: [{ id: "p.output", version: 1 }] }, "q")], consumers: [{ ...consumer(), accepts: [{ id: "p.output", version: 1 }, { id: "q.output", version: 1 }] }], adapters: [adapter()] },
      EVIDENCE_GENERIC_BYPASS: { ...base(), genericBypasses: [{ consumer: { id: "c", version: 1 }, implementation: "fixture/raw-reader.ts" }] },
      EVIDENCE_PROVIDER_FALLBACK_MISSING: { ...base(), producers: [producer(projection(), "p", "provider")] },
    };
    for (const expected of ERROR_TABLE) expect(code(cases[expected]), expected).toBe(expected);
  });

  it("is deterministic across declaration order and changes digest on a semantic version", () => {
    const first = compileEvidenceManifest(base());
    const second = compileEvidenceManifest({ ...base(), producers: [...base().producers].reverse(), consumers: [...base().consumers].reverse(), adapters: [...base().adapters].reverse() });
    expect(first.digest).toBe(second.digest);
    expect(first.digest).toMatch(/^[a-f0-9]{64}$/);
    const changedProjection = { ...projection(), version: 2 };
    const changed = compileEvidenceManifest({ producers: [producer(changedProjection)], consumers: [consumer([{ id: "p.output", version: 2 }])], adapters: [adapter({ projection: { id: "p.output", version: 2 } })] });
    expect(changed.digest).not.toBe(first.digest);
    expect(Object.isFrozen(first.bindings)).toBe(true);
  });

  it("wraps evidence and gives a consumer only its compiled projection view", () => {
    const disposed = { ...projection("q.output", "q"), disposition: { kind: "operator_only" as const, reason: "fixture-only source" } };
    const manifest = compileEvidenceManifest({ ...base(), producers: [...base().producers, producer(disposed, "q")] });
    const allowed = declareEvidence({ id: "p", version: 1 }, { id: "p.output", version: 1 }, { value: 1 });
    const other = declareEvidence({ id: "q", version: 1 }, { id: "q.output", version: 1 }, { value: 2 });
    expect(evidenceForConsumer(manifest, { id: "c", version: 1 }, [allowed, other])).toEqual([allowed]);
    expect(() => evidenceForConsumer(manifest, { id: "missing", version: 1 }, [allowed])).toThrowError(expect.objectContaining({ code: "EVIDENCE_BINDING_UNDECLARED" }));
    const forged = declareEvidence({ id: "q", version: 1 }, { id: "p.output", version: 1 }, { value: 3 });
    expect(() => evidenceForConsumer(manifest, { id: "c", version: 1 }, [forged])).toThrowError(expect.objectContaining({ code: "EVIDENCE_BINDING_UNDECLARED" }));
  });
});
