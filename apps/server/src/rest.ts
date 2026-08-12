import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import {
  BranchQueryError,
  RuntimeError,
  type OpponentSelection,
  type SelectionCandidate,
  type SelectionEngineIdentity,
  type CommitMoveOptions,
  type PolicyConfig,
  type VersionedPolicy,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import type { CapabilitiesProvider } from "./capabilities.js";
import { projectPackDocument } from "./pack-registry.js";
import {
  OpponentSelector,
  parseSelectMoveRequest,
} from "./opponent-selector.js";
import {
  RunService,
  type CreateRunRequest,
  type RewindTarget,
} from "./service.js";
import { IdentityService } from "./identity.js";
import type { Principal } from "./authorization.js";
import type { RunRole } from "./storage.js";

export type RestHandler = (request: Request) => Promise<Response>;

function json(status: number, value: unknown): Response {
  return Response.json(value, {
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
  return {
    moveUci: requiredString(candidate.moveUci, `${label}.moveUci`),
    rank: candidate.rank,
    ...(candidate.mass === undefined ? {} : { mass: candidate.mass as number }),
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
  value = closedRecord(value, "/", ["id", "session", "policyConfig", "seed", "createdAt"]);
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
  return {
    id: requiredString(value.id, "id"),
    session,
    policyConfig: parsePolicyConfig(value.policyConfig),
    seed: value.seed,
    ...(value.createdAt === undefined
      ? {}
      : { createdAt: requiredString(value.createdAt, "createdAt") }),
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
      : error.code === "ENGINE_UNAVAILABLE"
        ? 503
        : error.code === "EVIDENCE_UNAVAILABLE"
          ? 503
        : error.code === "POLICY_MODE_UNSUPPORTED"
          ? 422
          : error.code === "INVALID_REQUEST"
            ? 400
            : error.code === "RUN_NOT_FOUND" ||
                error.code === "PACK_NOT_FOUND" ||
                error.code === "EVIDENCE_RESULT_NOT_FOUND"
              ? 404
              : error.code === "RUN_ALREADY_EXISTS" ||
                  error.code === "FEEDBACK_WITHHELD"
                ? 409
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
  const match = /^\/runs\/([^/]+)\/(moves|rewind|fork|graph|compare|events|evidence|authored-feedback|pgn|grants|lease|reveal)$/.exec(
    pathname,
  );
  if (!match) return undefined;
  try {
    return { runId: decodeURIComponent(match[1]!), action: match[2]! };
  } catch {
    throw invalid("Run id contains invalid URL encoding");
  }
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
        return new Response(JSON.stringify(projectPackDocument(pack.document)), {
          status: 200,
          headers: {
            "cache-control": "no-store",
            "content-type": "application/json",
            "x-pack-digest": pack.digest,
          },
        });
      }
      if (request.method === "POST" && url.pathname === "/runs") {
        const principal = authenticate();
        const run = await service.create(
          parseCreateInput(await parseBody(request)),
          { writerId: writerId(request), learnerId: principal.learnerId },
        );
        return json(201, { run });
      }
      if (request.method === "GET" && url.pathname === "/runs") {
        const principal = authenticate();
        const { limit, offset } = parsePagination(url);
        return json(200, { runs: service.runs(principal, limit, offset) });
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
        const selection = await selector.select(
          parseSelectMoveRequest(await parseBody(request)),
        );
        return json(200, selection);
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
      if (request.method !== "POST") {
        return json(405, {
          error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
        });
      }

      const value = await parseBody(request);
      if (route.action === "lease") {
        requireJson(request);
        service.claimLease(route.runId, principal, writerId(request));
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
        return json(200, {
          comparison: service.compare(
            route.runId,
            principal,
            requiredString(value.branchAId, "branchAId"),
            requiredString(value.branchBId, "branchBId"),
          ),
        });
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
