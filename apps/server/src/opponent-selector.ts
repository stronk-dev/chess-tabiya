import { createHash } from "node:crypto";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import {
  transposeKey,
  type OpponentSelection,
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
import {
  resolveStrongEngineProfile,
  type StrongEngineProfile,
} from "./strong-engine.js";

export type OpponentPolicyMode =
  | "human_common"
  | "strong_engine"
  | "theory_strict";

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
  if (!Array.isArray(body.historyUci)) {
    throw invalid("historyUci must be an array");
  }
  if (typeof body.seed !== "number" || !Number.isSafeInteger(body.seed)) {
    throw invalid("seed must be a safe integer");
  }
  const policy = record(body.policy, "policy");
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
  if (policy.spine !== undefined && !Array.isArray(policy.spine)) {
    throw invalid("policy.spine must be an array");
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
      ...(policy.spine === undefined
        ? {}
        : {
            spine: Object.freeze(
              policy.spine.map((node, index) =>
                parseSpineNode(node, `policy.spine[${index}]`),
              ),
            ),
          }),
    }),
    seed: body.seed,
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

export function selectionCacheKey(request: SelectMoveRequest): string {
  return [request.policy.policyConfigDigest, request.seed, historyHash(request)].join(
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
    const mass = massMatch === null ? undefined : Number(massMatch[1]);
    if (mass !== undefined && (!Number.isFinite(mass) || mass < 0 || mass > 1)) {
      throw invalid(`Engine returned invalid policy mass: ${massMatch![1]}`);
    }
    const candidate: SelectionCandidate = Object.freeze({
      moveUci: moveMatch[1]!,
      rank: Number(rankMatch[1]),
      ...(mass === undefined ? {} : { mass }),
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

function selectionIdentity(identity: EngineIdentity): SelectionEngineIdentity {
  return Object.freeze({
    id: identity.id,
    name: identity.name,
    version: identity.version,
    ...(identity.modelId === undefined ? {} : { modelId: identity.modelId }),
    ...(identity.containerDigest === undefined
      ? {}
      : { containerDigest: identity.containerDigest }),
    seedHonored: identity.seedHonored,
  });
}

function makeSelection(
  moveUci: string,
  candidates: readonly SelectionCandidate[],
  identity: EngineIdentity,
): OpponentSelection {
  return Object.freeze({
    moveUci,
    ...(candidates.length === 0 ? {} : { candidates }),
    engine: selectionIdentity(identity),
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
  }

  select(request: SelectMoveRequest): Promise<OpponentSelection> {
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

  async #selectUncached(request: SelectMoveRequest): Promise<OpponentSelection> {
    switch (request.policy.mode) {
      case "human_common":
        return this.#humanCommon(request);
      case "strong_engine":
        return this.#strongEngine(request);
      case "theory_strict":
        return this.#theoryStrict(request);
      default:
        throw policyModeUnsupported(request.policy.mode);
    }
  }

  async #maia(
    request: SelectMoveRequest,
    multiPv?: number,
  ): Promise<{ readonly lines: readonly string[]; readonly identity: EngineIdentity }> {
    const commands = [
      ...(request.policy.targetElo === undefined
        ? []
        : [`setoption name Elo value ${request.policy.targetElo}`]),
      `setoption name Temperature value ${
        request.policy.temperature ?? DEFAULT_TEMPERATURE
      }`,
      `setoption name TopP value ${request.policy.topP ?? DEFAULT_TOP_P}`,
      ...(multiPv === undefined ? [] : [`setoption name MultiPV value ${multiPv}`]),
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
      identity: engineIdentity(this.#client, this.#maiaEngineId),
    });
  }

  async #humanCommon(request: SelectMoveRequest): Promise<OpponentSelection> {
    const result = await this.#maia(request);
    return makeSelection(
      bestMove(result.lines),
      candidateLines(result.lines),
      result.identity,
    );
  }

  async #strongEngine(request: SelectMoveRequest): Promise<OpponentSelection> {
    const lines = await this.#client.execute(this.#strongEngineId, {
      commands: [
        positionCommand(request),
        `go movetime ${this.#strongEngineMovetimeMs}`,
      ],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: Math.max(5_000, this.#strongEngineMovetimeMs * 10),
    });
    return makeSelection(
      bestMove(lines),
      candidateLines(lines),
      engineIdentity(this.#client, this.#strongEngineId),
    );
  }

  async #theoryStrict(request: SelectMoveRequest): Promise<OpponentSelection> {
    const children = spineChildren(request);
    if (children === undefined || children.length === 0) {
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
    return makeSelection(moveUci, candidates, result.identity);
  }
}
