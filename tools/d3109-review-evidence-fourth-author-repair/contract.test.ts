import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";

type Side = "white" | "black";
type Family =
  | "engine_eval"
  | "engine_wdl"
  | "tablebase"
  | "semantic"
  | "opening"
  | "human_model"
  | "human_corpus"
  | "authored"
  | "recorded";

const SOURCE_ADAPTERS = Object.freeze([
  { id: "review.eval-point@1", projection: "derived.review.eval_point@1", family: "engine_eval", operation: "deriveReviewEvalPoint", parser: "parseReviewEvalPoint", input: "node" },
  { id: "review.wdl-point@1", projection: "derived.review.wdl_point@1", family: "engine_wdl", operation: "deriveReviewWdlPoint", parser: "parseReviewWdlPoint", input: "node" },
  { id: "review.endgame-reading@1", projection: "rules.endgame.reading@1", family: "tablebase", operation: "readEndgameEvidence", parser: "parseEndgameReading", input: "node" },
  { id: "review.forced-mate@2", projection: "rules.tactic.consequence.forced_mate_after_move@2", family: "semantic", operation: "readForcedMateProof", parser: "parseForcedMateProofV2", input: "edge" },
  { id: "review.opening-identity@1", projection: "theory.opening.current_endpoint@1", family: "opening", operation: "readOpeningIdentity", parser: "parseOpeningIdentity", input: "node" },
  { id: "review.maia-policy@1", projection: "human.maia.policy_page@1", family: "human_model", operation: "readMaiaPolicy", parser: "parseMaiaPolicyPage", input: "node" },
  { id: "review.explorer-page@1", projection: "human.explorer.position_page@1", family: "human_corpus", operation: "readExplorerPage", parser: "parseExplorerPage", input: "node" },
  { id: "review.shape-firing@1", projection: "theory.shapes.firing@1", family: "authored", operation: "readShapeFirings", parser: "parseShapeFirings", input: "node" },
  { id: "review.recorded-edge@1", projection: "run.record.edge@1", family: "recorded", operation: "readRecordedEdge", parser: "parseRecordedEdge", input: "edge" },
] as const);

const families = SOURCE_ADAPTERS.map((row) => row.family) as Family[];
const runAuthority = new WeakSet<object>();
const prefixAuthority = new WeakSet<object>();
const prefixSnapshots = new WeakMap<object, readonly NodeRecord[]>();
const evidenceAuthority = new WeakSet<object>();
const sourceAuthority = new WeakSet<object>();
const packetAuthority = new WeakSet<object>();

interface NodeRecord {
  readonly id: string;
  readonly parentId: string | null;
  readonly ply: number;
  readonly fen: string;
  readonly positionKey: string;
  readonly incomingMove: { readonly uci: string; readonly san: string | null } | null;
}

interface RunRecord {
  readonly id: string;
  readonly start: { readonly side: Side };
  readonly sessionKind: "imported" | "just_play";
  readonly branchTips: Readonly<Record<string, string>>;
  readonly nodes: Readonly<Record<string, NodeRecord>>;
  readonly events: readonly {
    readonly seq: number;
    readonly digest: string;
    readonly kind: "move" | "outcome.reached";
    readonly nodeId: string;
    readonly result?: "1-0" | "0-1" | "1/2-1/2";
  }[];
}

interface ImportedRecord {
  readonly runId: string;
  readonly sourceDigest: string;
  readonly result: "1-0" | "0-1" | "1/2-1/2";
}

function fail(message: string): never {
  throw new TypeError(message);
}

function exactKeys(value: unknown, expected: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label}:object`);
  const actual = Object.keys(value).sort();
  if (canonicalizeJson(actual) !== canonicalizeJson([...expected].sort())) fail(`${label}:keys`);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function digest(domain: string, value: unknown): string {
  return `sha256:${createHash("sha256").update(`tabiya/${domain}\0`).update(canonicalizeJson(value)).digest("hex")}`;
}

function createRunRecord(value: RunRecord): RunRecord {
  const copy = deepFreeze(structuredClone(value));
  runAuthority.add(copy);
  return copy;
}

function recordedSemanticPath(run: RunRecord, branchId: string): readonly NodeRecord[] {
  if (!runAuthority.has(run)) fail("run:authority");
  const tip = run.branchTips[branchId];
  if (tip === undefined) fail("branch:unknown");
  const path: NodeRecord[] = [];
  let cursor: string | null = tip;
  while (cursor !== null) {
    const node: NodeRecord | undefined = run.nodes[cursor];
    if (node === undefined) fail("path:missing-node");
    path.push(node);
    cursor = node.parentId;
  }
  path.reverse();
  return deepFreeze(path.map((node) => structuredClone(node)));
}

function authorizeReviewRecordedPrefix(input: {
  readonly run: RunRecord;
  readonly branchId: string;
  readonly importedRecord: ImportedRecord | null;
}) {
  exactKeys(input, ["run", "branchId", "importedRecord"], "prefix-input");
  const path = recordedSemanticPath(input.run, input.branchId);
  const eventHead = input.run.events.reduce(
    (highest, event) => event.seq > highest.seq ? { seq: event.seq, digest: event.digest } : highest,
    { seq: -1, digest: "" },
  );
  if (eventHead.seq < 0) fail("event-head:empty");
  if (input.importedRecord !== null) {
    if (input.run.sessionKind !== "imported" || input.importedRecord.runId !== input.run.id) fail("import:crossed");
  } else if (input.run.sessionKind === "imported") fail("import:missing");
  const terminal = [...input.run.events].reverse().find((event) => event.kind === "outcome.reached");
  const outcome = terminal?.result !== undefined
    ? { kind: "board_terminal" as const, eventSeq: terminal.seq, nodeId: terminal.nodeId, result: terminal.result }
    : input.importedRecord !== null
      ? { kind: "recorded_result" as const, sourceDigest: input.importedRecord.sourceDigest, result: input.importedRecord.result }
      : { kind: "unfinished" as const };
  const fields = deepFreeze({
    protocol: "review-recorded-prefix@1" as const,
    runId: input.run.id,
    branchId: input.branchId,
    eventHead,
    tipNodeId: path.at(-1)?.id ?? fail("path:empty"),
    pathNodeIds: path.map((node) => node.id),
    prefixDigest: digest("review-prefix-events.v1", input.run.events.filter((event) => event.seq <= eventHead.seq)),
    learnerSide: input.run.start.side,
    outcome,
  });
  const receipt = deepFreeze({ ...fields, subjectDigest: digest("review-prefix-subject.v1", fields) });
  prefixAuthority.add(receipt);
  prefixSnapshots.set(receipt, path);
  return receipt;
}

type ReviewSubject = ReturnType<typeof authorizeReviewRecordedPrefix>;

function compileSourceRegistry(manifestProjectionIds: readonly string[]) {
  if (new Set(manifestProjectionIds).size !== manifestProjectionIds.length) fail("manifest:duplicate");
  const registered = SOURCE_ADAPTERS.map((row) => row.projection);
  if (canonicalizeJson([...registered].sort()) !== canonicalizeJson([...manifestProjectionIds].sort())) {
    fail("manifest:source-registry-mismatch");
  }
  return SOURCE_ADAPTERS;
}

function declareEvidence(adapterId: string, nodeId: string, payload: unknown) {
  const adapter = SOURCE_ADAPTERS.find((row) => row.id === adapterId) ?? fail("adapter:unknown");
  const fields = deepFreeze({
    projection: adapter.projection,
    adapterId,
    nodeId,
    payload: structuredClone(payload),
  });
  const evidence = deepFreeze({ ...fields, evidenceDigest: digest("review-declared-evidence.v1", fields) });
  evidenceAuthority.add(evidence);
  return evidence;
}

type SourceState =
  | { readonly kind: "available"; readonly evidence: ReturnType<typeof declareEvidence> }
  | { readonly kind: "honest_empty"; readonly reason: "no_observation" | "outside_domain" }
  | { readonly kind: "unavailable"; readonly reason: "provider_off" | "provider_failed" };

function createSourceResult(subject: ReviewSubject, adapterId: string, nodeId: string, state: SourceState) {
  if (!prefixAuthority.has(subject)) fail("source:subject-authority");
  const adapter = SOURCE_ADAPTERS.find((row) => row.id === adapterId) ?? fail("source:adapter");
  if (state.kind === "available") {
    if (!evidenceAuthority.has(state.evidence)) fail("source:evidence-authority");
    if (state.evidence.adapterId !== adapterId || state.evidence.nodeId !== nodeId || state.evidence.projection !== adapter.projection) {
      fail("source:evidence-crossed");
    }
  }
  const result = deepFreeze({
    invocationId: `${adapterId}\0${nodeId}`,
    adapterId,
    projection: adapter.projection,
    family: adapter.family,
    nodeId,
    subject,
    state,
  });
  sourceAuthority.add(result);
  return result;
}

function compileReviewEvidence(subject: ReviewSubject, sources: readonly ReturnType<typeof createSourceResult>[]) {
  if (!prefixAuthority.has(subject)) fail("packet:subject-authority");
  const path = prefixSnapshots.get(subject) ?? fail("packet:path-authority");
  const expected = path.flatMap((node) => SOURCE_ADAPTERS.map((adapter) => `${adapter.id}\0${node.id}`)).sort();
  const actual = sources.map((source) => source.invocationId).sort();
  if (new Set(actual).size !== actual.length || canonicalizeJson(actual) !== canonicalizeJson(expected)) fail("packet:source-set");
  for (const source of sources) {
    if (!sourceAuthority.has(source) || source.subject !== subject) fail("packet:source-authority");
  }
  const nodes = path.map((node) => {
    const atNode = sources.filter((source) => source.nodeId === node.id);
    const items = atNode.flatMap((source) => source.state.kind === "available" ? [source.state.evidence] : []);
    const nodeFamilies = Object.fromEntries(families.map((family) => {
      const source = atNode.find((candidate) => candidate.family === family) ?? fail("packet:family");
      return [family, source.state.kind === "available" ? { kind: "available", itemCount: 1 } : source.state];
    }));
    return deepFreeze({
      nodeId: node.id,
      ply: node.ply,
      positionKey: node.positionKey,
      incomingMove: node.incomingMove,
      items,
      links: [],
      families: nodeFamilies,
    });
  });
  const familyFold = Object.fromEntries(families.map((family) => {
    const states = nodes.map((node) => node.families[family] as { kind: string; itemCount?: number; reason?: string });
    const unavailable = states.filter((state) => state.kind === "unavailable");
    return [family, {
      nodeCount: nodes.length,
      availableNodeCount: states.filter((state) => state.kind === "available").length,
      itemCount: states.reduce((sum, state) => sum + (state.itemCount ?? 0), 0),
      honestEmptyNodeCount: states.filter((state) => state.kind === "honest_empty").length,
      notRequestedNodeCount: 0,
      progress: { notYetScheduledNodeCount: 0, pendingNodeCount: 0, pendingJobCount: 0, retryingJobCount: 0 },
      unavailable: unavailable.map((state) => ({ reason: state.reason, nodeCount: 1 })),
    }];
  }));
  const completion = deepFreeze({
    progress: { kind: "settled" as const },
    degradation: Object.values(familyFold).some((value) => value.unavailable.length > 0)
      ? { kind: "degraded" as const, unavailableFamilies: Object.entries(familyFold)
        .filter(([, value]) => value.unavailable.length > 0)
        .map(([family, value]) => ({ family, reasons: value.unavailable })) }
      : { kind: "healthy" as const },
  });
  const fields = deepFreeze({
    subject,
    manifestDigest: digest("review-source-registry.v1", SOURCE_ADAPTERS),
    nodes,
    families: familyFold,
    completion,
  });
  const packet = deepFreeze({ ...fields, packetDigest: digest("review-packet.v1", fields) });
  packetAuthority.add(packet);
  return packet;
}

function renderReviewStoryReceipt(packet: ReturnType<typeof compileReviewEvidence>) {
  if (!packetAuthority.has(packet)) fail("story:packet-authority");
  const title = deepFreeze({ kind: "presentation_receipt" as const, component: "title", evidenceDigest: packet.subject.subjectDigest });
  const moments = packet.nodes.map((node) => deepFreeze({
    nodeId: node.nodeId,
    entryNodeId: node.nodeId,
    ply: node.ply,
    san: node.incomingMove?.san ?? null,
    fen: prefixSnapshots.get(packet.subject)?.find((entry) => entry.id === node.nodeId)?.fen ?? fail("story:path"),
    kinds: node.items.map((item) => item.projection),
    presentation: deepFreeze({ kind: "presentation_receipt" as const, component: "fact_statement", evidenceDigests: node.items.map((item) => item.evidenceDigest) }),
    evaluation: null,
  }));
  const rank = moments.map((moment) => moment.nodeId);
  const fields = deepFreeze({
    protocol: "review-story@1" as const,
    subject: packet.subject,
    manifestDigest: packet.manifestDigest,
    packetDigest: packet.packetDigest,
    progress: packet.completion.progress,
    degradation: packet.completion.degradation,
    families: packet.families,
    title,
    moments,
    rank,
  });
  return deepFreeze({ ...fields, storyDigest: digest("review-story.v1", fields) });
}

type AttemptOutcome =
  | { readonly kind: "retryable_failure"; readonly reason: string }
  | { readonly kind: "non_retryable_failure"; readonly reason: string }
  | { readonly kind: "succeeded_delivery_digest"; readonly deliveryDigest: string }
  | { readonly kind: "cancelled" };

function parseOutcome(value: unknown): AttemptOutcome {
  exactKeys(value, value !== null && typeof value === "object" && "kind" in value && value.kind === "succeeded_delivery_digest"
    ? ["kind", "deliveryDigest"]
    : value !== null && typeof value === "object" && "kind" in value && (value.kind === "retryable_failure" || value.kind === "non_retryable_failure")
      ? ["kind", "reason"]
      : ["kind"], "attempt-outcome");
  if (value.kind === "retryable_failure" || value.kind === "non_retryable_failure") {
    if (typeof value.reason !== "string" || value.reason.length === 0) fail("attempt:reason");
    return deepFreeze({ kind: value.kind, reason: value.reason });
  }
  if (value.kind === "succeeded_delivery_digest") {
    if (typeof value.deliveryDigest !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value.deliveryDigest)) fail("attempt:digest");
    return deepFreeze({ kind: value.kind, deliveryDigest: value.deliveryDigest });
  }
  if (value.kind === "cancelled") return deepFreeze({ kind: "cancelled" });
  fail("attempt:kind");
}

class ReviewAttemptOutcomeStore {
  readonly #entries = new Map<string, { attempts: number; pending?: Promise<AttemptOutcome>; resolve?: (outcome: AttemptOutcome) => void; terminal?: AttemptOutcome }>();
  constructor(readonly maxOutcomes: number, readonly maxAttemptsPerRequest: number) {
    if (!Number.isSafeInteger(maxOutcomes) || maxOutcomes < 1 || !Number.isSafeInteger(maxAttemptsPerRequest) || maxAttemptsPerRequest < 1) fail("attempt:bounds");
  }
  acquire(key: string) {
    const existing = this.#entries.get(key);
    if (existing?.pending !== undefined) return deepFreeze({ kind: "subscriber" as const, completion: existing.pending });
    if (existing?.terminal?.kind === "non_retryable_failure" || existing?.terminal?.kind === "succeeded_delivery_digest") {
      return deepFreeze({ kind: "existing" as const, completion: Promise.resolve(existing.terminal) });
    }
    const attempts = existing?.attempts ?? 0;
    if (attempts >= this.maxAttemptsPerRequest) return deepFreeze({ kind: "retry_exhausted" as const, attempts });
    if (existing === undefined && this.#entries.size >= this.maxOutcomes) return deepFreeze({ kind: "capacity" as const });
    let resolve!: (outcome: AttemptOutcome) => void;
    const completion = new Promise<AttemptOutcome>((done) => { resolve = done; });
    const entry: {
      attempts: number;
      pending?: Promise<AttemptOutcome>;
      resolve?: (outcome: AttemptOutcome) => void;
      terminal?: AttemptOutcome;
    } = { attempts: attempts + 1, pending: completion, resolve };
    this.#entries.set(key, entry);
    const settle = (raw: unknown) => {
      if (this.#entries.get(key) !== entry) fail("attempt:owner");
      const outcome = parseOutcome(raw);
      delete entry.pending;
      delete entry.resolve;
      entry.terminal = outcome;
      resolve(outcome);
    };
    const cancel = () => {
      if (this.#entries.get(key) !== entry) fail("attempt:owner");
      this.#entries.delete(key);
      resolve(deepFreeze({ kind: "cancelled" }));
    };
    return deepFreeze({ kind: "owner" as const, attempt: entry.attempts, completion, settle, cancel });
  }
  releaseSucceeded(key: string, deliveryDigest: string) {
    const entry = this.#entries.get(key);
    if (entry?.terminal?.kind !== "succeeded_delivery_digest" || entry.terminal.deliveryDigest !== deliveryDigest) fail("attempt:release");
    this.#entries.delete(key);
  }
  get size() { return this.#entries.size; }
}

function fixtureRun() {
  return createRunRecord({
    id: "run-1",
    start: { side: "black" },
    sessionKind: "imported",
    branchTips: { main: "n2" },
    nodes: {
      n0: { id: "n0", parentId: null, ply: 0, fen: "start", positionKey: "p0", incomingMove: null },
      n1: { id: "n1", parentId: "n0", ply: 1, fen: "after-e4", positionKey: "p1", incomingMove: { uci: "e2e4", san: "e4" } },
      n2: { id: "n2", parentId: "n1", ply: 2, fen: "after-e5", positionKey: "p2", incomingMove: { uci: "e7e5", san: "e5" } },
    },
    events: [
      { seq: 0, digest: "event-0", kind: "move", nodeId: "n0" },
      { seq: 1, digest: "event-1", kind: "move", nodeId: "n1" },
      { seq: 2, digest: "event-2", kind: "move", nodeId: "n2" },
    ],
  });
}

describe("review evidence fourth author repair", () => {
  it("D3109 derives every prefix field from sealed run/path/import authorities", () => {
    const run = fixtureRun();
    const subject = authorizeReviewRecordedPrefix({ run, branchId: "main", importedRecord: { runId: "run-1", sourceDigest: "source-1", result: "0-1" } });
    expect(subject.pathNodeIds).toEqual(["n0", "n1", "n2"]);
    expect(subject.learnerSide).toBe("black");
    expect(subject.outcome).toEqual({ kind: "recorded_result", sourceDigest: "source-1", result: "0-1" });
    expect(() => authorizeReviewRecordedPrefix({ ...subject } as never)).toThrow(/prefix-input:keys/u);
    expect(() => authorizeReviewRecordedPrefix({ run: structuredClone(run), branchId: "main", importedRecord: null })).toThrow(/run:authority/u);
  });

  it("D3110 requires literal adapter metadata set-equal to manifest Review inputs", () => {
    const ids = SOURCE_ADAPTERS.map((row) => row.projection);
    expect(compileSourceRegistry([...ids].reverse())).toBe(SOURCE_ADAPTERS);
    expect(() => compileSourceRegistry(ids.slice(1))).toThrow(/source-registry-mismatch/u);
    expect(() => compileSourceRegistry([...ids, ids[0]!])).toThrow(/manifest:duplicate/u);
    expect(SOURCE_ADAPTERS.every((row) => !row.id.startsWith("review.engine_") && row.operation.length > 0 && row.parser.length > 0)).toBe(true);
  });

  it("D3111/D3112 retains sealed typed evidence in complete node packets", () => {
    const run = fixtureRun();
    const subject = authorizeReviewRecordedPrefix({ run, branchId: "main", importedRecord: { runId: run.id, sourceDigest: "source-1", result: "0-1" } });
    const sources = prefixSnapshots.get(subject)!.flatMap((node) => SOURCE_ADAPTERS.map((adapter) => createSourceResult(
      subject,
      adapter.id,
      node.id,
      adapter.family === "engine_eval"
        ? { kind: "available", evidence: declareEvidence(adapter.id, node.id, { score: { kind: "centipawns", value: node.ply * 10 } }) }
        : { kind: "honest_empty", reason: "no_observation" },
    )));
    const packet = compileReviewEvidence(subject, sources);
    expect(packet.nodes[1]).toMatchObject({ nodeId: "n1", ply: 1, positionKey: "p1", incomingMove: { uci: "e2e4", san: "e4" } });
    expect(packet.nodes[1]?.items[0]?.projection).toBe("derived.review.eval_point@1");
    expect(packet.nodes[1]?.families.engine_eval).toEqual({ kind: "available", itemCount: 1 });
    const forged = { ...packet.nodes[1]!.items[0]!, payload: { score: null } };
    expect(() => createSourceResult(subject, SOURCE_ADAPTERS[0].id, "n1", { kind: "available", evidence: forged as never })).toThrow(/evidence-authority/u);
  });

  it("D3113 retains completion and emits the complete closed Story image", () => {
    const run = fixtureRun();
    const subject = authorizeReviewRecordedPrefix({ run, branchId: "main", importedRecord: { runId: run.id, sourceDigest: "source-1", result: "0-1" } });
    const sources = prefixSnapshots.get(subject)!.flatMap((node) => SOURCE_ADAPTERS.map((adapter) => createSourceResult(subject, adapter.id, node.id, { kind: "honest_empty", reason: "no_observation" })));
    const packet = compileReviewEvidence(subject, sources);
    const story = renderReviewStoryReceipt(packet);
    expect(Object.keys(story).sort()).toEqual(["degradation", "families", "manifestDigest", "moments", "packetDigest", "progress", "protocol", "rank", "storyDigest", "subject", "title"].sort());
    expect(story.progress).toEqual({ kind: "settled" });
    expect(story.subject).toBe(subject);
    expect(story.moments[2]).toMatchObject({ nodeId: "n2", ply: 2, fen: "after-e5", san: "e5" });
  });

  it("D3114 uses the shared fail-closed canonical serializer for every digest", () => {
    expect(() => digest("review-packet.v1", { value: Number.NaN })).toThrow(/finite/u);
    expect(() => digest("review-packet.v1", { value: "\ud800" })).toThrow(/surrogate/u);
    expect(digest("review-packet.v1", { b: 2, a: 1 })).toBe(digest("review-packet.v1", { a: 1, b: 2 }));
  });

  it("D3115 closes retry, concurrent, cancellation, exhaustion and success release", async () => {
    const store = new ReviewAttemptOutcomeStore(1, 2);
    const first = store.acquire("request") as Extract<ReturnType<ReviewAttemptOutcomeStore["acquire"]>, { kind: "owner" }>;
    const subscriber = store.acquire("request");
    expect(first.kind).toBe("owner");
    expect(subscriber.kind).toBe("subscriber");
    expect(subscriber.kind === "subscriber" && subscriber.completion).toBe(first.completion);
    expect(() => first.settle({ kind: "anything" })).toThrow(/attempt:kind/u);
    first.settle({ kind: "retryable_failure", reason: "timeout" });
    await expect(first.completion).resolves.toEqual({ kind: "retryable_failure", reason: "timeout" });
    const second = store.acquire("request") as Extract<ReturnType<ReviewAttemptOutcomeStore["acquire"]>, { kind: "owner" }>;
    second.settle({ kind: "retryable_failure", reason: "timeout" });
    expect(store.acquire("request")).toEqual({ kind: "retry_exhausted", attempts: 2 });
    const cancelledStore = new ReviewAttemptOutcomeStore(1, 2);
    const cancelled = cancelledStore.acquire("cancel") as Extract<ReturnType<ReviewAttemptOutcomeStore["acquire"]>, { kind: "owner" }>;
    cancelled.cancel();
    await expect(cancelled.completion).resolves.toEqual({ kind: "cancelled" });
    expect(cancelledStore.size).toBe(0);
    const successStore = new ReviewAttemptOutcomeStore(1, 2);
    const success = successStore.acquire("success") as Extract<ReturnType<ReviewAttemptOutcomeStore["acquire"]>, { kind: "owner" }>;
    const deliveryDigest = `sha256:${"a".repeat(64)}`;
    success.settle({ kind: "succeeded_delivery_digest", deliveryDigest });
    successStore.releaseSucceeded("success", deliveryDigest);
    expect(successStore.size).toBe(0);
    expect(() => successStore.releaseSucceeded("success", deliveryDigest)).toThrow(/attempt:release/u);
  });
});
