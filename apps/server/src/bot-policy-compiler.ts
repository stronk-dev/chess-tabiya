/**
 * The bot-policy compiler (rfc/bot-policy.md §3, §4.2, §4.3, §6). One execution path turns sealed
 * root/legal/classifier authorities, the Maia policy page, the optional all-legal Stockfish root
 * table and one exact `bot-profile-catalog@1` member into a sealed execution, a deterministic
 * decision record and — for persistence — a non-circular operation envelope.
 *
 * Callers cannot supply a chosen move, final weights, layer actions, classifiers or guard losses:
 * every such value is derived here, and every stored byte is re-derived by the replay parsers.
 *
 * Provider inputs are the bot views of the shared `maia.policy_page@1` and
 * `stockfish.legal_root_table@1` deliveries (rfc/provider-exchange-and-execution.md, [[D3030]]);
 * `bot-opponent-source.ts` is the only production adapter, and it carries each delivery's exact
 * source identity into the payload. `bot-opponent-operation.ts` is the production caller.
 */
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import {
  BOT_LAYER_DECLARATIONS,
  classifyPawnMoves,
  exactLegalMoves,
  resolveBotProfileReference,
  type BotClassifierId,
  type BotDegradationReason,
  type BotGuardAbstentionReason,
  type BotLayerId,
  type BotProfileCatalogEntry,
  type BotProfileReference,
} from "@chess-tabiya/runtime";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { drawPolicyMoveBy, reconstructMaiaDistribution, seededPolicyUnit, type PolicyMassRow } from "./bot-policy-catalog.js";
import { canonicalSha256, type Sha256 } from "./bot-profile-digest.js";
import { neutralTiebreakKey } from "./opponent-selector.js";

export class BotPolicyAuthorityError extends TypeError {
  constructor(message: string) {
    super(`Bot policy authority refused: ${message}`);
    this.name = "BotPolicyAuthorityError";
  }
}

function refuse(message: string): never {
  throw new BotPolicyAuthorityError(message);
}

const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const ROOT_ID = /^[A-Za-z0-9_.:-]{1,128}$/u;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function same(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

// ---------------------------------------------------------------------------------------------
// Sealed root, legal and classifier authorities.

export interface BotRootIdentity {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly preCommitEventHeadDigest: Sha256;
  readonly beforeFenDigest: Sha256;
  readonly historyDigest: Sha256;
}

export interface BotOperationRootAuthority {
  readonly identity: BotRootIdentity;
  readonly beforeFen: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly seed: number;
}

const ROOTS = new WeakSet<object>();
const LEGAL_MAPS = new WeakSet<object>();
const CLASSIFIER_VIEWS = new WeakSet<object>();
const EXECUTIONS = new WeakSet<object>();
const DECISIONS = new WeakSet<object>();
const REPLAY_AUTHORITIES = new WeakSet<object>();
const ENVELOPES = new WeakSet<object>();

function replayHistory(startFen: string, historyUci: readonly string[]): string {
  let position: Chess;
  try {
    position = Chess.fromSetup(parseFen(startFen).unwrap()).unwrap();
  } catch {
    return refuse("startFen is not a legal standard-chess position");
  }
  for (const [index, uci] of historyUci.entries()) {
    const move = parseUci(uci);
    if (move === undefined || !position.isLegal(move)) refuse(`historyUci[${index}] is not legal from its preceding position`);
    position.play(move);
  }
  if (position.isEnd()) refuse("the root position is terminal");
  return makeFen(position.toSetup());
}

/**
 * Constructed only by the run service from its own run record: the root FEN is replayed from the
 * start position and history, and both digests are derived here rather than accepted.
 */
export function sealBotRootAuthority(input: {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly preCommitEventHeadDigest: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly seed: number;
}): BotOperationRootAuthority {
  for (const [label, value] of [["runId", input.runId], ["branchId", input.branchId], ["nodeId", input.nodeId]] as const) {
    if (typeof value !== "string" || !ROOT_ID.test(value)) refuse(`${label} must be a bounded non-empty identity`);
  }
  if (!DIGEST.test(input.preCommitEventHeadDigest)) refuse("preCommitEventHeadDigest must be a canonical sha256 digest");
  if (!Number.isSafeInteger(input.seed)) refuse("seed must be a safe integer");
  const historyUci = Object.freeze([...input.historyUci]);
  const beforeFen = replayHistory(input.startFen, historyUci);
  const value = deepFreeze({
    identity: {
      runId: input.runId,
      branchId: input.branchId,
      nodeId: input.nodeId,
      preCommitEventHeadDigest: input.preCommitEventHeadDigest as Sha256,
      beforeFenDigest: canonicalSha256(beforeFen),
      historyDigest: canonicalSha256({ startFen: input.startFen, historyUci }),
    },
    beforeFen,
    startFen: input.startFen,
    historyUci,
    seed: input.seed,
  });
  ROOTS.add(value);
  return value;
}

export interface BotExactLegalMoveMap {
  readonly root: BotRootIdentity;
  readonly moves: readonly string[];
  readonly digest: Sha256;
}

/** The baseline legality authority, derived once from the sealed root (never from a provider). */
export function compileBotLegalMoveMap(root: BotOperationRootAuthority): BotExactLegalMoveMap {
  if (!ROOTS.has(root)) refuse("unsealed root authority");
  const moves = Object.freeze(exactLegalMoves(root.beforeFen).map((move) => move.uci));
  const value = deepFreeze({ root: root.identity, moves, digest: canonicalSha256({ root: root.identity, moves }) });
  LEGAL_MAPS.add(value);
  return value;
}

export interface BotClassifierView {
  readonly root: BotRootIdentity;
  readonly legalMapDigest: Sha256;
  readonly rows: readonly Readonly<{ moveUci: string; classifiers: readonly BotClassifierId[] }>[];
  readonly digest: Sha256;
}

/** The registered legal-board `pawn_move@1` view, set-equal to the sealed legal map. */
export function compileBotClassifierView(root: BotOperationRootAuthority, legal: BotExactLegalMoveMap): BotClassifierView {
  if (!ROOTS.has(root) || !LEGAL_MAPS.has(legal) || !same(legal.root, root.identity)) refuse("unsealed classifier input");
  const rows = classifyPawnMoves(root.beforeFen).map((row) => ({ moveUci: row.moveUci, classifiers: row.classifiers }));
  if (!same(rows.map((row) => row.moveUci), legal.moves)) refuse("classifier population is not set-equal to the legal map");
  const body = { root: root.identity, legalMapDigest: legal.digest, rows };
  const value = deepFreeze({ ...body, digest: canonicalSha256(body) });
  CLASSIFIER_VIEWS.add(value);
  return value;
}

// ---------------------------------------------------------------------------------------------
// Provider payloads.

export interface BotMaiaPolicyPage {
  readonly operation: "maia.policy_page@1";
  readonly request: Readonly<{
    startFen: string;
    historyUci: readonly string[];
    band: number;
    model: Readonly<{ id: string; version: string }>;
    temperature: number;
    topP: number;
    requestedWidth: number;
  }>;
  readonly actual: Readonly<{ modelId: string; version: string }>;
  readonly coverage: "bounded_top_k";
  readonly rows: readonly Readonly<{ moveUci: string; rawMass: number }>[];
  /**
   * The exact shared-delivery identity this page was read from (`bot-opponent-source.ts`). It is
   * part of the payload, so the payload digest — and with it the derivation and commit operand
   * digests — binds the provider's normalized request, response bytes, parsed payload and actual
   * identity. Acquisition/serve times are deliberately absent.
   */
  readonly source?: BotProviderSourceIdentity;
}

export interface BotProviderSourceIdentity {
  readonly normalizedRequestDigest: string;
  readonly responseDigest: string;
  readonly payloadDigest: string;
  readonly actualIdentityDigest: string;
  readonly generation: number | null;
}

export type BotStockfishScore =
  | Readonly<{ kind: "centipawns"; value: number }>
  | Readonly<{ kind: "mate"; value: number }>;

export interface BotStockfishRootTable {
  readonly operation: "stockfish.legal_root_table@1";
  readonly request: Readonly<{
    fen: string;
    engine: "stockfish-guard@1";
    searchBound: Readonly<{ kind: "depth"; value: number }>;
    perspective: "root_side";
  }>;
  readonly rows: readonly Readonly<{ moveUci: string; depth: number; score: BotStockfishScore }>[];
  readonly source?: BotProviderSourceIdentity;
}

export type BotProviderResult<T> =
  | Readonly<{ kind: "success"; payload: T }>
  | Readonly<{ kind: "failure"; reason: "unavailable" | "deadline" | "invalid_response" }>;

// ---------------------------------------------------------------------------------------------
// Decision record grammar (§6).

export type BotConsideredGuard =
  | Readonly<{ kind: "not_requested" }>
  | Readonly<{ kind: "applied"; sourceScore: Readonly<{ kind: "centipawns"; value: number }>; lossCp: number; admitted: boolean }>
  | Readonly<{ kind: "abstained"; reason: BotGuardAbstentionReason; sourceScore?: BotStockfishScore }>;

export interface BotPolicyLayerRecord {
  readonly id: BotLayerId;
  readonly action: "applied" | "abstained" | "degraded";
  readonly reason?: BotDegradationReason;
}

export interface BotConsideredRow {
  readonly moveUci: string;
  readonly rawMass: number;
  readonly reconstructedMass: number;
  readonly finalMass: number;
  readonly guard: BotConsideredGuard;
  readonly classifiers: readonly BotClassifierId[];
  readonly features: readonly never[];
}

export interface BotPolicyDerivation {
  readonly root: BotRootIdentity;
  readonly profile: BotProfileReference;
  readonly seed: number;
  readonly sources: Readonly<{
    maia: Readonly<{ operation: "maia.policy_page@1"; payload: BotMaiaPolicyPage; payloadDigest: Sha256 }>;
    stockfish?:
      | Readonly<{ operation: "stockfish.legal_root_table@1"; payload: BotStockfishRootTable; payloadDigest: Sha256 }>
      | Readonly<{ operation: "stockfish.legal_root_table@1"; failure: "unavailable" | "deadline" | "invalid_response" | "not_delivered" }>;
  }>;
  readonly returnedWidth: number;
  readonly returnedProbabilityMass: number;
  readonly maiaCoverage: "bounded_subset" | "legal_set_equal";
  readonly layers: readonly BotPolicyLayerRecord[];
  readonly guardReference?: Readonly<{ moveUci: string; cp: number }>;
  readonly considered: readonly BotConsideredRow[];
  readonly chosenMoveUci: string;
}

export interface BotPolicyDecisionRecord extends BotPolicyDerivation {
  readonly derivationDigest: Sha256;
}

export interface BotPolicyExecution {
  readonly entry: BotProfileCatalogEntry;
  readonly derivation: BotPolicyDerivation;
}

export type BotPolicyCompileResult =
  | Readonly<{ kind: "executed"; execution: BotPolicyExecution }>
  | Readonly<{ kind: "base_provider_unavailable"; reason: "unavailable" | "deadline"; retryable: true }>
  | Readonly<{ kind: "provider_failed"; reason: BotMaiaRefusal; retryable: true }>;

export type BotMaiaRefusal =
  | "invalid_response"
  | "maia_empty_page"
  | "maia_duplicate_move"
  | "maia_move_outside_legal_map"
  | "maia_invalid_mass"
  | "maia_root_mismatch"
  | "maia_profile_mismatch";

// ---------------------------------------------------------------------------------------------
// Compiler.

function admitMaia(page: BotMaiaPolicyPage, root: BotOperationRootAuthority, legal: BotExactLegalMoveMap, entry: BotProfileCatalogEntry): BotMaiaRefusal | undefined {
  const profile = entry.reference;
  if (page.operation !== "maia.policy_page@1" || page.coverage !== "bounded_top_k") return "invalid_response";
  if (page.request.startFen !== root.startFen || !same(page.request.historyUci, root.historyUci)) return "maia_root_mismatch";
  if (page.request.band !== profile.band
    || page.request.model.id !== profile.model.id || page.request.model.version !== profile.model.version
    || page.actual.modelId !== profile.model.id || page.actual.version !== profile.model.version
    || page.request.temperature !== profile.sampler.temperature || page.request.topP !== profile.sampler.topP
    || page.request.requestedWidth !== profile.sampler.requestedWidth) {
    return "maia_profile_mismatch";
  }
  if (page.rows.length === 0) return "maia_empty_page";
  const moves = page.rows.map((row) => row.moveUci);
  if (new Set(moves).size !== moves.length) return "maia_duplicate_move";
  const legalSet = new Set(legal.moves);
  if (moves.some((move) => !legalSet.has(move))) return "maia_move_outside_legal_map";
  if (page.rows.some((row) => !Number.isFinite(row.rawMass) || row.rawMass < 0 || row.rawMass > 1)
    || !(page.rows.reduce((sum, row) => sum + row.rawMass, 0) > 0)) {
    return "maia_invalid_mass";
  }
  return undefined;
}

type GuardView =
  | Readonly<{ kind: "not_requested" }>
  | Readonly<{ kind: "abstained"; reason: BotGuardAbstentionReason; scores: ReadonlyMap<string, BotStockfishScore> }>
  | Readonly<{ kind: "applied"; referenceMoveUci: string; referenceCp: number; cp: ReadonlyMap<string, number> }>;

/**
 * Derives the whole-guard view from the all-legal root table. The reference is the best legal
 * centipawn row, which may sit outside the bounded Maia window; any mate row, duplicate/missing/
 * extra/short-depth row, wrong root or failed delivery abstains the WHOLE guard ([[D3029]]).
 */
function deriveGuard(
  stockfish: BotProviderResult<BotStockfishRootTable> | undefined,
  root: BotOperationRootAuthority,
  legal: BotExactLegalMoveMap,
): GuardView {
  const none = new Map<string, BotStockfishScore>();
  if (stockfish === undefined) return { kind: "abstained", reason: "guard_unavailable", scores: none };
  if (stockfish.kind === "failure") {
    return { kind: "abstained", reason: stockfish.reason === "deadline" ? "guard_deadline" : stockfish.reason === "unavailable" ? "guard_unavailable" : "guard_source_failure", scores: none };
  }
  const table = stockfish.payload;
  const declared = BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters;
  if (table.operation !== "stockfish.legal_root_table@1" || table.request.engine !== declared.engine
    || table.request.searchBound.kind !== declared.searchBound.kind || table.request.searchBound.value !== declared.searchBound.value
    || table.request.perspective !== "root_side") {
    return { kind: "abstained", reason: "guard_source_failure", scores: none };
  }
  const moves = table.rows.map((row) => row.moveUci);
  if (table.request.fen !== root.beforeFen || new Set(moves).size !== moves.length || !same([...moves].sort(), [...legal.moves].sort())) {
    return { kind: "abstained", reason: "guard_candidate_mismatch", scores: none };
  }
  const scores = new Map(table.rows.map((row) => [row.moveUci, row.score] as const));
  if (table.rows.some((row) => row.depth < declared.searchBound.value || !Number.isFinite(row.score.value))) {
    return { kind: "abstained", reason: "guard_source_failure", scores };
  }
  const cpRows = table.rows.filter((row) => row.score.kind === "centipawns");
  if (cpRows.length !== table.rows.length) {
    return { kind: "abstained", reason: cpRows.length === 0 ? "guard_mate_domain" : "guard_mixed_domain", scores };
  }
  const reference = [...cpRows].sort((left, right) => right.score.value - left.score.value || left.moveUci.localeCompare(right.moveUci))[0]!;
  return {
    kind: "applied",
    referenceMoveUci: reference.moveUci,
    referenceCp: reference.score.value,
    cp: new Map(cpRows.map((row) => [row.moveUci, row.score.value] as const)),
  };
}

function renormalize(rows: readonly PolicyMassRow[], weight: (row: PolicyMassRow) => number): readonly PolicyMassRow[] {
  const weighted = rows.map((row) => ({ row, mass: row.finalMass * weight(row) }));
  const total = weighted.reduce((sum, item) => sum + item.mass, 0);
  if (!(total > 0)) return rows;
  return weighted.map(({ row, mass }) => ({ ...row, finalMass: mass / total }));
}

function sealedEntry(profile: unknown): BotProfileCatalogEntry {
  return resolveBotProfileReference(profile);
}

/**
 * The sole transform/sampler constructor. Returns a sealed execution, or a typed no-move when the
 * Maia base distribution is not delivered — there is no base fallback after Maia fails (§4.3).
 */
export function compileBotPolicyExecution(input: {
  readonly root: BotOperationRootAuthority;
  readonly legal: BotExactLegalMoveMap;
  readonly classifiers: BotClassifierView;
  readonly profile: unknown;
  readonly maia: BotProviderResult<BotMaiaPolicyPage>;
  readonly stockfish?: BotProviderResult<BotStockfishRootTable>;
}): BotPolicyCompileResult {
  const entry = sealedEntry(input.profile);
  const { root, legal, classifiers } = input;
  if (!ROOTS.has(root) || !LEGAL_MAPS.has(legal) || !CLASSIFIER_VIEWS.has(classifiers)
    || !same(legal.root, root.identity) || !same(classifiers.root, root.identity) || classifiers.legalMapDigest !== legal.digest) {
    refuse("unsealed or crossed root/legal/classifier authority");
  }
  if (input.maia.kind === "failure") {
    return input.maia.reason === "invalid_response"
      ? Object.freeze({ kind: "provider_failed", reason: "invalid_response", retryable: true })
      : Object.freeze({ kind: "base_provider_unavailable", reason: input.maia.reason, retryable: true });
  }
  const page = input.maia.payload;
  const refusal = admitMaia(page, root, legal, entry);
  if (refusal !== undefined) return Object.freeze({ kind: "provider_failed", reason: refusal, retryable: true });

  const profile = entry.reference;
  const compare = (left: string, right: string): number => {
    const leftKey = neutralTiebreakKey(root.beforeFen, left);
    const rightKey = neutralTiebreakKey(root.beforeFen, right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : left.localeCompare(right);
  };
  const orderedRows = [...page.rows].sort((left, right) => left.moveUci.localeCompare(right.moveUci));
  const reconstructed = reconstructMaiaDistribution(
    orderedRows.map((row) => ({ moveUci: row.moveUci, mass: row.rawMass })),
    profile.sampler.temperature,
    profile.sampler.topP,
    compare,
  );
  const returnedProbabilityMass = reconstructed.completeness;
  const layers: BotPolicyLayerRecord[] = [];
  layers.push(returnedProbabilityMass < profile.sampler.returnedMassFloor
    ? { id: "sampler.maia_reconstruction@1", action: "degraded", reason: "returned_mass_below_profile_floor" }
    : { id: "sampler.maia_reconstruction@1", action: "applied" });

  let rows: readonly PolicyMassRow[] = reconstructed.rows;
  const wantsGuard = profile.orderedLayers.includes("guard.severe_error@1");
  const guard: GuardView = wantsGuard ? deriveGuard(input.stockfish, root, legal) : { kind: "not_requested" };
  let guardApplied = false;
  let guardAbstention: BotGuardAbstentionReason | undefined;
  if (guard.kind === "applied") {
    const threshold = BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters.thresholdCp;
    const admitted = (move: string): boolean => guard.referenceCp - guard.cp.get(move)! < threshold;
    const survivors = rows.filter((row) => row.finalMass > 0 && admitted(row.moveUci));
    if (survivors.length === 0) {
      guardAbstention = "empty_after_mask";
    } else {
      rows = renormalize(rows, (row) => admitted(row.moveUci) ? 1 : 0);
      guardApplied = true;
    }
  } else if (guard.kind === "abstained") {
    guardAbstention = guard.reason;
  }
  if (wantsGuard) {
    layers.push(guardApplied
      ? { id: "guard.severe_error@1", action: "applied" }
      : { id: "guard.severe_error@1", action: "abstained", reason: guardAbstention! });
  }

  const classifierByMove = new Map(classifiers.rows.map((row) => [row.moveUci, row.classifiers] as const));
  if (profile.orderedLayers.includes("trait.pawn_preference@1")) {
    if (guardApplied) {
      const { classifier, multiplier } = BOT_LAYER_DECLARATIONS["trait.pawn_preference@1"].parameters;
      rows = renormalize(rows, (row) => classifierByMove.get(row.moveUci)?.includes(classifier) === true ? multiplier : 1);
      layers.push({ id: "trait.pawn_preference@1", action: "applied" });
    } else {
      layers.push({ id: "trait.pawn_preference@1", action: "abstained", reason: "guard_dependency_abstained" });
    }
  }

  const chosenMoveUci = drawPolicyMoveBy(rows, seededPolicyUnit(root.seed, root.identity.historyDigest), compare);
  if (chosenMoveUci === undefined) refuse("the compiled distribution carries no positive mass");

  const finalByMove = new Map(rows.map((row) => [row.moveUci, row.finalMass] as const));
  const considered: BotConsideredRow[] = reconstructed.rows.map((row) => {
    let guardRecord: BotConsideredGuard;
    if (guard.kind === "not_requested") guardRecord = { kind: "not_requested" };
    else if (guard.kind === "applied" && guardApplied) {
      const cp = guard.cp.get(row.moveUci)!;
      const lossCp = guard.referenceCp - cp;
      guardRecord = { kind: "applied", sourceScore: { kind: "centipawns", value: cp }, lossCp, admitted: lossCp < BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters.thresholdCp };
    } else {
      const score = guard.kind === "abstained" ? guard.scores.get(row.moveUci) : guard.kind === "applied" ? { kind: "centipawns" as const, value: guard.cp.get(row.moveUci)! } : undefined;
      guardRecord = { kind: "abstained", reason: guardAbstention!, ...(score === undefined ? {} : { sourceScore: score }) };
    }
    return {
      moveUci: row.moveUci,
      rawMass: row.rawMass,
      reconstructedMass: row.sampledMass,
      finalMass: finalByMove.get(row.moveUci) ?? 0,
      guard: guardRecord,
      classifiers: classifierByMove.get(row.moveUci) ?? [],
      features: [],
    };
  });

  const maiaMoves = page.rows.map((row) => row.moveUci);
  const stockfishSource = !wantsGuard
    ? undefined
    : input.stockfish === undefined
      ? { operation: "stockfish.legal_root_table@1" as const, failure: "not_delivered" as const }
      : input.stockfish.kind === "failure"
        ? { operation: "stockfish.legal_root_table@1" as const, failure: input.stockfish.reason }
        : { operation: "stockfish.legal_root_table@1" as const, payload: input.stockfish.payload, payloadDigest: canonicalSha256(input.stockfish.payload) };
  const derivation: BotPolicyDerivation = deepFreeze(structuredClone({
    root: root.identity,
    profile,
    seed: root.seed,
    sources: {
      maia: { operation: "maia.policy_page@1" as const, payload: page, payloadDigest: canonicalSha256(page) },
      ...(stockfishSource === undefined ? {} : { stockfish: stockfishSource }),
    },
    returnedWidth: page.rows.length,
    returnedProbabilityMass,
    maiaCoverage: same([...maiaMoves].sort(), [...legal.moves].sort()) ? "legal_set_equal" as const : "bounded_subset" as const,
    layers,
    ...(guard.kind === "applied" && guardApplied ? { guardReference: { moveUci: guard.referenceMoveUci, cp: guard.referenceCp } } : {}),
    considered,
    chosenMoveUci,
  }));
  const execution = Object.freeze({ entry, derivation });
  EXECUTIONS.add(execution);
  return Object.freeze({ kind: "executed", execution });
}

/** Adds the deterministic digest to a sealed execution; plain objects and forgeries refuse. */
export function projectBotPolicyDecisionRecord(execution: BotPolicyExecution): BotPolicyDecisionRecord {
  if (!EXECUTIONS.has(execution)) refuse("forged or unsealed policy execution");
  const value = deepFreeze(structuredClone({ ...execution.derivation, derivationDigest: canonicalSha256(execution.derivation) }));
  DECISIONS.add(value);
  return value;
}

export function isSealedBotPolicyDecision(value: unknown): value is BotPolicyDecisionRecord {
  return typeof value === "object" && value !== null && DECISIONS.has(value);
}

// ---------------------------------------------------------------------------------------------
// Durable replay ([[D3026]]/[[D3027]]): stored bytes are recompiled from independent authorities.

export interface BotPolicyReplayAuthority {
  readonly root: BotOperationRootAuthority;
  readonly legal: BotExactLegalMoveMap;
  readonly classifiers: BotClassifierView;
  readonly profile: BotProfileReference;
  readonly maia: BotProviderResult<BotMaiaPolicyPage>;
  readonly stockfish?: BotProviderResult<BotStockfishRootTable>;
}

/**
 * Assembled from independently loaded authorities: the run record's root, the legal/classifier
 * views compiled from it, the catalog member named by the run and the operation-specific provider
 * results. It never accepts a stored envelope.
 */
export function sealBotPolicyReplayAuthority(input: BotPolicyReplayAuthority): BotPolicyReplayAuthority {
  if (!ROOTS.has(input.root) || !LEGAL_MAPS.has(input.legal) || !CLASSIFIER_VIEWS.has(input.classifiers)) refuse("replay authority carries unsealed views");
  const entry = resolveBotProfileReference(input.profile);
  const value = Object.freeze({ ...input, profile: entry.reference });
  REPLAY_AUTHORITIES.add(value);
  return value;
}

const DECISION_KEYS = ["root", "profile", "seed", "sources", "returnedWidth", "returnedProbabilityMass", "maiaCoverage", "layers", "considered", "chosenMoveUci", "derivationDigest"];

/**
 * The one parser over unknown stored decision bytes. It reruns source admission, top-p, guard,
 * trait and the seeded draw from the replay authority and requires byte equality of the whole
 * canonical record — a self-consistent rewrite with matching private hashes still fails.
 */
export function parseBotPolicyDecisionRecord(bytes: unknown, authority: BotPolicyReplayAuthority): BotPolicyDecisionRecord {
  if (!REPLAY_AUTHORITIES.has(authority)) refuse("unsealed replay authority");
  if (bytes === null || typeof bytes !== "object" || Array.isArray(bytes)) refuse("stored decision is not an object");
  const keys = Object.keys(bytes);
  const allowed = new Set([...DECISION_KEYS, "guardReference"]);
  if (keys.some((key) => !allowed.has(key)) || DECISION_KEYS.some((key) => !keys.includes(key))) refuse("stored decision has an invalid shape");
  const stored = bytes as Readonly<Record<string, unknown>>;
  if (typeof stored.derivationDigest !== "string" || !DIGEST.test(stored.derivationDigest)) refuse("stored decision digest is not canonical");
  const recompiled = compileBotPolicyExecution({
    root: authority.root,
    legal: authority.legal,
    classifiers: authority.classifiers,
    profile: authority.profile,
    maia: authority.maia,
    ...(authority.stockfish === undefined ? {} : { stockfish: authority.stockfish }),
  });
  if (recompiled.kind !== "executed") refuse(`replay authority no longer produces a decision (${recompiled.kind})`);
  const decision = projectBotPolicyDecisionRecord(recompiled.execution);
  if (!same(decision, bytes)) refuse("stored decision differs from its independent reconstruction");
  return decision;
}

// ---------------------------------------------------------------------------------------------
// Non-circular operation envelope (§4.1, §6).

export interface BotOperationRecord {
  readonly requestId: `botreq_${string}`;
  readonly root: BotRootIdentity;
  readonly writerLeaseDigest: Sha256;
  readonly profileDigest: Sha256;
  readonly seed: number;
  readonly preProviderOperandDigest: Sha256;
  readonly commitOperandDigest: Sha256;
  readonly derivationDigest: Sha256;
  readonly providerDeliveryDigests: readonly Sha256[];
  readonly chosenMoveUci: string;
  readonly committedEventSequence: number;
  readonly operationDigest: Sha256;
  readonly timingMs: Readonly<{ total: number; maia: number; guard: number; composition: number }>;
}

export interface BotPolicyEventEnvelope {
  readonly decision: BotPolicyDecisionRecord;
  readonly operation: BotOperationRecord;
}

/** Computed BEFORE any provider call: request id, public root, writer lease, profile and seed. */
export function botPreProviderOperandDigest(input: {
  readonly requestId: string;
  readonly root: BotRootIdentity;
  readonly writerLeaseDigest: string;
  readonly profileDigest: string;
  readonly seed: number;
}): Sha256 {
  return canonicalSha256({ requestId: input.requestId, root: input.root, writerLeaseDigest: input.writerLeaseDigest, profileDigest: input.profileDigest, seed: input.seed });
}

function providerDigests(decision: BotPolicyDecisionRecord): readonly Sha256[] {
  const stockfish = decision.sources.stockfish;
  return Object.freeze([
    decision.sources.maia.payloadDigest,
    ...(stockfish !== undefined && "payloadDigest" in stockfish ? [stockfish.payloadDigest] : []),
  ]);
}

function operationImage(record: Omit<BotOperationRecord, "operationDigest" | "timingMs">): unknown {
  return record;
}

/**
 * Binds a sealed decision to its request, writer lease and allocated event sequence. The digest
 * excludes timing, the resulting event-head digest and itself; the event log's own hash protects
 * the envelope, so the image is non-circular.
 */
export function compileBotPolicyEventEnvelope(input: {
  readonly decision: BotPolicyDecisionRecord;
  readonly requestId: `botreq_${string}`;
  readonly writerLeaseDigest: Sha256;
  readonly committedEventSequence: number;
  readonly timingMs: BotOperationRecord["timingMs"];
}): BotPolicyEventEnvelope {
  if (!DECISIONS.has(input.decision)) refuse("envelope requires a sealed decision");
  if (!DIGEST.test(input.writerLeaseDigest)) refuse("writer lease digest must be canonical");
  if (!Number.isSafeInteger(input.committedEventSequence) || input.committedEventSequence < 1) refuse("event sequence must be a positive integer");
  for (const value of Object.values(input.timingMs)) if (!Number.isFinite(value) || value < 0) refuse("timing must be finite and non-negative");
  const decision = input.decision;
  const preProviderOperandDigest = botPreProviderOperandDigest({
    requestId: input.requestId,
    root: decision.root,
    writerLeaseDigest: input.writerLeaseDigest,
    profileDigest: decision.profile.digest,
    seed: decision.seed,
  });
  const deliveries = providerDigests(decision);
  const commitOperandDigest = canonicalSha256({ preProviderOperandDigest, derivationDigest: decision.derivationDigest, providerDeliveryDigests: deliveries });
  const body = {
    requestId: input.requestId,
    root: decision.root,
    writerLeaseDigest: input.writerLeaseDigest,
    profileDigest: decision.profile.digest,
    seed: decision.seed,
    preProviderOperandDigest,
    commitOperandDigest,
    derivationDigest: decision.derivationDigest,
    providerDeliveryDigests: deliveries,
    chosenMoveUci: decision.chosenMoveUci,
    committedEventSequence: input.committedEventSequence,
  };
  const operation = deepFreeze(structuredClone({ ...body, operationDigest: canonicalSha256(operationImage(body)), timingMs: { ...input.timingMs } }));
  const envelope = Object.freeze({ decision, operation });
  ENVELOPES.add(envelope);
  return envelope;
}

/**
 * The single envelope parser used by storage, replay and export. The decision is recompiled from
 * the replay authority; every operation digest is re-derived and cross-checked against it.
 */
export function parseBotPolicyEventEnvelope(bytes: unknown, authority: BotPolicyReplayAuthority): BotPolicyEventEnvelope {
  if (bytes === null || typeof bytes !== "object" || Array.isArray(bytes)) refuse("stored envelope is not an object");
  const stored = bytes as Readonly<Record<string, unknown>>;
  if (Object.keys(stored).sort().join(",") !== "decision,operation") refuse("stored envelope has an invalid shape");
  const decision = parseBotPolicyDecisionRecord(stored.decision, authority);
  const operation = stored.operation;
  if (operation === null || typeof operation !== "object" || Array.isArray(operation)) refuse("stored operation is not an object");
  const op = operation as Readonly<Record<string, unknown>>;
  const expectedKeys = ["requestId", "root", "writerLeaseDigest", "profileDigest", "seed", "preProviderOperandDigest", "commitOperandDigest", "derivationDigest", "providerDeliveryDigests", "chosenMoveUci", "committedEventSequence", "operationDigest", "timingMs"].sort();
  if (Object.keys(op).sort().join(",") !== expectedKeys.join(",")) refuse("stored operation has an invalid shape");
  const timing = op.timingMs;
  if (timing === null || typeof timing !== "object" || Object.keys(timing).sort().join(",") !== "composition,guard,maia,total") refuse("stored timing has an invalid shape");
  if (typeof op.requestId !== "string" || !/^botreq_[A-Za-z0-9_-]{16,128}$/u.test(op.requestId)) refuse("stored request id is invalid");
  if (typeof op.writerLeaseDigest !== "string" || !DIGEST.test(op.writerLeaseDigest)) refuse("stored writer lease digest is invalid");
  if (typeof op.committedEventSequence !== "number") refuse("stored event sequence is invalid");
  const rebuilt = compileBotPolicyEventEnvelope({
    decision,
    requestId: op.requestId as `botreq_${string}`,
    writerLeaseDigest: op.writerLeaseDigest as Sha256,
    committedEventSequence: op.committedEventSequence,
    timingMs: timing as BotOperationRecord["timingMs"],
  });
  if (!same(rebuilt.operation, op)) refuse("stored operation differs from its re-derived image");
  return rebuilt;
}

export function isSealedBotPolicyEventEnvelope(value: unknown): value is BotPolicyEventEnvelope {
  return typeof value === "object" && value !== null && ENVELOPES.has(value);
}
