// Opt-in integration check for rfc/maia-task-source.md criterion2. No mocked inference, publication
// or release claim. Reuse the existing source-build OCI identity join and production value path.
import assert from "node:assert/strict";
import { execFile, execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { createRun, commitMove, compileAssistanceRequest, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders,
  digestEngineContainer, digestEngineOptionImage, normalizeProviderRequest, normalizedProviderRequestDigest, maiaInferenceTaskCommandImage,
  providerSourceEvidence, deriveMaiaNodeDistribution, deriveMaiaNodeCandidateWdl, maiaNodeInputsFromSubject, evidenceForConsumer,
  presentEvidenceItems, serializePresentedEvidence,
  type MaiaInferenceTaskRequest } from "../packages/runtime/src/index.js";
import { digestRunEventHead, resolveRunSubject } from "../packages/runtime/src/run-subject.js";
import { positionFromFen } from "../packages/runtime/src/chess.js";
import { EngineSupervisor, type EngineExchangeCapture } from "../apps/server/src/engine-supervisor.js";
import { maiaDockerSpec, MAIA3_MODEL_ID, MAIA3_SOURCE_COMMIT } from "../apps/server/src/maia.js";
import { composeProviderTraversalApplication } from "../apps/server/src/provider-traversal.js";
import { ProviderRegistry } from "../apps/server/src/provider-health.js";
import { ExchangeMaiaTaskSource } from "../apps/server/src/provider-maia.js";
import { OpponentSelector } from "../apps/server/src/opponent-selector.js";
import { RunService } from "../apps/server/src/service.js";
import { SQLiteRunStorage } from "../apps/server/src/storage.js";
import { loadConceptRegistry } from "../apps/server/src/concept-registry-loader.js";
import { consumeMaiaNodeDistribution } from "../apps/server/src/inspector-maia.js";
import { EVIDENCE_MANIFEST } from "../apps/server/src/evidence-manifest.js";
import { parseHumanSplitPage } from "../apps/web/src/lib/human-split-response.js";
// Existing deployment helpers are JavaScript, not a second artifact-identity implementation.
// @ts-expect-error existing JavaScript helper is tested by the source-deployment contract suite.
import { localMaiaIdentity } from "./release/lib/local-maia-identity.mjs";
// Keep these CLI modules outside the bundle: their import.meta.url entry guards must retain the
// original module URL, not become the integration check's own entry point.
const { maiaSourceBuildArguments, parseSourceBuilder, requireSourceBuilder, SOURCE_BUILDER } =
  await import(pathToFileURL(resolve("tools/source-deployment.mjs")).href);

const { values } = parseArgs({ options: { image: { type: "string", default: "chess-tabiya-maia:dev" },
  "oci-dir": { type: "string", default: ".cache/deploy/local-build/maia-oci" }, build: { type: "boolean", default: false },
  "terminal-probe": { type: "boolean", default: false }, "operator-cli": { type: "boolean", default: false } } });
const docker = (args: readonly string[]): string => execFileSync("docker", args, { encoding: "utf8", maxBuffer: 1024 * 1024 });
const layout = resolve(values["oci-dir"]);
if (values.build) {
  const context = docker(["context", "show"]).trim();
  requireSourceBuilder(parseSourceBuilder(docker(["buildx", "inspect", SOURCE_BUILDER])), context);
  const arch = docker(["version", "--format", "{{.Server.Arch}}"]).trim();
  execFileSync("docker", maiaSourceBuildArguments({ platform: `linux/${arch}`, image: values.image, layout }), { stdio: "inherit" });
}
const [image] = JSON.parse(docker(["image", "inspect", values.image]));
assert.equal(image.Config.User, "maia");
assert.equal(image.Config.Labels["org.chess-tabiya.maia3.commit"], MAIA3_SOURCE_COMMIT);
assert.equal(image.Config.Labels["org.chess-tabiya.maia3.model"], MAIA3_MODEL_ID);
assert.equal(image.Architecture, process.arch === "x64" ? "amd64" : process.arch, "native architecture required");
const readJson = (file: string): unknown => JSON.parse(readFileSync(join(layout, file), "utf8"));
const artifact = localMaiaIdentity({ layout: readJson("oci-layout"), index: readJson("index.json"), image,
  readBlob: (id: string) => readFileSync(join(layout, "blobs", "sha256", id.slice(7))) });
const containerDigest = digestEngineContainer(artifact);
// Launch the immutable actually inspected image, offline, rather than a mutable tag or a digest
// supplied by a caller. The source-build helper checks its manifest/config/rootfs before this.
const base = maiaDockerSpec({ image: image.Id, containerDigest });
const health = new ProviderRegistry({ configured: [{ instanceId: "maia-inference", implementation: "uci_sidecar", endpoint: "maia-5m", identity: MAIA3_MODEL_ID }] });
const supervisor = new EngineSupervisor([{ ...base, args: ["run", "--rm", "--network", "none", "--read-only",
  "--tmpfs", "/tmp:rw,nosuid,noexec,size=64m", "--memory", "1536m", "--memory-swap", "1536m", "-i", image.Id] }], {
  onLifecycle: health.engineLifecycleSink({ "maia-5m": "maia-inference" }),
  artifactProbe: async spec => {
    assert.equal(spec.id, "maia-5m");
    assert.equal(JSON.parse(docker(["image", "inspect", image.Id]))[0].Id, artifact.imageId);
    return { kind: "container", containerDigest };
  },
});
const app = composeProviderTraversalApplication({ engines: supervisor, maiaTaskHealth: health, tablebaseFetch: null, explorerFetch: null, explorerToken: null });
const captures: EngineExchangeCapture[] = [];
const exchange = supervisor.exchange.bind(supervisor);
supervisor.exchange = async (...args) => { const capture = await exchange(...args); captures.push(capture); return capture; };
const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = new Date().toISOString();
const rows: object[] = [];
const historyKeys: string[] = [];
const comparisonDrawId = randomUUID();
try {
  await supervisor.start("maia-5m");
  // Distinct complete histories with the same reached board retain distinct task identities.
  for (const historyUci of [["g1f3", "g8f6", "b1c3", "b8c6"], ["b1c3", "b8c6", "g1f3", "g8f6"]]) {
    let run = createRun({ id: `native-maia-${rows.length}`, session: { kind: "position", start: { fen: startFen, side: "white" },
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"a".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 42, createdAt: at });
    for (const move of historyUci) run = commitMove(run, move, { at }).run;
    const request: MaiaInferenceTaskRequest = { sampleRequestId: randomUUID(), position: { kind: "history_conditioned", startFen, historyUci },
      requestedModel: { id: MAIA3_MODEL_ID, version: MAIA3_SOURCE_COMMIT }, band: 1500, temperature: 0.8, topP: 0.92, requestedWidth: 20, timeoutMs: 5000 };
    const query = () => app.scheduler.get({ operation: "maia.inference_task@1", request }, { id: "native-maia-criterion2", budgetMs: 60_000 }, new AbortController().signal);
    const result = await query();
    assert.equal(result.kind, "success", JSON.stringify(result));
    if (result.kind !== "success") throw new Error("Real model task did not produce a source");
    const delivery = result.delivery, task = providerSourceEvidence("maia.inference_task@1", delivery);
    assert.deepEqual(delivery.payload.request, request);
    assert.equal(delivery.acquisition.actualIdentity.containerDigest, containerDigest);
    assert.equal(delivery.acquisition.actualIdentity.optionImageDigest, digestEngineOptionImage(delivery.acquisition.actualIdentity.optionImage));
    assert.equal(delivery.acquisition.generation, supervisor.establishedGeneration("maia-5m"));
    assert.equal(delivery.payload.appliedBand, 1500);
    assert(delivery.payload.candidates.length > 0, "This real nonterminal task must report candidate rows");
    assert(delivery.payload.termination.moveUci !== null);
    const normalized = normalizeProviderRequest("maia.inference_task@1", request);
    assert.equal(delivery.acquisition.normalizedRequestDigest, normalizedProviderRequestDigest("maia.inference_task@1", normalized));
    historyKeys.push(normalizedProviderRequestDigest("maia.inference_task@1",
      normalizeProviderRequest("maia.inference_task@1", { ...request, sampleRequestId: comparisonDrawId })));
    const capture = captures.at(-1)!;
    assert.equal(captures.length, rows.length + 1, "exactly one real exchange per new task");
    assert.deepEqual(capture.transcript.filter(line => line.startsWith("> ")).map(line => line.slice(2)),
      maiaInferenceTaskCommandImage(request, capture.optionImage));
    const firstTerminal = capture.transcript.find(line => line.startsWith("< bestmove "));
    assert(firstTerminal, "actual first terminal line required");
    assert.equal(firstTerminal.split(/\s+/u)[2], delivery.payload.termination.rawBestMoveUci);
    assert.equal(capture.transcript.at(-1), firstTerminal);
    const node = run.nodes.at(-1)!;
    const resolved = resolveRunSubject(run, { kind: "run_node", runId: run.id, branchId: node.branchId, nodeId: node.id,
      eventHeadDigest: digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events }) });
    const derived = deriveMaiaNodeDistribution(maiaNodeInputsFromSubject(task, resolved));
    const view = evidenceForConsumer(EVIDENCE_MANIFEST, { id: "inspector.human_split", version: 2 }, [derived]);
    const { nodeId, engine, requestedBand, appliedBand, coverage, candidates } = consumeMaiaNodeDistribution(view);
    const page = parseHumanSplitPage({ protocol: "inspector.human_split@2", status: "shown", nodeId, engine,
      requestedBand, appliedBand, coverage, candidates, presentation: serializePresentedEvidence(presentEvidenceItems(view)) }, node.id, node.fen);
    assert.equal(page.candidates.length, delivery.payload.candidates.length);
    const cached = await query();
    assert.equal(cached.kind, "success");
    if (cached.kind !== "success") throw new Error("Exact source reuse failed");
    assert.equal(cached.delivery.kind, "retained_exact");
    assert.equal(cached.delivery.acquisition, delivery.acquisition);
    assert.equal(captures.length, rows.length + 1, "exact retention must not run the model again");
    assert.throws(() => providerSourceEvidence("maia.inference_task@1", JSON.parse(JSON.stringify(delivery))));
    rows.push({ requestDigest: delivery.acquisition.normalizedRequestDigest, historyUci, fen: node.fen,
      generation: delivery.acquisition.generation, rows: page.candidates.length, sampledMove: delivery.payload.termination.moveUci,
      appliedBand, actualModel: engine.modelId, retainedExact: true });
  }
  assert.notEqual((rows[0] as { requestDigest: string }).requestDigest, (rows[1] as { requestDigest: string }).requestDigest);
  assert.notEqual(historyKeys[0], historyKeys[1], "history separates identities even when the draw id is held identical");
  assert.equal((rows[0] as { fen: string }).fen, (rows[1] as { fen: string }).fen);
  // Exercise the actual current grant and new supplier, not just its downstream node factory.
  // This is authenticated storage/service authority, not cookie/HTTP/native UI proof.
  const selector = new OpponentSelector(supervisor, { health, maiaTaskSource: new ExchangeMaiaTaskSource({ scheduler: app.scheduler,
    engines: supervisor, health, monotonicNowMs: () => health.monotonicNow() }) });
  const storage = new SQLiteRunStorage(":memory:", { concepts: { registry: loadConceptRegistry(resolve("content/concepts")) }, onMigration: () => {} }), supplierRows: object[] = [];
  try {
    const principal = { learnerId: "native-maia-owner", handle: "native-maia-owner" };
    storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
    const service = new RunService(storage, { opponentSelector: selector });
    const intent = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
    for (const side of ["white", "black"] as const) {
      let run = createRun({ id: `native-maia-supplier-${side}`, session: { kind: "position", start: { fen: startFen, side },
        feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } }, sessionDigest: `sha256:${"b".repeat(64)}`,
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 42, createdAt: at });
      for (const move of ["e2e4", "e7e5"]) run = commitMove(run, move, { at }).run;
      run = revealFeedback(run, at).run;
      storage.create(run, { learnerId: principal.learnerId, writerId: `native-maia-${side}` });
      const signal = new AbortController().signal, node = run.nodes[1]!;
      const context = service.resolveInspectorRecordedContext(run.id, principal, intent, availability,
        { branchId: run.activeCursor.branchId, nodeId: node.id, decisionDigest: moduleDecisionStamp(run).digest, context: { kind: "position" } }, signal);
      const before = captures.length, stored = JSON.stringify(storage.read(run.id));
      const distributionToken = await service.acquireInspectorMaiaSource(context, "derived.maia.node_distribution@1", signal);
      const distribution = service.readInspectorMaiaSource(distributionToken), afterDistribution = captures.length;
      const wdlToken = await service.acquireInspectorMaiaSource(context, "derived.maia.node_candidate_wdl@1", signal);
      const wdl = service.readInspectorMaiaSource(wdlToken);
      assert.equal(distribution.outcome.kind, "available"); assert(distribution.values.length === 1 && distribution.inputs !== null);
      assert(distribution.inputs.task.payload.payload.candidates.length > 0);
      assert.deepEqual(distribution.request.historyUci, ["e2e4"]);
      assert.equal(distribution.inputs.resolved.subject.kind, "run_node");
      if (distribution.inputs.resolved.subject.kind !== "run_node") throw new Error("Expected the exact granted node subject");
      assert.equal(distribution.inputs.resolved.subject.nodeId, node.id);
      assert.equal(distribution.inputs.task, wdl.inputs?.task, "both suppliers retain the identical final task");
      assert.equal(distribution.inputs.task.payload.acquisition.actualIdentity.containerDigest, containerDigest);
      assert.equal(captures.length, afterDistribution, "WDL must not query or sample again");
      assert.equal(service.readInspectorMaiaSource(distributionToken), distribution);
      assert.equal(service.readInspectorMaiaSource(wdlToken), wdl);
      assert.equal(captures.length, afterDistribution, "retained supplier reads must not query again");
      assert.equal(JSON.stringify(storage.read(run.id)), stored, "inspection cannot modify play");
      const exactWdl = deriveMaiaNodeCandidateWdl(distribution.inputs);
      assert.deepEqual(wdl.result, exactWdl, "no invented WDL or cross-row substitution");
      assert.equal(wdl.outcome.kind, "available", "this pinned model's native positive must report WDL");
      assert.equal(wdl.values.length, 1);
      assert(exactWdl.kind === "available" && exactWdl.value.payload.candidates.length > 0, "native WDL positive must be non-vacuous");
      supplierRows.push({ side, nodeId: node.id, historyUci: distribution.request.historyUci, rows: distribution.inputs.task.payload.payload.candidates.length,
        wdl: wdl.outcome, exchanges: afterDistribution - before, finalTaskShared: true, retainedExact: true });
    }
  } finally { storage.close(); }
  // Disposable D3970 exploration: observe the actual source, do not redefine a successful
  // terminal outcome or change production selection. Kept separate from criterion2's report.
  if (values["terminal-probe"]) {
    const terminals = [];
    for (const [kind, fen] of [["checkmate", "7k/6Q1/5K2/8/8/8/8/8 b - - 0 1"],
      ["stalemate", "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"], ["insufficient_material", "4k3/8/8/8/8/8/8/4K3 w - - 0 1"]]) {
      assert(positionFromFen(fen!).isEnd(), "probe must use the selector's actual rules-terminal authority");
      const request: MaiaInferenceTaskRequest = { sampleRequestId: randomUUID(), position: { kind: "history_conditioned", startFen: fen!, historyUci: [] },
        requestedModel: { id: MAIA3_MODEL_ID, version: MAIA3_SOURCE_COMMIT }, band: 1500, temperature: 0.8, topP: 0.92, requestedWidth: 20, timeoutMs: 5000 };
      const before = captures.length;
      const result = await app.scheduler.get({ operation: "maia.inference_task@1", request }, { id: "D3970-terminal-probe", budgetMs: 60_000 }, new AbortController().signal);
      terminals.push({ kind, fen, result: result.kind === "success" ? { kind: result.kind, candidates: result.delivery.payload.candidates,
        termination: result.delivery.payload.termination } : result,
        exchanges: captures.length - before, firstTerminal: captures.length > before ? captures.at(-1)!.transcript.find(line => line.startsWith("< bestmove ")) ?? null : null });
    }
    const terminalReport = { scope: "disposable D3970 actual terminal source observation; not a new production terminal contract", at, artifact, terminals };
    mkdirSync(".cache/verification", { recursive: true });
    writeFileSync(".cache/verification/maia-terminal-source.json", JSON.stringify(terminalReport, null, 2) + "\n");
    console.log(JSON.stringify(terminalReport));
  }
  const operatorRows: object[] = [];
  if (values["operator-cli"]) {
    // Exercise the real packaged entry against the existing production Python TCP sidecar,
    // never a new transport or a fabricated artifact. Release only this check's own container.
    await supervisor.shutdown();
    const name = `tabiya-d3969-${randomUUID()}`;
    docker(["run", "-d", "--rm", "--name", name, "--read-only", "--tmpfs", "/tmp:rw,nosuid,noexec,size=64m",
      "--memory", "1536m", "--memory-swap", "1536m", "-p", "127.0.0.1::7000",
      "-e", `MAIA_IMAGE_ID=${artifact.imageId}`, "-e", `MAIA_MANIFEST_DIGEST=${artifact.manifestDigest}`,
      "-e", `MAIA_CONFIG_DIGEST=${artifact.configDigest}`, "--entrypoint", "python", image.Id, "/opt/chess-tabiya/maia-sidecar.py"]);
    try {
      const deadline = performance.now() + 90_000;
      while (spawnSync("docker", ["exec", name, "test", "-f", "/tmp/ready"], { stdio: "ignore" }).status !== 0) {
        if (performance.now() >= deadline) throw new Error("native operator sidecar did not become ready");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const hostPort = docker(["port", name, "7000/tcp"]).trim();
      assert.match(hostPort, /^127\.0\.0\.1:\d+$/u);
      const port = hostPort.split(":")[1]!;
      mkdirSync(".cache/verification", { recursive: true });
      const cli = resolve(".cache/verification/provider-traversal.js");
      execFileSync(resolve("node_modules/.bin/esbuild"), ["apps/server/src/provider-traversal.ts", "--bundle", "--platform=node", "--format=esm", "--external:typescript", `--outfile=${cli}`], { stdio: "inherit" });
      for (const operation of ["maia-policy-page", "maia-inference-task"] as const) {
        const request = { position: { kind: "history_conditioned", startFen, historyUci: ["e2e4"] }, requestedModel: { id: MAIA3_MODEL_ID, version: MAIA3_SOURCE_COMMIT },
          band: 1500, temperature: 0.8, topP: 0.92, requestedWidth: 20, timeoutMs: 5000,
          ...(operation === "maia-inference-task" ? { sampleRequestId: randomUUID() } : {}) };
        const result = await new Promise<Record<string, unknown>>((resolveResult, reject) => {
          const child = execFile(process.execPath, [cli, operation], { env: { ...process.env, PROVIDER_TRAVERSAL_OFFLINE: "1",
            MAIA_HOST: "127.0.0.1", MAIA_PORT: port }, timeout: 60_000 }, (error, stdout, stderr) => {
            if (error !== null) { reject(new Error(`native ${operation} failed: ${stdout}; ${stderr}`, { cause: error })); return; }
            try { resolveResult(JSON.parse(stdout)); } catch (cause) { reject(cause); }
          });
          child.stdin!.end(JSON.stringify(request));
        });
        assert.equal(result.kind, "evidence_success");
        assert.equal(result.operation, operation === "maia-inference-task" ? "maia.inference_task@1" : "maia.policy_page@1");
        assert.equal(result.projection, operation === "maia-inference-task" ? "human.maia.inference_task@1" : "human.maia.policy_page@1");
        for (const field of ["candidates", "termination", "transcript", "payload"]) assert(!Object.hasOwn(result, field));
        operatorRows.push({ operation, ...result });
      }
    } finally { docker(["rm", "-f", name]); }
  }
  const report = { scope: "real pinned Maia descriptor/exchange/parser/source/exact consumer/receiver and SQLite/RunService supplier grants; optional packaged CLI uses existing TCP sidecar. Not bot calibration, authenticated HTTP/native UI, Full Inspector2 or release clearance",
    at, artifact, platform: `${image.Os}/${image.Architecture}`, rows, supplierRows, operatorRows };
  mkdirSync(".cache/verification", { recursive: true });
  writeFileSync(".cache/verification/maia-task-source.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally { await supervisor.shutdown(); health.shutdown(); }
