// rfc/hint-distance.md — Guided Hint: the horizon selector, the per-rung disclosure compiler, the
// module packet, the deterministic renderers, the voice check and the delivery-receipt compiler.
//
// Law 8 holds by construction: every sentence below is a fixed template over the fields of one sealed,
// redacted disclosure packet, which is itself computed by the value authority from one sealed searched
// line and one sealed family source. No LLM selects a family, relation, rung or mark, and an optional
// voice paraphrase can only be checked against — never substituted for — the deterministic sentence.
//
// Hypothetical-line semantics stay separately typed (recorded-semantic-path D7): the horizon reads the
// live searched principal variation and the shared candidate packet, never a `run.record.*` projection.

import { assertCandidatePopulationReceipt, candidatePlayedRow, type CandidatePopulationReceipt } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import {
  assertDeclaredEvidence,
  assertRenderedEvidenceView,
  evidenceDigest,
  evidenceForConsumer,
  renderEvidenceItems,
  type DeclaredEvidence,
  type EvidenceRendererRegistry,
  type EvidenceRole,
  type RenderedEvidenceView,
} from "./evidence-contract.js";
import { hintReceiptDigest, parseHintDeliveryReceipt, type HintDecisionStamp, type HintDeliveryMarks, type HintDeliveryReceipt, type HintEmptyReason, type HintVoiceState } from "./hint-exchange.js";
import { HintHorizonMismatch, searchedEdges, type HintDisclosurePayload, type HintHorizonOccurrence, type HintPieceIdentity } from "./hint-horizon.js";
import {
  HINT_DISCLOSURE_PROJECTION_IDS,
  HINT_FAMILIES,
  HINT_SEARCH_SOURCE,
  HINT_SELECTION_ORDER,
  hintDisclosureIdentity,
  hintDisclosureProjectionId,
  hintHorizonProjectionId,
  type HintDisclosureProjectionId,
  type HintFamily,
  type HintRung,
} from "./hint-registry.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { compileModulePacket } from "./module-packets.js";
import { BANNED_JUDGEMENTS, voiceCheck, type VoiceCheckResult } from "./voice.js";
import type { SemanticEvidenceEvent } from "./semantic-evidence.js";

/** The compiler identity carried by every receipt; moving construction semantics moves this literal. */
export const HINT_COMPILER_VERSION = "guided_hint_compiler@1" as const;
/**
 * The forced-mate proof horizon the hint path requests. 2026-09-24 implementation choice: two attacker
 * moves keeps the proof inside the interaction budget (§10); a proof is still a proof, and the deeper
 * horizon is the §10 latency receipt's question, not a silent widening.
 */
export const HINT_FORCED_MATE_ATTACKER_MOVES = 2 as const;

const invoke = (route: string, inputs: unknown): unknown => invokeEvidenceValueRoute(route as EvidenceValueRoute, inputs as never);

// ---------------------------------------------------------------------------------------------
// §1 — the horizon authority and its private seal.

export interface HintRootIdentity {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly fen: string;
  readonly eventHeadSeq: number;
}

/** The ACTUAL sealed values the horizon is built from (§1). Digests are receipts, never substitutes. */
export interface HintHorizonAuthority {
  readonly root: HintRootIdentity;
  /** One sealed `live.stockfish.principal_variation@1` delivery for exactly the root FEN. */
  readonly line: DeclaredEvidence<unknown>;
  /** One original wide candidate-packet receipt for every scanned root-side before position. */
  readonly packets: readonly CandidatePopulationReceipt[];
}

export type SealedHintHorizon = DeclaredEvidence<HintHorizonOccurrence>;

interface HorizonOwner {
  readonly root: HintRootIdentity;
  readonly line: DeclaredEvidence<unknown>;
  readonly packet: CandidatePopulationReceipt;
  readonly source: DeclaredEvidence<unknown>;
}

const HORIZON_OWNERS = new WeakMap<object, HorizonOwner>();
const DISCLOSURES = new WeakSet<object>();

export type HintHorizonSelection =
  | { readonly kind: "selected"; readonly horizon: SealedHintHorizon; readonly admitted: number }
  | { readonly kind: "empty"; readonly reason: HintEmptyReason; readonly admitted: 0 };

function assertLine(line: DeclaredEvidence<unknown>): { readonly fen: string; readonly movesUci: readonly string[] } {
  assertDeclaredEvidence(line);
  if (line.projection.id !== HINT_SEARCH_SOURCE.id || line.projection.version !== HINT_SEARCH_SOURCE.version) throw new HintHorizonMismatch(`the searched line must be ${HINT_SEARCH_SOURCE.id}@${HINT_SEARCH_SOURCE.version}`);
  const payload = (line.payload as { readonly payload?: { readonly fen?: unknown; readonly movesUci?: unknown } }).payload;
  if (typeof payload?.fen !== "string" || !Array.isArray(payload.movesUci)) throw new HintHorizonMismatch("the searched line carries no principal variation");
  return payload as { readonly fen: string; readonly movesUci: readonly string[] };
}

/** The before positions whose complete packets the selector needs: the root side's plies 1 and 3. */
export function hintPacketRoots(line: DeclaredEvidence<unknown>): readonly string[] {
  const pv = assertLine(line);
  const replay = searchedEdges(pv as never);
  return Object.freeze(replay.edges.filter((edge) => edge.ply === 1 || edge.ply === 3).map((edge) => edge.beforeFen));
}

function eventSources(row: { readonly events: readonly SemanticEvidenceEvent[] }, projectionId: string): readonly DeclaredEvidence<unknown>[] {
  return row.events.filter((event) => event.projection.id === projectionId && event.projection.version === 1).map((event) => event.evidence);
}

function readingSources(row: { readonly readings: readonly DeclaredEvidence<unknown>[] }, projectionId: string): readonly DeclaredEvidence<unknown>[] {
  return row.readings.filter((reading) => reading.projection.id === projectionId && reading.projection.version === 1);
}

/**
 * The exact family sources of one searched edge. Events and child readings are the ORIGINAL values the
 * packet retained (reference identity); the before-position mate reading and the bounded mate proof
 * are minted by their own registered value routes over that same exact edge.
 */
function familySources(family: HintFamily, beforeFen: string, row: { readonly events: readonly SemanticEvidenceEvent[]; readonly readings: readonly DeclaredEvidence<unknown>[] }): readonly DeclaredEvidence<unknown>[] {
  switch (family) {
    case "mate_in_one":
      return eventSources(row, "rules.transition.event.checkmate").length === 0 ? [] : [invoke("rules.tactic.consequence.mate_in_one@1", { fen: beforeFen }) as DeclaredEvidence<unknown>];
    case "forced_mate": {
      const breadth = eventSources(row, "rules.tactic.consequence.reply_breadth")[0];
      if (breadth === undefined) return [];
      const proof = invoke("rules.tactic.consequence.forced_mate_after_move@1", { beforeFen, breadth, maxAttackerMoves: HINT_FORCED_MATE_ATTACKER_MOVES }) as { readonly kind: string; readonly value?: DeclaredEvidence<unknown> };
      return proof.kind === "available" && proof.value !== undefined ? [proof.value] : [];
    }
    case "double_attack": return eventSources(row, "rules.tactic.event.double_attack");
    case "fork_survives_reply": return readingSources(row, "derived.tactic.fork_survives_reply");
    case "discovered_executed": return eventSources(row, "derived.tactic.discovered_executed");
    case "loose_piece": return eventSources(row, "rules.tactic.event.loose_piece");
    case "promotion_pressure": return readingSources(row, "derived.tactic.promotion_pressure");
  }
}

/**
 * §1/§2: builds every admitted horizon of the searched line and selects one by the fixed product
 * convention (family order, then relation, ply, target squares, edge and occurrence digest). The order
 * resolves presentation contention only; it never means best, strongest or causal. Opponent plies are
 * never scanned, so no opponent-line occurrence can be admitted or change the selection.
 */
export function selectHintHorizon(authority: HintHorizonAuthority): HintHorizonSelection {
  const pv = assertLine(authority.line);
  const replay = searchedEdges(pv as never);
  if (replay.rootFen !== searchedEdges({ fen: authority.root.fen, movesUci: [] } as never).rootFen) throw new HintHorizonMismatch("the searched line is not for the requested root position");
  for (const receipt of authority.packets) assertCandidatePopulationReceipt(receipt);
  const packetFor = (beforeFen: string): CandidatePopulationReceipt => {
    const receipt = authority.packets.find((candidate) => candidate.packet.beforeFen === beforeFen && candidate.selectedMember === "events_and_readings");
    if (receipt === undefined) throw new HintHorizonMismatch(`no complete candidate packet was supplied for ${beforeFen}`);
    return receipt;
  };
  const rootPacket = authority.packets.find((candidate) => candidate.packet.beforeFen === replay.rootFen);
  if (rootPacket?.packet.terminal !== undefined) return Object.freeze({ kind: "empty", reason: "terminal_position", admitted: 0 });
  const candidates: { readonly horizon: SealedHintHorizon; readonly owner: HorizonOwner; readonly key: readonly (number | string)[] }[] = [];
  for (const edge of replay.edges) {
    if (edge.ply !== 1 && edge.ply !== 3) continue;
    const receipt = packetFor(edge.beforeFen);
    // Exact legal membership: the searched move must be a row of the complete legal population.
    const row = candidatePlayedRow(receipt, edge.moveUci);
    for (const family of HINT_FAMILIES) {
      for (const source of familySources(family, edge.beforeFen, row)) {
        const result = invoke(`${hintHorizonProjectionId(family)}@1`, { line: authority.line, source, ply: edge.ply }) as { readonly kind: string; readonly value?: SealedHintHorizon };
        if (result.kind !== "available" || result.value === undefined) continue;
        const occurrence = result.value.payload;
        candidates.push({
          horizon: result.value,
          owner: Object.freeze({ root: authority.root, line: authority.line, packet: receipt, source }),
          key: [HINT_SELECTION_ORDER.indexOf(family), occurrence.relation === "root_direct" ? 0 : 1, occurrence.occurrencePly, occurrence.targetSquares.join(","), edge.moveUci, evidenceDigest(occurrence)],
        });
      }
    }
  }
  if (candidates.length === 0) return Object.freeze({ kind: "empty", reason: "no_admitted_occurrence", admitted: 0 });
  const compare = (left: readonly (number | string)[], right: readonly (number | string)[]): number => {
    for (let index = 0; index < left.length; index += 1) {
      const a = left[index]!, b = right[index]!;
      if (a === b) continue;
      return typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
    }
    return 0;
  };
  candidates.sort((left, right) => compare(left.key, right.key));
  const chosen = candidates[0]!;
  HORIZON_OWNERS.set(chosen.horizon, chosen.owner);
  return Object.freeze({ kind: "selected", horizon: chosen.horizon, admitted: candidates.length });
}

/** The owner tuple recorded for a selected horizon (operator diagnostics and tests only). */
export function hintHorizonOwner(horizon: SealedHintHorizon): Readonly<{ runId: string; nodeId: string; packetId: string; sourceProjection: string }> | undefined {
  const owner = HORIZON_OWNERS.get(horizon);
  return owner === undefined ? undefined : Object.freeze({ runId: owner.root.runId, nodeId: owner.root.nodeId, packetId: owner.packet.packet.id, sourceProjection: `${owner.source.projection.id}@${owner.source.projection.version}` });
}

// ---------------------------------------------------------------------------------------------
// §3 — the per-rung disclosure compiler and its brand.

/**
 * The only public constructor of a learner disclosure. It accepts only a horizon this process's
 * selector minted AND owns: a correctly sealed horizon minted outside `selectHintHorizon` (e.g. from a
 * rebuilt occurrence) is refused before disclosure ([[D1640]]).
 */
export function compileHintDisclosure(horizon: SealedHintHorizon, rung: HintRung): DeclaredEvidence<HintDisclosurePayload> {
  assertDeclaredEvidence(horizon);
  if (!HORIZON_OWNERS.has(horizon)) throw new HintHorizonMismatch("the horizon was not selected and owned by this process's selector");
  const family = horizon.payload.family;
  if (horizon.projection.id !== hintHorizonProjectionId(family)) throw new HintHorizonMismatch("the horizon projection does not name its own family");
  const disclosure = invoke(`${hintDisclosureProjectionId(family, rung)}@1`, { horizon }) as DeclaredEvidence<HintDisclosurePayload>;
  DISCLOSURES.add(disclosure);
  return disclosure;
}

/** The disclosure brand: a runtime property backed by a private WeakSet, never a structural shape. */
export function assertHintDisclosurePacket(value: unknown): asserts value is DeclaredEvidence<HintDisclosurePayload> {
  assertDeclaredEvidence(value);
  if (!DISCLOSURES.has(value) || hintDisclosureIdentity(value.projection.id) === undefined) throw new TypeError("HINT_DISCLOSURE_UNSEALED: value was not minted by compileHintDisclosure");
}

// ---------------------------------------------------------------------------------------------
// §4 — deterministic rendering. One canonical sentence per rung; no judgement or prescription word.

const FAMILY_LABEL: Readonly<Record<HintFamily, string>> = Object.freeze({
  mate_in_one: "a mate in one",
  forced_mate: "a proved forced mate",
  double_attack: "a double attack",
  fork_survives_reply: "a double attack that still stands after every reply",
  discovered_executed: "a discovered attack",
  loose_piece: "a way to take one of your capturable pieces out of capture",
  promotion_pressure: "a promotion path that every reply leaves open",
});

const squareList = (squares: readonly string[]): string => squares.length === 1 ? squares[0]! : `${squares.slice(0, -1).join(", ")} and ${squares[squares.length - 1]!}`;
const pieceText = (piece: HintPieceIdentity): string => `your ${piece.role} on ${piece.square}`;

/** The canonical sentence of one redacted packet. Unit of the table is the rung; total five. */
export function hintSentence(payload: HintDisclosurePayload): string {
  const parts = [`A ${payload.attribution.engine} search from here (${payload.attribution.bound}) finds ${FAMILY_LABEL[payload.family]} for you.`];
  if (payload.rung !== "pattern") parts.push(`It involves ${squareList(payload.targetSquares)}.`);
  if (payload.rung === "piece" || payload.rung === "distance" || payload.rung === "move") parts.push(`The piece involved is ${pieceText(payload.actor)}.`);
  if (payload.rung === "distance" || payload.rung === "move") parts.push(payload.relation === "root_direct" ? "It appears after this move." : "It appears on your next turn in this searched line.");
  if (payload.rung === "move") parts.push(`The searched line starts with ${payload.firstMove.san}.`);
  return parts.join(" ");
}

/** One registered renderer per disclosure projection (35), set-equal to the registry. */
export const HINT_DISCLOSURE_RENDERERS: EvidenceRendererRegistry = Object.freeze(Object.fromEntries(HINT_DISCLOSURE_PROJECTION_IDS.map((projection) => [
  `${projection.id}@${projection.version}`,
  (evidence: DeclaredEvidence<unknown>) => Object.freeze([hintSentence(evidence.payload as HintDisclosurePayload)]),
])));

// ---------------------------------------------------------------------------------------------
// The module packet: exactly one admitted, rendered item per request.

export type GuidedHintPacket =
  | { readonly kind: "rendered"; readonly view: RenderedEvidenceView; readonly disclosure: DeclaredEvidence<HintDisclosurePayload> }
  | { readonly kind: "refused"; readonly reason: string };

/** `module.guided_hint`'s production operation (MODULE_OPERATIONS): admit one disclosure, render it. */
export function compileGuidedHintPacket(input: { readonly disclosure: DeclaredEvidence<HintDisclosurePayload>; readonly role: EvidenceRole; readonly session: string }): GuidedHintPacket {
  assertHintDisclosurePacket(input.disclosure);
  const packet = compileModulePacket({ module: "guided_hint", timing: "checkpoint", role: input.role, session: input.session, evidence: [input.disclosure], mode: "admit" });
  if (packet.kind === "refused") return Object.freeze({ kind: "refused", reason: packet.reason });
  if (packet.facts.length !== 1 || packet.facts[0]!.evidence !== input.disclosure) return Object.freeze({ kind: "refused", reason: "disclosure_not_admitted" });
  const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.guided_hint", version: 1 }, [input.disclosure]);
  return Object.freeze({ kind: "rendered", view: renderEvidenceItems(view, HINT_DISCLOSURE_RENDERERS), disclosure: input.disclosure });
}

// ---------------------------------------------------------------------------------------------
// §4 — the optional voice check over the same one-item view.

const CAUSALITY = Object.freeze(["because", "sets up", "set up", "prepares", "prevents", "leads to", "so that", "in order to", "wins"]);
const EXTRA_JUDGEMENTS = Object.freeze(["best", "forced", "winning", "good", "should", "recommended", "strongest"]);

/**
 * §4: the paraphrase must not name a square, piece, ply or move absent from the rung, a different move,
 * a judgement or prescription word, or causality for a later-line occurrence, unless the canonical
 * sentence itself carries that exact word.
 */
export function hintVoiceCheck(view: RenderedEvidenceView, output: string): VoiceCheckResult {
  assertRenderedEvidenceView(view);
  if (view.items.length !== 1) return Object.freeze({ valid: false, violations: Object.freeze(["packet:not_one_item"]) });
  const base = voiceCheck(view, output);
  const canonical = view.items[0]!.sentences.join(" ").toLowerCase();
  const lower = output.toLowerCase();
  const violations = [...base.violations];
  for (const word of [...CAUSALITY, ...EXTRA_JUDGEMENTS, ...BANNED_JUDGEMENTS]) {
    if (new RegExp(`\\b${word}\\b`, "u").test(lower) && !new RegExp(`\\b${word}\\b`, "u").test(canonical)) violations.push(`hint:${word}`);
  }
  return Object.freeze({ valid: violations.length === 0, violations: Object.freeze([...new Set(violations)].sort()) });
}

// ---------------------------------------------------------------------------------------------
// §4 — the delivery receipt compiler (server-local; the only thing that crosses REST).

function marksOf(payload: HintDisclosurePayload): HintDeliveryMarks {
  const piece = (actor: HintPieceIdentity) => Object.freeze({ color: actor.color, role: actor.role, square: actor.square });
  switch (payload.rung) {
    case "pattern": return Object.freeze({ rung: "pattern" });
    case "square": return Object.freeze({ rung: "square", squares: Object.freeze([...payload.targetSquares]) });
    case "piece": return Object.freeze({ rung: "piece", squares: Object.freeze([...payload.targetSquares]), piece: piece(payload.actor) });
    case "distance": return Object.freeze({ rung: "distance", squares: Object.freeze([...payload.targetSquares]), piece: piece(payload.actor) });
    case "move": return Object.freeze({ rung: "move", squares: Object.freeze([...payload.targetSquares]), piece: piece(payload.actor), arrow: Object.freeze({ from: payload.firstMove.uci.slice(0, 2), to: payload.firstMove.uci.slice(2, 4) }) });
  }
}

export function compileHintDeliveryReceipt(input: {
  readonly requestId: string;
  readonly runId: string;
  readonly decision: HintDecisionStamp;
  readonly packet: Extract<GuidedHintPacket, { readonly kind: "rendered" }>;
  readonly voice: HintVoiceState;
}): HintDeliveryReceipt {
  assertRenderedEvidenceView(input.packet.view);
  assertHintDisclosurePacket(input.packet.disclosure);
  const item = input.packet.view.items[0];
  if (input.packet.view.items.length !== 1 || item === undefined || item.evidence !== input.packet.disclosure) throw new TypeError("HINT_RECEIPT_INVALID: the rendered view is not exactly the one admitted disclosure");
  const payload = input.packet.disclosure.payload;
  const identity = hintDisclosureIdentity(input.packet.disclosure.projection.id)!;
  const body: Omit<HintDeliveryReceipt, "receiptDigest"> = {
    version: 1,
    requestId: input.requestId,
    runId: input.runId,
    decision: input.decision,
    rung: identity.rung,
    family: identity.family,
    projectionId: input.packet.disclosure.projection.id as HintDisclosureProjectionId,
    disclosureDigest: evidenceDigest(payload),
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    rendered: { source: "deterministic", sentence: item.sentences.join(" "), voice: input.voice },
    marks: marksOf(payload),
  };
  const receipt = JSON.parse(JSON.stringify({ ...body, receiptDigest: hintReceiptDigest(JSON.parse(JSON.stringify(body)) as typeof body) })) as unknown;
  return Object.freeze(parseHintDeliveryReceipt(receipt));
}

/**
 * Seals one scheduler-delivered `stockfish.principal_variation@1` result as the horizon's searched
 * line, through the one provider source route (the server holds no mint authority of its own).
 */
export function hintSearchLineEvidence(delivery: unknown): DeclaredEvidence<unknown> {
  return invoke(`${HINT_SEARCH_SOURCE.id}@${HINT_SEARCH_SOURCE.version}`, { delivery }) as DeclaredEvidence<unknown>;
}
