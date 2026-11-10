// D3715: actual canonical query/current+ancestor admission. No collector qualification.
import { isDeepStrictEqual } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as packets from "./module-packets.js";
import { exactLegalMoves } from "./legal-moves.js";
import { commitMove, createRun, revealFeedback } from "./runtime.js";
import { canonicalRunStart } from "./session.js";
import { queryModules, witnessedEvidence } from "./module-query.js";
import { MODULE_IDS } from "./module-contract.js";
import { compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, serverAvailabilityFromProviders } from "./assistance-exchange.js";
import { postcommitEdgeEvidence, POSTCOMMIT_STRUCTURAL_CHANGE_REFS } from "./postcommit-nudge.js";
import { MODULE_CONSUMER_ACCEPTS, STRUCTURAL_EVENT_PROJECTION_IDS } from "./evidence-catalog.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { DeclaredEvidence } from "./evidence-contract.js";

const at = "2026-11-04T00:00:00.000Z";
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {},
  moduleOverrides: { include: [], exclude: MODULE_IDS.filter(id => id !== "rules_floor" && id !== "postcommit_nudge") } } });
const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(requested, { origin: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
  access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
const structural = new Set(["king_zone", "passed_pawn"].map(family => `rules.structural.event.${family}@1`));
const key = (item: DeclaredEvidence<unknown>) => `${item.projection.id}@${item.projection.version}`;
function unchanged(item: DeclaredEvidence<unknown>): boolean {
  if (!structural.has(key(item))) return false;
  const payload = item.payload as { readonly before: unknown; readonly after: unknown };
  return isDeepStrictEqual(payload.before, payload.after);
}
function line(fen: string, moves: readonly string[]) {
  const side = fen.split(" ")[1] === "w" ? "white" : "black";
  let run = createRun({ id: `change-${fen}-${moves.join("-")}`, session: { kind: "position", start: canonicalRunStart({ fen, side }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at, actor: (run.nodes.at(-1)!.fen.split(" ")[1] === "w" ? "white" : "black") === side ? "user" : "system" }).run;
  return revealFeedback(run, at).run;
}
const query = (run: ReturnType<typeof line>) => queryModules({ run, assistance, role: "learner", session: "position",
  request: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } });
afterEach(() => vi.restoreAllMocks());

describe("D3715 change selection before actual Nudge admission", () => {
  it("pins the exact two retained generic structural refs; current native sources have their own guards", () => {
    const families: ReadonlySet<string> = new Set(STRUCTURAL_EVENT_PROJECTION_IDS);
    const accepted = MODULE_CONSUMER_ACCEPTS.postcommit_nudge.filter(ref => ref.version === 1 && families.has(ref.id)).map(ref => `${ref.id}@${ref.version}`);
    expect([...POSTCOMMIT_STRUCTURAL_CHANGE_REFS].sort()).toEqual([...structural].sort());
    expect([...POSTCOMMIT_STRUCTURAL_CHANGE_REFS].sort()).toEqual(accepted.sort());
    expect(accepted).toHaveLength(2);
  });
  it.each([
    ["locked White", "7k/pppppppp/PPPPPPPP/8/8/8/3N4/K7 w - - 0 1"],
    ["locked Black", "7k/3n4/8/8/8/pppppppp/PPPPPPPP/K7 b - - 0 1"],
    ["pawn-free White", "7k/7n/8/8/3N4/8/8/K7 w - - 0 1"],
    ["pawn-free Black", "7k/8/8/3n4/8/8/N7/K7 b - - 0 1"],
  ])("%s preserves every complete source but never admits an unchanged structural state", (_name, fen) => {
    const capture = vi.spyOn(packets, "compileModulePacket");
    const legal = exactLegalMoves(fen); expect(legal.length).toBeGreaterThan(0);
    for (const move of legal) {
      const run = line(fen, [move.uci]), saved = JSON.stringify(run);
      const original = postcommitEdgeEvidence(run, run.nodes[0]!, run.nodes[1]!);
      // No unchanged retained source is required in locked or pawn-free positions.
      if (move.role === "knight") expect(original.filter(unchanged)).toEqual([]);
      capture.mockClear(); const actual = query(run);
      const current = capture.mock.calls.find(([request]) => request.module === "postcommit_nudge" && request.mode !== "admit")![0];
      expect(current.evidence.filter(unchanged), move.uci).toEqual([]);
      expect(current.evidence).toEqual(original.filter(witnessedEvidence).filter(item => !unchanged(item)));
      expect(postcommitEdgeEvidence(run, run.nodes[0]!, run.nodes[1]!)).toEqual(original);
      expect(actual.page.packets.map(packet => packet.module)).toEqual(["postcommit_nudge"]);
      expect(JSON.stringify(run)).toBe(saved);
    }
  });
  it.each([false, true])("filters an actual unchanged passer from earlier and current learner admissions, mirrored=%s", black => {
    const fen = "7k/8/8/8/8/8/P2N4/7K w - - 0 1";
    const moves = ["d2f3", "h8g8", "f3d2"];
    const run = line(black ? mirrorSemanticFen(fen, "color_and_vertical") : fen,
      moves.map(move => black ? mirrorSemanticUci(move, "color_and_vertical") : move));
    const capture = vi.spyOn(packets, "compileModulePacket"); query(run);
    const ancestors = capture.mock.calls.filter(([request]) => request.module === "postcommit_nudge" && request.mode === "admit");
    expect(ancestors).toHaveLength(1);
    expect(ancestors[0]![0].evidence.filter(unchanged)).toEqual([]);
    const current = capture.mock.calls.find(([request]) => request.mode !== "admit")![0];
    expect(current.ancestorFacts).toHaveLength(1);
    expect(current.ancestorFacts![0]!.map(fact => fact.evidence).filter(unchanged)).toEqual([]);
    const original = postcommitEdgeEvidence(run, run.nodes[0]!, run.nodes[1]!);
    expect(original.filter(unchanged).some(item => key(item) === "rules.structural.event.passed_pawn@1")).toBe(true);
    expect(postcommitEdgeEvidence(run, run.nodes.at(-2)!, run.nodes.at(-1)!).some(unchanged)).toBe(true);
    expect(ancestors[0]![0].evidence).toEqual(original.filter(witnessedEvidence).filter(item => !unchanged(item)));
  });
  it.each([false, true])("keeps actual changed counts, gained/lost observations and equal-magnitude identities (mirrored=%s)", black => {
    const capture = vi.spyOn(packets, "compileModulePacket");
    const mirrorFen = (fen: string) => black ? mirrorSemanticFen(fen, "color_and_vertical") : fen;
    const mirrorMove = (move: string) => black ? mirrorSemanticUci(move, "color_and_vertical") : move;
    const run = line(mirrorFen("7k/p7/8/2p5/3PP3/8/8/K7 w - - 0 1"), [mirrorMove("d4c5")]);
    const original = postcommitEdgeEvidence(run, run.nodes[0]!, run.nodes[1]!); query(run);
    const evidence = capture.mock.calls.find(([request]) => request.mode !== "admit")![0].evidence;
    const islands = evidence.filter(item => key(item) === "rules.structural.event.pawn_islands@2");
    expect(islands).toHaveLength(2); expect(islands.map(item => item.payload)).toMatchObject(black ? [{ beforeCount: 2, afterCount: 1 }, { beforeCount: 1, afterCount: 2 }] : [{ beforeCount: 1, afterCount: 2 }, { beforeCount: 2, afterCount: 1 }]);
    const changes = original.filter(item => structural.has(key(item)) && !unchanged(item));
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some(item => { const p = item.payload as { before: unknown; after: unknown }; return p.before === null || p.after === null; })).toBe(true);
    expect(changes.every(item => evidence.includes(item))).toBe(true);
    const king = line(mirrorFen("7k/p7/8/8/8/8/8/K7 w - - 0 1"), [mirrorMove("a1b1")]);
    const input = { beforeFen: king.nodes[0]!.fen, moveUci: mirrorMove("a1b1"), afterFen: king.nodes[1]!.fen };
    const states = invokeEvidenceValueRoute("rules.structural.event.king_zone@1", input);
    expect(states.some(item => !unchanged(item))).toBe(true);
    expect(states.some(item => {
      const p = item.payload as { before: { count?: number } | null; after: { count?: number } | null };
      return !unchanged(item) && p.before !== null && p.after !== null && (p.before.count ?? 1) === (p.after.count ?? 1);
    })).toBe(true);
    capture.mockClear(); query(king);
    expect(capture.mock.calls.find(([request]) => request.mode !== "admit")![0].evidence.filter(item => key(item) === "rules.structural.event.king_zone@1").map(item => item.payload)).toEqual(states.filter(item => !unchanged(item)).map(item => item.payload));
  });
  it("does not force the real d2–f3 defender change silent", () => {
    const run = line("7k/pppppppp/PPPPPPPP/8/8/8/3N4/K7 w - - 0 1", ["d2f3"]);
    const capture = vi.spyOn(packets, "compileModulePacket"); query(run);
    const current = capture.mock.calls.find(([request]) => request.mode !== "admit")![0];
    expect(current.evidence.find(item => key(item) === "rules.king.event.zone_state@1")?.payload).toMatchObject({ color: "white", defenders: { lost: [{ square: "d2" }] } });
  });
});
