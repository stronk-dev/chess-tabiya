import {
  FLOAT32_POLICY_MASS_TOLERANCE,
  RUN_OPPONENT_MODES,
  exactLegalMoves,
  type OpponentSelection,
  type SelectionCandidate,
  type SelectionEngineIdentity,
} from "@chess-tabiya/runtime";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

type RecordValue = Readonly<Record<string, unknown>>;
type SelectionRequest = Readonly<{
  startFen: string;
  historyUci: readonly string[];
  policy: Readonly<{ mode: string }>;
}>;

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

function integer(value: unknown, label: string, minimum = Number.MIN_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a safe integer`);
  return Number(value);
}

function finite(value: unknown, label: string, minimum?: number, maximum?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  if ((minimum !== undefined && value < minimum) || (maximum !== undefined && value > maximum)) throw new TypeError(`${label} is outside its bounds`);
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
  return value;
}

function uci(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(parsed)) throw new TypeError(`${label} must be a UCI move`);
  return parsed;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function parseSelectionEngine(value: unknown, label: string): SelectionEngineIdentity {
  const item = record(value, label);
  exact(item, ["id", "name", "version", "seedHonored"], label, ["modelId", "containerDigest", "eloHonored", "eloApplied", "searchBound"]);
  nonempty(item.id, `${label}/id`); nonempty(item.name, `${label}/name`); nonempty(item.version, `${label}/version`); boolean(item.seedHonored, `${label}/seedHonored`);
  if (item.modelId !== undefined) nonempty(item.modelId, `${label}/modelId`);
  if (item.containerDigest !== undefined) nonempty(item.containerDigest, `${label}/containerDigest`);
  if (item.eloHonored !== undefined) boolean(item.eloHonored, `${label}/eloHonored`);
  if (item.eloApplied !== undefined) integer(item.eloApplied, `${label}/eloApplied`, 0);
  if (item.searchBound !== undefined) {
    const bound = record(item.searchBound, `${label}/searchBound`); exact(bound, ["kind", "value"], `${label}/searchBound`);
    oneOf(bound.kind, ["nodes", "movetime"] as const, `${label}/searchBound/kind`); integer(bound.value, `${label}/searchBound/value`, 1);
  }
  return item as unknown as SelectionEngineIdentity;
}

export function parseSelectionCandidates(
  value: unknown,
  label: string,
  options: Readonly<{ allowEmpty: boolean; legalMoves?: ReadonlySet<string>; selectedMove?: string }> = { allowEmpty: true },
): readonly SelectionCandidate[] {
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) throw new TypeError(`${label} must be ${options.allowEmpty ? "an" : "a non-empty"} array`);
  const moves = new Set<string>(), ranks = new Set<number>();
  let priorRank = 0, measuredMass = 0, offWindowCount = 0;
  const parsed = value.map((raw, index): SelectionCandidate => {
    const rowLabel = `${label}/${index}`, item = record(raw, rowLabel);
    exact(item, ["moveUci", "rank"], rowLabel, ["mass", "concessionRatio", "offWindow", "scoreCp", "wdl"]);
    const move = uci(item.moveUci, `${rowLabel}/moveUci`), rank = integer(item.rank, `${rowLabel}/rank`, 1);
    if (options.legalMoves !== undefined && !options.legalMoves.has(move)) throw new TypeError(`${rowLabel}/moveUci is not legal in the requested position`);
    if (moves.has(move) || ranks.has(rank)) throw new TypeError(`${label} contains duplicate move or rank identities`);
    if (rank <= priorRank) throw new TypeError(`${label} is not ordered by rank`);
    moves.add(move); ranks.add(rank); priorRank = rank;
    const offWindow = item.offWindow === undefined ? false : boolean(item.offWindow, `${rowLabel}/offWindow`);
    if (offWindow) {
      offWindowCount += 1;
      if (move !== options.selectedMove || index !== value.length - 1) throw new TypeError(`${rowLabel} is not the selected trailing off-window move`);
    }
    if (item.mass !== undefined) {
      const mass = finite(item.mass, `${rowLabel}/mass`, 0, 1 + FLOAT32_POLICY_MASS_TOLERANCE);
      if (offWindow) throw new TypeError(`${rowLabel} cannot report mass for an off-window move`);
      measuredMass += mass;
    }
    if (item.concessionRatio !== undefined) finite(item.concessionRatio, `${rowLabel}/concessionRatio`, 0, 1);
    if (item.scoreCp !== undefined) integer(item.scoreCp, `${rowLabel}/scoreCp`);
    if (item.wdl !== undefined) {
      const wdl = record(item.wdl, `${rowLabel}/wdl`); exact(wdl, ["win", "draw", "loss"], `${rowLabel}/wdl`);
      const win = integer(wdl.win, `${rowLabel}/wdl/win`, 0), draw = integer(wdl.draw, `${rowLabel}/wdl/draw`, 0), loss = integer(wdl.loss, `${rowLabel}/wdl/loss`, 0);
      if (win + draw + loss !== 1000) throw new TypeError(`${rowLabel}/wdl must sum to 1000`);
    }
    return item as unknown as SelectionCandidate;
  });
  if (measuredMass > 1 + FLOAT32_POLICY_MASS_TOLERANCE) throw new TypeError(`${label} measured policy mass exceeds 1`);
  if (offWindowCount > 1) throw new TypeError(`${label} contains more than one off-window move`);
  if (options.selectedMove !== undefined && parsed.length > 0 && !moves.has(options.selectedMove)) throw new TypeError(`${label} does not contain the selected move`);
  return parsed;
}

function requestedFen(request: SelectionRequest): string {
  try {
    const position = Chess.fromSetup(parseFen(request.startFen).unwrap()).unwrap();
    for (const [index, raw] of request.historyUci.entries()) {
      const move = parseUci(raw);
      if (move === undefined || !("from" in move)) throw new TypeError(`request/historyUci/${index} is not a move`);
      const normalized = normalizeMove(position, move);
      if (!position.isLegal(normalized)) throw new TypeError(`request/historyUci/${index} is illegal`);
      position.play(normalized);
    }
    return makeFen(position.toSetup());
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError("selection request does not describe a legal position", { cause: error });
  }
}

export function parseOpponentSelection(value: unknown, request: SelectionRequest): OpponentSelection {
  const requestedMode = oneOf(request.policy.mode, RUN_OPPONENT_MODES, "request/policy/mode"), fen = requestedFen(request);
  const legalMoves = new Set(exactLegalMoves(fen).map((move) => move.uci));
  const item = record(value, "opponent-selection"); exact(item, ["moveUci", "policyModeApplied", "engine"], "opponent-selection", ["orderingBasis", "candidates"]);
  const move = uci(item.moveUci, "opponent-selection/moveUci"); if (!legalMoves.has(move)) throw new TypeError("opponent-selection/moveUci is not legal in the requested position");
  const applied = oneOf(item.policyModeApplied, RUN_OPPONENT_MODES, "opponent-selection/policyModeApplied");
  if (applied !== requestedMode && !(requestedMode === "theory_strict" && applied === "human_common")) throw new TypeError("opponent-selection did not apply the requested policy");
  if (applied === "perfect_tablebase") oneOf(item.orderingBasis, ["dtz_ascending", "dtz_descending", "none"] as const, "opponent-selection/orderingBasis");
  else if (item.orderingBasis !== undefined) throw new TypeError("opponent-selection orderingBasis requires perfect_tablebase");
  if (item.candidates !== undefined) parseSelectionCandidates(item.candidates, "opponent-selection/candidates", { allowEmpty: false, legalMoves, selectedMove: move });
  parseSelectionEngine(item.engine, "opponent-selection/engine");
  return deepFreeze(structuredClone(item)) as unknown as OpponentSelection;
}
