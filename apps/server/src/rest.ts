import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import {
  BranchQueryError,
  RuntimeError,
  feedbackDeliveryOpen,
  historyFrom,
  permittedAssistance,
  comparisonNarrative,
  comparisonStrips,
  suggestTitle,
  RUN_OPPONENT_MODES,
  type OpponentSelection,
  type SelectionCandidate,
  type SelectionEngineIdentity,
  type CommitMoveOptions,
  type PolicyConfig,
  type VersionedPolicy,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import type { CapabilitiesProvider } from "./capabilities.js";
import type { TtsProvider } from "./external-tts.js";
import { projectPackDocument } from "./pack-registry.js";
import {
  OpponentSelector,
  parseSelectMoveRequest,
} from "./opponent-selector.js";
import {
  RunService,
  type CreateRunRequest,
  type ImportGameRequest,
  type RewindTarget,
} from "./service.js";
import { IdentityService } from "./identity.js";
import type { Principal } from "./authorization.js";
import type { RunRole } from "./storage.js";
import type { PackStudio } from "./pack-studio.js";
import type { LiveSessionService } from "./live-session.js";
import { projectShapeEntry, type ShapeRegistry } from "./shape-registry.js";
import type { ShapeStudio } from "./shape-studio.js";
import type { BoardControl, SessionKind, VoteOption } from "./live-types.js";
import { evidencePacket, renderVoice, type VoiceProvider, type VoiceScope } from "./guidance.js";
import { corpusPopulation, type CorpusSource } from "./corpus.js";
import type { RepertoireService } from "./repertoire.js";
import { publicMutationPayload } from "./feedback-policy.js";
import { reasoningMatchCheck, type ReasoningProposal } from "./reasoning.js";
import { distillRun } from "./distill.js";

export type RestHandler = (request: Request) => Promise<Response>;

function json(status: number, value: unknown): Response {
  return Response.json(publicMutationPayload(value), {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function jsonWithCookie(status: number, value: unknown, cookie: string): Response {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store", "set-cookie": cookie },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sessionJoinPage(token: string, join: { readonly title: string; readonly hostHandle: string }): Response {
  const tokenLiteral = JSON.stringify(token);
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(join.title)}</title></head><body><main><h1>${escapeHtml(join.title)}</h1><p>Hosted by @${escapeHtml(join.hostHandle)}</p><p>Sign in or create a learner account to take this seat. No position or evidence is disclosed by this page.</p><form id="join-form"><label>Handle <input name="handle" autocomplete="username" required></label><label>Password <input name="password" type="password" minlength="10" maxlength="256" required></label><button name="action" value="login" type="submit">Sign in and join</button><button name="action" value="register" type="submit">Register and join</button></form><p id="join-error" role="alert"></p></main><script>document.getElementById("join-form").addEventListener("submit",async(event)=>{event.preventDefault();const form=new FormData(event.currentTarget);const action=event.submitter.value;const credentials=await fetch("/auth/"+action,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:form.get("handle"),password:form.get("password")})});if(!credentials.ok){document.getElementById("join-error").textContent="Those account details were not accepted.";return;}const joined=await fetch("/api/shared/"+encodeURIComponent(${tokenLiteral})+"/join",{method:"POST"});if(!joined.ok){document.getElementById("join-error").textContent="This invitation is no longer available.";return;}const result=await joined.json();location.assign("/live/session/"+encodeURIComponent(result.session.id));});</script></body></html>`, {
    status: 200,
    headers: { "cache-control": "no-store", "content-type": "text/html; charset=utf-8" },
  });
}

function invalid(message: string): ServerError {
  return new ServerError("INVALID_REQUEST", message);
}

function record(value: unknown, label = "body"): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invalid(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function closedRecord(
  value: unknown,
  pointer: string,
  allowed: readonly string[],
): Record<string, unknown> {
  const result = record(value, pointer === "/" ? "body" : pointer);
  const unknown = Object.keys(result).filter((key) => !allowed.includes(key)).sort()[0];
  if (unknown !== undefined) {
    throw invalid(`Unknown field ${pointer === "/" ? "" : pointer}/${unknown}`);
  }
  return result;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalid(`${label} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : requiredString(value, label);
}

function requiredBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw invalid(`${label} must be a boolean`);
  return value;
}

function requiredSafeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw invalid(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function parseSelectionCandidate(value: unknown, label: string): SelectionCandidate {
  const candidate = record(value, label);
  if (
    typeof candidate.rank !== "number" ||
    !Number.isSafeInteger(candidate.rank) ||
    candidate.rank < 1
  ) {
    throw invalid(`${label}.rank must be a positive safe integer`);
  }
  if (
    candidate.mass !== undefined &&
    (typeof candidate.mass !== "number" ||
      !Number.isFinite(candidate.mass) ||
      candidate.mass < 0 ||
      candidate.mass > 1)
  ) {
    throw invalid(`${label}.mass must be between 0 and 1`);
  }
  if (
    candidate.concessionRatio !== undefined &&
    (typeof candidate.concessionRatio !== "number" ||
      !Number.isFinite(candidate.concessionRatio) ||
      candidate.concessionRatio < 0 ||
      candidate.concessionRatio > 1)
  ) {
    throw invalid(`${label}.concessionRatio must be between 0 and 1`);
  }
  return {
    moveUci: requiredString(candidate.moveUci, `${label}.moveUci`),
    rank: candidate.rank,
    ...(candidate.mass === undefined ? {} : { mass: candidate.mass as number }),
    ...(candidate.concessionRatio === undefined ? {} : { concessionRatio: candidate.concessionRatio as number }),
    ...(candidate.offWindow === undefined ? {} : { offWindow: requiredBoolean(candidate.offWindow, `${label}.offWindow`) }),
  };
}

function parseSelectionEngine(value: unknown): SelectionEngineIdentity {
  const engine = record(value, "selection.engine");
  return {
    id: requiredString(engine.id, "selection.engine.id"),
    name: requiredString(engine.name, "selection.engine.name"),
    version: requiredString(engine.version, "selection.engine.version"),
    ...(engine.modelId === undefined
      ? {}
      : { modelId: requiredString(engine.modelId, "selection.engine.modelId") }),
    ...(engine.containerDigest === undefined
      ? {}
      : {
          containerDigest: requiredString(
            engine.containerDigest,
            "selection.engine.containerDigest",
          ),
        }),
    seedHonored: requiredBoolean(
      engine.seedHonored,
      "selection.engine.seedHonored",
    ),
    ...(engine.eloHonored === undefined
      ? {}
      : { eloHonored: requiredBoolean(engine.eloHonored, "selection.engine.eloHonored") }),
    ...(engine.eloApplied === undefined
      ? {}
      : { eloApplied: requiredSafeInteger(engine.eloApplied, "selection.engine.eloApplied") }),
  };
}

function parseOpponentSelection(value: unknown): OpponentSelection {
  const selection = record(value, "selection");
  if (selection.candidates !== undefined && !Array.isArray(selection.candidates)) {
    throw invalid("selection.candidates must be an array");
  }
  if (Array.isArray(selection.candidates) && selection.candidates.length === 0) {
    throw invalid("selection.candidates cannot be empty");
  }
  return {
    moveUci: requiredString(selection.moveUci, "selection.moveUci"),
    policyModeApplied: (() => {
      const mode = requiredString(
        selection.policyModeApplied,
        "selection.policyModeApplied",
      );
      if (!([...RUN_OPPONENT_MODES, "enumerated", "unknown"] as readonly string[]).includes(mode)) {
        throw invalid("selection.policyModeApplied is unsupported");
      }
      return mode as OpponentSelection["policyModeApplied"];
    })(),
    ...(selection.candidates === undefined
      ? {}
      : {
          candidates: selection.candidates.map((candidate, index) =>
            parseSelectionCandidate(candidate, `selection.candidates[${index}]`),
          ),
        }),
    engine: parseSelectionEngine(selection.engine),
  };
}

function policies(value: unknown, label: string): readonly VersionedPolicy[] {
  if (!Array.isArray(value)) throw invalid(`${label} must be an array`);
  return value.map((entry, index) => {
    const pointer = `/${label.replaceAll(".", "/")}/${index}`;
    const item = closedRecord(entry, pointer, ["id", "version"]);
    return {
      id: requiredString(item.id, `${label}[${index}].id`),
      version: requiredString(item.version, `${label}[${index}].version`),
    };
  });
}

function parsePolicyConfig(value: unknown): PolicyConfig {
  const policy = closedRecord(value, "/policyConfig", ["seedMode", "locus"]);
  if (
    policy.seedMode !== "fixed" &&
    policy.seedMode !== "per_run" &&
    policy.seedMode !== "per_branch"
  ) {
    throw invalid("policyConfig.seedMode is invalid");
  }
  const locus = closedRecord(policy.locus, "/policyConfig/locus", ["executedAt", "engineIds", "modelIds"]);
  if (locus.executedAt !== "browser" && locus.executedAt !== "server") {
    throw invalid("policyConfig.locus.executedAt is invalid");
  }
  return {
    seedMode: policy.seedMode,
    locus: {
      executedAt: locus.executedAt,
      engineIds: policies(locus.engineIds, "policyConfig.locus.engineIds"),
      modelIds: policies(locus.modelIds, "policyConfig.locus.modelIds"),
    },
  };
}

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return record(await request.json());
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw invalid("Request body must be valid JSON");
  }
}

function writerId(request: Request): string {
  return requiredString(request.headers.get("x-writer-id"), "x-writer-id header");
}

function requireJson(request: Request): void {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw invalid("content-type must be application/json");
  }
}

function runRole(value: unknown): RunRole {
  if (value !== "host" && value !== "participant" && value !== "spectator") {
    throw invalid("role must be host, participant, or spectator");
  }
  return value;
}

function parseCreateInput(value: Record<string, unknown>): CreateRunRequest {
  value = closedRecord(value, "/", ["id", "session", "policyConfig", "seed", "createdAt", "intent"]);
  if (typeof value.seed !== "number" || !Number.isSafeInteger(value.seed)) {
    throw invalid("seed must be a safe integer");
  }
  const sessionValue = closedRecord(value.session, "/session", ["kind", "packId", "packDigest", "start", "feedbackPolicy", "opponentPolicy"]);
  const kind = requiredString(sessionValue.kind, "/session/kind");
  const session = kind === "pack"
    ? (() => {
        closedRecord(value.session, "/session", ["kind", "packId", "packDigest"]);
        return {
          kind: "pack" as const,
          packId: requiredString(sessionValue.packId, "/session/packId"),
          ...(sessionValue.packDigest === undefined ? {} : { packDigest: requiredString(sessionValue.packDigest, "/session/packDigest") }),
        };
      })()
    : kind === "position"
      ? (() => {
          closedRecord(value.session, "/session", ["kind", "start", "feedbackPolicy", "opponentPolicy"]);
          const start = closedRecord(sessionValue.start, "/session/start", ["fen", "side"]);
          const side = requiredString(start.side, "/session/start/side");
          if (side !== "white" && side !== "black") throw invalid("/session/start/side must be white or black");
          if (sessionValue.feedbackPolicy !== "attempt_end") throw invalid("/session/feedbackPolicy must be attempt_end");
          const opponent = closedRecord(sessionValue.opponentPolicy, "/session/opponentPolicy", ["mode", "targetElo", "temperature", "topP"]);
          const mode = requiredString(opponent.mode, "/session/opponentPolicy/mode");
          if (mode !== "human_common" && mode !== "strong_engine") {
            throw invalid("/session/opponentPolicy/mode cannot use theory_strict without a spine");
          }
          const optionalNumber = (key: "targetElo" | "temperature" | "topP") => {
            const candidate = opponent[key];
            if (candidate === undefined) return undefined;
            if (typeof candidate !== "number" || !Number.isFinite(candidate)) throw invalid(`/session/opponentPolicy/${key} must be a finite number`);
            return candidate;
          };
          const targetElo = optionalNumber("targetElo");
          const temperature = optionalNumber("temperature");
          const topP = optionalNumber("topP");
          if (temperature !== undefined && temperature < 0) throw invalid("/session/opponentPolicy/temperature must be non-negative");
          if (topP !== undefined && (topP < 0 || topP > 1)) throw invalid("/session/opponentPolicy/topP must be between 0 and 1");
          if (targetElo !== undefined && !Number.isSafeInteger(targetElo)) throw invalid("/session/opponentPolicy/targetElo must be a safe integer");
          return {
            kind: "position" as const,
            start: { fen: requiredString(start.fen, "/session/start/fen"), side: side as "white" | "black" },
            feedbackPolicy: "attempt_end" as const,
            opponentPolicy: { mode: mode as "human_common" | "strong_engine", ...(targetElo === undefined ? {} : { targetElo }), ...(temperature === undefined ? {} : { temperature }), ...(topP === undefined ? {} : { topP }) },
          };
        })()
      : (() => { throw invalid("/session/kind must be pack or position"); })();
  const intent = value.intent === undefined
    ? undefined
    : (() => {
        const item = closedRecord(value.intent, "/intent", ["origin", "scheduleId", "derivedFromRunId"]);
        if (item.origin !== "fresh" && item.origin !== "duplicate") {
          throw invalid("/intent/origin must be fresh or duplicate");
        }
        return {
          origin: item.origin,
          ...(item.scheduleId === undefined ? {} : { scheduleId: requiredString(item.scheduleId, "/intent/scheduleId") }),
          ...(item.derivedFromRunId === undefined ? {} : { derivedFromRunId: requiredString(item.derivedFromRunId, "/intent/derivedFromRunId") }),
        } as const;
      })();
  return {
    id: requiredString(value.id, "id"),
    session,
    policyConfig: parsePolicyConfig(value.policyConfig),
    seed: value.seed,
    ...(value.createdAt === undefined
      ? {}
      : { createdAt: requiredString(value.createdAt, "createdAt") }),
    ...(intent === undefined ? {} : { intent }),
  };
}

function parseImportInput(value: Record<string, unknown>): ImportGameRequest {
  value = closedRecord(value, "/", ["id", "side", "opponentPolicy", "policyConfig", "seed", "source", "createdAt"]);
  const side = requiredString(value.side, "side");
  if (side !== "white" && side !== "black") throw invalid("side must be white or black");
  const opponent = closedRecord(value.opponentPolicy, "/opponentPolicy", ["mode", "targetElo", "temperature", "topP"]);
  const mode = requiredString(opponent.mode, "opponentPolicy.mode");
  if (mode !== "human_common" && mode !== "strong_engine") throw invalid("opponentPolicy.mode must be human_common or strong_engine");
  const number = (key: "targetElo" | "temperature" | "topP") => {
    const item = opponent[key];
    if (item === undefined) return undefined;
    if (typeof item !== "number" || !Number.isFinite(item)) throw invalid(`opponentPolicy.${key} must be finite`);
    return item;
  };
  const targetElo = number("targetElo");
  const temperature = number("temperature");
  const topP = number("topP");
  if (targetElo !== undefined && !Number.isSafeInteger(targetElo)) throw invalid("opponentPolicy.targetElo must be a safe integer");
  if (temperature !== undefined && temperature < 0) throw invalid("opponentPolicy.temperature must be non-negative");
  if (topP !== undefined && (topP < 0 || topP > 1)) throw invalid("opponentPolicy.topP must be between 0 and 1");
  const source = closedRecord(value.source, "/source", ["kind", "pgn", "url"]);
  const sourceKind = requiredString(source.kind, "source.kind");
  const parsedSource = sourceKind === "pgn"
    ? (closedRecord(value.source, "/source", ["kind", "pgn"]), { kind: "pgn" as const, pgn: requiredString(source.pgn, "source.pgn") })
    : sourceKind === "lichess"
      ? (closedRecord(value.source, "/source", ["kind", "url"]), { kind: "lichess" as const, url: requiredString(source.url, "source.url") })
      : (() => { throw invalid("source.kind must be pgn or lichess"); })();
  return {
    id: requiredString(value.id, "id"),
    side,
    opponentPolicy: {
      mode,
      ...(targetElo === undefined ? {} : { targetElo }),
      ...(temperature === undefined ? {} : { temperature }),
      ...(topP === undefined ? {} : { topP }),
    },
    policyConfig: parsePolicyConfig(value.policyConfig),
    seed: requiredSafeInteger(value.seed, "seed"),
    source: parsedSource,
    ...(value.createdAt === undefined ? {} : { createdAt: requiredString(value.createdAt, "createdAt") }),
  };
}

function parseMoveOptions(value: Record<string, unknown>): CommitMoveOptions {
  const actor = value.actor;
  if (
    actor !== undefined &&
    actor !== "user" &&
    actor !== "opponent" &&
    actor !== "system"
  ) {
    throw invalid("actor is invalid");
  }
  const clockState = value.clockState;
  const parsedClockState =
    clockState === undefined ? undefined : record(clockState, "clockState");
  return {
    ...(actor === undefined ? {} : { actor }),
    ...(value.at === undefined ? {} : { at: requiredString(value.at, "at") }),
    ...(parsedClockState === undefined ? {} : { clockState: parsedClockState }),
  };
}

export function errorResponse(error: unknown): Response {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";
  let reason: string | undefined;
  let details: Readonly<Record<string, unknown>> | undefined;

  if (
    !(error instanceof RuntimeError) &&
    !(error instanceof BranchQueryError) &&
    !(error instanceof ServerError)
  ) {
    console.error("UNHANDLED_SERVER_ERROR", error);
  }

  if (error instanceof RuntimeError) {
    code = error.code;
    message = error.message;
    reason = error.reason;
    status =
      error.code === "ILLEGAL_MOVE"
        ? 422
        : error.code === "UNKNOWN_NODE" || error.code === "UNKNOWN_CHECKPOINT"
          ? 404
          : 409;
  } else if (error instanceof BranchQueryError) {
    code = error.code;
    message = error.message;
    status = error.code === "UNKNOWN_BRANCH" ? 404 : 422;
  } else if (error instanceof ServerError) {
    code = error.code;
    message =
      error.code === "STORAGE_FAILURE" ? "Storage operation failed" : error.message;
    details = error.details;
    status =
      error.code === "UNAUTHENTICATED"
        ? 401
        : error.code === "FORBIDDEN"
          ? 403
      : error.code === "ENGINE_UNAVAILABLE" || error.code === "VOICE_UNAVAILABLE" || error.code === "TTS_UNAVAILABLE" || error.code === "CORPUS_UNAVAILABLE" || error.code === "TABLEBASE_UNAVAILABLE" || error.code === "REPERTOIRE_SCAN_UNAVAILABLE"
        ? 503
        : error.code === "IMPORT_SOURCE_UNAVAILABLE"
          ? 503
        : error.code === "EVIDENCE_UNAVAILABLE"
          ? 503
        : error.code === "POLICY_MODE_UNSUPPORTED" ||
            (error.code === "IMPORT_INVALID_PGN" || error.code === "IMPORT_INVALID") ||
            error.code === "IMPORT_SOURCE_UNSUPPORTED"
            || error.code === "REPERTOIRE_IMPORT_LIMIT"
          ? 422
          : error.code === "INVALID_REQUEST"
            ? 400
            : error.code === "SIMULATION_EXPIRED"
              ? 410
            : error.code === "RUN_NOT_FOUND" ||
                error.code === "PACK_NOT_FOUND" ||
                error.code === "SHAPE_NOT_FOUND" ||
                error.code === "EVIDENCE_RESULT_NOT_FOUND"
                || error.code === "UNKNOWN_GROUP" ||
                error.code === "IMPORT_SOURCE_NOT_FOUND"
                || error.code === "REPERTOIRE_NOT_FOUND"
              ? 404
              : error.code === "RUN_ALREADY_EXISTS" ||
                error.code === "FEEDBACK_WITHHELD" ||
                error.code === "ASSISTANCE_WITHHELD" ||
                error.code === "STORY_UNAVAILABLE" ||
                error.code === "PACK_UNRESOLVABLE" ||
                error.code === "PACK_ID_RESERVED" ||
                error.code === "SHAPE_ID_RESERVED" ||
                error.code === "PACK_VERSION_EXISTS" ||
                error.code === "SHAPE_VERSION_EXISTS" ||
                error.code === "PACK_ID_NOT_YOURS" ||
                error.code === "SHAPE_ID_NOT_YOURS" ||
                error.code === "DRAFT_STALE" ||
                error.code === "REPERTOIRE_STALE" ||
                error.code === "BOARD_HELD" ||
                error.code === "MATCH_LIVE" ||
                error.code === "MATCH_MAINLINE_LOCKED" ||
                error.code === "LEASE_MOVED" ||
                error.code === "VOTE_WINDOW_CLOSED"
                ? 409
                : error.code === "VOTE_INTAKE_FULL"
                  ? 429
                : error.code === "ARENA_ROOT_MISMATCH"
                  ? 422
                : error.code === "PACK_VERSION_NOT_INCREASING" ||
                    error.code === "SHAPE_VERSION_NOT_INCREASING" ||
                    error.code === "PROVENANCE_STATUS_NOT_WRITABLE" ||
                    error.code === "GRADUATION_BLOCKERS_OUTSTANDING"
                    || error.code === "TOO_MANY_BRANCHES"
                    || error.code === "NO_AUTHORED_VARIATIONS"
                    || error.code === "SIMULATE_TOO_LARGE"
                    || error.code === "SIMULATE_BUDGET_EXCEEDED"
                    || error.code === "GROUP_SEEDS_UNAVAILABLE"
                    || error.code === "TABLEBASE_OUT_OF_RANGE"
                    || error.code === "PERFECT_TABLEBASE_OUT_OF_RANGE"
                    || error.code === "PRACTICAL_RESISTANCE_OUT_OF_RANGE"
                    || error.code === "PRACTICAL_RESISTANCE_UNAVAILABLE"
                    || error.code === "PRACTICAL_RESISTANCE_UNDECIDABLE"
                    || error.code === "PRACTICAL_RESISTANCE_POLICY_MASS_INVALID"
                    || error.code === "TARGET_ELO_REQUIRED"
                    || error.code === "TARGET_ELO_OUT_OF_RANGE"
                  ? 422
                : 500;
  }

  return json(status, {
    error: {
      code,
      message,
      ...(reason === undefined ? {} : { reason }),
      ...(details === undefined ? {} : details),
    },
  });
}

function parseRunRoute(
  pathname: string,
): { runId: string; action: string } | undefined {
  const match = /^\/runs\/([^/]+)\/(moves|rewind|fork|graph|compare|branch-decidedness|events|evidence|authored-feedback|pgn|grants|lease|reveal|duplicate|schedule|simulate|simulate-enter|prediction|reasoning|reasoning-review|analysis|human-split|corpus|voice|speech|group|group-reply|import|story|share|flip|derivations|distill)$/.exec(
    pathname,
  );
  if (!match) return undefined;
  try {
    return { runId: decodeURIComponent(match[1]!), action: match[2]! };
  } catch {
    throw invalid("Run id contains invalid URL encoding");
  }
}

function parseSessionRoute(pathname: string): {
  readonly sessionId?: string;
  readonly resource?: "journal" | "board" | "proposals" | "votes" | "invitations" | "legs" | "match" | "links";
  readonly itemId?: string;
  readonly pgn?: true;
} | undefined {
  const match = /^\/sessions(?:\/([^/]+)(?:\/(journal|board|proposals|votes|invitations|legs|match|links)(?:\/([^/]+))?(?:\/(pgn))?)?)?$/.exec(pathname);
  if (match === null) return undefined;
  try {
    return Object.freeze({
      ...(match[1] === undefined ? {} : { sessionId: decodeURIComponent(match[1]) }),
      ...(match[2] === undefined ? {} : { resource: match[2] as "journal" | "board" | "proposals" | "votes" | "invitations" | "legs" | "match" | "links" }),
      ...(match[3] === undefined ? {} : { itemId: decodeURIComponent(match[3]) }),
      ...(match[4] === undefined ? {} : { pgn: true as const }),
    });
  } catch { throw invalid("Session path contains invalid URL encoding"); }
}

function packIdFromPath(pathname: string): string | undefined {
  const match = /^\/packs\/([^/]+)$/.exec(pathname);
  if (match === null) return undefined;
  try {
    return decodeURIComponent(match[1]!);
  } catch {
    throw invalid("Pack id contains invalid URL encoding");
  }
}

function parseBranches(url: URL): readonly string[] | undefined {
  const raw = url.searchParams.get("branches");
  if (raw === null) return undefined;
  const branches = raw.split(",").map((branch) => branch.trim());
  if (branches.length === 0 || branches.some((branch) => branch === "")) {
    throw invalid("branches must be a comma-separated list of branch ids");
  }
  return Object.freeze(branches);
}

function parseSinceSeq(url: URL): number {
  const raw = url.searchParams.get("sinceSeq");
  if (raw === null) return 0;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw invalid("sinceSeq must be a non-negative safe integer");
  }
  return value;
}

function parsePagination(url: URL): { readonly limit: number; readonly offset: number } {
  const parse = (name: "limit" | "offset", fallback: number): number => {
    const raw = url.searchParams.get(name);
    if (raw === null) return fallback;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < (name === "limit" ? 1 : 0)) {
      throw invalid(
        `${name} must be a ${name === "limit" ? "positive" : "non-negative"} safe integer`,
      );
    }
    return value;
  };
  const limit = parse("limit", 50);
  if (limit > 100) throw invalid("limit cannot exceed 100");
  return { limit, offset: parse("offset", 0) };
}

export function createRestHandler(
  service: RunService,
  selector?: OpponentSelector,
  capabilities?: CapabilitiesProvider,
  identity?: IdentityService,
  studio?: PackStudio,
  live?: LiveSessionService,
  shapes?: ShapeRegistry,
  shapeStudio?: ShapeStudio,
  voiceProvider?: VoiceProvider,
  voicePersona = "Clear, concise Tabiya voice. Do not add chess claims.",
  corpusSource?: CorpusSource,
  repertoires?: RepertoireService,
  ttsProvider?: TtsProvider,
): RestHandler {
  return async (request) => {
    try {
      const url = new URL(request.url);
      const authenticate = (): Principal => {
        if (identity === undefined) {
          // Low-level handler tests may omit identity; createApplication always supplies it.
          return Object.freeze({ learnerId: "__legacy", handle: "__legacy" });
        }
        return identity.authenticate(request.headers.get("cookie"));
      };
      if (url.pathname.startsWith("/auth/")) {
        if (identity === undefined) {
          throw new ServerError("UNAUTHENTICATED", "Authentication is not configured");
        }
        if (request.method === "GET" && url.pathname === "/auth/session") {
          const principal = authenticate();
          return json(200, { learner: identity.learner(principal) });
        }
        if (request.method !== "POST") {
          return json(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } });
        }
        requireJson(request);
        const value = await parseBody(request);
        if (url.pathname === "/auth/register") {
          const session = await identity.register({
            handle: requiredString(value.handle, "handle"),
            password: requiredString(value.password, "password"),
            ...(value.displayName === undefined
              ? {}
              : { displayName: requiredString(value.displayName, "displayName") }),
          });
          return jsonWithCookie(201, { learner: session.learner }, session.cookie);
        }
        if (url.pathname === "/auth/login") {
          const session = await identity.login(
            requiredString(value.handle, "handle"),
            requiredString(value.password, "password"),
          );
          return jsonWithCookie(200, { learner: session.learner }, session.cookie);
        }
        if (url.pathname === "/auth/logout") {
          return jsonWithCookie(200, {}, identity.logout(request.headers.get("cookie")));
        }
        if (url.pathname === "/auth/delete") {
          const principal = authenticate();
          const cookie = await identity.deleteAccount(
            principal,
            requiredString(value.password, "password"),
          );
          return jsonWithCookie(200, {}, cookie);
        }
        return json(404, { error: { code: "NOT_FOUND", message: "Route not found" } });
      }
      if (request.method === "GET" && url.pathname === "/capabilities") {
        if (capabilities === undefined) {
          throw new ServerError(
            "ENGINE_UNAVAILABLE",
            "Engine capabilities are not configured",
            { details: { engineId: "capabilities", retryAfterMs: 0 } },
          );
        }
        return json(200, await capabilities.get());
      }
      const publicStoryRoute = /^\/api\/shared\/([^/]+)\/story$/.exec(url.pathname);
      if (request.method === "GET" && publicStoryRoute !== null) {
        try { return json(200, service.publicStory(decodeURIComponent(publicStoryRoute[1]!))); }
        catch { return json(404, { error: { code: "NOT_FOUND", message: "Route not found" } }); }
      }
      const publicJoinRoute = /^\/api\/shared\/([^/]+)\/join$/.exec(url.pathname);
      if (publicJoinRoute !== null) {
        if(live===undefined)return json(404,{error:{code:"NOT_FOUND",message:"Route not found"}});
        const token=decodeURIComponent(publicJoinRoute[1]!);
        if(request.method==="GET"){try{return json(200,live.publicJoin(token));}catch{return json(404,{error:{code:"NOT_FOUND",message:"Route not found"}});}}
        if(request.method==="POST"){try{return json(200,live.join(token,authenticate()));}catch{return json(404,{error:{code:"NOT_FOUND",message:"Route not found"}});}}
        return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
      }
      const publicCardRoute = /^\/shared\/([^/]+)$/.exec(url.pathname);
      if (request.method === "GET" && publicCardRoute !== null) {
        const token=decodeURIComponent(publicCardRoute[1]!);
        const escape = escapeHtml;
        try{
          const card=service.publicStory(token),moments=card.moments.map((moment) => `<li>${escape(moment.sentences.join(" "))}</li>`).join("");
          return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(card.title)}</title></head><body><main><h1>${escape(card.title)}</h1><p>${escape(String(card.outcome.result ?? card.outcome.kind))}</p>${card.moments[0] === undefined ? "" : `<pre aria-label="Chessboard">${escape(card.moments[0].fen)}</pre>`}<ol>${moments}</ol><a href="${escape(card.productLink)}">Tabiya</a></main></body></html>`, { status: 200, headers: { "cache-control": "no-store", "content-type": "text/html; charset=utf-8" } });
        }catch{
          try{if(live===undefined)throw new Error();return sessionJoinPage(token,live.publicJoin(token));}catch{return json(404,{error:{code:"NOT_FOUND",message:"Route not found"}});}
        }
      }
      if (url.pathname === "/shapes/drafts") {
        if (shapeStudio === undefined) throw new ServerError("STORAGE_FAILURE", "Shape Studio is not configured");
        const principal=authenticate();
        if(request.method==="GET")return json(200,{drafts:shapeStudio.list(principal)});
        if(request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["document"]);return json(201,{draft:await shapeStudio.create(principal,body.document)});}
        return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
      }
      const shapeDraftRoute=/^\/shapes\/drafts\/([^/]+)(?:\/(lint|register))?$/.exec(url.pathname);
      if(shapeDraftRoute!==null){
        if(shapeStudio===undefined)throw new ServerError("STORAGE_FAILURE","Shape Studio is not configured");
        const principal=authenticate(),id=decodeURIComponent(shapeDraftRoute[1]!),action=shapeDraftRoute[2];
        if(request.method==="GET"&&action===undefined)return json(200,{draft:shapeStudio.required(id,principal)});
        requireJson(request);const body=await parseBody(request);
        if(request.method==="PUT"&&action===undefined)return json(200,{draft:await shapeStudio.update(id,principal,requiredString(request.headers.get("if-match"),"if-match header"),body.document)});
        if(request.method==="POST"&&action==="lint")return json(200,shapeStudio.lint(body.document,optionalString(body.probeFen,"probeFen")));
        if(request.method==="POST"&&action==="register")return json(201,{shape:await shapeStudio.register(id,principal)});
        return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
      }
      const shapeExport=/^\/shapes\/([^/]+)\/export$/.exec(url.pathname);
      if(request.method==="GET"&&shapeExport!==null){if(shapeStudio===undefined)throw new ServerError("STORAGE_FAILURE","Shape Studio is not configured");return json(200,shapeStudio.export(decodeURIComponent(shapeExport[1]!),authenticate()));}
      if (request.method === "GET" && url.pathname === "/shapes") {
        if (shapes === undefined) throw new ServerError("STORAGE_FAILURE", "Shape registry is not configured");
        return json(200, { shapes: shapes.list() });
      }
      if (request.method === "GET" && /^\/shapes\/[^/]+$/.test(url.pathname)) {
        if (shapes === undefined) throw new ServerError("STORAGE_FAILURE", "Shape registry is not configured");
        const id = decodeURIComponent(url.pathname.slice("/shapes/".length));
        const record = shapes.required(id);
        return new Response(JSON.stringify(projectShapeEntry(record)), { status: 200, headers: { "cache-control": "no-store", "content-type": "application/json", "x-shape-digest": record.digest } });
      }
      if(url.pathname==="/repertoires"){
        if(repertoires===undefined)throw new ServerError("STORAGE_FAILURE","Repertoire service is not configured");const principal=authenticate();
        if(request.method==="GET")return json(200,{repertoires:repertoires.list(principal)});
        if(request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["name","side","targetElo","coverageDenominator","source"]),side=requiredString(body.side,"side");if(side!=="white"&&side!=="black")throw invalid("side must be white or black");const denominator=requiredSafeInteger(body.coverageDenominator,"coverageDenominator");if(denominator<10||denominator>10_000)throw invalid("coverageDenominator must be between 10 and 10000");const targetElo=requiredSafeInteger(body.targetElo,"targetElo"),source=closedRecord(body.source,"/source",["kind","pgn","url"]),kind=requiredString(source.kind,"source.kind"),parsed=kind==="pgn"?{kind:"pgn" as const,pgn:requiredString(source.pgn,"source.pgn")}:kind==="lichess_study"?{kind:"lichess_study" as const,url:requiredString(source.url,"source.url")}:(()=>{throw invalid("source.kind must be pgn or lichess_study");})();return json(201,{repertoire:await repertoires.create(principal,{name:requiredString(body.name,"name"),side,targetElo,coverageDenominator:denominator,source:parsed})});}
        return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
      }
      if (request.method === "GET" && url.pathname === "/progress/recommendations") {
        const principal = authenticate();
        return json(200, { recommendations: Object.freeze([...(repertoires?.recommendations(principal) ?? []), ...service.shapeRecommendations(principal)]) });
      }
      const repertoireRoute=/^\/repertoires\/([^/]+)(?:\/(scan|gaps|answers))?(?:\/(enter))?$/.exec(url.pathname);
      if(repertoireRoute!==null){if(repertoires===undefined)throw new ServerError("STORAGE_FAILURE","Repertoire service is not configured");const principal=authenticate(),id=decodeURIComponent(repertoireRoute[1]!),resource=repertoireRoute[2],tail=repertoireRoute[3];
        if(resource===undefined&&request.method==="GET")return json(200,{repertoire:repertoires.get(id,principal)});
        if(resource===undefined&&request.method==="DELETE"){repertoires.remove(id,principal);return json(200,{deleted:true});}
        if(resource==="scan"&&request.method==="POST"){requireJson(request);closedRecord(await parseBody(request),"/",[]);return json(202,repertoires.queueScan(id,principal));}
        if(resource==="gaps"&&tail===undefined&&request.method==="GET")return json(200,repertoires.gaps(id,principal));
        if(resource==="gaps"&&tail==="enter"&&request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["gapKey","resistance"]),resistance=body.resistance===undefined?undefined:requiredString(body.resistance,"resistance");if(resistance!==undefined&&resistance!=="human_common"&&resistance!=="strong_engine")throw invalid("resistance must be human_common or strong_engine");return json(201,await repertoires.enter(id,principal,requiredString(body.gapKey,"gapKey"),resistance));}
        if(resource==="answers"&&request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["positionKey","moveUci","ifMatch"]);return json(200,{repertoire:repertoires.chooseAnswer(id,principal,{positionKey:requiredString(body.positionKey,"positionKey"),moveUci:requiredString(body.moveUci,"moveUci"),ifMatch:requiredString(body.ifMatch??request.headers.get("if-match"),"ifMatch")})});}
        return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
      }
      if (url.pathname === "/packs/drafts") {
        if (studio === undefined) throw new ServerError("STORAGE_FAILURE", "Pack Studio is not configured");
        const principal = authenticate();
        if (request.method === "GET") return json(200, { drafts: studio.list(principal) });
        if (request.method === "POST") {
          requireJson(request);
          const body = closedRecord(await parseBody(request), "/", ["document", "seedKind", "seedRef"]);
          return json(201, { draft: studio.create(principal, {
            document: body.document,
            ...(body.seedKind === undefined ? {} : { seedKind: requiredString(body.seedKind, "seedKind") as any }),
            ...(body.seedRef === undefined ? {} : { seedRef: requiredString(body.seedRef, "seedRef") }),
          }) });
        }
        return json(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } });
      }
      const draftRoute = /^\/packs\/drafts\/([^/]+)(?:\/(lint|playtest|register|withdraw))?$/.exec(url.pathname);
      if (draftRoute !== null) {
        if (studio === undefined) throw new ServerError("STORAGE_FAILURE", "Pack Studio is not configured");
        const principal = authenticate();
        const draftId = decodeURIComponent(draftRoute[1]!);
        const action = draftRoute[2];
        if (request.method === "GET" && action === undefined) return json(200, { draft: studio.required(draftId, principal) });
        requireJson(request);
        const body = await parseBody(request);
        if (request.method === "PUT" && action === undefined) {
          const expected = requiredString(request.headers.get("if-match"), "if-match header");
          return json(200, { draft: studio.update(draftId, principal, expected, body.document) });
        }
        if (request.method === "POST" && action === "lint") return json(200, studio.lint(body.document));
        if (request.method === "POST" && action === "playtest") {
          const record = studio.playtest(draftId, principal);
          const run = await service.create({
            id: requiredString(body.id, "id"),
            session: { kind: "pack", packId: record.document.id, packDigest: record.digest },
            policyConfig: parsePolicyConfig(body.policyConfig),
            seed: requiredSafeInteger(body.seed, "seed"),
          }, { writerId: writerId(request), learnerId: principal.learnerId });
          return json(201, { run });
        }
        if (request.method === "POST" && action === "register") return json(201, { pack: studio.register(draftId, principal) });
        if (request.method === "POST" && action === "withdraw") { studio.withdraw(draftId, principal); return json(200, { withdrawn: true }); }
        return json(405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } });
      }
      const exportRoute = /^\/packs\/([^/]+)\/export$/.exec(url.pathname);
      if (request.method === "GET" && exportRoute !== null) {
        if (studio === undefined) throw new ServerError("STORAGE_FAILURE", "Pack Studio is not configured");
        return json(200, studio.export(decodeURIComponent(exportRoute[1]!), authenticate()));
      }
      if (request.method === "GET" && url.pathname === "/packs") {
        return json(200, service.packs());
      }
      if (request.method === "GET" && url.pathname.startsWith("/packs/")) {
        const packId = packIdFromPath(url.pathname);
        if (packId === undefined) {
          return json(404, {
            error: { code: "NOT_FOUND", message: "Route not found" },
          });
        }
        const pack = service.pack(packId);
        return new Response(
          JSON.stringify(
            projectPackDocument(
              pack.document,
              pack.assessmentGrounding,
              pack.channel,
              pack.publisherHandle,
            ),
          ),
          {
          status: 200,
          headers: {
            "cache-control": "no-store",
            "content-type": "application/json",
            "x-pack-digest": pack.digest,
          },
          },
        );
      }
      if (request.method === "POST" && url.pathname === "/runs") {
        const principal = authenticate();
        const run = await service.create(
          parseCreateInput(await parseBody(request)),
          { writerId: writerId(request), learnerId: principal.learnerId },
        );
        return json(201, { run });
      }
      if (request.method === "POST" && url.pathname === "/runs/import") {
        const principal = authenticate();
        return json(201, await service.importGame(
          parseImportInput(await parseBody(request)),
          { writerId: writerId(request), learnerId: principal.learnerId },
        ));
      }
      if (request.method === "GET" && url.pathname === "/runs") {
        const principal = authenticate();
        const { limit, offset } = parsePagination(url);
        return json(200, { runs: service.runs(principal, limit, offset) });
      }
      if (request.method === "GET" && url.pathname === "/progress") {
        return json(200, { attempts: service.progress(authenticate()) });
      }
      if (request.method === "GET" && url.pathname === "/progress/due") {
        return json(200, {
          schedules: service.due(authenticate(), url.searchParams.get("at") ?? undefined),
        });
      }
      if (request.method === "GET" && url.pathname === "/progress/related") {
        return json(200, { related: service.related(
          requiredString(url.searchParams.get("runId"), "runId"),
          requiredString(url.searchParams.get("nodeId"), "nodeId"),
          authenticate(),
        ) });
      }
      if (request.method === "GET" && url.pathname === "/progress/metrics") {
        return json(200, service.progressMetrics(authenticate()));
      }
      if (request.method === "GET" && url.pathname === "/progress/milestones") {
        return json(200, { milestones: service.milestones(authenticate()) });
      }
      const scheduleRoute = /^\/progress\/schedules\/([^/]+)$/.exec(url.pathname);
      if (request.method === "POST" && scheduleRoute !== null) {
        requireJson(request);
        const value = closedRecord(await parseBody(request), "/", ["op"]);
        if (value.op !== "dismiss") throw invalid("op must be dismiss");
        service.dismissSchedule(decodeURIComponent(scheduleRoute[1]!), authenticate());
        return json(200, { dismissed: true });
      }
      if (request.method === "POST" && url.pathname === "/select-move") {
        authenticate();
        if (selector === undefined) {
          throw new ServerError(
            "ENGINE_UNAVAILABLE",
            "Opponent selector is not configured",
            { details: { engineId: "opponent-selector", retryAfterMs: 0 } },
          );
        }
        const parsed = parseSelectMoveRequest(await parseBody(request));
        const pack = parsed.packId === undefined ? undefined : service.pack(parsed.packId);
        const selection = await selector.select({
          ...parsed,
          policy: {
            ...parsed.policy,
            ...(pack?.document.spine === undefined ? {} : { spine: pack.document.spine }),
          },
        });
        return json(200, selection);
      }

      const sessionRoute = parseSessionRoute(url.pathname);
      if (sessionRoute !== undefined) {
        if (live === undefined) throw new ServerError("STORAGE_FAILURE", "Live sessions are not configured");
        const principal = authenticate();
        if (sessionRoute.sessionId === undefined) {
          if (request.method === "GET") return json(200, { sessions: live.list(principal) });
          if (request.method === "POST") {
            requireJson(request); const body=closedRecord(await parseBody(request),"/",["runId","kind","title","boardControl","scheduledFor","voteAdapterHandle","rotationHandles","matchPlayers"]);
            const kind=requiredString(body.kind,"kind"); if(!["stream","academy","match"].includes(kind))throw invalid("kind must be stream, academy, or match");
            const control=body.boardControl===undefined?undefined:requiredString(body.boardControl,"boardControl");if(control!==undefined&&!["free_claim","host_directed","rotation","match"].includes(control))throw invalid("boardControl is invalid");
            const handles=body.rotationHandles===undefined?undefined:Array.isArray(body.rotationHandles)&&body.rotationHandles.every((item)=>typeof item==="string")?body.rotationHandles as string[]:(()=>{throw invalid("rotationHandles must be an array of strings");})();
            const players=body.matchPlayers===undefined?undefined:closedRecord(body.matchPlayers,"/matchPlayers",["white","black"]);
            return json(201,{session:live.create(principal,{runId:requiredString(body.runId,"runId"),kind:kind as SessionKind,title:requiredString(body.title,"title"),...(control===undefined?{}:{boardControl:control as BoardControl}),...(body.scheduledFor===undefined?{}:{scheduledFor:requiredString(body.scheduledFor,"scheduledFor")}),...(body.voteAdapterHandle===undefined?{}:{voteAdapterHandle:requiredString(body.voteAdapterHandle,"voteAdapterHandle")}),...(handles===undefined?{}:{rotationHandles:handles}),...(players===undefined?{}:{matchPlayers:{...(players.white===undefined?{}:{white:requiredString(players.white,"matchPlayers.white")}),...(players.black===undefined?{}:{black:requiredString(players.black,"matchPlayers.black")})}})})});
          }
          return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
        }
        const sid=sessionRoute.sessionId;
        if (sessionRoute.resource === undefined) {
          if(request.method==="GET")return json(200,live.detail(sid,principal));
          if(request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["op"]);if(body.op!=="close")throw invalid("op must be close");return json(200,{session:live.close(sid,principal)});}
        }
        if(sessionRoute.resource==="journal"&&request.method==="GET")return json(200,live.journal(sid,principal,parseSinceSeq(url)));
        if(sessionRoute.resource==="board"&&request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["op","handle"]);const op=requiredString(body.op,"op");if(!["offer","withdraw","advance","reclaim"].includes(op))throw invalid("invalid board operation");return json(200,{session:live.board(sid,principal,writerId(request),{op:op as "offer"|"withdraw"|"advance"|"reclaim",...(body.handle===undefined?{}:{handle:requiredString(body.handle,"handle")})})});}
        if(sessionRoute.resource==="match"&&request.method==="POST"){requireJson(request);const body=closedRecord(await parseBody(request),"/",["op"]),op=requiredString(body.op,"op");if(!["propose_pause","accept_pause","withdraw_pause","pause","resume"].includes(op))throw invalid("invalid match operation");return json(200,{match:live.matchOperation(sid,principal,request.headers.get("x-writer-id")??undefined,op as "propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume")});}
        if(sessionRoute.resource==="links"){
          if(request.method==="GET"&&sessionRoute.itemId===undefined)return json(200,{links:live.links(sid,principal)});
          if(request.method==="POST"&&sessionRoute.itemId===undefined){requireJson(request);const body=closedRecord(await parseBody(request),"/",["matchSlot","invitedRole","invitedHandle","expiresInDays"]),role=requiredString(body.invitedRole,"invitedRole"),slot=body.matchSlot===undefined?undefined:requiredString(body.matchSlot,"matchSlot");if(role!=="participant"&&role!=="spectator")throw invalid("invitedRole must be participant or spectator");if(slot!==undefined&&slot!=="white"&&slot!=="black")throw invalid("matchSlot must be white or black");return json(201,live.mintLink(sid,principal,{invitedRole:role,...(slot===undefined?{}:{matchSlot:slot}),...(body.invitedHandle===undefined?{}:{invitedHandle:requiredString(body.invitedHandle,"invitedHandle")}),...(body.expiresInDays===undefined?{}:{expiresInDays:requiredSafeInteger(body.expiresInDays,"expiresInDays")})}));}
          if(request.method==="POST"&&sessionRoute.itemId!==undefined){requireJson(request);const body=closedRecord(await parseBody(request),"/",["op"]);if(body.op!=="revoke")throw invalid("op must be revoke");live.revokeLink(sid,sessionRoute.itemId,principal);return json(200,{revoked:true});}
        }
        if(sessionRoute.resource==="proposals"){
          if(request.method==="GET"&&sessionRoute.itemId===undefined)return json(200,{proposals:live.proposals(sid,principal)});
          if(request.method==="POST"){requireJson(request);const body=await parseBody(request);if(sessionRoute.itemId===undefined)return json(201,{proposal:live.propose(sid,principal,requiredString(body.nodeId,"nodeId"),requiredString(body.moveUci,"moveUci"))});const op=requiredString(body.op,"op");if(op!=="apply"&&op!=="decline")throw invalid("op must be apply or decline");return json(200,{proposal:live.resolveProposal(sid,sessionRoute.itemId,principal,writerId(request),op)});}
        }
        if(sessionRoute.resource==="votes"){
          if(request.method==="GET"&&sessionRoute.itemId!==undefined)return json(200,live.tally(sid,sessionRoute.itemId,principal));
          if(request.method==="POST"){requireJson(request);const body=await parseBody(request);const op=requiredString(body.op,"op");if(op==="open"){if(!Array.isArray(body.options))throw invalid("options must be an array");const options=body.options.map((item,index)=>{const value=record(item,`options/${index}`);return Object.freeze({moveUci:requiredString(value.moveUci,"moveUci"),label:requiredString(value.label,"label")});}) as VoteOption[];return json(201,live.openVote(sid,principal,{nodeId:requiredString(body.nodeId,"nodeId"),prompt:requiredString(body.prompt,"prompt"),options,durationSeconds:requiredSafeInteger(body.durationSeconds,"durationSeconds")}));}if(op==="cast")return json(200,live.castVote(sid,principal,{windowId:requiredString(body.windowId,"windowId"),choiceUci:requiredString(body.choiceUci,"choiceUci"),...(body.voterKey===undefined?{}:{voterKey:requiredString(body.voterKey,"voterKey")})}));if(op==="close")return json(200,live.closeVote(sid,principal,requiredString(body.windowId,"windowId"),body.appliedOptionUci===undefined?undefined:requiredString(body.appliedOptionUci,"appliedOptionUci")));throw invalid("invalid vote operation");}
        }
        if(sessionRoute.resource==="invitations"){
          if(request.method==="GET")return json(200,{invitations:live.detail(sid,principal).invitations});
          if(request.method==="POST"){requireJson(request);const body=await parseBody(request);const leg=body.leg===undefined?undefined:requiredSafeInteger(body.leg,"leg");if(leg!==undefined&&leg!==1&&leg!==2)throw invalid("leg must be 1 or 2");return json(201,{invitation:live.invite(sid,principal,{...(leg===undefined?{}:{leg}),...(body.handle===undefined?{}:{handle:requiredString(body.handle,"handle")}),...(body.externalChallengeUrl===undefined?{}:{externalChallengeUrl:requiredString(body.externalChallengeUrl,"externalChallengeUrl")})})});}
        }
        if(sessionRoute.resource==="legs"&&sessionRoute.itemId!==undefined&&sessionRoute.pgn===true&&request.method==="POST"){
          const contentType=request.headers.get("content-type")??"";if(!/^text\/x-chess-pgn(?:\s*;|$)/i.test(contentType))throw invalid("content-type must be text/x-chess-pgn");const leg=Number(sessionRoute.itemId);if(leg!==1&&leg!==2)throw invalid("leg must be 1 or 2");return json(200,{leg:live.importLeg(sid,leg,principal,writerId(request),await request.text(),url.searchParams.get("result") as any)});
        }
        return json(405,{error:{code:"METHOD_NOT_ALLOWED",message:"Method not allowed"}});
      }

      const shareDelete = /^\/runs\/([^/]+)\/share\/([^/]+)$/.exec(url.pathname);
      if (request.method === "DELETE" && shareDelete !== null) {
        const principal = authenticate();
        service.revokeShare(decodeURIComponent(shareDelete[1]!), principal, decodeURIComponent(shareDelete[2]!));
        return json(200, { revoked: true });
      }
      const route = parseRunRoute(url.pathname);
      if (!route) {
        return json(404, {
          error: { code: "NOT_FOUND", message: "Route not found" },
        });
      }
      const principal = authenticate();
      if (request.method === "GET" && route.action === "graph") {
        return json(200, {
          graph: service.graph(
            route.runId,
            principal,
            request.headers.get("x-writer-id") ?? undefined,
          ),
        });
      }
      if (request.method === "GET" && route.action === "events") {
        return json(200, service.events(route.runId, principal, parseSinceSeq(url)));
      }
      if (request.method === "GET" && route.action === "evidence") {
        return json(200, service.evidence(route.runId, principal, parseSinceSeq(url)));
      }
      if (request.method === "GET" && route.action === "authored-feedback") {
        return json(200, service.authoredFeedback(route.runId, principal));
      }
      if (request.method === "GET" && route.action === "reasoning") {
        return json(200, service.reasoning(route.runId, principal, requiredString(url.searchParams.get("checkpointId"), "checkpointId")));
      }
      if (request.method === "GET" && route.action === "import") {
        return json(200, { importRecord: service.importRecord(route.runId, principal) });
      }
      if (request.method === "GET" && route.action === "story") {
        return json(200, service.story(route.runId, principal, url.searchParams.get("branch") ?? undefined));
      }
      if (request.method === "GET" && route.action === "share") {
        return json(200, { shares: service.shares(route.runId, principal) });
      }
      if (request.method === "GET" && route.action === "derivations") {
        return json(200, { derivations: service.derivations(route.runId, principal) });
      }
      if (request.method === "GET" && route.action === "pgn") {
        const pgn = await service.pgn(route.runId, principal, parseBranches(url));
        const filename = `${route.runId.replaceAll(/[^a-zA-Z0-9._-]/g, "_")}.pgn`;
        return new Response(pgn, {
          status: 200,
          headers: {
            "cache-control": "no-store",
            "content-disposition": `attachment; filename="${filename}"`,
            "content-type": "text/x-chess-pgn; charset=utf-8",
          },
        });
      }
      if (request.method === "GET" && route.action === "grants") {
        return json(200, { grants: service.grants(route.runId, principal) });
      }
      if (request.method === "GET" && route.action === "human-split") {
        if (selector === undefined || capabilities === undefined) {
          throw new ServerError("ENGINE_UNAVAILABLE", "Human-model distribution is unavailable", { details: { engineId: "opponent-selector", retryAfterMs: 0 } });
        }
        const access = service.guidanceAccess(route.runId, principal, requiredString(url.searchParams.get("nodeId"), "nodeId"));
        const permission = permittedAssistance({ sessionKind: access.run.sessionKind, deliveryOpen: feedbackDeliveryOpen(access.run), role: access.role });
        if (permission.humanSplit === "locked_off") throw new ServerError("ASSISTANCE_WITHHELD", "Human-model distribution is withheld in this context");
        const available = await capabilities.get();
        if (available.providers.opponent === "none") throw new ServerError("ENGINE_UNAVAILABLE", "Human-model distribution is unavailable", { details: { engineId: "opponent-selector", retryAfterMs: 0 } });
        const authored = access.run.opponentPolicy;
        const selection = await selector.select({
          startFen: access.run.start.fen,
          historyUci: access.historyUci,
          policy: { mode: "human_common", policyConfigDigest: access.run.sessionDigest, ...(authored.targetElo === undefined ? {} : { targetElo: authored.targetElo }), ...(authored.temperature === undefined ? {} : { temperature: authored.temperature }), ...(authored.topP === undefined ? {} : { topP: authored.topP }) },
          seed: access.branchSeed,
          ...(access.pack === undefined ? {} : { packId: access.pack.document.id }),
        });
        return json(200, { nodeId: access.node.id, engine: selection.engine, targetElo: authored.targetElo ?? null, candidates: selection.candidates ?? [] });
      }
      if (request.method === "GET" && route.action === "corpus") {
        if (corpusSource === undefined) throw new ServerError("CORPUS_UNAVAILABLE", "Corpus evidence is unavailable");
        const access = service.guidanceAccess(route.runId, principal, requiredString(url.searchParams.get("nodeId"), "nodeId"));
        const permission = permittedAssistance({ sessionKind: access.run.sessionKind, deliveryOpen: feedbackDeliveryOpen(access.run), role: access.role });
        if (permission.corpus === "locked_off") throw new ServerError("ASSISTANCE_WITHHELD", "Corpus evidence is withheld in this context");
        const selectedPopulation = corpusPopulation(access.run.opponentPolicy.mode === "human_common" ? access.run.opponentPolicy.targetElo : undefined);
        const path = historyFrom(access.run, access.run.activeCursor.nodeId);
        const index = path.findIndex((node) => node.id === access.node.id);
        const child = index < 0 ? undefined : path[index + 1];
        const result = await corpusSource.stats({ ...selectedPopulation, fen: access.node.fen });
        return json(200, { nodeId: access.node.id, result, committedMoveSan: child?.actor === "user" ? child.moveSan : null });
      }
      if (request.method !== "POST") {
        return json(405, {
          error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
        });
      }

      const value = await parseBody(request);
      if (route.action === "distill") {
        if (studio === undefined) throw new ServerError("STORAGE_FAILURE", "Pack Studio is not configured");
        requireJson(request);
        const body = closedRecord(value, "/", ["packId", "title", "branchId"]);
        const access = service.distillationAccess(route.runId, principal);
        const result = distillRun(access.run, access.pack, { packId: requiredString(body.packId, "packId"), title: requiredString(body.title, "title"), ...(body.branchId === undefined ? {} : { branchId: requiredString(body.branchId, "branchId") }) });
        const draft = studio.create(principal, { document: result.document, seedKind: "run", seedRef: route.runId });
        return json(201, { draft, proposals: result.proposals, dropped: result.dropped });
      }
      if (route.action === "reasoning-review") {
        requireJson(request);
        if (voiceProvider === undefined) throw new ServerError("VOICE_UNAVAILABLE", "No external voice provider is configured");
        const body = closedRecord(value, "/", ["checkpointEventSeq"]);
        const access = service.reasoningReviewAccess(route.runId, principal, requiredSafeInteger(body.checkpointEventSeq, "checkpointEventSeq"));
        const packet = evidencePacket({ run: access.run, node: access.node, pack: access.pack.document, authored: service.authoredFeedback(route.runId, principal), ...(shapes === undefined ? {} : { shapes }) });
        const prompt = JSON.stringify({ task: "Quote only contiguous learner text that may express each not-detected authored point.", transcript: access.event.data.transcript, keyPoints: access.keyPoints.map((point) => ({ id: point.id, label: point.label, phrases: point.phrases })), detections: access.event.data.detections });
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const raw = await voiceProvider.render(packet, voicePersona, prompt, "reasoning");
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) continue;
            const proposals = parsed.map((item) => {
              const row = closedRecord(item, "/proposal", ["keyPointId", "quotation"]);
              return Object.freeze({ keyPointId: requiredString(row.keyPointId, "keyPointId"), quotation: requiredString(row.quotation, "quotation") });
            }) satisfies ReasoningProposal[];
            const accepted = reasoningMatchCheck(proposals, access.event.data.transcript!, access.keyPoints, access.event.data.detections);
            if (accepted === undefined) continue;
            const labels = new Map(access.keyPoints.map((point) => [point.id, point.label]));
            return json(200, { provider: "external", proposals: accepted.map((proposal) => ({ ...proposal, text: `Possible mention, proposed by the configured language model and not a detection: you wrote "${proposal.quotation}" — the author's point "${labels.get(proposal.keyPointId)}".` })) });
          } catch { /* one retry, then silence */ }
        }
        return json(200, { provider: "external", proposals: [] });
      }
      if (route.action === "voice") {
        requireJson(request);
        if (voiceProvider === undefined) throw new ServerError("VOICE_UNAVAILABLE", "No external voice provider is configured");
        const body = closedRecord(value, "/", ["nodeId", "scope", "branches"]);
        const scope = requiredString(body.scope, "scope");
        if (scope !== "marker" && scope !== "reading" && scope !== "steering" && scope !== "story" && scope !== "compare") throw invalid("scope must be marker, reading, steering, story, or compare");
        if (scope === "compare") {
          if (!Array.isArray(body.branches) || body.branches.some((branch) => typeof branch !== "string")) throw invalid("branches must be an array of strings");
          const comparison = service.compare(route.runId, principal, body.branches as string[]);
          const access = service.guidanceAccess(route.runId, principal, comparison.forkNodeId);
          const narrative = comparisonNarrative(access.run, comparison, comparisonStrips(access.run, comparison));
          const base = evidencePacket({ run: access.run, node: access.node, ...(access.pack === undefined ? {} : { pack: access.pack.document }), authored: service.authoredFeedback(route.runId, principal), ...(shapes === undefined ? {} : { shapes }) });
          const packet = Object.freeze({ ...base, authored: Object.freeze([]), sentences: Object.freeze(narrative.groups.flatMap((group) => group.sentences)) });
          return json(200, { ...(await renderVoice(voiceProvider, packet, voicePersona, "compare")), scope });
        }
        const access = service.guidanceAccess(route.runId, principal, requiredString(body.nodeId, "nodeId"));
        const basePacket = evidencePacket({ run: access.run, node: access.node, ...(access.pack === undefined ? {} : { pack: access.pack.document }), authored: service.authoredFeedback(route.runId, principal), ...(shapes === undefined ? {} : { shapes }) });
        const story = scope === "story" ? service.story(route.runId, principal) : undefined;
        const packet = story === undefined
          ? basePacket
          : Object.freeze({ ...basePacket, sentences: Object.freeze([...basePacket.sentences, suggestTitle(story), ...(story.moments.find((moment) => moment.nodeId === access.node.id)?.sentences ?? [])]) });
        return json(200, { ...(await renderVoice(voiceProvider, packet, voicePersona, scope as VoiceScope)), scope });
      }
      if (route.action === "speech") {
        requireJson(request);
        if (ttsProvider === undefined) throw new ServerError("TTS_UNAVAILABLE", "No external TTS provider is configured");
        const body = closedRecord(value, "/", ["nodeId", "scope"]);
        const scope = requiredString(body.scope, "scope");
        if (scope !== "marker" && scope !== "reading" && scope !== "steering" && scope !== "story") throw invalid("scope must be marker, reading, steering, or story");
        const access = service.guidanceAccess(route.runId, principal, requiredString(body.nodeId, "nodeId"));
        const basePacket = evidencePacket({ run: access.run, node: access.node, ...(access.pack === undefined ? {} : { pack: access.pack.document }), authored: service.authoredFeedback(route.runId, principal), ...(shapes === undefined ? {} : { shapes }) });
        const story = scope === "story" ? service.story(route.runId, principal) : undefined;
        const packet = story === undefined ? basePacket : Object.freeze({ ...basePacket, sentences: Object.freeze([...basePacket.sentences, suggestTitle(story), ...(story.moments.find((moment) => moment.nodeId === access.node.id)?.sentences ?? [])]) });
        const checkedText = voiceProvider === undefined ? packet.sentences.join("\n") : (await renderVoice(voiceProvider, packet, voicePersona, scope as VoiceScope)).text;
        const audio = await ttsProvider.synthesize(checkedText);
        return new Response(Uint8Array.from(audio.bytes).buffer, { status: 200, headers: { "content-type": audio.contentType, "cache-control": "no-store" } });
      }
      if (route.action === "share") {
        requireJson(request);
        const body = closedRecord(value, "/", ["branchId"]);
        return json(201, service.share(route.runId, principal, requiredString(body.branchId, "branchId")));
      }
      if (route.action === "flip") {
        requireJson(request);
        const body = closedRecord(value, "/", ["nodeId", "resistance"]);
        const resistance = body.resistance === undefined ? undefined : requiredString(body.resistance, "resistance");
        if (resistance !== undefined && resistance !== "human_common" && resistance !== "strong_engine") throw invalid("resistance must be human_common or strong_engine");
        return json(201, await service.flip(route.runId, principal, requiredString(body.nodeId, "nodeId"), resistance));
      }
      if (route.action === "lease") {
        requireJson(request);
        service.claimLease(route.runId, principal, writerId(request), optionalString(value.expectedHolderLearnerId,"expectedHolderLearnerId"));
        return json(200, { holdsLease: true });
      }
      if (route.action === "reveal") {
        requireJson(request);
        return json(200, service.reveal(
          route.runId,
          principal,
          writerId(request),
          optionalString(value.at, "at"),
        ));
      }
      if (route.action === "duplicate") {
        requireJson(request);
        const body = closedRecord(value, "/", ["id", "seed", "scheduleId", "createdAt"]);
        const run = await service.duplicate(route.runId, principal, {
          id: requiredString(body.id, "id"),
          writerId: writerId(request),
          seed: requiredSafeInteger(body.seed, "seed"),
          ...(body.scheduleId === undefined ? {} : { scheduleId: requiredString(body.scheduleId, "scheduleId") }),
          ...(body.createdAt === undefined ? {} : { createdAt: requiredString(body.createdAt, "createdAt") }),
        });
        return json(201, { run });
      }
      if (route.action === "schedule") {
        requireJson(request);
        const body = closedRecord(value, "/", ["nodeId", "kind", "variant", "dueAt", "at"]);
        if (body.kind !== "blocked" && body.kind !== "varied") {
          throw invalid("kind must be blocked or varied");
        }
        return json(201, service.schedule(route.runId, principal, writerId(request), {
          nodeId: requiredString(body.nodeId, "nodeId"),
          kind: body.kind,
          ...(body.variant === undefined ? {} : { variant: requiredString(body.variant, "variant") }),
          ...(body.dueAt === undefined ? {} : { dueAt: requiredString(body.dueAt, "dueAt") }),
          ...(body.at === undefined ? {} : { at: requiredString(body.at, "at") }),
        }));
      }
      if (route.action === "grants") {
        requireJson(request);
        const op = requiredString(value.op, "op");
        if (op !== "grant" && op !== "revoke") throw invalid("op must be grant or revoke");
        const handle = requiredString(value.handle, "handle");
        const operation =
          op === "grant"
            ? { op, handle, role: runRole(value.role) } as const
            : { op, handle } as const;
        return json(200, {
          grants: service.updateGrant(
            route.runId,
            principal,
            writerId(request),
            operation,
          ),
        });
      }
      if (route.action === "group") {
        requireJson(request);
        const body = closedRecord(value, "/", ["source", "resistance", "candidates", "size", "at"]);
        const source = requiredString(body.source, "source");
        if (source !== "hand_picked" && source !== "authored" && source !== "human_replies" && source !== "engine_top_n") {
          throw invalid("source is unsupported");
        }
        const resistance = body.resistance === undefined ? undefined : requiredString(body.resistance, "resistance");
        if (resistance !== undefined && resistance !== "fixed" && resistance !== "per_branch") {
          throw invalid("resistance must be fixed or per_branch");
        }
        if (body.candidates !== undefined && (!Array.isArray(body.candidates) || body.candidates.some((candidate) => typeof candidate !== "string"))) {
          throw invalid("candidates must be an array of strings");
        }
        return json(200, await service.createGroup(route.runId, principal, writerId(request), {
          source,
          ...(resistance === undefined ? {} : { resistance }),
          ...(body.candidates === undefined ? {} : { candidates: body.candidates as string[] }),
          ...(body.size === undefined ? {} : { size: requiredSafeInteger(body.size, "size") }),
          ...(body.at === undefined ? {} : { at: requiredString(body.at, "at") }),
        }));
      }
      if (route.action === "group-reply") {
        requireJson(request);
        const body = closedRecord(value, "/", ["groupId"]);
        return json(200, await service.groupReply(
          route.runId,
          principal,
          writerId(request),
          requiredString(body.groupId, "groupId"),
        ));
      }
      if (route.action === "moves") {
        if (value.selection !== undefined) {
          if (value.actor !== undefined || value.uci !== undefined) {
            throw invalid("selection moves derive actor and uci from selection");
          }
          return json(
            200,
            service.opponentPly(
              route.runId,
              principal,
              writerId(request),
              parseOpponentSelection(value.selection),
              {
                ...(value.at === undefined
                  ? {}
                  : { at: requiredString(value.at, "at") }),
                ...(value.clockState === undefined
                  ? {}
                  : { clockState: record(value.clockState, "clockState") }),
              },
            ),
          );
        }
        if (value.actor === "opponent") {
          throw invalid("opponent moves require the authoritative selection payload");
        }
        return json(
          200,
          service.move(
            route.runId,
            principal,
            writerId(request),
            requiredString(value.uci, "uci"),
            parseMoveOptions(value),
          ),
        );
      }
      if (route.action === "rewind") {
        const nodeId = optionalString(value.nodeId, "nodeId");
        const checkpointId = optionalString(value.checkpointId, "checkpointId");
        if ((nodeId === undefined) === (checkpointId === undefined)) {
          throw invalid("rewind requires exactly one of nodeId or checkpointId");
        }
        const target: RewindTarget =
          nodeId === undefined ? { checkpointId: checkpointId! } : { nodeId };
        return json(
          200,
          service.rewind(
            route.runId,
            principal,
            writerId(request),
            target,
            optionalString(value.at, "at"),
          ),
        );
      }
      if (route.action === "fork") {
        return json(
          200,
          service.fork(
            route.runId,
            principal,
            writerId(request),
            requiredString(value.nodeId, "nodeId"),
            {
              ...(value.label === undefined
                ? {}
                : { label: requiredString(value.label, "label") }),
              ...(value.intent === undefined
                ? {}
                : { intent: requiredString(value.intent, "intent") }),
              ...(value.at === undefined
                ? {}
                : { at: requiredString(value.at, "at") }),
            },
          ),
        );
      }
      if (route.action === "compare") {
        const branchIds = value.branchIds;
        if (!Array.isArray(branchIds) || branchIds.some((id) => typeof id !== "string")) {
          throw invalid("branchIds must be an array of strings");
        }
        return json(200, {
          comparison: service.compare(
            route.runId,
            principal,
            branchIds,
          ),
        });
      }
      if (route.action === "branch-decidedness") {
        const branchIds = value.branchIds;
        if (!Array.isArray(branchIds) || branchIds.some((id) => typeof id !== "string")) throw invalid("branchIds must be an array of strings");
        return json(200, { decidedness: await service.branchDecidedness(route.runId, principal, branchIds) });
      }
      if (route.action === "analysis") {
        const body = closedRecord(value, "/", ["nodeIds", "kind", "multiPv", "depth", "movetime"]);
        if (body.kind !== "bestline") throw invalid("analysis kind must be bestline");
        if (!Array.isArray(body.nodeIds) || body.nodeIds.some((id) => typeof id !== "string")) {
          throw invalid("nodeIds must be an array of strings");
        }
        return json(202, { jobs: service.analysis(route.runId, principal, writerId(request), {
          nodeIds: body.nodeIds,
          ...(body.multiPv === undefined ? {} : { multiPv: requiredSafeInteger(body.multiPv, "multiPv") }),
          ...(body.depth === undefined ? {} : { depth: requiredSafeInteger(body.depth, "depth") }),
          ...(body.movetime === undefined ? {} : { movetime: requiredSafeInteger(body.movetime, "movetime") }),
        }) });
      }
      if (route.action === "simulate") {
        const body = closedRecord(value, "/", ["maxBranches", "maxPlies", "at"]);
        return json(200, service.simulate(route.runId, principal, writerId(request), {
          ...(body.maxBranches === undefined ? {} : { maxBranches: requiredSafeInteger(body.maxBranches, "maxBranches") }),
          ...(body.maxPlies === undefined ? {} : { maxPlies: requiredSafeInteger(body.maxPlies, "maxPlies") }),
          ...(body.at === undefined ? {} : { at: requiredString(body.at, "at") }),
        }));
      }
      if (route.action === "simulate-enter") {
        const body = closedRecord(value, "/", ["simulationId", "branchIndex", "at"]);
        return json(200, service.enterSimulation(
          route.runId,
          principal,
          writerId(request),
          requiredString(body.simulationId, "simulationId"),
          requiredSafeInteger(body.branchIndex, "branchIndex"),
          body.at === undefined ? undefined : requiredString(body.at, "at"),
        ));
      }
      if (route.action === "prediction") {
        if (selector === undefined) {
          throw new ServerError("ENGINE_UNAVAILABLE", "Opponent selector is not configured", {
            details: { engineId: "opponent-selector", retryAfterMs: 0 },
          });
        }
        const body = closedRecord(value, "/", ["startFen", "historyUci", "policy", "seed", "packId", "checkpointId", "nodeId", "predictedUci", "at"]);
        const parsed = parseSelectMoveRequest({
          startFen: body.startFen,
          historyUci: body.historyUci,
          policy: body.policy,
          seed: body.seed,
          ...(body.packId === undefined ? {} : { packId: body.packId }),
        });
        const pack = parsed.packId === undefined ? undefined : service.pack(parsed.packId);
        const selection = await selector.select({
          ...parsed,
          policy: { ...parsed.policy, ...(pack?.document.spine === undefined ? {} : { spine: pack.document.spine }) },
        });
        const result = service.recordPrediction(route.runId, principal, writerId(request), {
          nodeId: requiredString(body.nodeId, "nodeId"),
          checkpointId: requiredString(body.checkpointId, "checkpointId"),
          predictedUci: requiredString(body.predictedUci, "predictedUci"),
          distribution: selection,
          ...(body.at === undefined ? {} : { at: requiredString(body.at, "at") }),
        });
        return json(200, { selection, run: result.run, emitted: result.emitted });
      }
      if (route.action === "reasoning") {
        requireJson(request);
        const body = closedRecord(value, "/", ["nodeId", "checkpointEventSeq", "transcript", "skipped", "at"]);
        const transcript = body.transcript === undefined ? undefined : (() => {
          const item = closedRecord(body.transcript, "/transcript", ["candidates", "plan", "fears"]);
          if (!Array.isArray(item.candidates) || item.candidates.some((candidate) => typeof candidate !== "string")) throw invalid("transcript.candidates must be an array of strings");
          return { candidates: item.candidates as string[], plan: requiredString(item.plan, "transcript.plan"), fears: typeof item.fears === "string" ? item.fears : (() => { throw invalid("transcript.fears must be a string"); })() };
        })();
        if (body.skipped !== undefined && body.skipped !== true) throw invalid("skipped must be true when present");
        return json(200, service.recordReasoning(route.runId, principal, writerId(request), { nodeId: requiredString(body.nodeId, "nodeId"), checkpointEventSeq: requiredSafeInteger(body.checkpointEventSeq, "checkpointEventSeq"), ...(transcript === undefined ? {} : { transcript }), ...(body.skipped === true ? { skipped: true as const } : {}), ...(body.at === undefined ? {} : { at: requiredString(body.at, "at") }) }));
      }
      if (route.action === "evidence") {
        return json(
          200,
          service.applyEvidence(
            route.runId,
            principal,
            writerId(request),
            requiredSafeInteger(value.resultSeq, "resultSeq"),
            optionalString(value.at, "at"),
          ),
        );
      }
      return json(404, {
        error: { code: "NOT_FOUND", message: "Route not found" },
      });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

async function requestFromNode(request: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const method = request.method ?? "GET";
  const payload = Buffer.concat(chunks).toString("utf8");
  return new Request(
    `http://${request.headers.host ?? "localhost"}${request.url ?? "/"}`,
    {
      method,
      headers: request.headers as HeadersInit,
      ...(method === "GET" || method === "HEAD" ? {} : { body: payload }),
    },
  );
}

async function writeNodeResponse(
  response: ServerResponse,
  result: Response,
): Promise<void> {
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  response.end(Buffer.from(await result.arrayBuffer()));
}

export function createHttpServer(handler: RestHandler): Server {
  return createServer((request, response) => {
    void requestFromNode(request)
      .then(handler)
      .then((result) => writeNodeResponse(response, result))
      .catch(() =>
        writeNodeResponse(
          response,
          json(500, {
            error: { code: "INTERNAL_ERROR", message: "Internal server error" },
          }),
        ),
      );
  });
}
