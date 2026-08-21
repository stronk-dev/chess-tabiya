// DISPOSABLE research probe — CR1 "common is empty" diagnosis for rfc/feedback-delivery.md §4.1.
// Not production code. Prints to stdout only; writes no repository file.
import { readdirSync, readFileSync } from "node:fs";

import {
  branchPath,
  commitMove,
  compareBranches,
  comparisonStrips,
  createRun,
  rewind,
  structuralReading,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { describe, it } from "vitest";

const at = "2026-08-17T12:00:00.000Z";
const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;

function key(value: unknown): string { return JSON.stringify(value); }
function obsKeys(fen: string): readonly string[] { return structuralReading(fen).features.map(key); }

interface SpineNode { readonly id: string; readonly moveUci: string; readonly children: readonly SpineNode[] }

function deepest(node: SpineNode): readonly string[] {
  if (node.children.length === 0) return [node.moveUci];
  let best: readonly string[] = [];
  for (const child of node.children) { const line = deepest(child); if (line.length > best.length) best = line; }
  return [node.moveUci, ...best];
}

function newRun(startFen: string, id: string): DrillRun {
  return createRun({
    id, startFen, packId: "cr1-probe", packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 5, createdAt: at,
  });
}

interface Measured {
  readonly n: number;
  readonly pliesPastFork: readonly number[];
  readonly pathObsSizes: readonly number[];
  readonly commonSize: number;
  readonly candidates: number;
  readonly admitted: number;
  readonly filtered: number;
  readonly shippedAdmitted: number;
}

/** Builds a run whose columns are `lines`, all branching from the position after `prefix`. */
function buildRun(startFen: string, prefix: readonly string[], lines: readonly (readonly string[])[], id: string): { run: DrillRun; forkNodeId: string; branchIds: readonly string[] } {
  let run = newRun(startFen, id);
  for (const move of prefix) run = commitMove(run, move, { at }).run;
  const forkNodeId = run.activeCursor.nodeId;
  const branchIds: string[] = [];
  for (const [index, line] of lines.entries()) {
    if (index > 0) run = rewind(run, forkNodeId, at).run;
    for (const move of line) run = commitMove(run, move, { at }).run;
    branchIds.push(run.activeCursor.branchId);
  }
  return { run, forkNodeId, branchIds };
}

function measure(run: DrillRun, branchIds: readonly string[]): Measured {
  const comparison = compareBranches(run, branchIds);
  const fork = run.nodes.find((node) => node.id === comparison.forkNodeId)!;
  const paths = comparison.columns.map((column) => branchPath(run, column.branchId).filter((node) => node.ply > fork.ply));
  const pathSets = paths.map((path) => new Set(path.flatMap((node) => obsKeys(node.fen))));
  const common = new Set([...(pathSets[0] ?? [])].filter((k) => pathSets.slice(1).every((set) => set.has(k))));
  let candidates = 0, filtered = 0;
  const forkKeys = new Set(obsKeys(fork.fen));
  for (const path of paths) {
    let previous = forkKeys;
    for (const node of path) {
      const current = obsKeys(node.fen);
      for (const k of current) if (!previous.has(k)) { candidates += 1; if (common.has(k)) filtered += 1; }
      previous = new Set(current);
    }
  }
  const strips = comparisonStrips(run, comparison);
  const shippedAdmitted = Object.values(strips).reduce((sum, strip) => sum + strip.structure.length, 0);
  return {
    n: comparison.columns.length,
    pliesPastFork: paths.map((path) => path.length),
    pathObsSizes: pathSets.map((set) => set.size),
    commonSize: common.size,
    candidates, admitted: candidates - filtered, filtered, shippedAdmitted,
  };
}

function quantiles(values: readonly number[]): string {
  if (values.length === 0) return "n=0";
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number): number => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!;
  return `n=${sorted.length} min=${sorted[0]} p25=${q(0.25)} median=${q(0.5)} p75=${q(0.75)} max=${sorted.at(-1)}`;
}

describe("CR1 diagnosis", () => {
  it("measures where common comes from and whether it can ever intersect the strip", async () => {
    const say = (line = ""): void => { console.log(line); };

    // --------------------------------------------------- 1. what an observation identity contains
    const sample = structuralReading("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    say("## 1. Observation identity content");
    say(`Features at the start position: ${sample.features.length}. Distinct JSON keys: ${new Set(sample.features.map(key)).size}.`);
    const fields = new Set(sample.features.flatMap((f) => Object.keys(f)));
    say(`Union of identity fields over that reading: ${[...fields].sort().join(", ")}`);
    const allFields = new Set<string>();
    for (const fen of ["r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "8/8/4k3/8/8/4K3/4P3/8 w - - 0 1"]) {
      for (const f of structuralReading(fen).features) for (const k of Object.keys(f)) allFields.add(k);
    }
    say(`Union of identity fields over two further positions: ${[...allFields].sort().join(", ")}`);
    say(`Sample keys: ${sample.features.slice(0, 3).map(key).join(" | ")}`);
    say();

    // ------------------------------------------------------- 2. cross-position identity reuse
    // Are identities comparable across positions at all? Compare two unrelated positions.
    const a = new Set(obsKeys("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"));
    const b = new Set(obsKeys("rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1"));
    const shared = [...a].filter((k) => b.has(k));
    say("## 2. Cross-position identity reuse (1.e4 vs 1.d4 from the start)");
    say(`|A|=${a.size} |B|=${b.size} shared=${shared.length}`);
    say(`Shared kinds: ${key([...new Set(shared.map((k) => (JSON.parse(k) as { kind: string }).kind))].sort())}`);
    say();

    // ------------------------------------------------- 3. the shipped instrument, decomposed
    say("## 3. The Stage-1 instrument (one ply per column from the start position), decomposed");
    const openers = ["e2e4", "d2d4", "g1f3", "c2c4", "b2b3", "g2g3", "f2f4", "b1c3"];
    for (const n of [2, 4, 8] as const) {
      const built = buildRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [], openers.slice(0, n).map((m) => [m]), `instrument-${n}`);
      const m = measure(built.run, built.branchIds);
      say(`N=${n}: plies past fork per column ${key(m.pliesPastFork)}; |pathObservations| ${key(m.pathObsSizes)}; |common|=${m.commonSize}; candidates=${m.candidates}; filtered=${m.filtered}; admitted=${m.admitted}; shipped strip total=${m.shippedAdmitted}`);
    }
    say();

    // ------------------------------------------- 4. positive control: can CR1 fire at all?
    say("## 4. Positive control — two columns that reach the same structure by different orders");
    // Column A: 1.Nf3 d5 2.d4 ; Column B: 1.d4 d5 2.Nf3 — a transposition. Same final position.
    const control = buildRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [],
      [["g1f3", "d7d5", "d2d4"], ["d2d4", "d7d5", "g1f3"]], "control-transposition");
    const cm = measure(control.run, control.branchIds);
    say(`transposition N=2: |common|=${cm.commonSize}; candidates=${cm.candidates}; filtered=${cm.filtered}; admitted=${cm.admitted}; shipped=${cm.shippedAdmitted}`);
    // A weaker control: both columns eventually play the same first move set but in different order, 4 plies.
    const control2 = buildRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [],
      [["e2e4", "e7e5", "g1f3", "b8c6"], ["g1f3", "b8c6", "e2e4", "e7e5"]], "control-transposition-4");
    const cm2 = measure(control2.run, control2.branchIds);
    say(`transposition-4 N=2: |common|=${cm2.commonSize}; candidates=${cm2.candidates}; filtered=${cm2.filtered}; admitted=${cm2.admitted}; shipped=${cm2.shippedAdmitted}`);
    // Degenerate control: identical branches (CR3's named case).
    const control3 = buildRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [],
      [["e2e4", "e7e5"], ["e2e4", "e7e5"]], "control-identical");
    const cm3 = measure(control3.run, control3.branchIds);
    say(`identical N=2: |common|=${cm3.commonSize}; candidates=${cm3.candidates}; filtered=${cm3.filtered}; admitted=${cm3.admitted}; shipped=${cm3.shippedAdmitted}`);
    // Degenerate case not named by CR3: one column sits at the fork with no recorded move past it.
    try {
      let run = newRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "control-empty-column");
      const forkNodeId = run.activeCursor.nodeId;
      run = commitMove(run, "e2e4", { at }).run;
      const first = run.activeCursor.branchId;
      run = rewind(run, forkNodeId, at).run;
      run = commitMove(run, "d2d4", { at }).run;
      const second = run.activeCursor.branchId;
      run = rewind(run, forkNodeId, at).run;
      const forked = (await import("@chess-tabiya/runtime")).fork(run, forkNodeId, { at });
      run = forked.run;
      const empty = run.branches.at(-1)!.id;
      const cm4 = measure(run, [first, second, empty]);
      say(`empty-column N=3: plies ${key(cm4.pliesPastFork)} |common|=${cm4.commonSize} candidates=${cm4.candidates} filtered=${cm4.filtered} shipped=${cm4.shippedAdmitted}`);
    } catch (error) { say(`empty-column N=3: not constructible — ${(error as Error).message}`); }
    say();

    // ---------------------------------------------- 5. real authored fork sets from the corpus
    say("## 5. Real authored fork sets (content/drafts spine forks, deepest continuation per child)");
    const files = readdirSync(DRAFTS).filter((f) => f.endsWith(".json") && !/\.(evidence|job|sources|ledger|manifest)\.json$/.test(f));
    const rows: { pack: string; forkId: string; m: Measured }[] = [];
    let skipped = 0;
    for (const file of files) {
      const doc = JSON.parse(readFileSync(`${DRAFTS}${file}`, "utf8")) as { id: string; start: { fen: string }; spine?: readonly SpineNode[] };
      const visit = (nodes: readonly SpineNode[], prefix: readonly string[]): void => {
        if (nodes.length >= 2) {
          const lines = nodes.slice(0, 8).map(deepest);
          try {
            const built = buildRun(doc.start.fen, prefix, lines, `${doc.id}-${prefix.length}`);
            rows.push({ pack: doc.id, forkId: `${doc.id}@ply${prefix.length}`, m: measure(built.run, built.branchIds) });
          } catch { skipped += 1; }
        }
        for (const node of nodes) visit(node.children, [...prefix, node.moveUci]);
      };
      visit(doc.spine ?? [], []);
    }
    say(`Packs scanned: ${files.length}. Fork sets measured: ${rows.length} (skipped ${skipped}).`);
    say(`Column count N: ${key(Object.fromEntries([...new Set(rows.map((r) => r.m.n))].sort().map((n) => [n, rows.filter((r) => r.m.n === n).length])))}`);
    say(`Shortest column plies past fork: ${quantiles(rows.map((r) => Math.min(...r.m.pliesPastFork)))}`);
    say(`Longest column plies past fork: ${quantiles(rows.map((r) => Math.max(...r.m.pliesPastFork)))}`);
    say(`|common| per fork set: ${quantiles(rows.map((r) => r.m.commonSize))}`);
    say(`Fork sets with |common| = 0: ${rows.filter((r) => r.m.commonSize === 0).length}/${rows.length}`);
    say(`Candidate strip entries per fork set: ${quantiles(rows.map((r) => r.m.candidates))}`);
    say(`Filtered (in common) per fork set: ${quantiles(rows.map((r) => r.m.filtered))}`);
    const totalCandidates = rows.reduce((s, r) => s + r.m.candidates, 0);
    const totalFiltered = rows.reduce((s, r) => s + r.m.filtered, 0);
    const totalShipped = rows.reduce((s, r) => s + r.m.shippedAdmitted, 0);
    say(`Corpus totals: candidates=${totalCandidates} filtered=${totalFiltered} admitted=${totalCandidates - totalFiltered} shipped-strip=${totalShipped} admission=${(100 * (totalCandidates - totalFiltered) / totalCandidates).toFixed(1)}%`);
    say(`Fork sets where CR1 removed at least one entry: ${rows.filter((r) => r.m.filtered > 0).length}/${rows.length}`);
    for (const row of rows.filter((r) => r.m.filtered > 0)) {
      say(`  fires: ${row.forkId} N=${row.m.n} plies=${key(row.m.pliesPastFork)} |common|=${row.m.commonSize} candidates=${row.m.candidates} filtered=${row.m.filtered}`);
    }
    for (const row of rows.filter((r) => r.m.filtered === 0)) {
      say(`  silent: ${row.forkId} N=${row.m.n} plies=${key(row.m.pliesPastFork)} |common|=${row.m.commonSize} candidates=${row.m.candidates}`);
    }
    for (const n of [2, 3] as const) {
      const bucket = rows.filter((r) => r.m.n === n);
      const c = bucket.reduce((s, r) => s + r.m.candidates, 0);
      const f = bucket.reduce((s, r) => s + r.m.filtered, 0);
      say(`  corpus N=${n}: forks=${bucket.length} candidates=${c} filtered=${f} admission=${(100 * (c - f) / c).toFixed(1)}%`);
    }
    // 5b. Fork exclusion: does the choice §4.1 settles actually change the answer on this corpus?
    let inclusiveFiltered = 0, exclusiveFiltered = 0, differing = 0;
    for (const file of files) {
      const doc = JSON.parse(readFileSync(`${DRAFTS}${file}`, "utf8")) as { id: string; start: { fen: string }; spine?: readonly SpineNode[] };
      const visit = (nodes: readonly SpineNode[], prefix: readonly string[]): void => {
        if (nodes.length >= 2) {
          try {
            const built = buildRun(doc.start.fen, prefix, nodes.slice(0, 8).map(deepest), `${doc.id}-fx-${prefix.length}`);
            const comparison = compareBranches(built.run, built.branchIds);
            const fork = built.run.nodes.find((n) => n.id === comparison.forkNodeId)!;
            const forkKeys = obsKeys(fork.fen);
            const paths = comparison.columns.map((c) => branchPath(built.run, c.branchId).filter((n) => n.ply > fork.ply));
            const strict = paths.map((p) => new Set(p.flatMap((n) => obsKeys(n.fen))));
            const loose = paths.map((p) => new Set([...forkKeys, ...p.flatMap((n) => obsKeys(n.fen))]));
            const commonOf = (sets: readonly Set<string>[]): Set<string> => new Set([...(sets[0] ?? [])].filter((k) => sets.slice(1).every((s) => s.has(k))));
            const cStrict = commonOf(strict), cLoose = commonOf(loose);
            const forkSet = new Set(forkKeys);
            let fs = 0, fl = 0;
            for (const path of paths) {
              let previous = forkSet;
              for (const node of path) {
                const current = obsKeys(node.fen);
                for (const k of current) if (!previous.has(k)) { if (cStrict.has(k)) fs += 1; if (cLoose.has(k)) fl += 1; }
                previous = new Set(current);
              }
            }
            exclusiveFiltered += fs; inclusiveFiltered += fl; if (fs !== fl) differing += 1;
          } catch { /* skipped above */ }
        }
        for (const node of nodes) visit(node.children, [...prefix, node.moveUci]);
      };
      visit(doc.spine ?? [], []);
    }
    say(`Fork exclusion, corpus: entries filtered under the SHIPPED strict reading = ${exclusiveFiltered}; under a fork-inclusive reading = ${inclusiveFiltered}; fork sets where the two disagree = ${differing}/${rows.length}`);
    const deep = rows.filter((r) => Math.min(...r.m.pliesPastFork) >= 4);
    say(`Fork sets whose *shortest* column is >= 4 plies past the fork: ${deep.length}`);
    for (const row of deep) say(`  deep: ${row.forkId} N=${row.m.n} plies=${key(row.m.pliesPastFork)} |common|=${row.m.commonSize} candidates=${row.m.candidates} filtered=${row.m.filtered}`);
    say();

    // -------------------------------- 6. where common lives: kinds, and overlap with candidates
    say("## 6. What is in common, and what is in the candidate set (corpus, by kind)");
    const kindsCommon = new Map<string, number>();
    const kindsCandidate = new Map<string, number>();
    for (const file of files) {
      const doc = JSON.parse(readFileSync(`${DRAFTS}${file}`, "utf8")) as { id: string; start: { fen: string }; spine?: readonly SpineNode[] };
      const visit = (nodes: readonly SpineNode[], prefix: readonly string[]): void => {
        if (nodes.length >= 2) {
          try {
            const built = buildRun(doc.start.fen, prefix, nodes.slice(0, 8).map(deepest), `${doc.id}-k-${prefix.length}`);
            const comparison = compareBranches(built.run, built.branchIds);
            const fork = built.run.nodes.find((n) => n.id === comparison.forkNodeId)!;
            const paths = comparison.columns.map((c) => branchPath(built.run, c.branchId).filter((n) => n.ply > fork.ply));
            const sets = paths.map((p) => new Set(p.flatMap((n) => obsKeys(n.fen))));
            const common = [...(sets[0] ?? [])].filter((k) => sets.slice(1).every((s) => s.has(k)));
            for (const k of common) { const kind = (JSON.parse(k) as { kind: string }).kind; kindsCommon.set(kind, (kindsCommon.get(kind) ?? 0) + 1); }
            const forkKeys = new Set(obsKeys(fork.fen));
            for (const path of paths) {
              let previous = forkKeys;
              for (const node of path) {
                const current = obsKeys(node.fen);
                for (const k of current) if (!previous.has(k)) { const kind = (JSON.parse(k) as { kind: string }).kind; kindsCandidate.set(kind, (kindsCandidate.get(kind) ?? 0) + 1); }
                previous = new Set(current);
              }
            }
          } catch { /* skipped above */ }
        }
        for (const node of nodes) visit(node.children, [...prefix, node.moveUci]);
      };
      visit(doc.spine ?? [], []);
    }
    say(`common by kind: ${key(Object.fromEntries([...kindsCommon].sort((x, y) => y[1] - x[1])))}`);
    say(`candidates by kind: ${key(Object.fromEntries([...kindsCandidate].sort((x, y) => y[1] - x[1])))}`);
    say();

    // -------- 6b. what if compare-strips reused structure.ts's own `observationIdentity` key?
    // structure.ts:447 strips `detail` for pawn_safe_square; compare-strips.ts:19 does not.
    say("## 6b. Corpus re-measured under structure.ts's `observationIdentity` (detail stripped for pawn_safe_square)");
    const identity = (fen: string): readonly string[] => structuralReading(fen).features.map((f) =>
      f.kind === "pawn_safe_square" ? key({ kind: f.kind, color: f.color, squares: f.squares }) : key(f));
    let idCandidates = 0, idFiltered = 0;
    for (const file of files) {
      const doc = JSON.parse(readFileSync(`${DRAFTS}${file}`, "utf8")) as { id: string; start: { fen: string }; spine?: readonly SpineNode[] };
      const visit = (nodes: readonly SpineNode[], prefix: readonly string[]): void => {
        if (nodes.length >= 2) {
          try {
            const built = buildRun(doc.start.fen, prefix, nodes.slice(0, 8).map(deepest), `${doc.id}-id-${prefix.length}`);
            const comparison = compareBranches(built.run, built.branchIds);
            const fork = built.run.nodes.find((n) => n.id === comparison.forkNodeId)!;
            const paths = comparison.columns.map((c) => branchPath(built.run, c.branchId).filter((n) => n.ply > fork.ply));
            const sets = paths.map((p) => new Set(p.flatMap((n) => identity(n.fen))));
            const common = new Set([...(sets[0] ?? [])].filter((k) => sets.slice(1).every((s) => s.has(k))));
            const forkSet = new Set(identity(fork.fen));
            for (const path of paths) {
              let previous = forkSet;
              for (const node of path) {
                const current = identity(node.fen);
                for (const k of current) if (!previous.has(k)) { idCandidates += 1; if (common.has(k)) idFiltered += 1; }
                previous = new Set(current);
              }
            }
          } catch { /* skipped above */ }
        }
        for (const node of nodes) visit(node.children, [...prefix, node.moveUci]);
      };
      visit(doc.spine ?? [], []);
    }
    say(`  candidates=${idCandidates} (shipped key: ${totalCandidates}) filtered=${idFiltered} admitted=${idCandidates - idFiltered} admission=${(100 * (idCandidates - idFiltered) / idCandidates).toFixed(1)}% (shipped key: ${(100 * (totalCandidates - totalFiltered) / totalCandidates).toFixed(1)}%)`);
    say();

    // ------------------------------- 7. admission versus depth past the fork, on the same corpus
    say("## 7. Corpus admission share bucketed by the SHORTEST column's plies past the fork");
    for (const [lo, hi] of [[1, 1], [2, 2], [3, 3], [4, 99]] as const) {
      const bucket = rows.filter((r) => { const d = Math.min(...r.m.pliesPastFork); return d >= lo && d <= hi; });
      const c = bucket.reduce((s, r) => s + r.m.candidates, 0);
      const f = bucket.reduce((s, r) => s + r.m.filtered, 0);
      say(`  shortest column ${lo}${hi === 99 ? "+" : hi === lo ? "" : `-${hi}`} ply: forks=${bucket.length} candidates=${c} filtered=${f} admission=${c === 0 ? "n/a" : `${(100 * (c - f) / c).toFixed(1)}%`}`);
    }
    say();

    // ------------------------------- 8. a re-shaped constructed instrument with multi-ply columns
    say("## 8. Constructed N=2/4/8 instrument with columns that continue past the fork");
    say("Construction: eight distinct first moves from the start position, then each column is");
    say("extended deterministically by the first legal move from a fixed preference list.");
    const PREFERENCE = ["g8f6", "b8c6", "d7d5", "e7e6", "f8e7", "e8g8", "c8f5", "d8e7",
      "g1f3", "b1c3", "d2d4", "e2e4", "f1e2", "e1g1", "c1f4", "d1e2"];
    const extend = (run: DrillRun, plies: number): DrillRun => {
      let current = run;
      for (let i = 0; i < plies; i += 1) {
        let played = false;
        for (const move of PREFERENCE) {
          try { current = commitMove(current, move, { at }).run; played = true; break; } catch { /* illegal here */ }
        }
        if (!played) break;
      }
      return current;
    };
    for (const depth of [4, 8, 12] as const) {
      for (const n of [2, 4, 8] as const) {
        let run = newRun("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", `deep-${depth}-${n}`);
        const forkNodeId = run.activeCursor.nodeId;
        const branchIds: string[] = [];
        for (const [index, opener] of openers.slice(0, n).entries()) {
          if (index > 0) run = rewind(run, forkNodeId, at).run;
          run = commitMove(run, opener, { at }).run;
          run = extend(run, depth - 1);
          branchIds.push(run.activeCursor.branchId);
        }
        const m = measure(run, branchIds);
        say(`  depth=${depth} N=${n}: plies ${key(m.pliesPastFork)} |common|=${m.commonSize} candidates=${m.candidates} filtered=${m.filtered} admitted=${m.admitted} shipped=${m.shippedAdmitted} admission=${(100 * m.admitted / m.candidates).toFixed(1)}%`);
      }
    }
    say();
  });
});
