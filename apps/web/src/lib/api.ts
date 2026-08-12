import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import type {
  BranchComparison,
  DrillRun,
  DrillRunEvent,
  EvidenceKind,
  EvidencePayload,
  MutationResult,
  Node,
  ObjectiveEvidenceProposal,
  ObjectiveState,
  OpponentSelection,
  PolicyConfig,
} from "@chess-tabiya/runtime";

export interface PackSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly title: string;
  readonly mode: string;
  readonly difficulty: unknown;
  readonly reviewStatus: string;
}

export interface PackDocument {
  readonly document: DrillPackDefinition;
  readonly digest: string;
}

export interface RunGraph {
  readonly id: string;
  readonly viewer: {
    readonly role: RunRole;
    readonly mayWrite: boolean;
    readonly holdsLease: boolean;
    readonly leaseHeldBy: LeaseIdentity;
  };
  readonly nodes: readonly Node[];
  readonly branches: DrillRun["branches"];
  readonly activeCursor: DrillRun["activeCursor"];
}

export interface RunSummary {
  readonly id: string;
  readonly title: string;
  readonly sessionKind: "pack" | "position";
  readonly packId: string | null;
  readonly sessionDigest: string;
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
  readonly viewerRole: RunRole;
  readonly leaseHeldBy: LeaseIdentity;
}

export type RunRole = "host" | "participant" | "spectator";

export interface LeaseIdentity {
  readonly learnerId: string;
  readonly handle: string;
}

export interface Learner {
  readonly id: string;
  readonly handle: string;
  readonly displayName?: string;
  readonly createdAt: string;
}

export interface RunGrant extends LeaseIdentity {
  readonly role: RunRole;
  readonly grantedAt: string;
}

export type GrantOperation =
  | { readonly op: "grant"; readonly handle: string; readonly role: RunRole }
  | { readonly op: "revoke"; readonly handle: string };

export interface EventsPage {
  readonly events: readonly DrillRunEvent[];
  readonly nextSeq: number;
}

export interface StagedEvidence {
  readonly seq: number;
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly evidenceRefs: readonly [string, ...string[]];
  readonly payload: EvidencePayload;
  readonly objectiveProposal?: ObjectiveEvidenceProposal;
}

export interface EvidencePage {
  readonly results: readonly StagedEvidence[];
  readonly nextSeq: number;
}

export interface RevealAttribution {
  readonly checkpointId: string;
  readonly eventSeq: number;
}

export type AuthoredFeedbackItem =
  | {
      readonly kind: "annotation";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string };
      readonly text: string;
    }
  | {
      readonly kind: "deviation";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string; readonly moveUci: string };
      readonly note: string;
      readonly deviationClass?: string;
      readonly offObjective?: boolean;
    }
  | {
      readonly kind: "plan_class";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly checkpointId: string };
      readonly label: string;
      readonly description?: string;
    };

export interface AuthoredFeedbackPage {
  readonly items: readonly AuthoredFeedbackItem[];
  readonly hasWithheldAuthoredContent: boolean;
}

export interface EngineCapability {
  readonly id: string;
  readonly kind: "opponent" | "judge";
  readonly name: string;
  readonly version: string;
  readonly modelId?: string;
  readonly containerDigest?: string;
  readonly seedHonored: boolean;
}

export type SurfaceId =
  | "play"
  | "review"
  | "learn"
  | "live"
  | "create"
  | "justPlay"
  | "fromPosition";

export type SurfaceAvailability = "available" | "unavailable-here";

/** Roadmap state is build-owned and deliberately never sent by the server. */
export const PLANNED_SURFACES: readonly SurfaceId[] = Object.freeze([
  "learn",
  "live",
  "create",
  "justPlay",
  "fromPosition",
]);

export interface Capabilities {
  readonly engines: readonly EngineCapability[];
  readonly policyModes: readonly (
    | "human_common"
    | "strong_engine"
    | "theory_strict"
  )[];
  readonly runSchemaVersion: string;
  readonly policyProfiles: {
    readonly strong_engine: {
      readonly movetimeMs: number;
      readonly threads: number;
      readonly hashMb: number;
      readonly multiPv: number;
    };
  };
  readonly providers: {
    readonly opponent: "maia" | "mock" | "none";
    readonly judge: "stockfish" | "mock" | "none";
    readonly llm: "none";
  };
  readonly surfaces: Readonly<Record<SurfaceId, SurfaceAvailability>>;
}

export interface CreateRunRequest {
  readonly id: string;
  readonly session:
    | { readonly kind: "pack"; readonly packId: string; readonly packDigest?: string }
    | {
        readonly kind: "position";
        readonly start: { readonly fen: string; readonly side: "white" | "black" };
        readonly feedbackPolicy: "attempt_end";
        readonly opponentPolicy: {
          readonly mode: "human_common" | "strong_engine";
          readonly targetElo?: number;
          readonly temperature?: number;
          readonly topP?: number;
        };
      };
  readonly policyConfig: PolicyConfig;
  readonly seed: number;
  readonly createdAt?: string;
}

export interface SelectMoveRequest {
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly policy: {
    readonly mode: string;
    readonly policyConfigDigest: string;
    readonly targetElo?: number;
    readonly temperature?: number;
    readonly topP?: number;
    readonly spine?: DrillPackDefinition["spine"];
  };
  readonly seed: number;
}

export interface MoveOptions {
  readonly at?: string;
  readonly clockState?: Readonly<Record<string, unknown>>;
}

export interface PlayerMoveRequest extends MoveOptions {
  readonly uci: string;
  readonly actor?: "user" | "system";
}

export type RewindRequest =
  | {
      readonly nodeId: string;
      readonly checkpointId?: never;
      readonly at?: string;
    }
  | {
      readonly checkpointId: string;
      readonly nodeId?: never;
      readonly at?: string;
    };

export interface ForkRequest {
  readonly nodeId: string;
  readonly label?: string;
  readonly intent?: string;
  readonly at?: string;
}

export interface PgnDownload {
  readonly filename: string;
  readonly text: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

interface ErrorEnvelope {
  readonly error?: {
    readonly code?: unknown;
    readonly message?: unknown;
    readonly [key: string]: unknown;
  };
}

export interface RunApi {
  createRun(input: CreateRunRequest, writerId: string): Promise<DrillRun>;
  move(
    runId: string,
    input: PlayerMoveRequest,
    writerId: string,
  ): Promise<MutationResult>;
  appendOpponentPly(
    runId: string,
    selection: OpponentSelection,
    writerId: string,
    options?: MoveOptions,
  ): Promise<MutationResult>;
  rewind(
    runId: string,
    input: RewindRequest,
    writerId: string,
  ): Promise<MutationResult>;
  fork(
    runId: string,
    input: ForkRequest,
    writerId: string,
  ): Promise<MutationResult>;
  events(runId: string, sinceSeq?: number): Promise<EventsPage>;
  evidence(runId: string, sinceSeq?: number): Promise<EvidencePage>;
  applyEvidence(
    runId: string,
    resultSeq: number,
    writerId: string,
    at?: string,
  ): Promise<MutationResult>;
  reveal(runId: string, writerId: string, at?: string): Promise<MutationResult>;
}

export interface DrillClientApi extends RunApi {
  session?(): Promise<Learner>;
  register?(handle: string, password: string, displayName?: string): Promise<Learner>;
  login?(handle: string, password: string): Promise<Learner>;
  logout?(): Promise<void>;
  deleteAccount?(password: string): Promise<void>;
  capabilities(): Promise<Capabilities>;
  packs(): Promise<readonly PackSummary[]>;
  pack(packId: string): Promise<PackDocument>;
  runs(limit?: number, offset?: number): Promise<readonly RunSummary[]>;
  selectMove(input: SelectMoveRequest): Promise<OpponentSelection>;
  graph(runId: string, writerId?: string): Promise<RunGraph>;
  claimLease?(runId: string, writerId: string): Promise<void>;
  grants?(runId: string): Promise<readonly RunGrant[]>;
  updateGrants?(runId: string, operation: GrantOperation, writerId: string): Promise<readonly RunGrant[]>;
  compare(
    runId: string,
    branchAId: string,
    branchBId: string,
  ): Promise<BranchComparison>;
  authoredFeedback(runId: string): Promise<AuthoredFeedbackPage>;
  pgn(runId: string, branchIds?: readonly string[]): Promise<PgnDownload>;
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function browserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}

function encoded(value: string): string {
  return encodeURIComponent(value);
}

function attachmentFilename(header: string | null, fallback: string): string {
  if (header === null) return fallback;
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? fallback;
}

export class DrillApi implements DrillClientApi {
  readonly #baseUrl: string;
  readonly #fetch: Fetcher;

  constructor(baseUrl = "", fetcher: Fetcher = browserFetch) {
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#fetch = fetcher;
  }

  async session(): Promise<Learner> {
    const body = await this.#json<{ readonly learner: Learner }>("/auth/session");
    return body.learner;
  }

  async register(handle: string, password: string, displayName?: string): Promise<Learner> {
    const body = await this.#json<{ readonly learner: Learner }>("/auth/register", {
      method: "POST",
      body: { handle, password, ...(displayName === undefined ? {} : { displayName }) },
    });
    return body.learner;
  }

  async login(handle: string, password: string): Promise<Learner> {
    const body = await this.#json<{ readonly learner: Learner }>("/auth/login", {
      method: "POST",
      body: { handle, password },
    });
    return body.learner;
  }

  async logout(): Promise<void> {
    await this.#json("/auth/logout", { method: "POST", body: {} });
  }

  async deleteAccount(password: string): Promise<void> {
    await this.#json("/auth/delete", { method: "POST", body: { password } });
  }

  capabilities(): Promise<Capabilities> {
    return this.#json("/capabilities");
  }

  packs(): Promise<readonly PackSummary[]> {
    return this.#json("/packs");
  }

  async pack(packId: string): Promise<PackDocument> {
    const response = await this.#response(`/packs/${encoded(packId)}`);
    const document = (await response.json()) as DrillPackDefinition;
    const digest = response.headers.get("x-pack-digest");
    if (digest === null || digest === "") {
      throw new ApiError(502, "INVALID_RESPONSE", "Pack response omitted its digest");
    }
    return Object.freeze({ document, digest });
  }

  async createRun(input: CreateRunRequest, writerId: string): Promise<DrillRun> {
    const body = await this.#json<{ readonly run: DrillRun }>("/runs", {
      method: "POST",
      writerId,
      body: input,
    });
    return body.run;
  }

  async runs(limit = 50, offset = 0): Promise<readonly RunSummary[]> {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const body = await this.#json<{ readonly runs: readonly RunSummary[] }>(
      `/runs?${query}`,
    );
    return body.runs;
  }

  selectMove(input: SelectMoveRequest): Promise<OpponentSelection> {
    return this.#json("/select-move", { method: "POST", body: input });
  }

  move(
    runId: string,
    input: PlayerMoveRequest,
    writerId: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/moves`, {
      method: "POST",
      writerId,
      body: input,
    });
  }

  appendOpponentPly(
    runId: string,
    selection: OpponentSelection,
    writerId: string,
    options: MoveOptions = {},
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/moves`, {
      method: "POST",
      writerId,
      body: { selection, ...options },
    });
  }

  rewind(
    runId: string,
    input: RewindRequest,
    writerId: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/rewind`, {
      method: "POST",
      writerId,
      body: input,
    });
  }

  fork(
    runId: string,
    input: ForkRequest,
    writerId: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/fork`, {
      method: "POST",
      writerId,
      body: input,
    });
  }

  async graph(runId: string, writerId?: string): Promise<RunGraph> {
    const body = await this.#json<{ readonly graph: RunGraph }>(
      `/runs/${encoded(runId)}/graph`,
      writerId === undefined ? {} : { writerId },
    );
    return body.graph;
  }

  async claimLease(runId: string, writerId: string): Promise<void> {
    await this.#json(`/runs/${encoded(runId)}/lease`, {
      method: "POST",
      writerId,
      body: {},
    });
  }

  async grants(runId: string): Promise<readonly RunGrant[]> {
    const body = await this.#json<{ readonly grants: readonly RunGrant[] }>(
      `/runs/${encoded(runId)}/grants`,
    );
    return body.grants;
  }

  async updateGrants(runId: string, operation: GrantOperation, writerId: string): Promise<readonly RunGrant[]> {
    const body = await this.#json<{ readonly grants: readonly RunGrant[] }>(
      `/runs/${encoded(runId)}/grants`,
      { method: "POST", writerId, body: operation },
    );
    return body.grants;
  }

  async compare(
    runId: string,
    branchAId: string,
    branchBId: string,
  ): Promise<BranchComparison> {
    const body = await this.#json<{ readonly comparison: BranchComparison }>(
      `/runs/${encoded(runId)}/compare`,
      { method: "POST", body: { branchAId, branchBId } },
    );
    return body.comparison;
  }

  events(runId: string, sinceSeq = 0): Promise<EventsPage> {
    return this.#json(`/runs/${encoded(runId)}/events?sinceSeq=${sinceSeq}`);
  }

  evidence(runId: string, sinceSeq = 0): Promise<EvidencePage> {
    return this.#json(`/runs/${encoded(runId)}/evidence?sinceSeq=${sinceSeq}`);
  }

  authoredFeedback(runId: string): Promise<AuthoredFeedbackPage> {
    return this.#json(`/runs/${encoded(runId)}/authored-feedback`);
  }

  applyEvidence(
    runId: string,
    resultSeq: number,
    writerId: string,
    at?: string,
  ): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/evidence`, {
      method: "POST",
      writerId,
      body: { resultSeq, ...(at === undefined ? {} : { at }) },
    });
  }

  reveal(runId: string, writerId: string, at?: string): Promise<MutationResult> {
    return this.#json(`/runs/${encoded(runId)}/reveal`, {
      method: "POST",
      writerId,
      body: { ...(at === undefined ? {} : { at }) },
    });
  }

  async pgn(runId: string, branchIds?: readonly string[]): Promise<PgnDownload> {
    const query =
      branchIds === undefined
        ? ""
        : `?${new URLSearchParams({ branches: branchIds.join(",") })}`;
    const response = await this.#response(`/runs/${encoded(runId)}/pgn${query}`);
    return Object.freeze({
      filename: attachmentFilename(
        response.headers.get("content-disposition"),
        `${runId}.pgn`,
      ),
      text: await response.text(),
    });
  }

  async #response(
    path: string,
    options: {
      readonly method?: "GET" | "POST";
      readonly writerId?: string;
      readonly body?: unknown;
    } = {},
  ): Promise<Response> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.writerId === undefined
          ? {}
          : { "x-writer-id": options.writerId }),
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      credentials: "same-origin",
    });
    if (response.ok) return response;
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tabiya:unauthenticated"));
    }

    let envelope: ErrorEnvelope = {};
    try {
      envelope = (await response.json()) as ErrorEnvelope;
    } catch {
      // A typed transport error is still returned when a proxy sends non-JSON.
    }
    const error = envelope.error;
    const code = typeof error?.code === "string" ? error.code : "HTTP_ERROR";
    const message =
      typeof error?.message === "string" ? error.message : `HTTP ${response.status}`;
    const { code: _code, message: _message, ...details } = error ?? {};
    throw new ApiError(response.status, code, message, details);
  }

  async #json<T>(
    path: string,
    options: {
      readonly method?: "GET" | "POST";
      readonly writerId?: string;
      readonly body?: unknown;
    } = {},
  ): Promise<T> {
    return (await (await this.#response(path, options)).json()) as T;
  }
}

export function evidenceKindLabel(kind: EvidenceKind): string {
  return kind === "bestline" ? "best line" : kind;
}
