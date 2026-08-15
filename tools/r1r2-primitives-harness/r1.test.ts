// DISPOSABLE research harness — R1, planning/campaign-research-queue.md.
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { pawnSafety, structuralDelta, structuralReading, vacationReading } from "../../packages/runtime/src/index.js";
import { transitions } from "./corpus.js";
import {
  attackMap,
  attackPairs,
  controlDelta,
  defencePairs,
  defendedDuties,
  dutyDelta,
  distanceToSet,
  escapeSquaresRemoved,
  irreversibility,
  legalMoveCount,
  lineBlockers,
  lineDelta,
  pos,
  safeDests,
  setDiff,
  zeroing,
} from "./primitives.js";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import { opposite, parseUci } from "chessops/util";

interface Case {
  parentFen: string;
  fen: string;
  uci: string;
  before: Chess;
  after: Chess;
  mapBefore: ReturnType<typeof attackMap>;
  mapAfter: ReturnType<typeof attackMap>;
}

const REPEATS = 25;

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function bench(name: string, cases: Case[], fn: (c: Case) => unknown): { name: string; usPerPly: number } {
  for (let i = 0; i < 3; i += 1) for (const c of cases) fn(c); // warm-up
  const runs: number[] = [];
  for (let r = 0; r < REPEATS; r += 1) {
    const t0 = performance.now();
    for (const c of cases) fn(c);
    runs.push(((performance.now() - t0) * 1000) / cases.length);
  }
  return { name, usPerPly: Number(median(runs).toFixed(2)) };
}

describe("R1 — primitive computability and cost", () => {
  it("measures every candidate primitive over the committed spines", () => {
    const all = transitions();
    const cases: Case[] = all.map((t) => {
      const before = pos(t.parentFen);
      const after = pos(t.fen);
      return {
        parentFen: t.parentFen,
        fen: t.fen,
        uci: t.uci,
        before,
        after,
        mapBefore: attackMap(before),
        mapAfter: attackMap(after),
      };
    });
    expect(cases.length).toBe(593);

    const rows: { name: string; usPerPly: number }[] = [];

    // shared substrate, measured separately so every row below can be read as marginal cost
    rows.push(bench("FEN parse ×2 (shared substrate)", cases, (c) => [pos(c.parentFen), pos(c.fen)]));
    rows.push(bench("attackMap ×2 (shared substrate)", cases, (c) => [attackMap(c.before), attackMap(c.after)]));

    rows.push(bench("P1 attacks created/removed", cases, (c) => setDiff(attackPairs(c.before, c.mapBefore), attackPairs(c.after, c.mapAfter))));
    rows.push(bench("P2 defences created/removed", cases, (c) => setDiff(defencePairs(c.before, c.mapBefore), defencePairs(c.after, c.mapAfter))));
    rows.push(bench("P3 lines opened/closed", cases, (c) => lineDelta(lineBlockers(c.before), lineBlockers(c.after))));
    rows.push(bench("P4 control delta (64 squares × 2 colours)", cases, (c) => controlDelta(c.mapBefore, c.mapAfter)));
    rows.push(bench("P5 escape squares removed", cases, (c) => {
      const mover = c.before.turn;
      return escapeSquaresRemoved(
        safeDests(c.before, c.mapBefore, opposite(mover)),
        safeDests(c.after, c.mapAfter, opposite(mover)),
      );
    }));
    rows.push(bench("P6 defended-duty count delta (overload)", cases, (c) => dutyDelta(defendedDuties(c.before, c.mapBefore), defendedDuties(c.after, c.mapAfter))));
    rows.push(bench("P7a tempo — gives check", cases, (c) => c.after.isCheck()));
    rows.push(bench("P7b tempo — reply count (legality search, 1 ply)", cases, (c) => legalMoveCount(c.after)));
    rows.push(bench("P8a irreversibility — halfmove-clock zeroing (FEN field)", cases, (c) => zeroing(c.parentFen, c.fen)));
    rows.push(bench("P8b irreversibility — pivotal.ts classification", cases, (c) => irreversibility(c.before, c.after, c.uci)));
    rows.push(bench("P9 vacationReading (shipped, dead)", cases, (c) => vacationReading(c.parentFen, c.uci.slice(0, 2) as never)));
    rows.push(bench("P10 structuralDelta (shipped, dead)", cases, (c) => structuralDelta(c.parentFen, c.fen)));
    rows.push(bench("P10b structuralReading ×2 (structuralDelta's own inputs)", cases, (c) => [structuralReading(c.parentFen), structuralReading(c.fen)]));
    rows.push(bench("P11 routing — distance-to-square-set for the mover", cases, (c) => {
      const move = parseUci(c.uci)!;
      if (!("from" in move)) return 0;
      const piece = c.before.board.get(move.from)!;
      const targets = SquareSet.center();
      return distanceToSet(piece.role, move.from, targets) - distanceToSet(piece.role, move.to, targets);
    }));

    rows.push(bench("pawnSafety — one shipped call (re-parses the FEN)", cases, (c) => pawnSafety(c.parentFen, "white", "d5")));
    rows.push(bench("BUNDLE: P1..P8b + P11 in one pass from two FEN strings", cases, (c) => {
      const before = pos(c.parentFen);
      const after = pos(c.fen);
      const mb = attackMap(before);
      const ma = attackMap(after);
      const mover = before.turn;
      const move = parseUci(c.uci)!;
      const piece = "from" in move ? before.board.get(move.from) : undefined;
      return [
        setDiff(attackPairs(before, mb), attackPairs(after, ma)),
        setDiff(defencePairs(before, mb), defencePairs(after, ma)),
        lineDelta(lineBlockers(before), lineBlockers(after)),
        controlDelta(mb, ma),
        escapeSquaresRemoved(safeDests(before, mb, opposite(mover)), safeDests(after, ma, opposite(mover))),
        dutyDelta(defendedDuties(before, mb), defendedDuties(after, ma)),
        after.isCheck(),
        zeroing(c.parentFen, c.fen),
        irreversibility(before, after, c.uci),
        piece === undefined || !("from" in move) ? 0
          : distanceToSet(piece.role, move.from, SquareSet.center()) - distanceToSet(piece.role, move.to, SquareSet.center()),
      ];
    }));

    // --- cost stability across board density
    const dense = cases.filter((c) => c.before.board.occupied.size() >= 24);
    const sparse = cases.filter((c) => c.before.board.occupied.size() <= 8);
    const bundleOf = (set: Case[]): ((c: Case) => unknown) => (c) => {
      const before = pos(c.parentFen);
      const after = pos(c.fen);
      const mb = attackMap(before);
      const ma = attackMap(after);
      return [setDiff(attackPairs(before, mb), attackPairs(after, ma)), lineDelta(lineBlockers(before), lineBlockers(after)), controlDelta(mb, ma), dutyDelta(defendedDuties(before, mb), defendedDuties(after, ma)), set.length];
    };
    rows.push(bench(`BUNDLE on dense positions (>=24 pieces, n=${dense.length})`, dense, bundleOf(dense)));
    rows.push(bench(`BUNDLE on sparse positions (<=8 pieces, n=${sparse.length})`, sparse, bundleOf(sparse)));
    rows.push(bench(`structuralDelta on sparse positions (n=${sparse.length})`, sparse, (c) => structuralDelta(c.parentFen, c.fen)));

    // --- firing / yield census, so "computable" is not confused with "informative"
    let attacksFired = 0;
    let defencesFired = 0;
    let linesFired = 0;
    let escapesFired = 0;
    let dutiesFired = 0;
    let checkFired = 0;
    let zeroFired = 0;
    let irrevFired = 0;
    let vacationFired = 0;
    let deltaFired = 0;
    let controlSum = 0;
    let attackCreatedSum = 0;
    for (const c of cases) {
      const a = setDiff(attackPairs(c.before, c.mapBefore), attackPairs(c.after, c.mapAfter));
      if (a.created + a.removed > 0) attacksFired += 1;
      attackCreatedSum += a.created;
      const d = setDiff(defencePairs(c.before, c.mapBefore), defencePairs(c.after, c.mapAfter));
      if (d.created + d.removed > 0) defencesFired += 1;
      const l = lineDelta(lineBlockers(c.before), lineBlockers(c.after));
      if (l.opened + l.closed > 0) linesFired += 1;
      const mover = c.before.turn;
      const e = escapeSquaresRemoved(safeDests(c.before, c.mapBefore, opposite(mover)), safeDests(c.after, c.mapAfter, opposite(mover)));
      if (e.removed > 0) escapesFired += 1;
      const du = dutyDelta(defendedDuties(c.before, c.mapBefore), defendedDuties(c.after, c.mapAfter));
      if (du.acquiredSecondDuty > 0) dutiesFired += 1;
      if (c.after.isCheck()) checkFired += 1;
      if (zeroing(c.parentFen, c.fen)) zeroFired += 1;
      if (irreversibility(c.before, c.after, c.uci) !== undefined) irrevFired += 1;
      const v = vacationReading(c.parentFen, c.uci.slice(0, 2) as never);
      if (v !== null && v.unblocks.length > 0) vacationFired += 1;
      const sd = structuralDelta(c.parentFen, c.fen);
      if (sd.gained.length + sd.lost.length > 0) deltaFired += 1;
      controlSum += controlDelta(c.mapBefore, c.mapAfter).squaresChanged;
    }

    const n = cases.length;
    const pct = (x: number): string => `${((x / n) * 100).toFixed(1)}%`;
    const report = [
      `# R1 raw output — ${n} spine transitions, 35 packs`,
      "",
      "## Cost (median of 25 passes over the whole corpus, microseconds per ply)",
      "",
      "| Primitive | µs/ply |",
      "|---|---|",
      ...rows.map((r) => `| ${r.name} | ${r.usPerPly} |`),
      "",
      "## Firing census (share of the 593 transitions where the primitive reports anything)",
      "",
      `- P1 attacks created or removed: ${attacksFired} (${pct(attacksFired)}); mean attacks created per ply ${(attackCreatedSum / n).toFixed(2)}`,
      `- P2 defences created or removed: ${defencesFired} (${pct(defencesFired)})`,
      `- P3 lines opened or closed: ${linesFired} (${pct(linesFired)})`,
      `- P4 control delta: mean ${(controlSum / n).toFixed(1)} of 64 squares change control per ply`,
      `- P5 escape squares removed from an enemy piece: ${escapesFired} (${pct(escapesFired)})`,
      `- P6 a piece acquires a second defensive duty: ${dutiesFired} (${pct(dutiesFired)})`,
      `- P7a move gives check: ${checkFired} (${pct(checkFired)})`,
      `- P8a halfmove clock zeroed: ${zeroFired} (${pct(zeroFired)})`,
      `- P8b pivotal irreversibility fires: ${irrevFired} (${pct(irrevFired)})`,
      `- P9 vacationReading reports an unblock: ${vacationFired} (${pct(vacationFired)})`,
      `- P10 structuralDelta reports a gained/lost observation: ${deltaFired} (${pct(deltaFired)})`,
      "",
    ].join("\n");
    writeFileSync(new URL("./r1-output.md", import.meta.url).pathname, report);
    console.log(report);
  });
});
