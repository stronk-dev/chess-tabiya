// DISPOSABLE research harness — D1652–D1658. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { opposite } from "chessops/util";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  PRIMARY_EVIDENCE_MANIFEST,
  compileEvidenceManifest,
  declareExactLegalMovesEvidence,
  declareLegalExchangeEvidence,
  declareThreatEvidence,
  exactLegalMoveMap,
  exactLegalMoves,
  threats,
  type DeclaredEvidence,
  type EvidenceContractDeclarations,
  type ProjectionDeclaration,
} from "@chess-tabiya/runtime";

type RequestConvention =
  | { readonly kind: "history_conditioned"; readonly startFen: string; readonly historyUci: readonly string[] }
  | { readonly kind: "exact_fen"; readonly fen: string };

interface ProviderIdentity {
  readonly provider: "stockfish" | "maia";
  readonly engineId: string;
  readonly version: string;
  readonly modelId?: string;
  readonly containerDigest?: string;
  readonly generation: number;
}

interface StockfishRootRecord {
  readonly requestFen: string;
  readonly bound: { readonly kind: "depth"; readonly value: number };
  readonly requestedWidth: "all_legal";
  readonly receipt: ProviderIdentity;
  readonly rows: readonly {
    readonly moveUci: string;
    readonly reachedDepth: number;
    readonly score: { readonly kind: "cp" | "mate"; readonly value: number };
    readonly pv: readonly string[];
  }[];
}

interface MaiaPolicyRecord {
  readonly position: RequestConvention;
  readonly receipt: ProviderIdentity;
  readonly appliedBand: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly candidates: readonly { readonly moveUci: string; readonly rank: number; readonly mass?: number }[];
}

interface NamedTarget {
  readonly sourceFen: string;
  readonly passedFen: string;
  readonly attacker: Readonly<{ readonly color: string; readonly role: string; readonly square: string }>;
  readonly victim: Readonly<{ readonly color: string; readonly role: string; readonly square: string }>;
  readonly captureUci: string;
  readonly threat: DeclaredEvidence<unknown>;
  readonly exchange: DeclaredEvidence<unknown>;
  readonly sourcePosition: DeclaredEvidence<unknown>;
}

type ImmediateTargetOutcome =
  | Readonly<{ readonly result: "preserved"; readonly cause: "preserved" }>
  | Readonly<{ readonly result: "removed"; readonly cause: "attacker_captured" | "target_captured" | "target_moved" | "capture_illegal" | "exchange_neutralized" }>
  | Readonly<{ readonly result: "identity_lost"; readonly cause: "identity_lost" }>;

type TargetProjectionId =
  | "derived.bounded_target.named_material_target"
  | "derived.bounded_target.immediate"
  | "derived.bounded_target.bounded_return";

type BoundedOperationResult =
  | Readonly<{ readonly kind: "evidence"; readonly item: DeclaredEvidence<unknown> }>
  | Readonly<{
      readonly kind: "abstained";
      readonly projection: Readonly<{ readonly id: TargetProjectionId; readonly version: 1 }>;
      readonly reason: "input_abstained" | "position_mismatch" | "target_mismatch" | "candidate_not_legal" | "budget_exhausted";
      readonly inputDigests: readonly string[];
      readonly visitedPositions?: number;
    }>;

function immediateOutcome(result: ImmediateTargetOutcome["result"], cause: ImmediateTargetOutcome["cause"]): ImmediateTargetOutcome {
  if (result === "preserved" && cause === "preserved") return Object.freeze({ result, cause });
  if (result === "identity_lost" && cause === "identity_lost") return Object.freeze({ result, cause });
  if (result === "removed" && ["attacker_captured", "target_captured", "target_moved", "capture_illegal", "exchange_neutralized"].includes(cause)) {
    return Object.freeze({ result, cause: cause as Extract<ImmediateTargetOutcome, { result: "removed" }>["cause"] });
  }
  throw new TypeError("impossible immediate target outcome");
}

function cappedOperationResult(projection: TargetProjectionId, inputDigests: readonly string[], visitedPositions: number): BoundedOperationResult {
  return Object.freeze({
    kind: "abstained",
    projection: Object.freeze({ id: projection, version: 1 }),
    reason: "budget_exhausted",
    inputDigests: Object.freeze([...inputDigests]),
    visitedPositions,
  });
}

function requireProjection<Id extends string>(evidence: DeclaredEvidence<unknown>, id: Id): DeclaredEvidence<unknown> & { readonly projection: { readonly id: Id; readonly version: 1 } } {
  if (evidence.projection.id !== id || evidence.projection.version !== 1) throw new TypeError(`expected ${id}@1`);
  return evidence as DeclaredEvidence<unknown> & { readonly projection: { readonly id: Id; readonly version: 1 } };
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function maiaRequestKey(input: Omit<MaiaPolicyRecord, "receipt" | "candidates">): string {
  return digest(input);
}

function stockfishRequestKey(input: Pick<StockfishRootRecord, "requestFen" | "bound" | "requestedWidth"> & { readonly requestedIdentity: Omit<ProviderIdentity, "generation"> }): string {
  return digest(input);
}

function verifyRootTable(record: StockfishRootRecord): void {
  const legal = exactLegalMoves(record.requestFen).map((move) => move.uci).sort();
  const rows = record.rows.map((row) => row.moveUci).sort();
  if (new Set(rows).size !== rows.length || legal.join("\0") !== rows.join("\0")) {
    throw new TypeError("root table is not set-equal to exact legal moves");
  }
  if (record.rows.some((row) => row.reachedDepth < record.bound.value)) {
    throw new TypeError("root table contains a short-depth row");
  }
}

function rawStockfishRecord(value: StockfishRootRecord): StockfishRootRecord {
  if (Object.keys(value).some((key) => /target|execution|opportunity/iu.test(key))) {
    throw new TypeError("raw Stockfish source contains a target interpretation");
  }
  verifyRootTable(value);
  return Object.freeze(value);
}

function deriveTargetCategory(raw: StockfishRootRecord, target: NamedTarget, candidateUci: string): Readonly<{
  raw: StockfishRootRecord;
  target: NamedTarget;
  candidateUci: string;
  category: "next_execution" | "second_opportunity" | "neither";
}> {
  return Object.freeze({ raw, target, candidateUci, category: "neither" });
}

function passFen(sourceFen: string): string {
  const position = Chess.fromSetup(parseFen(sourceFen).unwrap()).unwrap();
  position.turn = opposite(position.turn);
  position.epSquare = undefined;
  return makeFen(position.toSetup());
}

function namedTarget(threatEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>, sourcePosition: DeclaredEvidence<unknown>): NamedTarget {
  if (threatEvidence.projection.id !== "rules.tactic.consequence.threat" || exchangeEvidence.projection.id !== "rules.exchange.predicate.legal_exchange" || sourcePosition.projection.id !== "rules.mobility.reading.legal_moves") {
    throw new TypeError("named target requires the registered threat, exchange and source-position authorities");
  }
  const reading = threatEvidence.payload as ReturnType<typeof threats>;
  if (reading.kind !== "threats") throw new TypeError("abstained threat has no named material target");
  const exchange = exchangeEvidence.payload as NonNullable<(typeof reading.threats)[number]["exchange"]>;
  const found = reading.threats.find((item) =>
    item.exchange !== undefined
    && item.threatenedMove === exchange.captureUci
    && JSON.stringify(item.exchange) === JSON.stringify(exchange));
  if (found?.target === undefined || found.exchange === undefined) throw new TypeError("threat/exchange target identity does not join");
  const sourceFen = (sourcePosition.payload as ReturnType<typeof exactLegalMoveMap>).fen;
  if (passFen(sourceFen) !== exchange.beforeFen) throw new TypeError("source position does not produce the retained threat pass position");
  return Object.freeze({
    sourceFen,
    passedFen: exchange.beforeFen,
    attacker: Object.freeze({ ...exchange.capturer }),
    victim: Object.freeze({ ...exchange.captured }),
    captureUci: exchange.captureUci,
    threat: threatEvidence,
    exchange: exchangeEvidence,
    sourcePosition,
  });
}

function sourceFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return entry.name === "dist" || entry.name === "node_modules" ? [] : sourceFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

function confidenceGapDeclarations(): EvidenceContractDeclarations {
  const output: ProjectionDeclaration = Object.freeze({
    id: "derived.research.confidence_widening", version: 1,
    producer: Object.freeze({ id: "derived.research", version: 1 }),
    role: "reading", plane: "derived", payloadType: "ConfidenceWidening",
    semantics: "Prospective negative proving reported provider input cannot become exact.",
    operands: Object.freeze(["value"]), signs: Object.freeze(["state"]),
    grounding: "bounded_search", exactness: "measured", confidence: "exact",
    abstention: Object.freeze({ possible: true, reasons: Object.freeze(["input_abstained"]) }),
    answerContent: Object.freeze(["evaluation"]), forms: Object.freeze(["machine_condition"]),
    dependsOn: Object.freeze([]),
    derivation: Object.freeze({ inputs: Object.freeze([Object.freeze({ id: "live.stockfish.eval", version: 1 })]) }),
    limitations: Object.freeze(["Disposable false-green fixture."]),
    disposition: Object.freeze({ kind: "experimental", reason: "Disposable research only." }),
  });
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze([...EVIDENCE_CONTRACT_DECLARATIONS.producers, Object.freeze({
      id: "derived.research", version: 1, plane: "derived", implementation: "researchConfidenceGap",
      availability: "local", latency: "sync", outputs: Object.freeze([output]),
    })]),
  });
}

function amendedLocalTargetDeclarations(): EvidenceContractDeclarations {
  const derivedRef = Object.freeze({ id: "derived.bounded_target", version: 1 as const });
  const input = (id: string) => Object.freeze({ id, version: 1 as const });
  const disposed = Object.freeze({ kind: "inspector_only" as const, reason: "No learner consumer is admitted by the local collector RFC." });
  const common = {
    producer: derivedRef,
    plane: "derived" as const,
    confidence: "exact" as const,
    disposition: disposed,
  };
  const outputs: readonly ProjectionDeclaration[] = Object.freeze([
    Object.freeze({
      ...common,
      id: "derived.bounded_target.named_material_target", version: 1,
      role: "reading", payloadType: "NamedMaterialTarget",
      semantics: "Convention-grounded positive material-capture identity retained from threat, exchange and exact source-position evidence.",
      operands: Object.freeze(["convention", "sourceFen", "passedFen", "attacker", "victim", "captureUci", "threat", "exchange", "sourcePosition"]),
      signs: Object.freeze(["state", "threatened"]),
      grounding: "declared_convention", exactness: "convention",
      abstention: Object.freeze({ possible: true, reasons: Object.freeze(["input_abstained", "position_mismatch", "target_mismatch", "exchange_mismatch"]) }),
      answerContent: Object.freeze(["fact", "threat"]),
      forms: Object.freeze(["sentence", "list", "lit_squares", "arrows", "piece_halo", "machine_condition"]),
      dependsOn: Object.freeze([]),
      derivation: Object.freeze({ inputs: Object.freeze([input("rules.tactic.consequence.threat"), input("rules.exchange.predicate.legal_exchange"), input("rules.mobility.reading.legal_moves")]) }),
      limitations: Object.freeze(["One exact material capture; no intent, quality, plan, force or significance."]),
    }),
    Object.freeze({
      ...common,
      id: "derived.bounded_target.immediate", version: 1,
      role: "event", payloadType: "BoundedTargetImmediate",
      semantics: "Convention-grounded immediate preservation or removal of one named material target after one legal candidate.",
      operands: Object.freeze(["target", "candidateUci", "afterFen", "outcome"]),
      signs: Object.freeze(["preserved", "removed"]),
      grounding: "declared_convention", exactness: "convention",
      abstention: Object.freeze({ possible: true, reasons: Object.freeze(["input_abstained", "position_mismatch", "candidate_not_legal", "target_mismatch"]) }),
      answerContent: Object.freeze(["fact", "threat"]),
      forms: Object.freeze(["sentence", "timeline_marker", "lit_squares", "arrows", "piece_halo", "machine_condition"]),
      dependsOn: Object.freeze([]),
      derivation: Object.freeze({ inputs: Object.freeze([input("derived.bounded_target.named_material_target")]) }),
      limitations: Object.freeze(["One candidate and target; no ranking, evaluation, recommendation, intent or significance."]),
    }),
    Object.freeze({
      ...common,
      id: "derived.bounded_target.bounded_return", version: 1,
      role: "reading", payloadType: "BoundedTargetReturn",
      semantics: "Separate exists-exists return and exists-for-all-defences survival within the declared three-ply horizon.",
      operands: Object.freeze(["immediate", "horizonPlies", "visitedPositions", "reintroducedWithin3Ply", "reintroductionWitness", "preparationSurvivesEveryDefence", "everyDefenceWitness", "firstRefutation"]),
      signs: Object.freeze(["preserved", "removed", "enabled"]),
      grounding: "declared_convention", exactness: "convention",
      abstention: Object.freeze({ possible: true, reasons: Object.freeze(["input_abstained", "position_mismatch", "target_mismatch", "budget_exhausted"]) }),
      answerContent: Object.freeze(["fact", "threat"]),
      forms: Object.freeze(["sentence", "list", "timeline_marker", "lit_squares", "arrows", "machine_condition"]),
      dependsOn: Object.freeze([]),
      derivation: Object.freeze({ inputs: Object.freeze([input("derived.bounded_target.immediate")]) }),
      limitations: Object.freeze(["Horizon is three plies; no strategy or inevitability beyond it."]),
    }),
  ]);
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze([...EVIDENCE_CONTRACT_DECLARATIONS.producers, Object.freeze({
      id: derivedRef.id,
      version: derivedRef.version,
      plane: "derived" as const,
      implementation: "packages/runtime/src/bounded-target.ts",
      availability: "local" as const,
      latency: "background" as const,
      outputs,
    })]),
  });
}

function assertConfidenceDoesNotWiden(output: ProjectionDeclaration, inputs: readonly ProjectionDeclaration[]): void {
  if (inputs.some((input) => input.confidence === "reported") && output.confidence !== "reported") {
    throw new TypeError("derived confidence exceeds reported input");
  }
  if (inputs.every((input) => input.confidence === "not_applicable") && output.confidence !== "not_applicable") {
    throw new TypeError("derived confidence invents an applicable confidence");
  }
}

function inheritedLatency(inputs: readonly ("sync" | "interactive" | "background" | "offline")[]): "sync" | "interactive" | "background" | "offline" {
  const rank = { sync: 0, interactive: 1, background: 2, offline: 3 } as const;
  return [...inputs].sort((left, right) => rank[right] - rank[left])[0] ?? "sync";
}

interface Work { readonly key: string; readonly scope: string; readonly generation: number }
class BoundedWorkModel {
  readonly #maxActive: number;
  readonly #maxQueued: number;
  readonly #maxRetained: number;
  readonly active = new Map<string, Work>();
  readonly queued: Work[] = [];
  readonly retained = new Map<string, Work>();

  constructor(maxActive: number, maxQueued: number, maxRetained: number) {
    this.#maxActive = maxActive;
    this.#maxQueued = maxQueued;
    this.#maxRetained = maxRetained;
  }

  enqueue(work: Work): "active" | "queued" | "deduped" | "refused" {
    if (this.active.has(work.key) || this.queued.some((row) => row.key === work.key) || this.retained.has(work.key)) return "deduped";
    if (this.active.size < this.#maxActive) {
      this.active.set(work.key, work);
      return "active";
    }
    if (this.queued.length >= this.#maxQueued) return "refused";
    this.queued.push(work);
    return "queued";
  }

  complete(key: string, actualGeneration: number): "retained" | "stale" {
    const work = this.active.get(key);
    if (work === undefined) throw new TypeError("unknown active work");
    this.active.delete(key);
    if (work.generation !== actualGeneration) return "stale";
    this.retained.set(key, work);
    while (this.retained.size > this.#maxRetained) this.retained.delete(this.retained.keys().next().value!);
    return "retained";
  }

  cancelScope(scope: string): void {
    for (const [key, work] of this.active) if (work.scope === scope) this.active.delete(key);
    for (let index = this.queued.length - 1; index >= 0; index -= 1) if (this.queued[index]!.scope === scope) this.queued.splice(index, 1);
  }
}

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const STOCKFISH = Object.freeze({ provider: "stockfish" as const, engineId: "stockfish-play", version: "18", containerDigest: "sha256:stockfish", generation: 3 });
const MAIA = Object.freeze({ provider: "maia" as const, engineId: "maia-play", version: "2", modelId: "maia-1900", containerDigest: "sha256:maia", generation: 7 });

function rootRecord(fen: string, depth = 8): StockfishRootRecord {
  return Object.freeze({
    requestFen: fen,
    bound: Object.freeze({ kind: "depth", value: depth }),
    requestedWidth: "all_legal",
    receipt: STOCKFISH,
    rows: Object.freeze(exactLegalMoves(fen).map((move) => Object.freeze({
      moveUci: move.uci, reachedDepth: depth, score: Object.freeze({ kind: "cp" as const, value: 0 }), pv: Object.freeze([move.uci]),
    }))),
  });
}

describe("D1652 source and target derivation separation", () => {
  it("keeps raw Stockfish bytes generic and makes target meaning a retained derivation", () => {
    const fen = "r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1";
    const reading = threats(fen);
    expect(reading.kind).toBe("threats");
    const exchange = reading.kind === "threats" ? reading.threats.find((row) => row.threatenedMove === "a8a1")?.exchange : undefined;
    expect(exchange).toBeDefined();
    const target = namedTarget(declareThreatEvidence(reading), declareLegalExchangeEvidence(exchange!), declareExactLegalMovesEvidence(exactLegalMoveMap(fen)));
    const raw = rawStockfishRecord(rootRecord(START));
    expect(Object.keys(raw)).not.toContain("nextExecution");
    expect(deriveTargetCategory(raw, target, "e2e4")).toMatchObject({ raw, target, candidateUci: "e2e4" });
    expect(() => rawStockfishRecord({ ...raw, nextExecution: true } as unknown as StockfishRootRecord)).toThrow(/target interpretation/u);
  });
});

describe("D1653 generic Maia request identity", () => {
  it("does not alias equal boards reached through different histories or request conventions", () => {
    const common = { appliedBand: 1900, temperature: 0.8, topP: 0.92, requestedWidth: 8 };
    const historyA = maiaRequestKey({ ...common, position: { kind: "history_conditioned", startFen: START, historyUci: [] } });
    const historyB = maiaRequestKey({ ...common, position: { kind: "history_conditioned", startFen: START, historyUci: ["g1f3", "g8f6", "f3g1", "f6g8"] } });
    const exactA = maiaRequestKey({ ...common, position: { kind: "exact_fen", fen: START } });
    const exactB = maiaRequestKey({ ...common, position: { kind: "exact_fen", fen: START } });
    expect(new Set([historyA, historyB, exactA]).size).toBe(3);
    expect(exactA).toBe(exactB);
  });
});

describe("D1654 literal F1 confidence and latency", () => {
  it("reproduces the shipped confidence false-green and makes the repaired rule fail", () => {
    const declarations = confidenceGapDeclarations();
    expect(() => compileEvidenceManifest(declarations)).not.toThrow();
    const added = declarations.producers.at(-1)!.outputs[0]!;
    const input = PRIMARY_EVIDENCE_MANIFEST.projections.find((row) => row.id === "live.stockfish.eval")!;
    expect(() => assertConfidenceDoesNotWiden(added, [input])).toThrow(/exceeds reported/u);
  });

  it("inherits provider latency instead of deriving it from the output producer's availability", () => {
    const grade = PRIMARY_EVIDENCE_MANIFEST.producers.find((row) => row.id === "derived.grade")!;
    expect(grade.latency).toBe("sync");
    expect(inheritedLatency(["interactive", "sync"])).toBe("interactive");
  });
});

describe("amended local declaration image", () => {
  it("compiles after every derived row inherits the convention-grounded input floor", () => {
    expect(() => compileEvidenceManifest(amendedLocalTargetDeclarations())).not.toThrow();
  });

  it("closes observed-capture precedence and rejects impossible result/cause pairs", () => {
    expect(immediateOutcome("preserved", "preserved")).toEqual({ result: "preserved", cause: "preserved" });
    expect(immediateOutcome("removed", "attacker_captured")).toEqual({ result: "removed", cause: "attacker_captured" });
    expect(immediateOutcome("removed", "target_captured")).toEqual({ result: "removed", cause: "target_captured" });
    expect(immediateOutcome("identity_lost", "identity_lost")).toEqual({ result: "identity_lost", cause: "identity_lost" });
    expect(() => immediateOutcome("identity_lost", "attacker_captured")).toThrow(/impossible/u);
    expect(() => immediateOutcome("removed", "identity_lost")).toThrow(/impossible/u);
  });

  it("makes budget exhaustion a closed abstention with no partial facts", () => {
    const result = cappedOperationResult("derived.bounded_target.bounded_return", ["threat-digest", "candidate-digest"], 25_001);
    expect(result).toEqual({
      kind: "abstained",
      projection: { id: "derived.bounded_target.bounded_return", version: 1 },
      reason: "budget_exhausted",
      inputDigests: ["threat-digest", "candidate-digest"],
      visitedPositions: 25_001,
    });
    expect(result).not.toHaveProperty("reintroducedWithin3Ply");
    expect(result).not.toHaveProperty("preparationSurvivesEveryDefence");
    expect(result).not.toHaveProperty("reintroductionWitness");
    expect(result).not.toHaveProperty("firstRefutation");
  });

  it("rejects a sealed item carrying the wrong projection identity", () => {
    const sourceFen = "r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1";
    const reading = threats(sourceFen);
    expect(requireProjection(declareThreatEvidence(reading), "rules.tactic.consequence.threat").projection.id).toBe("rules.tactic.consequence.threat");
    expect(() => requireProjection(declareExactLegalMovesEvidence(exactLegalMoveMap(sourceFen)), "rules.tactic.consequence.threat")).toThrow(/expected rules\.tactic/u);
  });

  it("retains a sealed exact source position and proves its pass-position join", () => {
    const sourceFen = "r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1";
    const reading = threats(sourceFen);
    expect(reading.kind).toBe("threats");
    const exchange = reading.kind === "threats" ? reading.threats.find((row) => row.threatenedMove === "a8a1")?.exchange : undefined;
    expect(exchange).toBeDefined();
    const target = namedTarget(declareThreatEvidence(reading), declareLegalExchangeEvidence(exchange!), declareExactLegalMovesEvidence(exactLegalMoveMap(sourceFen)));
    expect(target.sourceFen).toBe(sourceFen);
    expect(target.sourcePosition.payload).toEqual(exactLegalMoveMap(sourceFen));
    expect(target.passedFen).not.toBe(sourceFen);
    expect(target.passedFen.split(" ")[1]).toBe("b");
    expect(sourceFen.split(" ")[1]).toBe("w");
    expect(reading).not.toHaveProperty("fen");
    expect(exactLegalMoves(sourceFen).some((move) => move.uci === "a1a8")).toBe(true);
    expect(exactLegalMoves(target.passedFen).some((move) => move.uci === "a1a8")).toBe(false);
    const wrongSource = "r3k3/8/8/8/8/8/8/Q3K3 w - - 1 2";
    expect(() => namedTarget(declareThreatEvidence(reading), declareLegalExchangeEvidence(exchange!), declareExactLegalMovesEvidence(exactLegalMoveMap(wrongSource)))).toThrow(/source position/u);
  });
});

describe("D1655 real operation census", () => {
  it("finds no bounded-target production operation or application composition at HEAD", () => {
    const files = sourceFiles(join(process.cwd(), "apps/server/src"));
    const callers = files.filter((path) => /boundedTarget|BoundedTarget|bounded-target/iu.test(readFileSync(path, "utf8")));
    expect(callers.map((path) => relative(process.cwd(), path))).toEqual([]);
  });
});

describe("D1656 complete legal-root authority", () => {
  it("rejects an equal-count replacement and retains castling and promotion identities", () => {
    const valid = rootRecord(START);
    expect(() => verifyRootTable(valid)).not.toThrow();
    const rows = [...valid.rows];
    rows[0] = Object.freeze({ ...rows[0]!, moveUci: "a1a2" });
    expect(rows).toHaveLength(valid.rows.length);
    expect(() => verifyRootTable(Object.freeze({ ...valid, rows: Object.freeze(rows) }))).toThrow(/set-equal/u);

    const castling = rootRecord("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(castling.rows.map((row) => row.moveUci)).toEqual(expect.arrayContaining(["e1h1", "e1a1"]));
    expect(() => verifyRootTable(castling)).not.toThrow();
    const promotion = rootRecord("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
    expect(promotion.rows.map((row) => row.moveUci)).toEqual(expect.arrayContaining(["a7a8q", "a7a8r", "a7a8b", "a7a8n"]));
    expect(() => verifyRootTable(promotion)).not.toThrow();
  });
});

describe("D1657 sealed target joins", () => {
  it("refuses a cross-target exchange while retaining the two declared authorities", () => {
    const fen = "r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1";
    const reading = threats(fen);
    expect(reading.kind).toBe("threats");
    const matching = reading.kind === "threats" ? reading.threats.find((row) => row.threatenedMove === "a8a1")!.exchange! : undefined;
    const source = declareExactLegalMovesEvidence(exactLegalMoveMap(fen));
    const target = namedTarget(declareThreatEvidence(reading), declareLegalExchangeEvidence(matching!), source);
    expect(target.captureUci).toBe("a8a1");
    const swapped = Object.freeze({ ...matching!, captureUci: "a8b8" });
    expect(() => namedTarget(declareThreatEvidence(reading), declareLegalExchangeEvidence(swapped), source)).toThrow(/does not join/u);
  });
});

describe("D1647/D1658 exchange receipts and bounded work", () => {
  it("keys requested provider identity separately from the actual same-exchange generation", () => {
    const request = stockfishRequestKey({ requestFen: START, bound: { kind: "depth", value: 8 }, requestedWidth: "all_legal", requestedIdentity: { provider: "stockfish", engineId: "stockfish-play", version: "18", containerDigest: "sha256:stockfish" } });
    expect(request).toHaveLength(64);
    expect(rootRecord(START).receipt.generation).toBe(3);
    expect(Object.freeze({ ...rootRecord(START), receipt: Object.freeze({ ...STOCKFISH, generation: 4 }) }).receipt.generation).toBe(4);
  });

  it("bounds active, queued and retained work; exact-key dedupes; cancellation and stale generations do not retain", () => {
    const scheduler = new BoundedWorkModel(2, 2, 2);
    expect(scheduler.enqueue({ key: "a", scope: "run-1", generation: MAIA.generation })).toBe("active");
    expect(scheduler.enqueue({ key: "a", scope: "run-1", generation: MAIA.generation })).toBe("deduped");
    expect(scheduler.enqueue({ key: "b", scope: "run-1", generation: MAIA.generation })).toBe("active");
    expect(scheduler.enqueue({ key: "c", scope: "run-2", generation: MAIA.generation })).toBe("queued");
    expect(scheduler.enqueue({ key: "d", scope: "run-2", generation: MAIA.generation })).toBe("queued");
    expect(scheduler.enqueue({ key: "e", scope: "run-3", generation: MAIA.generation })).toBe("refused");
    expect(scheduler.complete("a", MAIA.generation + 1)).toBe("stale");
    expect(scheduler.retained.size).toBe(0);
    scheduler.cancelScope("run-2");
    expect(scheduler.queued).toHaveLength(0);
    expect(scheduler.complete("b", MAIA.generation)).toBe("retained");
    expect(scheduler.retained.size).toBe(1);
  });
});
