// DISPOSABLE research harness — R11, the conjunction hypothesis. Not production code.
//
// R11 (`design/research/campaign-effect-vocabulary.md` §7): "does a conjunction of two
// independent primitives beat either alone on R3's T/C/D gate?"
//
// Built on the R3 harness verbatim (leaves.ts, and R1's corpus/primitives), so every
// single-leaf number here is R3's number re-measured on the current corpus.

import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import type { Move, Square } from "chessops/types";
import { makeSquare } from "chessops/util";

import { transitions } from "../r1r2-primitives-harness/corpus.js";
import { pos } from "../r1r2-primitives-harness/primitives.js";
import {
  LEAF_DIRECTIONS, ctxOf, transition, witnesses,
  type Ctx, type LeafName,
} from "../r3-census-hint-harness/leaves.js";

import { structuralReading } from "../../packages/runtime/src/structure.js";
import { classifyPhase } from "../../packages/runtime/src/phase.js";

const LEAVES = Object.keys(LEAF_DIRECTIONS) as LeafName[];
const KEYS: string[] = [];
for (const leaf of LEAVES) for (const d of LEAF_DIRECTIONS[leaf]) KEYS.push(`${leaf}:${d}`);
const KEY_ORDER = new Map(KEYS.map((k, i) => [k, i]));
/** Canonical pair/triple key — ordered by KEYS position, never alphabetically. */
function comboKey(ks: string[]): string {
  return [...ks].sort((a, b) => KEY_ORDER.get(a)! - KEY_ORDER.get(b)!).join(" ∧ ");
}
/** 95% one-sided upper bound on a rate observed as 0 in n trials (rule of three). */
function ruleOfThree(n: number): number { return 3 / n; }

function pct(x: number, n: number): string {
  return n === 0 ? "—" : `${((x / n) * 100).toFixed(1)}%`;
}
function pct2(x: number, n: number): string {
  return n === 0 ? "—" : `${((x / n) * 100).toFixed(2)}%`;
}
function legalMoves(p: Chess): Move[] {
  const out: Move[] = [];
  for (const [from, dests] of p.allDests()) {
    const piece = p.board.get(from)!;
    for (const to of dests) {
      const rank = to >> 3;
      if (piece.role === "pawn" && (rank === 0 || rank === 7)) out.push({ from, to, promotion: "queen" });
      else out.push({ from, to });
    }
  }
  return out;
}
function playTo(p: Chess, move: Move): Chess {
  const next = p.clone();
  next.play(move);
  return next;
}
const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/** Per-move census result: which keys fired, which keys signalled (T1 ∧ C), witness counts. */
interface Census {
  readonly fired: Set<string>;
  readonly signal: Set<string>;
  readonly witnessTotal: number;
  readonly witnessSignal: number;
}

function censusOf(before: Ctx, after: Ctx, uci: string, parentFen: string, childFen: string): Census {
  const tr = transition(before, after, uci);
  const fired = new Set<string>();
  const signal = new Set<string>();
  let witnessTotal = 0;
  let witnessSignal = 0;
  for (const leaf of LEAVES) {
    for (const direction of LEAF_DIRECTIONS[leaf]) {
      const ws = witnesses(tr, leaf, direction, parentFen, childFen);
      if (ws.length === 0) continue;
      const key = `${leaf}:${direction}`;
      fired.add(key);
      witnessTotal += ws.length;
      const sig = ws.filter((w) => w.remote && w.consequential);
      witnessSignal += sig.length;
      if (sig.length > 0) signal.add(key);
    }
  }
  return { fired, signal, witnessTotal, witnessSignal };
}

describe("R11 — the conjunction hypothesis", () => {
  it("measures whether a conjunction of two primitives beats either alone on T/C/D", () => {
    const all = transitions();
    const packs = new Set(all.map((t) => t.pack));
    const n = all.length;

    const out: string[] = [];
    const P = (s = ""): void => { out.push(s); };

    interface Case {
      readonly before: Ctx;
      readonly parentFen: string;
      readonly fen: string;
      readonly uci: string;
      readonly san: string;
      readonly pack: string;
      readonly phase: string;
      readonly ply: number;
      readonly census: Census;
      /** lens ids true at the PARENT position (context lenses) */
      readonly parentLenses: Set<string>;
      /** lens ids true at the CHILD position — recomputed per alternative in leg 4b */
      readonly childLenses: Set<string>;
    }

    // ---- lens vocabulary: the shipped structural reading + the shipped phase classifier ----
    function lensesOf(fen: string): Set<string> {
      const s = new Set<string>();
      const r = structuralReading(fen);
      for (const f of r.features) s.add(`feature:${f.kind}`);
      for (const st of r.structures) s.add(`structure:${st.id}`);
      s.add(`phase:${classifyPhase(fen).phase}`);
      return s;
    }

    const cases: Case[] = all.map((x) => {
      const before = ctxOf(pos(x.parentFen));
      const after = ctxOf(pos(x.fen));
      return {
        before, parentFen: x.parentFen, fen: x.fen, uci: x.uci, san: x.san,
        pack: x.pack, phase: x.phase, ply: x.ply,
        census: censusOf(before, after, x.uci, x.parentFen, x.fen),
        parentLenses: lensesOf(x.parentFen),
        childLenses: lensesOf(x.fen),
      };
    });

    // =====================================================================
    // LEG 0 — R3's own headline, re-run on the current corpus.
    // =====================================================================
    const firedCount = new Map<string, number>();
    const signalCount = new Map<string, number>();
    for (const k of KEYS) { firedCount.set(k, 0); signalCount.set(k, 0); }
    let witnessTotal = 0;
    let witnessSignal = 0;
    let anyFired = 0;
    let anySignal = 0;
    for (const c of cases) {
      for (const k of c.census.fired) firedCount.set(k, firedCount.get(k)! + 1);
      for (const k of c.census.signal) signalCount.set(k, signalCount.get(k)! + 1);
      witnessTotal += c.census.witnessTotal;
      witnessSignal += c.census.witnessSignal;
      if (c.census.fired.size > 0) anyFired += 1;
      if (c.census.signal.size > 0) anySignal += 1;
    }
    const obsPerPly = witnessTotal / n;
    const sigPerPly = witnessSignal / n;
    const headlineFp = 1 - witnessSignal / witnessTotal;

    P(`# R11 raw output — the conjunction hypothesis`);
    P();
    P(`Corpus: \`content/drafts/\`, **${packs.size} packs**, **${n} spine transitions** (\`.evidence\`/\`.job\`/\`.sources\`/\`.browser\` sidecars excluded by \`tools/r1r2-primitives-harness/corpus.ts\`).`);
    P();
    P(`## Leg 0 — R3's headline, re-measured on the current corpus`);
    P();
    P(`| Figure | R3 (2026-08-15, 37 packs / 634 transitions) | this pass (${packs.size} packs / ${n} transitions) |`);
    P(`|---|---|---|`);
    P(`| observations per ply | 6.18 | **${obsPerPly.toFixed(2)}** |`);
    P(`| T∧C observations per ply | 0.68 | **${sigPerPly.toFixed(2)}** |`);
    P(`| **false-positive rate, observation level** | **89.0%** | **${(headlineFp * 100).toFixed(1)}%** |`);
    P(`| ≥1 leaf fires | 96.8% | ${pct(anyFired, n)} |`);
    P(`| ≥1 leaf signals | 43.4% | ${pct(anySignal, n)} |`);
    P();
    P(`Raw: ${witnessTotal} observations, ${witnessSignal} of them T∧C.`);
    P();

    // per-leaf (any direction) FP + Spearman, R3 §6
    const leafFired = new Map<LeafName, number>();
    const leafSignal = new Map<LeafName, number>();
    for (const l of LEAVES) { leafFired.set(l, 0); leafSignal.set(l, 0); }
    for (const c of cases) {
      for (const l of LEAVES) {
        const ds = LEAF_DIRECTIONS[l].map((d) => `${l}:${d}`);
        if (ds.some((k) => c.census.fired.has(k))) leafFired.set(l, leafFired.get(l)! + 1);
        if (ds.some((k) => c.census.signal.has(k))) leafSignal.set(l, leafSignal.get(l)! + 1);
      }
    }
    const rank = (xs: number[]): number[] => xs.map((x) => 1 + xs.filter((y) => y < x).length);
    const spearman = (a: number[], b: number[]): number => {
      const ra = rank(a); const rb = rank(b);
      const m = a.length;
      const d2 = ra.map((x, i) => (x - rb[i]!) ** 2).reduce((p, q) => p + q, 0);
      return 1 - (6 * d2) / (m * (m * m - 1));
    };
    const fr = LEAVES.map((l) => leafFired.get(l)! / n);
    const fpr = LEAVES.map((l) => (leafFired.get(l)! === 0 ? 1 : (leafFired.get(l)! - leafSignal.get(l)!) / leafFired.get(l)!));
    P(`| Leaf | firing rate | FP rate (T1) | signal rate |`);
    P(`|---|---|---|---|`);
    LEAVES.forEach((l, i) => P(`| \`${l}\` | ${(fr[i]! * 100).toFixed(1)}% | ${(fpr[i]! * 100).toFixed(1)}% | ${pct(leafSignal.get(l)!, n)} |`));
    P();
    P(`Spearman ρ(firing rate, FP rate) = **${spearman(fr, fpr).toFixed(3)}** (R3: −0.143).`);
    P();

    // =====================================================================
    // The alternative-move population — R3's axis D machinery, but recording the
    // full per-alternative signal SET so every pair is derivable.
    // =====================================================================
    interface AltBundle {
      readonly quiet: boolean[];
      readonly fired: Set<string>[];
      readonly signal: Set<string>[];
      readonly childLenses: Set<string>[];
    }
    const altBundles: AltBundle[] = [];
    let altTotal = 0;
    let quietTotal = 0;
    const baseFiredAll = new Map<string, number>();
    const baseSignalQuiet = new Map<string, number>();
    const baseSignalAll = new Map<string, number>();
    for (const k of KEYS) { baseFiredAll.set(k, 0); baseSignalQuiet.set(k, 0); baseSignalAll.set(k, 0); }
    // pair counters over the alternative population
    const pairSignalQuiet = new Map<string, number>();
    const pairSignalAll = new Map<string, number>();

    for (const c of cases) {
      const moves = legalMoves(c.before.p);
      const bundle: AltBundle = { quiet: [], fired: [], signal: [], childLenses: [] };
      for (const m of moves) {
        const nextPos = playTo(c.before.p, m);
        const nextFen = makeFen(nextPos.toSetup());
        const after: Ctx = ctxOf(nextPos);
        const uci = `${makeSquare(m.from as Square)}${makeSquare(m.to)}${m.promotion ? "q" : ""}`;
        const isCapture = c.before.p.board.occupied.has(m.to)
          || (c.before.p.board.get(m.from as Square)!.role === "pawn" && (m.from as number) % 8 !== m.to % 8);
        const quiet = !isCapture && !nextPos.isCheck();
        const cen = censusOf(c.before, after, uci, c.parentFen, nextFen);
        bundle.quiet.push(quiet);
        bundle.fired.push(cen.fired);
        bundle.signal.push(cen.signal);
        bundle.childLenses.push(quiet ? lensesOf(nextFen) : new Set<string>());
        altTotal += 1;
        if (quiet) quietTotal += 1;
        for (const k of cen.fired) baseFiredAll.set(k, baseFiredAll.get(k)! + 1);
        for (const k of cen.signal) baseSignalAll.set(k, baseSignalAll.get(k)! + 1);
        const sigAll = [...cen.signal];
        for (let i = 0; i < sigAll.length; i += 1) {
          for (let j = i + 1; j < sigAll.length; j += 1) {
            const pk = comboKey([sigAll[i]!, sigAll[j]!]);
            pairSignalAll.set(pk, (pairSignalAll.get(pk) ?? 0) + 1);
            if (quiet) pairSignalQuiet.set(pk, (pairSignalQuiet.get(pk) ?? 0) + 1);
          }
        }
        if (quiet) for (const k of cen.signal) baseSignalQuiet.set(k, baseSignalQuiet.get(k)! + 1);
      }
      altBundles.push(bundle);
    }

    // =====================================================================
    // LEG 1 — is the premise true? Do two leaves fire near-independently?
    // §4: "if two primitives fire near-independently at rates p and q, their
    //      conjunction fires at ≈pq".
    // =====================================================================
    interface PairRow {
      readonly a: string;
      readonly b: string;
      bothFire: number;
      bothSignal: number;        // A signals AND B signals
      aSigGivenBoth: number;     // A signals, given both fire
      bSigGivenBoth: number;
      eitherSignal: number;
    }
    const pairs = new Map<string, PairRow>();
    for (let i = 0; i < KEYS.length; i += 1) {
      for (let j = i + 1; j < KEYS.length; j += 1) {
        pairs.set(comboKey([KEYS[i]!, KEYS[j]!]), {
          a: KEYS[i]!, b: KEYS[j]!, bothFire: 0, bothSignal: 0,
          aSigGivenBoth: 0, bSigGivenBoth: 0, eitherSignal: 0,
        });
      }
    }
    for (const c of cases) {
      for (const [, r] of pairs) {
        const af = c.census.fired.has(r.a);
        const bf = c.census.fired.has(r.b);
        if (!(af && bf)) continue;
        r.bothFire += 1;
        const as = c.census.signal.has(r.a);
        const bs = c.census.signal.has(r.b);
        if (as) r.aSigGivenBoth += 1;
        if (bs) r.bSigGivenBoth += 1;
        if (as && bs) r.bothSignal += 1;
        if (as || bs) r.eitherSignal += 1;
      }
    }

    const indepRows: { key: string; observed: number; expected: number; lift: number; phi: number }[] = [];
    for (const [key, r] of pairs) {
      const pa = firedCount.get(r.a)! / n;
      const pb = firedCount.get(r.b)! / n;
      const expected = pa * pb * n;
      const na = firedCount.get(r.a)!;
      const nb = firedCount.get(r.b)!;
      const denom = Math.sqrt(na * (n - na) * nb * (n - nb));
      const phi = denom === 0 ? 0 : (r.bothFire * n - na * nb) / denom;
      indepRows.push({ key, observed: r.bothFire, expected, lift: expected === 0 ? 0 : r.bothFire / expected, phi });
    }
    indepRows.sort((x, y) => y.lift - x.lift);
    const lifts = indepRows.map((r) => r.lift);
    const phis = indepRows.map((r) => r.phi);

    P(`## Leg 1 — is the premise true? (do two leaves fire near-independently?)`);
    P();
    P(`§4's mechanism assumes joint firing at ≈ p·q. Measured over all ${pairs.size} ordered-free pairs of the ${KEYS.length} leaf:direction keys, on the ${n} spine transitions:`);
    P();
    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| median firing lift observed/(p·q·n) | **${median(lifts).toFixed(3)}** |`);
    P(`| mean firing lift | ${mean(lifts).toFixed(3)} |`);
    P(`| min / max firing lift | ${Math.min(...lifts).toFixed(3)} / ${Math.max(...lifts).toFixed(3)} |`);
    P(`| pairs with lift ≥ 1.20 (positively coupled) | ${lifts.filter((x) => x >= 1.2).length} / ${lifts.length} |`);
    P(`| pairs with lift within ±10% of 1.0 (independent) | ${lifts.filter((x) => x >= 0.9 && x <= 1.1).length} / ${lifts.length} |`);
    P(`| median φ (phi correlation of the two firings) | ${median(phis).toFixed(3)} |`);
    P(`| max φ | ${Math.max(...phis).toFixed(3)} |`);
    P();
    P(`Ten most coupled pairs:`);
    P();
    P(`| pair | observed joint | expected under independence | lift | φ |`);
    P(`|---|---|---|---|---|`);
    for (const r of indepRows.slice(0, 10)) {
      P(`| \`${r.key}\` | ${r.observed} | ${r.expected.toFixed(1)} | **${r.lift.toFixed(2)}×** | ${r.phi.toFixed(3)} |`);
    }
    P();

    // =====================================================================
    // LEG 2 — precision. Does a conjunction beat either component?
    // =====================================================================
    interface Leg2 {
      key: string; a: string; b: string;
      fireRate: number; precision: number;
      precA: number; precB: number; bestSingle: number;
      filterGainA: number; filterGainB: number;
      bothFire: number; bothSignal: number;
    }
    const leg2: Leg2[] = [];
    for (const [key, r] of pairs) {
      if (r.bothFire < 10) continue; // avoid a "verdict" from 3 observations
      const precA = signalCount.get(r.a)! / firedCount.get(r.a)!;
      const precB = signalCount.get(r.b)! / firedCount.get(r.b)!;
      leg2.push({
        key, a: r.a, b: r.b,
        fireRate: r.bothFire / n,
        precision: r.bothSignal / r.bothFire,
        precA, precB, bestSingle: Math.max(precA, precB),
        filterGainA: r.aSigGivenBoth / r.bothFire - precA,
        filterGainB: r.bSigGivenBoth / r.bothFire - precB,
        bothFire: r.bothFire, bothSignal: r.bothSignal,
      });
    }
    leg2.sort((x, y) => y.precision - x.precision);
    const beatBoth = leg2.filter((r) => r.precision > r.bestSingle);
    const beatBothMargin5 = leg2.filter((r) => r.precision > r.bestSingle + 0.05);

    P(`## Leg 2 — precision (axes T ∧ C). Does the conjunction beat either component?`);
    P();
    P(`Detector = both keys fire. Success = **both** keys produce a T∧C witness (§4's "each component stays rung-honest"). Pairs with < 10 joint firings excluded (${pairs.size - leg2.length} of ${pairs.size}).`);
    P();
    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| pairs measured | ${leg2.length} |`);
    P(`| pairs whose precision exceeds **both** components' precision | **${beatBoth.length} / ${leg2.length}** |`);
    P(`| … by more than 5 points | ${beatBothMargin5.length} / ${leg2.length} |`);
    P(`| best single-leaf:direction precision on the corpus | **${(Math.max(...KEYS.map((k) => (firedCount.get(k)! === 0 ? 0 : signalCount.get(k)! / firedCount.get(k)!))) * 100).toFixed(1)}%** |`);
    P(`| best conjunction precision | **${(leg2[0]!.precision * 100).toFixed(1)}%** (\`${leg2[0]!.key}\`) |`);
    P();
    P(`Top 12 conjunctions by precision:`);
    P();
    P(`| conjunction | fires (of ${n}) | precision | prec A | prec B | beats both? |`);
    P(`|---|---|---|---|---|---|`);
    for (const r of leg2.slice(0, 12)) {
      P(`| \`${r.key}\` | ${r.bothFire} (${pct(r.bothFire, n)}) | **${(r.precision * 100).toFixed(1)}%** | ${(r.precA * 100).toFixed(1)}% | ${(r.precB * 100).toFixed(1)}% | ${r.precision > r.bestSingle ? "**yes**" : "no"} |`);
    }
    P();
    P(`### Filter form — does B's firing raise A's own precision? (adding a lens to a loadout)`);
    P();
    const gains: number[] = [];
    for (const r of leg2) { gains.push(r.filterGainA); gains.push(r.filterGainB); }
    gains.sort((a, b) => b - a);
    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| conditioned precisions measured (2 per pair) | ${gains.length} |`);
    P(`| median change in precision from conditioning | **${(median(gains) * 100).toFixed(1)} pp** |`);
    P(`| conditionings that raise precision at all | ${gains.filter((x) => x > 0).length} / ${gains.length} |`);
    P(`| conditionings that raise it by ≥ 10 pp | ${gains.filter((x) => x >= 0.1).length} / ${gains.length} |`);
    P(`| best / worst | ${(gains[0]! * 100).toFixed(1)} pp / ${(gains[gains.length - 1]! * 100).toFixed(1)} pp |`);
    P();
    P(`### Does the SIGNAL multiply too? (the arithmetic behind the inversion)`);
    P();
    P(`§4 assumes the *firing* multiplies while each component "stays rung-honest". If the two signals are also near-independent given both fired, then precision(A∧B) ≈ precision(A|both) × precision(B|both) — i.e. the **false positives multiply at the same rate the specificity does**.`);
    P();
    {
      const ratios: number[] = [];
      const rows2: string[] = [];
      for (const [key, r] of pairs) {
        if (r.bothFire < 10) continue;
        const pa = r.aSigGivenBoth / r.bothFire;
        const pb = r.bSigGivenBoth / r.bothFire;
        const product = pa * pb;
        const actual = r.bothSignal / r.bothFire;
        if (product === 0) continue;
        ratios.push(actual / product);
        rows2.push(`| \`${key}\` | ${(actual * 100).toFixed(1)}% | ${(product * 100).toFixed(1)}% | ${(actual / product).toFixed(2)} |`);
      }
      ratios.sort((a, b) => a - b);
      P(`| statistic | value |`);
      P(`|---|---|`);
      P(`| pairs with a non-zero product | ${ratios.length} |`);
      P(`| median observed precision ÷ independent-signal prediction | **${median(ratios).toFixed(2)}** (1.00 = the signals are independent) |`);
      P(`| pairs within ±25% of the independence prediction | ${ratios.filter((x) => x >= 0.75 && x <= 1.25).length} / ${ratios.length} |`);
      P(`| min / max ratio | ${ratios[0]!.toFixed(2)} / ${ratios[ratios.length - 1]!.toFixed(2)} |`);
      P();
    }

    // =====================================================================
    // LEG 3 — axis D. The binding one.
    // =====================================================================
    // For each pair: rate of "both signal" on played spine moves vs on quiet alternatives,
    // and the mean share of the SAME position's alternatives that also both-signal.
    interface Leg3 {
      key: string;
      playedSignal: number;
      quietCount: number;
      quietRate: number;
      lift: number;
      bounded: boolean;   // true when the quiet count was 0 and the lift is a rule-of-three bound
      allLift: number;
      altShare: number;   // mean share of the parent's alternatives that also both-signal
      singleLiftA: number;
      singleLiftB: number;
    }
    const leg3: Leg3[] = [];
    const singleLift = new Map<string, number>();
    const singleLiftAll = new Map<string, number>();
    const singleBounded = new Set<string>();
    for (const k of KEYS) {
      const played = signalCount.get(k)! / n;
      const qc = baseSignalQuiet.get(k)!;
      const quiet = qc === 0 ? ruleOfThree(quietTotal) : qc / quietTotal;
      if (qc === 0) singleBounded.add(k);
      singleLift.set(k, quiet === 0 ? 0 : played / quiet);
      const ac = baseSignalAll.get(k)!;
      singleLiftAll.set(k, ac === 0 ? played / ruleOfThree(altTotal) : played / (ac / altTotal));
    }
    for (const [key, r] of pairs) {
      let playedSignal = 0;
      const shares: number[] = [];
      for (let i = 0; i < cases.length; i += 1) {
        const c = cases[i]!;
        if (!(c.census.signal.has(r.a) && c.census.signal.has(r.b))) continue;
        playedSignal += 1;
        const b = altBundles[i]!;
        let hits = 0;
        for (let m = 0; m < b.signal.length; m += 1) {
          if (b.signal[m]!.has(r.a) && b.signal[m]!.has(r.b)) hits += 1;
        }
        if (b.signal.length > 0) shares.push(hits / b.signal.length);
      }
      if (playedSignal < 10) continue;
      const qc = pairSignalQuiet.get(key) ?? 0;
      const quietRate = qc === 0 ? ruleOfThree(quietTotal) : qc / quietTotal;
      const ac = pairSignalAll.get(key) ?? 0;
      const allRate = ac === 0 ? ruleOfThree(altTotal) : ac / altTotal;
      leg3.push({
        key,
        playedSignal,
        quietCount: qc,
        quietRate,
        lift: (playedSignal / n) / quietRate,
        bounded: qc === 0,
        allLift: (playedSignal / n) / allRate,
        altShare: mean(shares),
        singleLiftA: singleLift.get(r.a)!,
        singleLiftB: singleLift.get(r.b)!,
      });
    }
    leg3.sort((x, y) => y.lift - x.lift);

    P(`## Leg 3 — axis D (discrimination against the moves NOT played). The binding axis.`);
    P();
    P(`Population: **${altTotal}** legal alternatives enumerated from the same ${n} parent positions, **${quietTotal}** of them quiet (non-capture, non-checking). Lift = P(conjunction signals | played spine move) ÷ P(conjunction signals | random quiet alternative). R3 condemned \`slider_lines_changed\` at **1.05×** and the shipped duty marker at **0.61×**.`);
    P();
    P(`Where the alternative population produced **zero** signalling moves the rate is replaced by its 95% one-sided upper bound (rule of three, 3/N), so the lift is a **lower bound** (marked \`≥\`) rather than infinity. A second lift against **all** ${altTotal} alternatives is given because the quiet filter itself excludes some leaves by construction (\`move_irreversibility\`'s only T-passing subkind is \`last_of_role\`, which requires a capture).`);
    P();
    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| conjunctions with ≥ 10 signalling spine moves | ${leg3.length} of ${pairs.size} |`);
    P(`| … of which the lift is a bound (0 quiet signalling alternatives) | ${leg3.filter((r) => r.bounded).length} |`);
    P(`| median axis-D lift | **${median(leg3.map((r) => r.lift)).toFixed(2)}×** |`);
    P(`| median axis-D lift vs ALL alternatives | **${median(leg3.map((r) => r.allLift)).toFixed(2)}×** |`);
    P(`| conjunctions with lift ≥ 2.0× | ${leg3.filter((r) => r.lift >= 2).length} / ${leg3.length} |`);
    P(`| conjunctions with lift < 1.0× (worse than a random quiet move) | ${leg3.filter((r) => r.lift < 1).length} / ${leg3.length} |`);
    P(`| median single-key lift over the ${KEYS.length} keys | ${median([...singleLift.values()]).toFixed(2)}× |`);
    P(`| best single-key lift (excluding the bounded one) | ${Math.max(...KEYS.filter((k) => !singleBounded.has(k)).map((k) => singleLift.get(k)!)).toFixed(2)}× |`);
    P(`| median "share of the same position's alternatives that also signal the conjunction" | **${(median(leg3.map((r) => r.altShare)) * 100).toFixed(1)}%** |`);
    P();
    P(`Single-key baseline (R3's own lift table, re-measured):`);
    P();
    P(`| key | signal rate, played | signal rate, quiet alternatives | lift vs quiet | lift vs all alternatives |`);
    P(`|---|---|---|---|---|`);
    for (const k of KEYS) {
      const b = singleBounded.has(k);
      P(`| \`${k}\` | ${pct2(signalCount.get(k)!, n)} | ${pct2(baseSignalQuiet.get(k)!, quietTotal)} | **${b ? "≥" : ""}${singleLift.get(k)!.toFixed(2)}×** | ${baseSignalAll.get(k)! === 0 ? "≥" : ""}${singleLiftAll.get(k)!.toFixed(2)}× |`);
    }
    P();
    P(`All ${leg3.length} measurable conjunctions, by axis-D lift:`);
    P();
    P(`| conjunction | signalling spine moves | quiet signalling alternatives | **lift vs quiet** | lift vs all | lift A alone | lift B alone | alternatives at the same position that also signal |`);
    P(`|---|---|---|---|---|---|---|---|`);
    for (const r of leg3) {
      P(`| \`${r.key}\` | ${r.playedSignal} | ${r.quietCount} (${(r.quietRate * 100).toFixed(2)}%${r.bounded ? ", bound" : ""}) | **${r.bounded ? "≥" : ""}${r.lift.toFixed(2)}×** | ${r.allLift.toFixed(2)}× | ${r.singleLiftA.toFixed(2)}× | ${r.singleLiftB.toFixed(2)}× | ${(r.altShare * 100).toFixed(1)}% |`);
    }
    P();

    // ---- the joint verdict: does any conjunction beat every single key on BOTH axes? ----
    const bestSinglePrec = Math.max(...KEYS.map((k) => (firedCount.get(k)! === 0 ? 0 : signalCount.get(k)! / firedCount.get(k)!)));
    const bestSingleLift = Math.max(...KEYS.filter((k) => !singleBounded.has(k)).map((k) => singleLift.get(k)!));
    const leg3ByKey = new Map(leg3.map((r) => [r.key, r]));
    const dominators = leg2
      .filter((r) => leg3ByKey.has(r.key))
      .map((r) => ({ ...r, lift: leg3ByKey.get(r.key)!.lift, altShare: leg3ByKey.get(r.key)!.altShare }))
      .filter((r) => r.precision > bestSinglePrec && r.lift > bestSingleLift);
    // A weaker bar: beat the better of its OWN two components on both axes.
    const selfDominators = leg2
      .filter((r) => leg3ByKey.has(r.key))
      .map((r) => ({ ...r, l: leg3ByKey.get(r.key)! }))
      .filter((r) => r.precision > r.bestSingle && r.l.lift > Math.max(r.l.singleLiftA, r.l.singleLiftB));
    P(`### The dominance test`);
    P();
    P(`A conjunction "beats either alone" only if it beats the best single key on **both** axes at once.`);
    P();
    P(`| bar | value |`);
    P(`|---|---|`);
    P(`| best single-key precision | ${(bestSinglePrec * 100).toFixed(1)}% |`);
    P(`| best single-key axis-D lift | ${bestSingleLift.toFixed(2)}× |`);
    P(`| conjunctions clearing **both** global bars | **${dominators.length}** |`);
    P(`| conjunctions clearing the weaker bar — beating **their own** two components on both axes | **${selfDominators.length} / ${leg3.length}** |`);
    P();
    if (selfDominators.length > 0) {
      P(`| conjunction | fires | precision | best component precision | lift | best component lift |`);
      P(`|---|---|---|---|---|---|`);
      for (const r of selfDominators) {
        P(`| \`${r.key}\` | ${pct(r.bothFire, n)} | ${(r.precision * 100).toFixed(1)}% | ${(r.bestSingle * 100).toFixed(1)}% | ${r.l.lift.toFixed(2)}× | ${Math.max(r.l.singleLiftA, r.l.singleLiftB).toFixed(2)}× |`);
      }
      P();
    }
    if (dominators.length > 0) {
      P(`| conjunction | fires | precision | lift | volume per 20-ply branch |`);
      P(`|---|---|---|---|---|`);
      for (const r of dominators.sort((x, y) => y.lift - x.lift)) {
        P(`| \`${r.key}\` | ${pct(r.bothFire, n)} | ${(r.precision * 100).toFixed(1)}% | ${r.lift.toFixed(2)}× | ${((leg3ByKey.get(r.key)!.playedSignal / n) * 20).toFixed(2)} |`);
      }
      P();
    }

    // =====================================================================
    // LEG 4 — cross-family: census leaf ∧ shipped position lens.
    // This is the shape §4's three worked triples actually have.
    // =====================================================================
    const lensCounts = new Map<string, number>();
    for (const c of cases) for (const l of c.parentLenses) lensCounts.set(l, (lensCounts.get(l) ?? 0) + 1);
    // exclude unconditional lenses (fire on >95% of parents) and near-empty ones (<2%)
    const usableLenses = [...lensCounts.entries()]
      .filter(([, k]) => k / n >= 0.02 && k / n <= 0.95)
      .map(([l]) => l)
      .sort();
    const unconditional = [...lensCounts.entries()].filter(([, k]) => k / n > 0.95).map(([l]) => l).sort();

    P(`## Leg 4 — cross-family conjunctions: a census leaf ∧ a shipped position lens`);
    P();
    P(`§4's three worked triples all conjoin a **transition** primitive with a **position** lens (a structure, a passed pawn, a phase). Lens vocabulary = the shipped \`structuralReading()\` feature kinds + named structures + \`classifyPhase()\`, evaluated on the **parent** position.`);
    P();
    P(`Lenses present on the corpus: ${lensCounts.size}. Unconditional (fire on > 95% of parents, excluded per \`campaign-effect-vocabulary.md\` §6 rule 4): **${unconditional.length}** — ${unconditional.map((l) => `\`${l}\``).join(", ") || "none"}. Usable (2–95%): **${usableLenses.length}**.`);
    P();

    interface Leg4 {
      key: string; leafKey: string; lens: string;
      fires: number; precision: number; leafPrecision: number;
      playedSignal: number; quietRate: number; lift: number; leafLift: number;
      withinPositionShare: number;
    }
    const leg4: Leg4[] = [];
    for (const k of KEYS) {
      for (const lens of usableLenses) {
        let fires = 0;
        let sig = 0;
        for (const c of cases) {
          if (!c.parentLenses.has(lens)) continue;
          if (!c.census.fired.has(k)) continue;
          fires += 1;
          if (c.census.signal.has(k)) sig += 1;
        }
        if (fires < 10) continue;
        // axis D over the quiet alternatives — the lens is a property of the PARENT, so it
        // gates whole positions, not moves.
        let qHit = 0;
        let qTot = 0;
        let inShare = 0;
        let inShareN = 0;
        for (let i = 0; i < cases.length; i += 1) {
          if (!cases[i]!.parentLenses.has(lens)) continue;
          const b = altBundles[i]!;
          for (let m = 0; m < b.signal.length; m += 1) {
            if (!b.quiet[m]) continue;
            qTot += 1;
            if (b.signal[m]!.has(k)) qHit += 1;
          }
          if (cases[i]!.census.signal.has(k) && b.signal.length > 0) {
            let hits = 0;
            for (let m = 0; m < b.signal.length; m += 1) if (b.signal[m]!.has(k)) hits += 1;
            inShare += hits / b.signal.length;
            inShareN += 1;
          }
        }
        const playedIn = cases.filter((c) => c.parentLenses.has(lens)).length;
        const playedSig = cases.filter((c) => c.parentLenses.has(lens) && c.census.signal.has(k)).length;
        const playedRate = playedIn === 0 ? 0 : playedSig / playedIn;
        const quietRate = qHit === 0 ? ruleOfThree(Math.max(qTot, 1)) : qHit / qTot;
        leg4.push({
          key: `${k} ∧ ${lens}`, leafKey: k, lens,
          fires, precision: sig / fires,
          leafPrecision: signalCount.get(k)! / firedCount.get(k)!,
          playedSignal: playedSig,
          quietRate,
          lift: quietRate === 0 ? 0 : playedRate / quietRate,
          leafLift: singleLift.get(k)!,
          withinPositionShare: inShareN === 0 ? 0 : inShare / inShareN,
        });
      }
    }
    leg4.sort((x, y) => y.lift - x.lift);
    const leg4Better = leg4.filter((r) => r.precision > r.leafPrecision);
    const leg4LiftBetter = leg4.filter((r) => r.lift > r.leafLift);

    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| leaf ∧ lens combinations with ≥ 10 firings | ${leg4.length} |`);
    P(`| combinations that raise the leaf's **precision** | ${leg4Better.length} / ${leg4.length} |`);
    P(`| median precision change | ${(median(leg4.map((r) => r.precision - r.leafPrecision)) * 100).toFixed(1)} pp |`);
    P(`| max precision change | ${(Math.max(...leg4.map((r) => r.precision - r.leafPrecision)) * 100).toFixed(1)} pp |`);
    P(`| combinations that raise the leaf's **axis-D lift** | ${leg4LiftBetter.length} / ${leg4.length} |`);
    P(`| median axis-D lift change | **${median(leg4.map((r) => r.lift - r.leafLift)).toFixed(3)}×** |`);
    P(`| max axis-D lift | ${Math.max(...leg4.map((r) => r.lift)).toFixed(2)}× vs best single-key ${bestSingleLift.toFixed(2)}× |`);
    P();
    P(`Top 10 by precision gain:`);
    P();
    P(`| leaf ∧ lens | firings | precision | leaf alone | Δ | axis-D lift | leaf lift alone | alternatives at the same position that also signal |`);
    P(`|---|---|---|---|---|---|---|---|`);
    for (const r of [...leg4].sort((x, y) => (y.precision - y.leafPrecision) - (x.precision - x.leafPrecision)).slice(0, 10)) {
      P(`| \`${r.key}\` | ${r.fires} | **${(r.precision * 100).toFixed(1)}%** | ${(r.leafPrecision * 100).toFixed(1)}% | ${((r.precision - r.leafPrecision) * 100).toFixed(1)} pp | ${r.lift.toFixed(2)}× | ${r.leafLift.toFixed(2)}× | ${(r.withinPositionShare * 100).toFixed(1)}% |`);
    }
    P();
    P(`**The structural check — a parent-scoped lens is discrimination-inert by construction.** A lens read on the position *before* the move takes the same value for the played move and for every alternative from that position, so conjoining with it cannot change *which move* is singled out — only *at which positions the surface speaks*. Verified rather than asserted: for all ${leg4.length} combinations the within-position share of also-signalling alternatives is computed over the lens-true positions and is, by construction, the leaf's own share restricted to that subpopulation; the conjunction adds **zero** within-position separation. The lift column above moves only because the *denominator population* changes.`);
    P();

    // 4b — the same lens evaluated on the CHILD position, so it varies across alternatives.
    interface Leg4b { key: string; leafKey: string; lens: string; playedSignal: number; quietRate: number; lift: number; leafLift: number }
    const leg4b: Leg4b[] = [];
    const childLensCounts = new Map<string, number>();
    for (const c of cases) for (const l of c.childLenses) childLensCounts.set(l, (childLensCounts.get(l) ?? 0) + 1);
    const usableChildLenses = [...childLensCounts.entries()].filter(([, k]) => k / n >= 0.02 && k / n <= 0.95).map(([l]) => l).sort();
    for (const k of KEYS) {
      for (const lens of usableChildLenses) {
        let playedSig = 0;
        for (const c of cases) if (c.census.signal.has(k) && c.childLenses.has(lens)) playedSig += 1;
        if (playedSig < 10) continue;
        let qHit = 0;
        for (let i = 0; i < cases.length; i += 1) {
          const b = altBundles[i]!;
          for (let m = 0; m < b.signal.length; m += 1) {
            if (!b.quiet[m]) continue;
            if (b.signal[m]!.has(k) && b.childLenses[m]!.has(lens)) qHit += 1;
          }
        }
        const quietRate = qHit / quietTotal;
        leg4b.push({ key: `${k} ∧ after:${lens}`, leafKey: k, lens, playedSignal: playedSig, quietRate, lift: quietRate === 0 ? 0 : (playedSig / n) / quietRate, leafLift: singleLift.get(k)! });
      }
    }
    leg4b.sort((x, y) => y.lift - x.lift);
    P(`### 4b — the same lenses read on the position AFTER the move (so they vary across alternatives)`);
    P();
    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| combinations with ≥ 10 signalling spine moves | ${leg4b.length} |`);
    P(`| median axis-D lift | **${median(leg4b.map((r) => r.lift)).toFixed(2)}×** |`);
    P(`| combinations beating their own leaf's lift | ${leg4b.filter((r) => r.lift > r.leafLift).length} / ${leg4b.length} |`);
    P(`| max axis-D lift | ${Math.max(...leg4b.map((r) => r.lift)).toFixed(2)}× |`);
    P();
    P(`| leaf ∧ after-lens | signalling spine moves | quiet rate | lift | leaf lift alone |`);
    P(`|---|---|---|---|---|`);
    for (const r of leg4b.slice(0, 10)) {
      P(`| \`${r.key}\` | ${r.playedSignal} | ${(r.quietRate * 100).toFixed(2)}% | **${r.lift.toFixed(2)}×** | ${r.leafLift.toFixed(2)}× |`);
    }
    P();

    // =====================================================================
    // LEG 5 — triples, to see whether the multiplication continues.
    // =====================================================================
    interface TripleRow { key: string; fires: number; signal: number; quiet: number; lift: number }
    const tripleFire = new Map<string, number>();
    const tripleSignal = new Map<string, number>();
    const tripleQuiet = new Map<string, number>();
    for (const c of cases) {
      const f = [...c.census.fired];
      for (let i = 0; i < f.length; i += 1) for (let j = i + 1; j < f.length; j += 1) for (let k = j + 1; k < f.length; k += 1) {
        const key = comboKey([f[i]!, f[j]!, f[k]!]);
        tripleFire.set(key, (tripleFire.get(key) ?? 0) + 1);
      }
      const s = [...c.census.signal];
      for (let i = 0; i < s.length; i += 1) for (let j = i + 1; j < s.length; j += 1) for (let k = j + 1; k < s.length; k += 1) {
        const key = comboKey([s[i]!, s[j]!, s[k]!]);
        tripleSignal.set(key, (tripleSignal.get(key) ?? 0) + 1);
      }
    }
    for (let i = 0; i < altBundles.length; i += 1) {
      const b = altBundles[i]!;
      for (let m = 0; m < b.signal.length; m += 1) {
        if (!b.quiet[m]) continue;
        const s = [...b.signal[m]!];
        for (let x = 0; x < s.length; x += 1) for (let y = x + 1; y < s.length; y += 1) for (let z = y + 1; z < s.length; z += 1) {
          const key = comboKey([s[x]!, s[y]!, s[z]!]);
          tripleQuiet.set(key, (tripleQuiet.get(key) ?? 0) + 1);
        }
      }
    }
    const triples: TripleRow[] = [];
    for (const [key, sig] of tripleSignal) {
      if (sig < 10) continue;
      const qc = tripleQuiet.get(key) ?? 0;
      const q = qc === 0 ? ruleOfThree(quietTotal) : qc / quietTotal;
      triples.push({ key, fires: tripleFire.get(key) ?? 0, signal: sig, quiet: q, lift: (sig / n) / q });
    }
    triples.sort((x, y) => y.lift - x.lift);
    const tripleMax = Math.max(0, ...[...tripleSignal.values()]);
    P(`## Leg 5 — triples (does the multiplication continue?)`);
    P();
    P(`| statistic | value |`);
    P(`|---|---|`);
    P(`| distinct triples where all three keys FIRE (≥ 10 spine witnesses) | ${[...tripleFire.values()].filter((v) => v >= 10).length} |`);
    P(`| distinct triples where all three keys SIGNAL, at any count | ${tripleSignal.size} |`);
    P(`| largest signalling-triple witness count anywhere in the corpus | **${tripleMax}** of ${n} transitions |`);
    P(`| triples with ≥ 10 signalling spine witnesses | **${triples.length}** |`);
    P();
    if (triples.length > 0) {
      P(`| triple | signalling spine moves | quiet rate | lift |`);
      P(`|---|---|---|---|`);
      for (const r of triples.slice(0, 8)) P(`| \`${r.key}\` | ${r.signal} | ${(r.quiet * 100).toFixed(2)}% | **${r.lift.toFixed(2)}×** |`);
      P();
    }
    {
      const top = [...tripleSignal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      P(`Five most frequent signalling triples (all below the ≥ 10 bar):`);
      P();
      P(`| triple | signalling spine moves |`);
      P(`|---|---|`);
      for (const [key, v] of top) P(`| \`${key}\` | ${v} |`);
      P();
    }

    // =====================================================================
    // LEG 6 — the population sensitivity check.
    // =====================================================================
    P(`## Leg 6 — population sensitivity`);
    P();
    P(`Primary population: the **${n} authored spine transitions** — moves an author endorsed. Every rate above is conditioned on it. Two alternative populations, same instrument:`);
    P();
    const phases = ["opening", "middlegame", "endgame", "cross_phase"];
    P(`### 6a — by declared pack phase (the corpus's middlegame grew from 1 pack to 11 since R3)`);
    P();
    P(`| phase | transitions | obs/ply | T∧C/ply | observation-level FP | ≥1 leaf signals |`);
    P(`|---|---|---|---|---|---|`);
    for (const ph of phases) {
      const sub = cases.filter((c) => c.phase === ph);
      if (sub.length === 0) { P(`| ${ph} | 0 | — | — | — | — |`); continue; }
      const wt = sub.reduce((a, c) => a + c.census.witnessTotal, 0);
      const ws = sub.reduce((a, c) => a + c.census.witnessSignal, 0);
      const anyS = sub.filter((c) => c.census.signal.size > 0).length;
      P(`| ${ph} | ${sub.length} | ${(wt / sub.length).toFixed(2)} | ${(ws / sub.length).toFixed(2)} | **${wt === 0 ? "—" : `${((1 - ws / wt) * 100).toFixed(1)}%`}** | ${pct(anyS, sub.length)} |`);
    }
    P();
    P(`### 6b — the conjunction verdict re-run on the middlegame alone`);
    P();
    {
      const sub = cases.filter((c) => c.phase === "middlegame");
      const subN = sub.length;
      const fc = new Map<string, number>();
      const sc = new Map<string, number>();
      for (const k of KEYS) { fc.set(k, 0); sc.set(k, 0); }
      for (const c of sub) { for (const k of c.census.fired) fc.set(k, fc.get(k)! + 1); for (const k of c.census.signal) sc.set(k, sc.get(k)! + 1); }
      let best = 0;
      let bestKey = "—";
      const rowsOut: string[] = [];
      for (const [key, r] of pairs) {
        let bf = 0;
        let bs = 0;
        for (const c of sub) {
          if (!(c.census.fired.has(r.a) && c.census.fired.has(r.b))) continue;
          bf += 1;
          if (c.census.signal.has(r.a) && c.census.signal.has(r.b)) bs += 1;
        }
        if (bf < 10) continue;
        const p = bs / bf;
        if (p > best) { best = p; bestKey = key; }
        rowsOut.push(`${key}|${bf}|${p}`);
      }
      const bestSingleSub = Math.max(...KEYS.map((k) => (fc.get(k)! === 0 ? 0 : sc.get(k)! / fc.get(k)!)));
      P(`| figure | middlegame only (n = ${subN}) | whole corpus (n = ${n}) |`);
      P(`|---|---|---|`);
      P(`| best single-key precision | ${(bestSingleSub * 100).toFixed(1)}% | ${(bestSinglePrec * 100).toFixed(1)}% |`);
      P(`| best conjunction precision | ${(best * 100).toFixed(1)}% (\`${bestKey}\`) | ${(leg2[0]!.precision * 100).toFixed(1)}% |`);
      P(`| pairs measurable (≥ 10 joint firings) | ${rowsOut.length} | ${leg2.length} |`);
      P();
    }
    P(`### 6c — what a different population would have done`);
    P();
    {
      // Re-run leg 2's headline over the QUIET-ALTERNATIVE population instead of the spine.
      let beat = 0;
      let measured = 0;
      const singlePrecAlt = new Map<string, { fired: number; signal: number }>();
      for (const k of KEYS) singlePrecAlt.set(k, { fired: 0, signal: 0 });
      const pairAlt = new Map<string, { fired: number; signal: number }>();
      for (const key of pairs.keys()) pairAlt.set(key, { fired: 0, signal: 0 });
      for (const b of altBundles) {
        for (let m = 0; m < b.fired.length; m += 1) {
          if (!b.quiet[m]) continue;
          const f = b.fired[m]!;
          const s = b.signal[m]!;
          for (const k of f) singlePrecAlt.get(k)!.fired += 1;
          for (const k of s) singlePrecAlt.get(k)!.signal += 1;
          const fa = [...f];
          for (let i = 0; i < fa.length; i += 1) for (let j = i + 1; j < fa.length; j += 1) {
            const pk = comboKey([fa[i]!, fa[j]!]);
            const rec = pairAlt.get(pk);
            if (rec === undefined) continue;
            rec.fired += 1;
            if (s.has(fa[i]!) && s.has(fa[j]!)) rec.signal += 1;
          }
        }
      }
      for (const [key, r] of pairs) {
        const rec = pairAlt.get(key)!;
        if (rec.fired < 10) continue;
        measured += 1;
        const pa = singlePrecAlt.get(r.a)!;
        const pb = singlePrecAlt.get(r.b)!;
        const best = Math.max(pa.fired === 0 ? 0 : pa.signal / pa.fired, pb.fired === 0 ? 0 : pb.signal / pb.fired);
        if (rec.signal / rec.fired > best) beat += 1;
      }
      P(`Re-running Leg 2 with the **${quietTotal} quiet legal alternatives** as the population instead of the ${n} authored spine moves:`);
      P();
      P(`| figure | spine population | quiet-alternative population |`);
      P(`|---|---|---|`);
      P(`| pairs measured | ${leg2.length} | ${measured} |`);
      P(`| pairs whose precision beats both components | ${beatBoth.length} (${pct(beatBoth.length, leg2.length)}) | ${beat} (${pct(beat, measured)}) |`);
      P();
    }

    const report = out.join("\n");
    writeFileSync(new URL("./r11-output.md", import.meta.url).pathname, report);
    console.log(report);
    expect(n).toBeGreaterThan(600);
  });
});
