import type {
  DrillPackDefinition,
  PackPhase,
} from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
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
  readonly phase: PackPhase | null;
  readonly difficulty: unknown;
  readonly reviewStatus: string;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
}

export interface PackDocument {
  readonly document: DrillPackDefinition;
  readonly digest: string;
}

export interface ShapeSummary {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly phases: ShapeEntryDefinition["phases"];
  readonly licence: string;
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
}

export type ShapeEntryView = ShapeEntryDefinition & {
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
};

export interface ShapeDocument {
  readonly document: ShapeEntryView;
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
  readonly withheld?: true;
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

export type RevealAttribution =
  | {
      readonly kind: "checkpoint";
      readonly checkpointId: string;
      readonly eventSeq: number;
    }
  | { readonly kind: "outcome"; readonly eventSeq: number };

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
      readonly shapePlan?: { readonly shape: string; readonly plan: string };
    }
  | {
      readonly kind: "theory_verdict";
      readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly nodeId: string; readonly ply: number; readonly moveUci: string };
      readonly verdict: "on_line" | "classified_deviation" | "unknown";
      readonly spineNodeId?: string;
      readonly deviationClass?: string;
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
]);

export type SessionKind = "stream" | "academy" | "match";
export type BoardControl = "free_claim" | "host_directed" | "rotation";
export interface LiveSession {
  readonly id: string; readonly runId: string; readonly kind: SessionKind;
  readonly title: string; readonly boardControl: BoardControl; readonly scheduledFor?: string;
  readonly voteAdapterLearnerId?: string; readonly rotation?: readonly string[];
  readonly handoffLearnerId?: string; readonly rotationCursor: number;
  readonly createdBy: string; readonly createdAt: string; readonly closedAt?: string;
}
export interface SessionProposal { readonly id:string;readonly sessionId:string;readonly nodeId:string;readonly moveUci:string;readonly proposedBy:string;readonly at:string;readonly status:"open"|"applied"|"declined"|"stale";readonly resolvedRunSeq:number|null }
export interface VoteOption { readonly moveUci:string;readonly label:string }
export interface VoteTally { readonly window:{readonly id:string;readonly sessionId:string;readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly opensAt:string;readonly closesAt:string;readonly state:"open"|"closed"|"stale";readonly appliedOptionUci:string|null};readonly tally:readonly (VoteOption&{readonly count:number})[];readonly total:number }
export interface SessionJournalEntry { readonly sessionId:string;readonly seq:number;readonly at:string;readonly kind:string;readonly actorLearnerId:string|null;readonly runSeq:number|null;readonly payload:Readonly<Record<string,unknown>> }
export interface SessionInvitation { readonly id:string;readonly sessionId:string;readonly leg:1|2|null;readonly invitedHandle:string|null;readonly invitedRole:RunRole;readonly externalChallengeUrl:string|null;readonly state:"open"|"accepted"|"revoked";readonly createdAt:string }
export interface ArenaLeg { readonly sessionId:string;readonly leg:1|2;readonly referencePlayerHandle:string|null;readonly externalChallengeUrl:string|null;readonly pgn:string|null;readonly result:"1-0"|"0-1"|"1/2-1/2"|"*"|null;readonly branchId:string|null;readonly importedAt:string|null }
export interface LiveSessionDetail { readonly session:LiveSession;readonly role:RunRole;readonly activeNodeId:string;readonly leaseHeldBy:LeaseIdentity;readonly grants:readonly RunGrant[];readonly proposals:readonly SessionProposal[];readonly vote?:VoteTally;readonly invitations:readonly SessionInvitation[];readonly legs:readonly ArenaLeg[] }

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
    readonly llm: "none" | "external";
  };
  readonly surfaces: Readonly<Record<SurfaceId, SurfaceAvailability>>;
}

export interface HumanSplitPage {
  readonly nodeId: string;
  readonly engine: OpponentSelection["engine"];
  readonly targetElo: number | null;
  readonly candidates: readonly NonNullable<OpponentSelection["candidates"]>[number][];
}

export interface VoicePage { readonly text: string; readonly source: "provider" | "deterministic"; readonly scope: "marker" | "reading" | "steering"; }

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
  readonly intent?: {
    readonly origin: "fresh" | "duplicate";
    readonly scheduleId?: string;
    readonly derivedFromRunId?: string;
  };
}

export interface ProgressAttempt {
  readonly runId: string;
  readonly branchId: string;
  readonly packId: string | null;
  readonly branchLabel: string;
  readonly attemptNo: number;
  readonly countable: boolean;
  readonly graded: boolean;
  readonly verdict: "stable" | "unstable" | "open";
  readonly result: "win" | "loss" | "draw" | null;
  readonly userPlyCount: number;
  readonly origin: "fresh" | "duplicate" | "scheduled" | "in_run_retry";
  readonly endedAt: string;
}

export interface ProgressSchedule {
  readonly id: string;
  readonly sessionKind: "pack" | "position";
  readonly packId: string | null;
  readonly kind: "blocked" | "varied";
  readonly variant: string | null;
  readonly dueAt: string;
  readonly sourceRunId: string | null;
}

export interface PackDraft {
  readonly id: string;
  readonly packId: string;
  readonly document: unknown;
  readonly digest: string;
  readonly state: "draft" | "registered" | "withdrawn";
  readonly validation: { readonly valid: boolean; readonly issues: readonly { readonly code: string; readonly path: string; readonly message: string }[] };
}

export interface ShapeDraft {
  readonly id: string;
  readonly shapeId: string;
  readonly document: unknown;
  readonly digest: string;
  readonly state: "draft" | "registered" | "withdrawn";
  readonly validation: { readonly valid: boolean; readonly issues: readonly { readonly code: string; readonly path: string; readonly message: string }[]; readonly probeMatches?: boolean };
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
  };
  readonly seed: number;
  readonly packId?: string;
}

export interface PredictionRequest extends SelectMoveRequest {
  readonly checkpointId: string;
  readonly nodeId: string;
  readonly predictedUci: string;
  readonly at?: string;
}

export interface PredictionResult extends MutationResult {
  readonly selection: OpponentSelection;
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
  prediction(runId: string, input: PredictionRequest, writerId: string): Promise<PredictionResult>;
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
  shapes(): Promise<readonly ShapeSummary[]>;
  shape(shapeId: string): Promise<ShapeDocument>;
  runs(limit?: number, offset?: number): Promise<readonly RunSummary[]>;
  selectMove(input: SelectMoveRequest): Promise<OpponentSelection>;
  graph(runId: string, writerId?: string): Promise<RunGraph>;
  claimLease?(runId: string, writerId: string): Promise<void>;
  grants?(runId: string): Promise<readonly RunGrant[]>;
  updateGrants?(runId: string, operation: GrantOperation, writerId: string): Promise<readonly RunGrant[]>;
  compare(
    runId: string,
    branchIds: readonly string[],
  ): Promise<BranchComparison>;
  authoredFeedback(runId: string): Promise<AuthoredFeedbackPage>;
  humanSplit(runId: string, nodeId: string): Promise<HumanSplitPage>;
  voice(runId: string, nodeId: string, scope: VoicePage["scope"]): Promise<VoicePage>;
  pgn(runId: string, branchIds?: readonly string[]): Promise<PgnDownload>;
  progress?(): Promise<readonly ProgressAttempt[]>;
  dueProgress?(): Promise<readonly ProgressSchedule[]>;
  dismissSchedule?(scheduleId: string): Promise<void>;
  duplicateRun?(runId: string, input: { readonly id: string; readonly seed: number; readonly scheduleId?: string }, writerId: string): Promise<DrillRun>;
  packDrafts?(): Promise<readonly PackDraft[]>;
  createPackDraft?(document: unknown): Promise<PackDraft>;
  updatePackDraft?(draftId: string, digest: string, document: unknown): Promise<PackDraft>;
  registerPackDraft?(draftId: string): Promise<PackSummary>;
  shapeDrafts?(): Promise<readonly ShapeDraft[]>;
  createShapeDraft?(document: unknown): Promise<ShapeDraft>;
  updateShapeDraft?(draftId: string, digest: string, document: unknown): Promise<ShapeDraft>;
  lintShapeDraft?(draftId: string, document: unknown, probeFen?: string): Promise<ShapeDraft["validation"]>;
  registerShapeDraft?(draftId: string): Promise<ShapeSummary>;
  liveSessions?(): Promise<readonly LiveSession[]>;
  liveSession?(sessionId:string):Promise<LiveSessionDetail>;
  createLiveSession?(input:{readonly runId:string;readonly kind:SessionKind;readonly title:string;readonly boardControl?:BoardControl}):Promise<LiveSession>;
  sessionJournal?(sessionId:string,sinceSeq?:number):Promise<{readonly entries:readonly SessionJournalEntry[];readonly nextSeq:number}>;
  sessionProposals?(sessionId:string):Promise<readonly SessionProposal[]>;
  proposeMove?(sessionId:string,nodeId:string,moveUci:string):Promise<SessionProposal>;
  resolveProposal?(sessionId:string,proposalId:string,op:"apply"|"decline",writerId:string):Promise<SessionProposal>;
  boardControl?(sessionId:string,writerId:string,op:"offer"|"withdraw"|"advance"|"reclaim",handle?:string):Promise<LiveSession>;
  openVote?(sessionId:string,input:{readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly durationSeconds:number}):Promise<VoteTally>;
  castVote?(sessionId:string,windowId:string,choiceUci:string,voterKey?:string):Promise<VoteTally>;
  inviteToSession?(sessionId:string,input:{readonly leg?:1|2;readonly handle?:string;readonly externalChallengeUrl?:string}):Promise<SessionInvitation>;
  importArenaLeg?(sessionId:string,leg:1|2,pgn:string,writerId:string,result?:ArenaLeg["result"]):Promise<ArenaLeg>;
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
    const side = (document as { readonly start?: { readonly side?: unknown } }).start?.side;
    if (side !== "white" && side !== "black") {
      throw new ApiError(502, "INVALID_RESPONSE", `Pack ${packId} did not declare start.side`);
    }
    return Object.freeze({ document, digest });
  }

  async shapes(): Promise<readonly ShapeSummary[]> {
    const body = await this.#json<{ readonly shapes: readonly ShapeSummary[] }>("/shapes");
    return body.shapes;
  }

  async shape(shapeId: string): Promise<ShapeDocument> {
    const response = await this.#response(`/shapes/${encoded(shapeId)}`);
    const document = (await response.json()) as ShapeEntryView;
    const digest = response.headers.get("x-shape-digest");
    if (digest === null || digest === "") {
      throw new ApiError(502, "INVALID_RESPONSE", "Shape response omitted its digest");
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

  async progress(): Promise<readonly ProgressAttempt[]> {
    const body = await this.#json<{ readonly attempts: readonly ProgressAttempt[] }>("/progress");
    return body.attempts;
  }

  async dueProgress(): Promise<readonly ProgressSchedule[]> {
    const body = await this.#json<{ readonly schedules: readonly ProgressSchedule[] }>("/progress/due");
    return body.schedules;
  }

  async dismissSchedule(scheduleId: string): Promise<void> {
    await this.#json(`/progress/schedules/${encoded(scheduleId)}`, {
      method: "POST",
      body: { op: "dismiss" },
    });
  }

  async duplicateRun(
    runId: string,
    input: { readonly id: string; readonly seed: number; readonly scheduleId?: string },
    writerId: string,
  ): Promise<DrillRun> {
    const body = await this.#json<{ readonly run: DrillRun }>(`/runs/${encoded(runId)}/duplicate`, {
      method: "POST",
      writerId,
      body: input,
    });
    return body.run;
  }

  async packDrafts(): Promise<readonly PackDraft[]> {
    const body = await this.#json<{ readonly drafts: readonly PackDraft[] }>("/packs/drafts");
    return body.drafts;
  }

  async createPackDraft(document: unknown): Promise<PackDraft> {
    const body = await this.#json<{ readonly draft: PackDraft }>("/packs/drafts", {
      method: "POST", body: { document },
    });
    return body.draft;
  }

  async updatePackDraft(draftId: string, digest: string, document: unknown): Promise<PackDraft> {
    const response = await this.#response(`/packs/drafts/${encoded(draftId)}`, {
      method: "PUT",
      headers: { "if-match": digest },
      body: { document },
    });
    return (await response.json() as { readonly draft: PackDraft }).draft;
  }

  async registerPackDraft(draftId: string): Promise<PackSummary> {
    const body = await this.#json<{ readonly pack: { readonly summary: PackSummary } }>(`/packs/drafts/${encoded(draftId)}/register`, {
      method: "POST", body: {},
    });
    return body.pack.summary;
  }

  async shapeDrafts(): Promise<readonly ShapeDraft[]> {
    const body = await this.#json<{ readonly drafts: readonly ShapeDraft[] }>("/shapes/drafts");
    return body.drafts;
  }

  async createShapeDraft(document: unknown): Promise<ShapeDraft> {
    const body = await this.#json<{ readonly draft: ShapeDraft }>("/shapes/drafts", { method: "POST", body: { document } });
    return body.draft;
  }

  async updateShapeDraft(draftId: string, digest: string, document: unknown): Promise<ShapeDraft> {
    const response = await this.#response(`/shapes/drafts/${encoded(draftId)}`, { method: "PUT", headers: { "if-match": digest }, body: { document } });
    return ((await response.json()) as { readonly draft: ShapeDraft }).draft;
  }

  lintShapeDraft(draftId: string, document: unknown, probeFen?: string): Promise<ShapeDraft["validation"]> {
    return this.#json(`/shapes/drafts/${encoded(draftId)}/lint`, { method: "POST", body: { document, ...(probeFen === undefined || probeFen === "" ? {} : { probeFen }) } });
  }

  async registerShapeDraft(draftId: string): Promise<ShapeSummary> {
    const body = await this.#json<{ readonly shape: { readonly summary: ShapeSummary } }>(`/shapes/drafts/${encoded(draftId)}/register`, { method: "POST", body: {} });
    return body.shape.summary;
  }

  async liveSessions():Promise<readonly LiveSession[]>{const body=await this.#json<{sessions:readonly LiveSession[]}>("/sessions");return body.sessions;}
  liveSession(sessionId:string):Promise<LiveSessionDetail>{return this.#json(`/sessions/${encoded(sessionId)}`);}
  async createLiveSession(input:{readonly runId:string;readonly kind:SessionKind;readonly title:string;readonly boardControl?:BoardControl}):Promise<LiveSession>{const body=await this.#json<{session:LiveSession}>("/sessions",{method:"POST",body:input});return body.session;}
  sessionJournal(sessionId:string,sinceSeq=0):Promise<{readonly entries:readonly SessionJournalEntry[];readonly nextSeq:number}>{return this.#json(`/sessions/${encoded(sessionId)}/journal?sinceSeq=${sinceSeq}`);}
  async sessionProposals(sessionId:string):Promise<readonly SessionProposal[]>{const body=await this.#json<{proposals:readonly SessionProposal[]}>(`/sessions/${encoded(sessionId)}/proposals`);return body.proposals;}
  async proposeMove(sessionId:string,nodeId:string,moveUci:string):Promise<SessionProposal>{const body=await this.#json<{proposal:SessionProposal}>(`/sessions/${encoded(sessionId)}/proposals`,{method:"POST",body:{nodeId,moveUci}});return body.proposal;}
  async resolveProposal(sessionId:string,proposalId:string,op:"apply"|"decline",writerId:string):Promise<SessionProposal>{const body=await this.#json<{proposal:SessionProposal}>(`/sessions/${encoded(sessionId)}/proposals/${encoded(proposalId)}`,{method:"POST",writerId,body:{op}});return body.proposal;}
  async boardControl(sessionId:string,writerId:string,op:"offer"|"withdraw"|"advance"|"reclaim",handle?:string):Promise<LiveSession>{const body=await this.#json<{session:LiveSession}>(`/sessions/${encoded(sessionId)}/board`,{method:"POST",writerId,body:{op,...(handle===undefined?{}:{handle})}});return body.session;}
  openVote(sessionId:string,input:{readonly nodeId:string;readonly prompt:string;readonly options:readonly VoteOption[];readonly durationSeconds:number}):Promise<VoteTally>{return this.#json(`/sessions/${encoded(sessionId)}/votes`,{method:"POST",body:{op:"open",...input}});}
  castVote(sessionId:string,windowId:string,choiceUci:string,voterKey?:string):Promise<VoteTally>{return this.#json(`/sessions/${encoded(sessionId)}/votes`,{method:"POST",body:{op:"cast",windowId,choiceUci,...(voterKey===undefined?{}:{voterKey})}});}
  async inviteToSession(sessionId:string,input:{readonly leg?:1|2;readonly handle?:string;readonly externalChallengeUrl?:string}):Promise<SessionInvitation>{const body=await this.#json<{invitation:SessionInvitation}>(`/sessions/${encoded(sessionId)}/invitations`,{method:"POST",body:input});return body.invitation;}
  async importArenaLeg(sessionId:string,leg:1|2,pgn:string,writerId:string,result?:ArenaLeg["result"]):Promise<ArenaLeg>{const query=result===undefined||result===null?"":`?${new URLSearchParams({result})}`;const response=await this.#response(`/sessions/${encoded(sessionId)}/legs/${leg}/pgn${query}`,{method:"POST",writerId,rawBody:pgn,headers:{"content-type":"text/x-chess-pgn"}});return ((await response.json()) as {leg:ArenaLeg}).leg;}

  selectMove(input: SelectMoveRequest): Promise<OpponentSelection> {
    return this.#json("/select-move", { method: "POST", body: input });
  }

  humanSplit(runId: string, nodeId: string): Promise<HumanSplitPage> {
    return this.#json(`/runs/${encoded(runId)}/human-split?nodeId=${encoded(nodeId)}`);
  }

  voice(runId: string, nodeId: string, scope: VoicePage["scope"]): Promise<VoicePage> {
    return this.#json(`/runs/${encoded(runId)}/voice`, { method: "POST", body: { nodeId, scope } });
  }

  prediction(runId: string, input: PredictionRequest, writerId: string): Promise<PredictionResult> {
    return this.#json(`/runs/${encoded(runId)}/prediction`, { method: "POST", writerId, body: input });
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
    branchIds: readonly string[],
  ): Promise<BranchComparison> {
    const body = await this.#json<{ readonly comparison: BranchComparison }>(
      `/runs/${encoded(runId)}/compare`,
      { method: "POST", body: { branchIds } },
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
      readonly method?: "GET" | "POST" | "PUT";
      readonly writerId?: string;
      readonly body?: unknown;
      readonly rawBody?: string;
      readonly headers?: Readonly<Record<string, string>>;
    } = {},
  ): Promise<Response> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.writerId === undefined
          ? {}
          : { "x-writer-id": options.writerId }),
        ...(options.body === undefined || options.rawBody !== undefined ? {} : { "content-type": "application/json" }),
        ...options.headers,
      },
      ...(options.rawBody !== undefined
        ? { body: options.rawBody }
        : options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
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
