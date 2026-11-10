// rfc/evidence-presentation.md §2.3/§8.2 — the ordinary, Inspector and author/operator consumer
// adapters over real minted evidence: every presented item round-trips the closed receipt, every
// sentence passes the raw-id guard and carries no forbidden vocabulary; criteria 8 and 14.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import { corpusPageEvidence, evidenceReferenceEvidence, humanSplitPageEvidence, positionGuidanceEvidence, recordedReadingEvidence, sourcingRecordEvidence } from "./evidence-operations.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { pivotalMarkerEvidenceItems } from "./pivotal.js";
import { declareStructuralReadingEvidence, declareTransitionReadingEvidence } from "./reading-evidence.js";
import { STRUCTURAL_DETAIL_KINDS } from "./structural-reading-detail.js";
import {
  PRESENTATION_ADAPTERS,
  adapterComponents,
  assertPresentationSourceRetention,
  assertPresentationText,
  parseComponentValue,
  parsePresentationReceipt,
  factStatementOperand,
  presentationDigest,
  presentEvidenceItems,
  presentedSentence,
  serializePresentedEvidence,
  type PresentedEvidenceItem,
  type PresentationReceipt,
} from "./presentation-contract.js";
import { CONSUMER_FACT_RENDERERS, PRESENTATION_CONSUMER_CLASSES, STRUCTURED_DOCUMENT_SCHEMAS, consumerAdapterSpecs, presentationConsumerClass } from "./presentation-consumer-adapters.js";
import { inspectorSourcePresentationKit } from "./testing/inspector-source-presentation-kit.js";
import { registeredShapeFixture } from "./testing/registered-shape-fixture.js";
import { branchPath } from "./branch-path.js";
import { compareBranches } from "./compare.js";
import { comparisonNarrative } from "./compare-strips.js";
import { commitMove, createRun, fork, rewind } from "./runtime.js";
import { storyDeclaredEvidence, storyMomentsForRun } from "./story.js";
import { attachDelivery, evaluationDelivery } from "./testing/review-evidence-fixture.js";
import type { DrillRun } from "./types.js";

const at = "2026-09-24T00:00:00.000Z";
const digest = `sha256:${"c".repeat(64)}`;
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const MAROCZY = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
const IQP = "r1bqkb1r/pp3ppp/2n1pn2/3p4/3P4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 7";
const ROOK_ENDGAME = "8/5k2/8/3R4/8/8/5PK1/3r4 w - - 0 1";

/** Learner-vocabulary refusals beyond the §6e raw-id guard. */
const FORBIDDEN: readonly RegExp[] = [/Tabiya's/u, /\bdetector\b/iu, /phase bands/iu, /recorded mass/iu, /evidence recorded\./iu, /sha256/u, /\b[a-h][1-8][a-h][1-8][qrbn]?\b/u];
const VERSION_TOKEN = /[a-z]@\d/u;

const covered = new Set<string>();
const ref = (id: string) => ({ id, version: 1 });

/** Presents one consumer view, round-trips the receipt and checks every sentence. */
function present(consumer: string, evidence: readonly DeclaredEvidence<unknown>[], version = 1): readonly PresentedEvidenceItem[] {
  const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version }, evidence));
  const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
  expect(parsed.map(presentedSentence)).toEqual(items.map(presentedSentence));
  for (const item of parsed) {
    const sentence = presentedSentence(item);
    expect(assertPresentationText(sentence)).toBe(sentence);
    for (const pattern of FORBIDDEN) expect(sentence, `${consumer} × ${item.adapter.projection.id}: ${sentence}`).not.toMatch(pattern);
    // The citation's registered revision label is the one versioned token a learner sees (reported upstream).
    if (item.component.id !== "citation") expect(sentence, sentence).not.toMatch(VERSION_TOKEN);
    covered.add(`${consumer}@${version} × ${item.adapter.projection.id}@${item.adapter.projection.version}`);
  }
  return parsed;
}
const sentences = (items: readonly PresentedEvidenceItem[]): readonly string[] => items.map(presentedSentence);

function redigestReceipt(receipt: PresentationReceipt): PresentationReceipt {
  const items = receipt.items.map(({ componentDigest: _digest, ...body }) => ({ ...body, componentDigest: presentationDigest("presentation.component@1", body) }));
  return { ...receipt, items, digest: presentationDigest("presentation.receipt@1", items) };
}

function run(id: string, startFen = INITIAL): DrillRun {
  return createRun({ id, packId: "p", packDigest: digest, startFen, seed: 1, createdAt: at, policyConfig });
}
function play(start: DrillRun, moves: readonly string[]): DrillRun {
  let current = start;
  for (const move of moves) current = commitMove(current, move, { at }).run;
  return current;
}
const castled = () => play(run("consumer-castle"), ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "e1g1"]);

describe("consumer adapters: position guidance, board sight and the Inspector structure", () => {
  it("D3948 retains wire validators for every consumer-group fact/caption declaration", () => {
    // Inventory construction only: this kit neither mints source evidence nor exercises payloads.
    const specs = consumerAdapterSpecs(inspectorSourcePresentationKit);
    const textSpecs = specs.filter(spec => adapterComponents(spec).some(id => id === "fact_statement" || id === "square_set"));
    expect(textSpecs.length).toBeGreaterThan(0);
    for (const spec of textSpecs) {
      const actual = PRESENTATION_ADAPTERS.find(entry => entry.consumer.id === spec.consumer.id && entry.consumer.version === spec.consumer.version
        && entry.projection.id === spec.projection.id && entry.projection.version === spec.projection.version);
      expect(actual, `${spec.consumer.id} × ${spec.projection.id}`).toBeDefined();
      expect(actual!.validateWireComponent).toBeTypeOf("function");
    }
  });

  it("D3948 rejects a sibling pivotal kind using the same valid renderer and convention", () => {
    const game = castled();
    const evidence = pivotalMarkerEvidenceItems(game, game.activeCursor.branchId).find(item => item.projection.id === "derived.pivotal.irreversibility");
    expect(evidence).toBeDefined();
    const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 2 }, [evidence!])));
    expect(wire.items).toHaveLength(1);
    const items = wire.items.map(item => ({ ...item, component: { id: "fact_statement" as const,
      operand: factStatementOperand("consumer.pivotal_marker@1", "declared_convention", "board-rules@1", { kind: "option_collapse", color: "black", priorCount: 12, count: 2, nextCount: 1 }) } }));
    expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/source|kind/u);
  });

  it.each(["renderer", "binding", "convention", "kind"] as const)("D3948 binds structural fact and nested board caption %s to their declared source", field => {
    const evidence = declareStructuralReadingEvidence({ fen: IQP }).find(item => item.projection.id === "rules.structural.reading.king_zone");
    expect(evidence).toBeDefined();
    for (const consumer of ["board.selected_square_sight"]) {
      const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref(consumer), [evidence!])));
      expect(wire.items).toHaveLength(1);
      expect(() => parsePresentationReceipt(wire)).not.toThrow();
      const items = wire.items.map(item => {
        const original = item.component.id === "square_set" ? item.component.operand.caption : item.component.id === "fact_statement" ? item.component.operand : undefined;
        if (original?.rendererId !== "consumer.structural_squares@1") throw new Error("Expected actual structural statement/caption");
        const operand = field === "renderer"
          ? factStatementOperand("play.castling_rights@1", "declared_convention", "board-rules@1", { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } })
          : factStatementOperand("consumer.structural_squares@1", field === "binding" ? "recorded_run" : "declared_convention",
            field === "convention" ? "pawn-structure@1" : "board-rules@1", { ...original.operands, kind: field === "kind" ? "open_file" : original.operands.kind });
        const component = item.component.id === "square_set"
          ? { ...item.component, operand: { ...item.component.operand, caption: operand } }
          : { id: "fact_statement" as const, operand };
        return { ...item, component };
      });
      expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items })), consumer).toThrow(/registered|source|fact/u);
    }
  });

  it.each(["renderer", "binding", "convention"] as const)("D3948 binds voiced phase %s to the exact ordinary adapter", field => {
    const game = castled(), node = branchPath(game, game.activeCursor.branchId).at(-1)!;
    const evidence = positionGuidanceEvidence({ run: game, node }).filter(item => item.projection.id === "rules.phase.reading");
    expect(evidence).toHaveLength(1);
    const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("guidance.deterministic"), evidence)));
    expect(wire.items).toHaveLength(1);
    const items = wire.items.map(item => ({ ...item, component: { id: "fact_statement" as const, operand: field === "renderer"
      ? factStatementOperand("play.castling_rights@1", "declared_convention", "board-rules@1", { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } })
      : factStatementOperand("play.phase@1", field === "binding" ? "recorded_run" : "declared_convention", field === "convention" ? "board-rules@1" : "phase-bands@1", { phase: "opening" }) } }));
    expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/registered|source|fact/u);
  });

  it("presents structural readings as one fact's squares, lit on the board and listed in the Inspector", () => {
    const evidence = [...declareStructuralReadingEvidence({ fen: IQP }), ...declareStructuralReadingEvidence({ fen: MAROCZY })];
    const board = present("board.selected_square_sight", evidence.filter((item) => ((item.payload as { readonly squares?: readonly string[] }).squares ?? []).length > 0));
    const detailed = [IQP, MAROCZY].flatMap(fen => [
      ...STRUCTURAL_DETAIL_KINDS.flatMap<DeclaredEvidence<unknown>>(kind => invokeEvidenceValueRoute(`rules.structural.reading.${kind}@2`, { fen })),
      ...invokeEvidenceValueRoute("rules.structural.reading.named_structure@2", { fen }),
    ]);
    const inspector = present("inspector.position_structure", detailed, 2);
    expect(board.length).toBeGreaterThan(3);
    expect(board.every((item) => item.component.id === "square_set")).toBe(true);
    expect(inspector.every((item) => item.component.id === "fact_statement")).toBe(true);
    expect(sentences(inspector)).toContain("The c-file is open: neither side has a pawn on it.");
    expect(sentences(inspector)).toContain("Recognized pawn structure: Maroczy Bind (pawns on c4 and e4).");
    expect(sentences(inspector)).toContain("White has an isolated pawn on the d-file.");
  });

  it("voices phase, pack phase, named structure, endgame type, pivotal markers and authored claims", () => {
    const castle = castled();
    const node = branchPath(castle, castle.activeCursor.branchId).at(-1)!;
    const pack = { id: "fixture", phase: "middlegame" } as never;
    const authored = [{ kind: "annotation", id: "note-1", revealedBy: { kind: "outcome", eventSeq: 3 }, text: "The bishop on c4 eyes f7." }] as never;
    const middle = positionGuidanceEvidence({ run: castle, node, pack, authored });
    const endgameRun = run("consumer-endgame", ROOK_ENDGAME);
    const endgame = positionGuidanceEvidence({ run: endgameRun, node: branchPath(endgameRun, endgameRun.activeCursor.branchId).at(-1)!, pack });
    const maroczyRun = run("consumer-maroczy", MAROCZY);
    const maroczy = positionGuidanceEvidence({ run: maroczyRun, node: branchPath(maroczyRun, maroczyRun.activeCursor.branchId).at(-1)! });
    for (const consumer of ["guidance.deterministic", "guidance.voice", "guidance.voice_story"]) {
      const spoken = sentences([...present(consumer, middle), ...present(consumer, endgame), ...present(consumer, maroczy)]);
      expect(spoken).toContain("Rehearsal focus: Middlegame.");
      expect(spoken).toContain("White castled on this move.");
      expect(spoken).toContain("The pack author wrote: “The bishop on c4 eyes f7.”");
      expect(spoken.some((sentence) => /^Current position: /u.test(sentence))).toBe(true);
      expect(spoken.some((sentence) => / under the declared endgame convention\.$/u.test(sentence))).toBe(true);
      expect(spoken.some((sentence) => /Maroczy Bind/u.test(sentence))).toBe(true);
    }
    present("board.pivotal_marker", pivotalMarkerEvidenceItems(castle, castle.activeCursor.branchId).filter(item => item.payload.kind === "irreversibility" || item.payload.kind === "phase_change"), 2);
    present("board.selected_square_sight", maroczy.filter((item) => ((item.payload as { readonly squares?: readonly string[] }).squares ?? []).length > 0));
  });

  it("presents ordinary current registered-shape evidence using its exact successor adapter", async () => {
    const { ShapeRegistry } = await import("../../../apps/server/src/shape-registry.js");
    const registry = new ShapeRegistry(); await registry.add(registeredShapeFixture(), "community", "coach_one");
    const game = play(run("ordinary-current-shape"), ["g1f3"]);
    const builder = await registry.beginCurrentShapeScan(branchPath(game, game.activeCursor.branchId).map(({ id, fen }) => ({ id, fen })), new AbortController().signal);
    for (;;) {
      const step = registry.advanceCurrentShapeScan(builder);
      if (step.kind === "complete") {
        const evidence = invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: step.scan }) as readonly DeclaredEvidence<unknown>[];
        const items = present("theory.shape_firing", evidence, 2);
        expect(items).toHaveLength(1); expect(presentedSentence(items[0]!)).toContain("Matched authored pattern");
        expect(presentationConsumerClass("theory.shape_firing@2")).toBe("ordinary_presented");
        expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => binding.consumer.id === "theory.shape_firing" && binding.consumer.version === 2).map(binding => binding.projection))
          .toEqual([{ id: "theory.shapes.firing", version: 3 }]);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  });

  it("renders every pivotal-marker arm in learner vocabulary", () => {
    const renderer = CONSUMER_FACT_RENDERERS["consumer.pivotal_marker@1"];
    const arms = [
      { kind: "phase_change", from: "opening", to: "middlegame" },
      { kind: "irreversibility", subkind: "last_of_role", color: "black", role: "queen", queensOff: true },
      { kind: "irreversibility", subkind: "pawn_break", color: "white" },
      { kind: "option_collapse", color: "black", priorCount: 12, count: 2, nextCount: 1 },
      { kind: "human_divergence", model: "Maia 2", shares: [0.4, 0.3, 0.2], band: 1500 },
    ];
    const rendered = arms.map((arm) => renderer.render(renderer.parse(arm, "arm")));
    expect(rendered).toEqual([
      "The game moved from the opening into the middlegame under the declared game-phase convention.",
      "Both queens have left the board.",
      "White created or resolved contact between pawns on this move.",
      "Black's legal moves narrowed on consecutive turns: 12, then 2, then 1.",
      "The human-move model (Maia 2 at 1500 rating) spread its choice here: its top 3 moves took 40%, 30% and 20% of its choices.",
    ]);
    for (const sentence of rendered) for (const pattern of FORBIDDEN) expect(sentence).not.toMatch(pattern);
  });
});

describe("consumer adapters: the Inspector's transitions, Explorer and human-move model", () => {
  it.each(["kind", "direction", "subkind"] as const)("D3948 binds transition %s to the exact declared reading", field => {
    const sources = declareTransitionReadingEvidence(field === "subkind"
      ? { before: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", moveUci: "e4d5", after: "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2" }
      : { before: "7k/8/8/3N4/4q1r1/8/8/K7 w - - 0 1", moveUci: "d5f6", after: "7k/8/5N2/8/4q1r1/8/8/K7 b - - 1 1" });
    const evidence = sources.find(item => item.projection.id.startsWith(field === "subkind" ? "rules.transition.reading.move_irreversibility." : "rules.transition.reading.attacked_squares_changed."));
    expect(evidence).toBeDefined();
    const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("inspector.move_transition"), [evidence!])));
    expect(wire.items).toHaveLength(1);
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement") throw new Error("Expected genuine transition fact");
      const original = item.component.operand;
      if (field === "subkind") {
        if (original.rendererId !== "consumer.irreversibility@1") throw new Error("Expected actual irreversibility");
        return { ...item, component: { id: "fact_statement" as const, operand: factStatementOperand("consumer.irreversibility@1", "declared_convention", "board-rules@1", { subkind: original.operands.subkind === "castled" ? "clock_zeroed" : "castled" }) } };
      }
      if (original.rendererId !== "consumer.transition_count@1") throw new Error("Expected actual transition count");
      return { ...item, component: { id: "fact_statement" as const, operand: factStatementOperand("consumer.transition_count@1", "declared_convention", "piece-geometry@1", {
        ...original.operands, kind: field === "kind" ? "defended_squares_changed" : original.operands.kind,
        direction: field === "direction" ? original.operands.direction === "gained" ? "lost" : "gained" : original.operands.direction,
      }) } };
    });
    expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/source|kind|direction/u);
  });

  it("states move-transition counts and irreversibility without grading", () => {
    const items = present("inspector.move_transition", declareTransitionReadingEvidence({
      before: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      moveUci: "e4d5",
      after: "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2",
    }));
    expect(items.length).toBeGreaterThan(1);
    expect(sentences(items)).toContain("This move was a capture or a pawn move, so the fifty-move count starts again.");
    expect(sentences(items).some((sentence) => /geometric count under the declared piece-geometry convention/u.test(sentence))).toBe(true);
  });

  it("renders Explorer counts from admitted totals, never a pre-computed sharePct (criterion 8)", () => {
    const population = { source: "lichess-explorer", ratings: [1600, 1800], speeds: ["blitz", "rapid"], since: "2023-10", until: "2026-09" };
    const page = {
      nodeId: "n1", committedMoveSan: "Nf3",
      result: { kind: "stats", total: 250, white: 100, draws: 50, black: 100, recency: { kind: "absent" }, population, moves: [
        { san: "e4", uci: "e2e4", playedCount: 150, sharePct: 99.9, white: 60, draws: 30, black: 60 },
        { san: "d4", uci: "d2d4", playedCount: 60, sharePct: 99.9, white: 20, draws: 20, black: 20 },
        { san: "Nf3", uci: "g1f3", playedCount: 20, sharePct: 99.9, white: 10, draws: 0, black: 10 },
      ] },
    };
    const items = present("inspector.corpus", [corpusPageEvidence(page)]);
    expect(items.map((item) => item.component.id)).toEqual(["fact_statement"]);
    expect(sentences(items)[0]).toContain("Nf3 — 20 of 250 games (8.0%). Outcome split withheld below the 100-game per-move floor.");
    expect(sentences(items)[0]).toContain("20 games are outside the listed move rows.");
    expect(() => present("inspector.corpus", [corpusPageEvidence({ ...page, result: { ...page.result, total: 25 } })])).toThrow();
    for (const result of [
      { ...page.result, recency: { kind: "month", lastPlayedMonth: "2026-99" } },
      { ...page.result, population: { ...population, since: "2026-10" } },
      { ...page.result, moves: [...page.result.moves].reverse() },
      { ...page.result, moves: page.result.moves.map((row, index) => index === 1 ? { ...row, uci: "e2e4" } : row) },
    ]) expect(() => present("inspector.corpus", [corpusPageEvidence({ ...page, result })])).toThrow();
    expect(JSON.stringify(serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("inspector.corpus"), [corpusPageEvidence(page)]))))).not.toMatch(/sharePct|99\.9/u);
    const source = readFileSync(new URL("./presentation-contract.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\b\w*(?:Pct|Percent)\??\s*:\s*number/u);
  });

  it("draws the human-move model's policy as a distribution with the model as its convention", () => {
    const page = { nodeId: "n1", engine: { id: "maia", name: "Maia", version: "2", seedHonored: true, eloHonored: true, eloApplied: 1500 }, targetElo: 1500, candidates: [{ moveUci: "e2e4", mass: 0.5, rank: 1 }, { moveUci: "d2d4", mass: 0.3, rank: 2 }] };
    const [item] = present("inspector.human_split", [humanSplitPageEvidence(page)]);
    expect(presentedSentence(item!)).toBe("Move shares (Maia 2, human-model rung 1500; not a player rating): e2–e4 50%, d2–d4 30% and moves the model left unlisted 20%.");
  });

  it.each([
    { targetElo: 1500, identity: { eloHonored: false }, applied: null },
    { targetElo: 1500, identity: {}, applied: null },
    { targetElo: 1500, identity: { eloHonored: true }, applied: null },
    { targetElo: 1500, identity: { eloHonored: false, eloApplied: 1000 }, applied: null },
    { targetElo: 1500, identity: { eloHonored: true, eloApplied: 1000 }, applied: 1000 },
    { targetElo: null, identity: { eloHonored: true, eloApplied: 1800 }, applied: 1800 },
  ])("does not relabel requested or unhonored model bands as recorded ($identity)", ({ targetElo, identity, applied }) => {
    const page = { nodeId: "n1", engine: { id: "maia", name: "Maia", version: "2", seedHonored: true, ...identity }, targetElo, candidates: [{ moveUci: "e2e4", mass: 0.5, rank: 1 }] };
    const [item] = present("inspector.human_split", [humanSplitPageEvidence(page)]);
    expect(item!.component.id).toBe("distribution");
    if (item!.component.id !== "distribution") throw new Error("Expected model distribution");
    expect(item!.component.operand.convention.basis).toEqual({ kind: "human_model", model: { name: "Maia", version: "2" }, band: applied });
    const sentence = presentedSentence(item!);
    expect(sentence).toContain("not a player rating");
    expect(sentence).toContain("e2–e4 50%");
    expect(sentence).not.toContain("1500");
    if (applied !== null) expect(sentence).toContain(`human-model rung ${applied}`);
  });
});

describe("consumer adapters: the evidence-reference sentence and the recorded readings", () => {
  const engine = { kind: "eval", source: "engine_validated", values: { centipawns: 35, perspective: "white", depth: 18, engineId: "stockfish-local", engineName: "Stockfish", engineVersion: "17" } } as const;
  const tablebase = { kind: "tablebase", source: "tablebase_exact", values: { category: "win", pieceCount: 4, dtz: 3 } } as const;

  it.each([
    { kind: "eval", values: { centipawns: 35 } },
    { kind: "wdl", values: { win: 0.2, draw: 0.5, loss: 0.3 } },
    { kind: "bestline", values: { movesUci: ["e2e4", "e7e5"] } },
  ] as const)("D3948 retains the genuine model $kind presentation arm", reading => {
    const packet = { ...reading, source: "human_model_predicted" as const };
    const evidence = invokeEvidenceValueRoute("human.maia.event@1", { packet });
    const items = present("runtime.evidence_ref", [evidence]);
    expect(items).toHaveLength(1);
    expect(items[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: { kind: reading.kind, reader: "model" } } });
    expect(presentedSentence(items[0]!)).toContain("human-move model");
  });

  it("D4020 retains actual model packet admission but refuses unsupported exact-tablebase presentation", () => {
    const packet = { ...tablebase, source: "human_model_predicted" as const };
    const evidence = invokeEvidenceValueRoute("human.maia.event@1", { packet });
    expect(evidence.projection).toEqual({ id: "human.maia.event", version: 1 });
    expect(evidence.payload).toEqual(packet);
    expect(() => presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("runtime.evidence_ref"), [evidence]))).toThrow(/source kind\/reader/u);
  });

  it.each(["kind", "reader"] as const)("D3948 binds an attached engine %s to its exact source", field => {
    const evidence = evidenceReferenceEvidence("engine:source-owner", undefined, new Map([["engine:source-owner", engine]]))
      .filter(item => item.projection.id === "live.stockfish.eval");
    expect(evidence).toHaveLength(1);
    const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("runtime.evidence_ref"), evidence)));
    const operand = factStatementOperand("consumer.attached_reading@1", "declared_convention", "recorded-engine@1", field === "kind"
      ? { kind: "tablebase", category: "win", pieceCount: 4, dtz: 3 }
      : { kind: "eval", reader: "model", score: { kind: "cp", value: 35, perspective: "white" }, bound: {} });
    const items = wire.items.map(item => ({ ...item, component: { id: "fact_statement" as const, operand } }));
    expect(() => parsePresentationReceipt(redigestReceipt({ ...wire, items }))).toThrow(/source|kind|reader/u);
  });

  it("renders the resolution and every attached reading kind in learner vocabulary", () => {
    const packets = [
      engine,
      { kind: "wdl", source: "engine_validated", values: { win: 600, draw: 300, loss: 100, requestedDepth: 12 } },
      { kind: "bestline", source: "engine_validated", values: { movesUci: ["e2e4", "e7e5", "e7e8q"], requestedMovetimeMs: 100 } },
      tablebase,
      { kind: "wdl", source: "human_model_predicted", values: { win: 0.2, draw: 0.5, loss: 0.3 } },
    ] as const;
    const spoken = packets.flatMap((packet, index) => sentences(present("runtime.evidence_ref", evidenceReferenceEvidence(`${packet.kind === "tablebase" ? "tablebase" : "engine"}:job-${index}`, undefined, new Map([[`${packet.kind === "tablebase" ? "tablebase" : "engine"}:job-${index}`, packet as never]])))));
    expect(spoken).toContain("Attached engine evaluation: +0.35 pawns from White's side (Stockfish 17, depth 18; a bounded search reading, not a proof).");
    expect(spoken).toContain("Attached engine win/draw/loss reading: win 60%, draw 30%, loss 10% (perspective not recorded; engine, requested depth 12).");
    expect(spoken).toContain("Attached engine line in board coordinates: e2–e4, e7–e5, e7–e8=Q (engine, 100 ms search).");
    expect(spoken).toContain("Attached exact tablebase reading: a win for the side to move (4 pieces, DTZ 3).");
    expect(spoken).toContain("Attached human-move model win/draw/loss reading: win 20%, draw 50%, loss 30% (perspective not recorded; human-move model).");
    expect(spoken).toContain("An engine reading belongs to this reference and is shown with its source.");
    expect(sentences(present("runtime.evidence_ref", evidenceReferenceEvidence("rules:draw-threefold", { checkpoints: [] } as never)))).toEqual(["A draw is available: the same position occurred three times on this line."]);
    expect(sentences(present("runtime.evidence_ref", evidenceReferenceEvidence("engine:pending")))).toEqual(["An engine reading belongs to this reference; its details are still pending."]);
    expect(sentences(present("runtime.evidence_ref", evidenceReferenceEvidence("unregistered-token")))).toEqual(["This reference names a recorded fact with no attached reading."]);
    expect(sentences(present("runtime.evidence_ref", evidenceReferenceEvidence("rules:structure-outpost", { checkpoints: [] } as never)))[0]).not.toMatch(/Tabiya|detector/u);
  });

  it("presents the source-bound citation through the exact citation parser (kit.citation)", () => {
    const resolution = invokeEvidenceValueRoute("run.record.evidence_ref_resolution@1", { reference: "tablebase:probe-1", payloads: new Map([["tablebase:probe-1", tablebase]]) });
    const source = invokeEvidenceValueRoute("live.syzygy.result@1", { packet: tablebase });
    const cited = invokeEvidenceValueRoute("derived.citation.attribution@1", { resolution, source, sourceMetadata: { kind: "remote_endpoint", endpointId: "lichess_tablebase" } }) as { readonly kind: string; readonly value: DeclaredEvidence<unknown> };
    expect(cited.kind).toBe("available");
    const [item] = present("runtime.evidence_ref", [cited.value]);
    expect(item!.component.id).toBe("citation");
    expect(presentedSentence(item!)).toMatch(/^“Exact tablebase evidence recorded: category win for the side to move; 4 pieces; DTZ 3\.” — /u);
  });

  it("delivers recorded engine and tablebase readings as a magnitude and a fact", () => {
    const readings = [
      recordedReadingEvidence({ kind: "engine_eval", anchor: { fen: INITIAL }, sourceId: "sf", retrievedAt: "2026-01-01T00:00:00Z", grounds: "machine_validation", values: { centipawns: 20, depth: 20, multiPv: 1, perspective: "white", engineId: "sf", engineName: "Stockfish", engineVersion: "17" }, supports: [] } as never),
      recordedReadingEvidence({ kind: "tablebase_result", anchor: { fen: "8/8/8/8/8/8/8/K6k w - - 0 1" }, sourceId: "syzygy", retrievedAt: "2026-08-15T12:00:00.000Z", grounds: "machine_validation", values: { category: "draw", dtz: null, precise_dtz: null, dtm: null, pieceCount: 2, checkmate: false, stalemate: false, insufficient_material: true }, supports: [] } as never),
    ].filter((item): item is NonNullable<typeof item> => item !== undefined);
    expect(readings).toHaveLength(2);
    const presented = present("guidance.recorded_reading", readings);
    expect(sentences(presented)).toEqual([
      "Recorded engine evaluation at this position: +0.20 pawns from White's side (Stockfish 17, depth 20; recorded when this pack was authored on 2026-01-01).",
      "Recorded Syzygy tablebase reading for this position (2 pieces): a draw for the side to move; queried when this pack was authored on 2026-08-15.",
    ]);
    const engine = presented[0]!.component;
    if (engine.id !== "magnitude") throw new Error("recorded engine reading must remain a magnitude");
    expect(() => parseComponentValue({ ...engine, operand: { ...engine.operand, retrievedAt: undefined } })).toThrow(/authoring timestamp/u);
    expect(() => parseComponentValue({ ...engine, operand: { ...engine.operand, retrievedAt: "2026-02-30T00:00:00Z" } })).toThrow(/valid UTC authoring timestamp/u);
    expect(() => assertPresentationSourceRetention(readings[0]!, [{ ...engine, operand: { ...engine.operand, retrievedAt: "2026-01-01T00:00:01Z" } }])).toThrow(/source authoring timestamp/u);
    expect(() => assertPresentationSourceRetention(readings[0]!, [engine])).not.toThrow();
  });
});

describe("consumer adapters: Story and comparison voices", () => {
  it("re-voices the Story's typed evidence as sentences", () => {
    const start = createRun({ id: "consumer-story", session: { kind: "imported", start: { fen: INITIAL, side: "white" }, movetextDigest: digest, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig, seed: 1, createdAt: at });
    let story = commitMove(commitMove(start, "e2e4", { actor: "user", at }).run, "e7e5", { actor: "system", at }).run;
    const path = [...story.nodes].sort((left, right) => left.ply - right.ply);
    story = attachDelivery(story, path[0]!.id, evaluationDelivery(path[0]!.fen, "cp 0"));
    story = attachDelivery(story, path[1]!.id, evaluationDelivery(path[1]!.fen, "cp -25"));
    story = attachDelivery(story, path[2]!.id, evaluationDelivery(path[2]!.fen, "mate 3"));
    const projection = storyMomentsForRun(story, story.activeCursor.branchId, { recordedResult: "0-1" });
    const spoken = sentences(present("guidance.voice_story", storyDeclaredEvidence(projection)));
    expect(spoken.length).toBeGreaterThan(1);
    expect(spoken.some((sentence) => /^Recorded engine evaluation (changed by|went from)/u.test(sentence))).toBe(true);
  });

  it("voices and strips a recorded comparison", () => {
    let current = run("consumer-compare", "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1");
    const root = current.activeCursor.nodeId;
    current = play(current, ["e1g1", "e8c8", "c4e6"]);
    const main = current.activeCursor.branchId;
    current = rewind(current, root, at).run;
    current = fork(current, root, { at }).run;
    current = play(current, ["a2a3", "e8g8"]);
    const comparison = compareBranches(current, [main, current.activeCursor.branchId]);
    const narrative = comparisonNarrative(current, comparison);
    const spoken = sentences(present("guidance.voice_compare", narrative.evidence));
    expect(spoken.length).toBeGreaterThan(0);
    const strip = comparison.columns.flatMap((column) => {
      const input = { run: current, comparison, branchId: column.branchId };
      const unwrap = (items: readonly unknown[]) => items.map((item) => ((item as { readonly evidence?: DeclaredEvidence<unknown> }).evidence ?? item) as DeclaredEvidence<unknown>);
      return [
        ...unwrap(invokeEvidenceValueRoute("derived.compare.structure_delta@1", input)),
        ...unwrap(invokeEvidenceValueRoute("derived.compare.piece_route@1", input)),
        ...pivotalMarkerEvidenceItems(current, column.branchId),
      ];
    });
    expect(present("compare.structure_strip", strip).length).toBeGreaterThan(0);
  });
});

describe("consumer adapters: author/operator structured documents (criterion 14)", () => {
  it("presents sourcing-ledger records as schema-coupled read-only documents", () => {
    const records = [
      { kind: "engine_eval", anchor: { fen: INITIAL }, sourceId: "sf", retrievedAt: "2026-01-01T00:00:00Z", grounds: "machine_validation", values: { centipawns: 20, depth: 20, multiPv: 1, perspective: "white", engineId: "sf", engineName: "Stockfish", engineVersion: "17" }, supports: [] },
      { kind: "tablebase_result", anchor: { fen: "8/8/8/8/8/8/8/K6k w - - 0 1" }, sourceId: "syzygy", retrievedAt: "2026-08-15T12:00:00.000Z", grounds: "machine_validation", values: { category: "draw", dtz: null, preciseDtz: null, dtm: null, pieceCount: 2, checkmate: false, stalemate: false, insufficientMaterial: true }, supports: [] },
    ];
    const evidence = records.map((record) => sourcingRecordEvidence(record as never)).filter((item): item is NonNullable<typeof item> => item !== undefined);
    const items = present("authoring.claim_binding", evidence);
    expect(items.map((item) => item.component.id)).toEqual(["structured_document", "structured_document"]);
    expect(sentences(items)).toEqual(["Offline engine evaluation record: a read-only record with 4 fields.", "Offline tablebase result record: a read-only record with 4 fields."]);
  });

  it("constructs structured_document only for author/operator consumers, and never for a learner-reachable one", () => {
    const rolesOf = (consumer: string) => PRIMARY_EVIDENCE_MANIFEST.consumers.find((candidate) => `${candidate.id}@${candidate.version}` === consumer)!.roles;
    const structured = PRESENTATION_ADAPTERS.filter((entry) => adapterComponents(entry).includes("structured_document"));
    expect(structured.length).toBeGreaterThan(0);
    for (const entry of structured) {
      const consumer = `${entry.consumer.id}@${entry.consumer.version}`;
      expect(rolesOf(consumer).every((role) => role === "author" || role === "operator"), consumer).toBe(true);
      expect(presentationConsumerClass(consumer), consumer).toBe("author_operator_presented");
    }
    for (const entry of PRESENTATION_ADAPTERS) {
      const consumer = `${entry.consumer.id}@${entry.consumer.version}`;
      const learnerReachable = rolesOf(consumer).includes("learner") || presentationConsumerClass(consumer) === "ordinary_presented" || presentationConsumerClass(consumer) === "module_presented";
      if (learnerReachable) expect(adapterComponents(entry), entry.key).not.toContain("structured_document");
    }
    for (const schema of Object.values(STRUCTURED_DOCUMENT_SCHEMAS)) expect(schema.roles.every((role) => role === "author" || role === "operator")).toBe(true);
    // Every presented item minted above for a learner-reachable consumer is a non-document component.
    for (const pair of covered) {
      const consumer = pair.split(" × ")[0]!;
      if (rolesOf(consumer).includes("learner")) expect(structured.some((entry) => `${entry.consumer.id}@${entry.consumer.version} × ${entry.projection.id}@${entry.projection.version}` === pair), pair).toBe(false);
    }
  });

  it("classifies each non-module consumer version and every module consumer exactly once", () => {
    const consumers = PRESENTATION_CONSUMER_CLASSES.map((row) => row.consumer);
    expect(new Set(consumers).size).toBe(consumers.length);
    const nonModule = PRESENTATION_CONSUMER_CLASSES.filter((row) => !row.consumer.startsWith("module."));
    // Exact Maia and registered-shape successors coexist with all original twenty-three
    // non-module consumer obligations and their truthful historical receipts.
    expect(nonModule).toHaveLength(26);
    expect(nonModule.filter(row => row.consumer !== "inspector.human_split@2" && row.consumer !== "theory.shape_firing@2" && row.consumer !== "review.recorded_clock@1")).toHaveLength(23);
    expect(nonModule.find(row => row.consumer === "review.recorded_clock@1")).toEqual({
      consumer: "review.recorded_clock@1", class: "ordinary_presented",
      reachabilityAnchor: "packages/runtime/src/recorded-clock-review.ts", operation: "consumeRecordedClockEvidence",
    });
    expect(nonModule.find(row => row.consumer === "inspector.human_split@2")).toEqual({
      consumer: "inspector.human_split@2", class: "inspector_presented",
      reachabilityAnchor: "apps/server/src/inspector-maia.ts", operation: "consumeMaiaNodeDistribution",
    });
    expect(presentationConsumerClass("inspector.human_split@1")).toBe("inspector_presented");
    expect(presentationConsumerClass("inspector.human_split@2")).toBe("inspector_presented");
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => binding.consumer.id === "inspector.human_split"
      && binding.consumer.version === 2).map(binding => binding.projection)).toEqual([{ id: "derived.maia.node_distribution", version: 1 }]);
    expect(presentationConsumerClass("inspector.corpus@2")).toBe("inspector_presented");
    expect(presentationConsumerClass("runtime.branch_decidedness@1")).toBe("non_presentational_operation");
    expect(presentationConsumerClass("runtime.queued_tablebase@1")).toBe("non_presentational_operation");
    expect(presentationConsumerClass("module.full_inspector@2")).toBe("inspector_presented");
    expect(presentationConsumerClass("module.full_inspector@1")).toBeUndefined();
    expect(presentationConsumerClass("module.review_map@2")).toBe("module_presented");
  });

  it("reports the minted-pair coverage of this suite", () => {
    const presented = PRESENTATION_ADAPTERS.filter((entry) => {
      const cls = presentationConsumerClass(`${entry.consumer.id}@${entry.consumer.version}`);
      return !entry.consumer.id.startsWith("module.")
        && (cls === "ordinary_presented" || cls === "inspector_presented" || cls === "author_operator_presented");
    });
    const declaredPairs = new Set(presented.map(entry => `${entry.consumer.id}@${entry.consumer.version} × ${entry.projection.id}@${entry.projection.version}`));
    // This suite's actual sources only: never merge another suite or silently drop a foreign
    // covered key by filtering the numerator against the declared population itself.
    const mintedPairs = [...covered].filter(pair => !pair.startsWith("module."));
    for (const pair of mintedPairs) expect(declaredPairs.has(pair), pair).toBe(true);
    process.stderr.write(`consumer adapters minted from real evidence in this suite: ${mintedPairs.length} of ${declaredPairs.size} presented non-module pairs\n`);
    expect(mintedPairs.length).toBeGreaterThan(60);
  });
});
