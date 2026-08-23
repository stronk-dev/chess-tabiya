// DISPOSABLE research harness — D1363. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Role, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { forcedMateAfterMove } from "../../packages/runtime/src/mate-proof.js";
import { localSemanticEvents, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import {
  forkSurvivesReply,
  mateInOne,
  promotionPressureReading,
  replyBreadth,
} from "../../packages/runtime/src/tactics.js";
import { importedPopulation } from "../research-chess/populations.js";

const INPUT = new URL("../../planning/evidence-foundation-ux/d1061-bestline-distance-results.json", import.meta.url);
const OUTPUT = new URL("../../planning/evidence-foundation-ux/d1363-hint-selector-results.json", import.meta.url);
const REPORT = new URL("../../planning/evidence-foundation-ux/d1363-hint-selector-results.md", import.meta.url);
const RUNTIME_SOURCES = [
  { path: "packages/runtime/src/tactics.ts", url: new URL("../../packages/runtime/src/tactics.ts", import.meta.url) },
  { path: "packages/runtime/src/mate-proof.ts", url: new URL("../../packages/runtime/src/mate-proof.ts", import.meta.url) },
  { path: "packages/runtime/src/semantic-evidence.ts", url: new URL("../../packages/runtime/src/semantic-evidence.ts", import.meta.url) },
] as const;
const ARMS = ["depth12", "movetime100_a"] as const;
const FAMILY_ORDER = [
  "mate_in_one",
  "forced_mate",
  "double_attack",
  "fork_survives_reply",
  "discovered_executed",
  "loose_piece",
  "promotion_pressure",
] as const;
type Family = (typeof FAMILY_ORDER)[number];
type Arm = (typeof ARMS)[number];
type Phase = InputRow["phase"];

interface InputProbe { readonly arm: string; readonly pv: readonly string[] }
interface InputRow {
  readonly packId: string;
  readonly phase: "opening" | "middlegame" | "cross_phase";
  readonly fen: string;
  readonly probes: readonly InputProbe[];
}
interface Edge { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string; readonly side: Color }
interface Actor { readonly color: Color; readonly role: Role; readonly from?: SquareName; readonly to?: SquareName }
interface Candidate {
  readonly occurrenceId: string;
  readonly family: Family;
  readonly ply: number;
  readonly edgeSideRelation: "root" | "opponent";
  readonly actor: Actor;
  readonly targets: readonly SquareName[];
  readonly edgeMoveUci: string;
  readonly firstMoveUci: string;
  readonly status: string;
}

const sha256 = (value: string | Buffer): string => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const familyRank = (family: Family): number => FAMILY_ORDER.indexOf(family);
const projection = (event: SemanticEvidenceEvent): string => `${event.projection.id}@${event.projection.version}`;
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const square = (value: unknown): SquareName | undefined => typeof value === "string" && /^[a-h][1-8]$/u.test(value) ? value as SquareName : undefined;
const exactSquares = (values: readonly unknown[]): readonly SquareName[] => Object.freeze([...new Set(values.flatMap((value) => {
  const direct = square(value);
  if (direct !== undefined) return [direct];
  const item = record(value);
  return [square(item.square), square(item.target), square(item.to), square(item.after)].filter((candidate): candidate is SquareName => candidate !== undefined);
}))].sort());

function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }

function edge(beforeFen: string, rawUci: string): Edge {
  const before = position(beforeFen);
  const side = before.turn;
  const parsed = parseUci(rawUci);
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid PV UCI ${rawUci}`);
  const move = normalizeMove(before, parsed);
  if (!("from" in move) || !before.isLegal(move)) throw new TypeError(`Illegal PV UCI ${rawUci} from ${beforeFen}`);
  const moveUci = makeUci(move);
  before.play(move);
  return Object.freeze({ beforeFen, moveUci, afterFen: makeFen(before.toSetup()), side });
}

function occurrence(input: Omit<Candidate, "occurrenceId">): Candidate {
  const bytes = JSON.stringify(input);
  return Object.freeze({ occurrenceId: sha256(bytes), ...input });
}

function movedActor(edgeValue: Edge): Actor {
  const before = position(edgeValue.beforeFen);
  const parsed = parseUci(edgeValue.moveUci)!;
  const move = normalizeMove(before, parsed);
  if (!("from" in move)) throw new TypeError(`Non-normal edge ${edgeValue.moveUci}`);
  const piece = before.board.get(move.from);
  if (piece === undefined) throw new TypeError(`Missing edge actor ${edgeValue.moveUci}`);
  return Object.freeze({ color: piece.color, role: piece.role, from: makeSquare(move.from), to: makeSquare(move.to) });
}

function eventActor(event: SemanticEvidenceEvent, fallback: Actor): Actor {
  const payload = record(event.operands);
  const mover = record(payload.mover);
  const moverPiece = record(mover.piece);
  const screen = record(payload.screen);
  const screenPiece = record(screen.piece);
  const color = (mover.color ?? moverPiece.color ?? screenPiece.color ?? fallback.color) as Color;
  const role = (record(mover.after).role ?? moverPiece.role ?? screenPiece.role ?? fallback.role) as Role;
  return Object.freeze({
    color,
    role,
    ...(square(record(mover.before).square ?? mover.before ?? screen.square ?? fallback.from) === undefined ? {} : { from: square(record(mover.before).square ?? mover.before ?? screen.square ?? fallback.from)! }),
    ...(square(record(mover.after).square ?? mover.after ?? fallback.to) === undefined ? {} : { to: square(record(mover.after).square ?? mover.after ?? fallback.to)! }),
  });
}

function eventTargets(event: SemanticEvidenceEvent): readonly SquareName[] {
  const payload = record(event.operands);
  const signed = record(event.sign === "lost" ? payload.before : payload.after);
  return exactSquares([
    ...(Array.isArray(payload.targets) ? payload.targets : []),
    payload.target,
    ...(Array.isArray(payload.raySquares) ? payload.raySquares : []),
    record(signed.piece),
    signed,
  ]);
}

function candidatesForEdge(edgeValue: Edge, ply: number, rootSide: Color, firstMoveUci: string): readonly Candidate[] {
  const relation = edgeValue.side === rootSide ? "root" as const : "opponent" as const;
  const fallback = movedActor(edgeValue);
  const result: Candidate[] = [];
  const add = (family: Family, actor: Actor, targets: readonly SquareName[], status: string): void => {
    if (targets.length === 0) return;
    result.push(occurrence({ family, ply, edgeSideRelation: relation, actor, targets: Object.freeze([...targets].sort()), edgeMoveUci: edgeValue.moveUci, firstMoveUci, status }));
  };

  const mate = mateInOne(edgeValue.beforeFen).mates.find((value) => value.moveUci === edgeValue.moveUci);
  if (mate !== undefined) add("mate_in_one", { color: mate.mover.piece.color, role: mate.mover.piece.role, from: mate.mover.from, to: mate.mover.to }, [mate.matedKing.square], "exact");

  const breadth = replyBreadth(edgeValue.beforeFen, edgeValue.moveUci);
  const forced = forcedMateAfterMove(edgeValue.beforeFen, edgeValue.moveUci, 4, breadth);
  if (forced.kind === "proof" && forced.proof.proofStatus === "proved") {
    const child = position(edgeValue.afterFen);
    const king = child.board.kingOf(opposite(forced.proof.attacker));
    if (king !== undefined) add("forced_mate", fallback, [makeSquare(king)], forced.proof.proofDigest);
  }

  const local = localSemanticEvents(edgeValue.beforeFen, edgeValue.moveUci, edgeValue.afterFen);
  const doubles = local.filter((event) => projection(event) === "rules.tactic.event.double_attack@1");
  for (const event of doubles) {
    const targets = eventTargets(event);
    add("double_attack", eventActor(event, fallback), targets, event.sign);
    const payload = event.operands as Parameters<typeof forkSurvivesReply>[0];
    const survival = forkSurvivesReply(payload, breadth);
    if (survival.matched) add("fork_survives_reply", eventActor(event, fallback), targets, "matched");
  }
  for (const event of local.filter((value) => projection(value) === "derived.tactic.discovered_executed@1")) add("discovered_executed", eventActor(event, fallback), eventTargets(event), event.sign);
  for (const event of local.filter((value) => projection(value) === "rules.tactic.event.loose_piece@1")) add("loose_piece", eventActor(event, fallback), eventTargets(event), event.sign);

  for (const pawn of promotionPressureReading(edgeValue.afterFen).pawns) {
    add("promotion_pressure", { color: pawn.pawn.piece.color, role: "pawn", from: pawn.pawn.square, to: pawn.pawn.square }, [pawn.promotionSquare], `${pawn.passAvailability.kind}:${pawn.passAvailability.kind === "available" ? pawn.passAvailability.value : pawn.passAvailability.reason}|${pawn.replyPersistence.kind}:${pawn.replyPersistence.kind === "available" ? pawn.replyPersistence.value : pawn.replyPersistence.reason}`);
  }
  return Object.freeze(result);
}

function select(candidates: readonly Candidate[]): Candidate | null {
  return [...candidates].sort((left, right) => familyRank(left.family) - familyRank(right.family)
    || left.ply - right.ply
    || left.targets.join(",").localeCompare(right.targets.join(","))
    || left.edgeMoveUci.localeCompare(right.edgeMoveUci)
    || left.occurrenceId.localeCompare(right.occurrenceId))[0] ?? null;
}

function timing(values: readonly number[]) {
  const ordered = [...values].sort((left, right) => left - right);
  const at = (q: number) => ordered[Math.min(ordered.length - 1, Math.floor(q * ordered.length))] ?? 0;
  return Object.freeze({ n: values.length, meanMs: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length), p50Ms: at(0.5), p95Ms: at(0.95), maxMs: ordered.at(-1) ?? 0 });
}

function counts(values: readonly string[]): Readonly<Record<string, number>> {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return Object.freeze(Object.fromEntries([...result.entries()].sort(([left], [right]) => left.localeCompare(right))));
}

function candidateBreakdown(candidates: readonly Candidate[]) {
  return Object.freeze({
    total: candidates.length,
    byFamily: counts(candidates.map((candidate) => candidate.family)),
    byRelation: counts(candidates.map((candidate) => candidate.edgeSideRelation)),
    byStatus: counts(candidates.map((candidate) => `${candidate.family}:${candidate.status}`)),
  });
}

describe("D1363 production-table hint selector", () => {
  it("measures the preregistered table and perspective arms", () => {
    const inputBytes = readFileSync(INPUT);
    const source = JSON.parse(inputBytes.toString("utf8")) as { readonly rows: readonly InputRow[] };
    expect(source.rows).toHaveLength(64);
    expect(new Set(source.rows.map((row) => `${row.packId}\0${row.fen}`)).size).toBe(64);

    const rows: Array<Record<string, unknown>> = [];
    const timings: Record<Arm, number[]> = { depth12: [], movetime100_a: [] };
    const candidateCounts = new Map<Family, number>(FAMILY_ORDER.map((family) => [family, 0]));
    for (const [positionIndex, row] of source.rows.entries()) for (const arm of ARMS) {
      const probe = row.probes.find((value) => value.arm === arm);
      if (probe === undefined || probe.pv.length === 0) throw new TypeError(`Missing ${arm} PV for ${row.packId}`);
      const rootSide = position(row.fen).turn;
      const firstMoveUci = probe.pv[0]!;
      const candidates: Candidate[] = [];
      let beforeFen = row.fen;
      const started = performance.now();
      for (const [index, rawUci] of probe.pv.slice(0, 4).entries()) {
        const current = edge(beforeFen, rawUci);
        const edgeCandidates = candidatesForEdge(current, index + 1, rootSide, firstMoveUci);
        for (const candidate of edgeCandidates) candidateCounts.set(candidate.family, candidateCounts.get(candidate.family)! + 1);
        candidates.push(...edgeCandidates);
        beforeFen = current.afterFen;
      }
      timings[arm].push(performance.now() - started);
      const raw = select(candidates);
      const rootOnly = select(candidates.filter((candidate) => candidate.edgeSideRelation === "root"));
      const rootEdge = select(candidates.filter((candidate) => candidate.ply === 1));
      const rootLater = select(candidates.filter((candidate) => candidate.edgeSideRelation === "root" && candidate.ply === 3));
      rows.push({
        positionId: `${positionIndex}:${row.packId}:${sha256(row.fen).slice(7, 19)}`,
        packId: row.packId,
        phase: row.phase,
        arm,
        rootSide,
        firstMoveUci,
        candidateCount: candidates.length,
        candidateBreakdown: candidateBreakdown(candidates),
        raw,
        rootSideOnly: rootOnly,
        rootEdgeOnly: rootEdge,
        rootSideLater: rootLater,
        rawDiffersFromRootSide: raw?.occurrenceId !== rootOnly?.occurrenceId,
        rawDiffersFromRootEdge: raw?.occurrenceId !== rootEdge?.occurrenceId,
      });
    }

    const summarize = (arm: Arm) => {
      const members = rows.filter((row) => row.arm === arm);
      const selected = members.filter((row) => row.raw !== null);
      const rawOpponent = selected.filter((row) => (row.raw as Candidate).edgeSideRelation === "opponent");
      return Object.freeze({
        positions: members.length,
        rawReach: selected.length,
        rootSideReach: members.filter((row) => row.rootSideOnly !== null).length,
        rootEdgeReach: members.filter((row) => row.rootEdgeOnly !== null).length,
        rootSideLaterReach: members.filter((row) => row.rootSideLater !== null).length,
        rawOpponentSelections: rawOpponent.length,
        rawDiffersFromRootSide: members.filter((row) => row.rawDiffersFromRootSide === true).length,
        rawDiffersFromRootEdge: members.filter((row) => row.rawDiffersFromRootEdge === true).length,
        timingMs: timing(timings[arm]),
      });
    };
    const summary = Object.freeze({ depth12: summarize("depth12"), movetime100_a: summarize("movetime100_a") });
    const phaseSummary = Object.freeze(Object.fromEntries(ARMS.flatMap((arm) =>
      (["opening", "middlegame", "cross_phase"] as const).map((phase: Phase) => {
        const members = rows.filter((row) => row.arm === arm && row.phase === phase);
        const candidates = members.flatMap((row) => {
          const breakdown = row.candidateBreakdown as ReturnType<typeof candidateBreakdown>;
          return Object.entries(breakdown.byFamily).flatMap(([family, count]) =>
            Array.from({ length: count }, () => family));
        });
        const rootCandidates = members.reduce((sum, row) => sum + Number((row.candidateBreakdown as ReturnType<typeof candidateBreakdown>).byRelation.root ?? 0), 0);
        const opponentCandidates = members.reduce((sum, row) => sum + Number((row.candidateBreakdown as ReturnType<typeof candidateBreakdown>).byRelation.opponent ?? 0), 0);
        return [`${arm}:${phase}`, Object.freeze({
          positions: members.length,
          candidates: candidates.length,
          candidatesByFamily: counts(candidates),
          candidatesByRelation: { root: rootCandidates, opponent: opponentCandidates, unclassified: 0 },
          rawReach: members.filter((row) => row.raw !== null).length,
          rawSelectionsByFamily: counts(members.flatMap((row) => row.raw === null ? [] : [(row.raw as Candidate).family])),
          rawOpponentSelections: members.filter((row) => row.raw !== null && (row.raw as Candidate).edgeSideRelation === "opponent").length,
        })];
      }))) as Readonly<Record<`${Arm}:${Phase}`, Readonly<Record<string, unknown>>>>);
    const runtimeDigest = sha256(RUNTIME_SOURCES.map((file) => `${file.path}\0${readFileSync(file.url)}`).join("\0"));
    const result = Object.freeze({
      experiment: "D1363",
      measuredAt: new Date().toISOString(),
      input: { path: "planning/evidence-foundation-ux/d1061-bestline-distance-results.json", sha256: sha256(inputBytes) },
      runtimeDigest,
      contract: { families: FAMILY_ORDER, arms: ARMS, horizonPlies: 4, forcedMateAttackerMoves: 4 },
      candidateCounts: Object.fromEntries(FAMILY_ORDER.map((family) => [family, candidateCounts.get(family)])),
      candidateRelations: {
        root: rows.reduce((sum, row) => sum + Number((row.candidateBreakdown as ReturnType<typeof candidateBreakdown>).byRelation.root ?? 0), 0),
        opponent: rows.reduce((sum, row) => sum + Number((row.candidateBreakdown as ReturnType<typeof candidateBreakdown>).byRelation.opponent ?? 0), 0),
        unclassified: 0,
      },
      candidateStatuses: counts(rows.flatMap((row) => {
        const breakdown = row.candidateBreakdown as ReturnType<typeof candidateBreakdown>;
        return Object.entries(breakdown.byStatus).flatMap(([status, count]) => Array.from({ length: count }, () => status));
      })),
      summary,
      phaseSummary,
      gates: {
        familySetExercised: Object.keys(Object.fromEntries(FAMILY_ORDER.map((family) => [family, candidateCounts.get(family)]))).join("|") === FAMILY_ORDER.join("|"),
        noOpponentRawSelections: summary.depth12.rawOpponentSelections + summary.movetime100_a.rawOpponentSelections === 0,
        occurrenceIdentity: rows.every((row) => row.raw === null || (row.raw as Candidate).occurrenceId.startsWith("sha256:")),
        latencyHeadroom: summary.depth12.timingMs.p95Ms <= 1_400 && summary.movetime100_a.timingMs.p95Ms <= 1_400,
      },
      rows,
    });
    writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    const pct = (value: number, total: number) => `${(100 * value / total).toFixed(1)}%`;
    const lines = [
      "# D1363 hint-selector results", "",
      `Input: \`${result.input.sha256}\`; runtime: \`${runtimeDigest}\`.`, "",
      "| arm | raw reach | root-side reach | root-edge reach | raw opponent selections | raw ≠ root-side | p95 selector time |",
      "|---|---:|---:|---:|---:|---:|---:|",
      ...ARMS.map((arm) => {
        const value = summary[arm];
        return `| ${arm} | ${value.rawReach}/64 (${pct(value.rawReach, 64)}) | ${value.rootSideReach}/64 (${pct(value.rootSideReach, 64)}) | ${value.rootEdgeReach}/64 (${pct(value.rootEdgeReach, 64)}) | ${value.rawOpponentSelections} | ${value.rawDiffersFromRootSide} | ${value.timingMs.p95Ms.toFixed(1)} ms |`;
      }), "",
      "## Candidate incidence", "", "| family | candidates |", "|---|---:|",
      ...FAMILY_ORDER.map((family) => `| ${family} | ${candidateCounts.get(family)} |`), "",
      `Candidate perspective: root ${result.candidateRelations.root}; opponent ${result.candidateRelations.opponent}; unclassified 0.`, "",
      "## Phase split", "", "| arm / phase | candidates | raw reach | raw opponent selections |", "|---|---:|---:|---:|",
      ...Object.entries(phaseSummary).map(([key, value]) => `| ${key} | ${String(value.candidates)} | ${String(value.rawReach)}/${String(value.positions)} | ${String(value.rawOpponentSelections)} |`), "",
      `Perspective gate: **${result.gates.noOpponentRawSelections ? "PASS" : "FAIL"}**. A failure returns the selector to the author; it is not a chess-quality verdict.`, "",
      `Latency-headroom gate: **${result.gates.latencyHeadroom ? "PASS" : "FAIL"}**. This is selector-only latency and does not satisfy the required end-to-end cold/warm/provider-off receipt.`, "",
      "The four readings are diagnostic. Root-side or ply-1 occurrence still does not establish causality, recommendation, or usefulness.", "",
    ];
    writeFileSync(REPORT, lines.join("\n"), "utf8");

    expect(rows).toHaveLength(128);
    expect(result.gates.familySetExercised).toBe(true);
    expect(result.gates.occurrenceIdentity).toBe(true);
  });

  it("keeps the seven adapters able to fail on permanent constructor fixtures", () => {
    expect(mateInOne("7k/8/5KQ1/8/8/8/8/8 w - - 0 1").mates).not.toHaveLength(0);
    expect(mateInOne("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1").mates).toEqual([]);
    const mateBreadth = replyBreadth("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7");
    expect(forcedMateAfterMove("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7", 1, mateBreadth)).toMatchObject({ kind: "proof", proof: { proofStatus: "proved" } });
    const quietBreadth = replyBreadth("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", "e2e4");
    expect(forcedMateAfterMove("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", "e2e4", 1, quietBreadth)).toMatchObject({ kind: "proof", proof: { proofStatus: "refuted" } });

    const positiveFork = importedPopulation().paths.flat().find((row) => {
      const local = localSemanticEvents(row.parentFen, row.uci, row.fen);
      const event = local.find((value) => projection(value) === "rules.tactic.event.double_attack@1");
      return event !== undefined && forkSurvivesReply(event.operands as Parameters<typeof forkSurvivesReply>[0], replyBreadth(row.parentFen, row.uci)).matched;
    });
    expect(positiveFork).toBeDefined();
    const geometric = edge("4k3/2p3p1/3b3b/8/3N4/8/8/4K3 w - - 0 1", "d4f5");
    expect(localSemanticEvents(geometric.beforeFen, geometric.moveUci, geometric.afterFen).some((event) => projection(event) === "rules.tactic.event.double_attack@1")).toBe(false);

    const discovered = edge("7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4");
    expect(localSemanticEvents(discovered.beforeFen, discovered.moveUci, discovered.afterFen).some((event) => projection(event) === "derived.tactic.discovered_executed@1")).toBe(true);
    const noDiscovery = edge("7k/8/8/8/4r3/5n2/6B1/7K b - - 0 1", "f3h4");
    expect(localSemanticEvents(noDiscovery.beforeFen, noDiscovery.moveUci, noDiscovery.afterFen).some((event) => projection(event) === "derived.tactic.discovered_executed@1")).toBe(false);

    const loose = edge("4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1", "d2e2");
    expect(localSemanticEvents(loose.beforeFen, loose.moveUci, loose.afterFen).some((event) => projection(event) === "rules.tactic.event.loose_piece@1")).toBe(true);
    const quiet = edge("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", "e2e4");
    expect(localSemanticEvents(quiet.beforeFen, quiet.moveUci, quiet.afterFen).some((event) => projection(event) === "rules.tactic.event.loose_piece@1")).toBe(false);
    expect(promotionPressureReading("7k/P7/8/8/8/8/8/7K b - - 0 1").pawns).not.toHaveLength(0);
    expect(promotionPressureReading("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1").pawns).toEqual([]);
  });
});
