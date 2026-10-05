// Explicit, resumable offline research execution. No production bot policy or evidence mint.
import { open, readFile, unlink } from "node:fs/promises";
import { EngineSupervisor, binaryArtifactProbe } from "../../apps/server/src/engine-supervisor.js";
import type { EngineOptionImage } from "../../packages/runtime/src/index.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { providerOperationDescriptors } from "../../apps/server/src/provider-operations.js";
import { populationReceipt } from "./receipt.js";
import {
  OPERATION, TIMEOUT_MS, EvaluationWriter, freshSearchClient, inspectJournal,
  instrumentDigest, makeHeader, makeRecord, rootRequest, type ResetWitness,
} from "./evaluation.js";

const directory = ".cache/bot-calibration";
const journalPath = `${directory}/human-reference-pricing.jsonl`;
// Exclusive writer guard; no automatic deletion of a possibly live writer's lock.
const lock = await open(`${journalPath}.lock`, "wx");
await lock.writeFile(`${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`);
const command = process.env.BOT_CALIBRATION_SF_CMD ?? process.env.SF_CMD;
const engines = new EngineSupervisor(command ? [{
  id: "stockfish-analysis", kind: "judge", command,
  options: { Threads: 1, Hash: 16 }, transcriptCapacity: 1000,
}] : [], { artifactProbe: binaryArtifactProbe });
let writer: EvaluationWriter | undefined;
const cancellation = new AbortController();
const stop = () => cancellation.abort();
process.once("SIGINT", stop); process.once("SIGTERM", stop);
try {
  if (!command) throw new TypeError("SF_CMD must identify the actual Stockfish 18 executable");
  const population = JSON.parse(await readFile(`${directory}/human-reference-population.json`, "utf8"));
  const receipt = populationReceipt(population);
  const executorDigest = await instrumentDigest();
  let inspected;
  try { inspected = await inspectJournal(journalPath, population.rows, receipt.populationDigest, executorDigest); }
  catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  let header = inspected?.header;
  const completed = inspected?.counts.decisions ?? 0;
  if (completed === population.rows.length) {
    process.stdout.write(`All ${completed} decisions already independently verified; no search rerun.\n`);
  } else {
    const identity = await engines.start("stockfish-analysis");
    if (identity.name !== "Stockfish" || identity.version !== "18") throw new TypeError("analysis requires the actual Stockfish 18 handshake");
    let reset: ResetWitness | undefined;
    let optionImage: EngineOptionImage | undefined;
    const freshEngine = freshSearchClient(engines, (value) => { reset = value; }, (value) => { optionImage = value; });
    const descriptors = providerOperationDescriptors({ engines: freshEngine, tablebaseFetch: null, explorerFetch: null, explorerToken: null });
    const started = performance.now();
    process.stdout.write(`Verified resume prefix: ${completed}/${population.rows.length}; pricing exact legal roots.\n`);
    for (let index = completed; index < population.rows.length; index += 1) {
      if (cancellation.signal.aborted) throw new Error("research execution cancelled; verified journal preserved");
      reset = undefined; optionImage = undefined;
      // A fresh scheduler deliberately cannot substitute a retained root for the required reset.
      const scheduler = new ProviderExchangeScheduler({ descriptors, maxActive: 1, maxQueued: 1,
        maxRetainedEntries: 1, maxRetainedWeight: 256, retentionTtlMs: 1,
        monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString() });
      const decision = population.rows[index];
      const result = await scheduler.get({ operation: OPERATION, request: rootRequest(decision.fen) },
        { id: `D3407-human-${index}`, budgetMs: TIMEOUT_MS }, cancellation.signal);
      if (result.kind !== "success" || !reset || !optionImage) throw new Error(`decision ${index} refused: ${JSON.stringify(result)}`);
      const liveHeader = makeHeader(receipt.populationDigest, executorDigest, result.delivery.acquisition.actualIdentity, optionImage);
      if (header && JSON.stringify(header) !== JSON.stringify(liveHeader)) throw new TypeError("live engine/options/parser differs from resumable journal");
      if (!writer) {
        header = liveHeader;
        writer = inspected ? await EvaluationWriter.resume(journalPath, inspected.chain) : await EvaluationWriter.create(journalPath, header);
      }
      await writer.append(makeRecord(header!, index, decision, result.delivery, reset));
      if ((index + 1) % 100 === 0 || index + 1 === population.rows.length) process.stdout.write(
        `${index + 1}/${population.rows.length} saved (${((performance.now() - started) / 1000).toFixed(1)}s this execution)\n`);
    }
    await writer?.close(); writer = undefined;
    const final = await inspectJournal(journalPath, population.rows, receipt.populationDigest, executorDigest);
    if (final.counts.decisions !== population.rows.length) throw new TypeError("incomplete final population");
    process.stdout.write(`${JSON.stringify({ state: "priced_not_calibrated", ...final.counts, journalDigest: final.chain })}\n`);
  }
} finally {
  await writer?.close();
  await engines.shutdown();
  process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop);
  await lock.close(); await unlink(`${journalPath}.lock`);
}
