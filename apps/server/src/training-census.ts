import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The training-methods pack census (rfc/return-scheduling.md §10), as a procedure rather than a
 * grep: walk every JSON file under the content root, keep top-level objects carrying all of `mode`,
 * `opponentPolicy` and `objective`, then count the named dimensions. A grep for a mode name counts
 * prose and sidecars too; that is how a wrong count reached the ledger.
 */
export interface TrainingCensus {
  readonly jsonFiles: number;
  readonly packFiles: readonly string[];
  readonly mode: Readonly<Record<string, number>>;
  readonly rootOpponentPolicy: Readonly<Record<string, number>>;
  readonly checkpointInteractions: Readonly<Record<string, number>>;
  readonly timingWindows: number;
  readonly timingWindowVerdictPacks: number;
  readonly retryVariants: number;
  readonly concepts: number;
}

type JsonRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function jsonFiles(root: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(root).sort()) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) output.push(...jsonFiles(path));
    else if (entry.endsWith(".json")) output.push(path);
  }
  return output;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function walk(value: unknown, visit: (record: JsonRecord) => void): void {
  if (Array.isArray(value)) for (const item of value) walk(item, visit);
  else if (isRecord(value)) {
    visit(value);
    for (const item of Object.values(value)) walk(item, visit);
  }
}

export function trainingCensus(contentRoot: string): TrainingCensus {
  const files = jsonFiles(contentRoot);
  const packFiles: string[] = [];
  const mode: Record<string, number> = {};
  const rootOpponentPolicy: Record<string, number> = {};
  const checkpointInteractions: Record<string, number> = {};
  let timingWindows = 0, timingWindowVerdictPacks = 0, retryVariants = 0, concepts = 0;
  for (const file of files) {
    let document: unknown;
    try { document = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    if (!isRecord(document) || !("mode" in document) || !("opponentPolicy" in document) || !("objective" in document)) continue;
    packFiles.push(relative(contentRoot, file));
    increment(mode, String(document.mode));
    if (isRecord(document.opponentPolicy)) increment(rootOpponentPolicy, String(document.opponentPolicy.mode));
    if (Array.isArray(document.checkpoints)) {
      for (const checkpoint of document.checkpoints) {
        if (isRecord(checkpoint) && isRecord(checkpoint.interaction)) increment(checkpointInteractions, String(checkpoint.interaction.type));
      }
    }
    if (Array.isArray(document.timingWindows) && document.timingWindows.length > 0) timingWindows += 1;
    let verdictArm = false;
    walk(document, (record) => {
      if (isRecord(record.atWindow) && "verdict" in record.atWindow) verdictArm = true;
    });
    if (verdictArm) timingWindowVerdictPacks += 1;
    if (Array.isArray(document.retryVariants) && document.retryVariants.length > 0) retryVariants += 1;
    if (Array.isArray(document.concepts) && document.concepts.length > 0) concepts += 1;
  }
  return Object.freeze({
    jsonFiles: files.length,
    packFiles: Object.freeze(packFiles),
    mode: Object.freeze(mode),
    rootOpponentPolicy: Object.freeze(rootOpponentPolicy),
    checkpointInteractions: Object.freeze(checkpointInteractions),
    timingWindows,
    timingWindowVerdictPacks,
    retryVariants,
    concepts,
  });
}
