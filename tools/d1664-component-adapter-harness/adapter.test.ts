// DISPOSABLE research harness — D1664. Not production code.
import { createHash } from "node:crypto";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertConsumerEvidenceView,
  declareAuthoredClaimDeliveryEvidence,
  declareStoryDerivedEvidence,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
} from "../../packages/runtime/src/index.js";
import { describe, expect, it } from "vitest";

interface ClaimPayload {
  readonly kind: "claim";
  readonly id: string;
  readonly text: string;
  readonly binding: "ledger_bound";
  readonly evidenceTypes: readonly string[];
  readonly earnedEvidenceTypes: readonly string[];
  readonly principles: readonly unknown[];
}

interface ClaimComponent {
  readonly kind: "claim";
  readonly text: string;
  readonly binding: "ledger_bound";
  readonly sourceProjection: "pack.authored.claim_delivery@1";
}

interface AdaptedComponentItem {
  readonly evidence: DeclaredEvidence<ClaimPayload>;
  readonly component: ClaimComponent;
}

interface ClaimWireBody {
  readonly version: 1;
  readonly producer: "pack.authored@1";
  readonly projection: "pack.authored.claim_delivery@1";
  readonly component: ClaimComponent;
}

interface ClaimWireReceipt extends ClaimWireBody {
  readonly digest: string;
}

interface ParsedClaimReceipt extends ClaimWireReceipt {}

interface MutableClaimWireReceipt {
  version: 1;
  producer: "pack.authored@1";
  projection: "pack.authored.claim_delivery@1";
  component: { kind: "claim"; text: string; binding: "ledger_bound"; sourceProjection: "pack.authored.claim_delivery@1" };
  digest: string;
}

const ADAPTED = new WeakSet<object>();
const ADAPTED_OWNER = new WeakMap<object, object>();
const PARSED = new WeakSet<object>();
const ADAPTER_KEY = "pack.authored.claim_delivery@1" as const;

function frozen<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}

function projectionKey(evidence: DeclaredEvidence<unknown>): string {
  return `${evidence.projection.id}@${evidence.projection.version}`;
}

function claimAdapter(evidence: DeclaredEvidence<unknown>): ClaimComponent {
  const payload = evidence.payload as Partial<ClaimPayload>;
  if (payload.kind !== "claim" || typeof payload.text !== "string" || payload.binding !== "ledger_bound") {
    throw new TypeError("COMPONENT_ADAPTER_PAYLOAD");
  }
  return frozen({
    kind: "claim",
    text: payload.text,
    binding: payload.binding,
    sourceProjection: ADAPTER_KEY,
  });
}

const ADAPTERS = frozen({ [ADAPTER_KEY]: claimAdapter });

function adaptClaim(view: ConsumerEvidenceView<unknown>): AdaptedComponentItem {
  assertConsumerEvidenceView(view);
  if (view.items.length !== 1) throw new TypeError("COMPONENT_ADAPTER_CARDINALITY");
  const evidence = view.items[0]!;
  const key = projectionKey(evidence);
  const adapter = ADAPTERS[key as keyof typeof ADAPTERS];
  if (adapter === undefined) throw new TypeError("COMPONENT_ADAPTER_UNREGISTERED");
  const item = frozen({
    evidence: evidence as DeclaredEvidence<ClaimPayload>,
    component: adapter(evidence),
  });
  ADAPTED.add(item);
  ADAPTED_OWNER.set(item, evidence);
  return item;
}

function assertAdapted(value: unknown, expectedEvidence?: DeclaredEvidence<unknown>): asserts value is AdaptedComponentItem {
  if (typeof value !== "object" || value === null || !ADAPTED.has(value)) {
    throw new TypeError("COMPONENT_ADAPTER_UNSEALED");
  }
  if (expectedEvidence !== undefined && ADAPTED_OWNER.get(value) !== expectedEvidence) {
    throw new TypeError("COMPONENT_ADAPTER_OWNER_MISMATCH");
  }
}

function bodyBytes(body: ClaimWireBody): string {
  return JSON.stringify({
    version: body.version,
    producer: body.producer,
    projection: body.projection,
    component: {
      kind: body.component.kind,
      text: body.component.text,
      binding: body.component.binding,
      sourceProjection: body.component.sourceProjection,
    },
  });
}

function digest(body: ClaimWireBody): string {
  return `sha256:${createHash("sha256").update(bodyBytes(body)).digest("hex")}`;
}

function serializeClaim(item: AdaptedComponentItem): ClaimWireReceipt {
  assertAdapted(item, item.evidence);
  const body: ClaimWireBody = frozen({
    version: 1,
    producer: "pack.authored@1",
    projection: ADAPTER_KEY,
    component: item.component,
  });
  return frozen({ ...body, digest: digest(body) });
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join("|") === [...expected].sort().join("|");
}

function parseClaim(value: unknown): ParsedClaimReceipt {
  if (typeof value !== "object" || value === null || !exactKeys(value, ["version", "producer", "projection", "component", "digest"])) {
    throw new TypeError("COMPONENT_RECEIPT_SHAPE");
  }
  const candidate = value as Partial<ClaimWireReceipt>;
  const component = candidate.component;
  if (candidate.version !== 1 || candidate.producer !== "pack.authored@1" || candidate.projection !== ADAPTER_KEY
    || typeof component !== "object" || component === null
    || !exactKeys(component, ["kind", "text", "binding", "sourceProjection"])
    || component.kind !== "claim" || typeof component.text !== "string"
    || component.binding !== "ledger_bound" || component.sourceProjection !== ADAPTER_KEY
    || typeof candidate.digest !== "string") {
    throw new TypeError("COMPONENT_RECEIPT_SHAPE");
  }
  const body: ClaimWireBody = frozen({
    version: 1,
    producer: candidate.producer,
    projection: candidate.projection,
    component: frozen({ ...component }),
  });
  if (candidate.digest !== digest(body)) throw new TypeError("COMPONENT_RECEIPT_DIGEST");
  const parsed = frozen({ ...body, digest: candidate.digest });
  PARSED.add(parsed);
  return parsed;
}

function assertParsed(value: unknown): asserts value is ParsedClaimReceipt {
  if (typeof value !== "object" || value === null || !PARSED.has(value)) throw new TypeError("COMPONENT_RECEIPT_UNPARSED");
}

function admitted(text = "This file is open."): ConsumerEvidenceView<unknown> {
  const payload: ClaimPayload = frozen({
    kind: "claim",
    id: "claim-1",
    text,
    binding: "ledger_bound",
    evidenceTypes: frozen(["position_rules"]),
    earnedEvidenceTypes: frozen(["position_rules"]),
    principles: frozen([]),
  });
  return evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "guidance.authored_claim", version: 1 },
    [declareAuthoredClaimDeliveryEvidence(payload)],
  );
}

describe("D1664 projection-to-component trust boundary", () => {
  it("carries one real admitted projection through adapter, wire receipt and parser", () => {
    const view = admitted();
    const item = adaptClaim(view);
    assertAdapted(item, view.items[0]);
    expect(item.component).toEqual({
      kind: "claim",
      text: "This file is open.",
      binding: "ledger_bound",
      sourceProjection: ADAPTER_KEY,
    });
    const parsed = parseClaim(JSON.parse(JSON.stringify(serializeClaim(item))));
    assertParsed(parsed);
    expect(parsed.component).toEqual(item.component);
  });

  it("refuses literal, spread and JSON copies of process-local adapter products", () => {
    const item = adaptClaim(admitted());
    expect(() => assertAdapted({ evidence: item.evidence, component: item.component })).toThrow("COMPONENT_ADAPTER_UNSEALED");
    expect(() => assertAdapted({ ...item })).toThrow("COMPONENT_ADAPTER_UNSEALED");
    expect(() => assertAdapted(JSON.parse(JSON.stringify(item)))).toThrow("COMPONENT_ADAPTER_UNSEALED");
  });

  it("refuses a sealed component paired with a different admitted evidence identity", () => {
    const first = admitted("First fact.");
    const second = admitted("Second fact.");
    const item = adaptClaim(first);
    expect(() => assertAdapted(item, second.items[0])).toThrow("COMPONENT_ADAPTER_OWNER_MISMATCH");
  });

  it("refuses tampered bytes, extra fields and direct JSON as a parsed receipt", () => {
    const receipt = serializeClaim(adaptClaim(admitted()));
    const tampered = structuredClone(receipt) as MutableClaimWireReceipt;
    tampered.component.text = "Invented strategy.";
    expect(() => parseClaim(tampered)).toThrow("COMPONENT_RECEIPT_DIGEST");
    expect(() => parseClaim({ ...receipt, extra: true })).toThrow("COMPONENT_RECEIPT_SHAPE");
    expect(() => assertParsed(JSON.parse(JSON.stringify(receipt)))).toThrow("COMPONENT_RECEIPT_UNPARSED");
  });

  it("refuses an admitted projection with no registered component adapter", () => {
    const wrong = evidenceForConsumer(
      PRIMARY_EVIDENCE_MANIFEST,
      { id: "review.story", version: 1 },
      [declareStoryDerivedEvidence("title", frozen({ title: "A title", rank: frozen([]), outcome: frozen({ kind: "unfinished" }) }))],
    );
    expect(() => adaptClaim(wrong)).toThrow("COMPONENT_ADAPTER_UNREGISTERED");
  });
});
