// DISPOSABLE research harness — feedback-delivery RFC criteria 2, 5, 6, 16.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import {
  appendOpponentPly,
  branchPath,
  commitMove,
  compareBranches,
  comparisonStrips,
  createRun,
  observationIdentity,
  rewind,
  structuralReading,
  type DrillRun,
  type MutationResult,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition, SpineNode } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { admittedFeedbackClaimIds, projectAuthoredFeedback } from "../../apps/server/src/authored-feedback.js";
import { orchestratePackMove, orchestratePackStart, planSignatureResolver, type PlanSignatureResolver } from "../../apps/server/src/pack-orchestrator.js";
import { PackRegistry, type PackRecord } from "../../apps/server/src/pack-registry.js";
import { PrincipleRegistry } from "../../apps/server/src/principle-registry.js";
import { ShapeRegistry } from "../../apps/server/src/shape-registry.js";

const OUT = new URL("../../planning/feedback-delivery/stage-1-measurement.md", import.meta.url).pathname;
const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;
const at = "2026-08-17T12:00:00.000Z";

function leafPaths(nodes: readonly SpineNode[], prefix: readonly SpineNode[] = []): readonly (readonly SpineNode[])[] {
  return nodes.flatMap((node) => node.children.length === 0
    ? [[...prefix, node]]
    : leafPaths(node.children, [...prefix, node]));
}

function learnerToMove(fen: string, learner: "white" | "black"): boolean {
  return (fen.split(" ")[1] === "w" ? "white" : "black") === learner;
}

function opponentSelection(moveUci: string, mode: PackRecord["document"]["opponentPolicy"]["mode"]): OpponentSelection {
  return {
    moveUci,
    policyModeApplied: mode,
    engine: { id: "feedback-delivery-harness", name: "Authored opponent reply driver", version: "1", seedHonored: true },
  };
}

function committed(pack: PackRecord, run: DrillRun, moveUci: string, resolvePlanSignature: PlanSignatureResolver): MutationResult {
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
  const mutation = learnerToMove(node.fen, pack.document.start.side)
    ? commitMove(run, moveUci, { at })
    : appendOpponentPly(run, opponentSelection(moveUci, pack.document.opponentPolicy.mode), { at });
  return orchestratePackMove(pack.document, run, mutation, resolvePlanSignature);
}

function hasOpponentChoice(pack: PackRecord): boolean {
  const root = Chess.fromSetup(parseFen(pack.document.start.fen).unwrap()).unwrap();
  const walk = (nodes: readonly SpineNode[], board: Chess): boolean => {
    const side = board.turn === "white" ? "white" : "black";
    if (side !== pack.document.start.side && nodes.length > 1) return true;
    for (const node of nodes) {
      const next = board.clone(); const move = parseUci(node.moveUci);
      if (move !== undefined && next.isLegal(move)) { next.play(move); if (walk(node.children, next)) return true; }
    }
    return false;
  };
  return walk(pack.document.spine ?? [], root);
}

function walkthrough(pack: PackRecord, paths: readonly (readonly SpineNode[])[], resolvePlanSignature: PlanSignatureResolver): { readonly run?: DrillRun; readonly errors: readonly string[] } {
  const errors: string[] = [];
  const attempt = (ordered: readonly (readonly SpineNode[])[]): DrillRun | undefined => {
    let run = createRun({
      id: `feedback-${pack.document.id}`,
      session: { kind: "pack", packId: pack.document.id, packDigest: pack.digest, start: pack.document.start, feedbackPolicy: pack.feedbackPolicy, opponentPolicy: pack.document.opponentPolicy },
      sessionDigest: pack.digest,
      policyConfig: { seedMode: pack.document.opponentPolicy.seedMode ?? "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 23,
      createdAt: at,
    });
    run = orchestratePackStart(pack.document, run).run;
    const rootId = run.activeCursor.nodeId;
    try {
      for (const [index, path] of ordered.entries()) {
        if (index > 0) run = rewind(run, rootId, at).run;
        for (const node of path) run = committed(pack, run, node.moveUci, resolvePlanSignature).run;
      }
      return run;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return undefined;
    }
  };
  for (const last of paths) {
    const run = attempt([...paths.filter((candidate) => candidate !== last), last]);
    if (run !== undefined && projectAuthoredFeedback(pack, run).items.some((item) => item.kind === "claim")) return { run, errors };
  }
  const run = attempt(paths);
  return { ...(run === undefined ? {} : { run }), errors };
}

function comparisonMeasurement(count: 2 | 4 | 8): { readonly before: number; readonly after: number; readonly share: number } {
  let run = createRun({ id: `compare-${count}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", packId: "instrument", packDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 5, createdAt: at });
  const rootId = run.activeCursor.nodeId;
  const moves = ["e2e4", "d2d4", "g1f3", "c2c4", "b2b3", "g2g3", "f2f4", "b1c3"].slice(0, count);
  const preference = ["g8f6", "b8c6", "d7d5", "e7e6", "f8e7", "e8g8", "c8f5", "d8e7", "g1f3", "b1c3", "d2d4", "e2e4", "f1e2", "e1g1", "c1f4", "d1e2"];
  for (const [index, move] of moves.entries()) {
    if (index > 0) run = rewind(run, rootId, at).run;
    run = commitMove(run, move!, { at }).run;
    for (let ply = 1; ply < 8; ply += 1) {
      let next: DrillRun | undefined;
      for (const candidate of preference) {
        try { next = commitMove(run, candidate, { at }).run; break; } catch { /* try the next deterministic candidate */ }
      }
      if (next === undefined) break;
      run = next;
    }
  }
  const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
  const strips = comparisonStrips(run, comparison);
  const fork = run.nodes.find((node) => node.id === comparison.forkNodeId)!;
  let before = 0;
  for (const column of comparison.columns) {
    let previous = new Set(structuralReading(fork.fen).features.map(observationIdentity));
    for (const node of branchPath(run, column.branchId).filter((candidate) => candidate.ply > fork.ply)) {
      const current = structuralReading(node.fen).features;
      before += current.filter((item) => !previous.has(observationIdentity(item))).length;
      previous = new Set(current.map(observationIdentity));
    }
  }
  const after = Object.values(strips).reduce((sum, strip) => sum + strip.structure.length, 0);
  return { before, after, share: before === 0 ? 0 : after / before };
}

function deepest(node: SpineNode): readonly string[] {
  if (node.children.length === 0) return [node.moveUci];
  let best: readonly string[] = [];
  for (const child of node.children) {
    const line = deepest(child);
    if (line.length > best.length) best = line;
  }
  return [node.moveUci, ...best];
}

function quantiles(values: readonly number[]): { readonly median: number; readonly mean: number; readonly max: number } {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    median: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length / 2))] ?? 0,
    mean: values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length,
    max: sorted.at(-1) ?? 0,
  };
}

function quietAlternatives(fen: string, playedUci: string): readonly string[] {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const result: string[] = [];
  for (const [from, destinations] of board.allDests()) for (const to of destinations) {
    const promotions = board.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? (["queen"] as const) : ([undefined] as const);
    for (const promotion of promotions) {
      const move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (!board.isLegal(move)) continue;
      const uci = makeUci(move);
      if (uci === playedUci) continue;
      const capture = board.board.occupied.has(to) || (board.board.getRole(from) === "pawn" && board.epSquare === to);
      const next = board.clone(); next.play(move);
      if (!capture && !next.isCheck()) result.push(makeFen(next.toSetup()));
    }
  }
  return result;
}

function authoredForkMeasurement(): {
  readonly attempted: number; readonly forks: number; readonly skipped: number;
  readonly plies: number; readonly before: number; readonly after: number;
  readonly firedPlies: number; readonly perFork: ReturnType<typeof quantiles>; readonly lift: number;
  readonly quietMean: number;
} {
  const perFork: number[] = [];
  let attempted = 0, forks = 0, skipped = 0, plies = 0, before = 0, after = 0, firedPlies = 0;
  let quietShareSum = 0, quietParents = 0;
  const files = readdirSync(DRAFTS).filter((name) => name.endsWith(".json") && !name.endsWith(".browser.json") && !/\.(?:evidence|job|sources)\.json$/u.test(name));
  for (const file of files) {
    const document = JSON.parse(readFileSync(`${DRAFTS}${file}`, "utf8")) as DrillPackDefinition;
    const visit = (nodes: readonly SpineNode[], prefix: readonly string[]): void => {
      if (nodes.length >= 2) {
        attempted += 1;
        let run = createRun({ id: `fork-${document.id}-${prefix.length}`, startFen: document.start.fen, packId: document.id, packDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 31, createdAt: at });
        try {
          for (const move of prefix) run = commitMove(run, move, { at }).run;
          const forkNodeId = run.activeCursor.nodeId;
          const branchIds: string[] = [];
          for (const [index, line] of nodes.slice(0, 8).map(deepest).entries()) {
            if (index > 0) run = rewind(run, forkNodeId, at).run;
            for (const move of line) run = commitMove(run, move, { at }).run;
            branchIds.push(run.activeCursor.branchId);
          }
          const comparison = compareBranches(run, branchIds);
          const fork = run.nodes.find((node) => node.id === comparison.forkNodeId)!;
          const paths = comparison.columns.map((column) => branchPath(run, column.branchId).filter((node) => node.ply > fork.ply));
          const pathSets = paths.map((path) => new Set(path.flatMap((node) => structuralReading(node.fen).features.map(observationIdentity))));
          const common = new Set([...(pathSets[0] ?? [])].filter((key) => pathSets.slice(1).every((set) => set.has(key))));
          let admittedAtFork = 0;
          for (const path of paths) {
            let previousFen = fork.fen;
            let previous = new Set(structuralReading(previousFen).features.map(observationIdentity));
            for (const node of path) {
              plies += 1;
              const current = structuralReading(node.fen).features;
              const gained = current.filter((item) => !previous.has(observationIdentity(item)));
              const admitted = gained.filter((item) => !common.has(observationIdentity(item)));
              before += gained.length;
              after += admitted.length;
              admittedAtFork += admitted.length;
              if (admitted.length > 0) {
                firedPlies += 1;
                const alternatives = quietAlternatives(previousFen, node.moveUci!);
                if (alternatives.length > 0) {
                  quietParents += 1;
                  quietShareSum += alternatives.filter((fen) => structuralReading(fen).features.some((item) => !previous.has(observationIdentity(item)) && !common.has(observationIdentity(item)))).length / alternatives.length;
                }
              }
              previousFen = node.fen;
              previous = new Set(current.map(observationIdentity));
            }
          }
          expect(Object.values(comparisonStrips(run, comparison)).reduce((sum, strip) => sum + strip.structure.length, 0)).toBe(admittedAtFork);
          perFork.push(admittedAtFork);
          forks += 1;
        } catch { skipped += 1; }
      }
      for (const node of nodes) visit(node.children, [...prefix, node.moveUci]);
    };
    visit(document.spine ?? [], []);
  }
  const playedRate = plies === 0 ? 0 : firedPlies / plies;
  const quietMean = quietParents === 0 ? 0 : quietShareSum / quietParents;
  return { attempted, forks, skipped, plies, before, after, firedPlies, perFork: quantiles(perFork), lift: quietMean === 0 ? Number.NaN : playedRate / quietMean, quietMean };
}

describe("feedback delivery Stage 1", () => {
  it("records the starting delivery and comparison measurements", async () => {
    const shapes = await ShapeRegistry.loadDefault();
    const principles = await PrincipleRegistry.loadDefault();
    const registry = await PackRegistry.loadDefault({ development: true, shapes, principles });
    const packs = registry.list().map((summary) => registry.required(summary.id)).filter((pack) => (pack.document.feedbackClaims?.length ?? 0) > 0);
    let claims = 0, admitted = 0, characters = 0, admittedCharacters = 0;
    let derivedOnly = 0, derivedOnlyCharacters = 0;
    let outcome = 0, exhausted = 0, delivered = 0;
    let deliveredClaims = 0, deliveredClaimCharacters = 0, timingWithheldClaims = 0;
    let single = 0, learnerBranch = 0, opponentBranch = 0;
    let singleExhausted = 0, learnerExhausted = 0, opponentExhausted = 0;
    let withheldBefore = 0, withheldAfter = 0, measuredRuns = 0;
    let terminalBlockedClaims = 0, terminalBlockedAdmittedClaims = 0;
    const terminalBlockedPacks: string[] = [];
    const terminalBlockedReasons: string[] = [];
    for (const pack of packs) {
      const admittedIds = admittedFeedbackClaimIds(pack);
      for (const claim of pack.document.feedbackClaims ?? []) {
        claims += 1; characters += claim.text.length;
        if (claim.evidenceTypes.length === 1 && claim.evidenceTypes[0] === "derived_feature") {
          derivedOnly += 1; derivedOnlyCharacters += claim.text.length;
        }
        if (admittedIds.has(claim.id)) { admitted += 1; admittedCharacters += claim.text.length; }
      }
      const paths = leafPaths(pack.document.spine ?? []);
      const policyDependent = hasOpponentChoice(pack);
      const population = paths.length === 1 ? "single" : policyDependent ? "opponent" : "learner";
      if (population === "single") single += 1;
      else if (population === "learner") learnerBranch += 1;
      else opponentBranch += 1;
      const result = walkthrough(pack, paths, planSignatureResolver(pack.document, shapes));
      const run = result.run;
      if (run === undefined) {
        terminalBlockedPacks.push(pack.document.id);
        terminalBlockedClaims += pack.document.feedbackClaims?.length ?? 0;
        terminalBlockedAdmittedClaims += admittedIds.size;
        terminalBlockedReasons.push(`${pack.document.id}: ${[...new Set(result.errors)].join(" | ")}`);
        continue;
      }
      measuredRuns += 1;
      exhausted += 1;
      if (population === "single") singleExhausted += 1;
      else if (population === "learner") learnerExhausted += 1;
      else opponentExhausted += 1;
      if (run.events.some((event) => event.type === "outcome.reached")) outcome += 1;
      const after = projectAuthoredFeedback(pack, run);
      const renderedClaimIds = new Set(after.items.flatMap((item) =>
        item.kind === "claim" ? [item.anchor.claimId] : []));
      if (renderedClaimIds.size > 0) delivered += 1;
      deliveredClaims += renderedClaimIds.size;
      deliveredClaimCharacters += (pack.document.feedbackClaims ?? [])
        .filter((claim) => renderedClaimIds.has(claim.id))
        .reduce((sum, claim) => sum + claim.text.length, 0);
      timingWithheldClaims += [...admittedIds].filter((id) => !renderedClaimIds.has(id)).length;
      if (after.hasWithheldAuthoredContent) withheldAfter += 1;
      const { feedbackClaims: _feedbackClaims, ...baselineDocument } = pack.document;
      const before = projectAuthoredFeedback({
        ...pack,
        document: baselineDocument as DrillPackDefinition,
        boundClaimIds: new Set(),
        claimBackings: new Map(),
      }, run);
      if (before.hasWithheldAuthoredContent) withheldBefore += 1;
    }
    const comparisons = ([2, 4, 8] as const).map((count) => [count, comparisonMeasurement(count)] as const);
    const authoredForks = authoredForkMeasurement();
    const n8Share = comparisons.find(([count]) => count === 8)![1].share;
    const report = `# Feedback delivery — Stage 1 starting measurement\n\n`+
      `Measured: 2026-08-21 recovery run (deterministic event timestamps remain 2026-08-17). Predicate: recovery-worktree \`admittedFeedbackClaimIds\` and \`projectAuthoredFeedback\`; not shipped until the scoped Stage-1 landing.\n\n`+
      `- Claim-bearing packs: ${packs.length}.\n- Claims: ${admitted}/${claims} admitted; ${admittedCharacters}/${characters} characters admitted.\n`+
      `- Admission-withheld by evidence policy: ${claims - admitted}/${claims} claims; ${characters - admittedCharacters}/${characters} characters.\n`+
      `- Derived-feature-only explicit self-declared population: ${derivedOnly} claims / ${derivedOnlyCharacters} characters.\n`+
      `- Walkthrough populations: single-line ${single}; learner-branch ${learnerBranch}; opponent-branch ${opponentBranch}.\n`+
      `- Exhaustion predicate reached: ${exhausted}/${packs.length} packs (${(100 * exhausted / packs.length).toFixed(1)}%): single-line ${singleExhausted}/${single}; learner-branch ${learnerExhausted}/${learnerBranch}; opponent-branch ${opponentExhausted}/${opponentBranch}.\n`+
      `- Structurally unreachable under C1 because the objective terminates before full-spine coverage: ${terminalBlockedPacks.length} packs / ${terminalBlockedClaims} claims (${terminalBlockedAdmittedClaims} otherwise admitted): ${terminalBlockedPacks.length === 0 ? "none" : terminalBlockedPacks.join(", ")}. These are failures of predicate reach, not harness exclusions.\n`+
      `${terminalBlockedReasons.length === 0 ? "" : `- Terminal-reach evidence: ${terminalBlockedReasons.join("; ")}.\n`}`+
      `- Claim delivery observed after exhaustion: ${delivered}/${packs.length} packs; ${deliveredClaims}/${admitted} admitted claims / ${deliveredClaimCharacters}/${admittedCharacters} admitted characters.\n`+
      `- Admitted but timing-withheld after exhaustion because no released reveal occurrence remained: ${timingWithheldClaims}/${admitted} claims.\n`+
      `- Walkthroughs with an authored outcome event: ${outcome}/${packs.length}.\n`+
      `- Last-event \`hasWithheldAuthoredContent\`: before claim delivery ${withheldBefore}/${measuredRuns}; after ${withheldAfter}/${measuredRuns}.\n`+
      `- Opponent-branch method: each authored reply is supplied as the recorded output of the pack's configured opponent policy on a separate rewind attempt; no opponent-dependent pack is silently excluded.\n`+
      `\n## Same-tree authored-fork strip measurement\n\n`+
      `- Fork sets: ${authoredForks.forks}/${authoredForks.attempted} measured (skipped ${authoredForks.skipped}); column plies past forks: ${authoredForks.plies}.\n`+
      `- Unfiltered candidates: ${authoredForks.before}; admitted after CR1: ${authoredForks.after} (${(100 * authoredForks.after / authoredForks.before).toFixed(1)}%); entries per ply: ${(authoredForks.after / authoredForks.plies).toFixed(2)}.\n`+
      `- Plies with at least one admitted entry: ${authoredForks.firedPlies}/${authoredForks.plies} (${(100 * authoredForks.firedPlies / authoredForks.plies).toFixed(1)}%).\n`+
      `- Admitted entries per fork set: median ${authoredForks.perFork.median}; mean ${authoredForks.perFork.mean.toFixed(1)}; max ${authoredForks.perFork.max}.\n`+
      `- Lift = (played-move firing rate) / (within-position mean share of quiet alternatives that also fire): ${authoredForks.lift.toFixed(3)}x; quiet-alternative mean ${(100 * authoredForks.quietMean).toFixed(1)}%.\n`+
      `\n## Preserved false start\n\n`+
      `The first instrument gave every column exactly one ply past the fork and reported N=2 23/23, N=4 43/43 and N=8 79/79 admitted (100.0% each). Criterion 16 appeared to reopen CR1. D526's diagnosis proved that construction made common/candidate overlap effectively impossible; these numbers are retained as an instrument failure, not erased.\n\n`+
      `## Corrected multi-ply construction\n\n`+
      `Each distinct opener continues deterministically to eight plies through the shipped runtime.\n\n`+
      comparisons.map(([count, value]) => `- CR1 N=${count}: ${value.after}/${value.before} entries admitted (${(100 * value.share).toFixed(1)}%).`).join("\n")+
      `\n\nN=8 is below criterion 16's 90% reopening threshold. CR1 remains admitted; this is a volume result, not a quality claim.\n\n`+
      `Criterion 2a is **vacuous at Stage 1**: the validating bound set is the single Philidor claim.\n`;
    if (process.env.UPDATE_FEEDBACK_DELIVERY === "1") {
      if (readFileSync(OUT, "utf8") !== report) writeFileSync(OUT, report);
    }
    else expect(report).toBe(readFileSync(OUT, "utf8"));
    expect(exhausted / packs.length).toBeGreaterThanOrEqual(0.1);
    expect(deliveredClaims + timingWithheldClaims).toBe(admitted);
    expect(authoredForks.forks).toBeGreaterThan(0);
    expect(authoredForks.skipped).toBe(0);
    expect(n8Share).toBeLessThanOrEqual(0.9);
  });
});
