// Package-private clock input. Only the actual server operation imports its issuer authority.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { evidenceDigest } from "./evidence-contract.js";
import { readRecordedReviewBoundary } from "./recorded-review-boundary.js";
import { readFoundationRecordedPrefix, readFoundationRecordedDecision,
  type FoundationRecordedPrefix, type FoundationRecordedDecision } from "./recorded-foundation-source.js";
import { parseDeclaredTimeControl, type ParsedTimeControl, type StoredClockDocument, type RecordedClockSample, type ClockSampleIssue } from "./recorded-clocks.js";

type ReadyDocument = Extract<StoredClockDocument, { status: "ready" }>;
export type RecordedClockSampleState =
  | Readonly<{ kind: "available"; sample: RecordedClockSample }>
  | Readonly<{ kind: "no_retained_sample" | "unknown_historical_retention" }>
  | Readonly<{ kind: "invalid_or_duplicate_sample"; issue: ClockSampleIssue }>;
export interface RecordedClockAuthority {
  readonly operation: "recorded.clock_source@1";
  readonly subject: Readonly<{ runId: string; branchId: string; nodeId: string; sourceNodeId: string; sourcePly: number;
    eventHead: Readonly<{ seq: number; digest: string }> }>;
  readonly original: Readonly<{ beforeNodeId: string; beforeFen: string; afterFen: string; moveUci: string;
    side: "white" | "black"; eventSeq: number; decisionIndex: number }>;
  readonly importIdentity: Readonly<{ movetextDigest: string; documentDigest: string; declaredControlHeader: string | null }>;
  readonly retention: ReadyDocument["retention"];
  readonly sample: RecordedClockSampleState;
  readonly control: ParsedTimeControl;
  readonly previous: RecordedClockSample | null;
  readonly initialStart: Readonly<{ rootFen: string; setupHeader: string | null; fenHeader: string | null; variantHeader: string | null }>;
  readonly initialBaseEligible: boolean;
}
declare const clockBrand: unique symbol;
export interface RecordedClockSource { readonly [clockBrand]: true }
interface ClockData {
  readonly prefix: FoundationRecordedPrefix;
  readonly decision: FoundationRecordedDecision;
  readonly authority: RecordedClockAuthority;
  readonly signal: AbortSignal;
  readonly check: () => void;
  retired: boolean;
}
const sources = new WeakMap<object, ClockData>();
const refuse = (message: string): never => { throw new TypeError("Recorded clock: " + message); };
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export function isRecordedClockSource(value: unknown): value is RecordedClockSource {
  return value !== null && typeof value === "object" && sources.has(value);
}
export function readRecordedClockSource(source: RecordedClockSource): Readonly<Pick<ClockData, "prefix" | "decision" | "authority">> {
  if (!isRecordedClockSource(source)) return refuse("not issued by the original clock operation");
  const data = sources.get(source)!;
  if (data.retired) return refuse("captured source is retired");
  try {
    data.signal.throwIfAborted();
    if (data.check() !== undefined) return refuse("invalid source-owner currentness check");
    const prefix = readFoundationRecordedPrefix(data.prefix), decision = readFoundationRecordedDecision(data.decision);
    if (decision.authority.prefix !== prefix.authority || decision.authority.selected.nodeId !== data.authority.original.beforeNodeId
      || prefix.authority.throughNodeId !== data.authority.subject.nodeId) return refuse("crossed original decision/prefix");
    if (data.check() !== undefined) return refuse("invalid final source-owner currentness check");
    data.signal.throwIfAborted();
    return Object.freeze({ prefix: data.prefix, decision: data.decision, authority: data.authority });
  } catch (error) { data.retired = true; throw error; }
}

/** Sole production importer: apps/server/src/recorded-clock-operation.ts; no public barrel. */
export const RECORDED_CLOCK_SOURCE_AUTHORITY = Object.freeze({
  issueClockSource(prefix: FoundationRecordedPrefix, decision: FoundationRecordedDecision, document: ReadyDocument,
    headers: Readonly<Record<string, string>>, signal: AbortSignal, check: () => void): RecordedClockSource {
    if (!(signal instanceof AbortSignal) || typeof check !== "function") return refuse("requires actual cancellation and source owner");
    signal.throwIfAborted();
    if (check() !== undefined) return refuse("invalid source-owner check");
    const p = readFoundationRecordedPrefix(prefix);
    if (p.kind !== "live") return refuse("claimed GAME prefixes cannot issue clock decisions");
    const d = readFoundationRecordedDecision(decision), boundary = readRecordedReviewBoundary(p.boundary);
    const selected = boundary.path.at(-1), before = boundary.path.at(-2);
    if (boundary.run.sessionKind !== "imported" || boundary.importRecord === null || selected === undefined || before === undefined
      || selected.creationEvent.type !== "move.committed" || selected.node.moveUci === null
      || d.authority.prefix !== p.authority || d.authority.selected.nodeId !== before.node.id) return refuse("requires exact original incoming move and parent decision");
    const sourcePly = document.originalNodeIds.indexOf(selected.node.id);
    if (sourcePly < 1 || sourcePly !== p.authority.path.length - 1 || document.movetextDigest !== boundary.importRecord.movetextDigest
      || document.originalNodeIds[sourcePly - 1] !== before.node.id
      || boundary.path.some((entry, index) => document.originalNodeIds[index] !== entry.node.id)) return refuse("selected path is not the exact original import map");
    const side = before.node.fen.split(" ")[1] === "w" ? "white" : "black";
    const sample = document.samples.find(row => row.sourcePly === sourcePly), issue = document.issues.find(row => row.sourcePly === sourcePly);
    if (sample !== undefined && (sample.side !== side || sample.moveUci !== selected.node.moveUci)) return refuse("crossed selected clock sample");
    const sampleState: RecordedClockSampleState = sample !== undefined ? { kind: "available", sample }
      : issue !== undefined ? { kind: "invalid_or_duplicate_sample", issue }
        : { kind: document.retention === "legacy_stored_pgn" ? "unknown_historical_retention" : "no_retained_sample" };
    const previous = document.samples.find(row => row.sourcePly === sourcePly - 2) ?? null;
    if (previous !== null && previous.side !== side) return refuse("crossed same-side predecessor");
    const initialBaseEligible = sourcePly <= 2 && (headers.Variant === undefined || headers.Variant === "Standard")
      && headers.FEN === undefined && (headers.SetUp === undefined || headers.SetUp === "0")
      && boundary.path[0]!.node.fen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const authority: RecordedClockAuthority = freeze(structuredClone({ operation: "recorded.clock_source@1", subject: {
      runId: boundary.run.id, branchId: boundary.request.branchId, nodeId: selected.node.id, sourceNodeId: selected.node.id,
      sourcePly, eventHead: boundary.eventHead }, original: { beforeNodeId: before.node.id, beforeFen: before.node.fen,
      afterFen: selected.node.fen, moveUci: selected.node.moveUci, side, eventSeq: selected.creationEvent.seq, decisionIndex: sourcePly - 1 },
      importIdentity: { movetextDigest: document.movetextDigest, documentDigest: evidenceDigest(document), declaredControlHeader: headers.TimeControl ?? null }, retention: document.retention,
      sample: sampleState, control: parseDeclaredTimeControl(headers.TimeControl), previous,
      initialStart: { rootFen: boundary.path[0]!.node.fen, setupHeader: headers.SetUp ?? null, fenHeader: headers.FEN ?? null, variantHeader: headers.Variant ?? null }, initialBaseEligible } as const));
    // The image contains only original numeric/identity/control data, no comments or PGN prose.
    canonicalizeJson(authority);
    const source = Object.freeze({}) as RecordedClockSource;
    sources.set(source, { prefix, decision, authority, signal, check, retired: false });
    readRecordedClockSource(source); return source;
  },
});
