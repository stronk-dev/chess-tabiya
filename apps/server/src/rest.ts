import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import {
  BranchQueryError,
  RuntimeError,
  type CommitMoveOptions,
  type CreateRunInput,
  type PolicyConfig,
  type VersionedPolicy,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import { RunService, type RewindTarget } from "./service.js";

export type RestHandler = (request: Request) => Promise<Response>;

function json(status: number, value: unknown): Response {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" },
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

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalid(`${label} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : requiredString(value, label);
}

function policies(value: unknown, label: string): readonly VersionedPolicy[] {
  if (!Array.isArray(value)) throw invalid(`${label} must be an array`);
  return value.map((entry, index) => {
    const item = record(entry, `${label}[${index}]`);
    return {
      id: requiredString(item.id, `${label}[${index}].id`),
      version: requiredString(item.version, `${label}[${index}].version`),
    };
  });
}

function parsePolicyConfig(value: unknown): PolicyConfig {
  const policy = record(value, "policyConfig");
  if (
    policy.seedMode !== "fixed" &&
    policy.seedMode !== "per_run" &&
    policy.seedMode !== "per_branch"
  ) {
    throw invalid("policyConfig.seedMode is invalid");
  }
  const locus = record(policy.locus, "policyConfig.locus");
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

function parseCreateInput(value: Record<string, unknown>): CreateRunInput {
  if (typeof value.seed !== "number" || !Number.isSafeInteger(value.seed)) {
    throw invalid("seed must be a safe integer");
  }
  return {
    id: requiredString(value.id, "id"),
    packId: requiredString(value.packId, "packId"),
    packDigest: requiredString(value.packDigest, "packDigest"),
    policyConfig: parsePolicyConfig(value.policyConfig),
    startFen: requiredString(value.startFen, "startFen"),
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
      error.code === "ENGINE_UNAVAILABLE"
        ? 503
        : error.code === "POLICY_MODE_UNSUPPORTED"
          ? 422
          : error.code === "INVALID_REQUEST"
            ? 400
            : error.code === "RUN_NOT_FOUND"
              ? 404
              : error.code === "RUN_ALREADY_EXISTS"
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
  const match = /^\/runs\/([^/]+)\/(moves|rewind|fork|graph|compare|events)$/.exec(
    pathname,
  );
  if (!match) return undefined;
  try {
    return { runId: decodeURIComponent(match[1]!), action: match[2]! };
  } catch {
    throw invalid("Run id contains invalid URL encoding");
  }
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

export function createRestHandler(service: RunService): RestHandler {
  return async (request) => {
    try {
      const url = new URL(request.url);
      if (request.method === "POST" && url.pathname === "/runs") {
        const run = service.create(
          parseCreateInput(await parseBody(request)),
          writerId(request),
        );
        return json(201, { run });
      }

      const route = parseRunRoute(url.pathname);
      if (!route) {
        return json(404, {
          error: { code: "NOT_FOUND", message: "Route not found" },
        });
      }
      if (request.method === "GET" && route.action === "graph") {
        return json(200, { graph: service.graph(route.runId) });
      }
      if (request.method === "GET" && route.action === "events") {
        return json(200, service.events(route.runId, parseSinceSeq(url)));
      }
      if (request.method !== "POST") {
        return json(405, {
          error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
        });
      }

      const value = await parseBody(request);
      if (route.action === "moves") {
        return json(
          200,
          service.move(
            route.runId,
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
            requiredString(value.branchAId, "branchAId"),
            requiredString(value.branchBId, "branchBId"),
          ),
        });
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
