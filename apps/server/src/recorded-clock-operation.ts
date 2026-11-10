// Accepted recorded-clocks source owner; no public raw-evidence endpoint or factory stub.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { RECORDED_CLOCK_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-clock-source-authority.js";
import { readRecordedClockSource, type RecordedClockSource } from "../../../packages/runtime/src/recorded-clock-source.js";
import { readFoundationRecordedPrefix } from "../../../packages/runtime/src/recorded-foundation-source.js";
import { RecordedFoundationSourceOwner } from "./recorded-foundation-sources.js";
import { requireRead, type Principal } from "./authorization.js";
import { parseRecordedClockGame } from "./pgn-import.js";
import type { RunStorage } from "./storage.js";
import { collectRecordedClockValues } from "../../../packages/runtime/src/recorded-clock-values.js";
import { ServerError } from "./errors.js";

export interface RecordedClockSelection { readonly runId: string; readonly branchId: string; readonly nodeId: string }
export type RecordedClockResolution =
  | Readonly<{ kind: "available"; source: RecordedClockSource }>
  | Readonly<{ kind: "unavailable"; reason: "missing_context" | "source_failed" }>;

function ownStrings(value: unknown, keys: readonly string[]): boolean {
  return value !== null && typeof value === "object" && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => {
      const field = Object.getOwnPropertyDescriptor(value, key); return field?.enumerable && "value" in field && typeof field.value === "string" && field.value.length > 0;
    });
}

export class RecordedClockSourceOwner {
  readonly #foundation: RecordedFoundationSourceOwner;
  readonly #sources = new WeakSet<object>();
  constructor(private readonly storage: RunStorage) { this.#foundation = new RecordedFoundationSourceOwner(storage); }

  resolve(query: RecordedClockSelection, principal: Principal, signal: AbortSignal): RecordedClockResolution {
    if (!(signal instanceof AbortSignal) || !ownStrings(query, ["runId", "branchId", "nodeId"])
      || !ownStrings(principal, ["learnerId", "handle"])) throw new TypeError("Recorded clock requires exact original selection/principal and actual abort signal");
    signal.throwIfAborted();
    const selection = Object.freeze({ ...query }), subject = Object.freeze({ ...principal });
    const original = requireRead(this.storage, selection.runId, subject).stored.run;
    if (original.sessionKind !== "imported") return Object.freeze({ kind: "unavailable", reason: "missing_context" });
    // Account/read/complete graph authority precedes any legacy parse or null metadata transition.
    const prefix = this.#foundation.resolve({ runId: selection.runId, branchId: selection.branchId, throughNodeId: selection.nodeId }, subject, signal);
    if (readFoundationRecordedPrefix(prefix).authority.path.length < 2) return Object.freeze({ kind: "unavailable", reason: "missing_context" });
    const initialRecord = this.storage.importedGame?.(selection.runId);
    if (initialRecord === undefined || initialRecord.clockDocument === null && this.storage.ensureRecordedClockDocument === undefined) return Object.freeze({ kind: "unavailable", reason: "source_failed" });
    const record = initialRecord.clockDocument === null ? this.storage.ensureRecordedClockDocument!(selection.runId) : initialRecord;
    const document = record.clockDocument;
    if (document === null || document.status !== "ready") return Object.freeze({ kind: "unavailable", reason: "source_failed" });
    const p = readFoundationRecordedPrefix(prefix).authority, sourcePly = document.originalNodeIds.indexOf(selection.nodeId);
    if (sourcePly < 1 || sourcePly !== p.path.length - 1 || p.path.some((entry, index) => entry.nodeId !== document.originalNodeIds[index])) return Object.freeze({ kind: "unavailable", reason: "missing_context" });
    // One declared source image: restored metadata cannot contradict its retained PGN headers.
    const parsed = parseRecordedClockGame(record.pgn, { requireMoves: true });
    if (canonicalizeJson(parsed.game.headers) !== canonicalizeJson(record.headers)) throw new TypeError("Recorded clock headers differ from the original PGN");
    const decision = this.#foundation.decision(prefix, document.originalNodeIds[sourcePly - 1]!);
    const recordBytes = canonicalizeJson(record);
    const check = () => {
      signal.throwIfAborted(); this.#foundation.readPrefix(prefix); this.#foundation.readDecision(decision);
      const now = requireRead(this.storage, selection.runId, subject).stored.run;
      if (now !== original || canonicalizeJson(this.storage.importedGame?.(selection.runId)) !== recordBytes) throw new TypeError("Recorded clock original run/import image changed");
    };
    check();
    const source = RECORDED_CLOCK_SOURCE_AUTHORITY.issueClockSource(prefix, decision, document, record.headers, signal, check);
    this.#sources.add(source); this.read(source);
    return Object.freeze({ kind: "available", source });
  }

  read(source: RecordedClockSource) {
    if (!this.#sources.has(source)) throw new TypeError("Recorded clock source belongs to a different owner");
    return readRecordedClockSource(source);
  }
}

export type RecordedClockCollection =
  | Exclude<RecordedClockResolution, { kind: "available" }>
  | Readonly<{ kind: "available" } & ReturnType<typeof collectRecordedClockValues>>;

/** Internal actual-source operation; raw sources are never an API response or learner permission. */
export function recordedClockOperation(storage: RunStorage) {
  const owner = new RecordedClockSourceOwner(storage);
  return (query: RecordedClockSelection, principal: Principal, signal: AbortSignal): RecordedClockCollection => {
    signal.throwIfAborted(); requireRead(storage, query.runId, principal);
    const sourceFailure = (error: unknown): RecordedClockCollection => {
      signal.throwIfAborted();
      if (error instanceof ServerError && ["RUN_NOT_FOUND", "FORBIDDEN", "UNAUTHENTICATED"].includes(error.code)) throw error;
      requireRead(storage, query.runId, principal);
      // No event/document write or terminal cache: failed legacy extraction stays retryable.
      return Object.freeze({ kind: "unavailable", reason: "source_failed" });
    };
    let resolved: RecordedClockResolution;
    try { resolved = owner.resolve(query, principal, signal); } catch (error) { return sourceFailure(error); }
    if (resolved.kind === "unavailable") return resolved;
    const source = resolved.source;
    try {
      const values = collectRecordedClockValues(source); owner.read(source);
      return Object.freeze({ kind: "available", ...values });
    } catch (error) {
      // A later dispatcher/compiler/factory failure is not evidence that the source failed.
      // Convert only when this actual captured source independently fails its live owner check.
      try { owner.read(source); } catch (sourceError) { return sourceFailure(sourceError); }
      throw error;
    }
  };
}
