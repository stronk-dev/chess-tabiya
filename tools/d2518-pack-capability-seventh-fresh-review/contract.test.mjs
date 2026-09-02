// DISPOSABLE fresh-review falsifier. It tests the returned author contract, not production behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const authority = JSON.parse(read("tools/d2509-pack-capability-seventh-author-repair/operation-authority.json"));
const rest = read("apps/server/src/rest.ts");
const service = read("apps/server/src/service.ts");
const queue = read("apps/server/src/evidence-queue.ts");
const rfc = read("rfc/pack-capability-contract.md");

function slice(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return source.slice(from, to);
}

test("D2518: both production Story routes reach publicStory but only one is declared", () => {
  assert.equal((rest.match(/service\.publicStory\(/gu) ?? []).length, 2);
  assert.ok(rest.includes("const publicStoryRoute = /^\\/api\\/shared"));
  assert.ok(rest.includes("const publicCardRoute = /^\\/shared"));

  const storyRows = authority.boundedPopulation.externalRoutes.filter(
    (row) => row.operation === "story.public",
  );
  assert.deepEqual(storyRows.map((row) => row.route), ["/api/shared/:token/story"]);
  assert.equal(
    authority.boundedPopulation.externalRoutes.some((row) => row.route === "/shared/:token"),
    false,
  );
});

test("D2519: the run evidence worker contains provider gateways outside the provider-call census", () => {
  assert.match(queue, /await this\.#executor\.execute\(/u);
  assert.match(queue, /await this\.#tablebase\.probe\(/u);
  assert.equal(
    authority.providerCallSites.some((site) => site.file === "apps/server/src/evidence-queue.ts"),
    false,
  );

  const analysis = slice(service, "  analysis(\n", "  recordPrediction(\n");
  const story = slice(service, "  #ensureStoryEvidence(", "  #required(runId:");
  const move = slice(service, "  #enqueueMoveEvidence(", "  #requiredEvidenceQueue(");
  assert.match(analysis, /this\.enqueueEvidence\(/u);
  assert.match(story, /queue\.enqueue\(/u);
  assert.match(move, /queue\.enqueue(?:Producer)?\(/u);
});

test("D2520: the unavailable response contract cannot describe the queued analysis lifecycle", () => {
  const analysisRoute = slice(rest, 'if (route.action === "analysis")', 'if (route.action === "simulate")');
  const analysisService = slice(service, "  analysis(\n", "  recordPrediction(\n");
  const enqueue = slice(service, "  enqueueEvidence(\n", "  analysis(\n");
  const execute = slice(queue, "  async #execute(", "  async #tablebasePayload(");

  assert.match(analysisRoute, /return json\(202/u);
  assert.match(analysisRoute, /service\.analysis\(/u);
  assert.match(analysisService, /this\.enqueueEvidence\(/u);
  assert.match(enqueue, /return queue\.enqueue\(/u);
  assert.match(execute, /await this\.#executor\.execute\(/u);
  assert.match(execute, /this\.#failures\.push/u);
  assert.equal(authority.providerConsumers["runtime.analysis"], "unavailable");
  assert.match(rfc, /An `unavailable` consumer returns the\s+retryable HTTP 503 envelope and writes nothing/u);
});
