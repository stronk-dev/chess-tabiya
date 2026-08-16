import { createHash } from "node:crypto";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import {
  PolicyMassError,
  humanConcessionMass,
  transposeKey,
  type OpponentSelection,
  type RunOpponentMode,
  type SelectionCandidate,
  type SelectionEngineIdentity,
} from "@chess-tabiya/runtime";

import type {
  EngineHealth,
  EngineIdentity,
  EngineRequest,
  EngineSupervisor,
} from "./engine-supervisor.js";
import {
  ServerError,
  engineUnavailable,
  policyModeUnsupported,
} from "./errors.js";
import { appliedTargetElo } from "./engine-band.js";
import {
  resolveStrongEngineProfile,
  type StrongEngineProfile,
} from "./strong-engine.js";
import { invertTablebaseCategory, type TablebaseMove, type TablebaseSource } from "./tablebase.js";

export type OpponentPolicyMode = RunOpponentMode;

export interface SelectorSpineNode {
  readonly id: string;
  readonly moveUci: string;
  readonly children: readonly SelectorSpineNode[];
}

export interface SelectorPolicy {
  readonly mode: string;
  readonly policyConfigDigest: string;
  readonly targetElo?: number;
  readonly temperature?: number;
  readonly topP?: number;
  readonly spine?: readonly SelectorSpineNode[];
}

export interface SelectMoveRequest {
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly policy: SelectorPolicy;
  readonly seed: number;
  readonly packId?: string;
}

export interface SelectorEngineClient {
  execute(engineId: string, request: EngineRequest): Promise<readonly string[]>;
  health(engineId: string): EngineHealth;
}

export interface OpponentSelectorOptions {
  readonly maiaEngineId?: string;
  readonly strongEngineId?: string;
  readonly strongEngineMovetimeMs?: number;
  readonly strongEngineProfile?: Partial<StrongEngineProfile>;
  readonly tablebaseSource?: TablebaseSource;
}

const DEFAULT_TEMPERATURE = 0.8;
const DEFAULT_TOP_P = 0.92;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

function invalid(message: string, cause?: Error): ServerError {
  return new ServerError("INVALID_REQUEST", message, {
    ...(cause === undefined ? {} : { cause }),
  });
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invalid(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalid(`${label} must be a non-empty string`);
  }
  return value;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalid(`${label} must be a finite number`);
  }
  return value;
}

function optionalNumber(value: unknown, label: string): number | undefined {
  return value === undefined ? undefined : finiteNumber(value, label);
}

function parseSpineNode(value: unknown, label: string): SelectorSpineNode {
  const node = record(value, label);
  if (!Array.isArray(node.children)) throw invalid(`${label}.children must be an array`);
  return Object.freeze({
    id: string(node.id, `${label}.id`),
    moveUci: string(node.moveUci, `${label}.moveUci`),
    children: Object.freeze(
      node.children.map((child, index) =>
        parseSpineNode(child, `${label}.children[${index}]`),
      ),
    ),
  });
}

export function parseSelectMoveRequest(value: unknown): SelectMoveRequest {
  const body = record(value, "body");
  for (const key of Object.keys(body)) {
    if (!["startFen", "historyUci", "policy", "seed", "packId"].includes(key)) {
      throw invalid(`body.${key} is an unknown field`);
    }
  }
  if (!Array.isArray(body.historyUci)) {
    throw invalid("historyUci must be an array");
  }
  if (typeof body.seed !== "number" || !Number.isSafeInteger(body.seed)) {
    throw invalid("seed must be a safe integer");
  }
  const policy = record(body.policy, "policy");
  for (const key of Object.keys(policy)) {
    if (!["mode", "policyConfigDigest", "targetElo", "temperature", "topP"].includes(key)) {
      throw invalid(`policy.${key} is an unknown field`);
    }
  }
  const digest = string(policy.policyConfigDigest, "policy.policyConfigDigest");
  if (!DIGEST_PATTERN.test(digest)) {
    throw invalid("policy.policyConfigDigest must be an RFC-8785 SHA-256 digest");
  }
  const targetElo = optionalNumber(policy.targetElo, "policy.targetElo");
  if (targetElo !== undefined && !Number.isSafeInteger(targetElo)) {
    throw invalid("policy.targetElo must be a safe integer");
  }
  const temperature = optionalNumber(policy.temperature, "policy.temperature");
  if (temperature !== undefined && temperature < 0) {
    throw invalid("policy.temperature cannot be negative");
  }
  const topP = optionalNumber(policy.topP, "policy.topP");
  if (topP !== undefined && (topP < 0 || topP > 1)) {
    throw invalid("policy.topP must be between 0 and 1");
  }
  return Object.freeze({
    startFen: string(body.startFen, "startFen"),
    historyUci: Object.freeze(
      body.historyUci.map((move, index) => string(move, `historyUci[${index}]`)),
    ),
    policy: Object.freeze({
      mode: string(policy.mode, "policy.mode"),
      policyConfigDigest: digest,
      ...(targetElo === undefined ? {} : { targetElo }),
      ...(temperature === undefined ? {} : { temperature }),
      ...(topP === undefined ? {} : { topP }),
    }),
    seed: body.seed,
    ...(body.packId === undefined ? {} : { packId: string(body.packId, "packId") }),
  });
}

function historyHash(request: SelectMoveRequest): string {
  const digest = createHash("sha256");
  digest.update(request.startFen);
  for (const move of request.historyUci) {
    digest.update("\0");
    digest.update(move);
  }
  return digest.digest("hex");
}

/** Position-pure order for moves whose selector basis declares them equal. */
export function neutralTiebreakKey(fen: string, moveUci: string): string {
  return createHash("sha256").update(fen).update("\0").update(moveUci).digest("hex");
}

function neutralTiebreak(fen: string, leftUci: string, rightUci: string): number {
  const leftKey = neutralTiebreakKey(fen, leftUci);
  const rightKey = neutralTiebreakKey(fen, rightUci);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : leftUci.localeCompare(rightUci);
}

export function selectionCacheKey(request: SelectMoveRequest): string {
  return [request.policy.policyConfigDigest, request.policy.targetElo ?? "", request.packId ?? "", request.seed, historyHash(request)].join(
    "\0",
  );
}

function positionFromFen(fen: string): Chess {
  try {
    return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  } catch (cause) {
    throw invalid("startFen is not a legal standard-chess position", cause as Error);
  }
}

function play(position: Chess, moveUci: string, label: string): Chess {
  const move = parseUci(moveUci);
  if (!move || !isNormal(move) || !position.isLegal(move)) {
    throw invalid(`${label} is not legal from its preceding position`);
  }
  const next = position.clone();
  next.play(move);
  return next;
}

function currentPosition(request: SelectMoveRequest): Chess {
  let position = positionFromFen(request.startFen);
  for (const [index, move] of request.historyUci.entries()) {
    position = play(position, move, `historyUci[${index}]`);
  }
  return position;
}

function legalMoveCount(position: Chess): number {
  let count = 0;
  for (const [from, destinations] of position.allDests()) {
    const promotions = position.board.getRole(from) === "pawn"
      ? [...destinations].filter((to) => to < 8 || to >= 56).length
      : 0;
    count += destinations.size() + promotions * 3;
  }
  return count;
}

function positionCommand(request: SelectMoveRequest): string {
  return `position fen ${request.startFen}${
    request.historyUci.length === 0 ? "" : ` moves ${request.historyUci.join(" ")}`
  }`;
}

function candidateLines(lines: readonly string[]): readonly SelectionCandidate[] {
  const candidates = new Map<string, SelectionCandidate>();
  for (const line of lines) {
    if (!line.startsWith("info ")) continue;
    const rankMatch = /\bmultipv (\d+)\b/.exec(line);
    const moveMatch = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (!rankMatch || !moveMatch) continue;
    const massMatch = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    const scoreIsBound = /\b(?:upperbound|lowerbound)\b/.test(line);
    const scoreMatch = scoreIsBound ? null : /\bscore cp (-?\d+)\b/.exec(line);
    const wdlMatch = scoreIsBound ? null : /\bwdl (\d+) (\d+) (\d+)\b/.exec(line);
    const mass = massMatch === null ? undefined : Number(massMatch[1]);
    if (mass !== undefined && (!Number.isFinite(mass) || mass < 0 || mass > 1)) {
      throw invalid(`Engine returned invalid policy mass: ${massMatch![1]}`);
    }
    const candidate: SelectionCandidate = Object.freeze({
      moveUci: moveMatch[1]!,
      rank: Number(rankMatch[1]),
      ...(mass === undefined ? {} : { mass }),
      ...(scoreMatch === null ? {} : { scoreCp: Number(scoreMatch[1]) }),
      ...(wdlMatch === null ? {} : { wdl: Object.freeze({ win: Number(wdlMatch[1]), draw: Number(wdlMatch[2]), loss: Number(wdlMatch[3]) }) }),
    });
    candidates.set(candidate.moveUci, candidate);
  }
  return Object.freeze(
    [...candidates.values()].sort((left, right) => left.rank - right.rank),
  );
}

function bestMove(lines: readonly string[]): string {
  const match = lines
    .map((line) => /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line))
    .find((candidate) => candidate !== null);
  if (!match) throw invalid("Engine returned no legal bestmove");
  return match[1]!;
}

function selectionIdentity(
  identity: EngineIdentity,
  eloApplied?: number,
  searchBound?: Readonly<{ kind: "nodes" | "movetime"; value: number }>,
): SelectionEngineIdentity {
  return Object.freeze({
    id: identity.id,
    name: identity.name,
    version: identity.version,
    ...(identity.modelId === undefined ? {} : { modelId: identity.modelId }),
    ...(identity.containerDigest === undefined
      ? {}
      : { containerDigest: identity.containerDigest }),
    seedHonored: identity.seedHonored,
    eloHonored: identity.eloHonored === true,
    ...(eloApplied === undefined ? {} : { eloApplied }),
    ...(searchBound === undefined ? {} : { searchBound }),
  });
}

function makeSelection(
  moveUci: string,
  candidates: readonly SelectionCandidate[],
  identity: EngineIdentity,
  policyModeApplied: RunOpponentMode,
  eloApplied?: number,
  searchBound?: Readonly<{ kind: "nodes" | "movetime"; value: number }>,
): OpponentSelection {
  return Object.freeze({
    moveUci,
    policyModeApplied,
    ...(candidates.length === 0 ? {} : { candidates }),
    engine: selectionIdentity(identity, eloApplied, searchBound),
  });
}

function engineIdentity(client: SelectorEngineClient, engineId: string): EngineIdentity {
  const identity = client.health(engineId).identity;
  if (identity === undefined) throw engineUnavailable(engineId, 0);
  return identity;
}

function unitInterval(seed: number, hash: string): number {
  const bytes = createHash("sha256").update(`${seed}\0${hash}`).digest();
  return bytes.readUInt32BE(0) / 0x1_0000_0000;
}

function sampleWeighted(
  candidates: readonly SelectionCandidate[],
  seed: number,
  hash: string,
): string | undefined {
  const total = candidates.reduce((sum, candidate) => sum + (candidate.mass ?? 0), 0);
  if (total <= 0) return undefined;
  let cursor = unitInterval(seed, hash) * total;
  for (const candidate of candidates) {
    cursor -= candidate.mass ?? 0;
    if (cursor < 0) return candidate.moveUci;
  }
  return candidates.at(-1)?.moveUci;
}

function sampleRankWeighted(
  candidates: readonly SelectionCandidate[],
  seed: number,
  hash: string,
): string {
  const ranked = candidates.map((candidate) => ({
    ...candidate,
    mass: 1 / candidate.rank,
  }));
  return sampleWeighted(ranked, seed, hash)!;
}

function sampleUniform(moves: readonly string[], seed: number, hash: string): string {
  if (moves.length === 0) throw invalid("Cannot sample an empty spine child set");
  return moves[Math.floor(unitInterval(seed, hash) * moves.length)]!;
}

function addSpinePosition(
  index: Map<string, Map<string, SelectorSpineNode>>,
  position: Chess,
  nodes: readonly SelectorSpineNode[],
): void {
  const key = transposeKey(makeFen(position.toSetup()));
  const moves = index.get(key) ?? new Map<string, SelectorSpineNode>();
  for (const node of nodes) moves.set(node.moveUci, node);
  index.set(key, moves);

  for (const node of nodes) {
    const next = play(position, node.moveUci, `spine node ${node.id}`);
    addSpinePosition(index, next, node.children);
  }
}

function spineChildren(
  request: SelectMoveRequest,
): readonly SelectorSpineNode[] | undefined {
  const spine = request.policy.spine;
  if (spine === undefined || spine.length === 0) return undefined;
  const index = new Map<string, Map<string, SelectorSpineNode>>();
  addSpinePosition(index, positionFromFen(request.startFen), spine);
  const key = transposeKey(makeFen(currentPosition(request).toSetup()));
  const children = index.get(key);
  return children === undefined ? undefined : Object.freeze([...children.values()]);
}

export class OpponentSelector {
  readonly #client: SelectorEngineClient;
  readonly #maiaEngineId: string;
  readonly #strongEngineId: string;
  readonly #strongEngineMovetimeMs: number;
  readonly #strongEngineNodes: number | null;
  readonly #strongEngineMultiPv: number;
  readonly #tablebase: TablebaseSource | undefined;
  readonly #cache = new Map<string, Promise<OpponentSelection>>();

  constructor(
    client: SelectorEngineClient | EngineSupervisor,
    options: OpponentSelectorOptions = {},
  ) {
    this.#client = client;
    this.#maiaEngineId = options.maiaEngineId ?? "maia-5m";
    this.#strongEngineId = options.strongEngineId ?? "stockfish-play";
    const profile = resolveStrongEngineProfile({
      ...options.strongEngineProfile,
      ...(options.strongEngineMovetimeMs === undefined
        ? {}
        : { movetimeMs: options.strongEngineMovetimeMs }),
    });
    this.#strongEngineMovetimeMs = profile.movetimeMs;
    this.#strongEngineNodes = profile.nodes;
    this.#strongEngineMultiPv = profile.multiPv;
    this.#tablebase = options.tablebaseSource;
  }

  select(request: SelectMoveRequest): Promise<OpponentSelection> {
    this.validatePolicy(request.policy);
    const key = selectionCacheKey(request);
    const cached = this.#cache.get(key);
    if (cached !== undefined) return cached;
    const selected = this.#selectUncached(request).catch((error) => {
      this.#cache.delete(key);
      throw error;
    });
    this.#cache.set(key, selected);
    return selected;
  }

  cacheSize(): number {
    return this.#cache.size;
  }

  validatePolicy(policy: Pick<SelectorPolicy, "mode" | "targetElo">): void {
    if (
      policy.mode === "human_common"
      || policy.mode === "theory_strict"
      || policy.mode === "practical_resistance"
    ) {
      appliedTargetElo(this.#client.health(this.#maiaEngineId), policy.targetElo);
    }
  }

  availableModes(): readonly RunOpponentMode[] {
    const maia = this.#client.health(this.#maiaEngineId).identity !== undefined;
    const strong = this.#client.health(this.#strongEngineId).identity !== undefined;
    return Object.freeze([
      ...(maia ? (["human_common", "theory_strict"] as const) : []),
      ...(strong ? (["strong_engine"] as const) : []),
      ...(this.#tablebase === undefined ? [] : (["perfect_tablebase"] as const)),
      ...(maia && this.#tablebase !== undefined ? (["practical_resistance"] as const) : []),
    ]);
  }

  identityFor(mode: RunOpponentMode, targetElo?: number): SelectionEngineIdentity {
    if (mode === "perfect_tablebase") return Object.freeze({id:"lichess-tablebase",name:"Syzygy (tablebase.lichess.org/standard)",version:"7man",seedHonored:true,eloHonored:false});
    const engineId = mode === "strong_engine" ? this.#strongEngineId : this.#maiaEngineId;
    const identity = engineIdentity(this.#client, engineId);
    const eloApplied = mode === "strong_engine" ? undefined : appliedTargetElo(this.#client.health(engineId), targetElo);
    return selectionIdentity(identity, eloApplied);
  }

  async enumerate(request: SelectMoveRequest, count: number): Promise<OpponentSelection> {
    if (request.policy.mode !== "strong_engine") {
      throw policyModeUnsupported(request.policy.mode);
    }
    if (!Number.isSafeInteger(count) || count < 2 || count > 8) {
      throw invalid("enumerate count must be an integer from 2 to 8");
    }
    const lines = await this.#client.execute(this.#strongEngineId, {
      commands: [
        `setoption name MultiPV value ${count}`,
        positionCommand(request),
        `go movetime ${this.#strongEngineMovetimeMs}`,
      ],
      resetSearchState: true,
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: Math.max(5_000, this.#strongEngineMovetimeMs * 10),
    });
    return makeSelection(
      bestMove(lines),
      candidateLines(lines),
      engineIdentity(this.#client, this.#strongEngineId),
      "strong_engine",
    );
  }

  async #selectUncached(request: SelectMoveRequest): Promise<OpponentSelection> {
    switch (request.policy.mode) {
      case "human_common":
        return this.#humanCommon(request);
      case "strong_engine":
        return this.#strongEngine(request);
      case "theory_strict":
        return this.#theoryStrict(request);
      case "perfect_tablebase":
        return this.#perfectTablebase(request);
      case "practical_resistance":
        return this.#practicalResistance(request);
      default:
        throw policyModeUnsupported(request.policy.mode);
    }
  }

  async #maia(
    request: SelectMoveRequest,
    multiPv: number,
  ): Promise<{ readonly lines: readonly string[]; readonly identity: EngineIdentity; readonly eloApplied?: number }> {
    const health = this.#client.health(this.#maiaEngineId);
    const identity = engineIdentity(this.#client, this.#maiaEngineId);
    const eloApplied = appliedTargetElo(health, request.policy.targetElo);
    const spin = (name: string) => health.options?.find((item) => item.name === name && item.type === "spin");
    const optionDefault = (name: string) => health.options?.find((item) => item.name === name)?.default;
    const maximum = spin("MultiPV")?.max;
    const appliedMultiPv = maximum === undefined ? multiPv : Math.min(multiPv, maximum);
    const bandDefaults = ["SelfElo", "OppoElo"].flatMap((name) => {
      const value = optionDefault(name);
      return value === undefined ? [] : [`setoption name ${name} value ${value}`];
    });
    const commands = [
      ...bandDefaults,
      ...(eloApplied === undefined
        ? []
        : [`setoption name Elo value ${eloApplied}`]),
      `setoption name Temperature value ${
        request.policy.temperature ?? DEFAULT_TEMPERATURE
      }`,
      `setoption name TopP value ${request.policy.topP ?? DEFAULT_TOP_P}`,
      `setoption name MultiPV value ${appliedMultiPv}`,
      positionCommand(request),
      "go",
    ];
    const lines = await this.#client.execute(this.#maiaEngineId, {
      commands,
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 60_000,
    });
    return Object.freeze({
      lines,
      identity,
      ...(eloApplied === undefined ? {} : { eloApplied }),
    });
  }

  async #humanCommon(request: SelectMoveRequest): Promise<OpponentSelection> {
    const health = this.#client.health(this.#maiaEngineId);
    const maximum = health.options?.find((item) => item.name === "MultiPV" && item.type === "spin")?.max;
    const requestedWidth = Math.max(8, legalMoveCount(currentPosition(request)));
    const width = maximum === undefined ? requestedWidth : Math.min(requestedWidth, maximum);
    let result = await this.#maia(request, width);
    let candidates = candidateLines(result.lines);
    let moveUci = bestMove(result.lines);
    if (!candidates.some((candidate) => candidate.moveUci === moveUci)) {
      result = await this.#maia(request, width);
      candidates = candidateLines(result.lines);
      moveUci = bestMove(result.lines);
    }
    if (!candidates.some((candidate) => candidate.moveUci === moveUci)) {
      const maxRank = candidates.reduce((rank, candidate) => Math.max(rank, candidate.rank), 0);
      candidates = Object.freeze([
        ...candidates,
        Object.freeze({ moveUci, rank: maxRank + 1, offWindow: true as const }),
      ]);
    }
    return makeSelection(
      moveUci,
      candidates,
      result.identity,
      "human_common",
      result.eloApplied,
    );
  }

  /** @instrument-fed Stockfish 51-position reproducibility corpus */
  async #strongEngine(request: SelectMoveRequest): Promise<OpponentSelection> {
    const searchBound = this.#strongEngineNodes === null
      ? Object.freeze({ kind: "movetime" as const, value: this.#strongEngineMovetimeMs })
      : Object.freeze({ kind: "nodes" as const, value: this.#strongEngineNodes });
    const lines = await this.#client.execute(this.#strongEngineId, {
      commands: [
        `setoption name MultiPV value ${this.#strongEngineMultiPv}`,
        positionCommand(request),
        `go ${searchBound.kind} ${searchBound.value}`,
      ],
      resetSearchState: true,
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: searchBound.kind === "nodes" ? 5_000 : Math.max(5_000, searchBound.value * 10),
    });
    return makeSelection(
      bestMove(lines),
      candidateLines(lines),
      engineIdentity(this.#client, this.#strongEngineId),
      "strong_engine",
      undefined,
      searchBound,
    );
  }

  async #theoryStrict(request: SelectMoveRequest): Promise<OpponentSelection> {
    const children = spineChildren(request);
    if (children === undefined || children.length === 0) {
      console.warn(
        "DEGRADED_THEORY_SPINE: position is off the authored spine; falling back to human_common",
      );
      return this.#humanCommon(request);
    }
    const result = await this.#maia(request, Math.max(8, children.length));
    const allowed = new Set(children.map((child) => child.moveUci));
    const matching = candidateLines(result.lines).filter((candidate) =>
      allowed.has(candidate.moveUci),
    );
    const hash = historyHash(request);
    const missingMass = matching.some((candidate) => candidate.mass === undefined);
    if (missingMass) {
      console.warn(
        "DEGRADED_POLICY_MASS: Maia candidate omitted policy mass; using inverse-rank sampling",
      );
    }
    const moveUci = missingMass
      ? sampleRankWeighted(matching, request.seed, hash)
      : (sampleWeighted(matching, request.seed, hash) ??
        sampleUniform([...allowed], request.seed, hash));
    const candidates =
      matching.length === 0
        ? Object.freeze(
            [...allowed].map((move, index) =>
              Object.freeze({ moveUci: move, rank: index + 1 }),
            ),
          )
        : matching;
    return makeSelection(moveUci, candidates, result.identity, "theory_strict", result.eloApplied);
  }

  async #perfectTablebase(request: SelectMoveRequest): Promise<OpponentSelection> {
    if (this.#tablebase === undefined) {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Perfect tablebase resistance is unavailable", { details: { retryAfterMs: 0 } });
    }
    const board = currentPosition(request);
    const fen = makeFen(board.toSetup());
    const position = await this.#tablebase.probe(fen);
    if (position.category === "unknown") {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase category is unknown", { details: { retryAfterMs: 60_000 } });
    }
    const preserving = position.moves.filter((move) => {
      const parsed = parseUci(move.uci);
      return parsed !== undefined
        && board.isLegal(parsed)
        && invertTablebaseCategory(move.category) === position.category;
    });
    if (preserving.length === 0) {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase returned no category-preserving move", { details: { retryAfterMs: 60_000 } });
    }
    const winning = position.category.includes("win");
    const losing = position.category.includes("loss");
    const metric = (move: TablebaseMove) => Math.abs(move.preciseDtz ?? move.dtz ?? 0);
    const ordered = [...preserving].sort((left, right) =>
      winning
        ? metric(left) - metric(right) || neutralTiebreak(fen, left.uci, right.uci)
        : losing
          ? metric(right) - metric(left) || neutralTiebreak(fen, left.uci, right.uci)
          : neutralTiebreak(fen, left.uci, right.uci));
    const candidates = Object.freeze(ordered.map((move, index) =>
      Object.freeze({ moveUci: move.uci, rank: index + 1 })));
    return Object.freeze({
      moveUci: ordered[0]!.uci,
      policyModeApplied: "perfect_tablebase",
      orderingBasis: winning ? "dtz_ascending" : losing ? "dtz_descending" : "none",
      candidates,
      engine: this.identityFor("perfect_tablebase"),
    });
  }

  async #practicalResistance(request: SelectMoveRequest): Promise<OpponentSelection> {
    if (this.#tablebase === undefined) {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Practical resistance requires a tablebase provider", { details: { retryAfterMs: 0 } });
    }
    const board = currentPosition(request);
    const fen = makeFen(board.toSetup());
    const root = await this.#tablebase.probe(fen);
    if (root.category === "unknown") {
      throw new ServerError("PRACTICAL_RESISTANCE_UNAVAILABLE", "The root outcome class is unknown");
    }
    const preserving = root.moves
      .filter((candidate) => {
        const move = parseUci(candidate.uci);
        return move !== undefined && board.isLegal(move) && invertTablebaseCategory(candidate.category) === root.category;
      })
      .sort((left, right) => left.uci.localeCompare(right.uci))
      .slice(0, 4);
    if (preserving.length === 0) {
      throw new ServerError("PRACTICAL_RESISTANCE_UNAVAILABLE", "No category-preserving reply is available");
    }

    const scored: {
      readonly move: TablebaseMove;
      readonly ratio: number | null;
      readonly identity: EngineIdentity;
      readonly eloApplied?: number;
    }[] = [];
    for (const candidate of preserving) {
      const child = play(board, candidate.uci, `tablebase reply ${candidate.uci}`);
      const childFen = makeFen(child.toSetup());
      const childTablebase = await this.#tablebase.probe(childFen);
      if (childTablebase.category === "unknown") {
        throw new ServerError("PRACTICAL_RESISTANCE_UNAVAILABLE", `Outcome class after ${candidate.uci} is unknown`);
      }
      const childRequest: SelectMoveRequest = Object.freeze({
        ...request,
        historyUci: Object.freeze([...request.historyUci, candidate.uci]),
      });
      const maia = await this.#maia(childRequest, Math.max(8, legalMoveCount(child)));
      const policy = candidateLines(maia.lines);
      const conceding = new Set(
        childTablebase.moves
          .filter((reply) => invertTablebaseCategory(reply.category) !== childTablebase.category)
          .map((reply) => reply.uci),
      );
      const mass = (() => {
        try {
          return humanConcessionMass(policy, conceding);
        } catch (error) {
          if (error instanceof PolicyMassError) {
            throw new ServerError(
              "PRACTICAL_RESISTANCE_POLICY_MASS_INVALID",
              "Maia returned an invalid policy-mass distribution",
              { cause: error },
            );
          }
          throw error;
        }
      })();
      const ratio = mass === null || mass.measuredMass <= 0
        ? mass === null ? null : 0
        : mass.concedingMass / mass.measuredMass;
      scored.push(Object.freeze({
        move: candidate,
        ratio,
        identity: maia.identity,
        ...(maia.eloApplied === undefined ? {} : { eloApplied: maia.eloApplied }),
      }));
    }

    const measured = scored.filter((candidate) => candidate.ratio !== null);
    if (measured.length === 0) {
      throw new ServerError("PRACTICAL_RESISTANCE_UNMEASURED", "No candidate returned a measured policy mass; practical resistance cannot select");
    }
    if (measured.every((candidate) => candidate.ratio === 0)) {
      throw new ServerError("PRACTICAL_RESISTANCE_UNDECIDABLE", "No category-preserving reply leaves measured concession mass");
    }
    const ordered = [...measured].sort((left, right) =>
      right.ratio! - left.ratio! || left.move.uci.localeCompare(right.move.uci),
    );
    const selected = ordered[0]!;
    const candidates = Object.freeze(scored.map((candidate, index): SelectionCandidate => Object.freeze({
      moveUci: candidate.move.uci,
      rank: index + 1,
      ...(candidate.ratio === null ? {} : { concessionRatio: candidate.ratio }),
    })));
    return makeSelection(
      selected.move.uci,
      candidates,
      selected.identity,
      "practical_resistance",
      selected.eloApplied,
    );
  }
}
