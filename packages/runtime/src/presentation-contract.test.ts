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
  factStatementOperand,
  citationFromEvidence,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentedItemOwner,
  presentedSentence,
  presentationDigest,
  serializePresentedEvidence,
  type AbstentionOperand,
  type MagnitudeOperand,
  type PresentationReceipt,
} from "./presentation-contract.js";
import { presentReviewFamilyAbstentions, reviewPacketForRun } from "./review-evidence.js";
import { attachDelivery, evaluationDelivery, importRecord, importedRun, mainPath, play } from "./testing/review-evidence-fixture.js";
import { recordedGradeFixture } from "./testing/recorded-grade-fixture.js";
import { recordedPivotalFixture, PIVOTAL_RULE_KINDS } from "./testing/recorded-pivotal-fixture.js";
import { pivotalMarkerEvidenceItems } from "./pivotal.js";
import { appendOpponentPly, createRun } from "./runtime.js";
import { storyMomentsForRun } from "./story.js";
import type { ReviewEnginePoint } from "./review-points.js";

const REVIEW_MAP = { id: "module.review_map", version: 2 } as const;
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

function redigestReceipt(receipt: PresentationReceipt): PresentationReceipt {
  const items = receipt.items.map(({ componentDigest: _digest, ...body }) => ({
    ...body, componentDigest: presentationDigest("presentation.component@1", body),
  }));
  return { ...receipt, items, digest: presentationDigest("presentation.receipt@1", items) };
}

function humanPivotalSource(bound: "nodes" | "movetime" = "nodes"): readonly DeclaredEvidence<unknown>[] {
  const initial = play(createRun({ id: "root-human-pivotal", session: { kind: "position",
    start: { fen: importedRun("human-start").start.fen, side: "white" }, feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common", targetElo: 1500 } }, sessionDigest: `sha256:${"b".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: "2026-09-24T12:00:00.000Z",
  }), ["e2e4"]);
  const run = appendOpponentPly(initial, { moveUci: "e7e5", policyModeApplied: "human_common",
    candidates: ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5"].map((moveUci, index) => ({ moveUci, rank: index + 1, mass: [.31, .24, .19, .16, .1][index]! })),
    engine: { id: "fixture-maia", name: "Synthetic policy source", version: "test", seedHonored: false,
      modelId: "synthetic-model", containerDigest: `sha256:${"a".repeat(64)}`, eloHonored: true, eloApplied: 1500,
      searchBound: { kind: bound, value: 1 } },
  }).run;
  return pivotalMarkerEvidenceItems(run, run.activeCursor.branchId).filter(item => item.projection.id === "derived.pivotal.human_divergence");
}

const pivotalCases = [
  ...PIVOTAL_RULE_KINDS.map(kind => ({ name: kind, consumer: REVIEW_STORY, projection: `derived.pivotal.${kind}`, acquire: () => {
    const run = recordedPivotalFixture(kind);
    return pivotalMarkerEvidenceItems(run, run.activeCursor.branchId).filter(item => item.projection.id === `derived.pivotal.${kind}`);
  } })),
  { name: "human_divergence", consumer: REVIEW_STORY, projection: "derived.pivotal.human_divergence", acquire: humanPivotalSource },
];

const rootFactCases = [
  ...pivotalCases,
  { name: "Story shape", consumer: REVIEW_STORY, projection: "theory.shapes.firing", acquire: () => invokeEvidenceValueRoute("theory.shapes.firing@1", {
    entries: [{ id: "king-on-edge", trigger: { kind: "feature", feature: { kind: "king_zone", color: "white", zone: "edge" } } }],
    path: [{ id: "root", fen: importedRun("shape-position").start.fen }],
  }) },
  { name: "Story terminal consequence", consumer: REVIEW_STORY, projection: "run.record.consequence", acquire: () => {
    const run = play(importedRun("root-terminal-story"), ["f2f3", "e7e5", "g2g4", "d8h4"]);
    return invokeEvidenceValueRoute("run.record.consequence@1", { run, branchId: run.activeCursor.branchId }).map(item => item.evidence);
  } },
  { name: "Story imported result", consumer: REVIEW_STORY, projection: "run.record.imported_result", acquire: () => {
    const run = play(importedRun("root-imported-result"), ["e2e4"]);
    return invokeEvidenceValueRoute("run.record.imported_result@1", { run, branchId: run.activeCursor.branchId, recordedResult: "0-1" }).map(item => item.evidence);
  } },
  { name: "Story endgame", consumer: REVIEW_STORY, projection: "rules.endgame.classification", acquire: () => invokeEvidenceValueRoute("rules.endgame.classification@1", { fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1" }) },
  ...([REVIEW_STORY, REVIEW_MAP] as const).map(consumer => ({ name: `${consumer.id} mate transition`, consumer, projection: "derived.review.mate_transition", acquire: () => evaluatedPacket().packet.nodes.flatMap(node => node.items.filter(item => item.projection.id === "derived.review.mate_transition")) })),
  { name: "Story last level", consumer: REVIEW_STORY, projection: "derived.story.last_level", acquire: () => {
    const { packet } = evaluatedPacket();
    const points = packet.nodes.flatMap(node => node.items.filter((item): item is DeclaredEvidence<ReviewEnginePoint> => item.projection.id === "derived.review.eval_point"));
    return invokeEvidenceValueRoute("derived.story.last_level@1", { path: packet.subject.pathNodeIds, side: packet.subject.learnerSide,
      recordedResult: "0-1", points }).map(item => item.evidence);
  } },
  { name: "Story title", consumer: REVIEW_STORY, projection: "derived.story.title", acquire: () => {
    const { run } = evaluatedPacket();
    return [storyMomentsForRun(run, run.activeCursor.branchId).title.evidence];
  } },
  { name: "Review WDL", consumer: REVIEW_MAP, projection: "derived.review.wdl_point", acquire: () => evaluatedPacket().packet.nodes.flatMap(node => node.items.filter(item => item.projection.id === "derived.review.wdl_point")) },
  { name: "Review grade", consumer: REVIEW_MAP, projection: "derived.grade.move_quality", acquire: () => {
    // Raw UCI scores are side-to-move: equal positive reports on opposite turns are a
    // large White-side loss, not equal normalized evaluations.
    const fixture = recordedGradeFixture({ before: "cp 1000", after: "cp 1000" });
    const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: fixture.source });
    if (result.kind !== "available") throw new Error("Expected actual recorded grade");
    return result.value;
  } },
  { name: "Nudge grade summary", consumer: { id: "module.postcommit_nudge", version: 2 }, projection: "derived.grade.move_quality", acquire: () => {
    const fixture = recordedGradeFixture({ timing: "post_commit", before: "cp 0", after: "cp 200" });
    const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: fixture.source });
    if (result.kind !== "available") throw Error("Expected current original grade");
    return result.value;
  } },
];

function rootFactReceipt(testCase: typeof rootFactCases[number]): PresentationReceipt {
  const evidence = testCase.acquire();
  expect(evidence.length, testCase.name).toBeGreaterThan(0);
  expect(evidence.every(item => item.projection.id === testCase.projection)).toBe(true);
  const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, testCase.consumer, evidence));
  const wire = serializePresentedEvidence(items);
  expect(wire.items.length).toBeGreaterThan(0);
  expect(parsePresentationReceipt(JSON.parse(JSON.stringify(wire))).map(presentedSentence)).toEqual(items.map(presentedSentence));
  return wire;
}

describe("D3948 root Story and Review exact fact associations", () => {
  it("D4064 refuses both fully redigested full→summary and summary→full renderer swaps", () => {
    for (const name of ["Review grade", "Nudge grade summary"]) {
      const wire = rootFactReceipt(rootFactCases.find(row => row.name === name)!);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement") throw Error("Expected actual grade statement");
        const original = item.component.operand;
        if (original.rendererId !== "grade.move_quality@2" && original.rendererId !== "play.move_quality_summary@1") throw Error("Expected closed grade operand");
        const renderer = name === "Review grade" ? "play.move_quality_summary@1" : "grade.move_quality@2";
        const operand = factStatementOperand(renderer, original.binding, original.convention, original.operands);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/registered|renderer/u);
    }
  });
  it.each([
    { subkind: "castled", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1g1" },
    { subkind: "pawn_break", fen: "4k3/8/8/3p4/8/4P3/8/4K3 w - - 0 1", move: "e3e4" },
  ])("D4028 retains the genuine $subkind detail variant", ({ subkind, fen, move }) => {
    const run = play(importedRun(`root-${subkind}-pivotal`, "white", fen), [move]);
    const evidence = pivotalMarkerEvidenceItems(run, run.activeCursor.branchId).filter(item => item.projection.id === "derived.pivotal.irreversibility");
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.every(item => "subkind" in item.payload.detail && item.payload.detail.subkind === subkind)).toBe(true);
    const original = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_STORY, evidence));
    expect(parsePresentationReceipt(serializePresentedEvidence(original)).map(presentedSentence)).toEqual(original.map(presentedSentence));
  });
  it.each(["nodes", "movetime"] as const)("D4028 retains optional target and all engine fields with %s metadata", bound => {
    const evidence = humanPivotalSource(bound);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]!.payload).toMatchObject({ detail: { targetElo: 1500, engine: { modelId: "synthetic-model", containerDigest: `sha256:${"a".repeat(64)}`,
      eloHonored: true, eloApplied: 1500, searchBound: { kind: bound, value: 1 } } } });
    const original = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_STORY, evidence));
    const parsed = parsePresentationReceipt(serializePresentedEvidence(original));
    expect(parsed.map(presentedSentence)).toEqual(original.map(presentedSentence));
    expect(parsed[0]!.component).toEqual(original[0]!.component);
  });
  it.each(rootFactCases)("round-trips the genuine $name source", testCase => { rootFactReceipt(testCase); });
  for (const field of ["renderer", "binding", "convention"] as const) {
    it.each(rootFactCases)(`refuses re-digested ${field} substitution for $name`, testCase => {
      const wire = rootFactReceipt(testCase);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement") throw new Error("Expected root fact statement");
        const original = item.component.operand;
        const operand = field === "renderer" ? factStatementOperand("play.phase@1", "declared_convention", "phase-bands@1", { phase: "opening" })
          : factStatementOperand(original.rendererId, field === "binding" ? original.binding === "recorded_run" ? "declared_convention" : "recorded_run" : original.binding,
            field === "convention" ? "board-rules@1" : original.convention, original.operands);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
    });
  }
  it.each(pivotalCases)("refuses a genuine sibling pivotal kind under $name ownership", testCase => {
    const wire = rootFactReceipt(testCase), sibling = pivotalCases.find(candidate => candidate.name !== testCase.name)!;
    const other = rootFactReceipt(sibling).items[0]!;
    const items = wire.items.map(item => ({ ...item, component: other.component }));
    expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/kind/u);
  });
  for (const stage of ["process", "wire"] as const) {
    it.each(pivotalCases)(`D4028 refuses undeclared $name detail on the ${stage} path without changing prose`, testCase => {
      const wire = rootFactReceipt(testCase);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "story.pivotal_marker@1") throw new Error("Expected genuine pivotal fact");
        const original = item.component.operand;
        const operands = { ...original.operands, detail: { ...original.operands.detail, suggestion: "HIDDEN_TEST_SENTINEL" } };
        if (stage === "process") expect(() => factStatementOperand(original.rendererId, original.binding, original.convention, operands)).toThrow(/unknown key suggestion/u);
        // The old renderer ignores this extra field. Keep its original text, so a text mismatch
        // cannot masquerade as the exact operand grammar refusing the undeclared data.
        return { ...item, component: { ...item.component, operand: { ...original, operands,
          sourceDigest: presentationDigest("presentation.fact.operands@1", operands) } } };
      });
      if (stage === "wire") expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/unknown key suggestion/u);
    });
  }
});

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
    // Checkpoint B: every member ships its parser, renderer and client component.
    expect(COMPONENT_IDS.filter((id) => COMPONENT_DECLARATIONS[id].implementation === "implemented")).toEqual([...COMPONENT_IDS]);
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
    // run.record.position@1 is not bound to module.review_map@2, so it is not admitted, not presented.
    expect(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_MAP, [position]))).toEqual([]);
    expect(PRESENTATION_SELECTION_ONLY).toEqual(["review.story@1\u0000derived.story.rank@2"]);
  });

  it.each(["id", "version"] as const)("D3948 refuses a re-digested foreign producer %s on a genuine adapter", field => {
    const wire = serializePresentedEvidence(panelItems().items);
    expect(() => parsePresentationReceipt(wire)).not.toThrow();
    const foreign = PRIMARY_EVIDENCE_MANIFEST.producers.find(candidate => candidate.id !== wire.items[0]!.evidenceRef!.producer.id)!;
    const items = wire.items.map(item => item.evidenceRef === null ? item : {
      ...item, evidenceRef: { ...item.evidenceRef, producer: field === "id"
        ? { id: foreign.id, version: foreign.version }
        : { ...item.evidenceRef.producer, version: item.evidenceRef.producer.version + 1 } },
    });
    expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/producer/u);
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
