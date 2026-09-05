import { Buffer } from "node:buffer";

import {
  assertDeclaredEvidence,
  evidenceDigest,
  type DeclaredEvidence,
} from "../../packages/runtime/src/evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import {
  declareBackRankEvidence,
  declareCandidateMajorityEvidence,
  declareCastlingLegalityEvidence,
  declareCastlingRightsEvidence,
  declareDevelopmentReadingEvidence,
  declareDiscoveredLatencyEvidence,
  declareExactLegalMovesEvidence,
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
} from "../../packages/runtime/src/evidence-source-adapters.js";
import {
  MOVE_IDENTITY_CONVENTION,
  exactLegalMoveMap,
  type ExactLegalMove,
} from "../../packages/runtime/src/legal-moves.js";
import {
  assertSemanticEvidenceEvent,
  breadthSemanticEvents,
  castlingSemanticEvents,
  discoveredExecutedSemanticEvents,
  derivedExchangeSemanticEvents,
  loosePieceSemanticEvents,
  pawnIslandSemanticEvents,
  semanticDutyEvents,
  structuralSemanticEvents,
  tacticalSemanticEvents,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
  type TransitionSemanticEventOperands,
} from "../../packages/runtime/src/semantic-evidence.js";
import { castlingLegality, castlingRights } from "../../packages/runtime/src/castling.js";
import { legalExchange } from "../../packages/runtime/src/exchange.js";
import { developmentReading } from "../../packages/runtime/src/phase.js";
import {
  candidateMajorityReading,
  pawnContactsReading,
} from "../../packages/runtime/src/pawn-dynamics.js";
import { materialRoleSignatureReading } from "../../packages/runtime/src/material-state.js";
import { pieceDestinationsReading } from "../../packages/runtime/src/mobility.js";
import { squareControlReading } from "../../packages/runtime/src/square-control.js";
import { kingZoneReading } from "../../packages/runtime/src/king-state.js";
import { pawnConnectivityReading, spaceReading } from "../../packages/runtime/src/structure.js";
import {
  backRankReading,
  discoveredLatencyReading,
  forkSurvivesReply,
  loosePieceReading,
  mateInOne,
  promotionPressureReading,
  rayClassificationReading,
  replyBreadth,
  rookOnSeventhReading,
  threats,
  trappedPieceReading,
  type DoubleAttackEvent,
  type ReplyBreadth,
} from "../../packages/runtime/src/tactics.js";

export const CANDIDATE_PACKET_COMPILER_VERSION = "candidate-population-compiler@1" as const;
export const LEGAL_CONVENTION = "rules.mobility.reading.legal_moves@1" as const;
export const CANDIDATE_PACKET_SCOPES = Object.freeze(["events", "readings", "events_and_readings"] as const);
export type CandidatePacketScope = (typeof CANDIDATE_PACKET_SCOPES)[number];

export interface CandidatePopulationRequest<S extends CandidatePacketScope = CandidatePacketScope> {
  readonly beforeFen: string;
  readonly ruleset: "standard";
  readonly scope: S;
}

type EvidenceValue = SemanticEvidenceEvent | DeclaredEvidence<unknown>;
type CollectorId = keyof typeof COLLECTOR_DEPENDENCIES;
type Memo = Readonly<Partial<Record<CollectorId, readonly CollectorOutcome[]>>>;

interface CollectorContext {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly memo: Memo;
}

interface CollectorOutcome {
  readonly collectorId: CollectorId;
  readonly values: readonly EvidenceValue[];
}

const EVENT_COLLECTORS = Object.freeze([
  "event.structural",
  "event.pawn_island",
  "event.transition",
  "event.tactical",
  "event.loose_piece",
  "event.castling",
  "event.exchange",
  "event.discovered",
  "event.breadth",
  "event.duty",
] as const);

const READING_COLLECTORS = Object.freeze([
  "reading.child",
  "reading.legal_exchange",
  "reading.fork_survival",
] as const);

const COLLECTOR_DEPENDENCIES = Object.freeze({
  "event.structural": Object.freeze([] as const),
  "event.pawn_island": Object.freeze([] as const),
  "event.transition": Object.freeze([] as const),
  "event.tactical": Object.freeze([] as const),
  "event.loose_piece": Object.freeze([] as const),
  "event.castling": Object.freeze([] as const),
  "event.exchange": Object.freeze(["event.transition"] as const),
  "event.discovered": Object.freeze(["event.transition"] as const),
  "event.breadth": Object.freeze(["event.transition"] as const),
  "event.duty": Object.freeze(["event.transition"] as const),
  "reading.child": Object.freeze([] as const),
  "reading.legal_exchange": Object.freeze(["event.transition"] as const),
  "reading.fork_survival": Object.freeze(["event.tactical", "reading.legal_exchange"] as const),
});

function childReadings(afterFen: string): readonly DeclaredEvidence<unknown>[] {
  return Object.freeze([
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
  ]);
}

function transitionMemo(context: CollectorContext): readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] {
  const value = context.memo["event.transition"];
  if (value === undefined || value.length !== 1) throw new TypeError("MISSING_TRANSITION_MEMO");
  return value[0]!.values as readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[];
}

function collectCandidateStructural(context: CollectorContext): readonly EvidenceValue[] {
  return structuralSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
}
function collectCandidatePawnIsland(context: CollectorContext): readonly EvidenceValue[] {
  return pawnIslandSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
}
function collectCandidateTransition(context: CollectorContext): readonly EvidenceValue[] {
  return transitionSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
}
function collectCandidateTactical(context: CollectorContext): readonly EvidenceValue[] {
  return tacticalSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
}
function collectCandidateLoosePiece(context: CollectorContext): readonly EvidenceValue[] {
  return loosePieceSemanticEvents(context.beforeFen, context.moveUci, context.afterFen) ?? Object.freeze([]);
}
function collectCandidateCastling(context: CollectorContext): readonly EvidenceValue[] {
  return castlingSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
}
function collectCandidateExchange(context: CollectorContext): readonly EvidenceValue[] {
  return derivedExchangeSemanticEvents(context.beforeFen, context.moveUci, context.afterFen, transitionMemo(context));
}
function collectCandidateDiscovered(context: CollectorContext): readonly EvidenceValue[] {
  return discoveredExecutedSemanticEvents(context.beforeFen, context.moveUci, context.afterFen, transitionMemo(context));
}
function collectCandidateBreadth(context: CollectorContext): readonly EvidenceValue[] {
  transitionMemo(context);
  return breadthSemanticEvents(context.beforeFen, context.moveUci, context.afterFen);
}
function collectCandidateDuty(context: CollectorContext): readonly EvidenceValue[] {
  return semanticDutyEvents(context.beforeFen, context.moveUci, context.afterFen, transitionMemo(context));
}
function collectCandidateChildReadings(context: CollectorContext): readonly EvidenceValue[] {
  return childReadings(context.afterFen);
}
function collectCandidateLegalExchange(context: CollectorContext): readonly EvidenceValue[] {
  transitionMemo(context);
  const value = legalExchange(context.beforeFen, context.moveUci);
  return value === undefined ? Object.freeze([]) : Object.freeze([declareLegalExchangeEvidence(value)]);
}
function collectCandidateForkSurvival(context: CollectorContext): readonly EvidenceValue[] {
  if (context.memo["reading.legal_exchange"] === undefined) throw new TypeError("MISSING_EXCHANGE_MEMO");
  const tactical = context.memo["event.tactical"];
  if (tactical === undefined || tactical.length !== 1) throw new TypeError("MISSING_TACTICAL_MEMO");
  const doubleAttack = tactical[0]!.values.find((value): value is SemanticEvidenceEvent<DoubleAttackEvent> => (
    value.projection.id === "rules.tactic.event.double_attack"
  ));
  if (doubleAttack === undefined) return Object.freeze([]);
  const breadth = tactical[0]!.values.find((value): value is SemanticEvidenceEvent<ReplyBreadth> => (
    value.projection.id === "rules.tactic.consequence.reply_breadth"
  ));
  if (breadth === undefined) throw new TypeError("MISSING_REPLY_BREADTH_MEMO");
  return Object.freeze([declareForkSurvivalEvidence(forkSurvivesReply(
    doubleAttack.operands,
    breadth.operands,
  ))]);
}

export const CANDIDATE_COLLECTOR_EXECUTION = Object.freeze({
  "event.structural": collectCandidateStructural,
  "event.pawn_island": collectCandidatePawnIsland,
  "event.transition": collectCandidateTransition,
  "event.tactical": collectCandidateTactical,
  "event.loose_piece": collectCandidateLoosePiece,
  "event.castling": collectCandidateCastling,
  "event.exchange": collectCandidateExchange,
  "event.discovered": collectCandidateDiscovered,
  "event.breadth": collectCandidateBreadth,
  "event.duty": collectCandidateDuty,
  "reading.child": collectCandidateChildReadings,
  "reading.legal_exchange": collectCandidateLegalExchange,
  "reading.fork_survival": collectCandidateForkSurvival,
} as const satisfies Record<CollectorId, (context: CollectorContext) => readonly EvidenceValue[]>);

function exactPlainRecord(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label}_NOT_PLAIN`);
  }
  const own = Reflect.ownKeys(value);
  if (own.some((key) => typeof key === "symbol")) throw new TypeError(`${label}_SYMBOL_KEY`);
  const actual = (own as string[]).sort();
  const expected = [...keys].sort();
  if (actual.join("\0") !== expected.join("\0")) throw new TypeError(`${label}_KEYS`);
  for (const key of own as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}_DESCRIPTOR`);
  }
}

export function parseCandidatePopulationRequest(value: unknown): CandidatePopulationRequest {
  exactPlainRecord(value, ["beforeFen", "ruleset", "scope"], "REQUEST");
  if (typeof value.beforeFen !== "string" || value.beforeFen.trim() === "") throw new TypeError("REQUEST_FEN");
  if (value.ruleset !== "standard") throw new TypeError("REQUEST_RULESET");
  if (!CANDIDATE_PACKET_SCOPES.includes(value.scope as CandidatePacketScope)) throw new TypeError("REQUEST_SCOPE");
  return deepSeal({ beforeFen: value.beforeFen, ruleset: "standard", scope: value.scope as CandidatePacketScope });
}

function childFen(beforeFen: string, move: ExactLegalMove): string {
  return replyBreadth(beforeFen, move.uci).afterFen;
}

function requested(scope: CandidatePacketScope): ReadonlySet<CollectorId> {
  return new Set<CollectorId>([
    ...(scope === "events" || scope === "events_and_readings" ? EVENT_COLLECTORS : []),
    ...(scope === "readings" || scope === "events_and_readings" ? READING_COLLECTORS : []),
  ]);
}

export function planCandidateCollectors(scope: CandidatePacketScope): readonly { readonly collectorId: CollectorId; readonly retain: boolean }[] {
  const retained = requested(scope);
  const required = new Set(retained);
  const visit = (id: CollectorId): void => {
    for (const dependency of COLLECTOR_DEPENDENCIES[id]) {
      required.add(dependency);
      visit(dependency);
    }
  };
  for (const id of retained) visit(id);
  const ordered: CollectorId[] = [];
  const complete = new Set<CollectorId>();
  const append = (id: CollectorId): void => {
    if (complete.has(id)) return;
    for (const dependency of COLLECTOR_DEPENDENCIES[id]) append(dependency);
    complete.add(id);
    ordered.push(id);
  };
  for (const id of Object.keys(CANDIDATE_COLLECTOR_EXECUTION) as CollectorId[]) if (required.has(id)) append(id);
  return Object.freeze(ordered.map((collectorId) => Object.freeze({ collectorId, retain: retained.has(collectorId) })));
}

function deepSeal<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError("ACCESSOR_RETAINED_KEY");
    deepSeal(descriptor.value, seen);
  }
  if (!Object.isFrozen(value)) Object.freeze(value);
  return value;
}

export function sealRetainedValueForTest<T>(value: T): T {
  return deepSeal(value);
}

export function candidatePacketIdentityInput(beforeFen: string, scope: CandidatePacketScope) {
  return deepSeal({
    beforeFen,
    legalConvention: LEGAL_CONVENTION,
    moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
    ruleset: "standard",
    scope,
  });
}

function packetId(beforeFen: string, scope: CandidatePacketScope): string {
  return evidenceDigest(candidatePacketIdentityInput(beforeFen, scope));
}

function projectionScope(id: CollectorId): "events" | "readings" {
  return id.startsWith("event.") ? "events" : "readings";
}

function executeCandidate(beforeFen: string, move: ExactLegalMove, plan: ReturnType<typeof planCandidateCollectors>) {
  const afterFen = childFen(beforeFen, move);
  const memo: Partial<Record<CollectorId, readonly CollectorOutcome[]>> = {};
  const executionOutcomes: CollectorOutcome[] = [];
  const retainedOutcomes: CollectorOutcome[] = [];
  for (const planned of plan) {
    const dependencies = COLLECTOR_DEPENDENCIES[planned.collectorId];
    const dependencyMemo: Partial<Record<CollectorId, readonly CollectorOutcome[]>> = {};
    for (const dependency of dependencies) {
      const outcomes = memo[dependency];
      if (outcomes === undefined) throw new TypeError(`MISSING_DEPENDENCY:${dependency}`);
      dependencyMemo[dependency] = outcomes;
    }
    const values = Object.freeze([...CANDIDATE_COLLECTOR_EXECUTION[planned.collectorId](deepSeal({
      beforeFen,
      moveUci: move.uci,
      afterFen,
      memo: deepSeal(dependencyMemo),
    }))]);
    for (const value of values) {
      if ("anchor" in value) assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value);
      else assertDeclaredEvidence(value);
    }
    const outcome = deepSeal({ collectorId: planned.collectorId, values });
    memo[planned.collectorId] = Object.freeze([outcome]);
    executionOutcomes.push(outcome);
    if (planned.retain) retainedOutcomes.push(outcome);
  }
  const events = Object.freeze(retainedOutcomes
    .filter((outcome) => projectionScope(outcome.collectorId) === "events")
    .flatMap((outcome) => outcome.values) as SemanticEvidenceEvent[]);
  const readings = Object.freeze(retainedOutcomes
    .filter((outcome) => projectionScope(outcome.collectorId) === "readings")
    .flatMap((outcome) => outcome.values) as DeclaredEvidence<unknown>[]);
  const row = deepSeal({ moveUci: move.uci, afterFen, events, readings, abstentions: Object.freeze([] as never[]) });
  return deepSeal({ row, events, readings, abstentions: row.abstentions, collectorOutcomes: Object.freeze(retainedOutcomes), executionOutcomes: Object.freeze(executionOutcomes) });
}

const COMPILED_RECEIPTS = new WeakSet<object>();

function mintCompiled(beforeFen: string, scope: CandidatePacketScope, legalMovesInput: DeclaredEvidence<ReturnType<typeof exactLegalMoveMap>>, candidateInputs: readonly ReturnType<typeof executeCandidate>[]) {
  const packet = deepSeal({
    id: packetId(beforeFen, scope),
    beforeFen,
    ruleset: "standard" as const,
    scope,
    legalMoves: Object.freeze(legalMovesInput.payload.pieces.flatMap((piece) => piece.moves)),
    candidates: Object.freeze(candidateInputs.map((input) => input.row)),
  });
  const references = deepSeal({
    manifest: PRIMARY_EVIDENCE_MANIFEST,
    packet,
    legalMovesInput,
    candidateInputs: Object.freeze(candidateInputs),
  });
  const compiled = deepSeal({ packet, references });
  COMPILED_RECEIPTS.add(compiled);
  return compiled;
}

export type CompiledCandidatePacket = ReturnType<typeof mintCompiled>;

export function assertCompiledCandidatePacket(value: unknown): asserts value is CompiledCandidatePacket {
  if (typeof value !== "object" || value === null || !COMPILED_RECEIPTS.has(value)) throw new TypeError("UNASSERTED_COMPILED_PACKET");
  const compiled = value as CompiledCandidatePacket;
  if (compiled.packet !== compiled.references.packet) throw new TypeError("CROSSED_PACKET_REFERENCE");
  if (compiled.packet.id !== packetId(compiled.packet.beforeFen, compiled.packet.scope)) throw new TypeError("CROSSED_PACKET_ID");
  assertDeclaredEvidence(compiled.references.legalMovesInput);
}

export function compileCandidatePopulation(requestValue: unknown): CompiledCandidatePacket {
  const request = parseCandidatePopulationRequest(requestValue);
  const map = exactLegalMoveMap(request.beforeFen);
  const beforeFen = map.fen;
  const legalMovesInput = declareExactLegalMovesEvidence(map);
  assertDeclaredEvidence(legalMovesInput);
  const plan = planCandidateCollectors(request.scope);
  const moves = legalMovesInput.payload.pieces.flatMap((piece) => piece.moves);
  const candidateInputs = Object.freeze(moves.map((move) => executeCandidate(beforeFen, move, plan)));
  return mintCompiled(beforeFen, request.scope, legalMovesInput, candidateInputs);
}

export function projectWide(compiled: CompiledCandidatePacket, targetScope: Exclude<CandidatePacketScope, "events_and_readings">): CompiledCandidatePacket {
  assertCompiledCandidatePacket(compiled);
  if (compiled.packet.scope !== "events_and_readings") throw new TypeError("SOURCE_NOT_WIDE");
  const targetPlan = planCandidateCollectors(targetScope);
  const required = new Set(targetPlan.map((item) => item.collectorId));
  const retained = new Set(targetPlan.filter((item) => item.retain).map((item) => item.collectorId));
  const candidateInputs = compiled.references.candidateInputs.map((input) => {
    const executionOutcomes = Object.freeze(input.executionOutcomes.filter((outcome) => required.has(outcome.collectorId)));
    const collectorOutcomes = Object.freeze(input.collectorOutcomes.filter((outcome) => retained.has(outcome.collectorId)));
    const events = targetScope === "events" ? Object.freeze(collectorOutcomes.flatMap((outcome) => outcome.values) as SemanticEvidenceEvent[]) : Object.freeze([] as SemanticEvidenceEvent[]);
    const readings = targetScope === "readings" ? Object.freeze(collectorOutcomes.flatMap((outcome) => outcome.values) as DeclaredEvidence<unknown>[]) : Object.freeze([] as DeclaredEvidence<unknown>[]);
    const row = deepSeal({ moveUci: input.row.moveUci, afterFen: input.row.afterFen, events, readings, abstentions: Object.freeze([] as never[]) });
    return deepSeal({ row, events, readings, abstentions: row.abstentions, collectorOutcomes, executionOutcomes });
  });
  return mintCompiled(compiled.packet.beforeFen, targetScope, compiled.references.legalMovesInput, Object.freeze(candidateInputs));
}

function assertedBrand(value: object): "declared" | "semantic" | undefined {
  try {
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value);
    return "semantic";
  } catch {
    try {
      assertDeclaredEvidence(value);
      return "declared";
    } catch {
      return undefined;
    }
  }
}

function visit(value: unknown, state: { readonly seen: WeakSet<object>; logicalUtf8Bytes: number; uniqueObjects: number }): void {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint" || (typeof value === "number" && !Number.isFinite(value))) throw new TypeError(`UNSUPPORTED_RETAINED_VALUE:${typeof value}`);
    state.logicalUtf8Bytes += Buffer.byteLength(String(value));
    return;
  }
  if (state.seen.has(value)) return;
  state.seen.add(value);
  state.uniqueObjects += 1;
  const symbols = Object.getOwnPropertySymbols(value);
  if (symbols.length > 0) {
    if (symbols.length !== 1 || assertedBrand(value) === undefined) throw new TypeError("UNASSERTED_SYMBOL_RETAINED_KEY");
    const descriptor = Object.getOwnPropertyDescriptor(value, symbols[0]!);
    if (descriptor === undefined || !("value" in descriptor) || descriptor.value !== true || !descriptor.enumerable) throw new TypeError("INVALID_ASSERTED_BRAND_SLOT");
    state.logicalUtf8Bytes += 4;
  }
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) throw new TypeError("NON_PLAIN_RETAINED_OBJECT");
  const stringKeys = Object.getOwnPropertyNames(value);
  for (const key of stringKeys) {
    if (Array.isArray(value) && key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError("ACCESSOR_RETAINED_KEY");
  }
  for (const key of stringKeys.filter((key) => !(Array.isArray(value) && key === "length")).sort()) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    state.logicalUtf8Bytes += Buffer.byteLength(key);
    visit((descriptor as PropertyDescriptor & { readonly value: unknown }).value, state);
  }
}

export function measureRetainedValueForTest(value: unknown) {
  const state = { seen: new WeakSet<object>(), logicalUtf8Bytes: 0, uniqueObjects: 0 };
  visit(value, state);
  return Object.freeze({ logicalUtf8Bytes: state.logicalUtf8Bytes, uniqueObjects: state.uniqueObjects });
}

export function measureRetainedGraph(compiled: CompiledCandidatePacket) {
  assertCompiledCandidatePacket(compiled);
  const state = { seen: new WeakSet<object>(), logicalUtf8Bytes: 0, uniqueObjects: 0 };
  visit({ packet: compiled.references.packet, legalMovesInput: compiled.references.legalMovesInput, candidateInputs: compiled.references.candidateInputs }, state);
  return Object.freeze({ logicalUtf8Bytes: state.logicalUtf8Bytes, uniqueObjects: state.uniqueObjects });
}

function positiveSafe(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`INVALID_LIMIT:${label}`);
  return value;
}

export class CandidateReceiptCache {
  readonly #entries = new Map<string, { readonly compiled: CompiledCandidatePacket; readonly measure: ReturnType<typeof measureRetainedGraph> }>();
  readonly #limits;
  #logicalUtf8Bytes = 0;
  #uniqueObjects = 0;
  constructor(limits: { readonly maxEntries: number; readonly maxRetainedLogicalBytes: number; readonly maxRetainedObjects: number }) {
    this.#limits = Object.freeze({
      maxEntries: positiveSafe(limits.maxEntries, "entries"),
      maxRetainedLogicalBytes: positiveSafe(limits.maxRetainedLogicalBytes, "bytes"),
      maxRetainedObjects: positiveSafe(limits.maxRetainedObjects, "objects"),
    });
  }
  admit(compiled: CompiledCandidatePacket) {
    assertCompiledCandidatePacket(compiled);
    const measure = measureRetainedGraph(compiled);
    if (measure.logicalUtf8Bytes > this.#limits.maxRetainedLogicalBytes || measure.uniqueObjects > this.#limits.maxRetainedObjects) {
      return Object.freeze({ cache: "oversize_not_cached" as const, measure });
    }
    const prior = this.#entries.get(compiled.packet.id);
    if (prior !== undefined) this.#delete(compiled.packet.id, prior);
    this.#entries.set(compiled.packet.id, Object.freeze({ compiled, measure }));
    this.#logicalUtf8Bytes += measure.logicalUtf8Bytes;
    this.#uniqueObjects += measure.uniqueObjects;
    while (
      this.#entries.size > this.#limits.maxEntries
      || this.#logicalUtf8Bytes > this.#limits.maxRetainedLogicalBytes
      || this.#uniqueObjects > this.#limits.maxRetainedObjects
    ) {
      const oldestKey = this.#entries.keys().next().value!;
      this.#delete(oldestKey, this.#entries.get(oldestKey)!);
    }
    return Object.freeze({ cache: "miss" as const, measure });
  }
  get(packetIdValue: string): CompiledCandidatePacket | undefined {
    const entry = this.#entries.get(packetIdValue);
    if (entry === undefined) return undefined;
    assertCompiledCandidatePacket(entry.compiled);
    this.#entries.delete(packetIdValue);
    this.#entries.set(packetIdValue, entry);
    return entry.compiled;
  }
  #delete(key: string, entry: { readonly compiled: CompiledCandidatePacket; readonly measure: ReturnType<typeof measureRetainedGraph> }): void {
    this.#entries.delete(key);
    this.#logicalUtf8Bytes -= entry.measure.logicalUtf8Bytes;
    this.#uniqueObjects -= entry.measure.uniqueObjects;
  }
}
