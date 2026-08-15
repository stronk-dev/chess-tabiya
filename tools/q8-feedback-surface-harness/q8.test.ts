// DISPOSABLE research harness — Q8 (planning/exploration/plan.md). Not production code.
// Measures the SHIPPED derived-feedback surfaces over the committed pack corpus, applying
// R3's necessary-condition method (design/research/census-hint-false-positives.md §3b) to
// the surfaces this product actually renders, rather than to the RFC's proposed leaves.
import { writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  classifyPhase,
  endgameReading,
  irreversibility,
  renderEndgameReading,
  structuralReading,
  type StructuralObservation,
} from "@chess-tabiya/runtime";

import { transitions, type Transition } from "../r1r2-primitives-harness/corpus.js";

const OUT = new URL("./q8-output.md", import.meta.url).pathname;

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

/** The shipped compare-strip key: packages/runtime/src/compare-strips.ts:19. */
function observationKey(value: StructuralObservation): string {
  return JSON.stringify(value);
}

function readingKeys(fen: string): { keys: Set<string>; kinds: string[] } {
  const features = structuralReading(fen).features;
  return { keys: new Set(features.map(observationKey)), kinds: features.map((f) => f.kind) };
}

interface Alt {
  readonly uci: string;
  readonly fen: string;
  readonly quiet: boolean;
}

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
        const check = next.isCheck();
        out.push({ uci: makeUci(move), fen: makeFen(next.toSetup()), quiet: !capture && !check });
      }
    }
  }
  return out;
}

function pct(n: number, d: number): string {
  return d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)}%`;
}

function quantiles(values: number[]): { min: number; p50: number; mean: number; p95: number; max: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
  return {
    min: sorted[0]!,
    p50: at(0.5),
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    p95: at(0.95),
    max: sorted.at(-1)!,
  };
}

describe("Q8 — the shipped derived-feedback surface", () => {
  it("measures reading volume, compare-strip volume, discrimination, and the pushed markers", () => {
    const rows: Transition[] = transitions();
    const lines: string[] = [];
    const say = (s = "") => { lines.push(s); console.log(s); };

    say(`# Q8 raw output — the shipped derived-feedback surface`);
    say();
    say(`Corpus: ${new Set(rows.map((r) => r.pack)).size} packs, ${rows.length} spine transitions.`);
    const byPhase = new Map<string, number>();
    for (const r of rows) byPhase.set(r.phase, (byPhase.get(r.phase) ?? 0) + 1);
    say(`Phase: ${[...byPhase].map(([k, v]) => `${k} ${v}`).join(", ")}.`);
    say();

    // ---------------------------------------------------------------- 1. reading volume
    const allFens = [...new Set(rows.flatMap((r) => [r.parentFen, r.fen]))];
    const counts: number[] = [];
    const kindTotals = new Map<string, number>();
    const kindPresent = new Map<string, number>();
    for (const fen of allFens) {
      const { kinds } = readingKeys(fen);
      counts.push(kinds.length);
      const seen = new Set<string>();
      for (const kind of kinds) {
        kindTotals.set(kind, (kindTotals.get(kind) ?? 0) + 1);
        seen.add(kind);
      }
      for (const kind of seen) kindPresent.set(kind, (kindPresent.get(kind) ?? 0) + 1);
    }
    const q = quantiles(counts);
    say(`## 1. Structural reading — observations per position (${allFens.length} distinct positions)`);
    say();
    say(`min ${q.min} / median ${q.p50} / mean ${q.mean.toFixed(2)} / p95 ${q.p95} / max ${q.max}`);
    say();
    say(`| kind | observations | per position | positions where present |`);
    say(`|---|---|---|---|`);
    for (const [kind, total] of [...kindTotals].sort((a, b) => b[1] - a[1])) {
      say(`| \`${kind}\` | ${total} | ${(total / allFens.length).toFixed(2)} | ${pct(kindPresent.get(kind) ?? 0, allFens.length)} |`);
    }
    say();

    // ---------------------------------------- 2. compare strip volume and discrimination
    let gainedTotal = 0;
    let firedTransitions = 0;
    const gainedPerPly: number[] = [];
    const gainedKind = new Map<string, number>();
    // discrimination: per parent, share of quiet alternatives that also gain >=1 observation,
    // and share that gain >=1 of the SAME kind as the played move.
    let dParents = 0;
    let altQuietTotal = 0;
    let altQuietFiring = 0;
    let sameKindShareSum = 0;
    let anyShareSum = 0;
    const parentCache = new Map<string, Set<string>>();
    const keysFor = (fen: string): Set<string> => {
      let v = parentCache.get(fen);
      if (v === undefined) { v = readingKeys(fen).keys; parentCache.set(fen, v); }
      return v;
    };

    for (const row of rows) {
      const before = keysFor(row.parentFen);
      const after = structuralReading(row.fen).features;
      const gained = after.filter((f) => !before.has(observationKey(f)));
      gainedTotal += gained.length;
      gainedPerPly.push(gained.length);
      if (gained.length > 0) firedTransitions += 1;
      const playedKinds = new Set(gained.map((f) => f.kind));
      for (const kind of playedKinds) gainedKind.set(kind, (gainedKind.get(kind) ?? 0) + 1);

      // D axis, only where the played move fired (mirrors R3 §6's within-position test)
      if (gained.length === 0) continue;
      const alts = alternatives(row.parentFen).filter((a) => a.quiet && a.uci !== row.uci);
      if (alts.length === 0) continue;
      dParents += 1;
      let anyFiring = 0;
      let sameKind = 0;
      for (const alt of alts) {
        const altGained = structuralReading(alt.fen).features.filter((f) => !before.has(observationKey(f)));
        if (altGained.length > 0) anyFiring += 1;
        if (altGained.some((f) => playedKinds.has(f.kind))) sameKind += 1;
      }
      altQuietTotal += alts.length;
      altQuietFiring += anyFiring;
      anyShareSum += anyFiring / alts.length;
      sameKindShareSum += sameKind / alts.length;
    }

    const gq = quantiles(gainedPerPly);
    say(`## 2. Compare-strip structure entries ("a recorded structural observation changed")`);
    say();
    say(`Generator: compare-strips.ts:32 — every observation present at a node and absent at its predecessor.`);
    say(`Transitions with >=1 entry: ${firedTransitions}/${rows.length} = ${pct(firedTransitions, rows.length)}.`);
    say(`Entries per ply: total ${gainedTotal}, mean ${(gainedTotal / rows.length).toFixed(2)}, median ${gq.p50}, p95 ${gq.p95}, max ${gq.max}.`);
    say();
    say(`| gained kind | transitions where gained |`);
    say(`|---|---|`);
    for (const [kind, n] of [...gainedKind].sort((a, b) => b[1] - a[1])) say(`| \`${kind}\` | ${n} (${pct(n, rows.length)}) |`);
    say();
    say(`### Axis D — is the change a property of the move or of the position?`);
    say();
    say(`Parents where the played move gained >=1 observation and >=1 quiet alternative exists: ${dParents}.`);
    say(`Quiet alternatives evaluated: ${altQuietTotal}.`);
    say(`Quiet alternatives that also gain >=1 observation: ${altQuietFiring} = ${pct(altQuietFiring, altQuietTotal)} (pooled).`);
    say(`Mean within-position share of quiet alternatives that also gain >=1: ${(100 * anyShareSum / dParents).toFixed(1)}%.`);
    say(`Mean within-position share of quiet alternatives that gain >=1 of the SAME kind: ${(100 * sameKindShareSum / dParents).toFixed(1)}%.`);
    say();

    // ------------------------------------------------------- 3. the pushed marker surface
    const irrev = new Map<string, number>();
    let irrevFiring = 0;
    for (const row of rows) {
      const detail = irreversibility(row.parentFen, row.uci, row.fen);
      if (detail === undefined) continue;
      irrevFiring += 1;
      irrev.set(detail.subkind, (irrev.get(detail.subkind) ?? 0) + 1);
    }
    say(`## 3. Pushed timeline markers (unasked, no learner request)`);
    say();
    say(`### irreversibility (pivotal.ts:53, rendered pivotal.ts:73-75)`);
    say(`Fires on ${irrevFiring}/${rows.length} = ${pct(irrevFiring, rows.length)} of spine transitions.`);
    for (const [k, v] of [...irrev].sort((a, b) => b[1] - a[1])) say(`- \`${k}\`: ${v} (${pct(v, rows.length)})`);
    say();

    // phase change over spine paths (per pack, walking each root-to-leaf path is overkill;
    // measured here transition-by-transition on the definite bands, which is what the
    // marker does along a path).
    let phaseChanges = 0;
    let unclear = 0;
    for (const row of rows) {
      const before = classifyPhase(row.parentFen).phase;
      const after = classifyPhase(row.fen).phase;
      if (before === "unclear" || after === "unclear") { unclear += 1; continue; }
      if (before !== after) phaseChanges += 1;
    }
    say(`### phase_change (pivotal.ts:49)`);
    say(`Definite→definite transitions that change band: ${phaseChanges}/${rows.length} = ${pct(phaseChanges, rows.length)}.`);
    say(`Transitions touching the \`unclear\` band (marker cannot fire): ${unclear} = ${pct(unclear, rows.length)}.`);
    say();

    // option collapse uses the shipped legal-count convention
    const legalCount = (fen: string): number => {
      const pos = position(fen);
      let count = 0;
      for (const [from, dests] of pos.allDests()) for (const to of dests) {
        if (pos.isLegal({ from, to })) count += pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? 4 : 1;
      }
      return count;
    };
    let collapseCandidates = 0;
    const legalCounts = allFens.map((fen) => legalCount(fen));
    const lq = quantiles(legalCounts);
    for (const c of legalCounts) if (c <= 3) collapseCandidates += 1;
    say(`### option_collapse (pivotal.ts:60)`);
    say(`Legal-move count over corpus positions: min ${lq.min} / median ${lq.p50} / p95 ${lq.p95} / max ${lq.max}.`);
    say(`Positions at or below the collapse floor (<=3): ${collapseCandidates}/${allFens.length} = ${pct(collapseCandidates, allFens.length)}.`);
    say();

    // ------------------------------------------------------------ 4. endgame reading reach
    let endgameHits = 0;
    const endgameLabels = new Map<string, number>();
    for (const fen of allFens) {
      const reading = endgameReading(fen);
      if (reading === null) continue;
      endgameHits += 1;
      const label = reading.type?.label ?? "(untyped)";
      endgameLabels.set(label, (endgameLabels.get(label) ?? 0) + 1);
    }
    let techniqueHits = 0;
    for (const fen of allFens) if ((endgameReading(fen)?.techniques.length ?? 0) > 0) techniqueHits += 1;
    say(`## 4. Endgame reading (the named-technique surface, 05 §5b)`);
    say(`Positions with a non-null endgame reading: ${endgameHits}/${allFens.length} = ${pct(endgameHits, allFens.length)}.`);
    for (const [k, v] of [...endgameLabels].sort((a, b) => b[1] - a[1])) say(`- ${k}: ${v}`);
    say(`Positions where >=1 named technique is emitted: ${techniqueHits} = ${pct(techniqueHits, allFens.length)}.`);
    for (const fen of [allFens.find((f) => endgameReading(f)?.type === null), allFens.find((f) => (endgameReading(f)?.techniques.length ?? 0) > 0)]) {
      if (fen === undefined) continue;
      say(`Sample rendering (${fen}):`);
      for (const sentence of renderEndgameReading(endgameReading(fen)!)) say(`  > ${sentence}`);
    }
    say();

    // ------------------------------------------- 5. sibling-branch discrimination (compare)
    // CompareView.svelte:119 prints each branch leaf's whole structural reading side by side.
    // At an authored branch point, how much of the two readings is shared?
    const parents = new Map<string, string[]>();
    for (const row of rows) {
      const list = parents.get(row.parentFen) ?? [];
      list.push(row.fen);
      parents.set(row.parentFen, list);
    }
    const shares: number[] = [];
    const diffs: number[] = [];
    let forks = 0;
    for (const [, children] of parents) {
      const distinct = [...new Set(children)];
      if (distinct.length < 2) continue;
      for (let i = 0; i < distinct.length; i += 1) for (let j = i + 1; j < distinct.length; j += 1) {
        const a = readingKeys(distinct[i]!).keys;
        const b = readingKeys(distinct[j]!).keys;
        let shared = 0;
        for (const key of a) if (b.has(key)) shared += 1;
        const union = a.size + b.size - shared;
        shares.push(shared / union);
        diffs.push(union - shared);
        forks += 1;
      }
    }
    const sq = quantiles(shares);
    const dq = quantiles(diffs);
    say(`## 5. Sibling-branch discrimination in the compare reading`);
    say(`Authored fork pairs (same parent, two different children): ${forks}.`);
    say(`Jaccard overlap of the two full structural readings: median ${(100 * sq.p50).toFixed(1)}%, mean ${(100 * sq.mean).toFixed(1)}%, min ${(100 * sq.min).toFixed(1)}%, max ${(100 * sq.max).toFixed(1)}%.`);
    say(`Observations differing between the pair: median ${dq.p50}, mean ${dq.mean.toFixed(1)}, max ${dq.max}.`);
    say();

    writeFileSync(OUT, `${lines.join("\n")}\n`, "utf8");
    expect(rows.length).toBeGreaterThan(500);
  });
});
