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
import {
  PRESENTATION_ADAPTERS,
  adapterComponents,
  assertPresentationText,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentedSentence,
  serializePresentedEvidence,
  type PresentedEvidenceItem,
} from "./presentation-contract.js";
import { CONSUMER_FACT_RENDERERS, PRESENTATION_CONSUMER_CLASSES, STRUCTURED_DOCUMENT_SCHEMAS, presentationConsumerClass } from "./presentation-consumer-adapters.js";
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
function present(consumer: string, evidence: readonly DeclaredEvidence<unknown>[]): readonly PresentedEvidenceItem[] {
  const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref(consumer), evidence));
  const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
  expect(parsed.map(presentedSentence)).toEqual(items.map(presentedSentence));
  for (const item of parsed) {
    const sentence = presentedSentence(item);
    expect(assertPresentationText(sentence)).toBe(sentence);
    for (const pattern of FORBIDDEN) expect(sentence, `${consumer} × ${item.adapter.projection.id}: ${sentence}`).not.toMatch(pattern);
    // The citation's registered revision label is the one versioned token a learner sees (reported upstream).
    if (item.component.id !== "citation") expect(sentence, sentence).not.toMatch(VERSION_TOKEN);
    covered.add(`${consumer}@1 × ${item.adapter.projection.id}@${item.adapter.projection.version}`);
  }
  return parsed;
}
const sentences = (items: readonly PresentedEvidenceItem[]): readonly string[] => items.map(presentedSentence);

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
  it("presents structural readings as one fact's squares, lit on the board and listed in the Inspector", () => {
    const evidence = [...declareStructuralReadingEvidence({ fen: IQP }), ...declareStructuralReadingEvidence({ fen: MAROCZY })];
    const board = present("board.selected_square_sight", evidence.filter((item) => ((item.payload as { readonly squares?: readonly string[] }).squares ?? []).length > 0));
    const inspector = present("inspector.position_structure", evidence);
    expect(board.length).toBeGreaterThan(3);
    expect(board.every((item) => item.component.id === "square_set")).toBe(true);
    expect(inspector.every((item) => item.component.id === "fact_statement")).toBe(true);
    expect(sentences(inspector)).toContain("Position reading: open file.");
    expect(sentences(inspector)).toContain("The pawn structure matches the Maroczy Bind in the declared structure catalogue (pawns on c4 and e4).");
    expect(sentences(inspector)).toContain("Position reading: isolated pawn.");
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
      expect(spoken).toContain("The pack author places this drill in the middlegame.");
      expect(spoken).toContain("White castled on this move.");
      expect(spoken).toContain("The pack author wrote: “The bishop on c4 eyes f7.”");
      expect(spoken.some((sentence) => /^Game phase under the declared convention: /u.test(sentence))).toBe(true);
      expect(spoken.some((sentence) => / under the declared endgame convention\.$/u.test(sentence))).toBe(true);
      expect(spoken.some((sentence) => /Maroczy Bind/u.test(sentence))).toBe(true);
    }
    present("board.pivotal_marker", pivotalMarkerEvidenceItems(castle, castle.activeCursor.branchId));
    present("board.selected_square_sight", maroczy.filter((item) => ((item.payload as { readonly squares?: readonly string[] }).squares ?? []).length > 0));
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

  it("draws the Explorer population from playedCount / total — 2 of 25, never a pre-computed sharePct (criterion 8)", () => {
    const population = { source: "lichess-explorer", ratings: [1600, 1800], speeds: ["blitz", "rapid"], since: "2023-10", until: "2026-09" };
    const page = {
      nodeId: "n1", committedMoveSan: "Nf3",
      result: { kind: "stats", total: 25, white: 10, draws: 5, black: 10, recency: { kind: "absent" }, population, moves: [
        { san: "e4", uci: "e2e4", playedCount: 15, sharePct: 99.9, white: 6, draws: 3, black: 6 },
        { san: "d4", uci: "d2d4", playedCount: 6, sharePct: 99.9, white: 2, draws: 2, black: 2 },
        { san: "Nf3", uci: "g1f3", playedCount: 2, sharePct: 99.9, white: 1, draws: 0, black: 1 },
      ] },
    };
    const items = present("inspector.corpus", [corpusPageEvidence(page)]);
    expect(items.map((item) => item.component.id)).toEqual(["distribution", "outcome_split", "count_with_denominator"]);
    expect(sentences(items)[2]).toBe("2 of 25 games in this population (8%).");
    expect(sentences(items)[0]).toMatch(/e4 60%, d4 24%, Nf3 8% and other moves 8%\. Nf3 is the move you played\.$/u);
    expect(sentences(items)[1]).toBe("25 games recorded here — below the 100-game floor. No frequencies are shown.");
    expect(JSON.stringify(serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("inspector.corpus"), [corpusPageEvidence(page)]))))).not.toMatch(/sharePct|99\.9/u);
    const source = readFileSync(new URL("./presentation-contract.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\b\w*(?:Pct|Percent)\??\s*:\s*number/u);
  });

  it("draws the human-move model's policy as a distribution with the model as its convention", () => {
    const page = { nodeId: "n1", engine: { id: "maia", name: "Maia", version: "2", seedHonored: true }, targetElo: 1500, candidates: [{ moveUci: "e2e4", mass: 0.5, rank: 1 }, { moveUci: "d2d4", mass: 0.3, rank: 2 }] };
    const [item] = present("inspector.human_split", [humanSplitPageEvidence(page)]);
    expect(presentedSentence(item!)).toBe("Move shares (Maia 2 at 1500 rating): e2–e4 50%, d2–d4 30% and moves the model left unlisted 20%.");
  });
});

describe("consumer adapters: the evidence-reference sentence and the recorded readings", () => {
  const engine = { kind: "eval", source: "engine_validated", values: { centipawns: 35, perspective: "white", depth: 18, engineId: "stockfish-local", engineName: "Stockfish", engineVersion: "17" } } as const;
  const tablebase = { kind: "tablebase", source: "tablebase_exact", values: { category: "win", pieceCount: 4, dtz: 3 } } as const;

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
    expect(sentences(present("guidance.recorded_reading", readings))).toEqual([
      "Recorded engine evaluation at this position: +0.20 from White's side (Stockfish 17, depth 20).",
      "Recorded Syzygy tablebase reading for this position (2 pieces): a draw for the side to move; queried when this pack was authored on 2026-08-15.",
    ]);
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

  it("classifies the twenty non-module consumers and every module consumer exactly once", () => {
    const consumers = PRESENTATION_CONSUMER_CLASSES.map((row) => row.consumer);
    expect(new Set(consumers).size).toBe(consumers.length);
    expect(PRESENTATION_CONSUMER_CLASSES.filter((row) => !row.consumer.startsWith("module.")).length).toBe(20);
    expect(presentationConsumerClass("module.full_inspector@1")).toBe("inspector_presented");
    expect(presentationConsumerClass("module.review_map@1")).toBe("module_presented");
  });

  it("reports the minted-pair coverage of this suite", () => {
    const presented = PRESENTATION_ADAPTERS.filter((entry) => { const cls = presentationConsumerClass(`${entry.consumer.id}@${entry.consumer.version}`); return cls === "ordinary_presented" || cls === "inspector_presented" || cls === "author_operator_presented"; });
    process.stderr.write(`consumer adapters minted from real evidence: ${covered.size} of ${presented.length} presented non-module pairs\n`);
    expect(covered.size).toBeGreaterThan(60);
  });
});
