// Disposable D3497 production observation. No policy/source/receipt replacement.
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { arch, cpus, platform, release, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { performance as nodePerformance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { chromium, expect, type Page } from "@playwright/test";
import { compileAssistanceRequest, hintDecisionStamp, parseHintResponse, PRIMARY_EVIDENCE_MANIFEST, HINT_COMPILER_VERSION, CANDIDATE_PACKET_COMPILER_VERSION, type DrillRun } from "@chess-tabiya/runtime";
import { createApplication, GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { HintService } from "../../apps/server/src/hint-service.js";
import type { VoiceProvider } from "../../apps/server/src/guidance.js";
import { checkBrowserReceipt, summarizeBrowser, rowKey } from "./browser-receipt.mjs";

assert.match(process.version, /^v24\./u);
const plan = JSON.parse(readFileSync("tools/d3497-hint-latency/browser-plan.json", "utf8"));
const base = JSON.parse(readFileSync(plan.basePlan, "utf8"));
const samples = Number(process.argv[2] ?? plan.samplesPerCell);
assert(Number.isInteger(samples) && samples > 0 && samples <= plan.samplesPerCell);
const output = resolve(process.argv[3]!);
assert(!existsSync(output), `refusing measurement overwrite: ${output}`);
const binary = resolve(process.env.BOT_CALIBRATION_SF_CMD ?? process.env.SF_CMD!);
assert(existsSync(binary), "Make must supply real Stockfish");
const digest = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const providerBinaryDigest = `sha256:${createHash("sha256").update("tabiya/engine.binary.v1\0").update(readFileSync(binary)).digest("hex")}`;
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split("\n");
const sources = [...tracked.filter(path => /^(apps\/(server|web)\/src|packages\/(runtime|schema)\/src)\//u.test(path) && !/\.(test|spec)\./u.test(path)),
  "tools/d3497-hint-latency/browser-capture.ts", "tools/d3497-hint-latency/browser-receipt.mjs", "tools/d3497-hint-latency/browser-plan.json", plan.basePlan];
const sourceDigests = Object.fromEntries(sources.map(path => [path, digest(readFileSync(path))]));
function built(directory: string): string[] { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? built(join(directory, entry.name)) : [join(directory, entry.name)]); }
const buildDigests = Object.fromEntries([...built("apps/web/dist"), ...built("apps/server/dist")].sort().map(path => [path, digest(readFileSync(path))]));
type Trace = { entered: number; deps: number; packets: any[]; sources: any[] };
let active: Trace | undefined;
const context = new AsyncLocalStorage<Trace>();
const now = () => nodePerformance.now();
const wide = CandidatePopulationService.prototype.wide;
CandidatePopulationService.prototype.wide = function(fen) {
  const trace = context.getStore(), before = this.stats(), result = wide.call(this, fen), after = this.stats();
  if (trace) {
    trace.deps = now();
    trace.packets.push({ fen, completedAt: trace.deps, kind: result.kind, hitsDelta: after.hits - before.hits, missesDelta: after.misses - before.misses,
      ...(result.kind === "ready" ? { id: result.receipt.packet.id, manifestDigest: result.receipt.packet.manifestDigest, legalMoves: result.receipt.packet.legalMoves.length, candidates: result.receipt.packet.candidates.length } : {}) });
  }
  return result;
};
const get = ProviderExchangeScheduler.prototype.get;
ProviderExchangeScheduler.prototype.get = async function(this: ProviderExchangeScheduler, ...args: Parameters<typeof get>) {
  const trace = context.getStore(), result = await get.apply(this, args);
  if (trace) { trace.deps = now(); trace.sources.push({ operation: args[0].operation, completedAt: trace.deps, result }); }
  return result;
} as typeof get;
const request = HintService.prototype.request;
HintService.prototype.request = function(...args: Parameters<typeof request>) {
  if (!active) return request.apply(this, args);
  // Start retained-horizon timing at actual server request entry, not Playwright's
  // preceding actionability wait or driver/IPC delay.
  active.entered = now(); active.deps = active.entered;
  return context.run(active, () => request.apply(this, args));
};
const rows: any[] = [], baselines: any[] = [], startups: any[] = [];
const browser = await chromium.launch();
const browserVersion = browser.version();

async function clock(page: Page) {
  const readings = [];
  for (let i = 0; i < 5; i++) {
    const before = now(), browserAt = await page.evaluate(() => performance.now()), after = now();
    readings.push({ before, after, browserAt, lower: before - browserAt, upper: after - browserAt });
  }
  const best = [...readings].sort((a, b) => (a.upper - a.lower) - (b.upper - b.lower))[0]!;
  return { lower: best.lower, upper: best.upper, samples: readings };
}

async function withApplication(position: any, variant: string, sample: number, body: (api: any) => Promise<void>) {
  const temporary = mkdtempSync(join(tmpdir(), "tabiya-hint-browser-"));
  const voice: VoiceProvider | undefined = variant === "voice_timeout" ? { render: async (_view, _persona, _sentence, _scope, signal) => new Promise((_resolve, reject) => signal!.addEventListener("abort", () => reject(new Error("deadline")), { once: true })) }
    : variant === "voice_refused" ? { render: async () => "" } : undefined;
  const start = now();
  const application = await createApplication({ databasePath: join(temporary, "probe.sqlite"), development: true, engineMode: "maia", maiaHost: "127.0.0.1", maiaPort: 0,
    stockfishCommand: variant === "source_off" ? join(temporary, "intentionally-unavailable-stockfish") : binary,
    tablebaseSource: null, cookieSecure: false, longitudinalWorkerEntry: pathToFileURL(resolve("apps/server/dist/longitudinal-worker-thread.js")), ...(voice ? { voiceProvider: voice } : {}) });
  try {
    await new Promise<void>((done, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", done); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    startups.push({ position: position.id, variant, sample, ms: now() - start, health: application.providerHealth.snapshot() });
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "browser_probe", password: "disposable-browser-latency-password" }) });
    assert.equal(registered.status, 201);
    const cookie = registered.headers.get("set-cookie")!.split(";")[0]!;
    const headers = { "content-type": "application/json", cookie, "x-writer-id": "browser-latency-writer" };
    const post = async (path: string, input: unknown) => {
      const response = await fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(input) });
      assert(response.ok, await response.clone().text()); return response;
    };
    const run = async (id: string, fen = position.fen) => {
      await post("/runs", { id, session: { kind: "position", start: { fen, side: fen.split(" ")[1] === "w" ? "white" : "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3 });
      await post(`/runs/${id}/reveal`, {});
      const graph = await (await fetch(`${origin}/runs/${id}/graph`, { headers })).json() as any;
      const events = await (await fetch(`${origin}/runs/${id}/events?sinceSeq=0`, { headers })).json() as any;
      return { id, feedbackPolicy: "attempt_end", ...graph.graph, events: events.events } as DrillRun;
    };
    const open = async (run: DrillRun, persona: boolean) => {
      const browserContext = await browser.newContext({ viewport: plan.viewport });
      const split = cookie.indexOf("=");
      await browserContext.addCookies([{ name: cookie.slice(0, split), value: cookie.slice(split + 1), url: origin }]);
      await browserContext.addInitScript(({ id, persona }) => {
        localStorage.setItem(`chess-tabiya:run:${id}:writer-id`, "browser-latency-writer");
        localStorage.setItem("tabiya.workflow.v2.position", JSON.stringify({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset: "support", overrides: persona ? { voice: "persona" } : {}, moduleOverrides: { include: [], exclude: [] } } }));
      }, { id: run.id, persona });
      const page = await browserContext.newPage();
      await page.goto(`${origin}/play/run/${run.id}`);
      await expect(page.getByLabel("Chessboard")).toBeVisible();
      await expect(page.locator('[data-module="guided_hint"]')).toBeVisible();
      return { page, close: () => browserContext.close() };
    };
    const ask = async (page: Page, run: DrillRun, arm: string, rung: string) => {
      const seat = page.locator('[data-module="guided_hint"]');
      const button = seat.getByRole("button", { name: rung === "pattern" ? "Hint" : "A little more", exact: true }).last();
      await button.scrollIntoViewIfNeeded();
      const clocks = await clock(page);
      await page.evaluate((expectedRung) => {
        const state: any = { click: null, trusted: false, honest: null, settled: null, scheduled: false };
        (window as any).__hintLatency = state;
        const read = () => {
          const element = document.querySelector(`[data-module="guided_hint"] .hint-sentence[data-hint-rung="${expectedRung}"]`) ?? document.querySelector('[data-module="guided_hint"] .hint-message');
          if (!element || state.click === null) return;
          const rect = element.getBoundingClientRect(), style = getComputedStyle(element), text = element.textContent ?? "";
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          const hitTest = hit !== null && (hit === element || element.contains(hit));
          const visible = rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight && style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0 && hitTest;
          if (!visible) return;
          const value = { frameAt: performance.now(), text, rung: element.getAttribute("data-hint-rung"), visible, hitTest, afterFrames: 2, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
          state.honest ??= value;
          if (!text.startsWith("Looking for a hint")) { state.settled ??= value; observer.disconnect(); }
        };
        const observer = new MutationObserver(() => {
          if (state.scheduled) return;
          state.scheduled = true;
          requestAnimationFrame(() => requestAnimationFrame(() => { state.scheduled = false; read(); }));
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
        document.addEventListener("click", event => {
          if ((event.target as Element)?.closest('[data-module="guided_hint"] button')) { state.click = performance.now(); state.trusted = event.isTrusted; }
        }, { capture: true, once: true });
      }, rung);
      const responses: any[] = [];
      const listener = async (response: any) => {
        if (!response.url().includes(`/runs/${run.id}/hints`)) return;
        const text = await response.text();
        responses.push({ text, response: parseHintResponse(JSON.parse(text).hint), method: response.request().method(), requestBody: response.request().method() === "POST" ? response.request().postDataJSON() : null });
      };
      page.on("response", listener);
      const trace: Trace = { entered: now(), deps: 0, sources: [], packets: [] }; trace.deps = trace.entered; active = trace;
      try {
        await button.click();
        await page.waitForFunction(() => (window as any).__hintLatency?.settled !== null, undefined, { timeout: 70_000 });
        await expect.poll(() => responses.some(item => item.response.state !== "pending")).toBe(true);
        const observed = await page.evaluate(() => (window as any).__hintLatency);
        assert.equal(observed.trusted, true, "measurement needs a real browser input event");
        const terminal = responses.findLast(item => item.response.state !== "pending")!;
        const hint = terminal.response, dom = observed.settled;
        const row: any = { position: position.id, arm, rung, sample, state: hint.state, boundary: "browser", response: hint,
          clickToHonestMs: observed.honest.frameAt - observed.click, clickToSettledMs: dom.frameAt - observed.click,
          dependenciesToFrameLowerMs: dom.frameAt + clocks.lower - trace.deps, dependenciesToFrameUpperMs: dom.frameAt + clocks.upper - trace.deps,
          clock: clocks, dom, clickAt: observed.click, honestAt: observed.honest.frameAt, requestEntryAt: trace.entered, dependencyAt: trace.deps, dependencyClock: trace.sources.length + trace.packets.length ? "last_observed_mandatory_completion" : "request_entry_no_observed_acquisition",
          sources: trace.sources, packets: trace.packets, payloadBytes: Buffer.byteLength(terminal.text), wire: responses };
        if (hint.state === "available") row.deterministicSentence = hint.delivery.rendered.sentence;
        if (arm === "source_off") {
          const moduleRun = await runModule();
          const response = await post(`/runs/${moduleRun.id}/modules/query`, { assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), query: { timing: "post_commit", subjectNodeId: moduleRun.activeCursor.nodeId, requested: ["theory_breadcrumb", "structure_nudge"] } });
          row.modules = { status: response.status, body: await response.json() };
        }
        console.log(`${position.id}/${arm}/${rung}/${sample}: ${hint.state} click→frame ${row.clickToSettledMs.toFixed(1)}ms dependencies→frame ${row.dependenciesToFrameUpperMs.toFixed(1)}ms`);
        return row;
      } finally { page.off("response", listener); active = undefined; }
    };
    async function runModule() {
      const value = await run("source-off-modules", base.sourceOffModules.fen);
      await post(`/runs/${value.id}/moves`, { uci: base.sourceOffModules.move }); await post(`/runs/${value.id}/reveal`, {});
      const graph = await (await fetch(`${origin}/runs/${value.id}/graph`, { headers })).json() as any;
      return { ...value, ...graph.graph };
    }
    const ceiling = async (page: Page, run: DrillRun, arm: string) => {
      const buttons = page.locator('[data-module="guided_hint"]').getByRole("button", { name: "A little more", exact: true });
      const uiMoreDisabled = await buttons.count() === 0 || await buttons.last().isDisabled();
      const trace: Trace = { entered: now(), deps: 0, sources: [], packets: [] }; active = trace;
      try {
        const response = await post(`/runs/${run.id}/hints`, { nodeId: run.activeCursor.nodeId, rung: "move", decisionDigest: hintDecisionStamp(run).digest, assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) });
        const text = await response.text(), hint = parseHintResponse(JSON.parse(text).hint);
        return { position: position.id, arm, rung: "move", sample, state: hint.state, response: hint, boundary: "rest_ceiling_control", uiMoreDisabled, sources: trace.sources, packets: trace.packets,
          clickToHonestMs: null, clickToSettledMs: null, dependenciesToFrameLowerMs: null, dependenciesToFrameUpperMs: null, payloadBytes: Buffer.byteLength(text) };
      } finally { active = undefined; }
    };
    await body({ run, open, ask, ceiling });
  } finally { active = undefined; await application.close(); rmSync(temporary, { recursive: true, force: true }); }
}

try {
  for (let sample = 0; sample < samples; sample++) {
    for (const position of base.positions) await withApplication(position, "normal", sample, async ({ run, open, ask, ceiling }) => {
      for (const arm of ["cold", "warm"]) {
        const value = await run(`${arm}-run`), ui = await open(value, false);
        try {
          let previous: any;
          for (const rung of base.rungs.filter((rung: string) => rung !== "move")) {
            if (previous && previous.state !== "available") {
              previous = { position: position.id, arm, rung, sample, state: "not_reachable", boundary: "not_reachable", predecessor: rowKey(previous), clickToHonestMs: null, clickToSettledMs: null, dependenciesToFrameLowerMs: null, dependenciesToFrameUpperMs: null, payloadBytes: null };
            } else previous = await ask(ui.page, value, arm, rung);
            rows.push(previous);
          }
          rows.push(await ceiling(ui.page, value, arm));
        } finally { await ui.close(); }
      }
    });
    const position = base.positions.find((position: any) => position.id === "mate");
    for (const arm of base.arms.filter((arm: string) => !["cold", "warm"].includes(arm))) await withApplication(position, arm, sample, async ({ run, open, ask }) => {
      if (arm !== "source_off") {
        const value = await run("voice-baseline"), ui = await open(value, false);
        try { baselines.push({ ...await ask(ui.page, value, "voice_baseline", "pattern"), pairedArm: arm }); } finally { await ui.close(); }
      }
      const value = await run("arm-run"), ui = await open(value, arm.startsWith("voice_"));
      try { rows.push(await ask(ui.page, value, arm, "pattern")); } finally { await ui.close(); }
    });
  }
  assert.deepEqual(Object.fromEntries(sources.map(path => [path, digest(readFileSync(path))])), sourceDigests, "source drift during capture");
  const receipt = { version: 1, workItem: plan.workItem, measuredAt: new Date().toISOString(), revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), sourceDigests, buildDigests,
    sampleMode: samples === plan.samplesPerCell ? "receipt" : "smoke", samples, node: process.version, machine: { platform: platform(), release: release(), arch: arch(), cpu: cpus()[0]!.model },
    engine: { providerBinaryDigest }, browserVersion, viewport: plan.viewport, measurement: plan.measurement, profile: GUIDED_HINT_PROFILE, hintCompiler: HINT_COMPILER_VERSION, packetCompiler: CANDIDATE_PACKET_COMPILER_VERSION,
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, d7Discharged: false, startups, baselines, rows, summary: summarizeBrowser(rows) };
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, checked: checkBrowserReceipt(receipt, plan, base) }));
} catch (error) {
  if (!existsSync(output)) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify({ version: 1, workItem: plan.workItem, status: "incomplete_rejected", error: String(error), samples, sourceDigests, buildDigests, startups, rows, baselines }, null, 2) + "\n", { flag: "wx" });
  }
  throw error;
} finally { await browser.close(); CandidatePopulationService.prototype.wide = wide; ProviderExchangeScheduler.prototype.get = get; HintService.prototype.request = request; }
