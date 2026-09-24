// rfc/longitudinal-store.md §C — the normative V4 source image and its sole digest constructor.
//
// [[D3001]]: the ninth author repair forked this identity to an undeclared V5. Implementation keeps
// the normative V4 interface and the literal `tabiya.longitudinal-source.v4\0` domain.
import { createHash } from "node:crypto";

import { readBackReplay, type DrillRun, type DrillRunEvent } from "@chess-tabiya/runtime";
import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";

import { LongitudinalContractError, type LongitudinalStructureAttribution } from "./longitudinal-contract.js";

export const LONGITUDINAL_SOURCE_DOMAIN = "tabiya.longitudinal-source.v4\0";

export interface ExactRunPrefix {
  readonly runId: string;
  readonly requestedSeq: number;
  /** Recursively copied `DrillRunEvent[0..requestedSeq)` from the locked stored snapshot. */
  readonly events: readonly DrillRunEvent[];
}

export interface MoveAuthorship {
  readonly eventSeq: number;
  readonly nodeId: string;
  /** Null is a durable "no provable author" fact; it never admits a decision. */
  readonly learnerId: string | null;
}

export interface LongitudinalSourceImageV4 {
  readonly version: 4;
  readonly runPrefix: ExactRunPrefix;
  readonly ownerLearnerId: string;
  readonly moveAuthorship: readonly MoveAuthorship[];
  readonly importedMainlinePlies: number | null;
  readonly structureAttribution: LongitudinalStructureAttribution;
}

/** Snapshot-level refusals are `snapshot_invalid`: unchanged corrupt bytes cannot heal. */
export class LongitudinalSnapshotError extends LongitudinalContractError {
  constructor(code: string, detail?: string) {
    super(code, detail === undefined ? code : `${code}: ${detail}`);
    this.name = "LongitudinalSnapshotError";
  }
}

function snapshotFail(code: string, detail?: string): never {
  throw new LongitudinalSnapshotError(code, detail);
}

/** image -> the issuing store authority. Raw, spread, cross-store or mutated objects have no entry. */
const SEALED = new WeakMap<object, object>();

function deepCopyFreeze<T>(value: T): T {
  const copy = structuredClone(value);
  const freeze = (candidate: unknown): void => {
    if (candidate !== null && typeof candidate === "object") {
      Object.freeze(candidate);
      for (const child of Object.values(candidate as Record<string, unknown>)) freeze(child);
    }
  };
  freeze(copy);
  return copy;
}

export function userCommitsInPrefix(events: readonly DrillRunEvent[]): readonly { readonly eventSeq: number; readonly nodeId: string }[] {
  return events.flatMap((event) => event.type === "move.committed" && event.data.node.actor === "user"
    ? [{ eventSeq: event.seq, nodeId: event.data.node.id }] : []);
}

export function importedMainlinePlies(run: DrillRun): number | null {
  if (run.sessionKind !== "imported") return null;
  const primary = run.branches[0];
  if (primary === undefined) snapshotFail("LONGITUDINAL_IMPORTED_MAINLINE_INVALID");
  return run.nodes.reduce((maximum, node) => (node.branchId === primary.id ? Math.max(maximum, node.ply) : maximum), 0);
}

/**
 * Seals an image for one issuing store. The caller (the storage owner) supplies the locked row facts;
 * this constructor replays the exact prefix and enforces every cross-field invariant before sealing.
 */
export function sealLongitudinalSourceImageV4(authority: object, input: {
  readonly runId: string;
  readonly requestedSeq: number;
  readonly storedEvents: readonly DrillRunEvent[];
  readonly ownerLearnerId: string;
  readonly moveAuthorship: readonly MoveAuthorship[];
  readonly structureAttribution: LongitudinalStructureAttribution;
}): LongitudinalSourceImageV4 {
  if (!Number.isSafeInteger(input.requestedSeq) || input.requestedSeq < 1 || input.requestedSeq > input.storedEvents.length) {
    snapshotFail("LONGITUDINAL_SOURCE_CUT_INVALID", `cut ${input.requestedSeq} of ${input.storedEvents.length}`);
  }
  const events = input.storedEvents.slice(0, input.requestedSeq);
  events.forEach((event, index) => {
    if (event.seq !== index + 1) snapshotFail("LONGITUDINAL_SOURCE_PREFIX_NONCONTIGUOUS", `event ${index} has seq ${String(event.seq)}`);
  });
  let replayed: DrillRun;
  try {
    replayed = readBackReplay(events).run;
  } catch (error) {
    snapshotFail("LONGITUDINAL_SOURCE_REPLAY_FAILED", error instanceof Error ? error.message : String(error));
  }
  if (replayed.id !== input.runId || replayed.events.at(-1)?.seq !== input.requestedSeq) snapshotFail("LONGITUDINAL_SOURCE_SUBJECT_MISMATCH");
  const commits = userCommitsInPrefix(events);
  const authorship = [...input.moveAuthorship];
  if (authorship.length !== commits.length) snapshotFail("LONGITUDINAL_AUTHORSHIP_POPULATION_MISMATCH");
  authorship.forEach((row, index) => {
    const commit = commits[index]!;
    if (row.eventSeq !== commit.eventSeq || row.nodeId !== commit.nodeId) snapshotFail("LONGITUDINAL_AUTHORSHIP_POPULATION_MISMATCH");
    if (row.learnerId !== null && (typeof row.learnerId !== "string" || row.learnerId.length === 0)) snapshotFail("LONGITUDINAL_AUTHORSHIP_ROW_INVALID");
  });
  if (input.structureAttribution === "single_player" && authorship.some((row) => row.learnerId !== input.ownerLearnerId)) {
    snapshotFail("LONGITUDINAL_STRUCTURE_AUTHORSHIP_CONTRADICTION");
  }
  const image: LongitudinalSourceImageV4 = deepCopyFreeze({
    version: 4 as const,
    runPrefix: { runId: input.runId, requestedSeq: input.requestedSeq, events },
    ownerLearnerId: input.ownerLearnerId,
    moveAuthorship: authorship.map((row) => ({ eventSeq: row.eventSeq, nodeId: row.nodeId, learnerId: row.learnerId })),
    importedMainlinePlies: importedMainlinePlies(replayed),
    structureAttribution: input.structureAttribution,
  });
  SEALED.set(image, authority);
  return image;
}

export function sealedImageAuthority(image: unknown): object | undefined {
  return image !== null && typeof image === "object" ? SEALED.get(image) : undefined;
}

/**
 * The sole digest constructor: `sha256(domain ‖ RFC-8785(image))`. Only a sealed image has digest
 * authority; job state, clocks and claim fields cannot enter it because they are not image fields.
 */
export function longitudinalSourceDigestV4(image: LongitudinalSourceImageV4): `sha256:${string}` {
  if (sealedImageAuthority(image) === undefined) throw new LongitudinalContractError("LONGITUDINAL_SOURCE_IMAGE_UNSEALED");
  return `sha256:${createHash("sha256").update(LONGITUDINAL_SOURCE_DOMAIN, "utf8").update(canonicalizeJson(image as unknown as JsonValue), "utf8").digest("hex")}`;
}
