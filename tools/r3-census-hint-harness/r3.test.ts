// DISPOSABLE research harness — R3, planning/campaign-research-queue.md. Not production code.
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import type { Move, Square } from "chessops/types";
import { makeSquare, opposite } from "chessops/util";

import { transitions } from "../r1r2-primitives-harness/corpus.js";
import {
  attackPairs, defencePairs, defendedDuties, dutyDelta, escapeSquaresRemoved,
  irreversibility, lineBlockers, lineDelta, pos, safeDests, setDiff, zeroing,
} from "../r1r2-primitives-harness/primitives.js";
import {
  LEAF_DIRECTIONS, ctxOf, transition, witnesses,
  type Ctx, type LeafName, type Tr, type Witness,
} from "./leaves.js";

const LEAVES = Object.keys(LEAF_DIRECTIONS) as LeafName[];

interface Row {
  readonly key: string;
  readonly leaf: LeafName;
  readonly direction: string;
  fired: number;
  remote: number;
  remoteStrict: number;
  consequential: number;
  signal: number;        // >=1 witness that is remote (T1) AND consequential
  signalStrict: number;  // >=1 witness that is remoteStrict (T0) AND consequential
  witnessTotal: number;
  witnessSignal: number;
}

function pct(x: number, n: number): string {
  return `${((x / n) * 100).toFixed(1)}%`;
}

function legalMoves(p: Chess): Move[] {
  const out: Move[] = [];
  for (const [from, dests] of p.allDests()) {
    const piece = p.board.get(from)!;
    for (const to of dests) {
      const rank = to >> 3;
      if (piece.role === "pawn" && (rank === 0 || rank === 7)) {
        out.push({ from, to, promotion: "queen" });
      } else {
        out.push({ from, to });
      }
    }
  }
  return out;
}

function playTo(p: Chess, move: Move): Chess {
  const next = p.clone();
  next.play(move);
  return next;
}

describe("R3 — is a census-only hint worth reading", () => {
  it("measures firing, signal, discrimination and volume over the committed spines", () => {
    const all = transitions();
    const packs = new Set(all.map((t) => t.pack));
    const n = all.length;

    interface Case {
      readonly t: Tr;
      readonly parentFen: string;
      readonly fen: string;
      readonly uci: string;
      readonly san: string;
      readonly pack: string;
      readonly phase: string;
      readonly ply: number;
      readonly annotations: readonly string[];
    }

    const cases: Case[] = all.map((x) => {
      const before = ctxOf(pos(x.parentFen));
      const after = ctxOf(pos(x.fen));
      return {
        t: transition(before, after, x.uci),
        parentFen: x.parentFen, fen: x.fen, uci: x.uci, san: x.san,
        pack: x.pack, phase: x.phase, ply: x.ply, annotations: x.annotations,
      };
    });

    // ------------------------------------------------------------------------
    // BY-PRODUCT 1 — the R1 (attacker,target)-pair-keyed rates, re-run on THIS corpus, so the
    // correction in the next block is isolated from the corpus having grown 35 -> 37 packs.
    // ------------------------------------------------------------------------
    const uncorrected: Record<string, number> = {
      attacks: 0, defences: 0, lines: 0, escapes: 0, duties: 0, irrev: 0, zeroed: 0,
    };
    for (const c of cases) {
      const b = c.t.before.p;
      const a = c.t.after.p;
      const mb = c.t.before.map;
      const ma = c.t.after.map;
      const at = setDiff(attackPairs(b, mb), attackPairs(a, ma));
      if (at.created + at.removed > 0) uncorrected.attacks! += 1;
      const de = setDiff(defencePairs(b, mb), defencePairs(a, ma));
      if (de.created + de.removed > 0) uncorrected.defences! += 1;
      const li = lineDelta(lineBlockers(b), lineBlockers(a));
      if (li.opened + li.closed > 0) uncorrected.lines! += 1;
      const mover = b.turn;
      const es = escapeSquaresRemoved(safeDests(b, mb, opposite(mover)), safeDests(a, ma, opposite(mover)));
      if (es.removed > 0) uncorrected.escapes! += 1;
      const du = dutyDelta(defendedDuties(b, mb), defendedDuties(a, ma));
      if (du.acquiredSecondDuty > 0) uncorrected.duties! += 1;
      if (irreversibility(b, a, c.uci) !== undefined) uncorrected.irrev! += 1;
      if (zeroing(c.parentFen, c.fen)) uncorrected.zeroed! += 1;
    }

    // ------------------------------------------------------------------------
    // The corrected leaves, with the T/C witness classification.
    // ------------------------------------------------------------------------
    const rows = new Map<string, Row>();
    for (const leaf of LEAVES) {
      for (const direction of LEAF_DIRECTIONS[leaf]) {
        rows.set(`${leaf}:${direction}`, {
          key: `${leaf}:${direction}`, leaf, direction,
          fired: 0, remote: 0, remoteStrict: 0, consequential: 0, signal: 0, signalStrict: 0,
          witnessTotal: 0, witnessSignal: 0,
        });
      }
    }
    // leaf-level (any direction) counters
    const leafFired = new Map<LeafName, number>();
    const leafSignal = new Map<LeafName, number>();
    const leafSignalStrict = new Map<LeafName, number>();
    for (const l of LEAVES) { leafFired.set(l, 0); leafSignal.set(l, 0); leafSignalStrict.set(l, 0); }
    // exactly-comparable corrected escape rate: `lost`, non-mover colour only (R1's P5 shape)
    let escapeComparable = 0;

    const examples = new Map<string, { useful: string[]; useless: string[] }>();
    const dutyBreakdown = { total: 0, moverColour: 0, opponentColour: 0, remote: 0, sole: 0, both: 0, wardOnMovedSquare: 0 };

    // per-transition totals for the "on-request reading volume" figure
    let readingWitnessTotal = 0;
    let readingWitnessSignal = 0;
    let anyLeafFired = 0;
    let anyLeafSignal = 0;

    const perCase: { fires: Set<string>; signals: Set<string> }[] = [];

    for (const c of cases) {
      const fires = new Set<string>();
      const signals = new Set<string>();
      const nonMover = opposite(c.t.before.p.turn);
      if (witnesses(c.t, "escape_squares_changed", "lost").some((w) => w.color === nonMover)) escapeComparable += 1;
      for (const leaf of LEAVES) {
        let lf = false;
        let ls = false;
        let lss = false;
        for (const direction of LEAF_DIRECTIONS[leaf]) {
          const key = `${leaf}:${direction}`;
          const row = rows.get(key)!;
          const ws: Witness[] = witnesses(c.t, leaf, direction, c.parentFen, c.fen);
          if (ws.length === 0) continue;
          row.fired += 1;
          row.witnessTotal += ws.length;
          lf = true;
          fires.add(key);
          const hasRemote = ws.some((w) => w.remote);
          const hasCons = ws.some((w) => w.consequential);
          const sig = ws.filter((w) => w.remote && w.consequential);
          const sigStrict = ws.filter((w) => w.remoteStrict && w.consequential);
          if (hasRemote) row.remote += 1;
          if (ws.some((w) => w.remoteStrict)) row.remoteStrict += 1;
          if (hasCons) row.consequential += 1;
          row.witnessSignal += sig.length;
          if (sigStrict.length > 0) { row.signalStrict += 1; lss = true; }
          if (sig.length > 0) { row.signal += 1; ls = true; signals.add(key); }

          readingWitnessTotal += ws.length;
          readingWitnessSignal += sig.length;

          const bucket = examples.get(key) ?? { useful: [], useless: [] };
          const label = `${c.pack} ply ${c.ply} ${c.san} (${c.uci})`;
          if (sig.length > 0 && bucket.useful.length < 4) {
            bucket.useful.push(`- **${label}** — ${sig[0]!.sentence}\n  - FEN before: \`${c.parentFen}\`${c.annotations.length > 0 ? `\n  - author: "${c.annotations[0]!.slice(0, 150)}"` : ""}`);
          }
          if (sig.length === 0 && bucket.useless.length < 4) {
            const w = ws[0]!;
            bucket.useless.push(`- **${label}** — ${w.sentence} — fails ${[!w.remote ? "T" : null, !w.consequential ? "C" : null].filter(Boolean).join("+")}\n  - FEN before: \`${c.parentFen}\``);
          }
          examples.set(key, bucket);

          if (leaf === "defended_duties_changed" && direction === "acquired") {
            for (const w of ws) {
              dutyBreakdown.total += 1;
              if (w.color === c.t.before.p.turn) dutyBreakdown.moverColour += 1; else dutyBreakdown.opponentColour += 1;
              if (w.remote) dutyBreakdown.remote += 1; else dutyBreakdown.wardOnMovedSquare += 1;
              if (w.consequential) dutyBreakdown.sole += 1;
              if (w.remote && w.consequential) dutyBreakdown.both += 1;
            }
          }
        }
        if (lf) leafFired.set(leaf, leafFired.get(leaf)! + 1);
        if (ls) leafSignal.set(leaf, leafSignal.get(leaf)! + 1);
        if (lss) leafSignalStrict.set(leaf, leafSignalStrict.get(leaf)! + 1);
      }
      if (fires.size > 0) anyLeafFired += 1;
      if (signals.size > 0) anyLeafSignal += 1;
      perCase.push({ fires, signals });
    }

    // ------------------------------------------------------------------------
    // AXIS D — discrimination. Does the same leaf also fire / signal on the mover's own legal
    // alternatives? This is the R2 method (98.7% FP came from exactly this shape of test).
    // ------------------------------------------------------------------------
    interface Disc { firedAltShare: number[]; signalAltShare: number[]; quietSignalShare: number[]; altCount: number[] }
    const disc = new Map<string, Disc>();
    for (const key of rows.keys()) disc.set(key, { firedAltShare: [], signalAltShare: [], quietSignalShare: [], altCount: [] });
    // unconditional baseline over ALL legal alternatives in every spine position
    const baseFired = new Map<string, number>();
    const baseSignal = new Map<string, number>();
    const baseQuietFired = new Map<string, number>();
    const baseQuietSignal = new Map<string, number>();
    for (const key of rows.keys()) { baseFired.set(key, 0); baseSignal.set(key, 0); baseQuietFired.set(key, 0); baseQuietSignal.set(key, 0); }
    let altTotal = 0;
    let quietTotal = 0;

    for (let i = 0; i < cases.length; i += 1) {
      const c = cases[i]!;
      const before = c.t.before;
      const moves = legalMoves(before.p);
      const perKeyFired = new Map<string, number>();
      const perKeySignal = new Map<string, number>();
      const perKeyQuietSignal = new Map<string, number>();
      let quietHere = 0;
      for (const m of moves) {
        const nextPos = playTo(before.p, m);
        const nextFen = makeFen(nextPos.toSetup());
        const after: Ctx = ctxOf(nextPos);
        const uci = `${makeSquare(m.from as Square)}${makeSquare(m.to)}${m.promotion ? "q" : ""}`;
        const tr = transition(before, after, uci);
        const isCapture = before.p.board.occupied.has(m.to) || (before.p.board.get(m.from as Square)!.role === "pawn" && (m.from as number) % 8 !== m.to % 8);
        const quiet = !isCapture && !nextPos.isCheck();
        if (quiet) quietHere += 1;
        altTotal += 1;
        if (quiet) quietTotal += 1;
        for (const leaf of LEAVES) {
          for (const direction of LEAF_DIRECTIONS[leaf]) {
            const key = `${leaf}:${direction}`;
            const ws = witnesses(tr, leaf, direction, c.parentFen, nextFen);
            if (ws.length === 0) continue;
            perKeyFired.set(key, (perKeyFired.get(key) ?? 0) + 1);
            baseFired.set(key, baseFired.get(key)! + 1);
            if (quiet) baseQuietFired.set(key, baseQuietFired.get(key)! + 1);
            if (ws.some((w) => w.remote && w.consequential)) {
              perKeySignal.set(key, (perKeySignal.get(key) ?? 0) + 1);
              baseSignal.set(key, baseSignal.get(key)! + 1);
              if (quiet) {
                perKeyQuietSignal.set(key, (perKeyQuietSignal.get(key) ?? 0) + 1);
                baseQuietSignal.set(key, baseQuietSignal.get(key)! + 1);
              }
            }
          }
        }
      }
      if (moves.length === 0) continue;
      for (const key of perCase[i]!.signals) {
        const d = disc.get(key)!;
        d.firedAltShare.push((perKeyFired.get(key) ?? 0) / moves.length);
        d.signalAltShare.push((perKeySignal.get(key) ?? 0) / moves.length);
        d.quietSignalShare.push(quietHere === 0 ? 0 : (perKeyQuietSignal.get(key) ?? 0) / quietHere);
        d.altCount.push(moves.length);
      }
    }

    const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

    // ------------------------------------------------------------------------
    // Report
    // ------------------------------------------------------------------------
    const out: string[] = [];
    out.push(`# R3 raw output — ${n} spine transitions, ${packs.size} committed packs`);
    out.push("");
    out.push(`Corpus: \`content/drafts/\`, ${packs.size} packs, ${n} transitions, ${altTotal} legal alternatives enumerated across the same ${n} parent positions (${quietTotal} of them quiet).`);
    out.push("");
    out.push("## 1. By-product — R1's (attacker,target) pair keying, re-run on this corpus");
    out.push("");
    out.push("| R1 primitive | R1 published (35 packs, 593 tr) | this corpus, same keying |");
    out.push("|---|---|---|");
    out.push(`| P1 attacks created/removed | 50.6% | ${pct(uncorrected.attacks!, n)} |`);
    out.push(`| P2 defences created/removed | 74.9% | ${pct(uncorrected.defences!, n)} |`);
    out.push(`| P3 lines opened/closed | 52.6% | ${pct(uncorrected.lines!, n)} |`);
    out.push(`| P5 escape squares removed (opposite-of-mover only) | 61.2% | ${pct(uncorrected.escapes!, n)} |`);
    out.push(`| P6 duty acquired | 6.7% | ${pct(uncorrected.duties!, n)} |`);
    out.push(`| P8b irreversibility | 13.2% | ${pct(uncorrected.irrev!, n)} |`);
    out.push(`| P8a clock zeroed | 13.8% | ${pct(uncorrected.zeroed!, n)} |`);
    out.push("");
    out.push("## 2. Corrected firing rates — target-keyed, colour-keyed, both-occupied (RFC §2.3/§2.4)");
    out.push("");
    out.push("| Leaf | any direction, any colour | per direction | R1 published upper bound |");
    out.push("|---|---|---|---|");
    const R1_BOUND: Record<string, string> = {
      attacked_squares_changed: "50.6%", defended_squares_changed: "74.9%", slider_lines_changed: "52.6%",
      escape_squares_changed: "61.2%", defended_duties_changed: "6.7%", move_irreversibility: "13.2%",
    };
    for (const leaf of LEAVES) {
      const per = LEAF_DIRECTIONS[leaf].map((d) => `${d} ${pct(rows.get(`${leaf}:${d}`)!.fired, n)}`).join(", ");
      out.push(`| \`${leaf}\` | **${pct(leafFired.get(leaf)!, n)}** | ${per} | ${R1_BOUND[leaf]} |`);
    }
    out.push("");
    out.push(`Exactly-comparable escape figure (R1's P5 shape — \`lost\` only, non-mover colour only): **${pct(escapeComparable, n)}** against R1's 61.2% / this corpus's uncorrected ${pct(uncorrected.escapes!, n)}.`);
    out.push("");
    out.push("## 3. Signal — the T/C witness classification");
    out.push("");
    out.push("T (remote) = the fact concerns a piece other than the one that moved. C (consequential) = it names something contested under the rules alone. SIGNAL = at least one witness that is both.");
    out.push("");
    out.push("| Leaf:direction | fires | ≥1 T1 | ≥1 T0 | ≥1 C | **SIGNAL (T1∧C)** | SIGNAL (T0∧C) | **FP rate of the firing (T1)** | FP rate (T0) | witnesses/firing | signal witnesses/firing |");
    out.push("|---|---|---|---|---|---|---|---|---|---|---|");
    for (const key of rows.keys()) {
      const r = rows.get(key)!;
      const fp = r.fired === 0 ? "—" : `${(((r.fired - r.signal) / r.fired) * 100).toFixed(1)}%`;
      const fps = r.fired === 0 ? "—" : `${(((r.fired - r.signalStrict) / r.fired) * 100).toFixed(1)}%`;
      out.push(`| \`${key}\` | ${pct(r.fired, n)} | ${pct(r.remote, n)} | ${pct(r.remoteStrict, n)} | ${pct(r.consequential, n)} | **${pct(r.signal, n)}** | ${pct(r.signalStrict, n)} | **${fp}** | ${fps} | ${r.fired === 0 ? "—" : (r.witnessTotal / r.fired).toFixed(2)} | ${r.fired === 0 ? "—" : (r.witnessSignal / r.fired).toFixed(2)} |`);
    }
    out.push("");
    out.push("| Leaf (any direction) | fires | SIGNAL (T1∧C) | FP rate (T1) | SIGNAL (T0∧C) | FP rate (T0) |");
    out.push("|---|---|---|---|---|---|");
    for (const leaf of LEAVES) {
      const f = leafFired.get(leaf)!;
      const s = leafSignal.get(leaf)!;
      const ss = leafSignalStrict.get(leaf)!;
      out.push(`| \`${leaf}\` | ${pct(f, n)} | **${pct(s, n)}** | **${f === 0 ? "—" : `${(((f - s) / f) * 100).toFixed(1)}%`}** | ${pct(ss, n)} | ${f === 0 ? "—" : `${(((f - ss) / f) * 100).toFixed(1)}%`} |`);
    }
    out.push("");
    // --- does firing rate predict usefulness? Spearman rank correlation over the six leaves.
    const fr = LEAVES.map((l) => leafFired.get(l)! / n);
    const fpr = LEAVES.map((l) => (leafFired.get(l)! === 0 ? 1 : (leafFired.get(l)! - leafSignal.get(l)!) / leafFired.get(l)!));
    const sr = LEAVES.map((l) => leafSignal.get(l)! / n);
    const rank = (xs: number[]): number[] => xs.map((x) => 1 + xs.filter((y) => y < x).length);
    const spearman = (a: number[], b: number[]): number => {
      const ra = rank(a); const rb = rank(b);
      const m = a.length;
      const d2 = ra.map((x, i) => (x - rb[i]!) ** 2).reduce((p, q) => p + q, 0);
      return 1 - (6 * d2) / (m * (m * m - 1));
    };
    out.push("### Is the RFC's selectivity proxy valid? (does a low firing rate predict a low FP rate?)");
    out.push("");
    out.push("| Leaf | firing rate | FP rate (T1) | signal rate |");
    out.push("|---|---|---|---|");
    LEAVES.forEach((l, i) => out.push(`| \`${l}\` | ${(fr[i]! * 100).toFixed(1)}% | ${(fpr[i]! * 100).toFixed(1)}% | ${(sr[i]! * 100).toFixed(1)}% |`));
    out.push("");
    out.push(`Spearman ρ(firing rate, FP rate) over the six leaves = **${spearman(fr, fpr).toFixed(3)}** (a valid proxy would be strongly positive).`);
    out.push(`Spearman ρ(firing rate, signal rate) = **${spearman(fr, sr).toFixed(3)}**.`);
    out.push("");
    out.push(`Whole-census aggregate: at least one leaf fires on ${pct(anyLeafFired, n)} of transitions; at least one leaf signals on ${pct(anyLeafSignal, n)}.`);
    out.push(`On-request reading volume: **${(readingWitnessTotal / n).toFixed(2)} observations per ply**, of which **${(readingWitnessSignal / n).toFixed(2)}** are T∧C.`);
    out.push("");
    out.push("## 4. Axis D — discrimination against the mover's own legal alternatives");
    out.push("");
    out.push("Read: given that the played move signalled, what share of the SAME position's other legal moves would also have signalled? High = the hint describes the position, not the move (the R2 failure shape).");
    out.push("");
    out.push("| Leaf:direction | n signalling | mean share of alternatives that also FIRE | mean share that also SIGNAL | mean share of QUIET alternatives that signal | corpus-wide signal rate over all alternatives |");
    out.push("|---|---|---|---|---|---|");
    for (const key of rows.keys()) {
      const d = disc.get(key)!;
      if (d.signalAltShare.length === 0) { out.push(`| \`${key}\` | 0 | — | — | — | ${pct(baseSignal.get(key)!, altTotal)} |`); continue; }
      out.push(`| \`${key}\` | ${d.signalAltShare.length} | ${(mean(d.firedAltShare) * 100).toFixed(1)}% | **${(mean(d.signalAltShare) * 100).toFixed(1)}%** | ${(mean(d.quietSignalShare) * 100).toFixed(1)}% | ${pct(baseSignal.get(key)!, altTotal)} |`);
    }
    out.push("");
    out.push("### Control — the same leaves over every legal alternative in every spine position");
    out.push("");
    out.push("| Leaf:direction | fires on alternatives | signals on alternatives | signals on QUIET alternatives |");
    out.push("|---|---|---|---|");
    for (const key of rows.keys()) {
      out.push(`| \`${key}\` | ${pct(baseFired.get(key)!, altTotal)} | ${pct(baseSignal.get(key)!, altTotal)} | ${pct(baseQuietSignal.get(key)!, quietTotal)} |`);
    }
    out.push("");
    out.push("### Lift — does the PLAYED (authored) move signal more often than an arbitrary legal move?");
    out.push("");
    out.push("| Leaf:direction | signal rate, played spine moves (n=" + n + ") | signal rate, all legal alternatives (n=" + altTotal + ") | signal rate, quiet alternatives (n=" + quietTotal + ") | lift vs quiet |");
    out.push("|---|---|---|---|---|");
    for (const key of rows.keys()) {
      const r = rows.get(key)!;
      const played = r.signal / n;
      const quiet = baseQuietSignal.get(key)! / quietTotal;
      out.push(`| \`${key}\` | ${(played * 100).toFixed(1)}% | ${pct(baseSignal.get(key)!, altTotal)} | ${(quiet * 100).toFixed(1)}% | **${quiet === 0 ? "—" : `${(played / quiet).toFixed(2)}×`}** |`);
    }
    out.push("");
    out.push("## 5. The live-tier candidate — `defended_duties_changed(acquired)`, decomposed");
    out.push("");
    const db = dutyBreakdown;
    out.push(`- witnesses total: **${db.total}** over ${rows.get("defended_duties_changed:acquired")!.fired} firing transitions`);
    out.push(`- of the mover's own colour: ${db.moverColour} (${pct(db.moverColour, db.total)}); of the opponent's: ${db.opponentColour} (${pct(db.opponentColour, db.total)})`);
    out.push(`- passes T (new ward not merely a square the move itself touched): ${db.remote} (${pct(db.remote, db.total)}); fails T: ${db.wardOnMovedSquare}`);
    out.push(`- passes C (sole defender of ≥1 ward): ${db.sole} (${pct(db.sole, db.total)})`);
    out.push(`- passes both: **${db.both} (${pct(db.both, db.total)})**`);
    out.push("");
    out.push("## 6. Phase split of the signal");
    out.push("");
    const phases = ["opening", "middlegame", "endgame", "cross_phase"];
    out.push("| Leaf | " + phases.map((p) => `${p} (n=${cases.filter((c) => c.phase === p).length})`).join(" | ") + " |");
    out.push("|---|" + phases.map(() => "---").join("|") + "|");
    for (const leaf of LEAVES) {
      const cells = phases.map((ph) => {
        const sub = cases.filter((c) => c.phase === ph);
        if (sub.length === 0) return "—";
        let s = 0;
        for (const c of sub) {
          let hit = false;
          for (const d of LEAF_DIRECTIONS[leaf]) {
            const ws = witnesses(c.t, leaf, d, c.parentFen, c.fen);
            if (ws.some((w) => w.remote && w.consequential)) hit = true;
          }
          if (hit) s += 1;
        }
        return pct(s, sub.length);
      });
      out.push(`| \`${leaf}\` | ${cells.join(" | ")} |`);
    }
    out.push("");
    out.push("## 7. Worked examples");
    out.push("");
    for (const key of rows.keys()) {
      const b = examples.get(key);
      if (b === undefined) continue;
      out.push(`### \`${key}\``);
      out.push("");
      out.push("**Signalling (T∧C):**");
      out.push(b.useful.length > 0 ? b.useful.join("\n") : "- none");
      out.push("");
      out.push("**Non-signalling (the false positives):**");
      out.push(b.useless.length > 0 ? b.useless.join("\n") : "- none");
      out.push("");
    }

    const report = out.join("\n");
    writeFileSync(new URL("./r3-output.md", import.meta.url).pathname, report);
    console.log(report);
    expect(n).toBeGreaterThan(500);
  });
});
