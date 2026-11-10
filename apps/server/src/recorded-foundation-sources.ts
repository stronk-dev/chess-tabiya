// Foundation §§3.8c-e: original source/recorded actor context. No assistance/consumer permission.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { canonicalFen, positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { recordedEdgePayload } from "../../../packages/runtime/src/recorded-edge.js";
import { readBackReplay } from "../../../packages/runtime/src/replay.js";
import { canonicalRunBytes, createRecordedReviewBoundarySourceOwner } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { RECORDED_FOUNDATION_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-foundation-source-authority.js";
import { readFoundationRecordedPrefix, readFoundationRecordedDecision, type FoundationRecordedPrefix, type FoundationRecordedDecision } from "../../../packages/runtime/src/recorded-foundation-source.js";
import { contextualizeRecordedStyleOccurrence, recordedStyleOccurrenceInput, preflightRecordedStyleOccurrenceSource, type RecordedStyleSelection, type RecordedStyleOccurrenceResult } from "../../../packages/runtime/src/recorded-foundation-occurrence.js";
import type { DeclaredEvidence } from "@chess-tabiya/runtime";
import { parseRecordedClockGame } from "./pgn-import.js";
import { originalImportNodes, recordedMovetextDigest } from "./recorded-clock-document.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { parseStoredBotEnvelope } from "./bot-opponent-operation.js";
import { requireRead, type Principal } from "./authorization.js";
import type { RunStorage } from "./storage.js";

export interface FoundationPrefixSelection { readonly runId: string; readonly branchId: string; readonly throughNodeId: string }
const refuse = (message: string): never => { throw new TypeError("Recorded foundation owner: " + message); };
export class RecordedFoundationSourceOwner {
  readonly #boundaries: ReturnType<typeof createRecordedReviewBoundarySourceOwner>;
  readonly #prefixes = new WeakSet<object>();
  readonly #decisions = new WeakSet<object>();
  constructor(private readonly storage: RunStorage) {
    this.#boundaries = createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run, loadImportRecord: id => {
      const record = storage.importedGame?.(id);
      return record === undefined ? undefined : { runId: record.runId, result: record.result, movetextDigest: record.movetextDigest };
    } });
  }
  resolve(query: FoundationPrefixSelection, principal: Principal, signal: AbortSignal): FoundationRecordedPrefix {
    if (!(signal instanceof AbortSignal)) return refuse("requires actual request cancellation");
    if (principal === null || typeof principal !== "object" || Reflect.ownKeys(principal).length !== 2
      || !["learnerId", "handle"].every(key => {
        const field = Object.getOwnPropertyDescriptor(principal, key); return field?.enumerable && "value" in field && typeof field.value === "string" && field.value.length > 0;
      })) return refuse("requires the actual current principal");
    if (query === null || typeof query !== "object" || Reflect.ownKeys(query).length !== 3
      || !["runId", "branchId", "throughNodeId"].every(key => {
        const field = Object.getOwnPropertyDescriptor(query, key); return field?.enumerable && "value" in field && typeof field.value === "string" && field.value.length > 0;
      })) return refuse("requires exact original run/branch/endpoint selection");
    const selection = Object.freeze({ ...query }), owner = Object.freeze({ ...principal });
    const current = () => {
      signal.throwIfAborted();
      const account = this.storage.learnerById?.(owner.learnerId);
      if (account === undefined || account.id !== owner.learnerId || account.handle !== owner.handle) return refuse("account is no longer current");
      const access = requireRead(this.storage, selection.runId, owner);
      return { access, signature: canonicalizeJson({ principal: owner, role: access.role,
        owner: this.storage.ownerLearnerId?.(selection.runId) ?? null, run: canonicalRunBytes(access.stored.run) }) };
    };
    const first = current(), run = first.access.stored.run;
    if (canonicalRunBytes(readBackReplay(run.events).run) !== canonicalRunBytes(run)) return refuse("full snapshot differs from original event replay");
    // The lower boundary's edge pass covers selected/imported paths, not unrelated branches.
    for (const branch of run.branches) {
      const nodes = branchPath(run, branch.id);
      for (const [index, node] of nodes.entries()) {
        if (canonicalFen(positionFromFen(node.fen)) !== node.fen) return refuse("noncanonical original graph position");
        if (index > 0) recordedEdgePayload(run, nodes[index - 1]!, node);
      }
    }
    const check = () => { if (current().signature !== first.signature) refuse("original run/account/read permission changed"); signal.throwIfAborted(); };
    check();
    const boundary = this.#boundaries.resolve(selection);
    check();
    const prefix = RECORDED_FOUNDATION_SOURCE_AUTHORITY.issuePrefix(boundary, signal, check);
    this.#prefixes.add(prefix); this.readPrefix(prefix); return prefix;
  }
  decision(prefix: FoundationRecordedPrefix, nodeId: string): FoundationRecordedDecision {
    this.readPrefix(prefix);
    const decision = RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueDecision(prefix, nodeId);
    this.#decisions.add(decision); this.readDecision(decision); return decision;
  }
  readPrefix(prefix: FoundationRecordedPrefix) {
    if (!this.#prefixes.has(prefix)) return refuse("foreign prefix issuer");
    const data = readFoundationRecordedPrefix(prefix);
    if (data.kind !== "live") return refuse("claimed GAME prefix is not a live source");
    return data;
  }
  readDecision(decision: FoundationRecordedDecision) {
    if (!this.#decisions.has(decision)) return refuse("foreign decision issuer");
    return readFoundationRecordedDecision(decision);
  }
  contextualize(value: DeclaredEvidence<unknown>, selection: RecordedStyleSelection): RecordedStyleOccurrenceResult {
    if (selection === null || typeof selection !== "object") return refuse("requires a closed occurrence selection");
    const kind = Object.getOwnPropertyDescriptor(selection, "kind");
    if (kind === undefined || !("value" in kind) || !["candidate", "position", "baseline"].includes(kind.value)) return refuse("invalid occurrence selection kind");
    const keys = kind.value === "baseline" ? ["kind", "prefix"] : kind.value === "position" ? ["kind", "decision", "positionPhase"] : ["kind", "decision"];
    if (Reflect.ownKeys(selection).length !== keys.length || !keys.every(key => {
      const field = Object.getOwnPropertyDescriptor(selection, key); return field?.enumerable && "value" in field;
    }) || selection.kind === "position" && selection.positionPhase !== "before" && selection.positionPhase !== "after") return refuse("invalid closed occurrence selection fields");
    selection = Object.freeze({ ...selection });
    const input = recordedStyleOccurrenceInput(value);
    if (input.kind !== selection.kind) return refuse("source does not belong to the selected occurrence kind");
    let decision: FoundationRecordedDecision;
    if (selection.kind === "baseline") {
      const prefix = this.readPrefix(selection.prefix);
      if (input.kind !== "baseline" || input.prefix !== selection.prefix) return refuse("baseline requires its identical original prefix");
      const first = prefix.authority.path.find(member => positionFromFen(member.fen).turn === prefix.authority.learnerSide);
      if (first === undefined) return refuse("genuine baseline has no original first decision");
      decision = this.decision(selection.prefix, first.nodeId);
    } else {
      this.readDecision(selection.decision); decision = selection.decision;
      if (input.kind === "candidate" && input.decision !== undefined && input.decision !== decision) return refuse("early queen requires its identical original decision");
    }
    const d = this.readDecision(decision), prefix = this.readPrefix(d.prefix);
    preflightRecordedStyleOccurrenceSource(value, selection);
    const after = prefix.authority.path[d.authority.selected.sourcePly + 1];
    if (after === undefined) return Object.freeze({ kind: "unavailable", reason: selection.kind === "baseline" ? "first_decision_pending" : "pending_decision" });
    const image = readRecordedReviewBoundary(prefix.boundary), child = image.path[after.sourcePly];
    if (child?.creationEvent.type !== "move.committed" || child.node.parentId !== d.authority.selected.nodeId || child.node.moveUci === null) return refuse("missing exact outgoing event");
    const eventSeq = child.creationEvent.seq, run = image.run, expectedOwner = this.storage.ownerLearnerId?.(run.id);
    const unavailable = (reason: "historical_actor_unproved" | "unsupported_actor_context") => Object.freeze({ kind: "unavailable" as const, reason });
    const actor = () => {
      this.readDecision(decision);
      let originalImport: string | null = null;
      if (run.sessionKind === "imported") {
        const record = this.storage.importedGame?.(run.id);
        if (record === undefined) return refuse("original import record is unavailable");
        const parsed = parseRecordedClockGame(record.pgn, { requireMoves: true });
        if (recordedMovetextDigest(parsed.game) !== record.movetextDigest) return refuse("original import movetext differs");
        const original = originalImportNodes(run, parsed);
        originalImport = canonicalizeJson({ pgn: record.pgn, movetextDigest: record.movetextDigest,
          nodeIds: original.map(node => node.id) });
        const index = original.findIndex(node => node.id === child.node.id);
        if (index > 0 && original[index - 1]?.id === d.authority.selected.nodeId) {
          this.readDecision(decision);
          return Object.freeze({ kind: "available" as const, actorClass: "imported" as const, proof: originalImport });
        }
      }
      const selected = run.events[child.creationEventOrdinal - 1];
      if (child.node.actor === "opponent" || selected?.type === "opponent.move_selected") {
        if (selected?.type !== "opponent.move_selected" || selected.seq + 1 !== eventSeq
          || run.events[child.creationEventOrdinal] !== child.creationEvent
          || selected.data.nodeId !== d.authority.selected.nodeId || selected.data.branchId !== child.node.branchId
          || selected.data.moveUci !== child.node.moveUci || selected.data.selection.moveUci !== child.node.moveUci
          || child.node.actor !== "opponent" || positionFromFen(d.authority.selected.fen).turn === run.start.side) {
          return refuse("bot selection crosses its original BEFORE/branch/move/opponent side");
        }
        const profile = run.opponentPolicy.profile, policy = selected.data.selection.policy;
        if (profile === undefined && policy === undefined) return unavailable("unsupported_actor_context");
        if (profile === undefined || policy === undefined) return refuse("bot profile and stored selection policy must both exist");
        // Existing durable reconstruction only: this does not invent a pre-commit head proof.
        const envelope = parseStoredBotEnvelope(run, selected);
        this.readDecision(decision);
        return Object.freeze({ kind: "available" as const, actorClass: "opponent" as const,
          proof: canonicalizeJson({ selection: selected, envelope, originalImport }) });
      }
      if (this.storage.longitudinalSourceImageV4 === undefined || this.storage.longitudinalSourceDigestV4 === undefined || expectedOwner === undefined) return unavailable("historical_actor_unproved");
      const current = this.storage.longitudinalSourceImageV4(run.id, prefix.authority.eventHead.seq);
      const digest = this.storage.longitudinalSourceDigestV4(current);
      if (current.runPrefix.runId !== run.id || current.runPrefix.requestedSeq !== prefix.authority.eventHead.seq
        || current.ownerLearnerId !== expectedOwner || this.storage.ownerLearnerId?.(run.id) !== expectedOwner
        || canonicalizeJson(current.runPrefix.events) !== canonicalizeJson(run.events)) return refuse("actor source crosses the actual full original run/head/owner");
      const authored = normativeDecisions(current, run).find(row => row.ref.kind === "move" && row.ref.eventSeq === eventSeq
        && row.ref.nodeId === child.node.id && row.beforeFen === d.authority.selected.fen && row.moveUci === child.node.moveUci);
      if (authored === undefined) {
        const recorded = current.moveAuthorship.find(row => row.eventSeq === eventSeq && row.nodeId === child.node.id);
        return unavailable(recorded?.learnerId != null && recorded.learnerId !== expectedOwner ? "unsupported_actor_context" : "historical_actor_unproved");
      }
      // Author identity does not establish learner role in a coached/shared session.
      if (current.structureAttribution !== "single_player") return unavailable("unsupported_actor_context");
      this.readDecision(decision);
      return Object.freeze({ kind: "available" as const, actorClass: "learner" as const, proof: canonicalizeJson({ digest, originalImport }) });
    };
    const original = actor();
    if (original.kind === "unavailable") return original;
    const check = () => {
      this.readDecision(decision);
      const current = actor();
      if (current.kind !== "available" || current.actorClass !== original.actorClass || current.proof !== original.proof) return refuse("original historical actor authority changed");
    };
    const context = RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueOccurrenceContext(decision,
      selection.kind === "position" ? { kind: "position", positionPhase: selection.positionPhase } : { kind: selection.kind }, original.actorClass, check);
    const occurrence = contextualizeRecordedStyleOccurrence(context, value);
    check(); return Object.freeze({ kind: "available", occurrence });
  }
}
