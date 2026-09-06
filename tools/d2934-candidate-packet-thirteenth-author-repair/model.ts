// DISPOSABLE composed author model for D2934-D2941. Not production code.
import { Buffer } from "node:buffer";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { assertDeclaredEvidence, evidenceDigest, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  BREADTH_EVENT_PROJECTION_IDS,
  CASTLING_EVENT_PROJECTION_IDS,
  DERIVED_EXCHANGE_EVENT_PROJECTION_IDS,
  DERIVED_TACTIC_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  TACTICAL_EVENT_PROJECTION_IDS,
  TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";
import { declareExactLegalMovesEvidence } from "../../packages/runtime/src/evidence-source-adapters.js";
import { MOVE_IDENTITY_CONVENTION, exactLegalMoveMap, type ExactLegalMove } from "../../packages/runtime/src/legal-moves.js";
import { assertSemanticEvidenceEvent, loosePieceSemanticEvents, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { replyBreadth } from "../../packages/runtime/src/tactics.js";
import {
  CANDIDATE_COLLECTOR_DEPENDENCIES,
  CANDIDATE_COLLECTOR_EXECUTION,
  CANDIDATE_PACKET_COMPILER_VERSION,
  LEGAL_CONVENTION,
  candidatePacketIdentityInput,
  parseCandidatePopulationRequest,
  planCandidateCollectors,
  type CandidatePacketScope,
  type CandidatePopulationRequest,
} from "../d2678-candidate-packet-tenth-author-repair/model.js";

export { CANDIDATE_PACKET_COMPILER_VERSION, LEGAL_CONVENTION };
export type { CandidatePacketScope, CandidatePopulationRequest };

const key = (id: string) => `${id}@1` as const;
const CHILD_READING_EXCLUSIONS = new Set([
  "rules.exchange.predicate.legal_exchange",
  "derived.tactic.fork_survives_reply",
  "human.maia.candidate_wdl",
]);
const CHILD_READING_CATALOGUE = new Set<string>([
  ...TACTICAL_COLLECTOR_PROJECTION_IDS,
  ...BREADTH_COLLECTOR_PROJECTION_IDS,
]);
const CHILD_READING_KEYS = Object.freeze(PRIMARY_EVIDENCE_MANIFEST.projections
  .filter((projection) => CHILD_READING_CATALOGUE.has(projection.id))
  .filter((projection) => projection.role === "reading" && !CHILD_READING_EXCLUSIONS.has(projection.id))
  .map((projection) => key(projection.id))
  .sort());

export const CANDIDATE_COLLECTOR_PROJECTION_KEYS = Object.freeze({
  "event.structural": Object.freeze(STRUCTURAL_EVENT_PROJECTION_IDS.map(key)),
  "event.pawn_island": Object.freeze(TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS.map(key)),
  "event.transition": Object.freeze(TRANSITION_EVENT_PROJECTION_IDS.map(key)),
  "event.tactical": Object.freeze(TACTICAL_EVENT_PROJECTION_IDS.filter((id) => id !== "rules.tactic.event.loose_piece").map(key)),
  "event.loose_piece": Object.freeze(["rules.tactic.event.loose_piece@1"] as const),
  "event.castling": Object.freeze(CASTLING_EVENT_PROJECTION_IDS.map(key)),
  "event.exchange": Object.freeze(DERIVED_EXCHANGE_EVENT_PROJECTION_IDS.map(key)),
  "event.discovered": Object.freeze(DERIVED_TACTIC_EVENT_PROJECTION_IDS.map(key)),
  "event.breadth": Object.freeze(BREADTH_EVENT_PROJECTION_IDS.map(key)),
  "event.duty": Object.freeze(SEMANTIC_WAVE_EVENT_PROJECTION_IDS.map(key)),
  "reading.child": CHILD_READING_KEYS,
  "reading.legal_exchange": Object.freeze(["rules.exchange.predicate.legal_exchange@1"] as const),
  "reading.fork_survival": Object.freeze(["derived.tactic.fork_survives_reply@1"] as const),
} as const);

export const CANDIDATE_PACKET_ABSTENTION_REASONS = Object.freeze({
  "rules.tactic.event.loose_piece@1": Object.freeze(["invalid_turn_clone"] as const),
} as const);

type CollectorId = keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS;
type Projection = (typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[CollectorId][number];
type ExactLegalMap = ReturnType<typeof exactLegalMoveMap>;
type EvidenceValue = SemanticEvidenceEvent | DeclaredEvidence<unknown>;
type PriorOutcome = Readonly<{ collectorId: CollectorId; values: readonly EvidenceValue[] }>;
type CollectorMemo = Readonly<Partial<Record<CollectorId, readonly PriorOutcome[]>>>;
interface CollectorContext { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string; readonly memo: CollectorMemo }

export type CandidateCollectorResult =
  | Readonly<{ kind: "available"; projection: Projection; values: readonly EvidenceValue[] }>
  | Readonly<{ kind: "unavailable"; projection: "rules.tactic.event.loose_piece@1"; reason: "invalid_turn_clone" }>
  | Readonly<{ kind: "failed"; projection: Projection; reason: "threw" | "invalid_result" }>;

export interface SealedCandidateCollectorOutcome {
  readonly collectorId: CollectorId;
  readonly moveUci: string;
  readonly projection: Projection;
  readonly result: CandidateCollectorResult;
}

export interface CandidatePacketAbstention {
  readonly projection: "rules.tactic.event.loose_piece@1";
  readonly reason: "invalid_turn_clone";
}

export interface CandidatePacketRow {
  readonly moveUci: string;
  readonly afterFen: string;
  readonly events: readonly SemanticEvidenceEvent[];
  readonly readings: readonly DeclaredEvidence<unknown>[];
  readonly abstentions: readonly CandidatePacketAbstention[];
}

export interface CandidatePacket {
  readonly id: string;
  readonly beforeFen: string;
  readonly ruleset: "standard";
  readonly scope: CandidatePacketScope;
  readonly legalConvention: Readonly<{ id: "rules.mobility.reading.legal_moves"; version: 1 }>;
  readonly moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION;
  readonly manifestDigest: string;
  readonly compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION;
  readonly legalMoves: readonly ExactLegalMove[];
  readonly candidates: readonly CandidatePacketRow[];
  readonly terminal?: Readonly<{ reason: "checkmate" | "stalemate" }>;
}

export interface CandidatePacketInput {
  readonly row: CandidatePacketRow;
  readonly events: CandidatePacketRow["events"];
  readonly readings: CandidatePacketRow["readings"];
  readonly collectorOutcomes: readonly SealedCandidateCollectorOutcome[];
  readonly executionOutcomes: readonly SealedCandidateCollectorOutcome[];
}

export interface CandidatePopulationReceipt {
  readonly packet: CandidatePacket;
  readonly selectedMember: CandidatePacketScope;
  readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMap>;
  readonly candidateInputs: readonly CandidatePacketInput[];
}

const OUTCOMES = new WeakSet<object>();
const RECEIPTS = new WeakSet<object>();

function projectionKey(value: EvidenceValue): string {
  return `${value.projection.id}@${value.projection.version}`;
}

export function assertChildReadingPopulation(): void {
  const witnessFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const observed = new Set(CANDIDATE_COLLECTOR_EXECUTION["reading.child"]({
    beforeFen: witnessFen,
    moveUci: "a7a6",
    afterFen: witnessFen,
    memo: Object.freeze({}),
  }).map(projectionKey));
  const expected = new Set<string>(CANDIDATE_COLLECTOR_PROJECTION_KEYS["reading.child"]);
  if (observed.size !== expected.size || [...observed].some((projection) => !expected.has(projection))) {
    throw new TypeError("CHILD_READING_MANIFEST_DRIFT");
  }
}

assertChildReadingPopulation();

function seal<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const property of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, property);
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError("ACCESSOR_RETAINED_KEY");
    seal(descriptor.value, seen);
  }
  if (!Object.isFrozen(value)) Object.freeze(value);
  return value;
}

function dependencyMemo(collectorId: CollectorId, memo: CollectorMemo): CollectorMemo {
  const dependencies = CANDIDATE_COLLECTOR_DEPENDENCIES[collectorId] as readonly CollectorId[];
  const image: Partial<Record<CollectorId, readonly PriorOutcome[]>> = {};
  for (const dependency of dependencies) {
    const outcomes = memo[dependency];
    if (outcomes === undefined) throw new TypeError(`MISSING_DEPENDENCY:${dependency}`);
    image[dependency] = outcomes;
  }
  Object.freeze(image);
  return new Proxy(image, {
    get(target, property, receiver) {
      if (typeof property === "string" && !dependencies.includes(property as CollectorId)) {
        throw new TypeError(`UNDECLARED_DEPENDENCY:${collectorId}:${property}`);
      }
      return Reflect.get(target, property, receiver);
    },
    set() { throw new TypeError("IMMUTABLE_DEPENDENCY_MEMO"); },
    defineProperty() { throw new TypeError("IMMUTABLE_DEPENDENCY_MEMO"); },
    deleteProperty() { throw new TypeError("IMMUTABLE_DEPENDENCY_MEMO"); },
  });
}

export function dependencyMemoForTest(collectorId: CollectorId, memo: CollectorMemo): CollectorMemo {
  return dependencyMemo(collectorId, memo);
}

class CandidateCollectorFailure extends Error {
  constructor(readonly moveUci: string, readonly projection: Projection, readonly reason: "invalid_result") { super("CANDIDATE_COLLECTOR_FAILED"); }
}

class CandidateCollectorInvocationFailure extends Error {
  constructor(readonly moveUci: string, readonly collectorId: CollectorId) { super("CANDIDATE_COLLECTOR_INVOCATION_FAILED"); }
}

class CandidateCollectorContractFailure extends Error {
  constructor(readonly moveUci: string, readonly collectorId: CollectorId) { super("CANDIDATE_COLLECTOR_CONTRACT_FAILED"); }
}

class NonTerminalEmptyFailure extends Error {
  constructor(readonly beforeFen: string) { super("NON_TERMINAL_EMPTY"); }
}

interface CooperativeOptions {
  readonly maxCollectorsPerGroup: number;
  readonly signal: AbortSignal;
  readonly yieldControl: (collectorId: CollectorId) => Promise<void>;
}

export function candidateCollectorFailureForTest(moveUci: string, projection: Projection, reason: "threw" | "invalid_result"): Error {
  if (reason === "threw") {
    const collectorId = (Object.keys(CANDIDATE_COLLECTOR_PROJECTION_KEYS) as CollectorId[])
      .find((candidate) => (CANDIDATE_COLLECTOR_PROJECTION_KEYS[candidate] as readonly Projection[]).includes(projection));
    if (collectorId === undefined) throw new TypeError("UNKNOWN_TEST_PROJECTION");
    return new CandidateCollectorInvocationFailure(moveUci, collectorId);
  }
  return new CandidateCollectorFailure(moveUci, projection, reason);
}

export function classifyTerminalForTest(beforeFen: string, candidateCount: number): Readonly<{ reason: "checkmate" | "stalemate" }> | undefined {
  const position = positionFromFen(beforeFen);
  const terminal = position.isCheckmate()
    ? Object.freeze({ reason: "checkmate" as const })
    : position.isStalemate() ? Object.freeze({ reason: "stalemate" as const }) : undefined;
  if (candidateCount > 0) {
    if (terminal !== undefined) throw new TypeError("NONEMPTY_TERMINAL");
    return undefined;
  }
  if (terminal !== undefined) return terminal;
  throw new NonTerminalEmptyFailure(canonicalFen(position));
}

function assertValue(value: EvidenceValue): void {
  try { assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value); }
  catch { assertDeclaredEvidence(value); }
}

function invokeCollector(collectorId: CollectorId, context: CollectorContext): Readonly<{ kind: "available"; values: readonly EvidenceValue[] } | { kind: "unavailable"; reason: "invalid_turn_clone" }> {
  try {
    if (collectorId === "event.loose_piece") {
      const value = loosePieceSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
      return value === undefined
        ? Object.freeze({ kind: "unavailable", reason: "invalid_turn_clone" })
        : Object.freeze({ kind: "available", values: Object.freeze([...value]) });
    }
    const collector = CANDIDATE_COLLECTOR_EXECUTION[collectorId] as (input: CollectorContext) => readonly EvidenceValue[];
    return Object.freeze({ kind: "available", values: Object.freeze([...collector(context)]) });
  } catch (error) {
    if (error instanceof CandidateCollectorFailure || error instanceof CandidateCollectorInvocationFailure) throw error;
    throw new CandidateCollectorInvocationFailure(context.moveUci, collectorId);
  }
}

function normalizeCollector(collectorId: CollectorId, context: CollectorContext, retain: boolean) {
  const expected = CANDIDATE_COLLECTOR_PROJECTION_KEYS[collectorId] as readonly Projection[];
  const invoked = invokeCollector(collectorId, context);
  const values = invoked.kind === "available" ? invoked.values : Object.freeze([] as EvidenceValue[]);
  for (const value of values) {
    const projection = projectionKey(value);
    try { assertValue(value); }
    catch {
      if (expected.includes(projection as Projection)) throw new CandidateCollectorFailure(context.moveUci, projection as Projection, "invalid_result");
      throw new CandidateCollectorContractFailure(context.moveUci, collectorId);
    }
  }
  const seen = new Set(values.map(projectionKey));
  const undeclared = [...seen].find((value) => !expected.includes(value as Projection));
  if (undeclared !== undefined) throw new CandidateCollectorContractFailure(context.moveUci, collectorId);
  const execution: SealedCandidateCollectorOutcome[] = [];
  const retained: SealedCandidateCollectorOutcome[] = [];
  const abstentions: CandidatePacketAbstention[] = [];
  for (const projection of expected) {
    const result: CandidateCollectorResult = invoked.kind === "unavailable"
      ? Object.freeze({ kind: "unavailable", projection: "rules.tactic.event.loose_piece@1", reason: invoked.reason })
      : Object.freeze({ kind: "available", projection, values: Object.freeze(values.filter((value) => projectionKey(value) === projection)) });
    const outcome = seal({ collectorId, moveUci: context.moveUci, projection, result });
    OUTCOMES.add(outcome);
    execution.push(outcome);
    if (retain) {
      retained.push(outcome);
      if (result.kind === "unavailable") abstentions.push(Object.freeze({ projection: result.projection, reason: result.reason }));
    }
  }
  return seal({ values, execution: Object.freeze(execution), retained: Object.freeze(retained), abstentions: Object.freeze(abstentions) });
}

function childFen(beforeFen: string, move: ExactLegalMove): string { return replyBreadth(beforeFen, move.uci).afterFen; }

function executeCandidateSync(beforeFen: string, move: ExactLegalMove, plan: ReturnType<typeof planCandidateCollectors>): CandidatePacketInput {
  const afterFen = childFen(beforeFen, move);
  const memo: Partial<Record<CollectorId, readonly PriorOutcome[]>> = {};
  const execution: SealedCandidateCollectorOutcome[] = [];
  const retained: SealedCandidateCollectorOutcome[] = [];
  const abstentions: CandidatePacketAbstention[] = [];
  for (const item of plan) {
    const normalized = normalizeCollector(item.collectorId, seal({ beforeFen, moveUci: move.uci, afterFen, memo: dependencyMemo(item.collectorId, memo) }), item.retain);
    memo[item.collectorId] = Object.freeze([Object.freeze({ collectorId: item.collectorId, values: normalized.values })]);
    execution.push(...normalized.execution); retained.push(...normalized.retained); abstentions.push(...normalized.abstentions);
  }
  return inputFromOutcomes(move.uci, afterFen, execution, retained, abstentions);
}

async function executeCandidateCooperatively(beforeFen: string, move: ExactLegalMove, plan: ReturnType<typeof planCandidateCollectors>, options: CooperativeOptions): Promise<CandidatePacketInput> {
  const afterFen = childFen(beforeFen, move);
  const memo: Partial<Record<CollectorId, readonly PriorOutcome[]>> = {};
  const execution: SealedCandidateCollectorOutcome[] = [];
  const retained: SealedCandidateCollectorOutcome[] = [];
  const abstentions: CandidatePacketAbstention[] = [];
  for (let offset = 0; offset < plan.length; offset += options.maxCollectorsPerGroup) {
    if (options.signal.aborted) throw new TypeError("CANDIDATE_COMPILATION_ABORTED");
    const group = plan.slice(offset, offset + options.maxCollectorsPerGroup);
    for (const item of group) {
      const normalized = normalizeCollector(item.collectorId, seal({ beforeFen, moveUci: move.uci, afterFen, memo: dependencyMemo(item.collectorId, memo) }), item.retain);
      memo[item.collectorId] = Object.freeze([Object.freeze({ collectorId: item.collectorId, values: normalized.values })]);
      execution.push(...normalized.execution); retained.push(...normalized.retained); abstentions.push(...normalized.abstentions);
    }
    if (options.signal.aborted) throw new TypeError("CANDIDATE_COMPILATION_ABORTED");
    await options.yieldControl(group[group.length - 1]!.collectorId);
  }
  return inputFromOutcomes(move.uci, afterFen, execution, retained, abstentions);
}

function inputFromOutcomes(moveUci: string, afterFen: string, execution: readonly SealedCandidateCollectorOutcome[], retained: readonly SealedCandidateCollectorOutcome[], abstentions: readonly CandidatePacketAbstention[]): CandidatePacketInput {
  const available = retained.filter((outcome) => outcome.result.kind === "available");
  const events = Object.freeze(available.filter((outcome) => outcome.collectorId.startsWith("event.")).flatMap((outcome) => outcome.result.kind === "available" ? outcome.result.values : []) as SemanticEvidenceEvent[]);
  const readings = Object.freeze(available.filter((outcome) => outcome.collectorId.startsWith("reading.")).flatMap((outcome) => outcome.result.kind === "available" ? outcome.result.values : []) as DeclaredEvidence<unknown>[]);
  const row = seal({ moveUci, afterFen, events, readings, abstentions: Object.freeze([...abstentions]) });
  return seal({ row, events, readings, collectorOutcomes: Object.freeze([...retained]), executionOutcomes: Object.freeze([...execution]) });
}

function mintReceipt(beforeFen: string, scope: CandidatePacketScope, legalMovesInput: DeclaredEvidence<ExactLegalMap>, candidateInputs: readonly CandidatePacketInput[]): CandidatePopulationReceipt {
  const identity = candidatePacketIdentityInput(beforeFen, scope);
  const terminalState = classifyTerminalForTest(beforeFen, candidateInputs.length);
  const packet: CandidatePacket = seal({
    id: evidenceDigest(identity),
    beforeFen,
    ruleset: "standard" as const,
    scope,
    legalConvention: Object.freeze({ id: "rules.mobility.reading.legal_moves" as const, version: 1 as const }),
    moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
    legalMoves: Object.freeze(legalMovesInput.payload.pieces.flatMap((piece) => piece.moves)),
    candidates: Object.freeze(candidateInputs.map((input) => input.row)),
    ...(terminalState === undefined ? {} : { terminal: terminalState }),
  });
  const receipt: CandidatePopulationReceipt = seal({
    packet,
    selectedMember: scope,
    manifest: PRIMARY_EVIDENCE_MANIFEST,
    legalMovesInput,
    candidateInputs: Object.freeze(candidateInputs),
  });
  RECEIPTS.add(receipt);
  return receipt;
}

export function assertCandidatePopulationReceipt(value: unknown): asserts value is CandidatePopulationReceipt {
  if (value === null || typeof value !== "object") throw new TypeError("CANDIDATE_RECEIPT_UNSEALED");
  if (!RECEIPTS.has(value)) throw new TypeError("CANDIDATE_RECEIPT_UNSEALED");
  const receipt = value as CandidatePopulationReceipt;
  if (receipt.manifest !== PRIMARY_EVIDENCE_MANIFEST || receipt.selectedMember !== receipt.packet.scope || receipt.packet.id !== evidenceDigest(candidatePacketIdentityInput(receipt.packet.beforeFen, receipt.packet.scope))) throw new TypeError("CANDIDATE_RECEIPT_CROSSED");
  assertDeclaredEvidence(receipt.legalMovesInput);
  if (receipt.legalMovesInput.projection.id !== "rules.mobility.reading.legal_moves" || receipt.legalMovesInput.projection.version !== 1 || receipt.legalMovesInput.payload.fen !== receipt.packet.beforeFen) throw new TypeError("CANDIDATE_LEGAL_INPUT_CROSSED");
  const legalMoves = receipt.legalMovesInput.payload.pieces.flatMap((piece) => piece.moves);
  if (receipt.packet.legalMoves.length !== legalMoves.length || receipt.packet.legalMoves.length !== receipt.candidateInputs.length || receipt.packet.candidates.length !== receipt.candidateInputs.length) throw new TypeError("CANDIDATE_LEGAL_SET_CROSSED");
  const legalUcis = legalMoves.map((move) => move.uci);
  if (new Set(legalUcis).size !== legalUcis.length) throw new TypeError("CANDIDATE_LEGAL_SET_DUPLICATE");
  for (const [index, input] of receipt.candidateInputs.entries()) {
    const legalMove = legalMoves[index]!;
    if (receipt.packet.legalMoves[index] !== legalMove || receipt.packet.candidates[index] !== input.row || input.row.moveUci !== legalMove.uci || input.row.afterFen !== childFen(receipt.packet.beforeFen, legalMove)) throw new TypeError("CANDIDATE_ROW_CROSSED");
    if (input.row.events !== input.events || input.row.readings !== input.readings) throw new TypeError("CANDIDATE_ROW_CROSSED");
    for (const outcome of input.executionOutcomes) if (!OUTCOMES.has(outcome) || outcome.moveUci !== input.row.moveUci || outcome.projection !== outcome.result.projection) throw new TypeError("CANDIDATE_OUTCOME_CROSSED");
    for (const outcome of input.collectorOutcomes) if (!input.executionOutcomes.includes(outcome)) throw new TypeError("CANDIDATE_RETAINED_OUTCOME_CROSSED");
    for (const abstention of input.row.abstentions) {
      const source = input.collectorOutcomes.find((outcome) => outcome.projection === abstention.projection && outcome.result.kind === "unavailable" && outcome.result.reason === abstention.reason);
      if (source === undefined) throw new TypeError("CANDIDATE_ABSTENTION_UNAUTHORIZED");
    }
  }
}

export function crossedReceiptForTest(
  source: CandidatePopulationReceipt,
  kind: "legal_move_identity" | "row_identity" | "after_fen",
): CandidatePopulationReceipt {
  assertCandidatePopulationReceipt(source);
  const firstInput = source.candidateInputs[0];
  const firstMove = source.packet.legalMoves[0];
  if (firstInput === undefined || firstMove === undefined) throw new TypeError("TEST_REQUIRES_NONTERMINAL_PACKET");
  let candidateInputs = source.candidateInputs;
  let legalMoves = source.packet.legalMoves;
  let candidates = source.packet.candidates;
  if (kind === "legal_move_identity") {
    legalMoves = Object.freeze([seal({ ...firstMove }), ...legalMoves.slice(1)]);
  } else if (kind === "row_identity") {
    candidates = Object.freeze([seal({ ...firstInput.row }), ...candidates.slice(1)]);
  } else {
    const row = seal({ ...firstInput.row, afterFen: source.packet.beforeFen });
    const input = seal({ ...firstInput, row, events: row.events, readings: row.readings });
    candidateInputs = Object.freeze([input, ...candidateInputs.slice(1)]);
    candidates = Object.freeze([row, ...candidates.slice(1)]);
  }
  const packet = seal({ ...source.packet, legalMoves, candidates });
  const receipt = seal({ ...source, packet, candidateInputs });
  RECEIPTS.add(receipt);
  return receipt;
}

export function compileCandidatePopulation(request: unknown): CandidatePopulationReceipt {
  const parsed = parseCandidatePopulationRequest(request);
  const legalMovesInput = declareExactLegalMovesEvidence(exactLegalMoveMap(parsed.beforeFen));
  assertDeclaredEvidence(legalMovesInput);
  const beforeFen = legalMovesInput.payload.fen;
  const plan = planCandidateCollectors(parsed.scope);
  const candidateInputs = legalMovesInput.payload.pieces.flatMap((piece) => piece.moves).map((move) => executeCandidateSync(beforeFen, move, plan));
  return mintReceipt(beforeFen, parsed.scope, legalMovesInput, Object.freeze(candidateInputs));
}

async function compileCandidatePopulationCooperatively(request: CandidatePopulationRequest, options: CooperativeOptions): Promise<CandidatePopulationReceipt> {
  if (!Number.isSafeInteger(options.maxCollectorsPerGroup) || options.maxCollectorsPerGroup < 1 || options.maxCollectorsPerGroup > 8) throw new TypeError("INVALID_COLLECTOR_GROUP_LIMIT");
  const parsed = parseCandidatePopulationRequest(request);
  const legalMovesInput = declareExactLegalMovesEvidence(exactLegalMoveMap(parsed.beforeFen));
  assertDeclaredEvidence(legalMovesInput);
  const beforeFen = legalMovesInput.payload.fen;
  const plan = planCandidateCollectors(parsed.scope);
  const candidateInputs: CandidatePacketInput[] = [];
  for (const move of legalMovesInput.payload.pieces.flatMap((piece) => piece.moves)) {
    candidateInputs.push(await executeCandidateCooperatively(beforeFen, move, plan, options));
  }
  if (options.signal.aborted) throw new TypeError("CANDIDATE_COMPILATION_ABORTED");
  return mintReceipt(beforeFen, parsed.scope, legalMovesInput, Object.freeze(candidateInputs));
}

function projectWide(receipt: CandidatePopulationReceipt, target: Exclude<CandidatePacketScope, "events_and_readings">): CandidatePopulationReceipt {
  assertCandidatePopulationReceipt(receipt);
  if (receipt.packet.scope !== "events_and_readings") throw new TypeError("SOURCE_NOT_WIDE");
  const plan = planCandidateCollectors(target);
  const executed = new Set(plan.map((item) => item.collectorId));
  const retained = new Set(plan.filter((item) => item.retain).map((item) => item.collectorId));
  const inputs = receipt.candidateInputs.map((input) => {
    const executionOutcomes = input.executionOutcomes.filter((outcome) => executed.has(outcome.collectorId));
    const collectorOutcomes = input.collectorOutcomes.filter((outcome) => retained.has(outcome.collectorId));
    const abstentions = collectorOutcomes.flatMap((outcome): CandidatePacketAbstention[] => outcome.result.kind === "unavailable" ? [{ projection: outcome.result.projection, reason: outcome.result.reason }] : []);
    return inputFromOutcomes(input.row.moveUci, input.row.afterFen, executionOutcomes, collectorOutcomes, abstentions);
  });
  return mintReceipt(receipt.packet.beforeFen, target, receipt.legalMovesInput, Object.freeze(inputs));
}

function assertedBrand(value: object): "declared" | "semantic" | undefined {
  try { assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value); return "semantic"; }
  catch {
    try { assertDeclaredEvidence(value); return "declared"; }
    catch { return undefined; }
  }
}

function visitRetained(value: unknown, state: { readonly seen: WeakSet<object>; logicalUtf8Bytes: number; uniqueObjects: number }): void {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint" || (typeof value === "number" && !Number.isFinite(value))) throw new TypeError(`UNSUPPORTED_RETAINED_VALUE:${typeof value}`);
    state.logicalUtf8Bytes += Buffer.byteLength(String(value));
    return;
  }
  if (state.seen.has(value)) return;
  state.seen.add(value); state.uniqueObjects += 1;
  const symbols = Object.getOwnPropertySymbols(value);
  if (symbols.length > 0) {
    if (symbols.length !== 1 || assertedBrand(value) === undefined) throw new TypeError("UNASSERTED_SYMBOL_RETAINED_KEY");
    const descriptor = Object.getOwnPropertyDescriptor(value, symbols[0]!);
    if (descriptor === undefined || !("value" in descriptor) || descriptor.value !== true || !descriptor.enumerable) throw new TypeError("INVALID_ASSERTED_BRAND_SLOT");
    state.logicalUtf8Bytes += 4;
  }
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) throw new TypeError("NON_PLAIN_RETAINED_OBJECT");
  const keys = Object.getOwnPropertyNames(value);
  for (const key of keys) {
    if (Array.isArray(value) && key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError("ACCESSOR_RETAINED_KEY");
  }
  for (const key of keys.filter((key) => !(Array.isArray(value) && key === "length")).sort()) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)! as PropertyDescriptor & { readonly value: unknown };
    state.logicalUtf8Bytes += Buffer.byteLength(key);
    visitRetained(descriptor.value, state);
  }
}

export function measureRetainedReceipt(receipt: CandidatePopulationReceipt) {
  assertCandidatePopulationReceipt(receipt);
  const state = { seen: new WeakSet<object>(), logicalUtf8Bytes: 0, uniqueObjects: 0 };
  visitRetained(receipt.packet, state);
  visitRetained(receipt.legalMovesInput, state);
  visitRetained(receipt.candidateInputs, state);
  return Object.freeze({ logicalUtf8Bytes: state.logicalUtf8Bytes, uniqueObjects: state.uniqueObjects });
}

export function measureProcessSingletons() {
  const state = { seen: new WeakSet<object>(), logicalUtf8Bytes: 0, uniqueObjects: 0 };
  visitRetained(PRIMARY_EVIDENCE_MANIFEST, state);
  return Object.freeze({ logicalUtf8Bytes: state.logicalUtf8Bytes, uniqueObjects: state.uniqueObjects });
}

function assertReceiptForRequest(receipt: CandidatePopulationReceipt, request: CandidatePopulationRequest, id: string): void {
  assertCandidatePopulationReceipt(receipt);
  const canonicalBefore = canonicalizeFen(request.beforeFen);
  if (receipt.packet.beforeFen !== canonicalBefore || receipt.packet.ruleset !== request.ruleset || receipt.packet.scope !== request.scope || receipt.selectedMember !== request.scope || receipt.packet.id !== id) throw new TypeError("CANDIDATE_RECEIPT_REQUEST_CROSSED");
}

export type CandidatePopulationFailure =
  | Readonly<{ code: "invalid_fen"; message: string }>
  | Readonly<{ code: "invalid_request"; reason: "shape" | "scope"; message: string }>
  | Readonly<{ code: "unsupported_ruleset"; received: string }>
  | Readonly<{ code: "non_terminal_empty"; beforeFen: string }>
  | Readonly<{ code: "collector_failed"; moveUci: string; collectorId: string; reason: "threw" }>
  | Readonly<{ code: "collector_failed"; moveUci: string; collectorId: string; reason: "invalid_result" }>
  | Readonly<{ code: "collector_failed"; moveUci: string; projection: string; reason: "invalid_result" }>
  | Readonly<{ code: "scheduler_failed"; stage: "yield"; collectorId: string }>
  | Readonly<{ code: "overloaded"; maxConcurrent: number; maxPending: number }>
  | Readonly<{ code: "deadline_exceeded"; stage: "queue" | "compile" }>
  | Readonly<{ code: "service_closed" }>
  | Readonly<{ code: "invariant_failed"; invariant: "legal_set" | "child_fen" | "receipt" }>
  | Readonly<{ code: "invalid_scope_projection"; source: CandidatePacketScope; target: CandidatePacketScope }>;

export type CandidatePopulationResult =
  | Readonly<{ kind: "ready"; receipt: CandidatePopulationReceipt; cache: "hit" | "projection_hit" | "miss" | "oversize_not_cached" }>
  | Readonly<{ kind: "cancelled"; reason: "caller_aborted" }>
  | Readonly<{ kind: "failed"; error: CandidatePopulationFailure }>;

export interface CandidatePopulationServiceLimits {
  readonly maxEntries: number;
  readonly maxRetainedLogicalBytes: number;
  readonly maxRetainedObjects: number;
  readonly maxCollectorsPerGroup: number;
  readonly maxConcurrent: number;
  readonly maxPending: number;
  readonly maxQueueWaitMs: number;
  readonly maxCompileMs: number;
}

export interface CandidatePopulationServiceStats {
  readonly activeUniqueJobs: number; readonly queuedUniqueJobs: number; readonly cacheEntries: number;
  readonly retainedLogicalBytes: number; readonly retainedObjects: number; readonly hits: number;
  readonly projectionHits: number; readonly misses: number; readonly evictions: number;
  readonly oversizeNotCached: number; readonly started: number; readonly completed: number;
  readonly failed: number; readonly cancelledWaiters: number; readonly lastWaiterCancellations: number;
  readonly yields: number; readonly sharedLogicalBytes: number; readonly sharedObjects: number;
}

export interface CandidatePopulationService {
  get(request: CandidatePopulationRequest, signal: AbortSignal): Promise<CandidatePopulationResult>;
  close(): Promise<void>;
  stats(): CandidatePopulationServiceStats;
}

type CompileHook = (
  request: CandidatePopulationRequest,
  signal: AbortSignal,
  maxCollectorsPerGroup: number,
  onYield: () => void,
) => Promise<CandidatePopulationReceipt>;

class SchedulerFailure extends Error {
  constructor(readonly collectorId: string) { super("CANDIDATE_SCHEDULER_FAILED"); }
}

function positive(value: number, name: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new TypeError(`INVALID_LIMIT:${name}`);
  return value;
}

export function messageChannelMacrotaskYield(): Promise<void> {
  return new Promise((resolveYield) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolveYield(); };
    channel.port2.postMessage(undefined);
  });
}

function canonicalizeFen(value: string): string { return canonicalFen(positionFromFen(value)); }
function requestId(request: CandidatePopulationRequest): string { return evidenceDigest(candidatePacketIdentityInput(canonicalizeFen(request.beforeFen), request.scope)); }

function requestFailure(raw: unknown, error: unknown): CandidatePopulationFailure {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "REQUEST_RULESET") {
    const received = typeof raw === "object" && raw !== null && "ruleset" in raw ? String(raw.ruleset) : "undefined";
    return Object.freeze({ code: "unsupported_ruleset", received });
  }
  if (message === "REQUEST_FEN") return Object.freeze({ code: "invalid_fen", message });
  if (message === "REQUEST_SCOPE") return Object.freeze({ code: "invalid_request", reason: "scope", message });
  return Object.freeze({ code: "invalid_request", reason: "shape", message });
}

function service(limits: CandidatePopulationServiceLimits, compile: CompileHook): CandidatePopulationService {
  const bounded = Object.freeze({
    maxEntries: positive(limits.maxEntries, "maxEntries", 1, Number.MAX_SAFE_INTEGER),
    maxRetainedLogicalBytes: positive(limits.maxRetainedLogicalBytes, "maxRetainedLogicalBytes", 1, Number.MAX_SAFE_INTEGER),
    maxRetainedObjects: positive(limits.maxRetainedObjects, "maxRetainedObjects", 1, Number.MAX_SAFE_INTEGER),
    maxCollectorsPerGroup: positive(limits.maxCollectorsPerGroup, "maxCollectorsPerGroup", 1, 8),
    maxConcurrent: positive(limits.maxConcurrent, "maxConcurrent", 1, 4),
    maxPending: positive(limits.maxPending, "maxPending", 0, 128),
    maxQueueWaitMs: positive(limits.maxQueueWaitMs, "maxQueueWaitMs", 1, Number.MAX_SAFE_INTEGER),
    maxCompileMs: positive(limits.maxCompileMs, "maxCompileMs", 1, Number.MAX_SAFE_INTEGER),
  });
  const cache = new Map<string, Readonly<{ receipt: CandidatePopulationReceipt; bytes: number; objects: number }>>();
  const active = new Map<string, Job>();
  const running = new Set<Job>();
  const queued: Job[] = [];
  const counters = { hits: 0, projectionHits: 0, misses: 0, evictions: 0, oversizeNotCached: 0, started: 0, completed: 0, failed: 0, cancelledWaiters: 0, lastWaiterCancellations: 0, yields: 0 };
  let retainedLogicalBytes = 0;
  let retainedObjects = 0;
  let closed = false;
  const shared = measureProcessSingletons();

  interface Job { readonly id: string; readonly request: CandidatePopulationRequest; readonly controller: AbortController; readonly promise: Promise<CandidatePopulationResult>; resolve(value: CandidatePopulationResult): void; waiters: number; started: boolean; settled: boolean; termination?: "last_waiter" | "service_closed"; queueTimer?: ReturnType<typeof setTimeout>; }

  const failed = (error: CandidatePopulationFailure): CandidatePopulationResult => Object.freeze({ kind: "failed", error });
  const removeCache = (id: string) => { const found = cache.get(id); if (found === undefined) return; cache.delete(id); retainedLogicalBytes -= found.bytes; retainedObjects -= found.objects; counters.evictions += 1; };
  const admit = (receipt: CandidatePopulationReceipt): "miss" | "oversize_not_cached" => {
    assertCandidatePopulationReceipt(receipt);
    const measure = measureRetainedReceipt(receipt);
    if (measure.logicalUtf8Bytes > bounded.maxRetainedLogicalBytes || measure.uniqueObjects > bounded.maxRetainedObjects) { counters.oversizeNotCached += 1; return "oversize_not_cached"; }
    removeCache(receipt.packet.id);
    cache.set(receipt.packet.id, Object.freeze({ receipt, bytes: measure.logicalUtf8Bytes, objects: measure.uniqueObjects }));
    retainedLogicalBytes += measure.logicalUtf8Bytes; retainedObjects += measure.uniqueObjects;
    while (cache.size > bounded.maxEntries || retainedLogicalBytes > bounded.maxRetainedLogicalBytes || retainedObjects > bounded.maxRetainedObjects) removeCache(cache.keys().next().value!);
    return "miss";
  };
  const finish = (job: Job, result: CandidatePopulationResult) => {
    if (job.settled) return;
    job.settled = true;
    if (job.queueTimer !== undefined) { clearTimeout(job.queueTimer); delete job.queueTimer; }
    if (active.get(job.id) === job) active.delete(job.id);
    running.delete(job);
    if (result.kind === "ready") counters.completed += 1; else if (result.kind === "failed") counters.failed += 1;
    job.resolve(result);
    while (!closed && running.size < bounded.maxConcurrent && queued.length > 0) start(queued.shift()!);
  };
  const start = (job: Job) => {
    if (job.settled) return;
    if (job.queueTimer !== undefined) { clearTimeout(job.queueTimer); delete job.queueTimer; }
    job.started = true; counters.started += 1; active.set(job.id, job); running.add(job);
    void (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      const deadline = new Promise<CandidatePopulationResult>((resolveDeadline) => { timer = setTimeout(() => { timedOut = true; job.controller.abort(); resolveDeadline(failed({ code: "deadline_exceeded", stage: "compile" })); }, bounded.maxCompileMs); });
      try {
        const compiled = compile(job.request, job.controller.signal, bounded.maxCollectorsPerGroup, () => { counters.yields += 1; }).then((receipt) => {
          assertReceiptForRequest(receipt, job.request, job.id);
          if (timedOut) return failed({ code: "deadline_exceeded", stage: "compile" });
          if (job.termination === "service_closed" || closed) return failed({ code: "service_closed" });
          if (job.termination === "last_waiter" || job.controller.signal.aborted || job.waiters === 0) return Object.freeze({ kind: "cancelled" as const, reason: "caller_aborted" as const });
          const cacheState = admit(receipt);
          counters.misses += 1;
          return Object.freeze({ kind: "ready" as const, receipt, cache: cacheState });
        }).catch((error: unknown) => {
          if (timedOut) return failed({ code: "deadline_exceeded", stage: "compile" });
          if (job.termination === "service_closed" || closed) return failed({ code: "service_closed" });
          if (job.termination === "last_waiter" || job.controller.signal.aborted) return Object.freeze({ kind: "cancelled" as const, reason: "caller_aborted" as const });
          if (error instanceof SchedulerFailure) return failed({ code: "scheduler_failed", stage: "yield", collectorId: error.collectorId });
          if (error instanceof CandidateCollectorInvocationFailure) return failed({ code: "collector_failed", moveUci: error.moveUci, collectorId: error.collectorId, reason: "threw" });
          if (error instanceof CandidateCollectorContractFailure) return failed({ code: "collector_failed", moveUci: error.moveUci, collectorId: error.collectorId, reason: "invalid_result" });
          if (error instanceof CandidateCollectorFailure) return failed({ code: "collector_failed", moveUci: error.moveUci, projection: error.projection, reason: error.reason });
          if (error instanceof NonTerminalEmptyFailure) return failed({ code: "non_terminal_empty", beforeFen: error.beforeFen });
          return failed({ code: "invariant_failed", invariant: "receipt" });
        });
        finish(job, await Promise.race([compiled, deadline]));
      } finally { if (timer !== undefined) clearTimeout(timer); }
    })();
  };
  const makeJob = (id: string, request: CandidatePopulationRequest): Job => {
    let resolveJob!: (value: CandidatePopulationResult) => void;
    const promise = new Promise<CandidatePopulationResult>((resolveValue) => { resolveJob = resolveValue; });
    return { id, request, controller: new AbortController(), promise, resolve: resolveJob, waiters: 0, started: false, settled: false };
  };
  const wait = (job: Job, signal: AbortSignal): Promise<CandidatePopulationResult> => {
    if (signal.aborted) return Promise.resolve(Object.freeze({ kind: "cancelled", reason: "caller_aborted" }));
    job.waiters += 1;
    return new Promise((resolveWaiter) => {
      let settled = false;
      const abort = () => {
        if (settled) return; settled = true; job.waiters -= 1; counters.cancelledWaiters += 1;
        if (job.waiters === 0) {
          counters.lastWaiterCancellations += 1;
          job.termination = "last_waiter";
          if (active.get(job.id) === job) active.delete(job.id);
          const queuedIndex = queued.indexOf(job);
          if (queuedIndex >= 0) {
            queued.splice(queuedIndex, 1);
            job.controller.abort();
            finish(job, Object.freeze({ kind: "cancelled", reason: "caller_aborted" }));
          } else job.controller.abort();
        }
        resolveWaiter(Object.freeze({ kind: "cancelled", reason: "caller_aborted" }));
      };
      signal.addEventListener("abort", abort, { once: true });
      void job.promise.then((result) => { if (settled) return; settled = true; job.waiters -= 1; signal.removeEventListener("abort", abort); resolveWaiter(result); });
    });
  };

  return Object.freeze({
    async get(raw: CandidatePopulationRequest, signal: AbortSignal): Promise<CandidatePopulationResult> {
      if (closed) return failed({ code: "service_closed" });
      let request: CandidatePopulationRequest;
      try { request = parseCandidatePopulationRequest(raw); }
      catch (error) { return failed(requestFailure(raw, error)); }
      if (signal.aborted) return Object.freeze({ kind: "cancelled", reason: "caller_aborted" });
      let id: string;
      try { id = requestId(request); } catch (error) { return failed({ code: "invalid_fen", message: String(error) }); }
      const direct = cache.get(id);
      if (direct !== undefined) { cache.delete(id); cache.set(id, direct); counters.hits += 1; return Object.freeze({ kind: "ready", receipt: direct.receipt, cache: "hit" }); }
      if (request.scope !== "events_and_readings") {
        const wideId = requestId(Object.freeze({ ...request, scope: "events_and_readings" }));
        const wide = cache.get(wideId);
        if (wide !== undefined) {
          cache.delete(wideId); cache.set(wideId, wide);
          const receipt = projectWide(wide.receipt, request.scope);
          counters.projectionHits += 1;
          return Object.freeze({ kind: "ready", receipt, cache: "projection_hit" });
        }
      }
      const existing = active.get(id) ?? queued.find((job) => job.id === id);
      if (existing !== undefined) return wait(existing, signal);
      if (running.size >= bounded.maxConcurrent && queued.length >= bounded.maxPending) return failed({ code: "overloaded", maxConcurrent: bounded.maxConcurrent, maxPending: bounded.maxPending });
      const job = makeJob(id, request);
      if (running.size < bounded.maxConcurrent) start(job);
      else {
        queued.push(job);
        job.queueTimer = setTimeout(() => {
          const index = queued.indexOf(job);
          if (index < 0) return;
          queued.splice(index, 1);
          finish(job, failed({ code: "deadline_exceeded", stage: "queue" }));
        }, bounded.maxQueueWaitMs);
      }
      return wait(job, signal);
    },
    async close() {
      if (closed) return; closed = true;
      for (const job of queued.splice(0)) { job.termination = "service_closed"; job.controller.abort(); finish(job, failed({ code: "service_closed" })); }
      for (const job of running) { job.termination = "service_closed"; job.controller.abort(); }
      await Promise.allSettled([...running].map((job) => job.promise));
      cache.clear(); retainedLogicalBytes = 0; retainedObjects = 0;
    },
    stats() { return Object.freeze({ activeUniqueJobs: active.size, queuedUniqueJobs: queued.length, cacheEntries: cache.size, retainedLogicalBytes, retainedObjects, sharedLogicalBytes: shared.logicalUtf8Bytes, sharedObjects: shared.uniqueObjects, ...counters }); },
  });
}

export function createCandidatePopulationService(options: { readonly limits: CandidatePopulationServiceLimits }): CandidatePopulationService {
  return service(options.limits, async (request, signal, maxCollectorsPerGroup, onYield) => {
    return compileCandidatePopulationCooperatively(request, {
      maxCollectorsPerGroup,
      signal,
      yieldControl: async (collectorId) => {
        try { await messageChannelMacrotaskYield(); }
        catch { throw new SchedulerFailure(collectorId); }
        onYield();
      },
    });
  });
}

export function createCandidatePopulationServiceForTest(options: {
  readonly limits: CandidatePopulationServiceLimits;
  readonly compile?: CompileHook;
  readonly yieldControl?: (collectorId: string) => Promise<void>;
}): CandidatePopulationService {
  if (options.compile !== undefined) return service(options.limits, options.compile);
  return service(options.limits, async (request, signal, maxCollectorsPerGroup, onYield) => {
    return compileCandidatePopulationCooperatively(request, {
      maxCollectorsPerGroup,
      signal,
      yieldControl: async (collectorId) => {
        try { await (options.yieldControl ?? messageChannelMacrotaskYield)(collectorId); }
        catch { throw new SchedulerFailure(collectorId); }
        onYield();
      },
    });
  });
}

export function retainedPlans(scope: CandidatePacketScope) { return planCandidateCollectors(scope); }
