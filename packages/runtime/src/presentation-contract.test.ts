// rfc/evidence-presentation.md Checkpoint A: criteria 1, 5, 7, 16, 21, 21a, 21b and [[D3102]] over
// the production presentation contract (the Review-compiler slice and the claim vertical slice).
import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import {
  COMPONENT_DECLARATIONS,
  COMPONENT_IDS,
  PRESENTATION_ADAPTERS,
  PRESENTATION_SELECTION_ONLY,
  assertPresentationText,
  assertPresentedEvidenceItem,
  citationFromEvidence,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentedItemOwner,
  presentedSentence,
  serializePresentedEvidence,
  type AbstentionOperand,
  type MagnitudeOperand,
} from "./presentation-contract.js";
import { presentReviewFamilyAbstentions, reviewPacketForRun } from "./review-evidence.js";
import { attachDelivery, evaluationDelivery, importRecord, importedRun, mainPath, play } from "./testing/review-evidence-fixture.js";

const REVIEW_MAP = { id: "module.review_map", version: 1 } as const;
const REVIEW_STORY = { id: "review.story", version: 1 } as const;

function evaluatedPacket() {
  let run = play(importedRun("presentation"), ["e2e4", "e7e5"]);
  const path = mainPath(run);
  run = attachDelivery(run, path[0]!.id, evaluationDelivery(path[0]!.fen, "cp 20"));
  run = attachDelivery(run, path[1]!.id, evaluationDelivery(path[1]!.fen, "mate 3"));
  return { run, path, packet: reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*") }) };
}

function panelItems() {
  const { packet, path } = evaluatedPacket();
  const node = packet.nodes.find((candidate) => candidate.nodeId === path[1]!.id)!;
  const offered = node.items.filter((item) => item.projection.id.startsWith("derived.review."));
  return { packet, path, offered, items: presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_MAP, offered)) };
}

describe("evidence presentation Checkpoint A: the closed component vocabulary", () => {
  it("declares exactly the fourteen §3 ids, frozen, each with all eight fields (criterion 1)", () => {
    expect(Object.keys(COMPONENT_DECLARATIONS).sort()).toEqual([...COMPONENT_IDS].sort());
    expect(COMPONENT_IDS).toHaveLength(14);
    expect(Object.isFrozen(COMPONENT_DECLARATIONS)).toBe(true);
    for (const id of COMPONENT_IDS) {
      const declaration = COMPONENT_DECLARATIONS[id];
      for (const field of ["id", "renders", "operand", "convention", "emptyBehavior", "forms", "equivalentSentence", "tokens"] as const) expect(declaration[field], `${id}.${field}`).toBeDefined();
      expect(declaration.forms.length).toBeGreaterThan(0);
      expect(declaration.forms).not.toContain("machine_condition");
      expect(Object.isFrozen(declaration)).toBe(true);
    }
    // Honest checkpoint: the implemented subset is named, not implied.
    expect(COMPONENT_IDS.filter((id) => COMPONENT_DECLARATIONS[id].checkpointA === "implemented").sort()).toEqual(["abstention", "citation", "claim", "enum_state", "fact_statement", "magnitude"]);
  });

  it("guards every component text boundary against raw ids, and enum_state by vocabulary totality (criterion 5)", () => {
    expect(() => assertPresentationText("The objective is option_collapse.")).toThrow(/PRESENTATION_RAW_ID/u);
    expect(() => assertPresentationText("Named derived.review.eval_point@1 here.")).toThrow(/PRESENTATION_RAW_ID/u);
    expect(() => assertPresentationText(`Digest ${"a".repeat(64)} leaked.`)).toThrow(/PRESENTATION_RAW_ID/u);
    expect(assertPresentationText("Recorded engine evaluation after this move: +0.20 from White's side.")).toMatch(/Recorded/u);
    // A single lowercase word no regex arm matches is refused by vocabulary totality, not by shape.
    const receipt = { protocol: "presentation.receipt@1", items: [{ evidenceRef: null, adapter: { consumer: REVIEW_MAP, projection: { id: "review.packet_family", version: 1 } }, component: { id: "enum_state", operand: { vocabulary: "run_outcome", value: "degraded" } }, componentDigest: `sha256:${"0".repeat(64)}` }], digest: `sha256:${"0".repeat(64)}` };
    expect(() => parsePresentationReceipt(receipt)).toThrow(/outside its closed vocabulary/u);
  });
});

describe("evidence presentation Checkpoint A: the sealed path and the closed wire (criteria 7, 16, 21)", () => {
  it("builds magnitudes whose convention is derived from the same delivery and renders inside the component", () => {
    const { items } = panelItems();
    const magnitude = items.find((item) => item.component.id === "magnitude")!;
    const operand = magnitude.component.operand as MagnitudeOperand;
    expect(operand.unit).toEqual({ kind: "mate_in" });
    expect(operand.value).toBe(-3);
    expect(operand.convention.basis.kind).toBe("search");
    expect(operand.convention.sourceProjection).toEqual({ id: "derived.review.eval_point", version: 1 });
    // The rendered sentence carries the convention (engine and bound): number and convention travel together.
    expect(presentedSentence(magnitude)).toBe("Recorded engine evaluation after this move: mate in 3 for Black from White's side (Stockfish 19, depth 12 search).");
    // The owner of a process-sealed item is its exact admitted evidence item.
    expect(presentedItemOwner(magnitude)).toBeDefined();
    // @ts-expect-error a magnitude operand without a convention does not compile (criterion 7 type arm).
    const unconventioned: MagnitudeOperand = { value: 1, unit: { kind: "centipawn" }, saturated: false };
    void unconventioned;
  });

  it("round-trips through the closed receipt into NEW client-local seals with byte-identical sentences", () => {
    const { items } = panelItems();
    const receipt = serializePresentedEvidence(items);
    const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(receipt)));
    expect(parsed.map(presentedSentence)).toEqual(items.map(presentedSentence));
    expect(parsed[0]).not.toBe(items[0]);
    expect(() => assertPresentedEvidenceItem(parsed[0])).not.toThrow();
    expect(() => presentedItemOwner(parsed[0]!)).toThrow(/PRESENTATION_UNSEALED/u);
    // Client-sealed items cannot be re-serialized as process-owned evidence.
    expect(() => serializePresentedEvidence(parsed)).toThrow(/PRESENTATION_UNSEALED/u);
  });

  it("refuses literal, spread and JSON forges, wire mutation, extra fields, unregistered tuples and component swaps", () => {
    const { items, packet } = panelItems();
    const [first] = items;
    expect(() => presentedSentence({ ...first! })).toThrow(/PRESENTATION_UNSEALED/u);
    expect(() => presentedSentence(JSON.parse(JSON.stringify(first)))).toThrow(/PRESENTATION_UNSEALED/u);
    expect(() => serializePresentedEvidence([{ ...first! }])).toThrow(/PRESENTATION_UNSEALED/u);
    const wire = JSON.parse(JSON.stringify(serializePresentedEvidence(items))) as { items: Record<string, unknown>[]; digest: string; protocol: string };
    expect(() => parsePresentationReceipt({ ...wire, extra: 1 })).toThrow(/unknown key extra/u);
    expect(() => parsePresentationReceipt({ ...wire, items: [{ ...wire.items[0]!, sentence: "x" }] })).toThrow(/unknown key sentence/u);
    const mutated = structuredClone(wire);
    (mutated.items[0]!.component as { operand: { value: number } }).operand.value = 999;
    expect(() => parsePresentationReceipt(mutated)).toThrow(/digest mismatch/u);
    const unregistered = structuredClone(wire);
    (unregistered.items[0]!.adapter as { projection: { id: string } }).projection.id = "derived.review.invented";
    expect(() => parsePresentationReceipt(unregistered)).toThrow(/unregistered adapter/u);
    // Swapping a magnitude into a fact-statement seat fails the adapter's component join.
    const swapped = structuredClone(wire);
    const magnitudeIndex = swapped.items.findIndex((item) => (item.component as { id: string }).id === "magnitude");
    const factIndex = swapped.items.findIndex((item) => (item.component as { id: string }).id === "fact_statement");
    swapped.items[factIndex] = { ...swapped.items[factIndex]!, component: swapped.items[magnitudeIndex]!.component };
    expect(() => parsePresentationReceipt(swapped)).toThrow(/serves fact_statement, not magnitude|disagree/u);
    // Post-render append is impossible: sealed items and receipts are frozen.
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(serializePresentedEvidence(items).items)).toBe(true);
    void packet;
  });

  it("refuses an admitted projection with no registered adapter and skips only declared selection-only bindings", () => {
    const { run, path } = evaluatedPacket();
    const position = invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: path[1]!.id });
    // run.record.position@1 is not bound to module.review_map@1, so it is not admitted, not presented.
    expect(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_MAP, [position]))).toEqual([]);
    expect(PRESENTATION_SELECTION_ONLY).toEqual(["review.story@1\u0000derived.story.rank@1"]);
  });

  it("maps every review.story@1 binding to exactly one adapter or the selection-only list, and every adapter to a real binding", () => {
    const story = PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.consumer.id === "review.story");
    for (const binding of story) {
      const key = `review.story@1\u0000${binding.projection.id}@${binding.projection.version}`;
      const adapters = PRESENTATION_ADAPTERS.filter((entry) => entry.key === key);
      expect(adapters.length + (PRESENTATION_SELECTION_ONLY.includes(key) ? 1 : 0), key).toBe(1);
      for (const entry of adapters) for (const form of entry.forms) expect(binding.forms, `${key} ${form}`).toContain(form);
    }
    for (const entry of PRESENTATION_ADAPTERS) {
      const binding = PRIMARY_EVIDENCE_MANIFEST.bindings.find((candidate) => candidate.consumer.id === entry.consumer.id && candidate.projection.id === entry.projection.id && candidate.projection.version === entry.projection.version);
      expect(binding, entry.key).toBeDefined();
      expect(entry.assertions.length, entry.key).toBeGreaterThan(0);
      const operands = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === entry.projection.id && projection.version === entry.projection.version)!.operands;
      for (const operand of entry.sourceOperands) expect(operands, `${entry.key} retains ${operand}`).toContain(operand);
    }
  });
});

describe("evidence presentation Checkpoint A: fact statements and abstentions (criteria 21a, 21b, [[D3104]])", () => {
  it("recomputes fact-statement text from retained operands; caller text, renderer swap and digest swap fail", () => {
    const { items } = panelItems();
    const wire = JSON.parse(JSON.stringify(serializePresentedEvidence(items))) as { items: { component: { id: string; operand: Record<string, unknown> } }[] };
    const factIndex = wire.items.findIndex((item) => item.component.id === "fact_statement");
    const caller = structuredClone(wire);
    caller.items[factIndex]!.component.operand.renderedText = "Sacrifice the queen; checkmate is forced.";
    expect(() => parsePresentationReceipt(caller)).toThrow(/disagrees with its retained operands/u);
    const renderer = structuredClone(wire);
    renderer.items[factIndex]!.component.operand.rendererId = "story.title@1";
    expect(() => parsePresentationReceipt(renderer)).toThrow(/PRESENTATION_INVALID/u);
    const sourceDigest = structuredClone(wire);
    sourceDigest.items[factIndex]!.component.operand.sourceDigest = `sha256:${"1".repeat(64)}`;
    expect(() => parsePresentationReceipt(sourceDigest)).toThrow(/disagrees with its retained operands/u);
    const dropped = structuredClone(wire);
    delete (dropped.items[factIndex]!.component.operand.operands as Record<string, unknown>).after;
    expect(() => parsePresentationReceipt(dropped)).toThrow(/omits after/u);
  });

  it("issues abstentions only from the sealed packet that asked, with distinct pending and settled shapes", () => {
    const { run, path } = evaluatedPacket();
    const engine = new Map([[path[2]!.id, { kind: "pending" as const, jobCount: 1, retrying: 0 }]]);
    const pendingPacket = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*"), engine });
    const pending = presentReviewFamilyAbstentions(pendingPacket, path[2]!.id, ["engine_eval"]);
    expect(pending).toHaveLength(1);
    const operand = pending[0]!.component.operand as AbstentionOperand;
    expect(operand).toMatchObject({ kind: "pending", stage: "requested", question: "review.engine_eval" });
    expect(operand.decision.digest).toBe(pendingPacket.subject.subjectDigest);
    expect(operand.requestId).toMatch(/^review\.source\./u);
    expect("absence" in operand).toBe(false);
    expect(presentedItemOwner(pending[0]!)).toBe(pendingPacket);
    // Not requested constructs nothing (the unopened door); a forged packet cannot issue.
    expect(presentReviewFamilyAbstentions(pendingPacket, path[2]!.id, ["human_model"])).toEqual([]);
    expect(() => presentReviewFamilyAbstentions({ ...pendingPacket }, path[2]!.id, ["engine_eval"])).toThrow(/REVIEW_PACKET_INVALID/u);
    // Wire: pending with a terminal absence, or a settled reason from another absence class, fail.
    const wire = JSON.parse(JSON.stringify(serializePresentedEvidence(pending))) as { items: { component: { operand: Record<string, unknown> } }[] };
    const withAbsence = structuredClone(wire);
    withAbsence.items[0]!.component.operand.absence = "failed";
    expect(() => parsePresentationReceipt(withAbsence)).toThrow(/unknown key absence/u);
    const settled = presentReviewFamilyAbstentions(reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*"), engine: new Map([[path[2]!.id, { kind: "unavailable" as const, reason: "provider_off" as const }]]) }), path[2]!.id, ["engine_eval"]);
    const settledWire = JSON.parse(JSON.stringify(serializePresentedEvidence(settled))) as { items: { component: { operand: Record<string, unknown> } }[] };
    settledWire.items[0]!.component.operand.absence = "empty";
    expect(() => parsePresentationReceipt(settledWire)).toThrow(/not a empty absence|not a empty/u);
    expect(presentedSentence(settled[0]!)).toBe("Engine evaluation: unavailable — its provider is not configured in this deployment.");
    // @ts-expect-error a pending receipt cannot carry a terminal absence (compile-only negative).
    const invalid: AbstentionOperand = { kind: "pending", stage: "requested", question: "review.engine_eval", projection: { id: "x", version: 1 }, producer: { id: "x", version: 1 }, requestId: "r", decision: operand.decision, absence: "failed" };
    void invalid;
  });
});

describe("evidence presentation Checkpoint A: citation value binding ([[D3102]]) and the claim slice ([[D1673]])", () => {
  it("reads citation text from the exact retained evidence field and binds it by value digest", () => {
    const resolution = invokeEvidenceValueRoute("run.record.evidence_ref_resolution@1", { reference: "rules:checkmate" });
    const source = { source: { id: "run.record.evidence_ref_resolution", version: 1 }, title: "Board rules", locator: "rules:checkmate", licence: "Tabiya product text", revision: "manifest" };
    const citation = citationFromEvidence(resolution, "text", "authored_summary", source);
    expect(citation.content.text).toBe((resolution.payload as { readonly text: string }).text);
    // Two citations with the same evidence digest, field and source cannot carry different text.
    const wire = { protocol: "presentation.receipt@1", items: [{ evidenceRef: null, adapter: { consumer: REVIEW_MAP, projection: { id: "review.packet_family", version: 1 } }, component: { id: "citation", operand: { ...citation, content: { ...citation.content, text: "Sacrifice the queen; checkmate is forced." } } }, componentDigest: `sha256:${"0".repeat(64)}` }], digest: `sha256:${"0".repeat(64)}` };
    expect(() => parsePresentationReceipt(wire)).toThrow(/not the bound evidence value/u);
    expect(() => citationFromEvidence(resolution, "sourceLabelMissing", "authored_summary", source)).toThrow(/not retained/u);
    expect(() => citationFromEvidence({ ...resolution } as DeclaredEvidence<unknown>, "text", "authored_summary", source)).toThrow();
  });

  it("presents pack.authored.claim_delivery@1 through guidance.authored_claim@1 as a claim with its binding", () => {
    const item = { kind: "claim", id: "claim#one", revealedBy: { kind: "outcome", eventSeq: 4 }, anchor: { claimId: "one" }, text: "Authored sentence.", evidenceTypes: ["tablebase_exact", "engine_validated"], earnedEvidenceTypes: ["tablebase_exact"], binding: "ledger_bound", authorSpans: [], principles: [] };
    const declared = invokeEvidenceValueRoute("pack.authored.claim_delivery@1", { item });
    const [claim] = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "guidance.authored_claim", version: 1 }, [declared]));
    expect(claim!.component.id).toBe("claim");
    expect(presentedSentence(claim!)).toBe("Author's claim. Every part of it carries a recorded reading: exact tablebase. Also declared, with no record attached: engine check.");
    const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence([claim!]))));
    expect(presentedSentence(parsed[0]!)).toBe(presentedSentence(claim!));
    void REVIEW_STORY;
  });
});
