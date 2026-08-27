// DISPOSABLE product/buildability harness — D1921–D1926. Not production code.
import { readFileSync } from "node:fs";

import {
  compileEvidenceManifest,
  declareSpaceEvidence,
  evidenceForConsumer,
  renderEvidenceItems,
  voiceCheck,
  type AdapterDeclaration,
  type ConsumerDeclaration,
  type EvidenceContractDeclarations,
  type ProducerDeclaration,
  type ProjectionDeclaration,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { declareEvidence } from "../../packages/runtime/src/evidence-contract.js";

const ref = (id: string) => ({ id, version: 1 } as const);

function fixtureDeclarations(): EvidenceContractDeclarations {
  const projection: ProjectionDeclaration = {
    id: "fixture.output",
    version: 1,
    producer: ref("fixture"),
    role: "reading",
    plane: "rules",
    payloadType: "Fixture",
    semantics: "Fixture.",
    operands: ["value"],
    signs: ["state"],
    grounding: "position_rules",
    exactness: "exact",
    confidence: "not_applicable",
    abstention: { possible: false, reasons: [] },
    answerContent: ["fact"],
    forms: ["panel"],
    dependsOn: [],
    limitations: ["Fixture only."],
  };
  const producer: ProducerDeclaration = {
    id: "fixture",
    version: 1,
    plane: "rules",
    implementation: "fixture.ts",
    availability: "local",
    latency: "sync",
    outputs: [projection],
  };
  const consumer: ConsumerDeclaration = {
    id: "fixture.consumer",
    version: 1,
    implementation: "fixture-consumer.ts",
    accepts: [ref("fixture.output")],
    timing: ["analysis"],
    roles: ["operator"],
    sessions: ["pack"],
    forms: ["panel"],
    answerContent: ["fact"],
    latency: { mode: "sync", maxMs: 10 },
    budget: { maxFacts: 1, maxForms: 1 },
    providerOff: "available",
  };
  const adapter: AdapterDeclaration = {
    id: "fixture.adapter",
    version: 1,
    implementation: "fixture-adapter.ts",
    producer: ref("fixture"),
    projection: ref("fixture.output"),
    consumer: ref("fixture.consumer"),
    timing: ["analysis"],
    roles: ["operator"],
    sessions: ["pack"],
    forms: ["panel"],
    answerContent: ["fact"],
    latency: { mode: "sync", maxMs: 10 },
    budget: { maxFacts: 1, maxForms: 1 },
  };
  return { producers: [producer], consumers: [consumer], adapters: [adapter] };
}

describe("semantic-convention provenance draft against live boundaries", () => {
  it("cannot distinguish which alternative derivation member produced a declared value", () => {
    const first = declareEvidence(ref("derived.fixture"), ref("derived.fixture.output"), { value: 1 });
    const second = declareEvidence(ref("derived.fixture"), ref("derived.fixture.output"), { value: 1 });
    expect(first).toEqual(second);
    expect(Object.keys(first).sort()).toEqual(["payload", "producer", "projection"]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(() => Object.defineProperty(first, "conventionReceipt", { value: { path: 0, refs: [] } })).toThrow();
  });

  it("seals an unregistered instance convention because the adapter checks keys only", () => {
    const evidence = declareSpaceEvidence({
      fen: "not-even-a-fen",
      conventionId: "unregistered@999",
      colors: [],
      differentials: [],
    });
    expect((evidence.payload as { readonly conventionId: string }).conventionId).toBe("unregistered@999");
    expect(Object.isFrozen(evidence)).toBe(true);
  });

  it("accepts provider output that strips a renderer-supplied limitation", () => {
    const manifest = compileEvidenceManifest(fixtureDeclarations());
    const evidence = declareEvidence(ref("fixture"), ref("fixture.output"), { value: 1 });
    const admitted = evidenceForConsumer(manifest, ref("fixture.consumer"), [evidence]);
    const rendered = renderEvidenceItems(admitted, {
      "fixture.output@1": () => ["Detected definition. Required limitation."],
    });
    expect(voiceCheck(rendered, "Detected definition.").valid).toBe(true);
  });

  it("shows a same-change snapshot edit blesses the same-version rewrite", () => {
    const unchanged = (current: unknown, previous: unknown) => JSON.stringify(current) === JSON.stringify(previous);
    const rewritten = { ref: "space@1", definition: "new truth set" };
    expect(unchanged(rewritten, rewritten)).toBe(true);
  });

  it("shows the persisted run has no projection or convention receipt authority", () => {
    const schema = readFileSync("schemas/drill_run.schema.json", "utf8");
    const node = schema.match(/"node": \{[\s\S]*?\n    \},\n    "branch"/u)?.[0] ?? "";
    expect(node).toContain('"evidenceRefs"');
    expect(node).not.toMatch(/conventionReceipt|conventionRefs|projectionVersion/u);
    const rfc = readFileSync("rfc/semantic-convention-provenance.md", "utf8");
    expect(rfc).toContain("```tabiya-claims\nnone\n```");
  });

  it("finds no literal declaration population for the 39 required definitions", () => {
    const rfc = readFileSync("rfc/semantic-convention-provenance.md", "utf8");
    const definitionFields = rfc.match(/readonly definition: string/g) ?? [];
    expect(definitionFields).toHaveLength(1);
    expect(rfc).toContain("pins **39** initial members");
    expect(rfc).not.toContain("const CONVENTION_DECLARATIONS");
  });
});
