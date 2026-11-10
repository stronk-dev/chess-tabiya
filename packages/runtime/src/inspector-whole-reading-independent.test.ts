// Independent D3984 source → prospective constructor/retention proof, not a compiled Full2 page.
import { describe, expect, it } from "vitest";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import type { Piece, SquareName } from "chessops/types";
import { inspectorSourceAdapterSpecs } from "./presentation-inspector-adapters.js";
import { INSPECTOR_WHOLE_READING_GEOMETRY, inspectorWholeReadingComponents, type InspectorWholeReadingRef } from "./inspector-whole-reading-presentation.js";
import { inspectorSourcePresentationKit as kit } from "./testing/inspector-source-presentation-kit.js";
import { adapterComponentsForEvidence, assertPresentationSourceRetention, componentValueSentence, parseComponentValue,
  type ComponentValue, type RelationOverlayOperand } from "./presentation-contract.js";
import { mirrorSemanticFen } from "./semantic-validation.js";
import type { BackRankReading, PromotionPressureReading, ThreatResult, TrappedPieceReading } from "./tactics.js";
import type { PawnContactsReading } from "./pawn-dynamics.js";
import type { PieceDestinationsReading } from "./mobility.js";
import { INSPECTOR_FIXTURE_FENS, inspectorFixtureEdges } from "./testing/inspector-presentation-fixture.js";

const FULL2 = { id: "module.full_inspector", version: 2 } as const;
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const BARE = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
const CHECK = "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1";
const mirror = (fen: string, black: boolean) => black ? mirrorSemanticFen(fen, "color_and_vertical") : fen;
const specs = inspectorSourceAdapterSpecs(kit);
/** TEST ONLY: exact positive geometry recipes captured from the original Full1 constructors
 * before their coordinated retirement. No consumer, adapter registration, mint or legacy API.
 * This independent reference deliberately does not call the replacement whole-reading helper. */
function originalPositiveGeometry(route: InspectorWholeReadingRef, evidence: DeclaredEvidence<unknown>): ComponentValue {
  const payload = <R extends InspectorWholeReadingRef>(_route: R) => evidence.payload as EvidenceValueRouteResults[R]["payload"];
  const square = (squares: readonly SquareName[], caption: Parameters<typeof kit.squareSet>[3], brush: "blue" | "red" = "blue") => {
    if (squares.length === 0) throw new TypeError("Original positive square recipe has no witnesses");
    return kit.squareSet(evidence, squares, brush, caption);
  };
  const fact = <R extends Parameters<typeof kit.fact>[0]>(renderer: R, convention: Parameters<typeof kit.fact>[2], operands: Parameters<typeof kit.fact<R>>[3]) => kit.fact(renderer, "declared_convention", convention, operands);
  const piece = (value: Piece) => ({ color: value.color, role: value.role });
  const node = (value: { readonly square: SquareName; readonly piece: Piece }, emphasis: RelationOverlayOperand["nodes"][number]["emphasis"]): RelationOverlayOperand["nodes"][number] => ({ square: value.square, role: value.piece.role, color: value.piece.color, emphasis });
  const occupant = (value: { readonly square: SquareName; readonly occupant: Piece }) => ({ square: value.square, piece: value.occupant });
  const relation = (nodes: RelationOverlayOperand["nodes"], edges: RelationOverlayOperand["edges"], answerDistance: RelationOverlayOperand["answerDistance"], convention?: Parameters<typeof kit.declared>[1]): ComponentValue => {
    const unique = new Map<string, RelationOverlayOperand["nodes"][number]>();
    for (const item of nodes) if (!unique.has(item.square)) unique.set(item.square, item);
    const keys = new Set<string>();
    const kept = edges.filter(edge => {
      const key = `${edge.from}${edge.to}${edge.relation}${edge.sign}`;
      if (edge.from === edge.to || keys.has(key)) return false;
      keys.add(key); return true;
    });
    if (kept.length === 0) throw new TypeError("Original positive relation recipe has no edges");
    return { id: "relation_overlay", operand: { nodes: [...unique.values()], edges: kept,
      owner: { factRef: kit.factRef(evidence) }, answerDistance, ...(convention === undefined ? {} : { convention: kit.declared(evidence, convention) }) } };
  };
  switch (route) {
    case "rules.structural.reading.space@1": {
      const reading = payload(route);
      return square(reading.colors.flatMap(entry => entry.zones.flatMap(zone => zone.squares)), fact("play.space@1", "pawn-structure@1", { totals: reading.colors.map(entry => ({ color: entry.color, total: entry.total })), zones: reading.differentials.map(zone => ({ zone: zone.zone, white: zone.white, black: zone.black })) }));
    }
    case "rules.structural.reading.pawn_connectivity@1": {
      const reading = payload(route);
      return square(reading.colors.flatMap(entry => entry.islands.flatMap(island => island.squares)), fact("play.pawn_connectivity@1", "board-rules@1", { colors: reading.colors.map(entry => ({ color: entry.color, islands: entry.islandCount, connectedPairs: entry.connectedPawnPairs.length, chains: entry.chains.length })) }));
    }
    case "rules.mobility.reading.legal_moves@1": {
      const reading = payload(route), movable = reading.pieces.filter(entry => entry.moves.length > 0);
      return square(movable.map(entry => entry.piece.square), fact("play.legal_moves@1", "board-rules@1", { turn: reading.turn, pieces: movable.length, moves: movable.reduce((sum, entry) => sum + entry.moves.length, 0), squares: [...new Set(movable.map(entry => entry.piece.square))] }));
    }
    case "rules.tactic.reading.ray_classification@1": {
      const reading = payload(route), kept = reading.rays.filter(ray => ["absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense"].includes(ray.kind));
      return square(kept.flatMap(ray => [ray.slider.square, ray.blocker.square, ray.target.square]), fact("play.rays@1", "threat-convention@1", { rays: kept.map(ray => ({ kind: ray.kind, slider: piece(ray.slider.piece), sliderSquare: ray.slider.square, blocker: piece(ray.blocker.occupant), blockerSquare: ray.blocker.square, target: piece(ray.target.occupant), targetSquare: ray.target.square })) }), "red");
    }
    case "rules.tactic.reading.rook_on_seventh@1": {
      const reading = payload(route);
      return square(reading.rooks.flatMap(rook => [rook.rook.square, ...(rook.enemyKingOnBackRank === null ? [] : [rook.enemyKingOnBackRank.square]), ...rook.enemyPawnsOnSeventh.map(pawn => pawn.square)]), fact("play.rook_on_seventh@1", "board-rules@1", { rooks: reading.rooks.map(rook => ({ color: rook.rook.piece.color, square: rook.rook.square, king: rook.enemyKingOnBackRank?.square ?? null, pawns: rook.enemyPawnsOnSeventh.map(pawn => pawn.square) })) }));
    }
    case "rules.phase.development@1": {
      const reading = payload(route), white = reading.undeveloped.white.map(entry => ({ piece: { color: "white" as const, role: entry.role }, square: entry.square })), black = reading.undeveloped.black.map(entry => ({ piece: { color: "black" as const, role: entry.role }, square: entry.square }));
      return square([...white, ...black].map(entry => entry.square), fact("inspector.development@1", "board-rules@1", { white, black }));
    }
    case "rules.pawn.reading.candidate_majority@1": {
      const reading = payload(route);
      return square(reading.candidates.map(entry => entry.pawn.square), fact("inspector.candidate_majority@1", "pawn-structure@1", { candidates: reading.candidates.map(entry => ({ pawn: { square: entry.pawn.square, piece: piece(entry.pawn.piece) }, supports: entry.supportCount, blockers: entry.blockerCount })) }));
    }
    case "rules.pawn.reading.contacts@1": {
      const reading = payload(route);
      return relation(reading.contacts.flatMap(contact => [node(contact.attacker, "source"), node(contact.target, "target")]), reading.contacts.map(contact => ({ from: contact.attacker.square, to: contact.target.square, relation: "attacks", sign: "state" })), "fact");
    }
    case "rules.mobility.reading.piece_destinations@1": {
      const reading = payload(route), nodes: RelationOverlayOperand["nodes"][number][] = [], edges: RelationOverlayOperand["edges"][number][] = [];
      for (const color of reading.colors) if (color.kind === "available") for (const unit of color.pieces) for (const target of unit.legal) {
        nodes.push(node(occupant(unit.piece), "source"), { square: target, emphasis: "target" });
        edges.push({ from: unit.piece.square, to: target, relation: "moves_to", sign: "state" });
      }
      return relation([...nodes.filter(item => item.emphasis === "source"), ...nodes.filter(item => item.emphasis !== "source")], edges, "fact", "piece-geometry@1");
    }
    case "rules.tactic.reading.discovered_latency@1": {
      const reading = payload(route);
      return relation(reading.screens.flatMap(entry => [node(entry.screen, "screen"), node(occupant(entry.target), "target"), node(entry.slider, "context")]), reading.screens.map(entry => ({ from: entry.screen.square, to: entry.target.square, relation: "closes_ray", sign: "state" })), "threat", "threat-convention@1");
    }
    case "rules.tactic.reading.defender_duty_set@1": {
      const reading = payload(route), nodes = reading.duties.flatMap(duty => [node(duty.defender, "source"), node(duty.target, "target")]);
      return relation([...nodes.filter(item => item.emphasis === "source"), ...nodes.filter(item => item.emphasis !== "source")], reading.duties.map(duty => ({ from: duty.defender.square, to: duty.target.square, relation: "defends", sign: "state" })), "fact");
    }
    case "rules.tactic.reading.back_rank@1": {
      const reading = payload(route);
      return relation(reading.susceptible.flatMap(entry => [
        { square: entry.kingSquare, role: "king" as const, color: entry.color, emphasis: "target" as const },
        ...entry.accessingHeavyPieces.flatMap(heavy => [{ square: heavy.square, role: heavy.piece.role, color: heavy.piece.color, emphasis: "source" as const }, { square: heavy.fileTarget, emphasis: "target" as const }]),
      ]), reading.susceptible.flatMap(entry => entry.accessingHeavyPieces.map(heavy => ({ from: heavy.square, to: heavy.fileTarget, relation: "moves_to" as const, sign: "state" as const }))), "threat", "threat-convention@1");
    }
    case "rules.tactic.reading.trapped_piece@1": {
      const reading = payload(route);
      if (reading.kind !== "pieces") throw new TypeError("Original relation refuses unavailable reading");
      return relation(reading.pieces.flatMap(entry => [node(occupant(entry.piece), "target"), ...entry.attackers.map(attacker => ({ square: attacker.moveUci.slice(0, 2) as SquareName, emphasis: "source" as const }))]), reading.pieces.flatMap(entry => entry.attackers.map(attacker => ({ from: attacker.moveUci.slice(0, 2) as SquareName, to: entry.piece.square, relation: "attacks" as const, sign: "state" as const }))), "threat", "threat-convention@1");
    }
    default: throw new TypeError("Not one of the thirteen unchanged original positive geometry refs");
  }
}
function source(route: InspectorWholeReadingRef, fen: string): DeclaredEvidence<unknown> {
  return invokeEvidenceValueRoute(route as never, { fen } as never) as DeclaredEvidence<unknown>;
}
function build(evidence: DeclaredEvidence<unknown>) {
  const spec = specs.find(row => row.projection.id === evidence.projection.id && row.projection.version === evidence.projection.version);
  if (spec === undefined) throw new Error("Missing actual prospective source spec");
  const before = JSON.stringify(evidence.payload), receipt = evidenceValueReceipt(evidence), output = spec.construct(evidence);
  const components: readonly ComponentValue[] = Array.isArray(output) ? output : [output as ComponentValue];
  expect(components.map(component => component.id)).toEqual(adapterComponentsForEvidence(spec, evidence));
  expect(components.map(component => parseComponentValue(JSON.parse(JSON.stringify(component))))).toEqual(components);
  expect(() => assertPresentationSourceRetention(evidence, components, FULL2)).not.toThrow();
  expect(JSON.stringify(evidence.payload)).toBe(before); expect(evidenceValueReceipt(evidence)).toBe(receipt);
  const statement = components[0]!;
  if (statement.id !== "fact_statement") throw new Error("Original reading must keep its mandatory statement");
  return { spec, components, statement, text: componentValueSentence(statement) };
}

describe("independent accepted D3984 whole-reading boundaries", () => {
  it("retains the original genuine positive destination geometry convention", () => {
    const value = source("rules.mobility.reading.piece_destinations@1", INITIAL), current = build(value);
    const prior = originalPositiveGeometry("rules.mobility.reading.piece_destinations@1", value);
    const next = current.components.find(component => component.id === "relation_overlay");
    if (prior?.id !== "relation_overlay" || next?.id !== "relation_overlay") throw new Error("Positive source lost its genuine relation");
    expect(prior.operand.convention).toBeDefined();
    expect(next.operand.convention).toEqual(prior.operand.convention);
    expect(next.operand.owner).toEqual(prior.operand.owner);
    expect(next.operand.nodes).toEqual(prior.operand.nodes);
    expect(next.operand.edges).toEqual(prior.operand.edges);
  });

  it.each([false, true])("capture destinations retain the original role-bearing node priority, black=%s", black => {
    const value = source("rules.mobility.reading.piece_destinations@1", mirror("4k3/8/8/8/4r3/8/4R3/4K3 w - - 0 1", black));
    const current = build(value), prior = originalPositiveGeometry("rules.mobility.reading.piece_destinations@1", value);
    const next = current.components.find(component => component.id === "relation_overlay");
    if (prior?.id !== "relation_overlay" || next?.id !== "relation_overlay") throw new Error("Capture fixture lost its genuine relations");
    const captureSquare = black ? "e5" : "e4";
    expect(prior.operand.nodes.find(node => node.square === captureSquare)).toMatchObject({ role: "rook", color: black ? "white" : "black" });
    expect(prior.operand.edges.some(edge => edge.to === captureSquare)).toBe(true);
    expect(next.operand.nodes).toEqual(prior.operand.nodes);
    expect(next.operand.edges).toEqual(prior.operand.edges);
  });

  const retainedGeometry = (Object.keys(INSPECTOR_WHOLE_READING_GEOMETRY) as InspectorWholeReadingRef[])
    .filter(ref => INSPECTOR_WHOLE_READING_GEOMETRY[ref] !== "none" && ref !== "rules.tactic.reading.promotion_pressure@1");
  it.each(retainedGeometry)("%s keeps the actual old positive geometry recipe without source aliases", route => {
    let compared = 0;
    // Test-only positive selection against the unchanged old constructor. Every old-renderable
    // fixture is compared; a zero population refusing its old board form is not a source failure.
    const fens = [...new Set([...INSPECTOR_FIXTURE_FENS, ...inspectorFixtureEdges().flatMap(edge => [edge.beforeFen, edge.afterFen]),
      "r3k3/8/8/8/8/8/1P6/B3K3 w - - 0 1"])];
    for (const fen of fens) {
      const value = source(route, fen);
      let output: ComponentValue | readonly ComponentValue[];
      try { output = originalPositiveGeometry(route, value); } catch (error) { if (error instanceof TypeError) continue; throw error; }
      const oldComponents: readonly ComponentValue[] = Array.isArray(output) ? output : [output as ComponentValue];
      const prior = oldComponents.filter(component => component.id === "square_set" || component.id === "relation_overlay");
      expect(prior).toHaveLength(1);
      const current = build(value).components.filter(component => component.id === "square_set" || component.id === "relation_overlay");
      expect(current, fen).toEqual(prior);
      compared++;
    }
    expect(compared, `No genuine old positive geometry was reached for ${route}`).toBeGreaterThan(0);
  });

  it.each([false, true])("the current promotion-pressure ref retains actual pawn/promotion witnesses directly, black=%s", black => {
    // The source belongs to the player who just moved, not the current side to move.
    const value = source("rules.tactic.reading.promotion_pressure@1", mirror("7k/P7/8/8/8/8/8/7K b - - 0 1", black));
    const reading = value.payload as PromotionPressureReading;
    expect(reading.pawns.length).toBeGreaterThan(0);
    const current = build(value), squares = current.components[1]!;
    if (squares.id !== "square_set") throw new Error("Missing actual promotion witnesses");
    expect(squares.operand.squares).toEqual([...new Set(reading.pawns.flatMap(pawn => [pawn.pawn.square, pawn.promotionSquare]))]);
    expect(current.statement.operand.operands).toEqual({ pawns: reading.pawns.map(pawn => ({
      pawn: { square: pawn.pawn.square, piece: { color: pawn.pawn.piece.color, role: pawn.pawn.piece.role } },
      promotion: pawn.promotionSquare, distance: pawn.distance, blockers: pawn.blockers.length,
    })) });
    expect(squares.operand.caption).toEqual(current.statement.operand);
    expect(squares.operand.owner.factRef).toBe(`sha256:${evidenceValueReceipt(value).payloadDigest}`);
  });

  it.each([false, true])("in-check trapping/pass-threat unavailability is never calculated zero, black=%s", black => {
    for (const [route, reason] of [["rules.tactic.reading.trapped_piece@1", "trapped_while_in_check"],
      ["rules.tactic.consequence.threat@1", "pass_while_in_check"]] as const) {
      const value = source(route, mirror(CHECK, black));
      expect((value.payload as TrappedPieceReading | ThreatResult).kind).toBe("abstained");
      const result = build(value);
      expect(result.components.map(component => component.id)).toEqual(["fact_statement"]);
      expect(result.statement.operand.operands).toEqual({ sourceProjection: route, state: "not_evaluated", reason });
      expect(result.statement.operand.operands).not.toHaveProperty("count");
      expect(result.text).toContain("not evaluated"); expect(result.text).toContain("not a zero result");
      const calculated = build(source(route, mirror(BARE, black)));
      expect(calculated.statement.operand.operands).toEqual({ sourceProjection: route, state: "empty", count: 0 });
      expect(calculated.text).not.toContain("not evaluated");
      expect(() => assertPresentationSourceRetention(value, calculated.components, FULL2)).toThrow();
    }
  });

  it.each([false, true])("zero contact edges preserve positive connected-passers evidence, black=%s", black => {
    const value = source("rules.pawn.reading.contacts@1", mirror("7k/8/8/3PP3/8/8/8/K7 w - - 0 1", black));
    const reading = value.payload as PawnContactsReading;
    expect(reading.contacts).toEqual([]);
    expect(reading.passed.filter(pawn => pawn.passed)).toHaveLength(2);
    expect(reading.connectedPassedPairs).toHaveLength(1);
    const result = build(value);
    expect(result.components.map(component => component.id)).toEqual(["fact_statement"]);
    expect(result.statement.operand.operands).toEqual({ contacts: 0, directedContacts: [], locks: 0, passed: 2, connectedPassedPairs: 1 });
    expect(result.text).toContain("2 passed pawns"); expect(result.text).toContain("1 connected passed pair");
    expect(result.statement.operand.rendererId).toBe("play.pawn_contacts@1");
  });

  it.each([false, true])("positive already-occupied back rank has no invented zero-edge move, black=%s", black => {
    const value = source("rules.tactic.reading.back_rank@1", mirror("6k1/8/8/8/8/8/5PPP/r4BK1 w - - 0 1", black));
    const reading = value.payload as BackRankReading;
    expect(reading.susceptible.length).toBeGreaterThan(0);
    const heavy = reading.susceptible.flatMap(king => king.accessingHeavyPieces);
    expect(heavy.length).toBeGreaterThan(0);
    expect(heavy.every(piece => piece.square === piece.fileTarget)).toBe(true);
    const result = build(value);
    expect(result.components.map(component => component.id)).toEqual(["fact_statement"]);
    expect(result.statement.operand.rendererId).toBe("play.back_rank@1");
    expect(result.text).toContain("already occupies"); expect(result.text).not.toMatch(/can reach|can move|contains 0/u);
  });

  it.each([false, true])("mixed destination availability retains both original colors and counts, black=%s", black => {
    const value = source("rules.mobility.reading.piece_destinations@1", mirror("4k3/8/8/8/8/8/4R1K1/8 b - - 0 1", black));
    const reading = value.payload as PieceDestinationsReading;
    expect(reading.colors.map(color => color.kind).sort()).toEqual(["available", "unavailable"]);
    const result = build(value);
    expect(result.statement.operand.rendererId).toBe("inspector.piece_destination_states@1");
    expect(result.statement.operand.operands).toEqual({ colors: reading.colors.map(color => color.kind === "unavailable"
      ? { color: color.color, kind: color.kind, reason: color.reason }
      : { color: color.color, kind: color.kind, pieces: color.pieces.length, legal: color.pieces.reduce((n, piece) => n + piece.legal.length, 0),
        localNonLosing: color.pieces.reduce((n, piece) => n + piece.localNonLosing.length, 0) }) });
    expect(result.text).toContain("unavailable"); expect(result.text).not.toMatch(/safe move|zero result/u);
  });

  it("retention refuses copied sources, missing/extra components and foreign exact states", () => {
    const route = "rules.tactic.reading.ray_classification@1", value = source(route, INITIAL), result = build(value);
    expect(result.components).toHaveLength(2);
    for (const copy of [{ ...value }, JSON.parse(JSON.stringify(value))]) {
      expect(() => result.spec.construct(copy)).toThrow();
      expect(() => adapterComponentsForEvidence(result.spec, copy)).toThrow();
      expect(() => assertPresentationSourceRetention(copy, result.components, FULL2)).toThrow();
    }
    expect(() => result.spec.construct(source("rules.tactic.reading.rook_on_seventh@1", INITIAL))).toThrow();
    for (const altered of [result.components.slice(0, 1), result.components.slice(1), [...result.components, result.statement]]) {
      expect(() => assertPresentationSourceRetention(value, altered, FULL2)).toThrow();
    }
    const empty = build(source(route, BARE));
    expect(() => assertPresentationSourceRetention(value, empty.components, FULL2)).toThrow();
    expect(() => assertPresentationSourceRetention(source(route, BARE), result.components, FULL2)).toThrow();
  });

  it("recomputed retention refuses geometry, caption, owner and convention changes", () => {
    const value = source("rules.tactic.reading.ray_classification@1", INITIAL), result = build(value), square = result.components[1]!;
    if (square.id !== "square_set") throw new Error("Missing genuine ray squares");
    for (const operand of [
      { ...square.operand, squares: ["a1"] }, { ...square.operand, brush: "green" },
      { ...square.operand, caption: { ...square.operand.caption, renderedText: "Caller tactical claim" } },
      { ...square.operand, owner: { factRef: `sha256:${"0".repeat(64)}` } },
    ]) expect(() => assertPresentationSourceRetention(value, [result.statement, { id: "square_set", operand } as ComponentValue], FULL2)).toThrow();
    const destination = source("rules.mobility.reading.piece_destinations@1", INITIAL), positive = build(destination), relation = positive.components[1]!;
    if (relation.id !== "relation_overlay") throw new Error("Missing actual destination relation");
    expect(() => assertPresentationSourceRetention(destination, [positive.statement,
      { ...relation, operand: { ...relation.operand, edges: relation.operand.edges.slice(1) } }], FULL2)).toThrow();
    expect(() => assertPresentationSourceRetention(destination, [positive.statement,
      { ...relation, operand: { ...relation.operand, owner: { factRef: `sha256:${"0".repeat(64)}` } } }], FULL2)).toThrow();
    expect(() => assertPresentationSourceRetention(destination, [positive.statement,
      { ...relation, operand: { ...relation.operand, convention: { ...kit.declared(destination, "piece-geometry@1"), perspective: "white" } } }], FULL2)).toThrow();
  });

  it("the two renderer grammars refuse wrong source/state/reason/count and color availability combinations", () => {
    const value = source("rules.tactic.consequence.threat@1", CHECK), result = build(value);
    for (const operands of [
      { sourceProjection: "rules.tactic.consequence.threat@1", state: "empty", count: 1 },
      { sourceProjection: "rules.tactic.consequence.threat@1", state: "not_evaluated", reason: "trapped_while_in_check" },
      { sourceProjection: "rules.tactic.reading.rook_on_seventh@1", state: "not_evaluated", reason: "pass_while_in_check" },
      { sourceProjection: "rules.tactic.consequence.threat@2", state: "empty", count: 0 },
      { sourceProjection: "rules.tactic.consequence.threat@1", state: "not_evaluated", reason: "pass_while_in_check", count: 0 },
      { sourceProjection: "rules.tactic.reading.loose_piece@1", state: "empty", count: 0 },
    ]) {
      const wire = JSON.parse(JSON.stringify(result.statement)); wire.operand.operands = operands;
      expect(() => parseComponentValue(wire)).toThrow();
    }
    const destination = build(source("rules.mobility.reading.piece_destinations@1", BARE));
    for (const colors of [
      [{ color: "white", kind: "available", pieces: 0, legal: 0, localNonLosing: 0 }, { color: "white", kind: "available", pieces: 0, legal: 0, localNonLosing: 0 }],
      [{ color: "white", kind: "unavailable", reason: "invalid_turn_clone", legal: 0 }, { color: "black", kind: "available", pieces: 0, legal: 0, localNonLosing: 0 }],
      [{ color: "white", kind: "available", pieces: 1, legal: 0, localNonLosing: 1 }, { color: "black", kind: "available", pieces: 0, legal: 0, localNonLosing: 0 }],
    ]) {
      const wire = JSON.parse(JSON.stringify(destination.statement)); wire.operand.operands = { colors };
      expect(() => parseComponentValue(wire)).toThrow();
    }
  });

  it("only the finite accepted exact Full2 whole-reading conditions may choose geometry", () => {
    const value = source("rules.tactic.reading.ray_classification@1", INITIAL), result = build(value);
    expect(Object.keys(INSPECTOR_WHOLE_READING_GEOMETRY)).toHaveLength(17);
    expect(inspectorWholeReadingComponents(value, kit)).toEqual(result.components);
    for (const entry of [
      { ...result.spec, consumer: { id: "module.full_inspector", version: 1 } },
      { ...result.spec, consumer: { id: "module.postcommit_nudge", version: 2 } },
      { ...result.spec, projection: { ...result.spec.projection, version: 2 } },
      { ...result.spec, composition: { ...result.spec.composition!, members: result.spec.composition!.members.map((member, index) => index === 0
        ? { ...member, when: "inspector_whole_reading_has_geometry" as const } : member) } },
    ]) expect(() => adapterComponentsForEvidence(entry, value)).toThrow();
  });
});
