import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";

type Family = "engine_eval" | "semantic" | "recorded";
type NodeRecord = Readonly<{ id: string; parentId: string | null; ply: number; fen: string; positionKey: string; incomingMove: null | Readonly<{ uci: string; san: string | null }> }>;
type RunEvent = Readonly<{ seq: number; digest: string; kind: "move" | "outcome.reached"; nodeId: string; result?: "1-0" | "0-1" | "1/2-1/2" }>;
type StoredRun = Readonly<{ id: string; side: "white" | "black"; sessionKind: "imported" | "just_play"; branchTips: Readonly<Record<string, string>>; nodes: Readonly<Record<string, NodeRecord>>; events: readonly RunEvent[] }>;
type StoredImport = Readonly<{ runId: string; sourceDigest: string; parsedSourceResult: "1-0" | "0-1" | "1/2-1/2"; result: "1-0" | "0-1" | "1/2-1/2" }>;

const runAuthority = new WeakSet<object>();
const importAuthority = new WeakSet<object>();
const subjectAuthority = new WeakSet<object>();
const evidenceAuthority = new WeakSet<object>();
const resultAuthority = new WeakSet<object>();

function fail(code: string): never { throw new TypeError(code); }
function freeze<T>(value: T): T { if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function exact(value: unknown, keys: readonly string[], code: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${code}:object`);
  if (canonicalizeJson(Object.keys(value).sort()) !== canonicalizeJson([...keys].sort())) fail(`${code}:keys`);
}
function text(value: unknown, code: string): string { if (typeof value !== "string" || value.length === 0) fail(code); return value; }
function sha(domain: string, value: unknown): string { return `sha256:${createHash("sha256").update(`tabiya/${domain}\0`).update(canonicalizeJson(value)).digest("hex")}`; }

function parseNode(value: unknown): NodeRecord {
  exact(value, ["id", "parentId", "ply", "fen", "positionKey", "incomingMove"], "node");
  if (value.parentId !== null && typeof value.parentId !== "string") fail("node:parent");
  if (!Number.isSafeInteger(value.ply) || Number(value.ply) < 0) fail("node:ply");
  let incomingMove: NodeRecord["incomingMove"] = null;
  if (value.incomingMove !== null) {
    exact(value.incomingMove, ["uci", "san"], "move");
    if (value.incomingMove.san !== null && typeof value.incomingMove.san !== "string") fail("move:san");
    incomingMove = freeze({ uci: text(value.incomingMove.uci, "move:uci"), san: value.incomingMove.san as string | null });
  }
  return freeze({ id: text(value.id, "node:id"), parentId: value.parentId as string | null, ply: Number(value.ply), fen: text(value.fen, "node:fen"), positionKey: text(value.positionKey, "node:key"), incomingMove });
}

class StoredReviewAuthority {
  readonly #runs = new Map<string, StoredRun>();
  readonly #imports = new Map<string, StoredImport>();
  constructor(rawRun: unknown, rawImport: unknown | null) {
    exact(rawRun, ["id", "side", "sessionKind", "branchTips", "nodes", "events"], "run");
    if (rawRun.side !== "white" && rawRun.side !== "black") fail("run:side");
    if (rawRun.sessionKind !== "imported" && rawRun.sessionKind !== "just_play") fail("run:kind");
    exact(rawRun.branchTips, Object.keys(rawRun.branchTips as object), "tips");
    exact(rawRun.nodes, Object.keys(rawRun.nodes as object), "nodes");
    if (!Array.isArray(rawRun.events)) fail("run:events");
    const nodes = Object.fromEntries(Object.entries(rawRun.nodes).map(([key, value]) => {
      const node = parseNode(value);
      if (key !== node.id) fail("node:key-mismatch");
      return [key, node];
    }));
    const events = rawRun.events.map((raw): RunEvent => {
      const eventKeys = raw !== null && typeof raw === "object" && "result" in raw ? ["seq", "digest", "kind", "nodeId", "result"] : ["seq", "digest", "kind", "nodeId"];
      exact(raw, eventKeys, "event");
      if (!Number.isSafeInteger(raw.seq) || Number(raw.seq) < 0) fail("event:seq");
      if (raw.kind !== "move" && raw.kind !== "outcome.reached") fail("event:kind");
      if (raw.kind === "outcome.reached" && raw.result !== "1-0" && raw.result !== "0-1" && raw.result !== "1/2-1/2") fail("event:result");
      const fields = { seq: Number(raw.seq), digest: text(raw.digest, "event:digest"), nodeId: text(raw.nodeId, "event:node") };
      return raw.kind === "outcome.reached"
        ? freeze({ ...fields, kind: "outcome.reached" as const, result: raw.result as NonNullable<RunEvent["result"]> })
        : freeze({ ...fields, kind: "move" as const });
    });
    const run: StoredRun = freeze({ id: text(rawRun.id, "run:id"), side: rawRun.side, sessionKind: rawRun.sessionKind, branchTips: freeze(structuredClone(rawRun.branchTips) as Record<string, string>), nodes: freeze(nodes), events: freeze(events) });
    runAuthority.add(run); this.#runs.set(run.id, run);
    if (rawImport !== null) {
      exact(rawImport, ["runId", "sourceDigest", "parsedSourceResult", "result"], "import");
      if (!/^sha256:[0-9a-f]{64}$/u.test(String(rawImport.sourceDigest))) fail("import:digest");
      if (!["1-0", "0-1", "1/2-1/2"].includes(String(rawImport.result)) || rawImport.result !== rawImport.parsedSourceResult) fail("import:result");
      const record = freeze(structuredClone(rawImport) as StoredImport);
      importAuthority.add(record); this.#imports.set(record.runId, record);
    }
  }
  run(id: string): StoredRun { const run = this.#runs.get(id) ?? fail("run:missing"); if (!runAuthority.has(run)) fail("run:authority"); return run; }
  imported(runId: string): StoredImport | null { const record = this.#imports.get(runId) ?? null; if (record !== null && !importAuthority.has(record)) fail("import:authority"); return record; }
}

function path(run: StoredRun, branchId: string): readonly NodeRecord[] {
  const tip = run.branchTips[branchId] ?? fail("branch:missing");
  const result: NodeRecord[] = [];
  for (let cursor: string | null = tip; cursor !== null;) { const node: NodeRecord = run.nodes[cursor] ?? fail("path:node"); result.push(node); cursor = node.parentId; }
  result.reverse();
  for (let index = 0; index < result.length; index += 1) if (result[index]!.ply !== index) fail("path:ply");
  return freeze(result);
}

function authorizeReviewRecordedPrefix(authority: StoredReviewAuthority, input: Readonly<{ runId: string; branchId: string }>) {
  const run = authority.run(input.runId), imported = authority.imported(input.runId), nodes = path(run, input.branchId);
  const orderedEvents = [...run.events].sort((left, right) => left.seq - right.seq);
  orderedEvents.forEach((event, index) => { if (event.seq !== index) fail("event:not-contiguous"); });
  const eventHead = orderedEvents.at(-1) ?? fail("event:empty");
  const nodeIds = new Set(nodes.map((node) => node.id));
  const terminal = [...orderedEvents].reverse().find((event) => event.kind === "outcome.reached" && nodeIds.has(event.nodeId));
  if (run.sessionKind === "imported" && imported === null) fail("import:missing");
  if (run.sessionKind !== "imported" && imported !== null) fail("import:unexpected");
  if (terminal?.result !== undefined && imported !== null && terminal.result !== imported.result) fail("outcome:disagrees");
  const outcome = terminal?.result !== undefined
    ? freeze({ kind: "board_terminal" as const, eventSeq: terminal.seq, nodeId: terminal.nodeId, result: terminal.result })
    : imported !== null
      ? freeze({ kind: "recorded_result" as const, sourceDigest: imported.sourceDigest, result: imported.result })
      : freeze({ kind: "unfinished" as const });
  const prefixImage = freeze({ events: orderedEvents, path: nodes.map((node) => ({ id: node.id, parentId: node.parentId, ply: node.ply, fen: node.fen, positionKey: node.positionKey, incomingMove: node.incomingMove })) });
  const fields = freeze({ protocol: "review-recorded-prefix@2" as const, runId: run.id, branchId: input.branchId, eventHead: { seq: eventHead.seq, digest: eventHead.digest }, pathNodeIds: nodes.map((node) => node.id), prefixDigest: sha("review-prefix.v2", prefixImage), learnerSide: run.side, outcome });
  const subject = freeze({ ...fields, subjectDigest: sha("review-prefix-subject.v2", fields), nodes });
  subjectAuthority.add(subject); return subject;
}

type Subject = ReturnType<typeof authorizeReviewRecordedPrefix>;
type Grain = "node" | "incoming_edge";
type Evidence = Readonly<{ adapterId: string; projection: string; nodeId: string; payload: unknown; evidenceDigest: string }>;
type SourceState = Readonly<{ kind: "available"; evidence: readonly Evidence[] } | { kind: "honest_empty"; reason: "no_observation" | "outside_domain" } | { kind: "not_requested" } | { kind: "not_yet_scheduled" } | { kind: "pending"; jobCount: number; retrying: number } | { kind: "unavailable"; reason: "provider_off" | "provider_failed" | "retry_exhausted" }>;

function parseScore(raw: unknown) { exact(raw, ["score"], "score"); if (!Number.isFinite(raw.score)) fail("score:value"); return freeze({ score: Number(raw.score) }); }
function parseDelta(raw: unknown) { exact(raw, ["delta"], "delta"); if (!Number.isFinite(raw.delta)) fail("delta:value"); return freeze({ delta: Number(raw.delta) }); }
function parseEdge(raw: unknown) { exact(raw, ["from", "to", "uci"], "edge"); return freeze({ from: text(raw.from, "edge:from"), to: text(raw.to, "edge:to"), uci: text(raw.uci, "edge:uci") }); }

const ADAPTERS = freeze([
  { id: "eval", projection: "derived.review.eval_point@1", family: "engine_eval" as const, grain: "node" as const, parse: parseScore },
  { id: "delta", projection: "derived.review.eval_delta@1", family: "engine_eval" as const, grain: "node" as const, parse: parseDelta },
  { id: "semantic-edge", projection: "rules.tactic.event@1", family: "semantic" as const, grain: "incoming_edge" as const, parse: parseEdge },
  { id: "recorded-edge", projection: "run.record.edge@1", family: "recorded" as const, grain: "incoming_edge" as const, parse: parseEdge },
]);
type Adapter = typeof ADAPTERS[number];
type PlanSlot = Readonly<{ invocationId: string; adapter: Adapter; nodeId: string; fromNodeId: string | null; windowIndex: number }>;

function reviewPacketSourcePlan(subject: Subject, windowNodes: number): readonly PlanSlot[] {
  if (!subjectAuthority.has(subject) || !Number.isSafeInteger(windowNodes) || windowNodes < 1) fail("plan:input");
  return freeze(subject.nodes.flatMap((node, index) => ADAPTERS.flatMap((adapter) => {
    if (adapter.grain === "incoming_edge" && index === 0) return [];
    const fromNodeId = adapter.grain === "incoming_edge" ? subject.nodes[index - 1]!.id : null;
    const windowIndex = Math.floor(index / windowNodes);
    return [{ invocationId: `${adapter.id}\0${fromNodeId ?? "node"}\0${node.id}\0${windowIndex}`, adapter, nodeId: node.id, fromNodeId, windowIndex }];
  })));
}

function createSourceResult(subject: Subject, slot: PlanSlot, raw: Readonly<{ kind: "available"; payloads: readonly unknown[] }> | Exclude<SourceState, { kind: "available" }>) {
  if (!subjectAuthority.has(subject)) fail("result:subject");
  let state: SourceState;
  if (raw.kind === "available") {
    if (raw.payloads.length === 0) fail("result:empty-available");
    const evidence = raw.payloads.map((payload) => {
      const parsed = slot.adapter.parse(payload);
      const fields = freeze({ adapterId: slot.adapter.id, projection: slot.adapter.projection, nodeId: slot.nodeId, payload: parsed });
      const item = freeze({ ...fields, evidenceDigest: sha("review-evidence.v2", fields) });
      evidenceAuthority.add(item); return item;
    });
    state = freeze({ kind: "available", evidence });
  } else state = freeze(structuredClone(raw));
  const result = freeze({ invocationId: slot.invocationId, adapterId: slot.adapter.id, family: slot.adapter.family, grain: slot.adapter.grain, nodeId: slot.nodeId, fromNodeId: slot.fromNodeId, windowIndex: slot.windowIndex, state });
  resultAuthority.add(result); return result;
}

function compileNodeFamilies(subject: Subject, plan: readonly PlanSlot[], results: readonly ReturnType<typeof createSourceResult>[]) {
  if (!subjectAuthority.has(subject)) fail("compile:subject");
  const expected = plan.map((slot) => slot.invocationId).sort(), actual = results.map((result) => result.invocationId).sort();
  if (new Set(actual).size !== actual.length || canonicalizeJson(expected) !== canonicalizeJson(actual)) fail("compile:set");
  return freeze(subject.nodes.map((node) => {
    const atNode = results.filter((result) => result.nodeId === node.id);
    for (const result of atNode) if (!resultAuthority.has(result)) fail("compile:result-authority");
    const familyEntries = (["engine_eval", "semantic", "recorded"] as const).map((family) => {
      const sources = atNode.filter((result) => result.family === family).map((result) => freeze({ adapterId: result.adapterId, invocationId: result.invocationId, grain: result.grain, state: result.state }));
      const items = sources.flatMap((source) => source.state.kind === "available" ? source.state.evidence : []);
      return [family, freeze({ itemCount: items.length, sources })] as const;
    });
    const families = Object.fromEntries(familyEntries) as Record<Family, (typeof familyEntries)[number][1]>;
    return freeze({ nodeId: node.id, items: atNode.flatMap((result) => result.state.kind === "available" ? result.state.evidence : []), families });
  }));
}

type Outcome = Readonly<{ kind: "retryable_failure"; reason: string } | { kind: "succeeded"; digest: string }>;
type AttemptEntry = { attempts: number; pending?: Promise<Outcome>; resolve?: (outcome: Outcome) => void; started: boolean; terminal?: Outcome };
class AttemptStore {
  readonly #entries = new Map<string, AttemptEntry>();
  constructor(readonly maxAttempts: number) {}
  acquire(key: string) {
    const previous = this.#entries.get(key);
    if (previous?.pending !== undefined) return freeze({ kind: "subscriber" as const, completion: previous.pending });
    if ((previous?.attempts ?? 0) >= this.maxAttempts) return freeze({ kind: "retry_exhausted" as const, attempts: previous!.attempts });
    let resolve!: (outcome: Outcome) => void;
    const completion = new Promise<Outcome>((done) => { resolve = done; });
    const entry: AttemptEntry = { attempts: previous?.attempts ?? 0, pending: completion, resolve, started: false, ...(previous?.terminal === undefined ? {} : { terminal: previous.terminal }) };
    this.#entries.set(key, entry);
    const start = () => { if (this.#entries.get(key) !== entry || entry.started) fail("attempt:start"); entry.started = true; entry.attempts += 1; };
    const cancel = () => {
      if (this.#entries.get(key) !== entry) fail("attempt:owner");
      if (!entry.started) {
        if (previous === undefined) this.#entries.delete(key);
        else this.#entries.set(key, { attempts: previous.attempts, started: false, ...(previous.terminal === undefined ? {} : { terminal: previous.terminal }) });
        resolve(freeze({ kind: "retryable_failure", reason: "cancelled_before_start" }));
        return;
      }
      const outcome = freeze({ kind: "retryable_failure" as const, reason: "cancelled_after_start" });
      delete entry.pending; delete entry.resolve; entry.terminal = outcome; resolve(outcome);
    };
    return freeze({ kind: "owner" as const, completion, start, cancel });
  }
}

function storyMoment(subject: Subject, evidenceNodeId: string, stopNodeId: string) {
  const evidenceIndex = subject.nodes.findIndex((node) => node.id === evidenceNodeId);
  const stopIndex = subject.nodes.findIndex((node) => node.id === stopNodeId);
  if (evidenceIndex < 1) fail("story:no-decision-edge");
  if (stopIndex < evidenceIndex) fail("story:stop-before-evidence");
  return freeze({ decisionNodeId: subject.nodes[evidenceIndex - 1]!.id, evidenceNodeId, stopNodeId });
}

function fixture(events?: readonly RunEvent[]) {
  return new StoredReviewAuthority({
    id: "run", side: "white", sessionKind: "imported", branchTips: { main: "n2", sibling: "s1" },
    nodes: {
      n0: { id: "n0", parentId: null, ply: 0, fen: "start", positionKey: "p0", incomingMove: null },
      n1: { id: "n1", parentId: "n0", ply: 1, fen: "after-e4", positionKey: "p1", incomingMove: { uci: "e2e4", san: "e4" } },
      n2: { id: "n2", parentId: "n1", ply: 2, fen: "after-e5", positionKey: "p2", incomingMove: { uci: "e7e5", san: "e5" } },
      s1: { id: "s1", parentId: "n0", ply: 1, fen: "after-d4", positionKey: "ps", incomingMove: { uci: "d2d4", san: "d4" } },
    },
    events: events ?? [{ seq: 0, digest: "e0", kind: "move", nodeId: "n0" }, { seq: 1, digest: "e1", kind: "move", nodeId: "n1" }, { seq: 2, digest: "e2", kind: "move", nodeId: "n2" }],
  }, { runId: "run", sourceDigest: `sha256:${"a".repeat(64)}`, parsedSourceResult: "1-0", result: "1-0" });
}

describe("review evidence fifth author repair", () => {
  it("D3187 derives a contiguous, path-bound subject from parsed storage authorities", () => {
    const first = authorizeReviewRecordedPrefix(fixture(), { runId: "run", branchId: "main" });
    expect(first.pathNodeIds).toEqual(["n0", "n1", "n2"]);
    expect(first.outcome).toMatchObject({ kind: "recorded_result", result: "1-0" });
    expect(() => authorizeReviewRecordedPrefix(fixture([{ seq: 0, digest: "e0", kind: "move", nodeId: "n0" }, { seq: 2, digest: "e2", kind: "move", nodeId: "n2" }]), { runId: "run", branchId: "main" })).toThrow(/not-contiguous/u);
    const offBranch = authorizeReviewRecordedPrefix(fixture([{ seq: 0, digest: "e0", kind: "move", nodeId: "n0" }, { seq: 1, digest: "e1", kind: "outcome.reached", nodeId: "s1", result: "0-1" }]), { runId: "run", branchId: "main" });
    expect(offBranch.outcome).toMatchObject({ kind: "recorded_result", result: "1-0" });
  });

  it("D3185 compiles node and incoming-edge slots with bounded scheduling windows", () => {
    const subject = authorizeReviewRecordedPrefix(fixture(), { runId: "run", branchId: "main" });
    const plan = reviewPacketSourcePlan(subject, 2);
    expect(plan.filter((slot) => slot.adapter.grain === "node")).toHaveLength(6);
    expect(plan.filter((slot) => slot.adapter.grain === "incoming_edge")).toHaveLength(4);
    expect(plan.some((slot) => slot.adapter.grain === "incoming_edge" && slot.nodeId === "n0")).toBe(false);
    expect(plan.find((slot) => slot.nodeId === "n2")?.windowIndex).toBe(1);
  });

  it("D3188 executes each adapter parser before evidence receives authority", () => {
    const subject = authorizeReviewRecordedPrefix(fixture(), { runId: "run", branchId: "main" });
    const slot = reviewPacketSourcePlan(subject, 2).find((candidate) => candidate.adapter.id === "eval")!;
    expect(createSourceResult(subject, slot, { kind: "available", payloads: [{ score: 12 }] }).state).toMatchObject({ kind: "available", evidence: [{ payload: { score: 12 } }] });
    expect(() => createSourceResult(subject, slot, { kind: "available", payloads: [{ delta: 12 }] })).toThrow(/score:keys/u);
  });

  it("D3184 preserves every sibling adapter state and exact family item count", () => {
    const subject = authorizeReviewRecordedPrefix(fixture(), { runId: "run", branchId: "main" });
    const plan = reviewPacketSourcePlan(subject, 2);
    const results = plan.map((slot) => slot.nodeId === "n1" && slot.adapter.id === "eval"
      ? createSourceResult(subject, slot, { kind: "available", payloads: [{ score: 12 }] })
      : slot.nodeId === "n1" && slot.adapter.id === "delta"
        ? createSourceResult(subject, slot, { kind: "unavailable", reason: "provider_failed" })
        : createSourceResult(subject, slot, { kind: "honest_empty", reason: "no_observation" }));
    const node = compileNodeFamilies(subject, plan, results).find((candidate) => candidate.nodeId === "n1")!;
    expect(node.families.engine_eval.itemCount).toBe(1);
    expect(node.families.engine_eval.sources.map((source) => [source.adapterId, source.state.kind])).toEqual([["eval", "available"], ["delta", "unavailable"]]);
  });

  it("D3186 retains every started cancellation until the retry ceiling", async () => {
    const store = new AttemptStore(2);
    const first = store.acquire("request"); expect(first.kind).toBe("owner");
    if (first.kind !== "owner") return; first.start(); first.cancel(); await expect(first.completion).resolves.toMatchObject({ reason: "cancelled_after_start" });
    const second = store.acquire("request"); expect(second.kind).toBe("owner");
    if (second.kind !== "owner") return; second.cancel(); await second.completion;
    const resumed = store.acquire("request"); expect(resumed.kind).toBe("owner");
    if (resumed.kind !== "owner") return; resumed.start(); resumed.cancel(); await resumed.completion;
    expect(store.acquire("request")).toEqual({ kind: "retry_exhausted", attempts: 2 });
  });

  it("D3189 carries separate decision, evidence and stop identities", () => {
    const subject = authorizeReviewRecordedPrefix(fixture(), { runId: "run", branchId: "main" });
    expect(storyMoment(subject, "n1", "n2")).toEqual({ decisionNodeId: "n0", evidenceNodeId: "n1", stopNodeId: "n2" });
    expect(() => storyMoment(subject, "n0", "n1")).toThrow(/no-decision-edge/u);
    expect(() => storyMoment(subject, "n2", "n1")).toThrow(/stop-before-evidence/u);
  });
});
