// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
//
// Per-instrument-call latency on the ENDGAME surface, measured against a
// running harness server (tools/k9-endgame-latency-harness/serve.ts) over the
// shipped HTTP routes. Percentile convention is copied from the shipped
// apps/server/src/latency-performance.test.ts so the numbers are comparable to it:
//   median = sorted[floor(n/2)]   p95 = sorted[ceil(n*0.95)-1]
//
// Usage: node api-arm.mjs <base-url> <fen-file> <pack-dir> [samples]
import { readFile, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const base = process.argv[2] ?? "http://127.0.0.1:4180";
const fenFile = process.argv[3];
const packDir = process.argv[4];
const samples = Number(process.argv[5] ?? 30);

let cookie = "";
async function call(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      "x-writer-id": "k9-harness",
      ...(cookie === "" ? {} : { cookie }),
      ...(init.headers ?? {}),
    },
  });
  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) cookie = setCookie.map((value) => value.split(";")[0]).join("; ");
  const text = await response.text();
  return { status: response.status, body: text === "" ? undefined : JSON.parse(text) };
}

function stats(durations) {
  const sorted = [...durations].sort((left, right) => left - right);
  const round = (value) => Math.round(value * 10) / 10;
  return {
    n: sorted.length,
    minMs: round(sorted[0]),
    medianMs: round(sorted[Math.floor(sorted.length / 2)]),
    p95Ms: round(sorted[Math.ceil(sorted.length * 0.95) - 1]),
    maxMs: round(sorted.at(-1)),
  };
}

async function timed(operation) {
  const started = performance.now();
  await operation();
  return performance.now() - started;
}

const report = {};

async function main() {
  const registration = await call("/auth/register", {
    method: "POST",
    body: JSON.stringify({ handle: `k9api${Date.now().toString(36)}`, password: "k9-probe-password" }),
  });
  if (registration.status !== 201) throw new Error(`register: ${registration.status}`);

  const packs = (await call("/packs")).body.filter((pack) => pack.phase === "endgame");
  const documents = new Map();
  for (const entry of await readdir(packDir)) {
    if (!entry.endsWith(".json")) continue;
    const document = JSON.parse(await readFile(join(packDir, entry), "utf8"));
    documents.set(document.id, document);
  }

  // 1. Library listing and pack projection — the two reads a learner waits on
  //    before a board can exist at all.
  report.packList = stats(await series(samples, () => timed(() => call("/packs"))));
  report.packDetail = stats(
    await series(samples, (index) => timed(() => call(`/packs/${packs[index % packs.length].id}`))),
  );

  // 2. Restart: create a fresh run on an endgame pack. This is the server half
  //    of "tap → board ready" and the direct analogue of CET's position open.
  const created = [];
  report.runCreate = stats(
    await series(samples, async (index) => {
      const pack = packs[index % packs.length];
      let response;
      const duration = await timed(async () => {
        response = await call("/runs", {
          method: "POST",
          body: JSON.stringify({
            id: `k9-run-${Date.now().toString(36)}-${index}`,
            session: { kind: "pack", packId: pack.id, packDigest: pack.digest },
            policyConfig: {
              seedMode: "fixed",
              locus: { executedAt: "server", engineIds: [{ id: "mock-opponent", version: "1" }], modelIds: [] },
            },
            seed: 40_000 + index,
            createdAt: new Date().toISOString(),
          }),
        });
      });
      if (response.status !== 201) throw new Error(`create: ${response.status} ${JSON.stringify(response.body)}`);
      created.push({ packId: pack.id, run: response.body.run });
      return duration;
    }),
  );

  // 3. Graph projection — what the client re-reads to redraw the board and rail.
  report.graphProjection = stats(
    await series(samples, (index) => {
      const run = created[index % created.length].run;
      return timed(() => call(`/runs/${run.id}/graph`));
    }),
  );

  // 4. Commit and rewind on one endgame run, alternating so each rewind has
  //    something to undo. switchBranch IS rewind (session-controller.ts:314-316).
  const target = created[0];
  const document = documents.get(target.packId);
  const firstMove = document.spine[0].moveUci;
  const rootNode = target.run.nodes[0].id;
  const commitDurations = [];
  const rewindDurations = [];
  for (let index = 0; index < samples; index += 1) {
    commitDurations.push(
      await timed(() =>
        call(`/runs/${target.run.id}/moves`, {
          method: "POST",
          body: JSON.stringify({ uci: firstMove, at: new Date().toISOString() }),
        }),
      ),
    );
    rewindDurations.push(
      await timed(() =>
        call(`/runs/${target.run.id}/rewind`, {
          method: "POST",
          body: JSON.stringify({ nodeId: rootNode, at: new Date().toISOString() }),
        }),
      ),
    );
  }
  report.commitMove = stats(commitDurations);
  report.rewind = stats(rewindDurations);

  // 5. Opponent selection, per call, both endgame modes.
  const fens = (await readFile(fenFile, "utf8")).split("\n").filter((line) => line.trim() !== "");
  const digest = packs[0].digest;
  const selectBody = (fen, mode) =>
    JSON.stringify({
      startFen: fen,
      historyUci: [],
      policy: { mode, policyConfigDigest: digest, ...(mode === "human_common" ? { targetElo: 1500 } : {}) },
      seed: 41,
    });

  for (const mode of ["human_common", "perfect_tablebase"]) {
    const chosen = fens.slice(0, samples);
    const uncached = [];
    const failures = [];
    for (const fen of chosen) {
      let response;
      const duration = await timed(async () => {
        response = await call("/select-move", { method: "POST", body: selectBody(fen, mode) });
      });
      if (response.status !== 200) failures.push({ fen, status: response.status, body: response.body });
      else uncached.push(duration);
    }
    const cached = [];
    for (const fen of chosen) {
      let response;
      const duration = await timed(async () => {
        response = await call("/select-move", { method: "POST", body: selectBody(fen, mode) });
      });
      if (response.status === 200) cached.push(duration);
    }
    // A "first probe" of a distinct FEN can still be a process-cache hit: the
    // shipped LichessTablebaseSource keys its cache on transposeKey, so mirrored
    // and transposed positions in the corpus collapse onto one entry. Anything
    // under 5 ms did not leave the process; it is reported separately so no
    // network claim rests on it.
    const network = uncached.filter((value) => value >= 5);
    report[`select_${mode}_uncached`] = {
      ...stats(uncached),
      failed: failures.length,
      attempted: chosen.length,
      ...(network.length === uncached.length
        ? {}
        : { processCacheHits: uncached.length - network.length, networkOnly: stats(network) }),
    };
    report[`select_${mode}_cached`] = stats(cached);
    if (failures.length > 0) report[`select_${mode}_failures`] = failures.slice(0, 3);
  }

  console.log(JSON.stringify(report, null, 2));
  await writeFile(process.env.K9_OUT ?? "k9-api-arm.json", `${JSON.stringify(report, null, 2)}\n`);
}

async function series(count, operation) {
  const durations = [];
  for (let index = 0; index < count; index += 1) durations.push(await operation(index));
  return durations;
}

await main();
