// D3948: original source factories → admitted Play adapters → strict received receipts.
import { registeredShapeFixture, registeredShapePointFixture } from "./testing/registered-shape-fixture.js";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { makeSquare, parseSquare, parseUci } from "chessops/util";
import type { Color, Role, SquareName } from "chessops/types";
import { canonicalFen, positionFromFen } from "./chess.js";
import { admitInstalledOpeningCatalogue } from "./opening-catalogue.js";
import { MODULE_CURRENT_IMAGE, PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { declareStructuralReadingEvidence } from "./reading-evidence.js";
import { compileHintDisclosureV2 } from "./hint-distance.js";
import { HINT_FAMILIES, HINT_RUNGS, hintDeclarationRow } from "./hint-registry.js";
import type { HintDisclosurePayload } from "./hint-horizon.js";
import { HINT_FAMILY_POSITIVES, HINT_FOLLOWUP, selectFixture } from "./testing/hint-fixture.js";
import { importedRun, play } from "./testing/review-evidence-fixture.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import { recordedComparisonPointFixture } from "./testing/recorded-comparison-point-fixture.js";
import { recordedComparisonEvalFixture } from "./testing/recorded-comparison-eval-fixture.js";
import { collectComparisonStructuralPopulation } from "./comparison-structural-population.js";
import { reachCheckpoint, fork, rewind } from "./runtime.js";
import { transitionObjective } from "./objective.js";
import { compareBranches } from "./compare.js";
import { createRecordedComparisonSource } from "./recorded-comparison.js";
import { PLAY_FACT_RENDERERS, playAdapterSpecs } from "./presentation-play-adapters.js";
import { inspectorSourcePresentationKit } from "./testing/inspector-source-presentation-kit.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";
import { INSPECTOR_FIXTURE_FENS } from "./testing/inspector-presentation-fixture.js";
import { deriveExplorerPopulationSummary, providerSourceEvidence } from "./evidence-operations.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "./provider-exchange.js";
import { normalizeProviderRequest } from "./provider-requests.js";
import { FIXTURE_AT, explorerBody, explorerRequest, httpCapture } from "./provider-test-fixtures.js";
import { PRESENTATION_ADAPTERS, factStatementOperand, parsePresentationReceipt, presentEvidenceItems, presentedSentence,
  presentationDigest, serializePresentedEvidence, type PresentationReceipt, type RelationOverlayOperand } from "./presentation-contract.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const LUCENA = "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1";

describe("D4038 exact legal-move caption footprint", () => {
  const consumers = [{ id: "module.sight_on_request", version: 1 }, { id: "module.full_inspector", version: 2 }] as const;
  const route = "rules.mobility.reading.legal_moves@1" as const;
  function actual(consumer: typeof consumers[number], black = false, terminal = false) {
    const fen = terminal ? "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1" : INITIAL;
    const evidence = invokeEvidenceValueRoute(route, { fen: black ? mirrorSemanticFen(fen, "color_and_vertical") : fen });
    const before = JSON.stringify(evidence);
    const reading = evidence.payload;
    const movable = reading.pieces.filter(entry => entry.moves.length > 0);
    const squares = [...new Set(movable.map(entry => entry.piece.square))];
    const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, [evidence])));
    expect(JSON.stringify(evidence)).toBe(before);
    return { wire, squares, reading, movable };
  }
  for (const consumer of consumers) for (const black of [false, true]) {
    const label = `${consumer.id}, black=${black}`;
    it(`retains real source coordinates, counts, text and excluded immobile pieces: ${label}`, () => {
      const { wire, squares, reading, movable } = actual(consumer, black);
      expect(movable.length).toBeLessThan(reading.pieces.length);
      expect(squares.length).toBeGreaterThan(0);
      const parsed = parsePresentationReceipt(wire);
      const board = parsed.find(item => item.component.id === "square_set")!.component;
      if (board.id !== "square_set" || board.operand.caption.rendererId !== "play.legal_moves@1") throw new Error("Expected real legal-move caption");
      expect(board.operand.squares).toEqual(squares);
      expect(board.operand.caption.operands).toEqual({ turn: reading.turn, pieces: movable.length,
        moves: movable.reduce((sum, entry) => sum + entry.moves.length, 0), squares });
      expect(board.operand.caption.renderedText).toBe(`${black ? "Black" : "White"} has 20 legal moves spread over 10 pieces.`);
      expect(board.operand.brush).toBe("blue");
      const reversed = wire.items.map(item => item.component.id === "square_set" ? { ...item, component: { ...item.component,
        operand: { ...item.component.operand, squares: [...item.component.operand.squares].reverse() } } } : item);
      expect(() => parsePresentationReceipt(redigest({ ...wire, items: reversed }))).not.toThrow();
    });
    for (const field of ["squares", "brush", "owner"] as const) it(`refuses isolated re-digested ${field}: ${label}`, () => {
      const { wire } = actual(consumer, black);
      const items = wire.items.map(item => {
        if (item.component.id !== "square_set") return item;
        const original = item.component.operand;
        const operand = field === "squares" ? { ...original, squares: ["d4" as const] }
          : field === "brush" ? { ...original, brush: "red" as const }
            : { ...original, owner: { factRef: `sha256:${"0".repeat(64)}` } };
        return { ...item, component: { ...item.component, operand } };
      });
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow();
    });
    for (const field of ["missing", "malformed", "duplicate", "extra", "count"] as const) {
      const invalid = (operands: Readonly<Record<string, unknown>>) => {
        const full = { ...operands, squares: actual(consumer, black).squares };
        if (field === "missing") { const { squares: _squares, ...rest } = full; return rest; }
        if (field === "malformed") return { ...full, squares: ["z9"] };
        if (field === "duplicate") return { ...full, squares: [...full.squares, full.squares[0]] };
        if (field === "extra") return { ...full, squareGuess: "a1" };
        return { ...full, pieces: Number(operands.pieces) + 1 };
      };
      it(`refuses ${field} coordinates at process construction: ${label}`, () => {
        const original = actual(consumer, black).wire.items.find(item => item.component.id === "square_set")!.component;
        if (original.id !== "square_set") throw new Error("Expected original legal board");
        const fact = original.operand.caption;
        if (fact.rendererId !== "play.legal_moves@1") throw new Error("Expected original legal caption");
        expect(() => factStatementOperand("play.legal_moves@1", fact.binding, fact.convention, invalid(fact.operands) as never)).toThrow();
      });
      it(`refuses ${field} coordinates at independent raw receipt input: ${label}`, () => {
        const { wire } = actual(consumer, black);
        const items = wire.items.map(item => {
          const original = item.component.id === "square_set" ? item.component.operand.caption
            : item.component.id === "fact_statement" ? item.component.operand : null;
          if (original?.rendererId !== "play.legal_moves@1") return item;
          const operands = invalid(original.operands);
          // Deliberately no checked fact constructor: exercise the actual received parser.
          const changed = { ...original, operands, sourceDigest: presentationDigest("presentation.fact.operands@1", operands),
            ...(field === "count" ? { renderedText: `${black ? "Black" : "White"} has 20 legal moves spread over 11 pieces.` } : {}) };
          return { ...item, component: item.component.id === "square_set"
            ? { ...item.component, operand: { ...item.component.operand, caption: changed } }
            : { id: "fact_statement" as const, operand: changed } };
        });
        expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow();
      });
    }
  }
  it.each([false, true])("keeps Full2's actual terminal count sentence with no board, black=%s", black => {
    const { wire, squares } = actual(consumers[1], black, true);
    expect(squares).toEqual([]);
    const parsed = parsePresentationReceipt(wire);
    expect(parsed.map(item => item.component.id)).toEqual(["fact_statement"]);
    expect(parsed[0]!.component).toMatchObject({ id: "fact_statement", operand: { rendererId: "play.legal_moves@1",
      operands: { squares: [], pieces: 0, moves: 0 } } });
    expect(presentedSentence(parsed[0]!)).toBe(`${black ? "White" : "Black"} has 0 legal moves spread over 0 pieces.`);
  });
  for (const black of [false, true]) {
    it(`refuses a move with zero movable pieces at process construction, black=${black}`, () => {
      const { wire } = actual(consumers[1], black, true);
      const component = wire.items[0]!.component;
      if (component.id !== "fact_statement" || component.operand.rendererId !== "play.legal_moves@1") throw new Error("Expected genuine terminal statement");
      const fact = component.operand;
      expect(() => factStatementOperand("play.legal_moves@1", fact.binding, fact.convention, { ...fact.operands, moves: 1 })).toThrow(/counts\/squares/u);
    });
    it(`refuses a move with zero movable pieces at raw receipt input, black=${black}`, () => {
      const { wire } = actual(consumers[1], black, true);
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "play.legal_moves@1") throw new Error("Expected genuine terminal statement");
        const original = item.component.operand, operands = { ...original.operands, moves: 1 };
        return { ...item, component: { id: "fact_statement" as const, operand: { ...original, operands,
          sourceDigest: presentationDigest("presentation.fact.operands@1", operands),
          renderedText: `${black ? "White" : "Black"} has 1 legal move spread over 0 pieces.` } } };
      });
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/counts\/squares/u);
    });
  }
});

function source(route: Parameters<typeof invokeEvidenceValueRoute>[0], input: Record<string, unknown>): readonly DeclaredEvidence<unknown>[] {
  const result: unknown = invokeEvidenceValueRoute(route, input);
  const value = typeof result === "object" && result !== null && "kind" in result && result.kind === "available" && "value" in result ? result.value : result;
  const items: unknown[] = Array.isArray(value) ? value : [value];
  expect(items.length, route).toBeGreaterThan(0);
  return items.map(item => { assertDeclaredEvidence(item); return item; });
}

function receipt(module: "structure_nudge" | "sight_on_request" | "guided_hint" | "threat_radar" | "blunder_prevention" | "theory_breadcrumb" | "compare_coach", items: readonly DeclaredEvidence<unknown>[]): PresentationReceipt {
  const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, MODULE_CURRENT_IMAGE.find(row => row.moduleId === module)!.consumer, items));
  const wire = serializePresentedEvidence(presented);
  const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(wire)));
  expect(parsed.map(presentedSentence)).toEqual(presented.map(presentedSentence));
  return wire;
}

function redigest<T extends { readonly items: readonly { readonly componentDigest: string }[] }>(wire: T) {
  const items = wire.items.map(({ componentDigest: _digest, ...body }) => ({ ...body, componentDigest: presentationDigest("presentation.component@1", body) }));
  return { ...wire, items, digest: presentationDigest("presentation.receipt@1", items) };
}

describe("D4036 remaining square-caption geometry", () => {
  const noWitnessKinds = ["backward_pawn", "isolated_pawn", "doubled_pawn", "half_open_file", "open_file", "piece_count"];
  const pairs = PRESENTATION_ADAPTERS.filter(row => row.component === "square_set" && (
    row.consumer.id === "board.selected_square_sight" || row.consumer.id === "module.sight_on_request"
    || row.consumer.id === "module.guided_hint" || row.consumer.id === "module.threat_radar"
      && row.projection.id === "rules.tactic.reading.ray_classification"));
  const noWitness = (row: typeof pairs[number]) => noWitnessKinds.some(kind => row.projection.id === `rules.structural.reading.${kind}`);
  const witnessed = pairs.filter(row => !noWitness(row));
  const key = (row: typeof pairs[number]) => `${row.consumer.id}@${row.consumer.version} × ${row.projection.id}@${row.projection.version}`;
  let readings: readonly DeclaredEvidence<unknown>[] | undefined;
  const structural = () => readings ??= [...INSPECTOR_FIXTURE_FENS,
    "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5",
    "4k3/8/8/8/2p5/2P5/1P6/4K3 w - - 0 1",
    "4k3/8/8/8/4N3/3P4/8/4K3 w - - 0 1",
  ].flatMap(fen => declareStructuralReadingEvidence({ fen }));
  const cache = new Map<string, DeclaredEvidence<unknown>>();
  function acquire(row: typeof pairs[number]): DeclaredEvidence<unknown> {
    const route = `${row.projection.id}@${row.projection.version}`;
    const cached = cache.get(route);
    if (cached) return cached;
    let result: DeclaredEvidence<unknown> | undefined;
    if (row.projection.id.startsWith("rules.structural.reading.")) {
      result = structural().find(item => item.projection.id === row.projection.id && item.projection.version === row.projection.version
        && (noWitness(row) || (item.payload as { squares: readonly SquareName[] }).squares.length > 0));
    } else if (row.consumer.id === "module.guided_hint") {
      for (const family of HINT_FAMILIES) for (const rung of ["square", "piece", "distance"] as const) {
        const ref = hintDeclarationRow(family).disclosures[rung];
        if (ref.id !== row.projection.id || ref.version !== row.projection.version) continue;
        const fixture = HINT_FAMILY_POSITIVES[family];
        const selected = family === "double_attack" ? selectFixture("4k3/8/8/8/1n6/1B6/8/R3K3 b - - 0 1", ["b4c2"])
          : selectFixture(fixture.fen, fixture.moves);
        if (selected.kind !== "selected" || selected.horizon.payload.family !== family) throw new Error(`Missing actual ${family} horizon`);
        result = compileHintDisclosureV2(selected.horizon, rung);
      }
    } else {
      const original = remainingPlayCases.find(entry => entry.route === route);
      if (!original) throw new Error(`Missing original source input for ${route}`);
      result = source(original.route, original.input)[0];
    }
    if (!result) throw new Error(`No genuine source for ${key(row)}`);
    expect(result.projection).toEqual(row.projection);
    cache.set(route, result);
    return result;
  }
  function sourceSquares(evidence: DeclaredEvidence<unknown>): readonly SquareName[] {
    const id = evidence.projection.id;
    if (id.startsWith("rules.structural.reading.")) return (evidence.payload as { squares: readonly SquareName[] }).squares;
    if (id === "rules.mobility.reading.legal_moves") {
      const value = evidence.payload as { pieces: readonly { piece: { square: SquareName }; moves: readonly unknown[] }[] };
      return value.pieces.filter(piece => piece.moves.length > 0).map(piece => piece.piece.square);
    }
    if (id === "rules.tactic.reading.rook_on_seventh") {
      const value = evidence.payload as { rooks: readonly { rook: { square: SquareName }; enemyKingOnBackRank: { square: SquareName } | null; enemyPawnsOnSeventh: readonly { square: SquareName }[] }[] };
      return value.rooks.flatMap(rook => [rook.rook.square, ...(rook.enemyKingOnBackRank === null ? [] : [rook.enemyKingOnBackRank.square]), ...rook.enemyPawnsOnSeventh.map(pawn => pawn.square)]);
    }
    if (id === "rules.tactic.reading.ray_classification") {
      const value = evidence.payload as { rays: readonly { slider: { square: SquareName }; blocker: { square: SquareName }; target: { square: SquareName } }[] };
      return value.rays.flatMap(ray => [ray.slider.square, ray.blocker.square, ray.target.square]);
    }
    const hint = evidence.payload as HintDisclosurePayload;
    if (hint.rung !== "square" && hint.rung !== "piece" && hint.rung !== "distance") throw new Error("Expected actual square disclosure");
    const values = hint.rung === "square" ? hint.targetSquares : [hint.actor.square, ...hint.targetSquares];
    return values.map(value => {
      const square = parseSquare(value);
      if (square === undefined) throw new Error("Original hint source contains an invalid coordinate");
      return makeSquare(square);
    });
  }
  function actual(row: typeof pairs[number]) {
    const evidence = acquire(row), before = JSON.stringify(evidence);
    const wire = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, row.consumer, [evidence])));
    expect(JSON.stringify(evidence)).toBe(before);
    expect(wire.items.filter(item => item.component.id === "square_set")).toHaveLength(1);
    return { wire, evidence };
  }
  it("counts all58 declared pairs while distinguishing12 current sources with no square witnesses", () => {
    expect(pairs).toHaveLength(58);
    expect(witnessed).toHaveLength(46);
    expect(pairs.filter(noWitness)).toHaveLength(12);
  });
  it.each(pairs.filter(noWitness).map(row => ({ row, name: key(row) })))("does not invent nonempty source geometry: $name", ({ row }) => {
    const evidence = acquire(row);
    expect(sourceSquares(evidence)).toEqual([]);
    expect(() => presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, row.consumer, [evidence]))).toThrow();
  });
  for (const row of witnessed) {
    it(`round-trips original source footprint/brush/owner and equivalent reordered sets: ${key(row)}`, () => {
      const { wire, evidence } = actual(row);
      expect(() => parsePresentationReceipt(wire)).not.toThrow();
      const board = wire.items.find(item => item.component.id === "square_set")!.component;
      if (board.id !== "square_set") throw new Error("Expected original source board");
      expect(board.operand.squares).toEqual([...new Set(sourceSquares(evidence))]);
      expect(board.operand.brush).toBe(row.consumer.id === "module.guided_hint" ? "yellow" : row.consumer.id === "module.threat_radar" ? "red" : "blue");
      expect(board.operand.owner.factRef).toBe(wire.items[0]!.evidenceRef!.evidenceDigest);
      const items = wire.items.map(item => item.component.id === "square_set" ? { ...item, component: { ...item.component,
        operand: { ...item.component.operand, squares: [...item.component.operand.squares].reverse() } } } : item);
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).not.toThrow();
    });
    for (const field of ["squares", "brush", "owner"] as const) it(`refuses isolated re-digested ${field}: ${key(row)}`, () => {
      const { wire } = actual(row);
      const items = wire.items.map(item => {
        if (item.component.id !== "square_set") return item;
        const original = item.component.operand;
        // Retain original caption/sentence siblings and every source ref; no constructor shortcut.
        const operand = field === "squares" ? { ...original, squares: [original.squares.includes("a1") ? "h8" as const : "a1" as const] }
          : field === "brush" ? { ...original, brush: original.brush === "blue" ? "red" as const : "blue" as const }
            : { ...original, owner: { factRef: `sha256:${"0".repeat(64)}` } };
        expect(operand).not.toEqual(original);
        return { ...item, component: { ...item.component, operand } };
      });
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow();
    });
  }
});

const currentShapeRun = play(importedRun("registered-play-shape", "white", INITIAL), ["g1f3"]);
const currentShapePoint = await registeredShapePointFixture([currentShapeRun.nodes.find(node => node.id === currentShapeRun.activeCursor.nodeId)!], [registeredShapeFixture("registered-occupancy")]);
const currentShapeInput = { scan: currentShapePoint.scans.get(currentShapeRun.activeCursor.nodeId)! };

const nudgeCases = [
  { name: "space", route: "rules.structural.reading.space@1", input: { fen: INITIAL } },
  { name: "opening phase", route: "rules.phase.reading@2", input: { fen: INITIAL } },
  { name: "ending phase", route: "rules.phase.reading@2", input: { fen: LUCENA } },
  { name: "endgame material", route: "rules.endgame.classification@1", input: { fen: LUCENA } },
  { name: "setup match", route: "theory.endgame.setup_match@1", input: { fen: LUCENA, convention: { id: "lucena-setup", version: 1 } } },
  { name: "authored shape trigger", route: "theory.shapes.firing@3", input: currentShapeInput },
  { name: "unclear phase", route: "rules.phase.reading@2", input: { fen: "4k3/8/8/8/8/8/8/RN1QK3 w - - 0 1" } },
  { name: "unclassified endgame material", route: "rules.endgame.classification@1", input: { fen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1" } },
] as const;

describe("D3948 Structure Nudge remaining source pairs", () => {
  it("preserves actual unclear phase and null material classification as legitimate source variants", () => {
    const unclear = source(nudgeCases[6].route, nudgeCases[6].input);
    expect(unclear[0]!.payload).toMatchObject({ phase: "unclear" });
    expect(parsePresentationReceipt(receipt("structure_nudge", unclear))[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: { phase: "unclear" } } });
    const unclassified = source(nudgeCases[7].route, nudgeCases[7].input);
    expect(unclassified[0]!.payload).toMatchObject({ type: null });
    expect(parsePresentationReceipt(receipt("structure_nudge", unclassified))[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: { label: null } } });
  });
  it.each(["setup", "shape"] as const)("retains the registered %s name relationship after re-digesting", kind => {
    const testCase = nudgeCases[kind === "setup" ? 4 : 5];
    const wire = receipt("structure_nudge", source(testCase.route, testCase.input));
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement") throw new Error("Expected actual Nudge fact");
      const original = item.component.operand;
      const operand = original.rendererId === "play.endgame_setup@1"
        ? factStatementOperand("play.endgame_setup@1", original.binding, original.convention, { ...original.operands, name: "Philidor position" })
        : original.rendererId === "inspector.registered_shape_firing@2"
          ? factStatementOperand("inspector.registered_shape_firing@2", original.binding, original.convention, { ...original.operands, authority: { ...original.operands.authority, name: "Lucena position" } })
          : (() => { throw new Error("Expected setup or shape source"); })();
      return { ...item, component: { id: "fact_statement" as const, operand } };
    });
    expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/name|title|digest|operand|source/u);
  });
  it.each(nudgeCases)("round-trips the original $name source", ({ route, input }) => {
    const items = source(route, input);
    const before = JSON.stringify(items.map(item => item.payload));
    expect(receipt("structure_nudge", items).items.length).toBeGreaterThan(0);
    expect(JSON.stringify(items.map(item => item.payload))).toBe(before);
  });

  for (const field of ["renderer", "binding", "convention"] as const) {
    it.each(nudgeCases)(`refuses re-digested ${field} substitution for $name`, ({ route, input }) => {
      const wire = receipt("structure_nudge", source(route, input));
      const items = wire.items.map(item => {
        if (item.component.id !== "fact_statement") throw new Error("Expected actual Nudge statement");
        const original = item.component.operand;
        const operand = field === "renderer" ? factStatementOperand("play.castling_rights@1", "declared_convention", "board-rules@1", {
          white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false },
        }) : factStatementOperand(original.rendererId, field === "binding" ? "recorded_run" : original.binding,
          field === "convention" ? "recorded-run@1" : original.convention, original.operands);
        return { ...item, component: { id: "fact_statement" as const, operand } };
      });
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
    });
  }
});

const remainingPlayCases = [
  { module: "sight_on_request", route: "rules.castling.reading.rights@1", input: { fen: INITIAL } },
  { module: "sight_on_request", route: "rules.castling.reading.legality@1", input: { fen: INITIAL } },
  { module: "sight_on_request", route: "rules.tactic.reading.rook_on_seventh@1", input: { fen: "4k3/3R1p2/8/8/8/8/8/4K3 w - - 0 1" } },
  { module: "sight_on_request", route: "rules.mobility.reading.legal_moves@1", input: { fen: INITIAL } },
  { module: "sight_on_request", route: "rules.pawn.reading.contacts@1", input: { fen: "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1" } },
  { module: "sight_on_request", route: "rules.square.reading.control@1", input: { fen: INITIAL } },
  ...(["threat_radar", "blunder_prevention"] as const).flatMap(module => [
    { module, route: "rules.tactic.consequence.threat@1", input: { fen: "q3k3/8/8/8/8/8/8/R3K3 w - - 0 1" } },
    { module, route: "rules.tactic.consequence.mate_in_one@1", input: { fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1" } },
    { module, route: "rules.tactic.reading.loose_piece@1", input: { fen: "q3k3/8/8/8/8/8/8/R3K3 w - - 0 1" } },
  ] as const),
  { module: "threat_radar", route: "rules.tactic.reading.back_rank@1", input: { fen: "r3k3/8/8/8/8/8/5PPP/6K1 w - - 0 1" } },
  { module: "threat_radar", route: "rules.tactic.reading.trapped_piece@1", input: { fen: "r3k3/8/8/8/8/8/1P6/B3K3 w - - 0 1" } },
  { module: "threat_radar", route: "rules.tactic.reading.ray_classification@1", input: { fen: "7k/3r4/2n5/1B6/8/8/8/4K3 w - - 0 1" } },
  { module: "theory_breadcrumb", route: "theory.shapes.firing@3", input: nudgeCases[5].input },
  { module: "theory_breadcrumb", route: "pack.authored.claim@1", input: { item: {
    kind: "annotation", id: "test-annotation", text: "Test-only authored annotation.", revealedBy: { kind: "test", eventSeq: 1 },
  } } },
] as const;

function namedComparisonSources() {
  const initial = importedRun("named-comparison-presentation", "white", "4k3/8/8/8/8/8/3P4/4K3 w - - 0 1");
  const root = initial.activeCursor.nodeId, main = initial.activeCursor.branchId;
  const advanced = play(initial, ["d2d4"]), leaf = advanced.activeCursor.nodeId;
  const run = fork(rewind(advanced, root, FIXTURE_AT).run, root, { at: FIXTURE_AT }).run;
  const comparison = createRecordedComparisonSource({ run, columns: [
    { branchId: main, throughNodeId: leaf }, { branchId: run.activeCursor.branchId, throughNodeId: root },
  ] });
  const population = collectComparisonStructuralPopulation({ comparison });
  const result = invokeEvidenceValueRoute("derived.compare.structure_delta@2", { population, branchId: main });
  expect(result.some(item => item.evidence.payload.namedStructure !== null)).toBe(true);
  expect(result.some(item => item.evidence.payload.namedStructure === null)).toBe(true);
  return result.map(item => item.evidence);
}

const playSourceCases = [
  ...remainingPlayCases.map(({ module, route, input }) => ({ module, route, acquire: () => source(route, input) })),
  { module: "threat_radar" as const, route: "derived.tactic.defender_exposure@2", acquire: () => {
    const position = positionFromFen("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1");
    const beforeFen = canonicalFen(position), move = parseUci("c5b6")!;
    expect(position.isLegal(move)).toBe(true); position.play(move);
    const result = invokeEvidenceValueRoute("derived.tactic.defender_exposure@2", { beforeFen, moveUci: "c5b6", afterFen: canonicalFen(position) });
    if (result.kind !== "available" || result.value.length !== 1) throw new Error("Expected one genuine defender exposure");
    return result.value.map(item => item.evidence);
  } },
  { module: "theory_breadcrumb" as const, route: "theory.opening.current_endpoint@1", acquire: () => {
    const installation = admitInstalledOpeningCatalogue(JSON.parse(readFileSync(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8")));
    if (installation.kind !== "available") throw new Error(installation.reason);
    const run = play(importedRun("play-opening-presentation"), ["e2e4"]);
    const position = invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: run.activeCursor.nodeId });
    const result = invokeEvidenceValueRoute("theory.opening.current_endpoint@1", { source: installation.source, position });
    if (result.kind !== "available" || result.value.length !== 1) throw new Error("Expected genuine opening endpoint");
    return result.value;
  } },
  { module: "theory_breadcrumb" as const, route: "derived.explorer.population_summary@1", acquire: () => {
    const operation = "lichess_explorer.position_page@1";
    const requestedIdentity = normalizeProviderRequest(operation, explorerRequest({ history: { kind: "disabled" } }));
    const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation, requestedIdentity,
      capture: httpCapture(operation, explorerBody({ white: 100, draws: 0, black: 0, averageRating: 1700,
        moves: [{ uci: "e2e4", san: "e4", white: 100, draws: 0, black: 0, averageRating: 1700 }] })), requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
    const parsed = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
    const page = providerSourceEvidence(operation, PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, ...parsed, servedAt: FIXTURE_AT }));
    return [deriveExplorerPopulationSummary(page)];
  } },
  { module: "compare_coach" as const, route: "derived.compare.engine_trajectory@2", acquire: () => {
    const fixture = recordedComparisonPointFixture();
    const result = invokeEvidenceValueRoute("derived.compare.engine_trajectory@2", { comparisonPoint: fixture.source });
    if (result.kind !== "available") throw new Error("Expected genuine recorded comparison point");
    return [result.value];
  } },
  { module: "compare_coach" as const, route: "derived.compare.eval_delta@2", acquire: () => {
    const fixture = recordedComparisonEvalFixture();
    return invokeEvidenceValueRoute("derived.compare.eval_delta@2", { comparison: fixture.comparison, branchId: fixture.main, before: fixture.packets[0]!, after: fixture.packets[1]! });
  } },
  { module: "compare_coach" as const, route: "derived.compare.structure_delta@2", acquire: () => {
    const fixture = recordedComparisonFixture(), population = collectComparisonStructuralPopulation({ comparison: fixture.comparison });
    return invokeEvidenceValueRoute("derived.compare.structure_delta@2", { population, branchId: fixture.main }).map(item => item.evidence);
  } },
  { module: "compare_coach" as const, route: "derived.compare.structure_delta@2 (named and ordinary)", acquire: namedComparisonSources },
  { module: "compare_coach" as const, route: "derived.compare.piece_route@2", acquire: () => {
    const fixture = recordedComparisonFixture(), path = invokeEvidenceValueRoute("run.record.comparison_path@1", { comparison: fixture.comparison, branchId: fixture.main });
    return invokeEvidenceValueRoute("derived.compare.piece_route@2", { comparison: fixture.comparison, branchId: fixture.main, path });
  } },
  ...(["run.record.fork@1", "run.record.checkpoint_hit@1", "run.record.objective_transition@1", "run.record.consequence@1"] as const).map(route => ({
    module: "compare_coach" as const, route, acquire: () => {
      const fixture = recordedComparisonFixture();
      const checkpointed = reachCheckpoint(fixture.run, "test-checkpoint", FIXTURE_AT).run;
      const run = transitionObjective(checkpointed, "preserved", ["test-only-objective-evidence"], FIXTURE_AT).run;
      const comparison = compareBranches(run, [fixture.main, fixture.peer]);
      if (route === "run.record.fork@1") return [invokeEvidenceValueRoute(route, { run, comparison })];
      return invokeEvidenceValueRoute(route, { run, comparison, branchId: fixture.peer }).map(item => item.evidence);
    },
  })),
];

describe("D4045 Play relation source semantics", () => {
  const actualPairs = playAdapterSpecs(inspectorSourcePresentationKit).filter(row => row.component === "relation_overlay");
  const key = (consumer: { readonly id: string; readonly version: number }, projection: { readonly id: string; readonly version: number }) =>
    `${consumer.id}@${consumer.version} × ${projection.id}@${projection.version}`;
  const cases = [
    ...playSourceCases.filter(row => actualPairs.some(pair => pair.consumer.id === `module.${row.module}`
      && `${pair.projection.id}@${pair.projection.version}` === row.route)).map(row => ({ ...row, acquire: (mirrored = false) => {
      if (!mirrored) return row.acquire();
      if (row.route === "derived.tactic.defender_exposure@2") {
        const beforeFen = mirrorSemanticFen("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "color_and_vertical");
        const moveUci = mirrorSemanticUci("c5b6", "color_and_vertical");
        const position = positionFromFen(beforeFen), move = parseUci(moveUci)!;
        expect(position.isLegal(move)).toBe(true); position.play(move);
        const result = invokeEvidenceValueRoute("derived.tactic.defender_exposure@2", { beforeFen, moveUci, afterFen: canonicalFen(position) });
        if (result.kind !== "available" || result.value.length !== 1) throw new Error("Expected real mirrored exposure");
        return result.value.map(value => value.evidence);
      }
      const original = remainingPlayCases.find(candidate => candidate.route === row.route);
      if (original === undefined || !("fen" in original.input)) throw new Error("Expected fixed reading fixture");
      return source(original.route, { fen: mirrorSemanticFen(original.input.fen, "color_and_vertical") });
    } })),
    ...HINT_FAMILIES.map(family => ({ module: "guided_hint" as const,
      route: `${hintDeclarationRow(family).disclosures.move.id}@${hintDeclarationRow(family).disclosures.move.version}`,
      acquire: (mirrored = false) => {
        const fixture = family === "double_attack" ? { fen: "4k3/8/8/8/1n6/1B6/8/R3K3 b - - 0 1", moves: ["b4c2"] }
          : HINT_FAMILY_POSITIVES[family];
        const selected = selectFixture(mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen,
          mirrored ? fixture.moves.map(move => mirrorSemanticUci(move, "color_and_vertical")) : fixture.moves);
        if (selected.kind !== "selected" || selected.horizon.payload.family !== family) throw new Error(`Missing genuine ${family} source`);
        return [compileHintDisclosureV2(selected.horizon, "move")];
      },
    })),
  ];
  function actual(row: typeof cases[number], mirrored = false) {
    const sources = row.acquire(mirrored);
    const original = JSON.stringify(sources);
    const wire = receipt(row.module, sources);
    const overlay = wire.items.find(item => item.component.id === "relation_overlay")!;
    if (overlay?.component.id !== "relation_overlay" || overlay.evidenceRef === null) throw new Error("Expected genuine owned relation");
    expect(overlay.component.operand.edges.length).toBeGreaterThan(0);
    expect(wire.items.some(item => item.component.id === "fact_statement")).toBe(true);
    expect(JSON.stringify(sources)).toBe(original);
    return { wire, overlay, operand: overlay.component.operand, sources };
  }
  type OriginalPayload<R extends keyof EvidenceValueRouteResults> = EvidenceValueRouteResults[R] extends DeclaredEvidence<infer P> ? P : never;
  // An independent copy of the pre-amendment source traversal, never the production
  // retained-caption recipe. This is preservation evidence, not a second renderer.
  function originalGeometry(evidence: DeclaredEvidence<unknown>) {
    const originalPiece = (piece: { readonly color: Color; readonly role: Role }) => ({ color: piece.color, role: piece.role });
    let nodes: RelationOverlayOperand["nodes"][number][];
    let endpoints: { from: SquareName; to: SquareName }[];
    const id = evidence.projection.id;
    if (id === "rules.pawn.reading.contacts") {
      const value = evidence.payload as OriginalPayload<"rules.pawn.reading.contacts@1">;
      nodes = value.contacts.flatMap(row => [{ square: row.attacker.square, ...originalPiece(row.attacker.piece), emphasis: "source" as const },
        { square: row.target.square, ...originalPiece(row.target.piece), emphasis: "target" as const }]);
      endpoints = value.contacts.map(row => ({ from: row.attacker.square, to: row.target.square }));
    } else if (id === "rules.square.reading.control") {
      const value = evidence.payload as OriginalPayload<"rules.square.reading.control@1">;
      nodes = []; endpoints = [];
      for (const color of value.colors) for (const row of color.pseudo) {
        nodes.push({ square: row.target, emphasis: "target" });
        for (const controller of row.controllers) {
          nodes.push({ square: controller.square, ...originalPiece(controller.piece), emphasis: "source" });
          if (controller.square !== row.target) endpoints.push({ from: controller.square, to: row.target });
        }
      }
      nodes = [...nodes.filter(node => node.emphasis === "source"), ...nodes.filter(node => node.emphasis !== "source")];
    } else if (id === "rules.tactic.reading.back_rank") {
      const value = evidence.payload as OriginalPayload<"rules.tactic.reading.back_rank@1">;
      nodes = value.susceptible.flatMap(row => [{ square: row.kingSquare, color: row.color, role: "king" as const, emphasis: "target" as const },
        ...row.accessingHeavyPieces.flatMap(heavy => [{ square: heavy.square, ...originalPiece(heavy.piece), emphasis: "source" as const }, { square: heavy.fileTarget, emphasis: "target" as const }])]);
      endpoints = value.susceptible.flatMap(row => row.accessingHeavyPieces.filter(heavy => heavy.square !== heavy.fileTarget).map(heavy => ({ from: heavy.square, to: heavy.fileTarget })));
    } else if (id === "rules.tactic.reading.trapped_piece") {
      const value = evidence.payload as OriginalPayload<"rules.tactic.reading.trapped_piece@1">;
      nodes = value.pieces.flatMap(row => [{ square: row.piece.square, ...originalPiece(row.piece.occupant), emphasis: "target" as const },
        ...row.attackers.map(attacker => ({ square: attacker.moveUci.slice(0, 2) as SquareName, emphasis: "source" as const }))]);
      endpoints = value.pieces.flatMap(row => row.attackers.map(attacker => ({ from: attacker.moveUci.slice(0, 2) as SquareName, to: row.piece.square })));
    } else if (id === "derived.tactic.defender_exposure") {
      type At = { readonly square: SquareName; readonly piece: { readonly color: Color; readonly role: Role } };
      const value = evidence.payload as { readonly defender: At; readonly target: At };
      nodes = [{ square: value.defender.square, ...originalPiece(value.defender.piece), emphasis: "source" }, { square: value.target.square, ...originalPiece(value.target.piece), emphasis: "target" }];
      endpoints = [{ from: value.defender.square, to: value.target.square }];
    } else {
      const value = evidence.payload as HintDisclosurePayload;
      if (value.rung !== "move") throw new Error("Expected genuine move disclosure");
      const from = value.firstMove.uci.slice(0, 2) as SquareName, to = value.firstMove.uci.slice(2, 4) as SquareName;
      nodes = [{ ...value.actor, square: value.actor.square as SquareName, emphasis: "source" }, ...(from === value.actor.square ? [] : [{ square: from, emphasis: "context" as const }]),
        { square: to, emphasis: "context" }, ...value.targetSquares.map(square => ({ square: square as SquareName, emphasis: "target" as const }))];
      endpoints = [{ from, to }];
    }
    const distinctNodes = nodes.filter((node, index) => nodes.findIndex(other => other.square === node.square) === index);
    const distinctEdges = endpoints.filter((edge, index) => endpoints.findIndex(other => other.from === edge.from && other.to === edge.to) === index);
    return { nodes: distinctNodes, endpoints: distinctEdges };
  }
  function changed(wire: PresentationReceipt, mutate: (operand: RelationOverlayOperand) => RelationOverlayOperand) {
    return redigest({ ...wire, items: wire.items.map(item => item.component.id === "relation_overlay"
      ? { ...item, component: { ...item.component, operand: mutate(item.component.operand) } } : item) });
  }
  it("covers every actual Play relation adapter, without dropping a source family", () => {
    expect(actualPairs).toHaveLength(12);
    expect(cases).toHaveLength(12);
    const covered = cases.map(row => {
      const { overlay } = actual(row);
      return key(overlay.adapter.consumer, overlay.adapter.projection);
    }).sort();
    expect(covered.length).toBeGreaterThan(0);
    expect(new Set(covered).size).toBe(covered.length);
    expect(covered).toEqual(actualPairs.map(row => key(row.consumer, row.projection)).sort());
  });
  it.each(cases)("preserves genuine marks, source and caption for $module × $route", row => {
    const { wire, operand } = actual(row);
    const roundtrip = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST,
      wire.items[0]!.adapter.consumer, row.acquire())));
    expect(roundtrip).toEqual(wire);
    // D4049/D4050 now pins original source traversal as well as the profile. Keep
    // the actual re-digested reversal attack; only its old permissive expectation retires.
    expect(() => parsePresentationReceipt(changed(wire, value => ({ ...value, nodes: [...value.nodes].reverse(), edges: [...value.edges].reverse() })))).toThrow(/geometry/u);
    expect(operand.owner.factRef).toBe(wire.items[0]!.evidenceRef!.evidenceDigest);
  });
  for (const mirrored of [false, true]) it.each(cases)(`retains independent original source geometry, mirrored=${mirrored}, for $module × $route`, row => {
    const { operand, sources } = actual(row, mirrored);
    expect(sources).toHaveLength(1);
    const expected = originalGeometry(sources[0]!);
    expect(operand.nodes).toEqual(expected.nodes);
    expect(operand.edges.map(({ from, to }) => ({ from, to }))).toEqual(expected.endpoints);
  });
  for (const field of ["owner", "distance", "relation", "sign", "convention"] as const) {
    it.each(cases)(`refuses isolated re-digested ${field} substitution for $module × $route`, row => {
      const { wire, overlay } = actual(row);
      const mutated = changed(wire, operand => {
        if (field === "owner") return { ...operand, owner: { factRef: `sha256:${"0".repeat(64)}` } };
        if (field === "distance") return { ...operand, answerDistance: operand.answerDistance === "move" ? "fact" : "move" };
        if (field === "relation") return { ...operand, edges: operand.edges.map(edge => ({ ...edge, relation: edge.relation === "attacks" ? "defends" : "attacks" })) };
        if (field === "sign") return { ...operand, edges: operand.edges.map(edge => ({ ...edge, sign: edge.sign === "state" ? "lost" : "state" })) };
        if (operand.convention !== undefined) { const { convention: _convention, ...rest } = operand; return rest; }
        return { ...operand, convention: { producer: overlay.evidenceRef!.producer, sourceProjection: overlay.evidenceRef!.projection,
          sourceEvidenceDigest: overlay.evidenceRef!.evidenceDigest, perspective: "not_applicable", basis: { kind: "declared", convention: "board-rules@1" } } };
      });
      // Genuine statement siblings and exact source refs remain unchanged; all public digests
      // are refreshed so no stale receipt checksum substitutes for the semantic refusal.
      expect(mutated.items.filter(item => item.component.id === "fact_statement")).toEqual(wire.items.filter(item => item.component.id === "fact_statement"));
      expect(() => parsePresentationReceipt(mutated)).toThrow(/relation.*(source|semantics|convention|owner)/iu);
    });
  }
  const declaredCases = cases.filter(row => row.route === "rules.tactic.reading.back_rank@1" || row.route === "rules.tactic.reading.trapped_piece@1");
  // D4049/D4050: real-source falsifiers for the bounded amendment. These must first
  // fail against the existing independent-row receipt behavior, not stale digests.
  it("declares complete received correspondence on every one of the twelve actual pairs", () => {
    for (const row of actualPairs) expect(row, key(row.consumer, row.projection))
      .toHaveProperty("validateWireComposition", expect.any(Function));
  });
  for (const field of ["endpoint", "emphasis", "role", "color"] as const) {
    it.each(cases)(`refuses isolated re-digested exact ${field} for $module × $route`, row => {
      const { wire } = actual(row);
      const mutated = changed(wire, operand => {
        if (field === "endpoint") return { ...operand, edges: operand.edges.map((edge, index) => index === 0
          ? { ...edge, from: edge.to, to: edge.from } : edge) };
        return { ...operand, nodes: operand.nodes.map((node, index) => index !== 0 ? node : field === "emphasis"
          ? { ...node, emphasis: node.emphasis === "source" ? "context" : "source" }
          : field === "role" ? { ...node, role: node.role === "pawn" ? "queen" : "pawn" }
            : { ...node, color: node.color === "white" ? "black" : "white" }) };
      });
      expect(mutated.items.filter(item => item.component.id === "fact_statement"))
        .toEqual(wire.items.filter(item => item.component.id === "fact_statement"));
      expect(() => parsePresentationReceipt(mutated)).toThrow(/relation|composition|geometry|occurrence/iu);
    });
  }
  for (const layout of ["arrow_only", "statement_only", "reverse", "interleave"] as const) {
    it.each(cases)(`refuses a re-digested ${layout} occurrence for $module × $route`, row => {
      const { wire } = actual(row);
      expect(wire.items).toHaveLength(2);
      const items = layout === "arrow_only" ? wire.items.slice(0, 1)
        : layout === "statement_only" ? wire.items.slice(1)
          : layout === "reverse" ? [...wire.items].reverse()
            : [wire.items[0]!, wire.items[0]!, wire.items[1]!, wire.items[1]!];
      expect(() => parsePresentationReceipt(redigest({ ...wire, items })))
        .toThrow(/relation|composition|occurrence/iu);
    });
  }
  it.each(cases)("refuses process members from separate constructions of the same evidence for $module × $route", row => {
    const sources = row.acquire();
    const consumer = { id: `module.${row.module}`, version: row.module === "sight_on_request" ? 1 : 2 };
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, sources);
    const first = presentEvidenceItems(view), second = presentEvidenceItems(view);
    expect(first).toHaveLength(2);
    expect(second).toEqual(first);
    expect(() => serializePresentedEvidence([first[0]!, second[1]!]))
      .toThrow(/relation|composition|occurrence/iu);
  });
  it.each(cases)("retains complete repeated and equal-valued occurrences for $module × $route", row => {
    const sources = row.acquire();
    const consumer = { id: `module.${row.module}`, version: row.module === "sight_on_request" ? 1 : 2 };
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, sources);
    const first = presentEvidenceItems(view), second = presentEvidenceItems(view);
    const repeated = serializePresentedEvidence([...first, ...second, ...first]);
    expect(parsePresentationReceipt(repeated)).toHaveLength(6);
    const reversedPairs = serializePresentedEvidence([...second, ...first]);
    expect(parsePresentationReceipt(reversedPairs)).toHaveLength(4);
  });
  it.each(cases)("refuses another genuine caption laundered under the original owner for $module × $route", row => {
    const { wire } = actual(row);
    const other = row.route === "rules.square.reading.control@1"
      ? receipt("sight_on_request", source("rules.square.reading.control@1", { fen: LUCENA })) : actual(row, true).wire;
    const original = wire.items[1]!, foreign = other.items[1]!;
    expect(foreign.component).not.toEqual(original.component);
    // Keep the ORIGINAL adapter/evidenceRef and all public re-digestion, not an
    // easier wrong-owner failure. Only the genuinely registered sibling changes.
    expect(() => parsePresentationReceipt(redigest({ ...wire, items: [wire.items[0]!, { ...original, component: foreign.component }] })))
      .toThrow(/relation|composition|geometry/iu);
  });
  for (const layout of ["arrow_only", "statement_only", "reverse", "interleave", "extra"] as const) {
    it.each(cases)(`refuses process ${layout} even for individually genuine sealed members: $module × $route`, row => {
      const sources = row.acquire();
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST,
        { id: `module.${row.module}`, version: row.module === "sight_on_request" ? 1 : 2 }, sources));
      const changed = layout === "arrow_only" ? items.slice(0, 1) : layout === "statement_only" ? items.slice(1)
        : layout === "reverse" ? [...items].reverse() : layout === "extra" ? [...items, items[1]!]
          : [items[0]!, items[0]!, items[1]!, items[1]!];
      expect(() => serializePresentedEvidence(changed)).toThrow(/relation|composition|occurrence/iu);
    });
  }
  const retainedCases = cases.filter(row => row.module === "sight_on_request" || row.module === "guided_hint");
  function rawCaption(wire: PresentationReceipt, mutate: (operands: Record<string, unknown>) => void,
    text: "registered" | "original" = "registered") {
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement") return item;
      const original = item.component.operand;
      const operands = structuredClone(original.operands) as Record<string, unknown>;
      mutate(operands);
      const renderer = PLAY_FACT_RENDERERS[original.rendererId as keyof typeof PLAY_FACT_RENDERERS];
      const operand = { ...original, operands, sourceDigest: presentationDigest("presentation.fact.operands@1", operands),
        renderedText: text === "original" ? original.renderedText : renderer.render(operands as never) };
      return { ...item, component: { ...item.component, operand } };
    });
    return redigest({ ...wire, items });
  }
  it.each(retainedCases)("requires the original directed operand in process and raw received input: $module × $route", row => {
    const { wire } = actual(row);
    const statement = wire.items[1]!.component;
    if (statement.id !== "fact_statement") throw new Error("Expected actual paired statement");
    const remove = (operands: Record<string, unknown>) => {
      if (row.route === "rules.pawn.reading.contacts@1") delete operands.directedContacts;
      else if (row.route === "rules.square.reading.control@1") {
        for (const color of operands.colors as Record<string, unknown>[]) delete color.pseudoControls;
      } else delete operands.uci;
    };
    for (const mutate of [remove, (operands: Record<string, unknown>) => { operands.unexpectedDirectedField = true; }]) {
      const malformed = structuredClone(statement.operand.operands) as Record<string, unknown>;
      mutate(malformed);
      expect(() => factStatementOperand(statement.operand.rendererId, statement.operand.binding, statement.operand.convention, malformed as never)).toThrow();
      // D4051: these fields do not appear in prose. Keep actual original text
      // and construct fully re-digested raw input BEFORE the refusal callback;
      // a helper/renderer failure must not masquerade as receiver rejection.
      const raw = rawCaption(wire, mutate, "original");
      expect(() => parsePresentationReceipt(raw)).toThrow();
    }
  });
  it.each(retainedCases)("joins changed valid directed caption operands to actual geometry: $module × $route", row => {
    const { wire } = actual(row);
    const changed = rawCaption(wire, operands => {
      if (row.route === "rules.pawn.reading.contacts@1") {
        const contacts = operands.directedContacts as { attacker: { piece: { role: string } } }[];
        expect(contacts.length).toBeGreaterThan(0);
        contacts[0]!.attacker.piece.role = "queen";
      } else if (row.route === "rules.square.reading.control@1") {
        const colors = operands.colors as { pseudoControls: { controllers: { piece: { role: string } }[] }[] }[];
        const controller = colors.flatMap(color => color.pseudoControls).flatMap(cell => cell.controllers)[0]!;
        controller.piece.role = controller.piece.role === "queen" ? "pawn" : "queen";
      } else operands.uci = operands.uci === "a1a2" ? "a1a3" : "a1a2";
    });
    expect(() => parsePresentationReceipt(changed)).toThrow(/geometry/u);
  });
  it.each(retainedCases.filter(row => row.module === "sight_on_request"))("refuses counts that contradict actual retained contacts/controllers: $route", row => {
    const { wire } = actual(row);
    const change = (operands: Record<string, unknown>) => {
      if (row.route === "rules.pawn.reading.contacts@1") operands.contacts = Number(operands.contacts) + 1;
      else (operands.colors as { pseudo: number }[])[0]!.pseudo += 1;
    };
    const statement = wire.items[1]!.component;
    if (statement.id !== "fact_statement") throw new Error("Expected actual paired statement");
    const operands = structuredClone(statement.operand.operands) as Record<string, unknown>;
    change(operands);
    expect(() => factStatementOperand(statement.operand.rendererId, statement.operand.binding, statement.operand.convention, operands as never)).toThrow(/count/u);
    const raw = rawCaption(wire, change);
    expect(() => parsePresentationReceipt(raw)).toThrow(/count/u);
  });
  for (const field of ["producer", "projection", "digest", "perspective", "basis", "convention"] as const) {
    it.each(declaredCases)(`refuses isolated re-digested declared ${field} for $module × $route`, row => {
      const { wire } = actual(row);
      const mutated = changed(wire, operand => {
        const original = operand.convention;
        if (original === undefined) throw new Error("Expected original declared threat convention");
        const convention = field === "producer" ? { ...original, producer: { ...original.producer, version: original.producer.version + 1 } }
          : field === "projection" ? { ...original, sourceProjection: { ...original.sourceProjection, version: original.sourceProjection.version + 1 } }
          : field === "digest" ? { ...original, sourceEvidenceDigest: `sha256:${"0".repeat(64)}` }
          : field === "perspective" ? { ...original, perspective: "white" as const }
          : field === "basis" ? { ...original, basis: { kind: "recorded_search" as const, engine: null, depth: null } }
          : { ...original, basis: { kind: "declared" as const, convention: "board-rules@1" as const } };
        return { ...operand, convention };
      });
      expect(() => parsePresentationReceipt(mutated)).toThrow(/relation.*(source|semantics|convention|owner)/iu);
    });
  }
});

describe("D3948 remaining static Play fact/caption associations", () => {
  it("retains both genuine structural Compare rendering arms", () => {
    const wire = receipt("compare_coach", namedComparisonSources());
    const renderers = wire.items.map(item => item.component.id === "fact_statement" ? item.component.operand.rendererId : undefined);
    expect(renderers).toContain("play.named_structure@1");
    expect(renderers).toContain("play.compare_structure@1");
  });
  it.each(["renderer", "binding", "convention"] as const)("refuses a named-only Compare %s substitution while retaining ordinary siblings", field => {
    const wire = receipt("compare_coach", namedComparisonSources());
    let changed = 0;
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "play.named_structure@1") return item;
      changed++;
      const original = item.component.operand;
      const operand = field === "renderer" ? factStatementOperand("play.phase@1", "declared_convention", "phase-bands@1", { phase: "opening" })
        : factStatementOperand(original.rendererId, field === "binding" ? "recorded_run" : original.binding,
          field === "convention" ? "board-rules@1" : original.convention, original.operands);
      return { ...item, component: { ...item.component, operand } };
    });
    expect(changed).toBeGreaterThan(0);
    expect(items.some(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.compare_structure@1")).toBe(true);
    expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
  });
  it("requires received validation on the actual whole Play fact/caption declarations", () => {
    const specs = playAdapterSpecs(inspectorSourcePresentationKit);
    expect(specs.length).toBeGreaterThan(0);
    for (const spec of specs) {
      const actual = PRESENTATION_ADAPTERS.find(row => row.consumer.id === spec.consumer.id && row.consumer.version === spec.consumer.version
        && row.projection.id === spec.projection.id && row.projection.version === spec.projection.version);
      expect(actual, `${spec.consumer.id} × ${spec.projection.id}`).toBeDefined();
      expect(actual!.validateWireComponent).toBeTypeOf("function");
    }
  });
  it.each(playSourceCases)("round-trips original $module × $route", ({ module, acquire }) => {
    const items = acquire();
    for (const item of items) assertDeclaredEvidence(item);
    expect(receipt(module, items).items.length).toBeGreaterThan(0);
  });
  for (const field of ["renderer", "binding", "convention"] as const) {
    it.each(playSourceCases)(`refuses re-digested ${field} substitution for $module × $route`, ({ module, acquire }) => {
      const wire = receipt(module, acquire());
      let changed = 0;
      const items = wire.items.map(item => {
        const original = item.component.id === "fact_statement" ? item.component.operand
          : item.component.id === "square_set" ? item.component.operand.caption : undefined;
        if (original === undefined) return item;
        changed++;
        const operand = field === "renderer" ? factStatementOperand("play.phase@1", "declared_convention", "phase-bands@1", { phase: "opening" })
          : factStatementOperand(original.rendererId, field === "binding" ? original.binding === "recorded_run" ? "declared_convention" : "recorded_run" : original.binding,
            field === "convention" ? original.convention === "board-rules@1" ? "recorded-run@1" : "board-rules@1" : original.convention, original.operands);
        return { ...item, component: item.component.id === "fact_statement" ? { ...item.component, operand }
          : { ...item.component, operand: { ...item.component.operand, caption: operand } } };
      });
      expect(changed).toBeGreaterThan(0);
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/registered|renderer|binding|convention/u);
    });
  }
});

describe("D4026 exact Guided Hint disclosure association", () => {
  function horizon() {
    const fixture = HINT_FAMILY_POSITIVES.loose_piece;
    const selected = selectFixture(fixture.fen, fixture.moves);
    if (selected.kind !== "selected") throw new Error("Expected genuine selected hint horizon");
    expect(selected.horizon.payload.family).toBe("loose_piece");
    return selected.horizon;
  }
  function followupHorizon() {
    const selected = selectFixture(HINT_FOLLOWUP.fen, HINT_FOLLOWUP.moves);
    if (selected.kind !== "selected") throw new Error("Expected genuine follow-up horizon");
    expect(selected.horizon.payload).toMatchObject({ relation: "root_followup_in_line", occurrencePly: 3 });
    return selected.horizon;
  }
  it.each(HINT_FAMILIES)("round-trips all rungs of the source actually selected from the %s fixture", family => {
    const fixture = HINT_FAMILY_POSITIVES[family];
    const selected = selectFixture(fixture.fen, fixture.moves);
    if (selected.kind !== "selected") throw new Error("Expected genuine selected horizon");
    // The existing double-attack fixture selects fork survival. Never relabel that source.
    expect(selected.horizon.payload.family).toBe(family === "double_attack" ? "fork_survives_reply" : family);
    for (const rung of HINT_RUNGS) {
      const disclosure = compileHintDisclosureV2(selected.horizon, rung);
      expect(receipt("guided_hint", [disclosure]).items.length).toBeGreaterThan(0);
    }
  });
  it("round-trips every rung of a real selected non-surviving double attack", () => {
    const selected = selectFixture("4k3/8/8/8/1n6/1B6/8/R3K3 b - - 0 1", ["b4c2"]);
    if (selected.kind !== "selected") throw new Error("Expected genuine selected horizon");
    expect(selected.horizon.payload.family).toBe("double_attack");
    for (const rung of HINT_RUNGS) expect(receipt("guided_hint", [compileHintDisclosureV2(selected.horizon, rung)]).items.length).toBeGreaterThan(0);
  });
  it("round-trips all rungs of the actual later-root ply-three follow-up", () => {
    for (const rung of HINT_RUNGS) expect(receipt("guided_hint", [compileHintDisclosureV2(followupHorizon(), rung)]).items.length).toBeGreaterThan(0);
  });
  it.each(["pattern", "square", "piece", "distance"] as const)("refuses move UCI in the lower %s rung in process and raw wire input", rung => {
    const wire = receipt("guided_hint", [compileHintDisclosureV2(horizon(), rung)]);
    const items = wire.items.map(item => {
      const original = item.component.id === "fact_statement" ? item.component.operand
        : item.component.id === "square_set" ? item.component.operand.caption : undefined;
      if (!original || original.rendererId !== "play.guided_hint@1") throw new Error("Expected genuine lower-rung caption");
      const operands = { ...original.operands, uci: "e4c3" };
      expect(() => factStatementOperand("play.guided_hint@1", original.binding, original.convention, operands)).toThrow(/fields/u);
      const caption = { ...original, operands,
        sourceDigest: presentationDigest("presentation.fact.operands@1", operands),
        renderedText: PLAY_FACT_RENDERERS["play.guided_hint@1"].render(operands) };
      return { ...item, component: item.component.id === "fact_statement" ? { ...item.component, operand: caption }
        : { ...item.component, operand: { ...item.component.operand, caption } } };
    });
    expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/fields/u);
  });
  it("keeps promotion UCI, original text and original actor/context normalization in real move disclosures", () => {
    const selected = selectFixture("8/5KPk/8/8/5B2/8/8/8 w - - 0 1", ["g7g8q"]);
    if (selected.kind !== "selected") throw new Error("Expected a genuine selected promotion horizon");
    expect(selected.horizon.payload.family).toBe("mate_in_one");
    for (const source of [selected.horizon, horizon(), followupHorizon()]) {
      const disclosure = compileHintDisclosureV2(source, "move");
      const payload = disclosure.payload;
      if (payload.rung !== "move") throw new Error("Expected genuine move disclosure");
      const wire = receipt("guided_hint", [disclosure]);
      const parsed = parsePresentationReceipt(wire);
      const board = parsed[0]!.component, statement = parsed[1]!.component;
      if (board.id !== "relation_overlay" || statement.id !== "fact_statement"
        || statement.operand.rendererId !== "play.guided_hint@1") throw new Error("Expected exact move pair");
      expect(statement.operand.operands.uci).toBe(payload.firstMove.uci);
      expect(statement.operand.operands.san).toBe(payload.firstMove.san);
      expect(board.operand.edges).toEqual([{ from: payload.firstMove.uci.slice(0, 2), to: payload.firstMove.uci.slice(2, 4), relation: "moves_to", sign: "state" }]);
      // The actor can be the context origin or a later-root piece. Keep the
      // original first-square-wins order, rather than duplicating either node.
      const expected = [payload.actor.square, payload.firstMove.uci.slice(0, 2), payload.firstMove.uci.slice(2, 4), ...payload.targetSquares];
      expect(board.operand.nodes.map(node => node.square)).toEqual([...new Set(expected)]);
      expect(board.operand.nodes[0]).toMatchObject({ square: payload.actor.square, role: payload.actor.role, color: payload.actor.color });
      expect(statement.operand.renderedText).toContain(payload.firstMove.san);
    }
  });
  it.each(["rung", "family", "extra_fields", "binding", "convention"] as const)("refuses re-digested hint %s substitution", field => {
    const selected = horizon();
    const wire = receipt("guided_hint", [compileHintDisclosureV2(selected, "pattern")]);
    const moveWire = receipt("guided_hint", [compileHintDisclosureV2(selected, "move")]);
    const move = moveWire.items.find(item => item.component.id === "fact_statement")!;
    expect(move.component.id).toBe("fact_statement");
    const items = wire.items.map(item => {
      if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "play.guided_hint@1"
        || move.component.id !== "fact_statement" || move.component.operand.rendererId !== "play.guided_hint@1") throw new Error("Expected actual pattern and move statements");
      const original = item.component.operand;
      if (field === "extra_fields") {
        const san = move.component.operand.operands.san;
        if (san === undefined) throw new Error("Expected the genuine move disclosure's SAN");
        const operands = { ...original.operands, san };
        expect(() => factStatementOperand("play.guided_hint@1", original.binding, original.convention, operands)).toThrow(/fields/u);
        // A wire sender can recompute public digests without calling the process constructor.
        // Keep the original pattern text: the extra move field must fail even if prose ignores it.
        return { ...item, component: { ...item.component, operand: { ...original, operands,
          sourceDigest: presentationDigest("presentation.fact.operands@1", operands) } } };
      }
      const component = field === "rung" ? move.component : { id: "fact_statement" as const,
        operand: factStatementOperand("play.guided_hint@1", field === "binding" ? "recorded_run" : original.binding,
          field === "convention" ? "board-rules@1" : original.convention, {
            ...original.operands,
            ...(field === "family" ? { family: "mate_in_one" as const } : {}),
          }),
      };
      return { ...item, component };
    });
    expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/family|rung|fields|registered|binding|convention/u);
  });
  for (const rung of ["square", "piece", "distance"] as const) {
    it.each(["family", "rung"] as const)(`refuses re-digested ${rung} nested caption %s substitution`, field => {
      const selected = horizon();
      const wire = receipt("guided_hint", [compileHintDisclosureV2(selected, rung)]);
      const pattern = receipt("guided_hint", [compileHintDisclosureV2(selected, "pattern")]).items[0]!;
      if (pattern.component.id !== "fact_statement") throw new Error("Expected genuine pattern statement");
      const patternOperand = pattern.component.operand;
      const items = wire.items.map(item => {
        if (item.component.id !== "square_set" || item.component.operand.caption.rendererId !== "play.guided_hint@1") return item;
        const original = item.component.operand.caption;
        const caption = field === "rung" ? patternOperand : factStatementOperand("play.guided_hint@1", original.binding,
          original.convention, { ...original.operands, family: "mate_in_one" });
        return { ...item, component: { ...item.component, operand: { ...item.component.operand, caption } } };
      });
      expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/family|rung/u);
    });
  }
  it.each([
    { relation: "root_direct", ply: 2 },
    { relation: "root_direct", ply: 3 },
    { relation: "root_followup_in_line", ply: 1 },
  ] as const)("refuses relation $relation with occurrence ply $ply in process and on the wire", mutation => {
    const selected = mutation.relation === "root_direct" ? horizon() : followupHorizon();
    const wire = receipt("guided_hint", [compileHintDisclosureV2(selected, "distance")]);
    const items = wire.items.map(item => {
      const original = item.component.id === "fact_statement" ? item.component.operand
        : item.component.id === "square_set" ? item.component.operand.caption : undefined;
      if (!original || original.rendererId !== "play.guided_hint@1") throw new Error("Expected distance caption or statement");
      // Only ply changes: a rendered-text mismatch must not mask the relation/ply check.
      expect(original.operands.relation).toBe(mutation.relation);
      const operands = { ...original.operands, ...mutation };
      expect(() => factStatementOperand("play.guided_hint@1", original.binding, original.convention, operands)).toThrow(/ply/u);
      const changed = { ...original, operands, sourceDigest: presentationDigest("presentation.fact.operands@1", operands) };
      return { ...item, component: item.component.id === "fact_statement" ? { ...item.component, operand: changed }
        : { ...item.component, operand: { ...item.component.operand, caption: changed } } };
    });
    expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/ply/u);
  });
  it("requires a validator on all thirty-five current declared hint pairs", () => {
    const rows = PRESENTATION_ADAPTERS.filter(row => row.consumer.id === "module.guided_hint" && row.consumer.version === 2);
    expect(rows).toHaveLength(HINT_FAMILIES.length * HINT_RUNGS.length);
    for (const row of rows) expect(row.validateWireComponent, row.key).toBeTypeOf("function");
  });
});

describe("D3948 Sight structural captions", () => {
  const sources = () => declareStructuralReadingEvidence({ fen: INITIAL }).filter(item => item.projection.id === "rules.structural.reading.king_zone");
  it("round-trips actual source geometry and caption", () => {
    const items = sources(); expect(items.length).toBeGreaterThan(0);
    const wire = receipt("sight_on_request", items);
    expect(wire.items.every(item => item.component.id === "square_set" && item.component.operand.brush === "blue")).toBe(true);
  });
  it.each(["renderer", "binding", "convention", "kind"] as const)("refuses re-digested nested caption %s substitution", field => {
    const wire = receipt("sight_on_request", sources());
    const items = wire.items.map(item => {
      if (item.component.id !== "square_set" || item.component.operand.caption.rendererId !== "play.structural_observation@1") throw new Error("Expected actual structural caption");
      const original = item.component.operand.caption;
      const caption = field === "renderer" ? factStatementOperand("play.castling_rights@1", "declared_convention", "board-rules@1", {
        white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false },
      }) : factStatementOperand("play.structural_observation@1", field === "binding" ? "recorded_run" : original.binding,
        field === "convention" ? "pawn-structure@1" : original.convention, field === "kind"
          ? { kind: "piece_count", squares: [], color: "white", role: "king", count: 1 } : original.operands);
      return { ...item, component: { ...item.component, operand: { ...item.component.operand, caption } } };
    });
    expect(() => parsePresentationReceipt(redigest({ ...wire, items }))).toThrow(/registered|renderer|binding|convention|kind/u);
  });
  it("requires hooks on the actual sixteen Sight structural pairs and every Nudge pair", () => {
    const sight = PRESENTATION_ADAPTERS.filter(row => row.consumer.id === "module.sight_on_request" && row.projection.id.startsWith("rules.structural.reading.") && row.projection.id !== "rules.structural.reading.named_structure");
    expect(sight).toHaveLength(16);
    const nudge = PRESENTATION_ADAPTERS.filter(row => row.consumer.id === "module.structure_nudge");
    expect(nudge).toHaveLength(7);
    for (const row of [...sight, ...nudge]) expect(row.validateWireComponent, row.key).toBeTypeOf("function");
  });
});
