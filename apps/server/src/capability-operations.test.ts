// rfc/evidence-job-durability.md §1 — criteria 20–21 and [[D2429]], [[D2509]]–[[D2513]]: the
// capability-operation census is set-equal with the live route source, splits every provider-bearing
// body arm, preserves each consumer's provider-off effect, and the public card dispatches its token
// scope once. The queued population is exactly two gateways and three enqueue owners.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CONSUMER_PROVIDER_OFF,
  EVIDENCE_ENQUEUE_ORIGINS,
  EXTERNAL_ROUTE_OPERATIONS,
  QUEUED_PROVIDER_GATEWAYS,
  RUN_ROUTE_OPERATIONS,
  resolveRouteOperation,
  runSessionCapabilitySource,
} from "./capability-operations.js";
import { EVIDENCE_ORIGINS, consumerForOrigin, operationForKind, providerOffTerminal } from "./evidence-jobs.js";
import type { LiveSessionService } from "./live-session.js";
import { createRestHandler } from "./rest.js";
import type { RunService } from "./service.js";

const rest = readFileSync(new URL("./rest.ts", import.meta.url), "utf8");
const queueSource = readFileSync(new URL("./evidence-queue.ts", import.meta.url), "utf8");
const serviceSource = readFileSync(new URL("./service.ts", import.meta.url), "utf8");

/** The live `(method, action)` population, parsed independently from `rest.ts`. */
function liveRunRouteBranches(): { readonly actions: ReadonlySet<string>; readonly branches: ReadonlySet<string> } {
  const grammar = /function parseRunRoute[\s\S]*?\/\^\\\/runs\\\/\(\[\^\/\]\+\)\\\/\(([^)]+)\)\$\//u.exec(rest);
  if (grammar === null) throw new Error("parseRunRoute grammar not found");
  const actions = new Set(grammar[1]!.split("|"));
  const start = rest.indexOf("const route = parseRunRoute(url.pathname);");
  const postGate = rest.indexOf('if (request.method !== "POST") {', start);
  const end = rest.indexOf("return errorResponse(error);", postGate);
  const branches = new Set<string>();
  for (const match of rest.slice(start, postGate).matchAll(/request\.method === "(GET|PUT|DELETE|POST)" && route\.action === "([a-z-]+)"/gu)) branches.add(`${match[1]} ${match[2]}`);
  for (const match of rest.slice(postGate, end).matchAll(/if \(route\.action === "([a-z-]+)"\)/gu)) branches.add(`POST ${match[1]}`);
  return { actions, branches };
}

describe("the HTTP capability-operation census (§1)", () => {
  it("is set-equal with every parseRunRoute action and every handler method branch ([[D2510]])", () => {
    const live = liveRunRouteBranches();
    const declaredActions = new Set(RUN_ROUTE_OPERATIONS.map((branch) => branch.action!));
    expect([...declaredActions].sort()).toEqual([...live.actions].sort());
    const declared = new Set(RUN_ROUTE_OPERATIONS.map((branch) => `${branch.method} ${branch.action}`));
    expect([...declared].sort()).toEqual([...live.branches].sort());
    // Provider-bearing GETs and the non-POST mutations are representable.
    for (const operation of ["run.human_split", "run.corpus", "run.story", "run.share.revoke", "run.create.rated", "run.create.playtest", "run.create.repertoire_gap"]) {
      expect([...RUN_ROUTE_OPERATIONS, ...EXTERNAL_ROUTE_OPERATIONS].some((branch) => branch.binding.operationId === operation), operation).toBe(true);
    }
  });

  it("derives external routes from the live route authority, never an invented prefix ([[D2509]])", () => {
    expect(rest).toContain("/^\\/packs\\/drafts\\/([^/]+)(?:\\/(lint|playtest|register|withdraw))?$/");
    expect(rest).not.toContain("/studio/drafts");
    const register = EXTERNAL_ROUTE_OPERATIONS.find((branch) => branch.binding.operationId === "pack.register")!;
    expect(register.route).toBe("/packs/drafts/:draftId/register");
    for (const literal of ['url.pathname === "/runs"', 'url.pathname === "/runs/import"', 'url.pathname === "/rated-games"', 'url.pathname === "/select-move"', 'resource==="gaps"&&tail==="enter"', "/^\\/api\\/shared\\/([^/]+)\\/story$/", "/^\\/shared\\/([^/]+)$/", "/^\\/runs\\/([^/]+)\\/share\\/([^/]+)$/"]) {
      expect(rest, literal).toContain(literal);
    }
  });

  it("accepts only checked bindings with a compiled provider-off behavior for every consumer ([[D2512]])", () => {
    for (const branch of [...RUN_ROUTE_OPERATIONS, ...EXTERNAL_ROUTE_OPERATIONS]) {
      const binding = branch.binding;
      if (binding.source.kind === "none") expect("consumer" in binding, binding.operationId).toBe(false);
      else expect(CONSUMER_PROVIDER_OFF[(binding as { consumer: keyof typeof CONSUMER_PROVIDER_OFF }).consumer], binding.operationId).toBeDefined();
    }
    // honest_empty consumers are not collapsed into a retryable 503.
    expect(CONSUMER_PROVIDER_OFF["runtime.branch_decidedness"]).toBe("honest_empty");
    expect(CONSUMER_PROVIDER_OFF["inspector.corpus"]).toBe("honest_empty");
    expect(CONSUMER_PROVIDER_OFF["review.story_evidence"]).toBe("honest_empty");
    expect(CONSUMER_PROVIDER_OFF["runtime.analysis"]).toBe("unavailable");
  });

  it("splits the four group sources and every discriminated body arm without gap or overlap ([[D2511]])", () => {
    const group = (source: string) => resolveRouteOperation("POST", "/runs/:runId/:action", "group", { source });
    expect(group("hand_picked")).toEqual({ operationId: "run.group.hand_picked", source: { kind: "none" } });
    expect(group("authored")).toEqual({ operationId: "run.group.authored", source: { kind: "none" } });
    expect(group("human_replies")).toEqual({ operationId: "run.group.human_replies", source: { kind: "run_session_operation" }, consumer: "opponent.selection" });
    expect(group("engine_top_n")).toEqual({ operationId: "run.group.engine_top_n", source: { kind: "run_session_operation" }, consumer: "opponent.selection" });
    expect(() => resolveRouteOperation("POST", "/runs/:runId/:action", "group", {})).toThrow(/CAPABILITY_OPERATION_GAP/u);
    expect(() => resolveRouteOperation("POST", "/runs/:runId/:action", "unknown")).toThrow(/CAPABILITY_OPERATION_GAP/u);
    expect(resolveRouteOperation("POST", "/runs/:runId/:action", "moves", { selection: {} }).operationId).toBe("run.move.opponent_received");
    expect(resolveRouteOperation("POST", "/runs", undefined, { session: { kind: "position" } }).operationId).toBe("run.create.position");
    expect(resolveRouteOperation("POST", "/runs/:runId/:action", "duplicate", {}, { "run.sessionKind": "pack" }).operationId).toBe("run.create.duplicate_pack");
    // Every declared discriminated branch is reachable and unique.
    for (const branch of [...RUN_ROUTE_OPERATIONS, ...EXTERNAL_ROUTE_OPERATIONS]) {
      const discriminant = branch.discriminant;
      const body: Record<string, unknown> = {};
      const loaded: Record<string, unknown> = {};
      if (discriminant !== undefined) {
        if ("loaded" in discriminant) loaded[discriminant.loaded] = discriminant.value;
        else if (discriminant.path === "/session/kind") body.session = { kind: discriminant.value };
        else if ("presence" in discriminant) { if (discriminant.presence === "present") body[discriminant.path.slice(1)] = true; }
        else body[discriminant.path.slice(1)] = discriminant.value;
      }
      expect(resolveRouteOperation(branch.method, branch.route, branch.action, body, loaded)).toBe(branch.binding);
    }
  });

  it("derives position/imported session sources without a fictitious pack ([[D2429]], [[D2513]])", () => {
    const policy = { mode: "human_common" as const };
    expect(runSessionCapabilitySource({ sessionKind: "position", packId: null, packDigest: null, opponentPolicy: policy })).toEqual({ kind: "position", opponentMode: "human_common" });
    expect(runSessionCapabilitySource({ sessionKind: "imported", packId: null, packDigest: null, opponentPolicy: policy })).toEqual({ kind: "imported", opponentMode: "human_common" });
    expect(runSessionCapabilitySource({ sessionKind: "pack", packId: "p", packDigest: "d", opponentPolicy: policy })).toEqual({ kind: "pack", packId: "p", packDigest: "d" });
    expect(() => runSessionCapabilitySource({ sessionKind: "pack", packId: null, packDigest: null, opponentPolicy: policy })).toThrow();
    // Analysis and Story on a position run are run-session operations, not registered-pack ones.
    expect(resolveRouteOperation("POST", "/runs/:runId/:action", "analysis").source).toEqual({ kind: "run_session_operation" });
    expect(resolveRouteOperation("GET", "/runs/:runId/:action", "story").source).toEqual({ kind: "run_session_operation" });
  });
});

describe("criterion 20 — both public-card scopes are derived once, not exception-dispatched ([[D2518]])", () => {
  function handler(scope: "story_read" | "session_join" | undefined, calls: string[]) {
    const service = {
      publicTokenScope: () => { calls.push("scope"); return scope; },
      publicStory: () => { calls.push("story"); throw new Error("provider down"); },
    } as unknown as RunService;
    const live = { publicJoin: () => { calls.push("join"); return { title: "Class", hostHandle: "host" }; } } as unknown as LiveSessionService;
    return createRestHandler(service, undefined, undefined, undefined, undefined, live);
  }

  it("never falls from a failing Story token into the join page, nor sends a join token into Story", async () => {
    const storyCalls: string[] = [];
    const story = await handler("story_read", storyCalls)(new Request("http://tabiya.test/shared/token"));
    expect(story.status).toBe(404);
    expect(storyCalls).toEqual(["scope", "story"]);
    const joinCalls: string[] = [];
    const join = await handler("session_join", joinCalls)(new Request("http://tabiya.test/shared/token"));
    expect(join.status).toBe(200);
    expect(await join.text()).toContain("Hosted by @host");
    expect(joinCalls).toEqual(["scope", "join"]);
    const unknownCalls: string[] = [];
    expect((await handler(undefined, unknownCalls)(new Request("http://tabiya.test/shared/token"))).status).toBe(404);
    expect(unknownCalls).toEqual(["scope"]);
    // The old try-Story/catch-join shape is gone from the source.
    expect(rest).not.toMatch(/catch\{\s*try\{if\(live===undefined\)throw new Error\(\);return sessionJoinPage/u);
  });
});

describe("criterion 21 — queued providers are a closed operation population ([[D2519]])", () => {
  it("fixes kinds to exactly two gateways and origins to exactly three sealed consumers", () => {
    expect(QUEUED_PROVIDER_GATEWAYS.flatMap((gateway) => gateway.kinds.map((kind) => `${kind}:${gateway.operation}`)).sort())
      .toEqual(["bestline", "eval", "tablebase", "wdl"].map((kind) => `${kind}:${operationForKind(kind as never)}`).sort());
    expect(EVIDENCE_ENQUEUE_ORIGINS.map((row) => [row.origin, row.consumer, row.providerOff])).toEqual(EVIDENCE_ORIGINS.map((origin) => [
      origin, consumerForOrigin(origin), providerOffTerminal(origin) === "settled_unavailable" ? "unavailable" : "honest_empty",
    ]));
  });

  it("finds each provider call only inside its declared gateway", () => {
    for (const gateway of QUEUED_PROVIDER_GATEWAYS) {
      const occurrences = queueSource.split(`${gateway.call}(`).length - 1;
      expect(occurrences, gateway.call).toBe(1);
      const method = gateway.gateway.split(".")[1]!;
      const body = queueSource.slice(queueSource.indexOf(`async ${method}(`));
      expect(body.slice(0, body.indexOf("\n  }\n")), gateway.gateway).toContain(`${gateway.call}(`);
    }
    // The worker class calls no other provider surface: one execute and one probe, nothing else.
    const worker = queueSource.slice(queueSource.indexOf("export class EvidenceJobQueue"), queueSource.indexOf("export interface EvidenceEngineClient"));
    expect(worker.match(/\.execute\(/gu)).toHaveLength(1);
    expect(worker.match(/\.probe\(/gu)).toHaveLength(1);
    expect(worker).not.toMatch(/\.(?:select|enumerate|exchange)\(|scheduler\.get\(/u);
  });

  it("admits each origin only in its production owner; there is no post-save enqueue loop ([[D2526]])", () => {
    // rfc/review-evidence-compiler.md §4.1 supersedes the `story_completion` owner: import completion
    // and story() reach only the Review coordinator's `ensureBranch` over the provider exchange, so
    // the origin stays in the closed store vocabulary but no production path admits it.
    expect(serviceSource).not.toContain('origin: "story_completion"');
    expect(serviceSource).not.toContain("#ensureStoryEvidence");
    expect(serviceSource).toContain("this.#reviewEvidence.ensureBranch(runId, branchId)");
    const owners: Readonly<Record<string, string>> = {
      explicit_analysis: "  enqueueEvidence(",
      run_enrichment: "  #enrichmentPlan(",
    };
    for (const [origin, owner] of Object.entries(owners)) {
      const literal = `origin: "${origin}"`;
      const index = serviceSource.indexOf(literal);
      expect(index, origin).toBeGreaterThan(0);
      const methodStart = serviceSource.lastIndexOf("\n  ", index);
      const enclosing = serviceSource.slice(0, index).lastIndexOf(owner);
      expect(enclosing, `${origin} is admitted inside ${owner}`).toBeGreaterThan(0);
      expect(methodStart).toBeGreaterThan(0);
    }
    expect(serviceSource).not.toMatch(/\.enqueue(?:Producer)?\(/u);
    expect(serviceSource).not.toContain("#enqueueMoveEvidence");
    for (const method of ["  move(", "  opponentPly(", "  async createGroup("]) {
      const body = serviceSource.slice(serviceSource.indexOf(method));
      const end = body.indexOf("\n  }\n");
      expect(body.slice(0, end), method).toContain("this.#commitWithEnrichment(");
      expect(body.slice(0, end), method).not.toContain("this.#storage.save(");
    }
  });
});
