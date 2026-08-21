import { describe, expect, it } from "vitest";

import {
  EVIDENCE_MANIFEST_ERROR_CODES,
  EvidenceManifestError,
  compileEvidenceManifest,
  declareEvidence,
  evidenceForConsumer,
  renderEvidenceItems,
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
  "EVIDENCE_DEPENDENCY_CYCLE", "EVIDENCE_DERIVATION_WIDENS", "EVIDENCE_GENERIC_BYPASS",
  "EVIDENCE_PROVIDER_FALLBACK_MISSING",
  "EVIDENCE_EVENT_DUPLICATE", "EVIDENCE_EVENT_PROJECTION_MISSING", "EVIDENCE_EVENT_DERIVATION_MISMATCH",
  "EVIDENCE_EVENT_SIGN_WIDENS", "EVIDENCE_EVENT_OPERAND_MISSING", "EVIDENCE_EVENT_UNVALIDATED",
  "EVIDENCE_EVENT_PROJECTION_REFUSED", "EVIDENCE_EVENT_VALENCE_UNBACKED", "EVIDENCE_ELIGIBILITY_DUPLICATE",
  "EVIDENCE_ELIGIBILITY_ORPHANED", "EVIDENCE_REASON_DUPLICATE", "EVIDENCE_POLICY_DUPLICATE",
  "EVIDENCE_POLICY_INVALID", "EVIDENCE_POLICY_CONSUMER_MISSING", "EVIDENCE_POLICY_CRITICAL_REFUSED",
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

  it("raises each of the thirteen stable error families from an isolated negative", () => {
    const qProjection = projection("p.output", "q");
    const disposedProjection = { ...projection(), disposition: { kind: "retired" as const, reason: "fixture" } };
    const missingConsumer = consumer([{ id: "missing.output", version: 1 }]);
    const cases: Readonly<Record<string, EvidenceContractDeclarations>> = {
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
      EVIDENCE_DERIVATION_WIDENS: { ...base(), producers: [producer(), producer({ ...projection("q.output", "q"), plane: "derived", grounding: "declared_convention", derivation: { inputs: [{ id: "p.output", version: 1 }] }, disposition: { kind: "operator_only", reason: "fixture" } }, "q")] },
      ...semanticErrorCases(),
    };
    for (const expected of ERROR_TABLE) expect(code(cases[expected]!), expected).toBe(expected);
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
    expect(evidenceForConsumer(manifest, { id: "c", version: 1 }, [allowed, other]).items).toEqual([allowed]);
    expect(() => evidenceForConsumer(manifest, { id: "missing", version: 1 }, [allowed])).toThrowError(expect.objectContaining({ code: "EVIDENCE_BINDING_UNDECLARED" }));
    const forged = declareEvidence({ id: "q", version: 1 }, { id: "p.output", version: 1 }, { value: 3 });
    expect(() => evidenceForConsumer(manifest, { id: "c", version: 1 }, [forged])).toThrowError(expect.objectContaining({ code: "EVIDENCE_BINDING_UNDECLARED" }));
  });

  it("seals admitted and rendered views at runtime", () => {
    const manifest = compileEvidenceManifest(base());
    const evidence = declareEvidence({ id: "p", version: 1 }, { id: "p.output", version: 1 }, { value: 1 });
    const admitted = evidenceForConsumer(manifest, { id: "c", version: 1 }, [evidence]);
    const rendered = renderEvidenceItems(admitted, { "p.output@1": () => ["one"] });
    expect(rendered.items[0]?.sentences).toEqual(["one"]);
    expect(() => renderEvidenceItems({ consumer: { id: "c", version: 1 }, items: [evidence] } as never, { "p.output@1": () => ["forged"] })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });

  it("refuses every derived-evidence widening and incomplete ancestry shape", () => {
    const declarations = (input: ProjectionDeclaration, derived: Partial<ProjectionDeclaration>): EvidenceContractDeclarations => {
      const output = { ...projection("q.output", "q"), plane: "derived" as const, grounding: input.grounding, exactness: input.exactness, answerContent: input.answerContent, abstention: input.abstention, derivation: { inputs: [{ id: "p.output", version: 1 }] }, disposition: { kind: "operator_only" as const, reason: "derived fixture" }, ...derived };
      return { producers: [producer(input), producer(output, "q")], consumers: [consumer()], adapters: [adapter()] };
    };
    const measured = { ...projection(), exactness: "measured" as const };
    expect(code(declarations(measured, { exactness: "exact" }))).toBe("EVIDENCE_DERIVATION_WIDENS");
    expect(code(declarations(projection(), { answerContent: ["move"] }))).toBe("EVIDENCE_DERIVATION_WIDENS");
    const abstaining = { ...projection(), abstention: { possible: true, reasons: ["provider_unavailable"] } };
    expect(code(declarations(abstaining, { abstention: { possible: false, reasons: [] } }))).toBe("EVIDENCE_DERIVATION_WIDENS");
    expect(code(declarations(projection(), { derivation: { inputs: [{ id: "missing.output", version: 1 }] } }))).toBe("EVIDENCE_DEPENDENCY_MISSING");
    expect(code(declarations(projection(), { derivation: { inputs: [] } }))).toBe("EVIDENCE_PROJECTION_INCOMPLETE");
    const cyclic = declarations({ ...projection(), dependsOn: [{ id: "q.output", version: 1 }] }, {});
    expect(code(cyclic)).toBe("EVIDENCE_DEPENDENCY_CYCLE");
  });
});

function semanticDeclarations(): EvidenceContractDeclarations {
  const output = { ...projection(), role: "event" as const };
  return {
    producers: [producer(output)], consumers: [consumer()], adapters: [adapter()],
    semanticEvents: [{ projection: { id: "p.output", version: 1 }, allowedSigns: ["state"], requiredOperands: ["fen"], valence: "none", validation: { positives: ["positive"], hardNegatives: ["negative"] } }],
    eligibility: [{ event: { id: "p.output", version: 1 }, consumer: { id: "c", version: 1 }, disposition: "eligible", reason: { id: "eligible", version: 1 }, allowedSigns: ["state"], requiredOperands: ["fen"], valenceAuthority: [] }],
    reasons: [{ id: "eligible", version: 1, stage: "eligibility", meaning: "fixture eligible" }, { id: "empty", version: 1, stage: "selection", meaning: "fixture empty" }],
    selectionPolicies: [{ id: "policy", version: 1, consumer: { id: "c", version: 1 }, disposition: "experimental", minimumAlternatives: 1, maximumSameFamilyShare: 0.2, minimumAlternativeOnlyShare: 0.3, maxFacts: 1, criticalEvents: [{ id: "p.output", version: 1 }] }],
  };
}

function semanticErrorCases(): Record<string, EvidenceContractDeclarations> {
  const valid = semanticDeclarations();
  const event = valid.semanticEvents![0]!;
  const row = valid.eligibility![0]!;
  const policy = valid.selectionPolicies![0]!;
  return {
    EVIDENCE_EVENT_DUPLICATE: { ...valid, semanticEvents: [event, event] },
    EVIDENCE_EVENT_PROJECTION_MISSING: { ...valid, semanticEvents: [{ ...event, projection: { id: "missing.event", version: 1 } }], eligibility: [], selectionPolicies: [] },
    EVIDENCE_EVENT_DERIVATION_MISMATCH: { ...valid, semanticEvents: [{ ...event, derivationInputs: [{ id: "p.output", version: 1 }] }] },
    EVIDENCE_EVENT_SIGN_WIDENS: { ...valid, semanticEvents: [{ ...event, allowedSigns: ["lost"] }] },
    EVIDENCE_EVENT_OPERAND_MISSING: { ...valid, semanticEvents: [{ ...event, requiredOperands: ["missing"] }] },
    EVIDENCE_EVENT_UNVALIDATED: { ...valid, semanticEvents: [{ ...event, validation: { positives: [], hardNegatives: ["negative"] } }] },
    EVIDENCE_EVENT_PROJECTION_REFUSED: { ...valid, producers: [producer()], eligibility: [], selectionPolicies: [] },
    EVIDENCE_EVENT_VALENCE_UNBACKED: { ...valid, semanticEvents: [{ ...event, valence: "source_required" }] },
    EVIDENCE_ELIGIBILITY_DUPLICATE: { ...valid, eligibility: [row, row] },
    EVIDENCE_ELIGIBILITY_ORPHANED: { ...valid, eligibility: [{ ...row, consumer: { id: "missing", version: 1 } }], selectionPolicies: [] },
    EVIDENCE_REASON_DUPLICATE: { ...valid, reasons: [valid.reasons![0]!, valid.reasons![0]!] },
    EVIDENCE_POLICY_DUPLICATE: { ...valid, selectionPolicies: [policy, policy] },
    EVIDENCE_POLICY_INVALID: { ...valid, selectionPolicies: [{ ...policy, maximumSameFamilyShare: Number.NaN }] },
    EVIDENCE_POLICY_CONSUMER_MISSING: { ...valid, selectionPolicies: [{ ...policy, consumer: { id: "missing", version: 1 } }] },
    EVIDENCE_POLICY_CRITICAL_REFUSED: { ...valid, selectionPolicies: [{ ...policy, criticalEvents: [{ id: "missing.event", version: 1 }] }] },
  };
}
