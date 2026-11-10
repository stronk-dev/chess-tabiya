// rfc/evidence-presentation.md Checkpoint B / rfc/module-registration.md A5: the Full Inspector,
// Post-commit Nudge and Review Map pair-keyed adapters.
import { witnessedEvidence } from "./module-query.js";
import { describe, expect, it } from "vitest";
import type { SquareName } from "chessops/types";

import { currentRecordedModuleRefs, PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { FOUNDATION_COMPACT_STATEMENTS } from "./foundation-edge-presentation.js";
import { evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import {
  PRESENTATION_ADAPTERS,
  adapterComponentsForEvidence,
  assertPresentationText,
  factStatementOperand,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentedSentence,
  presentedGradeMeasurementReport,
  presentationDigest,
  serializePresentedEvidence,
  type PresentationReceipt,
} from "./presentation-contract.js";
import { INSPECTOR_FACT_RENDERERS, inspectorAdapterSpecs } from "./presentation-inspector-adapters.js";
import { inspectorFixtureEvidence, sealedItems } from "./testing/inspector-presentation-fixture.js";
import { inspectorCurrentPresentationFixtures } from "./testing/inspector-current-presentation-fixture.js";
import { inspectorSourcePresentationKit } from "./testing/inspector-source-presentation-kit.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { renderMoveQualityGrade, type MoveQualityGrade } from "./grade.js";
import { recordedGradeFixture } from "./testing/recorded-grade-fixture.js";
import { invokeRecordedMeasurementReading } from "./recorded-measurement.js";
import { collectInspectorPivotalPrefix } from "./inspector-pivotal-source.js";
import { recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";
import { humanObservationRun, recordHumanObservation, splitCandidates } from "./testing/recorded-human-divergence-fixture.js";

const CONSUMERS = ["module.full_inspector", "module.postcommit_nudge", "module.review_map"] as const;
const key = (consumer: { readonly id: string; readonly version: number }, projection: { readonly id: string; readonly version: number }) => `${consumer.id}@${consumer.version}\u0000${projection.id}@${projection.version}`;
const bindingsOf = (consumer: string) => PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.consumer.id === consumer);
/** The pairs this group registers (constructs read the kit only when invoked). */
const OWN = new Set(inspectorAdapterSpecs(inspectorSourcePresentationKit).map((spec) => key(spec.consumer, spec.projection)));
// Reject asserted recommendations, not the accepted historical-line disclaimer or
// independently counted "White wins X%" population wording.
const FORBIDDEN = [/Tabiya's/u, /detector/iu, /phase bands/iu, /recorded mass/iu, /evidence recorded\./iu, /@\d/u, /\b(?:play|choose|is) (?:the )?best\b/iu, /\bshould\b/iu, /\b(?:this|that|it|move) wins\b/iu, /\b[a-h][1-8][a-h][1-8][qrbn]?\b/u, /_/u, /sha256/u];

describe("D3942 recorded tablebase perspective", () => {
  // Synthetic report fields exercise representation, not tablebase truth or qualification.
  for (const turn of ["w", "b"] as const) for (const consumer of ["module.review_map", "module.full_inspector"] as const) {
    it.each(["win", "loss", "draw", "cursed-win", "blessed-loss"] as const)(`${consumer}/${turn} preserves %s for the side to move`, category => {
      const record = { kind: "tablebase_result", sourceId: "synthetic-d3942", retrievedAt: "2026-11-02T00:00:00.000Z",
        grounds: "machine_validation", anchor: { fen: `4k3/8/8/8/8/8/P7/4K3 ${turn} - - 0 1` },
        values: { category, dtz: 3, precise_dtz: 3, dtm: 9, pieceCount: 3, checkmate: false, stalemate: false, insufficient_material: false } };
      const invocation = invokeRecordedMeasurementReading(record);
      if (invocation.result.kind !== "available") throw new Error("Synthetic report fields did not admit");
      const value = invocation.result.value, before = JSON.stringify(value.payload);
      const binding = bindingsOf(consumer).find(item => item.projection.id === "recorded.tablebase.result" && item.projection.version === 1)!;
      const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, binding.consumer, [value]));
      const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(presented))));
      expect(parsed).toHaveLength(1);
      const item = parsed[0]!;
      expect(item.component.id).toBe("fact_statement");
      if (item.component.id !== "fact_statement") throw new Error("Tablebase report must retain its statement");
      expect(item.component.operand.operands).toMatchObject({ category, perspective: "side_to_move", dtz: 3, dtm: 9, pieces: 3 });
      expect(presentedSentence(item)).toContain("side to move");
      expect(presentedSentence(item)).not.toContain("White");
      expect(JSON.stringify(value.payload)).toBe(before);
    });
  }
});

describe("D3766: Nudge keeps the complete grade grounding without inventing a color", () => {
  const scores = [
    [{ kind: "cp", value: 100 }, { kind: "cp", value: -100 }],
    [{ kind: "cp", value: 0 }, { kind: "cp", value: -55 }],
    [{ kind: "cp", value: 0 }, { kind: "cp", value: -111 }],
    [{ kind: "cp", value: 0 }, { kind: "cp", value: -169 }],
    [{ kind: "mate", movesTo: 2 }, { kind: "cp", value: 1100 }],
    [{ kind: "mate", movesTo: 2 }, { kind: "cp", value: 800 }],
    [{ kind: "mate", movesTo: 2 }, { kind: "cp", value: 200 }],
    [{ kind: "mate", movesTo: 2 }, { kind: "mate", movesTo: -4 }],
    [{ kind: "cp", value: 0 }, { kind: "mate", movesTo: -3 }],
    [{ kind: "cp", value: -800 }, { kind: "mate", movesTo: -2 }],
    [{ kind: "cp", value: -1200 }, { kind: "mate", movesTo: -2 }],
  ] as const;
  for (const mover of ["white", "black"] as const) for (const context of ["drill", "review", "imported_analysis"] as const) {
    it.each(scores)(`${mover}/${context} retains every grade operand (%j → %j)`, (before, after) => {
      const raw = (score: typeof before | typeof after, sign: number) => score.kind === "cp" ? `cp ${score.value * sign}` : `mate ${score.movesTo * sign}`;
      const fixture = recordedGradeFixture({ black: mover === "black", timing: context === "drill" ? "post_commit" : "review",
        workflow: context === "imported_analysis" ? "imported" : "position", before: raw(before, 1), after: raw(after, -1),
        budget: { bound: { kind: "movetime", requestedMs: 100 } } });
      const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: fixture.source });
      expect(result.kind).toBe("available");
      if (result.kind !== "available") throw new Error("grade fixture unavailable");
      expect(result.value).toHaveLength(1);
      const value = result.value[0] as DeclaredEvidence<MoveQualityGrade>;
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [value]));
      const wire = JSON.parse(JSON.stringify(serializePresentedEvidence(items)));
      const parsed = parsePresentationReceipt(wire);
      expect(parsed).toHaveLength(1);
      const label = value.payload.klass[0]!.toUpperCase() + value.payload.klass.slice(1);
      const expected = value.payload.arm === "eval_delta" ? `${label}: the recorded evaluation lost ${value.payload.dropWinPercent.toFixed(1)} win-points.`
        : value.payload.arm === "mate_lost" ? `${label}: the recorded mate for the moving side was lost.`
          : `${label}: the recorded reading now reports mate against the moving side.`;
      expect(presentedSentence(parsed[0]!)).toBe(expected);
      expect(presentedGradeMeasurementReport(parsed[0]!)).toMatchObject({ kind: "available", sentence: renderMoveQualityGrade(value.payload) });
      expect(presentedSentence(parsed[0]!)).not.toMatch(/White|Black|@1|_/u);
      const item = parsed[0]!;
      expect(item.component.id).toBe("fact_statement");
      if (item.component.id !== "fact_statement") throw new Error("grade must be a complete statement");
      expect(item.component.operand.operands).toEqual(value.payload);
      const omitted = JSON.parse(JSON.stringify(wire));
      delete omitted.items[0].component.operand.operands.convention;
      expect(() => parsePresentationReceipt(omitted)).toThrow();
    });
  }
});

describe("D3579: square-control captions count populated targets, not the 64-cell map", () => {
  it.each(["module.sight_on_request", "module.full_inspector"])("%s retains distinct controlled-square totals", (consumer) => {
    const evidence = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" });
    const actual = { id: consumer, version: PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === consumer)!.version };
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, actual, [evidence]));
    const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    const caption = parsed.find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.square_control@1")!;
    expect(caption).toBeDefined();
    if (caption.component.id !== "fact_statement" || caption.component.operand.rendererId !== "play.square_control@1") throw new Error("Expected square-control caption");
    // Initial-position targets: all rank-three squares, all rank-two squares and b1–g1
    // (22 pseudo). Only a3/c3/f3/h3 have a pseudo controller with a legal move:
    // pawn advances are legal destinations, not attacks. Multiple controllers
    // for one target must not increase either count.
    expect(caption.component.operand.operands).toEqual({ colors: evidence.payload.colors.map(color => ({
      color: color.color, pseudo: 22, legal: 4,
      pseudoControls: color.pseudo.map(cell => ({ target: cell.target, controllers: cell.controllers.map(controller => ({
        piece: { color: controller.piece.color, role: controller.piece.role }, square: controller.square,
      })) })),
    })) });
    expect(presentedSentence(caption)).toBe("Square control: White attacks 22 squares (4 with legal moves); Black attacks 22 squares (4 with legal moves).");
  });

  it.each(["module.sight_on_request", "module.full_inspector"])("%s preserves unavailable legal sets and distinguishes check-restricted moves", (consumer) => {
    const evidence = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: "4k3/8/8/8/8/4q3/8/4K3 w - - 0 1" });
    const actual = { id: consumer, version: PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === consumer)!.version };
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, actual, [evidence]));
    const caption = items.find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.square_control@1")!;
    if (caption.component.id !== "fact_statement" || caption.component.operand.rendererId !== "play.square_control@1") throw new Error("Expected square-control caption");
    // White's king attacks five neighbours, but only d1/f1 are legal destinations.
    // Passing the turn to Black is invalid while White is in check: not zero moves.
    expect(caption.component.operand.operands.colors.map(({ color, pseudo, legal }) => ({ color, pseudo, legal }))).toEqual([
      { color: "white", pseudo: 5, legal: 2 }, { color: "black", pseudo: expect.any(Number), legal: null },
    ]);
    expect(caption.component.operand.operands.colors.map(color => color.pseudoControls)).toEqual(evidence.payload.colors.map(color =>
      color.pseudo.map(cell => ({ target: cell.target, controllers: cell.controllers.map(controller => ({
        piece: { color: controller.piece.color, role: controller.piece.role }, square: controller.square,
      })) }))));
    expect(presentedSentence(caption)).not.toContain("64");
    expect(presentedSentence(caption)).not.toContain("0 with legal moves");
  });
});

describe("inspector / post-commit nudge / review map adapters: exact pair population", () => {
  it.each(CONSUMERS)("%s: every binding has exactly one adapter whose forms equal its non-machine forms", (consumer) => {
    const bindings = bindingsOf(consumer);
    expect(bindings.length).toBeGreaterThan(0);
    for (const binding of bindings) {
      const adapters = PRESENTATION_ADAPTERS.filter((entry) => entry.key === key(binding.consumer, binding.projection));
      expect(adapters, key(binding.consumer, binding.projection)).toHaveLength(1);
      // Checkpoint A's Review Map pairs are owned (and checked) by presentation-contract.test.ts.
      if (!OWN.has(key(binding.consumer, binding.projection))) { expect(consumer).toBe("module.review_map"); continue; }
      const expected = [...binding.forms].filter((form) => form !== "machine_condition").sort();
      expect([...adapters[0]!.forms].sort(), key(binding.consumer, binding.projection)).toEqual(expected);
      const operands = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === binding.projection.id && projection.version === binding.projection.version)!.operands;
      for (const operand of adapters[0]!.sourceOperands) expect(operands, `${key(binding.consumer, binding.projection)} retains ${operand}`).toContain(operand);
    }
    for (const entry of PRESENTATION_ADAPTERS.filter((adapter) => adapter.consumer.id === consumer)) {
      expect(bindings.some((binding) => key(binding.consumer, binding.projection) === entry.key), entry.key).toBe(true);
    }
  });

  it("covers the expected pair counts and registers inspector renderers under their own prefix", () => {
    expect(bindingsOf("module.full_inspector")).toHaveLength(102);
    expect(PRIMARY_EVIDENCE_MANIFEST.consumers.filter(row => row.id === "module.full_inspector").map(row => row.version)).toEqual([2]);
    expect(bindingsOf("module.postcommit_nudge")).toHaveLength(41);
    const own = (consumer: string) => [...OWN].filter((entry) => entry.startsWith(`${consumer}@${bindingsOf(consumer)[0]!.consumer.version}\u0000`)).length;
    expect([own("module.full_inspector"), own("module.postcommit_nudge"), own("module.review_map")]).toEqual([102, 41, bindingsOf("module.review_map").length - 5]); // Four typed engine projections and grade are owned by the common presentation layer; current trade joins this group.
    const detailRenderers = ["inspector.detail.rays@1", "inspector.detail.square_control@1", "inspector.detail.piece_destinations@1", "inspector.detail.destination_changes@1", "inspector.detail.king_zone@1", "inspector.detail.defender_duties@1", "inspector.detail.backward_pawns@1", "inspector.detail.pawn_file_groups@1", "inspector.detail.file_states@1", "inspector.detail.future_file_challenges@1", "inspector.detail.capture_migration_reaches@1", "inspector.detail.outpost_candidates@1", "inspector.detail.occupied_outposts@1", "inspector.detail.backward_pawn_advance@1"];
    expect(Object.keys(INSPECTOR_FACT_RENDERERS).filter(id => id.startsWith("inspector.detail.")).sort()).toEqual([...detailRenderers].sort());
    const snapshotRenderers = ["king_opposition", "backward_pawns", "pawn_file_groups", "file_states", "future_file_challenges", "capture_migration_reaches", "outpost_candidates", "occupied_outposts", "backward_pawn_advance"].map(kind => `inspector.snapshot.${kind}@1`);
    expect(Object.keys(INSPECTOR_FACT_RENDERERS).filter(id => id.startsWith("inspector.snapshot.")).sort()).toEqual([...snapshotRenderers].sort());
    const analyzeRenderers = ["review.analysis_typed_pv@1", "review.analysis_recorded_pv@1", "review.analysis_recorded_first@1"];
    expect(Object.keys(INSPECTOR_FACT_RENDERERS).filter(id => id.startsWith("review.analysis_")).sort()).toEqual([...analyzeRenderers].sort());
    const nudgeRenderers = ["play.move_quality_summary@1", ...Object.values(FOUNDATION_COMPACT_STATEMENTS).map(([renderer]) => renderer)].sort();
    expect(Object.keys(INSPECTOR_FACT_RENDERERS).filter(id => id.startsWith("play.")).sort()).toEqual(nudgeRenderers);
    for (const id of Object.keys(INSPECTOR_FACT_RENDERERS).filter(id => !detailRenderers.includes(id) && !snapshotRenderers.includes(id) && !analyzeRenderers.includes(id) && !nudgeRenderers.includes(id))) expect(id).toMatch(/^(?:inspector\.[a-z_]+@1|inspector\.registered_shape_firing@2|grade\.move_quality@2)$/u);
  });
});

/** A reading with a board witness (the module query offers only witnessed readings). */
const witnessed = witnessedEvidence;
const currentRoutes = [...new Set(CONSUMERS.flatMap(consumer => bindingsOf(consumer).map(binding => `${binding.projection.id}@${binding.projection.version}`)))];
const minted = new Map(inspectorFixtureEvidence(currentRoutes));
for (const [route, items] of await inspectorCurrentPresentationFixtures(minted)) minted.set(route, items);

// Finite D3948 migration image, not a claim that every other family is already wired. Current
// projection versions come from the same accepted successor mapping as the actual pair table.
const staticStatementRefs = new Set(currentRecordedModuleRefs([
  ...["capture", "castled", "checkmate", "developed", "last_of_role", "pawn_contact", "promotion",
    "defended_duty", "occupied_attack", "occupied_defence", "piece_escape"].map(family => ({ id: `rules.transition.event.${family}`, version: 1 })),
  ...["rules.tactic.event.check", "rules.tactic.event.double_attack",
    "rules.tactic.event.loose_piece", "rules.castling.event.rights_lost", "derived.exchange.capture_class",
    "derived.exchange.trade_completed", "derived.tactic.fork_survives_reply", "derived.grade.move_quality"].map(id => ({ id, version: 1 })),
]).map(ref => `${ref.id}@${ref.version}`));
const staticStatementPairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
  ["module.postcommit_nudge", "module.review_map"].includes(spec.consumer.id)
  && staticStatementRefs.has(`${spec.projection.id}@${spec.projection.version}`));

function statementReceipt(spec: typeof staticStatementPairs[number]): PresentationReceipt {
  const route = `${spec.projection.id}@${spec.projection.version}`;
  const sources = (minted.get(route) ?? []).filter(witnessed);
  expect(sources.length, `Missing genuine current source for ${key(spec.consumer, spec.projection)}`).toBeGreaterThan(0);
  const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, spec.consumer, [sources[0]!]));
  expect(presented).toHaveLength(1);
  expect(presented[0]!.component.id).toBe("fact_statement");
  const receipt = serializePresentedEvidence(presented);
  expect(parsePresentationReceipt(JSON.parse(JSON.stringify(receipt)))).toEqual(presented);
  return receipt;
}

function redigestStatementReceipt(receipt: PresentationReceipt): PresentationReceipt {
  const items = receipt.items.map(({ componentDigest: _digest, ...body }) => ({
    ...body, componentDigest: presentationDigest("presentation.component@1", body),
  }));
  return { ...receipt, items, digest: presentationDigest("presentation.receipt@1", items) };
}

describe("D3948 current postcommit/Map static statement pairs", () => {
  it("retains exactly the finite current37 static pairs, all with received validators", () => {
    expect(staticStatementPairs).toHaveLength(37);
    expect(new Set(staticStatementPairs.map(spec => key(spec.consumer, spec.projection))).size).toBe(37);
    expect(new Set(staticStatementPairs.map(spec => `${spec.projection.id}@${spec.projection.version}`))).toEqual(staticStatementRefs);
    for (const spec of staticStatementPairs) expect(spec.validateWireComponent, key(spec.consumer, spec.projection)).toBeTypeOf("function");
  });
  it.each(staticStatementPairs)("round-trips genuine $consumer.id × $projection.id@$projection.version", spec => {
    statementReceipt(spec);
  });
  for (const field of ["renderer", "binding", "convention"] as const) {
    it.each(staticStatementPairs)(`refuses redigested ${field} substitution for $consumer.id × $projection.id@$projection.version`, spec => {
      const wire = statementReceipt(spec);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement") throw new Error("Expected actual statement component");
        const original = item.component.operand;
        const operand = field === "renderer" ? original.rendererId === "play.phase@1"
          ? factStatementOperand("play.endgame_type@1", original.binding, original.convention, { label: null })
          : factStatementOperand("play.phase@1", original.binding, original.convention, { phase: "opening" })
          : factStatementOperand(original.rendererId,
            field === "binding" ? original.binding === "recorded_run" ? "declared_convention" : "recorded_run" : original.binding,
            field === "convention" ? "phase-bands@1" : original.convention, original.operands);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
    });
  }
});

const structuralStatementFamilies = ["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn",
  "king_opposition", "king_zone", "open_file", "passed_pawn"] as const;
const avoidanceStatementFamilies = [...structuralStatementFamilies, "loose_piece", "pawn_islands"] as const;
const conditionalStatementRefs = new Set([
  ...["king_zone", "passed_pawn"].map(family => `rules.structural.event.${family}@1`),
]);
const conditionalStatementPairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
  ["module.postcommit_nudge", "module.review_map"].includes(spec.consumer.id)
  && conditionalStatementRefs.has(`${spec.projection.id}@${spec.projection.version}`));

const compactStatementPairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
  ["module.postcommit_nudge", "module.review_map"].includes(spec.consumer.id)
  && Object.hasOwn(FOUNDATION_COMPACT_STATEMENTS, `${spec.projection.id}@${spec.projection.version}`));
const migratedPairKeys = new Set([...staticStatementPairs, ...conditionalStatementPairs, ...compactStatementPairs].map(spec => key(spec.consumer, spec.projection)));
const remainingCurrentPairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
  ["module.postcommit_nudge", "module.review_map"].includes(spec.consumer.id) && !migratedPairKeys.has(key(spec.consumer, spec.projection)));

function currentPairReceipt(spec: typeof remainingCurrentPairs[number]): PresentationReceipt {
  const route = `${spec.projection.id}@${spec.projection.version}`;
  const sources = (minted.get(route) ?? []).filter(witnessed);
  expect(sources.length, `Missing genuine current source for ${key(spec.consumer, spec.projection)}`).toBeGreaterThan(0);
  const original = JSON.stringify(sources[0]!.payload);
  const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, spec.consumer, [sources[0]!]));
  expect(presented.length).toBeGreaterThan(0);
  const wire = serializePresentedEvidence(presented);
  expect(parsePresentationReceipt(JSON.parse(JSON.stringify(wire)))).toEqual(presented);
  expect(JSON.stringify(sources[0]!.payload)).toBe(original);
  return wire;
}

describe("D3948 remaining current board/Map pairs", () => {
  it("partitions the actual97 current pairs as37 static +4 retained conditional +14 compact +42 remaining", () => {
    expect(compactStatementPairs).toHaveLength(14);
    expect(remainingCurrentPairs).toHaveLength(42);
    expect(remainingCurrentPairs.filter(spec => spec.composition !== undefined)).toHaveLength(21);
    expect(remainingCurrentPairs.filter(spec => spec.component === "square_set" && spec.composition === undefined)).toHaveLength(8);
    expect(remainingCurrentPairs.filter(spec => spec.component === "fact_statement")).toHaveLength(12);
    expect(remainingCurrentPairs.filter(spec => spec.component === "magnitude")).toHaveLength(1);
    const all = [...staticStatementPairs, ...conditionalStatementPairs, ...compactStatementPairs, ...remainingCurrentPairs];
    expect(all).toHaveLength(97);
    expect(new Set(all.map(spec => key(spec.consumer, spec.projection))).size).toBe(97);
    for (const spec of remainingCurrentPairs) expect(spec.validateWireComponent, key(spec.consumer, spec.projection)).toBeTypeOf("function");
  });
  it.each(remainingCurrentPairs)("round-trips genuine $consumer.id × $projection.id@$projection.version", spec => {
    currentPairReceipt(spec);
  });
  for (const field of ["renderer", "binding", "convention"] as const) {
    it.each(remainingCurrentPairs.filter(spec => spec.component !== "magnitude"))(`refuses redigested ${field} for $consumer.id × $projection.id@$projection.version`, spec => {
      const wire = currentPairReceipt(spec);
      let changed = 0;
      const items = wire.items.map(item => {
        const original = item.component.id === "fact_statement" ? item.component.operand
          : item.component.id === "square_set" ? item.component.operand.caption : null;
        if (original === null) return item;
        changed += 1;
        const operand = field === "renderer" ? original.rendererId === "play.phase@1"
          ? factStatementOperand("play.endgame_type@1", original.binding, original.convention, { label: null })
          : factStatementOperand("play.phase@1", original.binding, original.convention, { phase: "opening" })
          : factStatementOperand(original.rendererId,
            field === "binding" ? original.binding === "recorded_run" ? "declared_convention" : "recorded_run" : original.binding,
            field === "convention" ? original.convention === "phase-bands@1" ? "board-rules@1" : "phase-bands@1" : original.convention, original.operands);
        if (field === "renderer") expect(operand.rendererId).not.toBe(original.rendererId);
        return item.component.id === "fact_statement" ? { ...item, component: { ...item.component, operand } }
          : item.component.id === "square_set" ? { ...item, component: { ...item.component, operand: { ...item.component.operand, caption: operand } } } : item;
      });
      expect(changed).toBe(1);
      expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
    });
  }
  it.each(["unit", "basis", "perspective", "saturated", "source_projection", "source_digest", "producer", "zero_mate"] as const)("recorded magnitude refuses a re-digested %s substitution", change => {
    const spec = remainingCurrentPairs.find(value => value.projection.id === "recorded.engine.eval")!;
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => {
      if (item.component.id !== "magnitude") throw new Error("Expected actual recorded magnitude");
      const original = item.component.operand;
      const operand = change === "unit" ? { ...original, unit: { kind: "percent" as const } }
        : change === "basis" ? { ...original, convention: { ...original.convention, basis: { kind: "declared" as const, convention: "board-rules@1" as const } } }
          : change === "perspective" ? { ...original, convention: { ...original.convention, perspective: "black" as const } }
            : change === "saturated" ? { ...original, saturated: true }
              : change === "source_projection" ? { ...original, convention: { ...original.convention, sourceProjection: { id: "rules.phase.reading", version: 2 } } }
                : change === "source_digest" ? { ...original, convention: { ...original.convention, sourceEvidenceDigest: `sha256:${"f".repeat(64)}` } }
                  : change === "producer" ? { ...original, convention: { ...original.convention, producer: { ...original.convention.producer, version: original.convention.producer.version + 1 } } }
                    : { ...original, unit: { kind: "mate_in" as const }, value: 0 };
      return { ...item, component: { ...item.component, operand } };
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow();
  });
  it("Map setup keeps its existing registered technique/name relationship", () => {
    const spec = remainingCurrentPairs.find(value => value.projection.id === "theory.endgame.setup_match")!;
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "play.endgame_setup@1") throw new Error("Expected actual setup statement");
      const value = item.component.operand;
      const operand = factStatementOperand(value.rendererId, value.binding, value.convention, { ...value.operands, name: "Wrong registered setup name" });
      return { ...item, component: { ...item.component, operand } };
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/name|setup/u);
  });
});

const flatPivotalPairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
  ["module.full_inspector", "module.review_map"].includes(spec.consumer.id) && spec.projection.id.startsWith("derived.pivotal."));

const boardLinePairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
  spec.composition?.id === "event_board_line" || spec.composition?.id === "event_squares_line");
const incompleteCaptionFootprints = new Set(["derived.material.event.role_asymmetry",
  "derived.tactic.check_zwischenzug_observed", "derived.tactic.overload_exploitation_observed"]);
// D4035 closes the former eight; none is excluded from the complete geometry image now.
const nudgeCaptionPairs = remainingCurrentPairs.filter(spec => spec.component === "square_set" && spec.composition === undefined);
const completeCaptionPairs = [...boardLinePairs, ...nudgeCaptionPairs];

/** Independent source-field image: no caption/template parsing and no new chess detection. */
function originalBoardFootprint(id: string, value: unknown): readonly string[] {
  switch (id) {
    case "derived.activity.event.open_file_occupancy": return [(value as { piece: { after: { square: string } } }).piece.after.square];
    case "derived.king.captured_zone_defender": return [(value as { capturedSquare: string }).capturedSquare];
    case "derived.pawn.event.transitions": return [(value as { pawn: { after: { square: string } } }).pawn.after.square];
    case "rules.king.event.zone_state": return [(value as { king: { after: string } }).king.after];
    case "rules.pawn.event.dynamics": {
      const p = value as { kind: string; subjects: Record<string, unknown> };
      const square = (v: unknown): string => (v as { square: string }).square;
      switch (p.kind) {
        case "locked_pair_gained": return [square(p.subjects.white), square(p.subjects.black)];
        case "minor_harassed": return [square(p.subjects.pawn), square(p.subjects.minor)];
        case "protected_passer_gained": return [p.subjects.pawn, ...(p.subjects.protectedBy as unknown[])].slice(0, 2).map(square);
        case "connected_passer_pair_gained": return [square(p.subjects.first), square(p.subjects.second)];
        case "candidate_majority_gained": return [square(p.subjects.pawn)];
        case "candidate_majority_advanced": return [square((p.subjects.after as { pawn: unknown }).pawn)];
        default: throw new Error(`Missing original pawn footprint ${p.kind}`);
      }
    }
    case "derived.pawn.sequence.contact_timing": {
      const p = value as { pawn: { contactSquare: string }; contactedPawn: { square: string } };
      return [p.pawn.contactSquare, p.contactedPawn.square];
    }
    case "derived.pawn.sequence.harassment_pressure": {
      const p = value as { pawn: { square: string }; minor: { after: { square: string } } };
      return [p.pawn.square, p.minor.after.square];
    }
    case "derived.tactic.sequence.defender_consequence": {
      const p = value as { defender: { before: { square: string } }; target: { square: string } };
      return [p.defender.before.square, p.target.square];
    }
    case "derived.tactic.deflection_observed": {
      const p = value as { defenderAfter: { square: string }; lostDuty: { target: { square: string } } };
      return [p.defenderAfter.square, p.lostDuty.target.square];
    }
    case "derived.tactic.attraction_observed": return [(value as { arrivalSquare: string }).arrivalSquare];
    case "derived.tactic.interference_observed": {
      const p = value as { betweenSquare: string; target: { square: string } };
      return [p.betweenSquare, p.target.square];
    }
    case "derived.tactic.line_blocker_clearance_observed": {
      const p = value as { slider: { square: string }; target: { square: string } };
      return [p.slider.square, p.target.square];
    }
    case "derived.tactic.square_clearance_observed": return [(value as { vacatedSquare: string }).vacatedSquare];
    case "rules.mobility.event.piece_destinations": {
      const p = value as { piece: { after: { square: string } }; legalGained: string[]; legalLost: string[] };
      return [p.piece.after.square, ...p.legalGained, ...p.legalLost];
    }
    case "derived.material.event.role_asymmetry": return (value as { sourceEvents: { to: string }[] }).sourceEvents.map(event => event.to);
    case "derived.tactic.check_zwischenzug_observed": return [(value as { retainedRecapture: { landingSquare: string } }).retainedRecapture.landingSquare];
    case "derived.tactic.overload_exploitation_observed": {
      const p = value as { defenderRecapture: { to: string }; secondTargetCapture: { landingSquare: string } };
      return [p.defenderRecapture.to, p.secondTargetCapture.landingSquare];
    }
    default: throw new Error(`Missing original board footprint for ${id}`);
  }
}

describe("D4034 the complete shared board/recorded-line image", () => {
  it("preserves the three actual pre-D4035 text/mark/line preimages", () => {
    const preimages = [];
    for (const id of incompleteCaptionFootprints) {
      const spec = boardLinePairs.find(value => value.projection.id === id)!;
      const wire = currentPairReceipt(spec), board = wire.items[0]!.component, line = wire.items[1]!.component;
      if (board.id !== "square_set" || line.id !== "move_path") throw new Error("Expected original board/line preimage");
      preimages.push({ id, text: board.operand.caption.renderedText, squares: board.operand.squares, line: line.operand.plies });
    }
    // Captured by the ordinary test on the original constructors before any D4035 change.
    expect(preimages).toEqual([
      { id: "derived.material.event.role_asymmetry", text: "After Rxe7+, the sides' counts of queens changed; the total difference by role went from 2 to 1.", squares: ["e7"], line: [{ ply: 1, san: "Rxe7+", uci: "e2e7" }] },
      { id: "derived.tactic.check_zwischenzug_observed", text: "Instead of recapturing at once (bxc3), Qh5+ gave check; after Kf8 the recapture bxc3 was still available.", squares: ["c3"], line: [{ ply: 2, san: "Bxc3", uci: "b4c3" }, { ply: 3, san: "Qh5+", uci: "d1h5" }, { ply: 4, san: "Kf8", uci: "e8f8" }, { ply: 5, san: "bxc3", uci: "b2c3" }] },
      { id: "derived.tactic.overload_exploitation_observed", text: "Bxa7 was answered by the recapture Nxa7, and Black's queen on e7, which the recapturing piece also defended, was then captured (Rxe7).", squares: ["a7", "e7"], line: [{ ply: 1, san: "Bxa7", uci: "b8a7" }, { ply: 2, san: "Nxa7", uci: "c6a7" }, { ply: 3, san: "Rxe7", uci: "e1e7" }] },
    ]);
  });
  it("counts all41 geometry pairs, including all eight repaired D4035 pairs", () => {
    expect(boardLinePairs).toHaveLength(33);
    expect(nudgeCaptionPairs).toHaveLength(8);
    expect(completeCaptionPairs).toHaveLength(41);
    expect(new Set(completeCaptionPairs.map(spec => key(spec.consumer, spec.projection))).size).toBe(41);
    expect(completeCaptionPairs.filter(spec => incompleteCaptionFootprints.has(spec.projection.id))).toHaveLength(8);
    expect(boardLinePairs.filter(spec => spec.consumer.id === "module.full_inspector")).toHaveLength(12);
  });
  it.each(boardLinePairs)("retains a genuine nonempty source and original line for $consumer.id × $projection.id", spec => {
    const wire = currentPairReceipt(spec);
    expect(wire.items.map(item => item.component.id)).toEqual(["square_set", "move_path"]);
  });
  it.each(boardLinePairs)("D3979 retains the original starting position for $consumer.id × $projection.id", spec => {
    const original = minted.get(`${spec.projection.id}@${spec.projection.version}`)!.filter(witnessed)[0]!;
    const payload = original.payload as { readonly beforeFen?: string; readonly anchors?: readonly { readonly beforeFen: string }[] };
    const beforeFen = payload.anchors?.[0]?.beforeFen ?? payload.beforeFen;
    expect(beforeFen, "Original path construction must own its before-position").toBeTypeOf("string");
    const line = currentPairReceipt(spec).items.find(item => item.component.id === "move_path")!.component;
    if (line.id !== "move_path") throw new Error("Expected the genuine complete path");
    expect(Object.getOwnPropertyDescriptor(line.operand, "startFen")?.value).toBe(beforeFen);
  });
  for (const change of ["missing_start", "wrong_turn", "wrong_san"] as const) it.each(boardLinePairs)(`D3979 refuses ${change} after redigest for $consumer.id × $projection.id`, spec => {
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => {
      if (item.component.id !== "move_path") return item;
      const original = item.component.operand;
      const operand = change === "wrong_turn" ? { ...original, startFen: original.startFen.replace(/ (w|b) /u, (_, turn) => turn === "w" ? " b " : " w ") }
        : change === "missing_start" ? { ...original }
          : { ...original, plies: original.plies.map((ply, index) => index === 0 ? { ...ply, san: "not the original SAN" } : ply) };
      // Deliberately malformed wire; no type assertion that the missing field is valid.
      if (change === "missing_start") expect(Reflect.deleteProperty(operand, "startFen")).toBe(true);
      return { ...item, component: { ...item.component, operand } };
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow();
  });
  it.each(nudgeCaptionPairs)("D3982 refuses an appended old path or arrow form in $consumer.id × $projection.id", spec => {
    expect(spec.consumer).toEqual({ id: "module.postcommit_nudge", version: 2 });
    expect(spec.projection.version).toBe(3);
    expect(spec.forms).not.toContain("arrows");
    const wire = currentPairReceipt(spec);
    expect(wire.items.map(item => item.component.id)).toEqual(["square_set"]);
    const other = boardLinePairs.find(row => row.consumer.id === "module.review_map" && row.projection.id === spec.projection.id)!;
    const oldPath = currentPairReceipt(other).items[1]!;
    const forged = { ...oldPath, adapter: wire.items[0]!.adapter };
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items: [...wire.items, forged] }))).toThrow();
    // Even a genuine current component cannot claim a form no longer served by this exact pair.
    const arrow = { ...wire.items[0]!, adapter: { ...wire.items[0]!.adapter, forms: [...spec.forms, "arrows"] } };
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items: [arrow] }))).toThrow();
  });
  it.each(completeCaptionPairs)("retains the independent source footprint for $consumer.id × $projection.id", spec => {
    const source = minted.get(`${spec.projection.id}@${spec.projection.version}`)!.filter(witnessed)[0]!;
    const board = currentPairReceipt(spec).items[0]!.component;
    if (board.id !== "square_set") throw new Error("Expected actual board footprint");
    expect(board.operand.squares).toEqual([...new Set(originalBoardFootprint(spec.projection.id, source.payload))]);
  });
  const dynamicsPairs = boardLinePairs.filter(spec => spec.projection.id === "rules.pawn.event.dynamics");
  const dynamicsBranches = [
    { kind: "locked_pair_gained", fen: "4k3/8/8/4p3/8/8/4P3/4K3 w - - 0 1", move: "e2e4" },
    { kind: "minor_harassed", fen: "4k3/8/8/8/6n1/8/7P/4K3 w - - 0 1", move: "h2h3" },
    { kind: "protected_passer_gained", fen: "4k3/8/8/3P4/8/8/2P5/4K3 w - - 0 1", move: "c2c4" },
    { kind: "connected_passer_pair_gained", fen: "4k3/8/8/3r4/2P1P3/8/8/4K3 w - - 0 1", move: "e4d5" },
    { kind: "candidate_majority_gained", fen: "4k3/8/3p4/4p3/3P1P2/8/8/4K3 w - - 0 1", move: "d4e5" },
    { kind: "candidate_majority_advanced", fen: "4k3/8/2p5/8/3P4/2P5/8/4K3 w - - 0 1", move: "d4d5" },
    // A new protected passer with TWO recorded supporters: retain all three pieces in the
    // caption, but preserve the original first-two highlight convention, not all supporters.
    { kind: "protected_passer_gained", fen: "4k3/8/8/8/8/3P1P2/4P3/4K3 w - - 0 1", move: "e2e4", twoSupporters: true },
  ] as const;
  it("requires both current pawn-dynamics pairs", () => { expect(dynamicsPairs).toHaveLength(2); });
  for (const branch of dynamicsBranches) for (const black of [false, true]) {
    it.each(dynamicsPairs)(`preserves actual ${branch.kind}/${black ? "Black" : "White"}/${"twoSupporters" in branch ? "two supporters" : "original"} source in $consumer.id`, spec => {
      const run = recordedSequenceWindowFixture({ fen: branch.fen, moves: [branch.move] }, black);
      const child = run.nodes.at(-1)!;
      if (child.moveUci === null) throw new Error("Actual committed branch has no move");
      const values = invokeEvidenceValueRoute("rules.pawn.event.dynamics@1", { beforeFen: run.nodes[0]!.fen, moveUci: child.moveUci, afterFen: child.fen });
      const source = sealedItems(values).find(value => (value.payload as { kind: string }).kind === branch.kind);
      expect(source, "Expected real collector's exact branch").toBeDefined();
      const original = JSON.stringify(source!.payload);
      const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, spec.consumer, [source!]));
      const wire = serializePresentedEvidence(presented), board = wire.items[0]!.component;
      expect(parsePresentationReceipt(JSON.parse(JSON.stringify(wire)))).toEqual(presented);
      if (board.id !== "square_set" || board.operand.caption.rendererId !== "inspector.pawn_dynamics@1") throw new Error("Expected actual dynamics board");
      expect(board.operand.squares).toEqual([...new Set(originalBoardFootprint(spec.projection.id, source!.payload))]);
      expect(board.operand.caption.operands.kind).toBe(branch.kind);
      if ("twoSupporters" in branch) {
        expect(board.operand.caption.operands.pieces).toHaveLength(3);
        expect(board.operand.squares).toHaveLength(2);
      }
      if (branch.kind === "candidate_majority_advanced") {
        expect(board.operand.caption.operands.pieces[0]!.square).not.toBe(board.operand.caption.operands.pieces[1]!.square);
        expect(board.operand.squares).toEqual([board.operand.caption.operands.pieces[1]!.square]);
      }
      expect(JSON.stringify(source!.payload)).toBe(original);
    });
  }
  for (const black of [false, true]) it(`retains LEGAL, not local-exchange, destination highlights for ${black ? "Black" : "White"}`, () => {
    const pairs = boardLinePairs.filter(spec => spec.projection.id === "rules.mobility.event.piece_destinations");
    expect(pairs).toHaveLength(1);
    const spec = pairs[0]!;
    const run = recordedSequenceWindowFixture({ fen: "4k3/8/8/8/1p6/8/8/1N2K3 w - - 0 1", moves: ["b1a3"] }, black);
    const child = run.nodes.at(-1)!;
    if (child.moveUci === null) throw new Error("Actual committed knight move is missing");
    const values = sealedItems(invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", {
      beforeFen: run.nodes[0]!.fen, moveUci: child.moveUci, afterFen: child.fen,
    }));
    const source = values.find(value => (value.payload as { moved: boolean; piece: { after: { role: string } } }).moved
      && (value.payload as { piece: { after: { role: string } } }).piece.after.role === "knight");
    expect(source).toBeDefined();
    const payload = source!.payload as { piece: { after: { square: string } }; safeGained: string[]; safeLost: string[] };
    const expected = [...new Set(originalBoardFootprint(spec.projection.id, payload))];
    const alternate = [...new Set([payload.piece.after.square, ...payload.safeGained, ...payload.safeLost])];
    expect(new Set(expected)).not.toEqual(new Set(alternate));
    const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, spec.consumer, [source!]));
    const wire = serializePresentedEvidence(presented), board = wire.items[0]!.component;
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(wire)))).toEqual(presented);
    if (board.id !== "square_set" || board.operand.caption.rendererId !== "inspector.piece_destinations_event@1") throw new Error("Expected actual destinations board");
    expect(board.operand.squares).toEqual(expected);
    expect(board.operand.caption.operands.safeGained).toEqual(payload.safeGained);
    expect(board.operand.caption.operands.safeLost).toEqual(payload.safeLost);
    const items = wire.items.map(item => item.component.id !== "square_set" ? item : {
      ...item, component: { ...item.component, operand: { ...item.component.operand, squares: alternate as SquareName[] } },
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/geometry/u);
  });
  it.each(completeCaptionPairs)("refuses unrelated squares beside original caption/line in $consumer.id × $projection.id", spec => {
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => {
      if (item.component.id !== "square_set") return item;
      const original = item.component.operand;
      const unrelated = Array.from({ length: 64 }, (_, index) => `${"abcdefgh"[index % 8]}${Math.floor(index / 8) + 1}` as SquareName).find(square => !original.squares.includes(square));
      if (unrelated === undefined) throw new Error("Expected this fixture's finite footprint not all64 squares");
      const operand = { ...original, squares: [unrelated] };
      expect(operand).not.toEqual(original);
      expect(operand.caption).toEqual(original.caption);
      return { ...item, component: { ...item.component, operand } };
    });
    expect(items[1]).toEqual(wire.items[1]);
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/geometry|registered/u);
  });
  it.each(completeCaptionPairs)("accepts reordered equivalent square sets in $consumer.id × $projection.id", spec => {
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => item.component.id !== "square_set" ? item : {
      ...item, component: { ...item.component, operand: { ...item.component.operand, squares: [...item.component.operand.squares].reverse() } },
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).not.toThrow();
  });
  for (const change of ["brush", "owner"] as const) it.each(completeCaptionPairs)(`refuses changed ${change} in $consumer.id × $projection.id`, spec => {
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => item.component.id !== "square_set" ? item : {
      ...item, component: { ...item.component, operand: change === "brush" ? { ...item.component.operand, brush: "red" as const }
        : { ...item.component.operand, owner: { factRef: `sha256:${"f".repeat(64)}` } } },
    });
    expect(items[0]).not.toEqual(wire.items[0]);
    expect(items[1]).toEqual(wire.items[1]);
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/geometry|owner|registered/u);
  });
  for (const change of ["origin", "distance", "basis", "perspective", "source_projection", "source_digest", "producer", "convention"] as const) {
    it.each(boardLinePairs)(`refuses recorded-line ${change} substitution in $consumer.id × $projection.id`, spec => {
      const wire = currentPairReceipt(spec);
      const items = wire.items.map(item => {
        if (item.component.id !== "move_path") return item;
        const original = item.component.operand, convention = original.convention!;
        const operand = change === "origin" ? { ...original, origin: "learner_played" as const }
          : change === "distance" ? { ...original, answerDistance: "pattern" as const }
            : change === "basis" ? { ...original, convention: { ...convention, basis: { kind: "recorded_search" as const, engine: null, depth: null } } }
              : change === "perspective" ? { ...original, convention: { ...convention, perspective: "white" as const } }
                : change === "source_projection" ? { ...original, convention: { ...convention, sourceProjection: { id: "rules.phase.reading", version: 2 } } }
                  : change === "source_digest" ? { ...original, convention: { ...convention, sourceEvidenceDigest: `sha256:${"f".repeat(64)}` } }
                    : change === "producer" ? { ...original, convention: { ...convention, producer: { ...convention.producer, version: convention.producer.version + 1 } } }
                      : { ...original, convention: { ...convention, basis: { kind: "declared" as const, convention: "board-rules@1" as const } } };
        expect(operand).not.toEqual(original);
        expect(operand.plies).toEqual(original.plies);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(items[0]).toEqual(wire.items[0]);
      expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/recorded|convention|registered/u);
    });
  }
});

describe("D4035 required source coordinates, not a source-only geometry exception", () => {
  const pairs = completeCaptionPairs.filter(spec => incompleteCaptionFootprints.has(spec.projection.id));
  const coordinateField = (id: string) => id === "derived.material.event.role_asymmetry" ? "squares"
    : id === "derived.tactic.check_zwischenzug_observed" ? "recaptureSquare" : "defenderRecaptureSquare";
  it("covers all eight exact pairs", () => { expect(pairs).toHaveLength(8); });
  for (const promotion of ["q", "r", "b", "n"]) for (const black of [false, true]) {
    it.each(pairs.filter(spec => spec.projection.id === "derived.material.event.role_asymmetry"))(`preserves real capture-promotion ${promotion}/${black ? "Black" : "White"} deduplication in $consumer.id`, spec => {
      const run = recordedSequenceWindowFixture({ fen: "1r5k/P7/8/8/8/8/8/7K w - - 7 1", moves: [`a7b8${promotion}`] }, black);
      const child = run.nodes.at(-1)!;
      if (child.moveUci === null) throw new Error("Capture-promotion fixture lacks its actual committed move");
      const values = sealedItems(invokeEvidenceValueRoute("derived.material.event.role_asymmetry@2", { beforeFen: run.nodes[0]!.fen, moveUci: child.moveUci, afterFen: child.fen }));
      expect(values).toHaveLength(1);
      const source = values[0]!, original = JSON.stringify(source.payload);
      const payload = source.payload as { sourceEvents: { family: string; to: string }[] };
      expect(payload.sourceEvents.map(event => event.family)).toEqual(["capture", "promotion"]);
      expect(payload.sourceEvents).toHaveLength(2);
      expect(payload.sourceEvents[0]!.to).toBe(payload.sourceEvents[1]!.to);
      const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, spec.consumer, [source]));
      const wire = serializePresentedEvidence(presented), board = wire.items[0]!.component;
      expect(parsePresentationReceipt(JSON.parse(JSON.stringify(wire)))).toEqual(presented);
      if (board.id !== "square_set" || board.operand.caption.rendererId !== "inspector.role_asymmetry@1") throw new Error("Expected genuine role-event board");
      expect(board.operand.caption.operands.squares).toEqual([payload.sourceEvents[0]!.to]);
      expect(board.operand.squares).toEqual(board.operand.caption.operands.squares);
      expect(JSON.stringify(source.payload)).toBe(original);
    });
  }
  it.each(pairs)("retains the actual source coordinate operand for $consumer.id × $projection.id", spec => {
    const source = minted.get(`${spec.projection.id}@${spec.projection.version}`)!.filter(witnessed)[0]!;
    const component = currentPairReceipt(spec).items[0]!.component;
    if (component.id !== "square_set") throw new Error("Expected genuine recorded board");
    const coordinates = [...new Set(originalBoardFootprint(spec.projection.id, source.payload))];
    const operands = component.operand.caption.operands as Record<string, unknown>;
    const expected = spec.projection.id === "derived.material.event.role_asymmetry" ? coordinates : coordinates[0];
    expect(operands[coordinateField(spec.projection.id)]).toEqual(expected);
  });
  for (const stage of ["process", "wire"] as const) for (const change of ["missing", "malformed", "extra"] as const) {
    it.each(pairs)(`${stage} refuses ${change} coordinates in $consumer.id × $projection.id`, spec => {
      const wire = currentPairReceipt(spec);
      const items = wire.items.map(item => {
        if (item.component.id !== "square_set") return item;
        const original = item.component.operand.caption, operands: Record<string, unknown> = { ...original.operands };
        const field = coordinateField(spec.projection.id);
        if (change === "missing") delete operands[field];
        else if (change === "malformed") operands[field] = field === "squares" ? ["z9"] : "z9";
        else operands.undeclaredSquare = "e4";
        if (stage === "process") expect(() => factStatementOperand(original.rendererId, original.binding, original.convention, operands as never)).toThrow();
        return { ...item, component: { ...item.component, operand: { ...item.component.operand, caption: { ...original, operands,
          sourceDigest: presentationDigest("presentation.fact.operands@1", operands) } } } };
      });
      // Intentional raw malformed wire; do not let the checked constructor make the wire test pass.
      if (stage === "wire") expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items } as unknown as PresentationReceipt))).toThrow();
    });
  }
  for (const stage of ["process", "wire"] as const) it.each(pairs.filter(spec => spec.projection.id === "derived.material.event.role_asymmetry"))(`${stage} refuses duplicated role-event coordinates in $consumer.id`, spec => {
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => {
      if (item.component.id !== "square_set") return item;
      const original = item.component.operand.caption;
      const operands = { ...original.operands, squares: ["e7", "e7"] };
      if (stage === "process") expect(() => factStatementOperand(original.rendererId, original.binding, original.convention, operands as never)).toThrow();
      return { ...item, component: { ...item.component, operand: { ...item.component.operand, caption: { ...original, operands,
        sourceDigest: presentationDigest("presentation.fact.operands@1", operands) } } } };
    });
    if (stage === "wire") expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items } as unknown as PresentationReceipt))).toThrow();
  });
});

describe("D4033 contact highlights retain their own caption witnesses", () => {
  const pairs = inspectorAdapterSpecs(inspectorSourcePresentationKit).filter(spec =>
    ["module.full_inspector", "module.review_map"].includes(spec.consumer.id)
    && spec.projection.id === "derived.pawn.sequence.contact_timing" && spec.projection.version === 3);
  it("retains both exact current consumers", () => { expect(pairs).toHaveLength(2); });
  it.each(pairs)("keeps genuine source coordinates in $consumer.id", spec => {
    const source = minted.get(`${spec.projection.id}@${spec.projection.version}`)!.filter(witnessed)[0]!;
    const payload = source.payload as { readonly pawn: { readonly contactSquare: string }; readonly contactedPawn: { readonly square: string } };
    const wire = currentPairReceipt(spec), board = wire.items.find(item => item.component.id === "square_set")!.component;
    if (board.id !== "square_set" || board.operand.caption.rendererId !== "inspector.contact_timing@1") throw new Error("Expected genuine contact board");
    expect(board.operand.squares).toEqual([...new Set([payload.pawn.contactSquare, payload.contactedPawn.square])]);
    expect(board.operand.caption.operands.square).toBe(payload.pawn.contactSquare);
    expect(board.operand.caption.operands.contacted.square).toBe(payload.contactedPawn.square);
  });
  for (const change of ["squares", "brush", "owner"] as const) {
    it.each(pairs)(`refuses changed ${change} with original caption/line in $consumer.id`, spec => {
      const wire = currentPairReceipt(spec);
      let changed = 0;
      const items = wire.items.map(item => {
        if (item.component.id !== "square_set") return item;
        changed += 1;
        const original = item.component.operand;
        const operand = change === "squares" ? { ...original, squares: ["a1" as const] }
          : change === "brush" ? { ...original, brush: "red" as const }
            : { ...original, owner: { factRef: `sha256:${"f".repeat(64)}` } };
        expect(operand).not.toEqual(original);
        expect(operand.caption).toEqual(original.caption);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(changed).toBe(1);
      expect(items.filter(item => item.component.id === "move_path")).toEqual(wire.items.filter(item => item.component.id === "move_path"));
      expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/geometry|owner|registered source semantics/u);
    });
  }
  it.each(pairs)("keeps square-set semantics, not coordinate ordering, in $consumer.id", spec => {
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => item.component.id !== "square_set" ? item : {
      ...item, component: { ...item.component, operand: { ...item.component.operand, squares: [...item.component.operand.squares].reverse() } },
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).not.toThrow();
  });
});

describe("D4030 pivotal operand variants, not template defaults", () => {
  it("covers all four kinds in both current consumers", () => { expect(flatPivotalPairs).toHaveLength(8); });
  it.each(flatPivotalPairs)("binds genuine sibling kinds to $consumer.id × $projection.id", spec => {
    const sibling = flatPivotalPairs.find(value => value.consumer.id === spec.consumer.id && value.projection.id !== spec.projection.id)!;
    const wire = currentPairReceipt(spec), other = currentPairReceipt(sibling).items[0]!.component;
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "inspector.pivotal@1"
        || other.id !== "fact_statement" || other.operand.rendererId !== "inspector.pivotal@1") throw new Error("Expected actual pivotal statements");
      const value = item.component.operand;
      const operand = factStatementOperand(value.rendererId, value.binding, value.convention, other.operand.operands);
      return { ...item, component: { ...item.component, operand } };
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/kind|registered source semantics/u);
  });
  it.each(flatPivotalPairs)("constructor refuses genuine sibling source for $consumer.id × $projection.id", spec => {
    const sibling = flatPivotalPairs.find(value => value.consumer.id === spec.consumer.id && value.projection.id !== spec.projection.id)!;
    const sources = minted.get(`${sibling.projection.id}@${sibling.projection.version}`)!;
    expect(sources.length).toBeGreaterThan(0);
    expect(() => spec.construct(sources[0]!)).toThrow(/kind/u);
  });
  for (const stage of ["process", "wire"] as const) for (const change of ["missing", "unrelated"] as const) {
    it.each(flatPivotalPairs)(`${stage} refuses ${change} kind fields in $consumer.id × $projection.id`, spec => {
      const wire = currentPairReceipt(spec);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "inspector.pivotal@1") throw new Error("Expected genuine flattened pivotal statement");
        const original = item.component.operand, value = original.operands;
        const operands: Record<string, unknown> = { ...value };
        let renderedText = original.renderedText;
        if (change === "unrelated") {
          if (value.kind === "human_divergence") operands.from = "opening";
          else operands.model = "HIDDEN_TEST_SENTINEL";
        } else if (value.kind === "phase_change") {
          delete operands.from;
          renderedText = renderedText.replace(String(value.from), "one phase");
        } else if (value.kind === "human_divergence") {
          delete operands.model;
          renderedText = renderedText.replace(String(value.model), "The human-move model");
        } else {
          delete operands.color;
          renderedText = renderedText.replace(/^Black/u, "White");
        }
        // Wire controls do not call the checked constructor: preserve ignored-field prose or
        // explicitly retain the old missing-field fallback, then recompute all public digests.
        if (stage === "process") expect(() => factStatementOperand(original.rendererId, original.binding, original.convention, operands as never)).toThrow();
        return { ...item, component: { ...item.component, operand: { ...original, operands,
          sourceDigest: presentationDigest("presentation.fact.operands@1", operands), renderedText } } };
      });
      // Deliberately malformed raw wire, not a valid typed receipt constructed in-process.
      if (stage === "wire") expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items } as unknown as PresentationReceipt))).toThrow();
    });
  }
  for (const consumer of ["module.full_inspector", "module.review_map"] as const) {
    for (const [subkind, fen, move] of [
      ["castled", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1"],
      ["pawn_break", "4k3/8/8/3p4/8/4P3/8/4K3 w - - 0 1", "e3e4"],
    ] as const) it(`${consumer} preserves genuine ${subkind} flattened fields`, () => {
      const run = recordedSequenceWindowFixture({ fen, moves: [move] });
      const collected = collectInspectorPivotalPrefix(run, run.activeCursor.branchId, run.activeCursor.nodeId,
        "derived.pivotal.irreversibility@1", new AbortController().signal);
      const sources = sealedItems(collected.result);
      expect(sources).toHaveLength(1);
      expect(sources[0]!.payload).toMatchObject({ kind: "irreversibility", detail: { subkind, color: "white" } });
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 2 }, sources));
      const received = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
      expect(received).toEqual(items);
      expect(received[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: { kind: "irreversibility", subkind, color: "white" } } });
    });
    it(`${consumer} preserves a genuine recorded target band, without claiming model calibration`, () => {
      const run = recordHumanObservation(humanObservationRun(false, 1600), splitCandidates());
      const collected = collectInspectorPivotalPrefix(run, run.activeCursor.branchId, run.activeCursor.nodeId,
        "derived.pivotal.human_divergence@2", new AbortController().signal);
      const sources = sealedItems(collected.result);
      expect(sources).toHaveLength(1);
      expect(sources[0]!.payload).toMatchObject({ kind: "human_divergence", detail: { targetElo: 1600 } });
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 2 }, sources));
      const received = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
      expect(received).toEqual(items);
      expect(received[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: { kind: "human_divergence", band: 1600 } } });
    });
  }
});

describe("D4031 the recorded tablebase's fixed perspective", () => {
  it.each(["module.review_map", "module.full_inspector"])("%s refuses White perspective under the original side-to-move ledger pair", consumer => {
    const spec = inspectorAdapterSpecs(inspectorSourcePresentationKit).find(value => value.consumer.id === consumer && value.projection.id === "recorded.tablebase.result")!;
    const wire = currentPairReceipt(spec);
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "inspector.tablebase@1") throw new Error("Expected genuine ledger tablebase");
      const value = item.component.operand;
      expect(value.operands.perspective).toBe("side_to_move");
      const operand = factStatementOperand(value.rendererId, value.binding, value.convention, { ...value.operands, perspective: "white" });
      return { ...item, component: { ...item.component, operand } };
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/perspective/u);
  });
});

describe("D3948 structural/avoidance literal family association (presentation, not acquisition)", () => {
  it("retains all4 current conditional pairs with validators, without skipped fixture families", () => {
    expect(conditionalStatementPairs).toHaveLength(4);
    expect(new Set(conditionalStatementPairs.map(spec => key(spec.consumer, spec.projection))).size).toBe(4);
    expect(new Set(conditionalStatementPairs.map(spec => `${spec.projection.id}@${spec.projection.version}`))).toEqual(conditionalStatementRefs);
    for (const spec of conditionalStatementPairs) expect(spec.validateWireComponent, key(spec.consumer, spec.projection)).toBeTypeOf("function");
  });
  it.each(conditionalStatementPairs)("round-trips genuine $consumer.id × $projection.id@$projection.version", spec => {
    statementReceipt(spec);
  });
  it.each(conditionalStatementPairs)("constructor refuses genuine sibling source under $consumer.id × $projection.id@$projection.version", spec => {
    const prefix = spec.projection.id.startsWith("rules.structural.event.") ? "rules.structural.event." : "derived.semantic_avoidance.";
    const sibling = conditionalStatementPairs.find(candidate => candidate.consumer.id === spec.consumer.id
      && candidate.projection.id.startsWith(prefix) && candidate.projection.id !== spec.projection.id)!;
    expect(sibling).toBeDefined();
    const sources = (minted.get(`${sibling.projection.id}@${sibling.projection.version}`) ?? []).filter(witnessed);
    expect(sources.length).toBeGreaterThan(0);
    // Both values are genuine private-factory outputs. This isolates the constructor's source
    // discriminant, not a forged ConsumerEvidenceView or an external-source-admission claim.
    expect(() => spec.construct(sources[0]!)).toThrow(/family/u);
  });
  for (const field of ["renderer", "binding", "convention"] as const) {
    it.each(conditionalStatementPairs)(`refuses redigested ${field} for $consumer.id × $projection.id@$projection.version`, spec => {
      const wire = statementReceipt(spec);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement") throw new Error("Expected actual conditional statement");
        const original = item.component.operand;
        const operand = field === "renderer" ? factStatementOperand("play.phase@1", original.binding, original.convention, { phase: "opening" })
          : factStatementOperand(original.rendererId,
            field === "binding" ? original.binding === "recorded_run" ? "declared_convention" : "recorded_run" : original.binding,
            field === "convention" ? "phase-bands@1" : original.convention, original.operands);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
    });
  }
  it.each(conditionalStatementPairs)("refuses a genuine sibling family under $consumer.id × $projection.id@$projection.version", spec => {
    const prefix = spec.projection.id.startsWith("rules.structural.event.") ? "rules.structural.event." : "derived.semantic_avoidance.";
    const sibling = conditionalStatementPairs.find(candidate => candidate.consumer.id === spec.consumer.id
      && candidate.projection.id.startsWith(prefix) && candidate.projection.id !== spec.projection.id)!;
    expect(sibling).toBeDefined();
    const original = statementReceipt(spec), other = statementReceipt(sibling).items[0]!.component;
    const items = original.items.map(item => {
      if (item.component.id !== "fact_statement" || other.id !== "fact_statement") throw new Error("Expected genuine family statements");
      const value = item.component.operand;
      // Keep original tuple, move/sign/counts and ownership. Change only the family-bearing
      // operand to a genuinely emitted sibling, then recompute text and every public digest.
      const operand = value.rendererId === "inspector.structural_event@1" && other.operand.rendererId === "inspector.structural_event@1"
        ? factStatementOperand(value.rendererId, value.binding, value.convention, { ...value.operands, observation: other.operand.operands.observation })
        : value.rendererId === "inspector.avoidance@1" && other.operand.rendererId === "inspector.avoidance@1"
          ? factStatementOperand(value.rendererId, value.binding, value.convention, { ...value.operands, family: other.operand.operands.family })
          : (() => { throw new Error("Crossed conditional renderer fixture"); })();
      return { ...item, component: { ...item.component, operand } };
    });
    expect(() => parsePresentationReceipt(redigestStatementReceipt({ ...original, items }))).toThrow(/family|kind/u);
  });
});

describe("inspector / post-commit nudge / review map adapters: real evidence through the one construction path", () => {

  it.each(CONSUMERS)("%s: presents, round-trips and renders learner vocabulary only", (consumer) => {
    const ref = bindingsOf(consumer)[0]!.consumer;
    let presentedPairs = 0;
    for (const binding of bindingsOf(consumer)) {
      if (!OWN.has(key(ref, binding.projection))) continue;
      const original = minted.get(`${binding.projection.id}@${binding.projection.version}`) ?? [];
      const items = consumer === "module.full_inspector" ? original : original.filter(witnessed);
      if (consumer === "module.full_inspector") expect(items.length, `Missing actual current source for ${binding.projection.id}@${binding.projection.version}`).toBeGreaterThan(0);
      if (items.length === 0) continue;
      presentedPairs += 1;
      for (const item of items) {
        const label = `${consumer} × ${binding.projection.id}@${binding.projection.version}`;
        const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref, [item]));
        const adapter = PRESENTATION_ADAPTERS.find((entry) => entry.key === key(ref, binding.projection))!;
        expect(presented.map((entry) => entry.component.id), label).toEqual(adapterComponentsForEvidence(adapter, item));
        const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(presented))));
        expect(parsed.map((entry) => entry.componentDigest), label).toEqual(presented.map((entry) => entry.componentDigest));
        for (const entry of parsed) {
          const sentence = presentedSentence(entry);
          expect(assertPresentationText(sentence)).toBe(sentence);
          if (binding.projection.id === "recorded.engine.eval") {
            const sourceDate = (item.payload as { readonly retrievedAt: string }).retrievedAt.slice(0, 10);
            expect(sentence, `${label}: source date must survive presentation`).toContain(`authored on ${sourceDate}`);
          }
          if (binding.projection.id === "recorded.inspector.pv_packet") expect(sentence).toContain("not a current recommendation");
          for (const pattern of FORBIDDEN) expect(sentence, `${label}: ${sentence}`).not.toMatch(pattern);
          if (consumer === "module.postcommit_nudge") expect(sentence.split(/\s+/u).length, `${label}: ${sentence}`).toBeLessThanOrEqual(50);
        }
      }
    }
    if (consumer === "module.full_inspector") expect(presentedPairs).toBe(102);
    else expect(presentedPairs).toBeGreaterThan(40);
  });
});
