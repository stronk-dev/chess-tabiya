// DISPOSABLE product/buildability harness — D1921–D1926. Not production code.
import { readFileSync } from "node:fs";
import { generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";

import {
  compileEvidenceManifest,
  declareSpaceEvidence,
  evidenceForConsumer,
  PRIMARY_EVIDENCE_MANIFEST,
  renderEvidenceItems,
  voiceCheck,
  type AdapterDeclaration,
  type ConsumerDeclaration,
  type EvidenceContractDeclarations,
  type ProducerDeclaration,
  type ProjectionDeclaration,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { assertDeclaredEvidence, declareEvidence, evidenceDigest } from "../../packages/runtime/src/evidence-contract.js";

const ref = (id: string) => ({ id, version: 1 } as const);
const refKey = (value: { readonly id: string; readonly version: number }) => `${value.id}@${value.version}`;

type ConventionRef = Readonly<{ id: string; version: number }>;

interface ConventionDeclarationFixture {
  readonly ref: ConventionRef;
}

interface ConventionProjectionFixture {
  readonly projection: ConventionRef;
  readonly direct: readonly ConventionRef[];
  readonly derivationAnyOf?: readonly (readonly ConventionRef[])[];
}

interface ConventionReceiptFixture {
  readonly refs: readonly ConventionRef[];
  readonly derivation:
    | Readonly<{ kind: "source" }>
    | Readonly<{
        kind: "derived";
        member: string;
        inputs: readonly Readonly<{
          projection: ConventionRef;
          valueDigest: string;
        }>[];
      }>;
  readonly registryDigest: string;
  readonly digest: string;
}

interface ConventionSealedEvidence<T = unknown> {
  readonly evidence: ReturnType<typeof declareEvidence<T>>;
  readonly conventionReceipt: ConventionReceiptFixture;
}

const CONVENTION_VALUES = new WeakSet<object>();

function canonicalMember(member: readonly ConventionRef[]): string {
  return member.map(refKey).sort().join("|");
}

function exactValueDigest(value: ConventionSealedEvidence): string {
  return evidenceDigest({
    producer: value.evidence.producer,
    projection: value.evidence.projection,
    payload: value.evidence.payload,
    conventionReceiptDigest: value.conventionReceipt.digest,
  });
}

function assertConventionSealed(value: unknown): asserts value is ConventionSealedEvidence {
  if (typeof value !== "object" || value === null || !CONVENTION_VALUES.has(value)) {
    throw new TypeError("Convention evidence was not constructed by the compiler-owned seal");
  }
}

function sealConventionEvidence<T>(input: {
  readonly evidence: ReturnType<typeof declareEvidence<T>>;
  readonly projection: ConventionProjectionFixture;
  readonly registry: readonly ConventionDeclarationFixture[];
  readonly registryDigest: string;
  readonly instanceRefs?: readonly ConventionRef[];
  readonly derivationInputs?: readonly ConventionSealedEvidence[];
}): ConventionSealedEvidence<T> {
  assertDeclaredEvidence(input.evidence);
  if (refKey(input.evidence.projection) !== refKey(input.projection.projection)) {
    throw new TypeError("Convention projection does not match the sealed evidence value");
  }
  const registered = new Set(input.registry.map((value) => refKey(value.ref)));
  const direct = [...input.projection.direct, ...(input.instanceRefs ?? [])];
  for (const convention of direct) {
    if (!registered.has(refKey(convention))) throw new TypeError(`Unregistered convention ${refKey(convention)}`);
  }
  const inputs = [...(input.derivationInputs ?? [])];
  for (const value of inputs) assertConventionSealed(value);
  const actualFamilies = [...new Set(inputs.map((value) => refKey(value.evidence.projection)))].sort();
  const possibleMembers = input.projection.derivationAnyOf;
  if (possibleMembers === undefined && inputs.length > 0) throw new TypeError("Source evidence cannot carry derivation inputs");
  const matching = (possibleMembers ?? []).filter((member) => {
    const expected = [...new Set(member.map(refKey))].sort();
    return evidenceDigest(expected) === evidenceDigest(actualFamilies);
  });
  if (possibleMembers !== undefined && matching.length !== 1) throw new TypeError("Exact derivation inputs do not select one canonical member");
  const exactInputs = inputs.map((value) => Object.freeze({
    projection: Object.freeze({ ...value.evidence.projection }),
    valueDigest: exactValueDigest(value),
  })).sort((left, right) => `${refKey(left.projection)}:${left.valueDigest}`.localeCompare(`${refKey(right.projection)}:${right.valueDigest}`));
  const refsByKey = new Map<string, ConventionRef>();
  for (const convention of [...inputs.flatMap((value) => value.conventionReceipt.refs), ...direct]) {
    refsByKey.set(refKey(convention), Object.freeze({ ...convention }));
  }
  const refs = [...refsByKey.values()].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  const derivation = possibleMembers === undefined
    ? Object.freeze({ kind: "source" as const })
    : Object.freeze({ kind: "derived" as const, member: canonicalMember(matching[0]!), inputs: Object.freeze(exactInputs) });
  const receiptBase = { refs, derivation, registryDigest: input.registryDigest };
  const value = Object.freeze({
    evidence: input.evidence,
    conventionReceipt: Object.freeze({ ...receiptBase, digest: evidenceDigest(receiptBase) }),
  });
  CONVENTION_VALUES.add(value);
  return value;
}

interface DisclosureDeclarationFixture {
  readonly definition: string;
  readonly limitations: readonly string[];
}

function assembleConventionDisclosure(
  providerSummary: string,
  declaration: DisclosureDeclarationFixture,
): Readonly<{ summary: string; mandatoryLimitations: readonly string[]; detail: string }> {
  if (providerSummary.trim().length === 0) throw new TypeError("Provider summary is blank");
  if (declaration.limitations.length === 0 || declaration.limitations.some((value) => value.trim().length === 0)) {
    throw new TypeError("Convention limitations are not complete");
  }
  return Object.freeze({
    summary: providerSummary,
    mandatoryLimitations: Object.freeze([...declaration.limitations]),
    detail: [providerSummary, ...declaration.limitations].join("\n"),
  });
}

interface SemanticHistoryRowFixture {
  readonly ref: string;
  readonly semanticDigest: string;
  readonly registryDigest: string;
  readonly ownerRfc: string;
  readonly landingCommit: string;
}

function assertAppendOnlySemanticHistory(
  parent: readonly SemanticHistoryRowFixture[],
  staged: readonly SemanticHistoryRowFixture[],
): void {
  if (staged.length < parent.length) throw new TypeError("Semantic history deleted a landed row");
  for (let index = 0; index < parent.length; index += 1) {
    if (JSON.stringify(staged[index]) !== JSON.stringify(parent[index])) {
      throw new TypeError("Semantic history rewrote or reordered a landed row");
    }
  }
  const seen = new Set<string>();
  const heads = new Map<string, number>();
  for (const row of staged) {
    if (seen.has(row.ref)) throw new TypeError("Semantic history duplicates a convention ref");
    seen.add(row.ref);
    const match = /^([a-z][a-z0-9_-]*)@([1-9][0-9]*)$/u.exec(row.ref);
    if (match === null) throw new TypeError("Semantic history contains an invalid convention ref");
    const version = Number(match[2]);
    const head = heads.get(match[1]!) ?? 0;
    if (version !== head + 1) throw new TypeError("Semantic history skips or rewinds a lineage");
    heads.set(match[1]!, version);
  }
}

interface PersistedSemanticReceiptFixture {
  readonly evidenceRef: string;
  readonly producer: ConventionRef;
  readonly projection: ConventionRef;
  readonly payloadDigest: string;
  readonly convention: ConventionReceiptFixture;
  readonly attestation: Readonly<{
    algorithm: "ed25519";
    keyId: string;
    signature: string;
  }>;
}

interface HistoricalRegistryFixture {
  readonly digest: string;
  readonly refs: readonly string[];
  readonly derivedMembers: Readonly<Record<string, readonly string[]>>;
}

const RESEALED_PERSISTED_VALUES = new WeakSet<object>();

function persistedAttestationBytes(value: Omit<PersistedSemanticReceiptFixture, "attestation">): Buffer {
  return Buffer.from(evidenceDigest(value), "utf8");
}

function serializeSemanticReceipt(
  evidenceRef: string,
  value: ConventionSealedEvidence,
  signer: Readonly<{ keyId: string; privateKey: KeyObject }>,
): PersistedSemanticReceiptFixture {
  assertConventionSealed(value);
  const envelope = Object.freeze({
    evidenceRef,
    producer: Object.freeze({ ...value.evidence.producer }),
    projection: Object.freeze({ ...value.evidence.projection }),
    payloadDigest: evidenceDigest(value.evidence.payload),
    convention: value.conventionReceipt,
  });
  return Object.freeze({
    ...envelope,
    attestation: Object.freeze({
      algorithm: "ed25519" as const,
      keyId: signer.keyId,
      signature: sign(null, persistedAttestationBytes(envelope), signer.privateKey).toString("base64"),
    }),
  });
}

function reSealPersistedSemanticReceipt(
  persisted: PersistedSemanticReceiptFixture,
  history: readonly HistoricalRegistryFixture[],
  trustedKeys: Readonly<Record<string, KeyObject>>,
): PersistedSemanticReceiptFixture {
  const trustedKey = trustedKeys[persisted.attestation.keyId];
  if (trustedKey === undefined) throw new TypeError("untrusted_receipt_origin");
  const { attestation, ...envelope } = persisted;
  if (attestation.algorithm !== "ed25519" || !verify(null, persistedAttestationBytes(envelope), trustedKey, Buffer.from(attestation.signature, "base64"))) {
    throw new TypeError("persisted_semantic_attestation_invalid");
  }
  const snapshot = history.find((value) => value.digest === persisted.convention.registryDigest);
  if (snapshot === undefined) throw new TypeError("historical_convention_unavailable");
  const registered = new Set(snapshot.refs);
  for (const convention of persisted.convention.refs) {
    if (!registered.has(refKey(convention))) throw new TypeError("Persisted receipt names an unavailable convention");
  }
  const base = {
    refs: persisted.convention.refs,
    derivation: persisted.convention.derivation,
    registryDigest: persisted.convention.registryDigest,
  };
  if (evidenceDigest(base) !== persisted.convention.digest) throw new TypeError("Persisted convention receipt digest mismatch");
  if (persisted.convention.derivation.kind === "derived") {
    const expected = snapshot.derivedMembers[refKey(persisted.projection)] ?? [];
    if (!expected.includes(persisted.convention.derivation.member)) throw new TypeError("Persisted derivation member is unavailable");
    const canonical = [...persisted.convention.derivation.inputs]
      .sort((left, right) => `${refKey(left.projection)}:${left.valueDigest}`.localeCompare(`${refKey(right.projection)}:${right.valueDigest}`));
    if (JSON.stringify(canonical) !== JSON.stringify(persisted.convention.derivation.inputs)) throw new TypeError("Persisted derivation multiset is not canonical");
  }
  const value = Object.freeze({ ...persisted, convention: Object.freeze({ ...persisted.convention }) });
  RESEALED_PERSISTED_VALUES.add(value);
  return value;
}

function assertResealedPersistedSemanticReceipt(value: unknown): asserts value is PersistedSemanticReceiptFixture {
  if (typeof value !== "object" || value === null || !RESEALED_PERSISTED_VALUES.has(value)) {
    throw new TypeError("Persisted semantic receipt was not re-sealed");
  }
}

interface ConventionOperandExtractor {
  readonly projection: string;
  readonly operands: readonly string[];
  readonly extract: (payload: Readonly<Record<string, unknown>>) => Readonly<{
    refs: readonly string[];
    retained: Readonly<Record<string, unknown>>;
  }>;
}

const STRING_REF = /^[a-z][a-z0-9_-]*@[1-9][0-9]*$/;

function stringRef(value: unknown, label: string): string {
  if (typeof value !== "string" || !STRING_REF.test(value)) throw new TypeError(`${label} is not an exact convention ref`);
  return value;
}

function oneStringRef(projection: string, operand: string): ConventionOperandExtractor {
  return Object.freeze({
    projection,
    operands: [operand],
    extract: (payload: Readonly<Record<string, unknown>>) => Object.freeze({ refs: [stringRef(payload[operand], operand)], retained: Object.freeze({}) }),
  });
}

const CONVENTION_OPERAND_EXTRACTORS: readonly ConventionOperandExtractor[] = Object.freeze([
  oneStringRef("derived.material.event.role_asymmetry@1", "conventionId"),
  oneStringRef("derived.material.reading.role_signature@1", "conventionId"),
  oneStringRef("derived.pawn.sequence.harassment_pressure@1", "conventionId"),
  oneStringRef("derived.tactic.defender_exposure@1", "passConvention"),
  {
    projection: "derived.grade.move_quality@1",
    operands: ["convention"],
    extract: (payload) => {
      const convention = payload.convention;
      if (typeof convention !== "object" || convention === null || Array.isArray(convention)) throw new TypeError("convention is not an object");
      const record = convention as Readonly<Record<string, unknown>>;
      if (typeof record.id !== "string" || typeof record.version !== "number" || !Number.isInteger(record.version) || record.version < 1) throw new TypeError("convention identity is invalid");
      if (typeof record.context !== "string" || !new Set(["opening", "middlegame", "endgame"]).has(record.context)) throw new TypeError("grade context is invalid");
      return Object.freeze({ refs: [`${record.id}@${record.version}`], retained: Object.freeze({ context: record.context }) });
    },
  },
  oneStringRef("rules.exchange.predicate.legal_exchange@1", "conventionId"),
  {
    projection: "rules.king.reading.zone_state@1",
    operands: ["zoneConventionId", "shelterConventionId"],
    extract: (payload) => Object.freeze({
      refs: [stringRef(payload.zoneConventionId, "zoneConventionId"), stringRef(payload.shelterConventionId, "shelterConventionId")],
      retained: Object.freeze({}),
    }),
  },
  oneStringRef("rules.mobility.reading.piece_destinations@1", "conventionId"),
  oneStringRef("rules.pawn.reading.candidate_majority@1", "conventionId"),
  oneStringRef("rules.phase.development@1", "conventionId"),
  oneStringRef("rules.structural.reading.space@1", "conventionId"),
  oneStringRef("rules.tactic.consequence.threat@1", "conventionId"),
  oneStringRef("rules.tactic.reading.back_rank@1", "conventionId"),
  oneStringRef("rules.tactic.reading.trapped_piece@1", "conventionId"),
]);

function exactPayloadKeys(payload: Readonly<Record<string, unknown>>, required: readonly string[]): void {
  const actual = Object.keys(payload).sort();
  const expected = [...required].sort();
  if (evidenceDigest(actual) !== evidenceDigest(expected)) throw new TypeError("Evidence payload keys are not exact");
}

function extractConventionOperands(input: {
  readonly projection: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly applicableProjections: readonly string[];
  readonly registeredRefs: readonly string[];
}): Readonly<{ refs: readonly string[]; retained: Readonly<Record<string, unknown>> }> {
  const extractorKeys = CONVENTION_OPERAND_EXTRACTORS.map((value) => value.projection).sort();
  const applicable = [...input.applicableProjections].sort();
  if (evidenceDigest(extractorKeys) !== evidenceDigest(applicable)) throw new TypeError("Convention operand extractors are not set-equal to instance-varying projections");
  const extractor = CONVENTION_OPERAND_EXTRACTORS.find((value) => value.projection === input.projection);
  if (extractor === undefined) throw new TypeError(`No convention extractor for ${input.projection}`);
  const extracted = extractor.extract(input.payload);
  const registered = new Set(input.registeredRefs);
  for (const value of extracted.refs) {
    if (!registered.has(value)) throw new TypeError(`Unregistered convention ${value}`);
  }
  return Object.freeze({ refs: Object.freeze([...extracted.refs]), retained: Object.freeze({ ...extracted.retained }) });
}

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

  it("shows production persistence is absent while the amended RFC claims its exact lane", () => {
    const schema = readFileSync("schemas/drill_run.schema.json", "utf8");
    const node = schema.match(/"node": \{[\s\S]*?\n    \},\n    "branch"/u)?.[0] ?? "";
    expect(node).toContain('"evidenceRefs"');
    expect(node).not.toMatch(/conventionReceipt|conventionRefs|projectionVersion/u);
    const rfc = readFileSync("rfc/semantic-convention-provenance.md", "utf8");
    expect(rfc).toContain("run-schema | lane 0.24 | EvidenceAttachedEvent gains optional semanticReceipts");
    expect(rfc).toContain("reSealPersistedSemanticEvidenceReceipt");
  });

  it("finds no literal declaration population for the 39 required definitions", () => {
    const rfc = readFileSync("rfc/semantic-convention-provenance.md", "utf8");
    const definitionFields = rfc.match(/readonly definition: string/g) ?? [];
    expect(definitionFields).toHaveLength(1);
    expect(rfc).toContain("pins **39** initial members");
    expect(rfc).not.toContain("const CONVENTION_DECLARATIONS");
  });
});

describe("D1921 compiler-owned value seal candidate", () => {
  const registry = Object.freeze([
    { ref: ref("source-a") },
    { ref: ref("source-b") },
    { ref: ref("composition") },
  ]);
  const registryDigest = evidenceDigest(registry);
  const sourceAProjection: ConventionProjectionFixture = { projection: ref("fixture.source_a"), direct: [ref("source-a")] };
  const sourceBProjection: ConventionProjectionFixture = { projection: ref("fixture.source_b"), direct: [ref("source-b")] };
  const outputProjection: ConventionProjectionFixture = {
    projection: ref("fixture.derived"),
    direct: [ref("composition")],
    derivationAnyOf: [[ref("fixture.source_a")], [ref("fixture.source_b")]],
  };

  function sourceA(payload: object): ConventionSealedEvidence {
    return sealConventionEvidence({
      evidence: declareEvidence(ref("fixture"), ref("fixture.source_a"), payload),
      projection: sourceAProjection,
      registry,
      registryDigest,
    });
  }

  function sourceB(payload: object): ConventionSealedEvidence {
    return sealConventionEvidence({
      evidence: declareEvidence(ref("fixture"), ref("fixture.source_b"), payload),
      projection: sourceBProjection,
      registry,
      registryDigest,
    });
  }

  function derived(inputs: readonly ConventionSealedEvidence[]): ConventionSealedEvidence {
    return sealConventionEvidence({
      evidence: declareEvidence(ref("fixture"), ref("fixture.derived"), { value: 1 }),
      projection: outputProjection,
      registry,
      registryDigest,
      derivationInputs: inputs,
    });
  }

  it("distinguishes same-output values produced through different canonical members", () => {
    const throughA = derived([sourceA({ square: "a1" })]);
    const throughB = derived([sourceB({ square: "a1" })]);
    expect(throughA.evidence.payload).toEqual(throughB.evidence.payload);
    expect(throughA.conventionReceipt.derivation).toMatchObject({ kind: "derived", member: "fixture.source_a@1" });
    expect(throughB.conventionReceipt.derivation).toMatchObject({ kind: "derived", member: "fixture.source_b@1" });
    expect(throughA.conventionReceipt.digest).not.toBe(throughB.conventionReceipt.digest);
    expect(throughA.conventionReceipt.refs.map(refKey)).toEqual(["composition@1", "source-a@1"]);
    expect(throughB.conventionReceipt.refs.map(refKey)).toEqual(["composition@1", "source-b@1"]);
  });

  it("retains exact input identity and multiplicity while keeping order canonical", () => {
    const first = sourceA({ square: "a1" });
    const second = sourceA({ square: "a2" });
    const repeatedProjection: ConventionProjectionFixture = {
      projection: ref("fixture.derived"), direct: [], derivationAnyOf: [[ref("fixture.source_a")]],
    };
    const seal = (inputs: readonly ConventionSealedEvidence[]) => sealConventionEvidence({
      evidence: declareEvidence(ref("fixture"), ref("fixture.derived"), { value: 1 }),
      projection: repeatedProjection,
      registry,
      registryDigest,
      derivationInputs: inputs,
    });
    const forward = seal([first, second]);
    const reversed = seal([second, first]);
    expect(forward.conventionReceipt.derivation.kind).toBe("derived");
    if (forward.conventionReceipt.derivation.kind !== "derived") throw new TypeError("Expected derived receipt");
    expect(forward.conventionReceipt.derivation.inputs).toHaveLength(2);
    expect(new Set(forward.conventionReceipt.derivation.inputs.map((value) => value.valueDigest)).size).toBe(2);
    expect(forward.conventionReceipt.digest).toBe(reversed.conventionReceipt.digest);
    const repeated = seal([first, first]).conventionReceipt.derivation;
    expect(repeated.kind).toBe("derived");
    if (repeated.kind !== "derived") throw new TypeError("Expected derived receipt");
    expect(repeated.inputs).toHaveLength(2);
  });

  it("refuses missing, extra, ambiguous, unsealed and forged inputs", () => {
    expect(() => derived([])).toThrow(/select one canonical member/);
    expect(() => derived([sourceA({ square: "a1" }), sourceB({ square: "b1" })])).toThrow(/select one canonical member/);
    const ambiguous: ConventionProjectionFixture = {
      projection: ref("fixture.derived"),
      direct: [],
      derivationAnyOf: [[ref("fixture.source_a")], [ref("fixture.source_a")]],
    };
    expect(() => sealConventionEvidence({
      evidence: declareEvidence(ref("fixture"), ref("fixture.derived"), { value: 1 }),
      projection: ambiguous,
      registry,
      registryDigest,
      derivationInputs: [sourceA({ square: "a1" })],
    })).toThrow(/select one canonical member/);
    const genuine = sourceA({ square: "a1" });
    expect(() => derived([{ ...genuine } as ConventionSealedEvidence])).toThrow(/compiler-owned seal/);
    expect(() => derived([JSON.parse(JSON.stringify(genuine)) as ConventionSealedEvidence])).toThrow(/compiler-owned seal/);
    expect(() => assertConventionSealed({ evidence: genuine.evidence, conventionReceipt: genuine.conventionReceipt })).toThrow(/compiler-owned seal/);
  });
});

describe("D1924 deterministic disclosure assembler candidate", () => {
  it("appends every mandatory limitation even when the provider returns only a valid summary", () => {
    const declaration = {
      definition: "A fixed, registered definition.",
      limitations: ["This is not a move grade.", "It does not establish intent."],
    };
    const result = assembleConventionDisclosure("A shorter grounded summary.", declaration);
    expect(result.summary).toBe("A shorter grounded summary.");
    expect(result.mandatoryLimitations).toEqual(declaration.limitations);
    expect(result.detail).toContain("This is not a move grade.");
    expect(result.detail).toContain("It does not establish intent.");
  });

  it("refuses a declaration whose deterministic limitations are absent or blank", () => {
    expect(() => assembleConventionDisclosure("Summary.", { definition: "Definition.", limitations: [] })).toThrow(/not complete/);
    expect(() => assembleConventionDisclosure("Summary.", { definition: "Definition.", limitations: [""] })).toThrow(/not complete/);
  });
});

describe("D1925 append-only semantic history candidate", () => {
  const spaceV1: SemanticHistoryRowFixture = {
    ref: "space@1", semanticDigest: "old-space", registryDigest: "registry-v1",
    ownerRfc: "rfc/archive/space.md", landingCommit: "1111111",
  };

  it("refuses same-version rewrite, deletion and reorder even when staged bytes agree with themselves", () => {
    const rewritten = { ...spaceV1, semanticDigest: "new-space", registryDigest: "refreshed" };
    expect(() => assertAppendOnlySemanticHistory([spaceV1], [rewritten])).toThrow(/rewrote or reordered/);
    expect(() => assertAppendOnlySemanticHistory([spaceV1], [])).toThrow(/deleted/);
    const otherV1 = { ...spaceV1, ref: "threat@1", semanticDigest: "threat" };
    expect(() => assertAppendOnlySemanticHistory([spaceV1, otherV1], [otherV1, spaceV1])).toThrow(/rewrote or reordered/);
  });

  it("accepts an exact next-version append and refuses skipped lineage", () => {
    const spaceV2 = { ...spaceV1, ref: "space@2", semanticDigest: "space-v2", registryDigest: "registry-v2", landingCommit: "2222222" };
    expect(() => assertAppendOnlySemanticHistory([spaceV1], [spaceV1, spaceV2])).not.toThrow();
    expect(() => assertAppendOnlySemanticHistory([spaceV1], [spaceV1, { ...spaceV2, ref: "space@3" }])).toThrow(/skips or rewinds/);
  });
});

describe("D1926 persisted semantic receipt candidate", () => {
  const origin = generateKeyPairSync("ed25519");
  const signer = { keyId: "installation-1", privateKey: origin.privateKey };
  const trustedKeys = { "installation-1": origin.publicKey };
  const registry = Object.freeze([{ ref: ref("source-a") }, { ref: ref("composition") }]);
  const registryDigest = evidenceDigest(registry);
  const sourceProjection: ConventionProjectionFixture = { projection: ref("fixture.source_a"), direct: [ref("source-a")] };
  const derivedProjection: ConventionProjectionFixture = {
    projection: ref("fixture.derived"), direct: [ref("composition")], derivationAnyOf: [[ref("fixture.source_a")]],
  };
  const source = sealConventionEvidence({
    evidence: declareEvidence(ref("fixture"), ref("fixture.source_a"), { square: "a1" }),
    projection: sourceProjection, registry, registryDigest,
  });
  const derived = sealConventionEvidence({
    evidence: declareEvidence(ref("fixture"), ref("fixture.derived"), { value: 1 }),
    projection: derivedProjection, registry, registryDigest, derivationInputs: [source],
  });
  const history: readonly HistoricalRegistryFixture[] = [{
    digest: registryDigest,
    refs: ["composition@1", "source-a@1"],
    derivedMembers: { "fixture.derived@1": ["fixture.source_a@1"] },
  }];

  it("requires compiler resealing after JSON load and preserves a v1 historical snapshot after head advances", () => {
    const persisted = serializeSemanticReceipt("evidence-1", derived, signer);
    const parsed = JSON.parse(JSON.stringify(persisted)) as PersistedSemanticReceiptFixture;
    expect(() => assertResealedPersistedSemanticReceipt(parsed)).toThrow(/not re-sealed/);
    const headV2: HistoricalRegistryFixture = { digest: "registry-v2", refs: ["composition@2", "source-a@1"], derivedMembers: {} };
    const resealed = reSealPersistedSemanticReceipt(parsed, [headV2, ...history], trustedKeys);
    expect(() => assertResealedPersistedSemanticReceipt(resealed)).not.toThrow();
    expect(resealed.convention.registryDigest).toBe(registryDigest);
  });

  it("refuses tampering, a missing historical snapshot and a noncanonical input multiset", () => {
    const persisted = serializeSemanticReceipt("evidence-1", derived, signer);
    expect(() => reSealPersistedSemanticReceipt({
      ...persisted,
      convention: { ...persisted.convention, refs: [ref("unknown")] },
    }, history, trustedKeys)).toThrow(/attestation_invalid/);
    expect(() => reSealPersistedSemanticReceipt(persisted, [], trustedKeys)).toThrow(/historical_convention_unavailable/);
    expect(() => reSealPersistedSemanticReceipt(persisted, history, {})).toThrow(/untrusted_receipt_origin/);
    if (persisted.convention.derivation.kind !== "derived") throw new TypeError("Expected derived receipt");
    const badOrder = [
      ...persisted.convention.derivation.inputs,
      { ...persisted.convention.derivation.inputs[0]!, valueDigest: "different" },
    ].sort((left, right) => `${refKey(left.projection)}:${left.valueDigest}`.localeCompare(`${refKey(right.projection)}:${right.valueDigest}`)).reverse();
    const badBase = {
      refs: persisted.convention.refs,
      derivation: { ...persisted.convention.derivation, inputs: badOrder },
      registryDigest: persisted.convention.registryDigest,
    };
    expect(() => reSealPersistedSemanticReceipt({
      ...persisted,
      convention: { ...badBase, digest: evidenceDigest(badBase) },
    }, history, trustedKeys)).toThrow(/attestation_invalid/);
  });

  it("treats a legacy absent receipt as honestly empty instead of manufacturing provenance", () => {
    const load = (receipt: PersistedSemanticReceiptFixture | undefined) => receipt === undefined ? [] : [reSealPersistedSemanticReceipt(receipt, history, trustedKeys)];
    expect(load(undefined)).toEqual([]);
  });
});

describe("D1922 typed convention operand extractor candidate", () => {
  const identityOperand = /(?:^|[._-])(?:convention(?:id|version)?|[a-z]+convention(?:id|version)?|passconvention)(?:$|[._-])/iu;
  const applicable = PRIMARY_EVIDENCE_MANIFEST.projections
    .filter((projection) => projection.operands.some((operand) => identityOperand.test(operand)))
    .map((projection) => refKey(projection));
  const registered = [
    "back_rank_susceptible@1", "candidate-majority@1", "development@1", "grade-convention@1",
    "king-shelter@1", "king-zone@1", "legal-exchange@1", "local-non-losing@1",
    "material-role-signature@1", "mover-turn-ep-cleared@1", "pressure-line@1", "space@1",
    "threat@1", "trapped@1",
  ];

  it("extracts string, multiple-ref and structured-grade shapes without making context a ref", () => {
    expect(extractConventionOperands({
      projection: "rules.structural.reading.space@1",
      payload: { conventionId: "space@1" },
      applicableProjections: applicable,
      registeredRefs: registered,
    })).toEqual({ refs: ["space@1"], retained: {} });
    expect(extractConventionOperands({
      projection: "rules.king.reading.zone_state@1",
      payload: { zoneConventionId: "king-zone@1", shelterConventionId: "king-shelter@1" },
      applicableProjections: applicable,
      registeredRefs: registered,
    })).toEqual({ refs: ["king-zone@1", "king-shelter@1"], retained: {} });
    expect(extractConventionOperands({
      projection: "derived.grade.move_quality@1",
      payload: { convention: { id: "grade-convention", version: 1, context: "middlegame" } },
      applicableProjections: applicable,
      registeredRefs: registered,
    })).toEqual({ refs: ["grade-convention@1"], retained: { context: "middlegame" } });
  });

  it("is set-equal to all fourteen live instance-varying projections and validates every string arm", () => {
    expect(CONVENTION_OPERAND_EXTRACTORS.map((value) => value.projection).sort()).toEqual([...applicable].sort());
    const cases = Object.freeze([
      ["derived.material.event.role_asymmetry@1", "conventionId", "material-role-signature@1"],
      ["derived.material.reading.role_signature@1", "conventionId", "material-role-signature@1"],
      ["derived.pawn.sequence.harassment_pressure@1", "conventionId", "pressure-line@1"],
      ["derived.tactic.defender_exposure@1", "passConvention", "mover-turn-ep-cleared@1"],
      ["rules.exchange.predicate.legal_exchange@1", "conventionId", "legal-exchange@1"],
      ["rules.mobility.reading.piece_destinations@1", "conventionId", "local-non-losing@1"],
      ["rules.pawn.reading.candidate_majority@1", "conventionId", "candidate-majority@1"],
      ["rules.phase.development@1", "conventionId", "development@1"],
      ["rules.structural.reading.space@1", "conventionId", "space@1"],
      ["rules.tactic.consequence.threat@1", "conventionId", "threat@1"],
      ["rules.tactic.reading.back_rank@1", "conventionId", "back_rank_susceptible@1"],
      ["rules.tactic.reading.trapped_piece@1", "conventionId", "trapped@1"],
    ] as const);
    for (const [projection, operand, value] of cases) {
      expect(extractConventionOperands({ projection, payload: { [operand]: value }, applicableProjections: applicable, registeredRefs: registered })).toEqual({ refs: [value], retained: {} });
    }
  });

  it("refuses absent, broad, malformed, unregistered and invalid-context values", () => {
    const extractSpace = (conventionId: unknown) => extractConventionOperands({
      projection: "rules.structural.reading.space@1",
      payload: { conventionId },
      applicableProjections: applicable,
      registeredRefs: registered,
    });
    expect(() => extractSpace(undefined)).toThrow(/exact convention ref/);
    expect(() => extractSpace("space")).toThrow(/exact convention ref/);
    expect(() => extractSpace("space@0")).toThrow(/exact convention ref/);
    expect(() => extractSpace("unregistered@999")).toThrow(/Unregistered convention/);
    expect(() => extractConventionOperands({
      projection: "derived.grade.move_quality@1",
      payload: { convention: { id: "grade-convention", version: 1, context: "blitzish" } },
      applicableProjections: applicable,
      registeredRefs: registered,
    })).toThrow(/grade context is invalid/);
  });

  it("fails when the extractor catalogue is not set-equal to instance-varying projections", () => {
    expect(() => extractConventionOperands({
      projection: "rules.structural.reading.space@1",
      payload: { conventionId: "space@1" },
      applicableProjections: applicable.slice(1),
      registeredRefs: registered,
    })).toThrow(/not set-equal/);
    expect(() => extractConventionOperands({
      projection: "rules.structural.reading.space@1",
      payload: { conventionId: "space@1" },
      applicableProjections: [...applicable, "fixture.unowned@1"],
      registeredRefs: registered,
    })).toThrow(/not set-equal/);
  });

  it("refuses an undeclared convention operand or any other extra field on a fixed projection", () => {
    expect(() => exactPayloadKeys({ value: 1, conventionId: "unregistered@999" }, ["value"])).toThrow(/not exact/);
    expect(() => exactPayloadKeys({ value: 1, undeclaredCallerData: "secret" }, ["value"])).toThrow(/not exact/);
    expect(() => exactPayloadKeys({ value: 1 }, ["value"])).not.toThrow();
  });
});
