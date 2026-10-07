// rfc/module-registration.md A5/§2.5.2/§5.1, rfc/evidence-presentation.md Checkpoint B and
// rfc/intent-presets.md Checkpoint B: the one module query operation delivers exactly the modules
// the finalized preset compiled, through sealed presentation receipts bound to that digest.
import { describe, expect, it } from "vitest";

import {
  MODULE_SOURCE_AUTHORITY,
  compileAssistanceRequest,
  compileAuthoritativeAssistance,
  finalizeAssistanceEffects,
  serverAvailabilityFromProviders,
  type FinalizedAssistanceV1,
} from "./assistance-exchange.js";
import { canonicalRunStart } from "./session.js";
import { commitMove, createRun, fork, revealFeedback, rewind } from "./runtime.js";
import {
  ModuleQueryError,
  fitModulePresentation,
  moduleDecisionStamp,
  moduleComparisonForSubject,
  moduleDisclosureDigest,
  parseModuleQueryRequest,
  passFen,
  queryModules,
  type ModuleQueryPacket,
  type ModuleQueryRequest,
} from "./module-query.js";
import { assertPresentationText, parsePresentationReceipt, presentedSentence } from "./presentation-contract.js";
import type { OrdinaryWorkflowContextId, OrdinaryWorkflowContextOrigin, PresetId } from "./presets.js";
import type { DrillRun } from "./types.js";

const at = "2026-09-24T00:00:00.000Z";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const digest = `sha256:${"c".repeat(64)}`;
const ALL_AVAILABLE = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
const ORIGINS: Readonly<Record<"onramp" | "position", OrdinaryWorkflowContextOrigin>> = {
  onramp: { kind: "run", sessionKind: "pack", feedbackPolicy: "immediate_guard" },
  position: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
};

function finalized(context: "onramp" | "position", preset: PresetId): FinalizedAssistanceV1 {
  const request = compileAssistanceRequest({ contextHint: context as OrdinaryWorkflowContextId, preference: { kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const authoritative = compileAuthoritativeAssistance(request, { origin: ORIGINS[context], access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability: ALL_AVAILABLE });
  return finalizeAssistanceEffects(authoritative, { authority: MODULE_SOURCE_AUTHORITY, availability: ALL_AVAILABLE });
}

function positionRun(fen: string, moves: readonly string[] = []): DrillRun {
  let run = createRun({ id: `mq-${fen.length}-${moves.length}`, session: { kind: "position", start: canonicalRunStart({ fen, side: fen.split(" ")[1] === "b" ? "black" : "white" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig, seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return run;
}

function packRun(fen: string, moves: readonly string[] = []): DrillRun {
  let run = createRun({ id: `mqp-${fen.length}-${moves.length}`, session: { kind: "pack", packId: "p", packDigest: digest, start: canonicalRunStart({ fen, side: "white" }), feedbackPolicy: "immediate_guard", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig, seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return run;
}

const packetOf = (page: { readonly packets: readonly ModuleQueryPacket[] }, module: string): ModuleQueryPacket | undefined => page.packets.find((packet) => packet.module === module);

/** Every delivered packet parses, reseals, passes the raw-id guard and binds its disclosure digest. */
function assertDelivered(packet: ModuleQueryPacket, assistance: FinalizedAssistanceV1): readonly string[] {
  const items = parsePresentationReceipt(JSON.parse(JSON.stringify(packet.receipt)));
  const sentences = items.map((item) => assertPresentationText(presentedSentence(item)));
  const { digest: recorded, ...body } = packet.disclosure;
  expect(moduleDisclosureDigest(body)).toBe(recorded);
  expect(packet.disclosure.effectiveConfigDigest).toBe(assistance.finalDigest);
  expect(packet.disclosure.componentDigests).toEqual(items.map((item) => item.componentDigest));
  for (const sentence of sentences) expect(sentence).not.toMatch(/Tabiya's|detector|phase bands|\b[a-h][1-8][a-h][1-8][qrbn]?\b/u);
  return sentences;
}

const ITALIAN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5";
const MAROCZY = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";

describe("the module query request boundary", () => {
  it("parses the closed union and refuses crossed, malformed and extra fields", () => {
    expect(parseModuleQueryRequest({ timing: "pre_commit", nodeId: "n", selectedSquare: "e4", requested: ["sight_on_request"] })).toEqual({ timing: "pre_commit", nodeId: "n", selectedSquare: "e4", requested: ["sight_on_request"] });
    expect(() => parseModuleQueryRequest({ timing: "pre_commit", nodeId: "n", selectedSquare: "z9", requested: [] })).toThrow(/MODULE_QUERY_SQUARE/u);
    expect(() => parseModuleQueryRequest({ timing: "at_commit", nodeId: "n", candidateUci: "e2-e4", generation: 0 })).toThrow(/MODULE_QUERY_CANDIDATE/u);
    expect(() => parseModuleQueryRequest({ timing: "post_commit", subjectNodeId: "n", requested: ["ghost"] })).toThrow(/MODULE_QUERY_INVALID/u);
    expect(() => parseModuleQueryRequest({ timing: "review", nodeId: "n", requested: [], effective: "forged" })).toThrow(/unknown request key/u);
  });

  it("derives the decision stamp from the event head, cursor and open disclosure boundary", () => {
    const run = positionRun(ITALIAN);
    const before = moduleDecisionStamp(run);
    const after = moduleDecisionStamp(commitMove(run, "e1g1", { at }).run);
    expect(after.eventHeadSeq).toBeGreaterThan(before.eventHeadSeq);
    expect(after.digest).not.toBe(before.digest);
  });

  it("passes the turn with en passant cleared, and refuses an illegal pass", () => {
    expect(passFen(ITALIAN)).toBe("r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 4 5");
    expect(passFen("4k3/8/8/8/8/8/4q3/4K3 w - - 0 1")).toBeUndefined();
  });
});

describe("Support (position context): sight, threat radar and the at-commit cue", () => {
  const assistance = finalized("position", "support");

  it("sight delivers one square-scoped fact through a sealed square_set", () => {
    const run = positionRun(MAROCZY);
    const request: ModuleQueryRequest = { timing: "pre_commit", nodeId: run.activeCursor.nodeId, selectedSquare: "c4", requested: ["sight_on_request"] };
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", request });
    const sight = packetOf(page, "sight_on_request")!;
    expect(sight).toBeDefined();
    expect(sight.disclosure.boundary).toEqual({ kind: "ephemeral_request" });
    const sentences = assertDelivered(sight, assistance);
    expect(sight.budget.after.facts).toBeLessThanOrEqual(1);
    if (sentences.length === 0) expect(sight.empty).toEqual({ kind: "stated_absence", sentence: "No rung-0 observation is scoped to that square." });
    expect(page.effectiveConfigDigest).toBe(assistance.finalDigest);
  });

  it("threat radar names the opponent's concrete threats only when opened", () => {
    const run = positionRun("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 4 4");
    const closed = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "pre_commit", nodeId: run.activeCursor.nodeId, requested: [] } }).page;
    expect(packetOf(closed, "threat_radar")).toBeUndefined();
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "pre_commit", nodeId: run.activeCursor.nodeId, requested: ["threat_radar"] } });
    const radar = packetOf(page, "threat_radar")!;
    const sentences = assertDelivered(radar, assistance);
    const threat = parsePresentationReceipt(radar.receipt).find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.threats@1");
    expect(threat).toBeDefined();
    expect(presentedSentence(threat!)).toContain("If White could move now:");
    expect(presentedSentence(threat!)).toContain("White's queen on h5 could deliver mate on f7");
    expect(presentedSentence(threat!)).toContain("Only immediate threats are shown; this is not a forced continuation.");
    expect(sentences.join(" ")).not.toMatch(/declared|convention/u);
    expect(threat!.component.id).toBe("fact_statement");
    if (threat!.component.id !== "fact_statement") throw new Error("Expected threat statement");
    expect(threat!.component.operand.convention).toBe("threat-convention@1");
    // Player-facing copy cannot widen the retained horizon or invent an additional claim.
    const forged = JSON.parse(JSON.stringify(radar.receipt)) as { items: { component: { id: string; operand: Record<string, unknown> } }[] };
    const forgedThreat = forged.items.find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.threats@1")!;
    if (forgedThreat.component.id !== "fact_statement") throw new Error("Expected threat statement");
    forgedThreat.component.operand.renderedText = "White will force mate.";
    expect(() => parsePresentationReceipt(forged)).toThrow(/disagrees with its retained operands/u);
  });

  it.each([
    { fen: "7k/8/8/5q2/4B3/8/8/7K b - - 0 1", mover: "White", actor: "White's bishop on e4", target: "Black's queen on f5" },
    { fen: "7k/8/8/4b3/5Q2/8/8/7K w - - 0 1", mover: "Black", actor: "Black's bishop on e5", target: "White's queen on f4" },
  ])("Threat Radar retains both sides' concrete capture witnesses ($mover)", ({ fen, mover, actor, target }) => {
    const run = positionRun(fen);
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "pre_commit", nodeId: run.activeCursor.nodeId, requested: ["threat_radar"] } });
    const radar = packetOf(page, "threat_radar")!;
    const sentences = assertDelivered(radar, assistance);
    expect(sentences.join(" ")).toContain(`If ${mover} could move now: ${actor} could capture ${target}. Only immediate threats are shown; this is not a forced continuation.`);
    const threat = parsePresentationReceipt(radar.receipt).find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.threats@1")!;
    if (threat.component.id !== "fact_statement") throw new Error("Expected threat statement");
    expect(threat.component.operand.convention).toBe("threat-convention@1");
    expect(threat.component.operand.operands).toEqual({ threats: [{ piece: { color: mover.toLowerCase(), role: "bishop" }, from: mover === "White" ? "e4" : "e5", mate: false, target: { color: mover === "White" ? "black" : "white", role: "queen" }, to: mover === "White" ? "f5" : "f4" }] });
    const exposure = parsePresentationReceipt(radar.receipt).find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.loose_pieces@1");
    expect(exposure).toBeDefined();
    expect(presentedSentence(exposure!)).toBe(`${target} can be captured at a material loss (attacked from ${mover === "White" ? "e4" : "e5"}).`);
    expect(presentedSentence(exposure!)).not.toContain(`${actor} can be captured`);
  });

  it.each([
    { fen: "5q1k/8/8/8/4B3/8/8/7K b - - 0 1", move: "f8f5", victim: "Black", square: "f5", attacker: "e4" },
    { fen: "7k/8/8/4b3/8/8/8/5Q1K w - - 0 1", move: "f1f4", victim: "White", square: "f4", attacker: "e5" },
  ])("a staged $victim queen exposure names the learner's piece, not the opponent's", ({ fen, move, victim, square, attacker }) => {
    const run = positionRun(fen);
    const before = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "pre_commit", nodeId: run.activeCursor.nodeId, requested: ["threat_radar"] } }).page;
    expect(packetOf(before, "threat_radar")!.receipt.items.some(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.loose_pieces@1")).toBe(false);
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "at_commit", nodeId: run.activeCursor.nodeId, candidateUci: move, generation: 1 } });
    const warning = packetOf(page, "blunder_prevention")!;
    const threat = parsePresentationReceipt(warning.receipt).find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.staged_threats@1");
    expect(threat, JSON.stringify(warning.budget)).toBeDefined();
    const opponent = victim === "White" ? "Black" : "White";
    expect(presentedSentence(threat!)).toBe(`If ${opponent} moves next: ${opponent}'s bishop on ${attacker} could capture ${victim}'s queen on ${square}.`);
    expect(warning.budget.after.facts).toBe(1);
    expect(warning.budget.after.words).toBeLessThanOrEqual(20);
    expect(warning.budget.dropped).toEqual([]);
    expect(warning.disclosure.subject.candidateUci).toBe(move);
    expect(warning.disclosure.subject.generation).toBe(1);
    assertDelivered(warning, assistance);
    expect(run.activeCursor.nodeId).toBe(warning.disclosure.subject.nodeId);
    expect(run.events.some(event => event.type === "move.committed")).toBe(false);
  });

  it("does not turn a refused hypothetical move into a threat or an all-clear", () => {
    const run = positionRun("4k3/8/8/8/8/8/4q3/4K3 w - - 0 1");
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "pre_commit", nodeId: run.activeCursor.nodeId, requested: ["threat_radar"] } });
    const radar = packetOf(page, "threat_radar")!;
    const items = parsePresentationReceipt(radar.receipt);
    expect(items.some(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.threats@1")).toBe(false);
    expect(radar.unavailable).toContainEqual({ projection: "rules.tactic.consequence.mate_in_one@1", reason: "invalid_turn_clone" });
    expect(assertDelivered(radar, assistance).join(" ")).not.toMatch(/could move now|no threats|safe|all.clear/iu);
  });

  it("blunder prevention warns on a staged move that allows mate and stays silent otherwise", () => {
    const run = positionRun("r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3");
    const risky = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "at_commit", nodeId: run.activeCursor.nodeId, candidateUci: "g8f6", generation: 1 } }).page;
    const cue = packetOf(risky, "blunder_prevention")!;
    expect(cue.disclosure.subject).toEqual({ nodeId: run.activeCursor.nodeId, selectedSquare: null, candidateUci: "g8f6", generation: 1 });
    expect(assertDelivered(cue, assistance).join(" ")).toMatch(/mate on f7/u);
    for (const candidateUci of ["d8e7", "g7g6"]) {
      const quiet = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "at_commit", nodeId: run.activeCursor.nodeId, candidateUci, generation: 2 } }).page;
      const silent = packetOf(quiet, "blunder_prevention")!;
      expect(silent.receipt.items, `defence ${candidateUci}`).toEqual([]);
      expect(silent.empty).toEqual({ kind: "silent" });
      expect(silent.budget.after).toEqual({ facts: 0, words: 0, marks: 0, arrows: 0 });
    }
    expect(() => queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "at_commit", nodeId: run.activeCursor.nodeId, candidateUci: "e1e5", generation: 3 } })).toThrow(ModuleQueryError);
  });

  it("delivers nothing the preset did not compile (Checkpoint B: render set = compiled set)", () => {
    const quiet = finalized("position", "quiet");
    const run = positionRun(MAROCZY);
    const { page } = queryModules({ run, assistance: quiet, role: "learner", session: "position", request: { timing: "pre_commit", nodeId: run.activeCursor.nodeId, selectedSquare: "c4", requested: ["sight_on_request", "threat_radar"] } });
    expect(page.packets).toEqual([]);
    expect(page.suppressions).toEqual([{ module: "sight_on_request", reason: "not_effective" }, { module: "threat_radar", reason: "not_effective" }]);
  });
});

describe("Guide me (on-ramp pack context): structure nudge, theory breadcrumb and compare coach", () => {
  const assistance = finalized("onramp", "guided");

  it("does not present the unchanged kings as consequences of 1.e4", () => {
    const run = packRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", ["e2e4"]);
    const { page } = queryModules({ run, assistance, role: "learner", session: "onramp", request: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } });
    const nudge = packetOf(page, "postcommit_nudge")!;
    const sentences = assertDelivered(nudge, assistance);
    expect(sentences.join(" ")).not.toMatch(/still holds:.*king/iu);
    expect(nudge.receipt.items.every((item) => item.evidenceRef?.projection.id !== "rules.structural.event.king_zone")).toBe(true);
  });

  it("still presents a real king-location change", () => {
    const run = packRun("4k3/8/8/8/8/8/4K3/R7 w - - 0 1", ["e2e1"]);
    const { page } = queryModules({ run, assistance, role: "learner", session: "onramp", request: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } });
    const nudge = packetOf(page, "postcommit_nudge")!;
    expect(assertDelivered(nudge, assistance).join(" ")).toMatch(/king.*e1/iu);
    expect(nudge.empty).toBeNull();
  });

  it("structure nudge delivers one post-commit structure fact", () => {
    const run = packRun("r1bqkbnr/pp1ppppp/2n5/8/2PNP3/8/PP3PPP/RNBQKB1R w KQkq - 1 5", ["b1c3"]);
    const subject = run.activeCursor.nodeId;
    const { page } = queryModules({ run, assistance, role: "learner", session: "onramp", request: { timing: "post_commit", subjectNodeId: subject, requested: [] } });
    const nudge = packetOf(page, "structure_nudge")!;
    expect(nudge.disclosure.boundary.kind).toBe("durable_event");
    const sentences = assertDelivered(nudge, assistance);
    expect(sentences.length).toBeGreaterThan(0);
    expect(packetOf(page, "theory_breadcrumb")).toBeUndefined();
  });

  it("theory breadcrumb states the opening catalogue's absence as its own source result", () => {
    const run = packRun(ITALIAN, ["e1g1"]);
    const { page } = queryModules({ run, assistance, role: "learner", session: "onramp", request: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: ["theory_breadcrumb"] } });
    const theory = packetOf(page, "theory_breadcrumb")!;
    expect(theory.unavailable).toContainEqual({ projection: "theory.opening.current_endpoint@1", reason: "artifact_missing" });
    expect(theory.empty).toEqual({ kind: "stated_absence", sentence: "Nothing is written about this position." });
  });

  it.each(["not_configured", "provider_unavailable", "identity_mismatch"] as const)("keeps matched local theory when optional Explorer evidence is %s", explorerUnavailable => {
    const run = packRun("r1bqkbnr/pp1ppppp/2n5/8/2PNP3/8/PP3PPP/RNBQKB1R w KQkq - 1 5", ["b1c3"]);
    const { page } = queryModules({ run, assistance, role: "learner", session: "onramp",
      request: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: ["theory_breadcrumb"] },
      sources: { explorerUnavailable, shapes: [{ id: "maroczy-bind", trigger: { kind: "feature", feature: { kind: "named_structure", id: "maroczy-bind" } } }] },
    });
    const theory = packetOf(page, "theory_breadcrumb")!;
    expect(theory.unavailable).toContainEqual({ projection: "derived.explorer.population_summary@1", reason: explorerUnavailable });
    expect(theory.empty).toBeNull();
    expect(assertDelivered(theory, assistance).join(" ")).toMatch(/maroczy/iu);
  });

  it("compare coach needs a second attempt, then renders the other attempt's recorded facts", () => {
    let run = packRun(ITALIAN, ["e1g1", "e8g8"]);
    const root = run.nodes.find((node) => node.parentId === null)!.id;
    const alone = queryModules({ run, assistance, role: "learner", session: "onramp", request: { timing: "checkpoint", nodeId: run.activeCursor.nodeId, requested: ["compare_coach"] } }).page;
    expect(alone.suppressions).toContainEqual({ module: "compare_coach", reason: "no_second_attempt" });
    run = rewind(run, root, at).run;
    run = fork(run, root, { at }).run;
    run = commitMove(run, "a2a3", { at }).run;
    const { page } = queryModules({ run, assistance, role: "learner", session: "onramp", request: { timing: "checkpoint", nodeId: run.activeCursor.nodeId, requested: ["compare_coach"] } });
    const coach = packetOf(page, "compare_coach")!;
    const sentences = assertDelivered(coach, assistance);
    expect(sentences.length).toBeGreaterThan(0);
    expect(coach.budget.after.facts).toBeLessThanOrEqual(2);
  });

  it("binds comparison to the active attempt at a shared fork and enters its other continuation, not its leaf", () => {
    let run = packRun(ITALIAN, ["e1g1", "e8g8"]);
    const root = run.nodes[0]!.id;
    const original = run.activeCursor.branchId;
    const firstMove = run.nodes[1]!.id;
    expect(moduleComparisonForSubject(run, root)).toBeUndefined();
    run = fork(rewind(run, root, at).run, root, { at }).run;
    const alternative = run.activeCursor.branchId;
    const shared = moduleComparisonForSubject(run, root)!;
    expect(shared.columns.map(column => column.branchId)).toEqual([alternative, original]);
    expect(shared.rows[0]!.nodes[original]!.id).toBe(firstMove);
    expect(shared.columns[1]!.leafNodeId).not.toBe(firstMove);
    run = commitMove(run, "a2a3", { at }).run;
    const alternativeNode = run.activeCursor.nodeId;
    run = fork(rewind(run, root, at).run, root, { at }).run;
    run = commitMove(run, "b1c3", { at }).run;
    const third = run.activeCursor.branchId;
    expect(moduleComparisonForSubject(run, run.activeCursor.nodeId)!.columns.map(column => column.branchId)).toEqual([third, alternative]);
    expect(moduleComparisonForSubject(run, firstMove)!.columns.map(column => column.branchId)).toEqual([original, third]);
    expect(moduleComparisonForSubject(run, alternativeNode)!.columns.map(column => column.branchId)).toEqual([alternative, third]);
    expect(moduleComparisonForSubject(run, "missing")).toBeUndefined();
  });
});

describe("Analyze: the Full Inspector surface (explicit mode, family-partitioned)", () => {
  it("presents the node's sealed census and states every family, withheld until feedback opens", () => {
    const assistance = finalized("position", "analysis");
    const closed = positionRun(ITALIAN, ["e1g1"]);
    expect(() => queryModules({ run: closed, assistance, role: "learner", session: "position", request: { timing: "review", nodeId: closed.activeCursor.nodeId, requested: ["full_inspector"] } })).toThrow(/MODULE_QUERY_WITHHELD/u);
    const run = revealFeedback(closed, at).run;
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: { timing: "review", nodeId: run.activeCursor.nodeId, requested: ["full_inspector"] } });
    const inspector = packetOf(page, "full_inspector")!;
    const sentences = assertDelivered(inspector, assistance);
    expect(sentences.length).toBeGreaterThan(0);
    expect(inspector.budget.after.facts).toBeLessThanOrEqual(20);
    expect(inspector.empty?.kind).toBe("family_partitioned");
    const families = inspector.empty?.kind === "family_partitioned" ? inspector.empty.families : [];
    expect(families.map((family) => family.family)).toEqual(["local_rules", "authored_theory", "recorded_run", "stockfish", "syzygy", "maia", "explorer", "derived"]);
    expect(families.find((family) => family.family === "local_rules")?.kind).toBe("available");
  });
});

describe("§5.1 the post-adapter budget fit", () => {
  it("drops whole bundles and never back-fills", () => {
    const empty = fitModulePresentation("sight_on_request", []);
    expect(empty.budget).toEqual({ before: { facts: 0, words: 0, marks: 0, arrows: 0 }, after: { facts: 0, words: 0, marks: 0, arrows: 0 }, kept: [], dropped: [] });
  });
});
