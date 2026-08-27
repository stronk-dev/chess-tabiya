// DISPOSABLE research harness — D1631–D1636. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  BREADTH_EVENT_PROJECTION_IDS,
  CASTLING_EVENT_PROJECTION_IDS,
  EVIDENCE_CONTRACT_DECLARATIONS,
  PRIMARY_EVIDENCE_MANIFEST,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  TACTICAL_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
  backRankReading,
  candidateMajorityReading,
  castlingLegality,
  castlingRights,
  compileEvidenceManifest,
  declareBackRankEvidence,
  declareCandidateMajorityEvidence,
  declareCastlingLegalityEvidence,
  declareCastlingRightsEvidence,
  declareDevelopmentReadingEvidence,
  declareDiscoveredLatencyEvidence,
  declareForkSurvivalEvidence,
  declareKingZoneReadingEvidence,
  declareLegalExchangeEvidence,
  declareLoosePieceEvidence,
  declareMateInOneEvidence,
  declareMaterialRoleReadingEvidence,
  declareMobilityReadingEvidence,
  declarePawnConnectivityEvidence,
  declarePawnContactsEvidence,
  declarePromotionPressureEvidence,
  declareRayClassificationEvidence,
  declareRookOnSeventhEvidence,
  declareSpaceEvidence,
  declareSquareControlReadingEvidence,
  declareThreatEvidence,
  declareTrappedPieceEvidence,
  developmentReading,
  discoveredLatencyReading,
  exactLegalMoves,
  forkSurvivesReply,
  kingZoneReading,
  legalExchange,
  localSemanticEvents,
  loosePieceReading,
  mateInOne,
  materialRoleSignatureReading,
  pawnConnectivityReading,
  pawnContactsReading,
  pieceDestinationsReading,
  promotionPressureReading,
  rayClassificationReading,
  replyBreadth,
  rookOnSeventhReading,
  spaceReading,
  squareControlReading,
  threats,
  trappedPieceReading,
  type DeclaredEvidence,
  type DoubleAttackEvent,
  type EvidenceContractDeclarations,
} from "@chess-tabiya/runtime";

import { candidateFeatureVector } from "../../apps/server/src/candidate-evidence.js";
import {
  DERIVED_EXCHANGE_EVENT_PROJECTION_IDS,
  DERIVED_TACTIC_EVENT_PROJECTION_IDS,
  TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ENGINE = Object.freeze({
  id: "stockfish-play", name: "Stockfish", version: "18", seedHonored: true,
  searchBound: Object.freeze({ kind: "depth" as const, value: 8 }),
});
const LOCAL_IDS = new Set<string>([
  ...TACTICAL_COLLECTOR_PROJECTION_IDS,
  ...BREADTH_COLLECTOR_PROJECTION_IDS,
]);
const LOCAL_EVENT_IDS = Object.freeze([
  ...STRUCTURAL_EVENT_PROJECTION_IDS,
  ...TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS,
  ...TRANSITION_EVENT_PROJECTION_IDS,
  ...TACTICAL_EVENT_PROJECTION_IDS,
  ...CASTLING_EVENT_PROJECTION_IDS,
  ...DERIVED_EXCHANGE_EVENT_PROJECTION_IDS,
  ...DERIVED_TACTIC_EVENT_PROJECTION_IDS,
  ...BREADTH_EVENT_PROJECTION_IDS,
  "rules.tactic.event.defender_removed",
  "rules.tactic.event.defender_duty_relocated",
]);
const CANDIDATE_READING_IDS = Object.freeze([
  "rules.castling.reading.rights", "rules.castling.reading.legality",
  "rules.tactic.reading.loose_piece", "rules.tactic.reading.ray_classification",
  "rules.tactic.consequence.threat", "rules.structural.reading.pawn_connectivity",
  "rules.phase.development", "rules.tactic.reading.rook_on_seventh",
  "rules.structural.reading.space", "rules.tactic.reading.discovered_latency",
  "rules.tactic.reading.trapped_piece", "rules.tactic.reading.back_rank",
  "rules.tactic.consequence.mate_in_one", "derived.tactic.promotion_pressure",
  "rules.square.reading.control", "rules.mobility.reading.piece_destinations",
  "rules.pawn.reading.contacts", "rules.pawn.reading.candidate_majority",
  "derived.material.reading.role_signature", "rules.king.reading.zone_state",
  "rules.exchange.predicate.legal_exchange", "derived.tactic.fork_survives_reply",
]);

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function after(fen: string, uci: string): string {
  const board = position(fen);
  const move = parseUci(uci);
  if (move === undefined || !isNormal(move) || !board.isLegal(move)) throw new TypeError(`bad fixture ${uci}`);
  board.play(move);
  return makeFen(board.toSetup());
}

function packetStatus(fen: string): "playable" | "checkmate" | "stalemate" {
  const board = position(fen);
  const legal = exactLegalMoves(fen);
  if (legal.length > 0) return "playable";
  return board.isCheckmate() ? "checkmate" : "stalemate";
}

type Adjudication = "insufficient_material" | "fifty_move" | "threefold" | undefined;
function adjudication(fen: string, repetitionCount: number): Adjudication {
  const board = position(fen);
  if (board.isInsufficientMaterial()) return "insufficient_material";
  if (board.halfmoves >= 100) return "fifty_move";
  if (repetitionCount >= 3) return "threefold";
  return undefined;
}

function digest(parts: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

function sourceFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return entry.name === "dist" || entry.name === "node_modules" ? [] : sourceFiles(path);
    return entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".svelte")) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

function packetKey(input: { fen: string; manifest: string; legal: string; move: string; compiler: number; scope: string }): string {
  return digest([input.fen, input.manifest, input.legal, input.move, input.compiler, input.scope]);
}

function providerKey(input: { provider: string; model: string; startFen: string; history: readonly string[]; bound: string }): string {
  return digest([input.provider, input.model, input.startFen, input.history, input.bound]);
}

function policyKey(input: { packetId: string; providerReceipt: string; profile: string; seed: number; policy: string }): string {
  return digest([input.packetId, input.providerReceipt, input.profile, input.seed, input.policy]);
}

function badPacketDeclarations(): EvidenceContractDeclarations {
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze([
      ...EVIDENCE_CONTRACT_DECLARATIONS.producers,
      Object.freeze({
        id: "derived.candidate", version: 1, plane: "derived" as const,
        implementation: "candidatePopulation", availability: "local" as const, latency: "sync" as const,
        outputs: Object.freeze([Object.freeze({
          id: "derived.candidate.event_population", version: 1,
          producer: Object.freeze({ id: "derived.candidate", version: 1 }),
          role: "reading" as const, plane: "derived" as const,
          payloadType: "CandidateEventPopulation",
          semantics: "Complete legal rows retaining heterogeneous declared evidence.",
          operands: Object.freeze(["beforeFen", "candidates"]),
          signs: Object.freeze(["state" as const]), grounding: "declared_convention" as const,
          exactness: "convention" as const, confidence: "exact" as const,
          abstention: Object.freeze({ possible: false, reasons: Object.freeze([]) }),
          answerContent: Object.freeze(["fact" as const, "candidate_moves" as const]),
          forms: Object.freeze(["machine_condition" as const]), dependsOn: Object.freeze([]),
          derivation: Object.freeze({ inputs: Object.freeze([Object.freeze({ id: "rules.mobility.reading.legal_moves", version: 1 })]) }),
          limitations: Object.freeze(["Internal only."]),
        })]),
      }),
    ]),
  });
}

const evidenceRef = (id: string) => Object.freeze({ id, version: 1 });

function amendedPacketDeclarations(): EvidenceContractDeclarations {
  const packet = evidenceRef("derived.candidate.event_population");
  const producer = evidenceRef("derived.candidate");
  const consumers = EVIDENCE_CONTRACT_DECLARATIONS.consumers.map((consumer) => {
    if (consumer.id !== "research.semantic_selection" && consumer.id !== "opponent.selection") return consumer;
    return Object.freeze({
      ...consumer,
      accepts: Object.freeze([...consumer.accepts, packet]),
      answerContent: Object.freeze([...new Set([...consumer.answerContent, "candidate_moves" as const])]),
    });
  });
  const adapters = ["research.semantic_selection", "opponent.selection"].map((consumerId, index) => {
    const consumer = consumers.find((candidate) => candidate.id === consumerId)!;
    return Object.freeze({
      id: `adapter.${consumerId}.candidate_packet`, version: 1,
      implementation: consumer.implementation,
      producer, projection: packet,
      consumer: evidenceRef(consumerId),
      timing: Object.freeze(["analysis" as const]),
      roles: Object.freeze(["operator" as const]),
      sessions: consumer.sessions,
      forms: Object.freeze(["machine_condition" as const]),
      answerContent: Object.freeze(["fact" as const, "candidate_moves" as const]),
      latency: consumer.latency,
      budget: consumer.budget,
    });
  });
  const legal = evidenceRef("rules.mobility.reading.legal_moves");
  const events = LOCAL_EVENT_IDS.map(evidenceRef);
  const readings = CANDIDATE_READING_IDS.map(evidenceRef);
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    consumers: Object.freeze(consumers),
    adapters: Object.freeze([...EVIDENCE_CONTRACT_DECLARATIONS.adapters, ...adapters]),
    producers: Object.freeze([
      ...EVIDENCE_CONTRACT_DECLARATIONS.producers,
      Object.freeze({
        id: "derived.candidate", version: 1, plane: "derived" as const,
        implementation: "candidatePopulation", availability: "local" as const, latency: "sync" as const,
        outputs: Object.freeze([Object.freeze({
          id: "derived.candidate.event_population", version: 1, producer,
          role: "reading" as const, plane: "derived" as const,
          payloadType: "CandidateEventPopulation",
          semantics: "Complete exact legal-move rows plus the literal sealed local evidence emitted for each child under the named scope and conventions.",
          operands: Object.freeze(["id", "beforeFen", "scope", "legalConvention", "moveIdentityConvention", "manifestDigest", "compilerVersion", "legalMoves", "candidates", "terminal"]),
          signs: Object.freeze(["state" as const]), grounding: "declared_convention" as const,
          exactness: "convention" as const, confidence: "exact" as const,
          abstention: Object.freeze({ possible: true, reasons: Object.freeze(["input_abstained"]) }),
          answerContent: Object.freeze(["fact" as const, "candidate_moves" as const]),
          forms: Object.freeze(["list" as const, "panel" as const, "machine_condition" as const]),
          dependsOn: Object.freeze([]),
          derivation: Object.freeze({ anyOf: Object.freeze([
            Object.freeze([legal, ...events]),
            Object.freeze([legal, ...readings]),
            Object.freeze([legal, ...events, ...readings]),
          ]) }),
          limitations: Object.freeze(["Internal population only; no quality, rank, likelihood, recommendation, grade or personality."]),
        })]),
      }),
    ]),
  });
}

function repairedDeclaredValues(beforeFen: string, moveUci: string, afterFen: string): readonly DeclaredEvidence<unknown>[] {
  const readings: DeclaredEvidence<unknown>[] = [
    declareCastlingRightsEvidence(castlingRights(afterFen)),
    ...castlingLegality(afterFen).map(declareCastlingLegalityEvidence),
    declareLoosePieceEvidence(loosePieceReading(afterFen)),
    declareRayClassificationEvidence(rayClassificationReading(afterFen)),
    declareThreatEvidence(threats(afterFen)),
    declarePawnConnectivityEvidence(pawnConnectivityReading(afterFen)),
    declareDevelopmentReadingEvidence(developmentReading(afterFen)),
    declareRookOnSeventhEvidence(rookOnSeventhReading(afterFen)),
    declareSpaceEvidence(spaceReading(afterFen)),
    declareDiscoveredLatencyEvidence(discoveredLatencyReading(afterFen)),
    declareTrappedPieceEvidence(trappedPieceReading(afterFen)),
    declareBackRankEvidence(backRankReading(afterFen)),
    declareMateInOneEvidence(mateInOne(afterFen)),
    declarePromotionPressureEvidence(promotionPressureReading(afterFen)),
    declareSquareControlReadingEvidence(squareControlReading(afterFen)),
    declareMobilityReadingEvidence(pieceDestinationsReading(afterFen)),
    declarePawnContactsEvidence(pawnContactsReading(afterFen)),
    declareCandidateMajorityEvidence(candidateMajorityReading(afterFen)),
    declareMaterialRoleReadingEvidence(materialRoleSignatureReading(afterFen)),
    declareKingZoneReadingEvidence(kingZoneReading(afterFen)),
    ...localSemanticEvents(beforeFen, moveUci, afterFen)
      .filter((event) => LOCAL_IDS.has(event.projection.id))
      .map((event) => event.evidence),
  ];
  const exchange = legalExchange(beforeFen, moveUci);
  if (exchange !== undefined) readings.push(declareLegalExchangeEvidence(exchange));
  const doubleAttack = localSemanticEvents(beforeFen, moveUci, afterFen)
    .find((event) => event.projection.id === "rules.tactic.event.double_attack");
  if (doubleAttack !== undefined) {
    readings.push(declareForkSurvivalEvidence(forkSurvivesReply(
      doubleAttack.operands as DoubleAttackEvent,
      replyBreadth(beforeFen, moveUci),
    )));
  }
  return Object.freeze(readings);
}

type WhiteScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black"; readonly distance: number };
type RootScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly outcome: "win" | "loss"; readonly distance: number };

function toRootScore(score: WhiteScore, root: "white" | "black"): RootScore {
  if (score.kind === "centipawns") {
    if (!Number.isFinite(score.value)) throw new TypeError("non-finite cp");
    return Object.freeze({ kind: "centipawns", value: root === "white" ? score.value : -score.value });
  }
  if (!Number.isSafeInteger(score.distance) || score.distance <= 0) throw new TypeError("mate distance must be a positive integer");
  return Object.freeze({ kind: "mate", outcome: score.side === root ? "win" : "loss", distance: score.distance });
}

type CandidateLoss =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly relation: "equal" | "slower_win" | "forfeits_forced_win" | "faster_loss"; readonly distance: number };

function candidateLosses(input: readonly { move: string; score: RootScore; engine: string; bound: string }[]):
  | { readonly kind: "compared"; readonly losses: Readonly<Record<string, CandidateLoss>> }
  | { readonly kind: "abstained"; readonly reason: "mixed_domain" | "measurement_mismatch" } {
  if (new Set(input.map((row) => `${row.engine}\0${row.bound}`)).size !== 1) return { kind: "abstained", reason: "measurement_mismatch" };
  if (new Set(input.map((row) => row.score.kind)).size !== 1) return { kind: "abstained", reason: "mixed_domain" };
  const losses: Record<string, CandidateLoss> = {};
  if (input[0]?.score.kind === "centipawns") {
    const best = Math.max(...input.map((row) => (row.score as Extract<RootScore, { kind: "centipawns" }>).value));
    for (const row of input) losses[row.move] = { kind: "centipawns", value: best - (row.score as Extract<RootScore, { kind: "centipawns" }>).value };
    return { kind: "compared", losses: Object.freeze(losses) };
  }
  const mates = input.map((row) => ({ ...row, score: row.score as Extract<RootScore, { kind: "mate" }> }));
  const winning = mates.filter((row) => row.score.outcome === "win");
  const best = winning.length > 0
    ? [...winning].sort((a, b) => a.score.distance - b.score.distance || a.move.localeCompare(b.move))[0]!
    : [...mates].sort((a, b) => b.score.distance - a.score.distance || a.move.localeCompare(b.move))[0]!;
  for (const row of mates) {
    if (row.move === best.move) losses[row.move] = { kind: "mate", relation: "equal", distance: 0 };
    else if (best.score.outcome === "win" && row.score.outcome === "win") losses[row.move] = { kind: "mate", relation: "slower_win", distance: row.score.distance - best.score.distance };
    else if (best.score.outcome === "win") losses[row.move] = { kind: "mate", relation: "forfeits_forced_win", distance: row.score.distance };
    else losses[row.move] = { kind: "mate", relation: "faster_loss", distance: best.score.distance - row.score.distance };
  }
  return { kind: "compared", losses: Object.freeze(losses) };
}

describe("D1631 terminal population and adjudication", () => {
  it("keeps legal candidates for insufficient material, fifty-move, and repetition adjudications", () => {
    const insufficient = "8/8/8/8/8/8/4k3/6K1 w - - 0 1";
    const fifty = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 100 51";
    const repeated = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 7 9";
    expect(position(insufficient).isInsufficientMaterial()).toBe(true);
    expect(exactLegalMoves(insufficient).length).toBeGreaterThan(0);
    expect(packetStatus(insufficient)).toBe("playable");
    expect(adjudication(insufficient, 1)).toBe("insufficient_material");
    expect(packetStatus(fifty)).toBe("playable");
    expect(adjudication(fifty, 1)).toBe("fifty_move");
    expect(packetStatus(repeated)).toBe("playable");
    expect(adjudication(repeated, 3)).toBe("threefold");
  });

  it("permits zero rows only for checkmate and stalemate", () => {
    const mate = "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1";
    const stale = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
    expect([exactLegalMoves(mate).length, exactLegalMoves(stale).length]).toEqual([0, 0]);
    expect([packetStatus(mate), packetStatus(stale)]).toEqual(["checkmate", "stalemate"]);
  });
});

describe("D1632 three cache identities", () => {
  it("shares facts across equal full FEN while isolating history-conditioned provider and policy results", () => {
    const factual = { fen: START, manifest: "manifest-a", legal: "legal@1", move: "move@1", compiler: 1, scope: "events" };
    const packetA = packetKey(factual);
    const packetB = packetKey(factual);
    expect(packetA).toBe(packetB);
    const providerA = providerKey({ provider: "maia", model: "1900", startFen: START, history: ["g1f3", "g8f6", "f3g1", "f6g8"], bound: "multipv:20" });
    const providerB = providerKey({ provider: "maia", model: "1900", startFen: START, history: [], bound: "multipv:20" });
    expect(providerA).not.toBe(providerB);
    expect(policyKey({ packetId: packetA, providerReceipt: providerA, profile: "solid@1", seed: 7, policy: "policy-a" }))
      .not.toBe(policyKey({ packetId: packetB, providerReceipt: providerB, profile: "solid@1", seed: 7, policy: "policy-a" }));
  });
});

describe("D1633 executable operation census", () => {
  it("proves the packet/vector are not wired into the application or opponent selector at HEAD", () => {
    const roots = [join(process.cwd(), "apps"), join(process.cwd(), "packages")];
    const files = roots.flatMap(sourceFiles);
    const candidateCallers = files.filter((path) => /candidateFeatureVector\s*\(/u.test(readFileSync(path, "utf8")));
    const selectorCallers = files.filter((path) => /selectLocalSemanticEvidence\s*\(/u.test(readFileSync(path, "utf8")));
    expect(candidateCallers.map((path) => relative(process.cwd(), path))).toEqual(["apps/server/src/candidate-evidence.ts"]);
    expect(selectorCallers.map((path) => relative(process.cwd(), path)).sort()).toEqual([
      "apps/server/src/semantic-evidence-check.ts",
      "packages/runtime/src/semantic-evidence.ts",
    ]);
    const application = readFileSync(join(process.cwd(), "apps/server/src/application.ts"), "utf8");
    const opponent = readFileSync(join(process.cwd(), "apps/server/src/opponent-selector.ts"), "utf8");
    expect(application).not.toMatch(/CandidatePopulation/u);
    expect(opponent).not.toMatch(/CandidatePopulation|candidateFeatureVector/u);
    expect(opponent).toMatch(/readonly #cache = new Map<string, Promise<OpponentSelection>>\(\)/u);
  });
});

describe("D1634 F1 aggregate boundary", () => {
  it("rejects the RFC's literal wrapper tuple while the constituent manifest remains valid", () => {
    expect(() => compileEvidenceManifest(badPacketDeclarations())).toThrow(/derived projection exceeds/u);
    expect(compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS).digest).toBe(PRIMARY_EVIDENCE_MANIFEST.digest);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((row) => row.id === "derived.candidate.event_population")).toBe(false);
  });

  it("executes the amended scope-wide wrapper tuple against the shipped compiler", () => {
    expect(() => compileEvidenceManifest(amendedPacketDeclarations())).not.toThrow();
  });
});

describe("D1635 complete candidate evidence closure", () => {
  it("pins the code-derived 47-event and 22-reading identity closures", () => {
    expect(new Set(LOCAL_EVENT_IDS).size).toBe(47);
    expect(new Set(CANDIDATE_READING_IDS).size).toBe(22);
    expect(CANDIDATE_READING_IDS.slice(-2)).toEqual([
      "rules.exchange.predicate.legal_exchange",
      "derived.tactic.fork_survives_reply",
    ]);
  });

  it("preserves the current multiset on ordinary, capture, double-attack, and abstention rows", () => {
    const fixtures = [
      { name: "ordinary", before: START, move: "e2e4" },
      { name: "capture", before: "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1", move: "e4d5" },
      { name: "double", before: "8/2k5/3r4/8/3N4/8/8/4K3 w - - 0 1", move: "d4b5" },
      { name: "abstention", before: "4k3/8/8/8/8/8/Q7/4K3 w - - 0 1", move: "a2e6" },
    ];
    for (const fixture of fixtures) {
      const child = after(fixture.before, fixture.move);
      const current = candidateFeatureVector({ beforeFen: fixture.before, engine: ENGINE, candidates: [{ moveUci: fixture.move, scoreCp: 0 }] }).candidates[0]!.results
        .map((value) => `${value.source.id}@${value.source.version}`).sort();
      const repaired = repairedDeclaredValues(fixture.before, fixture.move, child)
        .map((value) => `${value.projection.id}@${value.projection.version}`).sort();
      expect(repaired, fixture.name).toEqual(current);
      if (fixture.name === "capture") expect(repaired).toContain("rules.exchange.predicate.legal_exchange@1");
      if (fixture.name === "double") expect(repaired).toContain("derived.tactic.fork_survives_reply@1");
      if (fixture.name === "abstention") {
        const threat = repairedDeclaredValues(fixture.before, fixture.move, child).find((value) => value.projection.id === "rules.tactic.consequence.threat");
        expect(threat?.payload).toMatchObject({ kind: "abstained", reason: "pass_while_in_check" });
      }
    }
  });
});

describe("D1636 White source and root-side typed loss", () => {
  it("projects both root colors and refuses invalid mate distance", () => {
    expect(toRootScore({ kind: "centipawns", value: 80 }, "white")).toEqual({ kind: "centipawns", value: 80 });
    expect(toRootScore({ kind: "centipawns", value: 80 }, "black")).toEqual({ kind: "centipawns", value: -80 });
    expect(toRootScore({ kind: "mate", side: "black", distance: 3 }, "black")).toEqual({ kind: "mate", outcome: "win", distance: 3 });
    expect(() => toRootScore({ kind: "mate", side: "white", distance: 0 }, "white")).toThrow(/positive integer/u);
    expect(() => toRootScore({ kind: "mate", side: "white", distance: 1.5 }, "white")).toThrow(/positive integer/u);
  });

  it("compares cp and mate sets without converting domains", () => {
    expect(candidateLosses([
      { move: "a", score: { kind: "centipawns", value: 30 }, engine: "sf18", bound: "d8" },
      { move: "b", score: { kind: "centipawns", value: -20 }, engine: "sf18", bound: "d8" },
    ])).toEqual({ kind: "compared", losses: { a: { kind: "centipawns", value: 0 }, b: { kind: "centipawns", value: 50 } } });
    expect(candidateLosses([
      { move: "fast", score: { kind: "mate", outcome: "win", distance: 3 }, engine: "sf18", bound: "d8" },
      { move: "slow", score: { kind: "mate", outcome: "win", distance: 7 }, engine: "sf18", bound: "d8" },
      { move: "loses", score: { kind: "mate", outcome: "loss", distance: 9 }, engine: "sf18", bound: "d8" },
    ])).toMatchObject({ kind: "compared", losses: {
      fast: { relation: "equal", distance: 0 },
      slow: { relation: "slower_win", distance: 4 },
      loses: { relation: "forfeits_forced_win", distance: 9 },
    } });
    expect(candidateLosses([
      { move: "cp", score: { kind: "centipawns", value: 10 }, engine: "sf18", bound: "d8" },
      { move: "mate", score: { kind: "mate", outcome: "win", distance: 3 }, engine: "sf18", bound: "d8" },
    ])).toEqual({ kind: "abstained", reason: "mixed_domain" });
    expect(candidateLosses([
      { move: "a", score: { kind: "centipawns", value: 10 }, engine: "sf18", bound: "d8" },
      { move: "b", score: { kind: "centipawns", value: 9 }, engine: "sf18", bound: "d10" },
    ])).toEqual({ kind: "abstained", reason: "measurement_mismatch" });
  });
});
