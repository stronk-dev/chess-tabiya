// profile-game-facts §1–2. Thin exact-cut source authority: no semantic projector or collectors.
// Only LongitudinalStore imports the issuing authority; worker consumers may read original scopes.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { canonicalFen, positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { recordedEdgePayload } from "../../../packages/runtime/src/recorded-edge.js";
import { readBackReplay } from "../../../packages/runtime/src/replay.js";
import { digestRunEventHead } from "../../../packages/runtime/src/run-subject-digest.js";
import { RECORDED_FOUNDATION_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-foundation-source-authority.js";
import type { FoundationPathMember, FoundationRecordedPrefix } from "../../../packages/runtime/src/recorded-foundation-source.js";
import type { DrillRun, Node } from "@chess-tabiya/runtime";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { parseDecisionRefs, type DecisionRef } from "./longitudinal-contract.js";
import type { FoundationClaimedChoiceDecision } from "../../../packages/runtime/src/recorded-foundation-source.js";

declare const gameSourceBrand: unique symbol;
export interface ProfileGameSource { readonly [gameSourceBrand]: true }
interface GameSourceData {
  readonly image: LongitudinalSourceImageV4;
  readonly run: DrillRun;
  readonly prefix: FoundationRecordedPrefix;
  readonly path: readonly FoundationPathMember[];
  readonly mode: "claim" | "rebuild";
  readonly identity: Readonly<{ derivedRev: number; sourceDigest: `sha256:${string}` }>;
}
interface OwnedSource { readonly data: GameSourceData; readonly check: () => void; retired: boolean }
const sources = new WeakMap<object, OwnedSource>();
const IMMUTABLE_NODE_FIELDS = ["id", "parentId", "fen", "transposeKey", "moveUci", "moveSan", "ply", "actor", "branchId", "createdAt"] as const;
const refuse = (detail: string): never => { throw new TypeError("Profile GAME source: " + detail); };
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export function readProfileGameSource(scope: ProfileGameSource): GameSourceData {
  const owned = sources.get(scope);
  if (owned === undefined || owned.retired) return refuse("not an active original store scope");
  try { owned.check(); return owned.data; }
  catch (error) { owned.retired = true; throw error; }
}

/** Accepted profile-choice-facts: same original worker scope, one proved owner MOVE at a time. */
export function selectProfileChoiceDecision(scope: ProfileGameSource, ref: DecisionRef):
  { readonly kind: "available"; readonly decision: FoundationClaimedChoiceDecision }
  | { readonly kind: "unavailable"; readonly reason: "role_unavailable" } {
  const data = readProfileGameSource(scope), selectedRef = parseDecisionRefs([ref])[0]!;
  if (selectedRef.kind !== "move") return refuse("choice requires an actual owner MOVE");
  const selected = normativeDecisions(data.image, data.run).find(decision => decision.decisionClass === "played"
    && decision.ref.kind === "move" && decision.ref.nodeId === selectedRef.nodeId && decision.ref.eventSeq === selectedRef.eventSeq);
  const index = data.path.findIndex(member => member.nodeId === selectedRef.nodeId);
  const before = data.path[index - 1], after = data.path[index];
  if (selected === undefined || before === undefined || after === undefined
    || after.creation.seq !== selectedRef.eventSeq || before.fen !== selected.beforeFen) return refuse("choice is not its original primary owner decision");
  if (data.image.structureAttribution !== "single_player") return Object.freeze({ kind: "unavailable", reason: "role_unavailable" });
  const decision = RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueClaimedChoiceDecision(data.prefix, {
    ownerLearnerId: data.image.ownerLearnerId, beforeNodeId: before.nodeId, afterNodeId: after.nodeId,
    eventSeq: selectedRef.eventSeq, moveUci: selected.moveUci,
    derivedRev: data.identity.derivedRev, sourceDigest: data.identity.sourceDigest,
  });
  readProfileGameSource(scope);
  return Object.freeze({ kind: "available", decision });
}

/** Subject statistics use ALL authentic normative decisions, including forks/import/predictions.
 * This cheap selector extends the original store scope; population collection stays in the worker. */
export function selectProfileSubjectDecision(scope: ProfileGameSource, ref: DecisionRef) {
  const data = readProfileGameSource(scope), parsed = parseDecisionRefs([ref])[0]!;
  const selected = normativeDecisions(data.image, data.run).find(decision => canonicalizeJson(decision.ref) === canonicalizeJson(parsed));
  if (selected === undefined) return refuse("subject decision is not an original owner decision in this cut");
  const actor = positionFromFen(selected.beforeFen).turn;
  readProfileGameSource(scope);
  return Object.freeze({ decision: selected, actor });
}

/** Private importer audited in evidence-value-authority.test.ts: LongitudinalStore only. */
export const PROFILE_GAME_SOURCE_AUTHORITY = Object.freeze({
  open(image: LongitudinalSourceImageV4, mode: "claim" | "rebuild", check: () => void,
    identity: Readonly<{ derivedRev: number; sourceDigest: `sha256:${string}` }>): ProfileGameSource {
    check();
    if (!Number.isSafeInteger(identity.derivedRev) || identity.derivedRev < 1 || !/^sha256:[a-f0-9]{64}$/u.test(identity.sourceDigest)) return refuse("requires existing original job identity");
    const run = freeze(readBackReplay(image.runPrefix.events).run);
    if (run.id !== image.runPrefix.runId || run.events.at(-1)?.seq !== image.runPrefix.requestedSeq) return refuse("crossed exact cut");
    const creations = new Map<string, { node: Node; ordinal: number; seq: number; type: "run.started" | "move.committed" }[]>();
    for (const [ordinal, event] of run.events.entries()) {
      if (event.type !== "run.started" && event.type !== "move.committed") continue;
      const node = event.type === "run.started" ? event.data.rootNode : event.data.node;
      creations.set(node.id, [...(creations.get(node.id) ?? []), { node, ordinal, seq: event.seq, type: event.type }]);
    }
    const branches = new Set(run.branches.map(branch => branch.id));
    const nodes = new Map(run.nodes.map(node => [node.id, node]));
    if (branches.size !== run.branches.length || nodes.size !== run.nodes.length) return refuse("duplicate graph identity");
    for (const node of run.nodes) {
      if (!branches.has(node.branchId)) return refuse("node names an undeclared branch");
      const matches = creations.get(node.id);
      if (matches?.length !== 1 || IMMUTABLE_NODE_FIELDS.some(key => matches[0]!.node[key] !== node[key])) return refuse("node has no unique original creation identity");
      if (canonicalFen(positionFromFen(node.fen)) !== node.fen) return refuse("noncanonical original graph position");
      // The immutable fields are compared above; later checkpoint/annotation changes are replayed.
      canonicalizeJson(run.events[matches[0]!.ordinal]!);
      if (node.parentId !== null) {
        const parent = nodes.get(node.parentId);
        if (parent === undefined) return refuse("node has no actual original parent");
        // All actual edges, including disconnected/orphaned nodes, precede path selection.
        recordedEdgePayload(run, parent, node);
      }
    }
    for (const branch of run.branches) {
      // Also check branch topology/inheritance; edge legality was already checked once per node.
      branchPath(run, branch.id);
    }
    const primary = run.branches[0];
    if (primary === undefined) return refuse("missing original primary branch");
    const path = Object.freeze(branchPath(run, primary.id).map((node, sourcePly) => {
      const original = creations.get(node.id)![0]!;
      return Object.freeze({ nodeId: node.id, sourcePly, fen: node.fen,
        creation: Object.freeze({ ordinal: original.ordinal, seq: original.seq, type: original.type }) });
    }));
    if (path.length === 0) return refuse("missing original rooted path");
    const scope = Object.freeze({}) as ProfileGameSource;
    // Prefix reads check the same scope, including sticky retirement; they cannot revive it.
    const scopeCheck = () => { readProfileGameSource(scope); };
    // Install data only after prefix construction; its initial check uses the original store check.
    let installed = false;
    const prefix = RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueClaimedGamePrefix(Object.freeze({
      operation: "foundation.recorded_prefix@1", runId: run.id,
      eventHead: Object.freeze({ seq: image.runPrefix.requestedSeq, digest: digestRunEventHead({ runId: run.id, headSeq: image.runPrefix.requestedSeq, events: image.runPrefix.events }) }),
      branchId: primary.id, throughNodeId: path.at(-1)!.nodeId, learnerSide: run.start.side, path,
    }), () => { if (installed) scopeCheck(); else check(); });
    sources.set(scope, { data: Object.freeze({ image, run, prefix, path, mode, identity: Object.freeze({ ...identity }) }), check, retired: false });
    installed = true;
    readProfileGameSource(scope); return scope;
  },
  close(scope: ProfileGameSource): void {
    const owned = sources.get(scope);
    if (owned === undefined) return refuse("foreign scope cannot be closed");
    owned.retired = true;
  },
});
