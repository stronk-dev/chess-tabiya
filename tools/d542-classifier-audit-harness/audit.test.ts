// DISPOSABLE research harness — classifier coverage and noise audit.
// Re-derives the D78 selectivity headline at HEAD and adds the measurement D78 never made:
// PER-KIND discrimination, which decides whether the noise is in the detectors or in the
// delivery. Method mirrors tools/q8-feedback-surface-harness (compare-strip axis D) and
// tools/r11-conjunction-harness §5 (lift = P(fires on played) / P(fires on alternatives)).
import { writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  STRUCTURAL_FEATURE_KINDS,
  TRANSITION_FEATURE_KINDS,
  classifyPhase,
  irreversibility,
  structuralReading,
  transitionReading,
  type StructuralObservation,
} from "@chess-tabiya/runtime";

import { transitions, type Transition } from "../r1r2-primitives-harness/corpus.js";

const OUT = new URL("./output.md", import.meta.url).pathname;

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

/** The shipped compare-strip key: packages/runtime/src/compare-strips.ts:21. */
function observationKey(value: StructuralObservation): string {
  return JSON.stringify(value);
}

interface Alt { readonly uci: string; readonly fen: string; readonly quiet: boolean }

function alternatives(fen: string): Alt[] {
  const pos = position(fen);
  const out: Alt[] = [];
  for (const [from, dests] of pos.allDests()) {
    for (const to of dests) {
      const roles = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? (["queen"] as const) : ([undefined] as const);
      for (const promotion of roles) {
        const move = promotion === undefined ? { from, to } : { from, to, promotion };
        if (!pos.isLegal(move)) continue;
        const capture = pos.board.occupied.has(to) || (pos.board.getRole(from) === "pawn" && pos.epSquare === to);
        const next = pos.clone();
        next.play(move);
        out.push({ uci: makeUci(move), fen: makeFen(next.toSetup()), quiet: !capture && !next.isCheck() });
      }
    }
  }
  return out;
}

function pct(n: number, d: number): string { return d === 0 ? "n/a" : `${((100 * n) / d).toFixed(2)}%`; }
function quantiles(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
  return { min: sorted[0]!, p50: at(0.5), mean: values.reduce((a, b) => a + b, 0) / values.length, p95: at(0.95), max: sorted.at(-1)! };
}

describe("classifier coverage and noise", () => {
  it("measures reading volume, compare-strip selectivity, and per-kind discrimination", () => {
    const rows: Transition[] = transitions();
    const lines: string[] = [];
    const say = (s = "") => { lines.push(s); console.log(s); };

    say(`# Classifier audit — raw output`);
    say();
    say(`Corpus: ${new Set(rows.map((r) => r.pack)).size} packs, ${rows.length} spine transitions.`);
    const byPhase = new Map<string, number>();
    for (const r of rows) byPhase.set(r.phase, (byPhase.get(r.phase) ?? 0) + 1);
    say(`Phase: ${[...byPhase].map(([k, v]) => `${k} ${v}`).join(", ")}.`);
    say();

    // ------------------------------------------------------------- 1. reading volume at HEAD
    const allFens = [...new Set(rows.flatMap((r) => [r.parentFen, r.fen]))];
    const readingCache = new Map<string, readonly StructuralObservation[]>();
    const featuresFor = (fen: string): readonly StructuralObservation[] => {
      let v = readingCache.get(fen);
      if (v === undefined) { v = structuralReading(fen).features; readingCache.set(fen, v); }
      return v;
    };
    const counts: number[] = [];
    const kindTotals = new Map<string, number>();
    const kindPresent = new Map<string, number>();
    for (const fen of allFens) {
      const kinds = featuresFor(fen).map((f) => f.kind);
      counts.push(kinds.length);
      const seen = new Set<string>();
      for (const kind of kinds) { kindTotals.set(kind, (kindTotals.get(kind) ?? 0) + 1); seen.add(kind); }
      for (const kind of seen) kindPresent.set(kind, (kindPresent.get(kind) ?? 0) + 1);
    }
    const q = quantiles(counts);
    say(`## 1. Structural reading volume (${allFens.length} distinct positions)`);
    say();
    say(`observations/position: min ${q.min} / median ${q.p50} / mean ${q.mean.toFixed(2)} / p95 ${q.p95} / max ${q.max}`);
    say();
    say(`| kind | observations | per position | positions where present |`);
    say(`|---|---|---|---|`);
    for (const kind of STRUCTURAL_FEATURE_KINDS) {
      const total = kindTotals.get(kind) ?? 0;
      say(`| \`${kind}\` | ${total} | ${(total / allFens.length).toFixed(2)} | ${pct(kindPresent.get(kind) ?? 0, allFens.length)} |`);
    }
    say();
    const phaseCounts = new Map<string, number[]>();
    for (const row of rows) {
      const list = phaseCounts.get(row.phase) ?? [];
      list.push(featuresFor(row.fen).length);
      phaseCounts.set(row.phase, list);
    }
    say(`Per declared phase (median observations/position):`);
    for (const [phase, list] of [...phaseCounts].sort()) say(`- ${phase}: median ${quantiles(list).p50} (n=${list.length})`);
    say();

    // ------------------------------- 2. compare-strip selectivity + PER-KIND discrimination
    let gainedTotal = 0;
    let firedTransitions = 0;
    const gainedPerPly: number[] = [];
    let dParents = 0;
    let altQuietTotal = 0;
    let altQuietFiring = 0;
    let sameKindShareSum = 0;
    let anyShareSum = 0;
    // per-kind: played firings, and alternative firings over the SAME parent set
    const playedKindFires = new Map<string, number>();
    const altKindFires = new Map<string, number>();
    let playedEvaluated = 0;
    let altEvaluated = 0;

    for (const row of rows) {
      const before = new Set(featuresFor(row.parentFen).map(observationKey));
      const gained = featuresFor(row.fen).filter((f) => !before.has(observationKey(f)));
      gainedTotal += gained.length;
      gainedPerPly.push(gained.length);
      if (gained.length > 0) firedTransitions += 1;
      const playedKinds = new Set(gained.map((f) => f.kind));

      // per-kind discrimination is measured over EVERY parent that has alternatives, not only
      // parents where the played move fired — otherwise the played side is conditioned on firing.
      const alts = alternatives(row.parentFen).filter((a) => a.uci !== row.uci);
      if (alts.length > 0) {
        playedEvaluated += 1;
        for (const kind of playedKinds) playedKindFires.set(kind, (playedKindFires.get(kind) ?? 0) + 1);
        for (const alt of alts) {
          altEvaluated += 1;
          const altKinds = new Set(structuralReading(alt.fen).features.filter((f) => !before.has(observationKey(f))).map((f) => f.kind));
          for (const kind of altKinds) altKindFires.set(kind, (altKindFires.get(kind) ?? 0) + 1);
        }
      }

      // D78's axis D, unmodified: quiet alternatives only, parents where the played move fired
      if (gained.length === 0) continue;
      const quiet = alts.filter((a) => a.quiet);
      if (quiet.length === 0) continue;
      dParents += 1;
      let anyFiring = 0;
      let sameKind = 0;
      for (const alt of quiet) {
        const altGained = structuralReading(alt.fen).features.filter((f) => !before.has(observationKey(f)));
        if (altGained.length > 0) anyFiring += 1;
        if (altGained.some((f) => playedKinds.has(f.kind))) sameKind += 1;
      }
      altQuietTotal += quiet.length;
      altQuietFiring += anyFiring;
      anyShareSum += anyFiring / quiet.length;
      sameKindShareSum += sameKind / quiet.length;
    }

    const gq = quantiles(gainedPerPly);
    say(`## 2. Compare-strip structure entries (compare-strips.ts:47)`);
    say();
    say(`Transitions with >=1 entry: ${firedTransitions}/${rows.length} = ${pct(firedTransitions, rows.length)}.`);
    say(`Entries per ply: total ${gainedTotal}, mean ${(gainedTotal / rows.length).toFixed(2)}, median ${gq.p50}, p95 ${gq.p95}, max ${gq.max}.`);
    say(`Axis D parents: ${dParents}. Quiet alternatives evaluated: ${altQuietTotal}.`);
    say(`Quiet alternatives that also gain >=1 observation: ${altQuietFiring} = ${pct(altQuietFiring, altQuietTotal)} (pooled).`);
    say(`Mean within-position share of quiet alternatives that also gain >=1: ${(100 * anyShareSum / dParents).toFixed(2)}%.`);
    say(`Mean within-position share that gain >=1 of the SAME kind: ${(100 * sameKindShareSum / dParents).toFixed(2)}%.`);
    const aggregateLift = (firedTransitions / rows.length) / (altQuietFiring / altQuietTotal);
    say(`AGGREGATE LIFT (any-entry, played vs quiet alternative): ${aggregateLift.toFixed(4)}x.`);
    say();

    say(`## 3. PER-KIND discrimination — structural observation gained by the move`);
    say();
    say(`Denominators: ${playedEvaluated} played moves, ${altEvaluated} legal alternatives (all, not only quiet).`);
    say();
    say(`| kind | played fires | played rate | alt fires | alt rate | LIFT |`);
    say(`|---|---|---|---|---|---|`);
    const kindRows = STRUCTURAL_FEATURE_KINDS.map((kind) => {
      const p = playedKindFires.get(kind) ?? 0;
      const a = altKindFires.get(kind) ?? 0;
      const pr = p / playedEvaluated;
      const ar = a / altEvaluated;
      return { kind, p, a, pr, ar, lift: ar === 0 ? Number.POSITIVE_INFINITY : pr / ar };
    }).sort((x, y) => y.lift - x.lift);
    for (const r of kindRows) {
      say(`| \`${r.kind}\` | ${r.p} | ${(100 * r.pr).toFixed(2)}% | ${r.a} | ${(100 * r.ar).toFixed(3)}% | ${r.p === 0 ? "n/a" : Number.isFinite(r.lift) ? `${r.lift.toFixed(2)}x` : "inf"} |`);
    }
    say();

    // ------------------------------- 4. transition census per-kind discrimination (R3 leaves)
    const playedTransKind = new Map<string, number>();
    const altTransKind = new Map<string, number>();
    let transPlayed = 0;
    let transAlt = 0;
    for (const row of rows) {
      const reading = transitionReading(row.parentFen, row.uci, row.fen);
      if (reading === null) continue;
      const alts = alternatives(row.parentFen).filter((a) => a.uci !== row.uci);
      if (alts.length === 0) continue;
      transPlayed += 1;
      for (const kind of new Set(reading.observations.map((o) => `${o.kind}:${"direction" in o ? o.direction : (o as { subkind: string }).subkind}`))) {
        playedTransKind.set(kind, (playedTransKind.get(kind) ?? 0) + 1);
      }
      for (const alt of alts) {
        const altReading = transitionReading(row.parentFen, alt.uci, alt.fen);
        if (altReading === null) continue;
        transAlt += 1;
        for (const kind of new Set(altReading.observations.map((o) => `${o.kind}:${"direction" in o ? o.direction : (o as { subkind: string }).subkind}`))) {
          altTransKind.set(kind, (altTransKind.get(kind) ?? 0) + 1);
        }
      }
    }
    say(`## 4. PER-KIND discrimination — transition census (transition.ts:344)`);
    say();
    say(`Denominators: ${transPlayed} played moves, ${transAlt} alternatives.`);
    say();
    say(`| leaf:direction | played rate | alt rate | LIFT |`);
    say(`|---|---|---|---|`);
    const transKeys = [...new Set([...playedTransKind.keys(), ...altTransKind.keys()])];
    const transRows = transKeys.map((key) => {
      const pr = (playedTransKind.get(key) ?? 0) / transPlayed;
      const ar = (altTransKind.get(key) ?? 0) / transAlt;
      return { key, pr, ar, lift: ar === 0 ? Number.POSITIVE_INFINITY : pr / ar };
    }).sort((x, y) => y.lift - x.lift);
    for (const r of transRows) say(`| \`${r.key}\` | ${(100 * r.pr).toFixed(2)}% | ${(100 * r.ar).toFixed(3)}% | ${Number.isFinite(r.lift) ? `${r.lift.toFixed(2)}x` : "inf"} |`);
    say();
    say(`Transition-kind coverage check: ${TRANSITION_FEATURE_KINDS.length} declared kinds, ${new Set(transKeys.map((k) => k.split(":")[0])).size} observed on this corpus.`);
    say();

    // -------------------------------------- 5. what a RANKED surface would print instead
    // Take the top-k kinds by lift from §3 and re-measure the strip as if only those printed.
    say(`## 5. Ranked-surface counterfactual — strip restricted to the top-k kinds by lift`);
    say();
    say(`| k | kinds kept | transitions firing | entries/ply | quiet-alt firing | LIFT |`);
    say(`|---|---|---|---|---|---|`);
    for (const k of [1, 2, 3, 5, 8]) {
      const keep = new Set(kindRows.filter((r) => r.p > 0).slice(0, k).map((r) => r.kind));
      let fired = 0;
      let entries = 0;
      let altTot = 0;
      let altFired = 0;
      for (const row of rows) {
        const before = new Set(featuresFor(row.parentFen).map(observationKey));
        const gained = featuresFor(row.fen).filter((f) => !before.has(observationKey(f)) && keep.has(f.kind));
        entries += gained.length;
        if (gained.length > 0) fired += 1;
        const quiet = alternatives(row.parentFen).filter((a) => a.quiet && a.uci !== row.uci);
        for (const alt of quiet) {
          altTot += 1;
          if (structuralReading(alt.fen).features.some((f) => !before.has(observationKey(f)) && keep.has(f.kind))) altFired += 1;
        }
      }
      const lift = (fired / rows.length) / (altFired / altTot);
      say(`| ${k} | ${[...keep].join(", ")} | ${pct(fired, rows.length)} | ${(entries / rows.length).toFixed(2)} | ${pct(altFired, altTot)} | ${lift.toFixed(2)}x |`);
    }
    say();

    // ------------------------------------------------- 6. pushed markers and phase coverage
    const irrev = new Map<string, number>();
    let irrevFiring = 0;
    for (const row of rows) {
      const detail = irreversibility(row.parentFen, row.uci, row.fen);
      if (detail === undefined) continue;
      irrevFiring += 1;
      irrev.set(detail.subkind, (irrev.get(detail.subkind) ?? 0) + 1);
    }
    say(`## 6. Pivotal markers`);
    say(`irreversibility fires on ${irrevFiring}/${rows.length} = ${pct(irrevFiring, rows.length)}.`);
    for (const [k, v] of [...irrev].sort((a, b) => b[1] - a[1])) say(`- \`${k}\`: ${v} (${pct(v, rows.length)})`);
    const phaseBands = new Map<string, number>();
    for (const fen of allFens) {
      const p = classifyPhase(fen).phase;
      phaseBands.set(p, (phaseBands.get(p) ?? 0) + 1);
    }
    say(`Phase bands over ${allFens.length} positions: ${[...phaseBands].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${pct(v, allFens.length)})`).join(", ")}.`);
    let phaseChanges = 0;
    for (const row of rows) {
      const b = classifyPhase(row.parentFen).phase;
      const a = classifyPhase(row.fen).phase;
      if (b !== "unclear" && a !== "unclear" && b !== a) phaseChanges += 1;
    }
    say(`phase_change candidate transitions: ${phaseChanges}/${rows.length} = ${pct(phaseChanges, rows.length)}.`);
    let collapse = 0;
    for (const fen of allFens) {
      const pos = position(fen);
      let n = 0;
      for (const [from, dests] of pos.allDests()) for (const to of dests) if (pos.isLegal({ from, to })) n += pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? 4 : 1;
      if (n <= 3) collapse += 1;
    }
    say(`option_collapse floor (<=3 legal): ${collapse}/${allFens.length} = ${pct(collapse, allFens.length)}.`);
    say();

    // ------------------------------------------ 7. named-structure / catalogue reach (coverage)
    let structureHits = 0;
    const structureNames = new Map<string, number>();
    for (const fen of allFens) {
      const s = structuralReading(fen).structures;
      if (s.length === 0) continue;
      structureHits += 1;
      for (const item of s) structureNames.set(item.id, (structureNames.get(item.id) ?? 0) + 1);
    }
    say(`## 7. Named-structure catalogue reach`);
    say(`Positions matching >=1 of the 4 catalogue structures: ${structureHits}/${allFens.length} = ${pct(structureHits, allFens.length)}.`);
    for (const [k, v] of [...structureNames].sort((a, b) => b[1] - a[1])) say(`- ${k}: ${v} (${pct(v, allFens.length)})`);
    say();

    writeFileSync(OUT, `${lines.join("\n")}\n`, "utf8");
    expect(rows.length).toBeGreaterThan(500);
  });
});
