import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

import { PROVIDER_PROTOCOL_RESOURCE, ProviderRequestInvalid, assertProviderDelivery, exactLegalMoves, normalizeProviderRequest, parsePersistedProviderDelivery, serializeProviderDelivery } from "@chess-tabiya/runtime";

import { createApplication } from "./application.js";
import { CAPABILITY_DISPOSITIONS } from "./capabilities.js";
import { EngineSupervisor, binaryArtifactProbe } from "./engine-supervisor.js";
import { ControlledFetch, FakeEngines, ManualClock, flush, syzygyBody } from "./provider-exchange.test-support.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { MaiaPolicyPageOperation, providerOperationDescriptors } from "./provider-operations.js";
import {
  PROVIDER_SOURCE_FACTORIES,
  PROVIDER_TRAVERSALS,
  composeProviderTraversalApplication,
  providerTraversalSyzygyPosition,
  runProviderTraversalCli,
  type ProviderOperatorCapability,
} from "./provider-traversal.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const KQK = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
const EXACT = { kind: "exact_fen" as const, fen: START };
const MAIA_REQUEST = { position: EXACT, requestedModel: { id: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe", version: "1e13597c42d4858b7cfd7cfdae01e297263364b2" }, band: 1500, temperature: 1, topP: 0.95, requestedWidth: 2, timeoutMs: 5_000 };

const REQUESTS = {
  "stockfish-legal-roots": { fen: KQK, bound: { kind: "depth", value: 6 }, requestedWidth: "all_legal", moveIdentity: "chessops-king-takes-rook@1", requestedEngine: { id: "stockfish-analysis", version: "19" }, timeoutMs: 5_000 },
  "stockfish-position-evaluation": { fen: START, requestedEngine: { id: "stockfish-analysis", version: "19" }, bound: { kind: "depth", requestedDepth: 9 }, timeoutMs: 5_000 },
  "maia-policy-page": MAIA_REQUEST,
  "syzygy-position": { rules: "chess", variant: "standard", fen: KQK, timeoutMs: 5_000 },
  "explorer-position-page": { rules: "chess", setupFamily: "standard_start", variant: "standard", positionFen4: START.split(" ").slice(0, 4).join(" "), requestFen6: START, ratingBuckets: [1600], speeds: ["blitz"], since: null, until: null, moveWidth: 3, history: { kind: "requested" }, topWidth: 0, recentWidth: 0, timeoutMs: 5_000 },
} as const;

function fixtureApplication() {
  const clock = new ManualClock();
  const engines = new FakeEngines();
  engines.respond = (request) => {
    if (request.commands.includes("go")) return ["info depth 1 multipv 1 policy 0.5 pv e2e4", "info depth 1 multipv 2 policy 0.2 pv d2d4", "bestmove e2e4"];
    const multiPv = request.commands.find((command) => command.startsWith("setoption name MultiPV value "));
    if (multiPv !== undefined && !multiPv.endsWith(" 1")) return rootLines(request.commands.find((command) => command.startsWith("position fen "))!.slice("position fen ".length));
    return ["info depth 9 score cp 18 wdl 300 620 80 pv e2e4", "bestmove e2e4"];
  };
  const tablebase = new ControlledFetch();
  const explorer = new ControlledFetch();
  const autoRespond = (target: ControlledFetch, body: (url: string) => unknown) => {
    const original = target.fetch;
    return (url: string, init: { readonly signal: AbortSignal; readonly headers: Readonly<Record<string, string>> }) => {
      const pending = original(url, init);
      target.respond(target.calls.length - 1, body(url));
      return pending;
    };
  };
  const application = composeProviderTraversalApplication({
    engines,
    tablebaseFetch: autoRespond(tablebase, () => syzygyBody(KQK)),
    explorerFetch: autoRespond(explorer, () => ({ white: 40, draws: 10, black: 50, moves: [{ uci: "e2e4", san: "e4", averageRating: 1650, white: 20, draws: 5, black: 25 }], opening: null, history: [] })),
    explorerToken: "secret",
    monotonicNowMs: clock.now,
    wallNow: clock.wall,
  });
  return { application, engines, tablebase, explorer };
}

/** Standard-UCI spellings (king destination) of every legal root move, one exact line each. */
function rootLines(fen: string): readonly string[] {
  const moves = exactLegalMoves(fen).map((move) => `${move.from}${move.to}${move.promotion === undefined ? "" : move.uci[4]}`);
  return [...moves.map((move, index) => `info depth 6 multipv ${index + 1} score cp ${index} pv ${move}`), `bestmove ${moves[0]}`];
}

class Output {
  text = "";
  write(chunk: string): void { this.text += chunk; }
  json(): Record<string, unknown> { return JSON.parse(this.text.trim()) as Record<string, unknown>; }
}

describe("§9 operator traversal", () => {
  it("names exactly the resource's five CLI arms, each bound to one operation and one source factory", () => {
    const rows = PROVIDER_PROTOCOL_RESOURCE.payload.operations;
    expect(Object.keys(PROVIDER_TRAVERSALS).sort()).toEqual(rows.map((row) => row.cliName).sort());
    for (const row of rows) {
      expect(PROVIDER_TRAVERSALS[row.cliName].operation).toBe(row.operation);
      expect(`${PROVIDER_SOURCE_FACTORIES[row.operation].projection.id}@${PROVIDER_SOURCE_FACTORIES[row.operation].projection.version}`).toBe(row.sourceProjection);
      expect(PROVIDER_SOURCE_FACTORIES[row.operation].symbol).toBe(row.sourceFactoryId);
    }
  });

  it("traverses all five arms descriptor → scheduler → parser → sole source factory → declared projection", async () => {
    for (const row of PROVIDER_PROTOCOL_RESOURCE.payload.operations) {
      const { application } = fixtureApplication();
      const out = new Output();
      const code = await runProviderTraversalCli(application, [row.cliName], JSON.stringify(REQUESTS[row.cliName]), out);
      const result = out.json();
      expect({ name: row.cliName, code, kind: result.kind }).toEqual({ name: row.cliName, code: 0, kind: "evidence_success" });
      expect(result.projection).toBe(row.sourceProjection);
      expect(result.parser).toBe(row.parserId);
      expect(result.operation).toBe(row.operation);
    }
  });

  it("returns source failures and the Syzygy local-domain arm unchanged, never as evidence", async () => {
    const { application, engines } = fixtureApplication();
    engines.version = "18";
    const failure = new Output();
    expect(await runProviderTraversalCli(application, ["stockfish-position-evaluation"], JSON.stringify(REQUESTS["stockfish-position-evaluation"]), failure)).toBe(3);
    expect(failure.json()).toMatchObject({ kind: "source_failure", reason: "identity_mismatch" });
    expect(failure.json()).not.toHaveProperty("evidence");
    const local = new Output();
    expect(await runProviderTraversalCli(application, ["syzygy-position"], JSON.stringify({ ...REQUESTS["syzygy-position"], fen: START }), local)).toBe(0);
    expect(local.json()).toMatchObject({ kind: "local_domain_result", payload: { kind: "outside_domain", pieceCount: 32 } });
  });

  it("refuses unknown operations, extra arguments, malformed or extra request fields and forged capabilities", async () => {
    const { application, tablebase } = fixtureApplication();
    for (const argv of [[], ["syzygy"], ["syzygy-position", "extra"], ["toString"]]) {
      const out = new Output();
      expect(await runProviderTraversalCli(application, argv, "{}", out)).toBe(64);
    }
    for (const stdin of ["", "{", `${JSON.stringify(REQUESTS["syzygy-position"])} {}`, JSON.stringify({ ...REQUESTS["syzygy-position"], extra: 1 })]) {
      const out = new Output();
      expect(await runProviderTraversalCli(application, ["syzygy-position"], stdin, out), stdin).toBe(64);
    }
    expect(tablebase.calls).toHaveLength(0);
    for (const forged of [{}, Object.freeze(Object.create(null)), JSON.parse("{}")]) {
      await expect(providerTraversalSyzygyPosition(application, forged as ProviderOperatorCapability, REQUESTS["syzygy-position"])).rejects.toThrow(/operator capability/u);
    }
  });

  it("a traversal's evidence carries the whole sealed delivery, which survives the durable boundary", async () => {
    const { application } = fixtureApplication();
    let captured: unknown;
    const traversal = PROVIDER_TRAVERSALS["maia-policy-page"];
    const original = application.sourceFactories["maia.policy_page@1"];
    const spying = { ...application, sourceFactories: { ...application.sourceFactories, "maia.policy_page@1": { ...original, make: (delivery: never) => { const evidence = original.make(delivery); captured = evidence; return evidence; } } } };
    const out = new Output();
    await runProviderTraversalCli(spying, ["maia-policy-page"], JSON.stringify(MAIA_REQUEST), out);
    expect(traversal.operation).toBe("maia.policy_page@1");
    expect((captured as { projection: { id: string } }).projection.id).toBe("human.maia.policy_page");
    const delivery = (captured as { payload: unknown }).payload;
    assertProviderDelivery("maia.policy_page@1", delivery);
    const reloaded = parsePersistedProviderDelivery("maia.policy_page@1", JSON.parse(JSON.stringify(serializeProviderDelivery("maia.policy_page@1", delivery))));
    expect(reloaded.payload).toEqual(delivery.payload);
    expect(reloaded.acquisition.normalizedRequestDigest).toBe(out.json().normalizedRequestDigest);
  });
});

describe("§6 Maia live bounds are refuse-only", () => {
  const scheduler = (engines: FakeEngines) => new ProviderExchangeScheduler({ descriptors: { ...providerOperationDescriptors({ engines, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), "maia.policy_page@1": MaiaPolicyPageOperation(engines) }, maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => 0, wallNow: () => "2026-09-24T12:00:00.000Z" });
  const get = (engines: FakeEngines, patch: Record<string, unknown>) => scheduler(engines).get({ operation: "maia.policy_page@1", request: { ...MAIA_REQUEST, ...patch } as never }, { id: "t", budgetMs: 5_000 }, new AbortController().signal);

  it("sends the literal ordered command image and refuses out-of-range live values without clamping", async () => {
    const engines = new FakeEngines();
    engines.respond = () => ["info depth 1 multipv 1 policy 0.5 pv e2e4", "info depth 1 multipv 2 policy 0.2 pv d2d4", "bestmove e2e4"];
    expect((await get(engines, {})).kind).toBe("success");
    expect(engines.calls[0]!.commands).toEqual(["setoption name Elo value 1500", "setoption name Temperature value 1", "setoption name TopP value 0.95", "setoption name MultiPV value 2", `position fen ${START}`, "go"]);
    for (const band of [999, 2401]) await expect(get(engines, { band })).rejects.toThrow(ProviderRequestInvalid);
    for (const band of [1000, 2400]) expect((await get(engines, { band })).kind).toBe("success");
    await expect(get(engines, { temperature: 6 })).rejects.toThrow(/temperature/u);
    await expect(get(engines, { band: 1500.5 })).rejects.toThrow(ProviderRequestInvalid);
    await expect(get(engines, { temperature: 0 })).rejects.toThrow(ProviderRequestInvalid);
    await expect(get(engines, { topP: 1.01 })).rejects.toThrow(ProviderRequestInvalid);
    await expect(get(engines, { timeoutMs: 60_001 })).rejects.toThrow(ProviderRequestInvalid);
    engines.maiaOptions = engines.maiaOptions.map((option) => (option.name === "MultiPV" ? { ...option, max: 1 } : option));
    await expect(get(engines, {})).rejects.toThrow(/MultiPV maximum/u);
  });

  it("treats missing numeric option bounds and an uncaptured container as unavailability", async () => {
    const engines = new FakeEngines();
    engines.respond = () => ["info depth 1 multipv 1 policy 0.5 pv e2e4", "bestmove e2e4"];
    engines.maiaOptions = engines.maiaOptions.filter((option) => option.name !== "TopP");
    expect(await get(engines, { requestedWidth: 1 })).toMatchObject({ kind: "source_failure", reason: "provider_unavailable", providerDetail: "Maia does not advertise numeric TopP bounds" });
    const noContainer = new FakeEngines();
    noContainer.containerCaptured = false;
    noContainer.respond = engines.respond;
    expect(await get(noContainer, { requestedWidth: 1 })).toMatchObject({ reason: "provider_unavailable" });
  });

  it("history-conditioned and exact-FEN requests to one final position never alias", () => {
    const engines = new FakeEngines();
    const digest = (position: unknown) => scheduler(engines).normalizedRequestDigest({ operation: "maia.policy_page@1", request: { ...MAIA_REQUEST, position } as never });
    const reached = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    const history = digest({ kind: "history_conditioned", startFen: START, historyUci: ["e2e4", "e7e5"] });
    expect(history).not.toBe(digest({ kind: "exact_fen", fen: reached }));
    expect(digest({ kind: "exact_fen", fen: reached })).toBe(digest({ kind: "exact_fen", fen: reached }));
    for (const patch of [{ band: 1600 }, { temperature: 0.9 }, { topP: 0.9 }, { requestedWidth: 1 }]) {
      expect(scheduler(engines).normalizedRequestDigest({ operation: "maia.policy_page@1", request: { ...MAIA_REQUEST, ...patch } as never })).not.toBe(digest(EXACT));
    }
  });
});

describe("§8 Explorer and §5 Stockfish descriptors", () => {
  it("sends the bearer token, the literal history flag, and treats 401 as unavailability", async () => {
    const explorer = new ControlledFetch();
    const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: explorer.fetch, explorerToken: "secret" }), maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => 0, wallNow: () => "2026-09-24T12:00:00.000Z" });
    const pending = scheduler.get({ operation: "lichess_explorer.position_page@1", request: REQUESTS["explorer-position-page"] as never }, { id: "t", budgetMs: 5_000 }, new AbortController().signal);
    await flush();
    expect(explorer.calls[0]!.url).toContain("history=true");
    expect(explorer.calls[0]!.url).toMatch(/^https:\/\/explorer\.lichess\.org\/lichess\?/u);
    explorer.respond(0, "401 Authorization Required", { status: 401 });
    expect(await pending).toMatchObject({ reason: "provider_unavailable", providerDetail: "explorer authorization required" });
  });

  it("callers cannot submit Stockfish command bytes; the descriptor sends its own image and the literal reset", async () => {
    const { application, engines } = fixtureApplication();
    await expect(application.scheduler.get({ operation: "stockfish.legal_root_table@1", request: { ...REQUESTS["stockfish-legal-roots"], commands: ["go infinite"] } as never }, { id: "t", budgetMs: 5_000 }, new AbortController().signal)).rejects.toThrow(ProviderRequestInvalid);
    await application.scheduler.get({ operation: "stockfish.legal_root_table@1", request: REQUESTS["stockfish-legal-roots"] as never }, { id: "t", budgetMs: 5_000 }, new AbortController().signal);
    expect(engines.calls[0]!.commands).toEqual(normalizeProviderRequest("stockfish.legal_root_table@1", REQUESTS["stockfish-legal-roots"] as never).command.commands);
    expect(engines.calls[0]!.resetCommands).toEqual(["setoption name MultiPV value 1", "setoption name UCI_ShowWDL value false"]);
  });
});

describe("§5 capability register", () => {
  it("authorizes only the named all-legal legal-root MultiPV measurement and keeps every other multi-line use refused", () => {
    const rows = CAPABILITY_DISPOSITIONS.filter((row) => row.instrument === "Stockfish" && /MultiPV/u.test(row.capability));
    expect(rows.map((row) => [row.capability, row.disposition])).toEqual([
      ["bestmove / MultiPV rank / bestline", "refused"],
      ["all-legal MultiPV for fixed-depth legal-root measurement", "reached"],
      ["MultiPV > 1 outside enumerate and the all-legal legal-root measurement", "refused"],
    ]);
    expect(CAPABILITY_DISPOSITIONS.some((row) => row.capability === "MultiPV > 1 outside enumerate")).toBe(false);
  });
});

describe("§9 application composition and degradation", () => {
  it("composes one scheduler; with providers off every operation is honestly unavailable", async () => {
    const application = await createApplication({ engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    try {
      const result = await application.providers.scheduler.get({ operation: "syzygy.position@1", request: REQUESTS["syzygy-position"] as never }, { id: "t", budgetMs: 5_000 }, new AbortController().signal);
      expect(result).toMatchObject({ kind: "source_failure", reason: "provider_unavailable" });
      const engine = await application.providers.scheduler.get({ operation: "stockfish.position_evaluation@1", request: REQUESTS["stockfish-position-evaluation"] as never }, { id: "t", budgetMs: 5_000 }, new AbortController().signal);
      expect(engine).toMatchObject({ kind: "source_failure", reason: "provider_unavailable" });
    } finally {
      await application.close();
    }
  });
});

// ---------------------------------------------------------------------------------------------
// Built CLI and a real Stockfish generation (skipped without the binary)
// ---------------------------------------------------------------------------------------------

const run = promisify(execFile);
const STOCKFISH = ["/opt/homebrew/bin/stockfish", "/usr/games/stockfish", "/usr/local/bin/stockfish", process.env.SF_CMD ?? ""].find((candidate) => candidate !== "" && existsSync(candidate));
const built = mkdtempSync(join(tmpdir(), "provider-traversal-"));
afterAll(() => rmSync(built, { recursive: true, force: true }));

async function buildCli(): Promise<string> {
  const out = join(built, "provider-traversal.js");
  if (!existsSync(out)) await run(join(process.cwd(), "node_modules/.bin/esbuild"), ["apps/server/src/provider-traversal.ts", "--bundle", "--platform=node", "--format=esm", "--external:typescript", `--outfile=${out}`], { cwd: process.cwd() });
  return out;
}

async function cli(args: readonly string[], input: string, env: Record<string, string> = {}): Promise<{ code: number; stdout: string }> {
  const out = await buildCli();
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [out, ...args], { env: { ...process.env, PROVIDER_TRAVERSAL_OFFLINE: "1", ...env }, timeout: 60_000 }, (error, stdout) => resolve({ code: error === null ? 0 : Number((error as { code?: number }).code ?? 1), stdout }));
    child.stdin!.end(input);
  });
}

describe("built provider-traversal CLI", () => {
  it("fails closed on usage errors and answers the local-domain arm offline", async () => {
    expect((await cli(["no-such-operation"], "{}")).code).toBe(64);
    expect((await cli(["syzygy-position", "extra"], "{}")).code).toBe(64);
    const local = await cli(["syzygy-position"], JSON.stringify({ ...REQUESTS["syzygy-position"], fen: START }), { STOCKFISH_COMMAND: "/nonexistent/stockfish" });
    expect(local.code).toBe(0);
    expect(JSON.parse(local.stdout)).toMatchObject({ kind: "local_domain_result" });
    const offline = await cli(["explorer-position-page"], JSON.stringify(REQUESTS["explorer-position-page"]), { STOCKFISH_COMMAND: "/nonexistent/stockfish" });
    expect(offline.code).toBe(3);
    expect(JSON.parse(offline.stdout)).toMatchObject({ kind: "source_failure", reason: "provider_unavailable" });
  }, 120_000);

  (STOCKFISH === undefined ? it.skip : it)("measures a real all-legal root table and fixed-bound evaluation through one Stockfish generation", async () => {
    const roots = await cli(["stockfish-legal-roots"], JSON.stringify({ ...REQUESTS["stockfish-legal-roots"], requestedEngine: { id: "stockfish-analysis", version: await stockfishVersion() } }), { STOCKFISH_COMMAND: STOCKFISH! });
    expect(roots.code, roots.stdout).toBe(0);
    expect(JSON.parse(roots.stdout)).toMatchObject({ kind: "evidence_success", projection: "live.stockfish.legal_root_table@1", generation: 1 });
    const evaluation = await cli(["stockfish-position-evaluation"], JSON.stringify({ ...REQUESTS["stockfish-position-evaluation"], requestedEngine: { id: "stockfish-analysis", version: await stockfishVersion() } }), { STOCKFISH_COMMAND: STOCKFISH! });
    expect(evaluation.code, evaluation.stdout).toBe(0);
    expect(JSON.parse(evaluation.stdout)).toMatchObject({ kind: "evidence_success", projection: "live.stockfish.position_eval@1" });
  }, 120_000);
});

async function stockfishVersion(): Promise<string> {
  const supervisor = new EngineSupervisor([{ id: "stockfish-analysis", kind: "judge", command: STOCKFISH!, name: "Stockfish" }], { artifactProbe: binaryArtifactProbe });
  try {
    return (await supervisor.start("stockfish-analysis")).version;
  } finally {
    await supervisor.shutdown();
  }
}
