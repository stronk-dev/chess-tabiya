import { createHash } from "node:crypto";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";
import { readBackReplay, type DrillRun, type DrillRunEvent } from "../../packages/runtime/src/index.js";
import ts from "typescript";

import {
  LONGITUDINAL_SOURCE_MUTATION_OPERATIONS,
  type DurableLongitudinalJob,
  type MutationOperation,
} from "../d2598-longitudinal-seventh-author-repair/contract.js";

function fail(code: string): never {
  throw new TypeError(code);
}

function immutable<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T;
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, member]) => [key, immutable(member)]))) as T;
  }
  return value;
}

function iso(value: string, code: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) fail(code);
  return parsed;
}

export type StructureAttribution = "single_player" | "unattributable_shared" | "unattributable_legacy";

export interface MoveAuthorship {
  readonly eventSeq: number;
  readonly nodeId: string;
  readonly learnerId: string | null;
}

export interface LockedSourceRecord {
  readonly run: DrillRun;
  readonly ownerLearnerId: string;
  /** Null is the explicit no-collaboration-journal single-player authority. */
  readonly moveAuthorship: readonly MoveAuthorship[] | null;
  readonly structureAttribution: StructureAttribution;
}

export interface ExactRunPrefix {
  readonly runId: string;
  readonly ownerLearnerId: string;
  readonly requestedSeq: number;
  readonly events: readonly DrillRunEvent[];
}

export interface LongitudinalSourceImageV4 {
  readonly version: 4;
  readonly runPrefix: ExactRunPrefix;
  readonly ownerLearnerId: string;
  readonly moveAuthorship: readonly MoveAuthorship[];
  readonly importedMainlinePlies: number | null;
  readonly structureAttribution: StructureAttribution;
}

const sourceImages = new WeakSet<object>();

function exactAuthorship(
  run: DrillRun,
  prefixEvents: readonly DrillRunEvent[],
  ownerLearnerId: string,
  supplied: readonly MoveAuthorship[] | null,
  structureAttribution: StructureAttribution,
): readonly MoveAuthorship[] {
  const commits = prefixEvents.flatMap((event): readonly { eventSeq: number; nodeId: string }[] =>
    event.type === "move.committed" && event.data.node.actor === "user"
      ? [{ eventSeq: event.seq, nodeId: event.data.node.id }]
      : []);
  if (supplied === null) {
    if (structureAttribution !== "single_player") fail("LONGITUDINAL_AUTHORSHIP_AUTHORITY_MISSING");
    return immutable(commits.map((commit) => ({ ...commit, learnerId: ownerLearnerId })));
  }
  const inPrefix = supplied.filter((entry) => entry.eventSeq <= prefixEvents.length);
  const canonical = [...inPrefix].sort((left, right) => left.eventSeq - right.eventSeq || left.nodeId.localeCompare(right.nodeId));
  if (canonical.length !== commits.length) fail("LONGITUDINAL_AUTHORSHIP_POPULATION_MISMATCH");
  for (const [index, commit] of commits.entries()) {
    const author = canonical[index];
    if (author === undefined || author.eventSeq !== commit.eventSeq || author.nodeId !== commit.nodeId) {
      fail("LONGITUDINAL_AUTHORSHIP_POPULATION_MISMATCH");
    }
    if (structureAttribution === "single_player" && author.learnerId !== ownerLearnerId) {
      fail("LONGITUDINAL_STRUCTURE_AUTHORSHIP_CONTRADICTION");
    }
  }
  return immutable(canonical);
}

function importedBoundary(run: DrillRun): number | null {
  if (run.sessionKind !== "imported") return null;
  const primary = run.branches[0];
  if (primary === undefined) fail("LONGITUDINAL_IMPORTED_MAINLINE_INVALID");
  return run.nodes.reduce((maximum, node) => node.branchId === primary.id ? Math.max(maximum, node.ply) : maximum, 0);
}

/** Disposable analogue of the one SQLite-locked source reader required by the RFC. */
export class LockedLongitudinalSourceStore {
  readonly #records: ReadonlyMap<string, LockedSourceRecord>;

  constructor(records: readonly LockedSourceRecord[]) {
    const entries = records.map((record): readonly [string, LockedSourceRecord] => {
      const replayed = readBackReplay(record.run.events).run;
      if (replayed.id !== record.run.id) fail("LONGITUDINAL_STORED_RUN_ID_MISMATCH");
      return [record.run.id, immutable({
        run: replayed,
        ownerLearnerId: record.ownerLearnerId,
        moveAuthorship: record.moveAuthorship,
        structureAttribution: record.structureAttribution,
      })];
    });
    if (new Set(entries.map(([runId]) => runId)).size !== entries.length) fail("LONGITUDINAL_SOURCE_RUN_DUPLICATE");
    this.#records = new Map(entries);
  }

  sourceImage(runId: string, requestedSeq: number): LongitudinalSourceImageV4 {
    const record = this.#records.get(runId);
    if (record === undefined) fail("LONGITUDINAL_SOURCE_RUN_UNKNOWN");
    if (!Number.isSafeInteger(requestedSeq) || requestedSeq < 1 || requestedSeq > record.run.events.length) {
      fail("LONGITUDINAL_SOURCE_CUT_INVALID");
    }
    const events = immutable(structuredClone(record.run.events.slice(0, requestedSeq)));
    const replayed = readBackReplay(events).run;
    if (replayed.id !== runId || events.at(-1)?.seq !== requestedSeq) fail("LONGITUDINAL_PREFIX_INVALID");
    const authorship = exactAuthorship(
      replayed,
      events,
      record.ownerLearnerId,
      record.moveAuthorship,
      record.structureAttribution,
    );
    const image = immutable({
      version: 4 as const,
      runPrefix: { runId, ownerLearnerId: record.ownerLearnerId, requestedSeq, events },
      ownerLearnerId: record.ownerLearnerId,
      moveAuthorship: authorship,
      importedMainlinePlies: importedBoundary(replayed),
      structureAttribution: record.structureAttribution,
    });
    sourceImages.add(image);
    return image;
  }
}

export function sourceDigestV4(image: LongitudinalSourceImageV4): `sha256:${string}` {
  if (!sourceImages.has(image)) fail("LONGITUDINAL_SOURCE_UNSEALED");
  return `sha256:${createHash("sha256").update("tabiya.longitudinal-source.v4\0", "utf8").update(canonicalizeJson(image), "utf8").digest("hex")}`;
}

function callText(node: ts.CallExpression, source: ts.SourceFile): string {
  return node.expression.getText(source);
}

function stringArgument(node: ts.CallExpression): string | undefined {
  const argument = node.arguments[0];
  return argument !== undefined && ts.isStringLiteral(argument) ? argument.text : undefined;
}

function mutationDescriptor(node: ts.CallExpression, source: ts.SourceFile): MutationOperation | undefined {
  if (callText(node, source) !== "this.#upsertLongitudinalWatermark") return undefined;
  const argument = node.arguments[0];
  if (argument === undefined || !ts.isObjectLiteralExpression(argument)) fail("LONGITUDINAL_MUTATION_DESCRIPTOR_INVALID");
  const values = new Map<string, string>();
  for (const property of argument.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name) || !ts.isStringLiteral(property.initializer)) {
      fail("LONGITUDINAL_MUTATION_DESCRIPTOR_INVALID");
    }
    values.set(property.name.text, property.initializer.text);
  }
  if (values.size !== 2 || !values.has("symbol") || !values.has("effect")) fail("LONGITUDINAL_MUTATION_DESCRIPTOR_INVALID");
  const effect = values.get("effect");
  if (!(["always", "conditional", "suppression", "reconciliation"] as const).includes(effect as MutationOperation["effect"])) {
    fail("LONGITUDINAL_MUTATION_DESCRIPTOR_INVALID");
  }
  return { symbol: values.get("symbol")!, effect: effect as MutationOperation["effect"] } as MutationOperation;
}

/** AST census for the future storage implementation; comments and strings are not syntax nodes. */
export function compileSourceMutationTransactions(sourceText: string): readonly MutationOperation[] {
  const source = ts.createSourceFile("apps/server/src/storage.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const found: MutationOperation[] = [];
  const classes = source.statements.filter(ts.isClassDeclaration).filter((node) => node.name?.text === "SQLiteRunStorage");
  if (classes.length !== 1) fail("LONGITUDINAL_STORAGE_CLASS_INVALID");
  const storage = classes[0]!;
  for (const member of storage.members) {
    if (!ts.isMethodDeclaration(member) || member.body === undefined) continue;
    const calls: ts.CallExpression[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) calls.push(node);
      ts.forEachChild(node, visit);
    };
    visit(member.body);
    for (const [index, call] of calls.entries()) {
      const descriptor = mutationDescriptor(call, source);
      if (descriptor === undefined) continue;
      const begin = calls.slice(0, index).some((candidate) => callText(candidate, source) === "this.#database.exec" && stringArgument(candidate) === "BEGIN IMMEDIATE");
      const commit = calls.slice(index + 1).some((candidate) => callText(candidate, source) === "this.#database.exec" && stringArgument(candidate) === "COMMIT");
      const methodName = member.name.getText(source).replace(/^#/, "");
      if (!begin || !commit || descriptor.symbol !== `SQLiteRunStorage#${methodName}`) {
        fail("LONGITUDINAL_MUTATION_TRANSACTION_INVALID");
      }
      found.push(descriptor);
    }
  }
  const keys = found.map((row) => `${row.symbol}\0${row.effect}`);
  const expected = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => `${row.symbol}\0${row.effect}`);
  if (new Set(keys).size !== keys.length || canonicalizeJson([...keys].sort()) !== canonicalizeJson([...expected].sort())) {
    fail("LONGITUDINAL_MUTATION_OPERATION_MISMATCH");
  }
  return immutable(found);
}

export interface CompleteClaimReceipt {
  readonly runId: string;
  readonly learnerId: string;
  readonly claimedRequestedSeq: number;
  readonly claimedSourceDigest: `sha256:${string}`;
  readonly derivedRev: number;
  readonly generation: number;
  readonly token: string;
  readonly worker: string;
}

export function assertCurrentClaim(
  job: DurableLongitudinalJob,
  receipt: CompleteClaimReceipt,
  currentSource: LongitudinalSourceImageV4,
  now: string,
): void {
  const currentDigest = sourceDigestV4(currentSource);
  if (
    job.state !== "running" ||
    job.runId !== receipt.runId ||
    job.learnerId !== receipt.learnerId ||
    job.runId !== currentSource.runPrefix.runId ||
    job.learnerId !== currentSource.ownerLearnerId ||
    job.requestedSeq !== receipt.claimedRequestedSeq ||
    job.claimedRequestedSeq !== receipt.claimedRequestedSeq ||
    currentSource.runPrefix.requestedSeq !== receipt.claimedRequestedSeq ||
    job.requestedSourceDigest !== receipt.claimedSourceDigest ||
    job.claimedSourceDigest !== receipt.claimedSourceDigest ||
    currentDigest !== receipt.claimedSourceDigest ||
    job.derivedRev !== receipt.derivedRev ||
    job.claimGeneration !== receipt.generation ||
    job.claimToken !== receipt.token ||
    job.claimedBy !== receipt.worker ||
    iso(job.leaseExpiresAt, "LONGITUDINAL_LEASE_INVALID") <= iso(now, "LONGITUDINAL_CLOCK_INVALID")
  ) fail("LONGITUDINAL_STALE_CLAIM");
}

export function invalidateForSourceImage(
  job: DurableLongitudinalJob,
  prior: LongitudinalSourceImageV4,
  next: LongitudinalSourceImageV4,
): DurableLongitudinalJob {
  if (
    job.runId !== prior.runPrefix.runId || job.learnerId !== prior.ownerLearnerId ||
    job.runId !== next.runPrefix.runId || job.learnerId !== next.ownerLearnerId
  ) fail("LONGITUDINAL_SOURCE_JOB_SUBJECT_MISMATCH");
  const priorDigest = sourceDigestV4(prior);
  if (job.requestedSourceDigest !== priorDigest) fail("LONGITUDINAL_PRIOR_DIGEST_MISMATCH");
  const nextDigest = sourceDigestV4(next);
  if (nextDigest === priorDigest) return job;
  return immutable({
    runId: job.runId,
    learnerId: job.learnerId,
    requestedSeq: next.runPrefix.requestedSeq,
    requestedSourceDigest: nextDigest,
    completedSeq: 0,
    derivedRev: job.derivedRev,
    claimGeneration: job.claimGeneration + 1,
    retryCount: 0,
    state: "pending" as const,
    claimedRequestedSeq: null,
    claimedSourceDigest: null,
    claimToken: null,
    claimedBy: null,
    leaseExpiresAt: null,
    nextAttemptAt: null,
    failureCode: null,
  });
}
