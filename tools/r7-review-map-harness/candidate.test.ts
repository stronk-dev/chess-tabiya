// DISPOSABLE research harness — platform-alignment R7. Not production code.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  attachEvidence,
  commitMove,
  compileEvidenceManifest,
  createRun,
  localSemanticEvents,
  selectSemanticEvidence,
  storyMoments,
  type EvidenceEligibilityDeclaration,
  type EvidenceSelectionPolicyDeclaration,
  type SemanticEvidenceEvent,
} from "@chess-tabiya/runtime";

const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;
const OUTPUT = new URL("./candidate-output.md", import.meta.url).pathname;
const at = "2026-08-21T22:00:00.000Z";
const digest = `sha256:${"8".repeat(64)}`;
const ref = (id: string) => ({ id, version: 1 } as const);

const ADMITTED = new Set([
  "rules.transition.event.castled",
  "rules.transition.event.checkmate",
  "rules.transition.event.promotion",
  "rules.transition.event.last_of_role",
  "rules.structural.event.passed_pawn",
  "rules.structural.event.doubled_pawn",
  "rules.structural.event.isolated_pawn",
  "rules.structural.event.backward_pawn",
  "rules.structural.event.open_file",
  "rules.structural.event.half_open_file",
  "rules.structural.event.king_opposition",
  "rules.structural.event.named_structure",
]);

const eligibility: readonly EvidenceEligibilityDeclaration[] = Object.freeze(
  (EVIDENCE_CONTRACT_DECLARATIONS.eligibility ?? []).map((row) => Object.freeze(ADMITTED.has(row.event.id)
    ? row
    : { ...row, disposition: "refused" as const, reason: ref("consumer_refused") })),
);
const policy: EvidenceSelectionPolicyDeclaration = Object.freeze({
  id: "research.r7_mixed_moment",
  version: 1,
  consumer: ref("research.semantic_selection"),
  disposition: "experimental",
  minimumAlternatives: 8,
  maximumSameFamilyShare: 0.20,
  minimumAlternativeOnlyShare: null,
  maxFacts: 1,
  criticalEvents: Object.freeze(["checkmate", "promotion", "castled", "last_of_role"].map((family) => ref(`rules.transition.event.${family}`))),
});
const manifest = compileEvidenceManifest({
  ...EVIDENCE_CONTRACT_DECLARATIONS,
  eligibility,
  selectionPolicies: Object.freeze([...(EVIDENCE_CONTRACT_DECLARATIONS.selectionPolicies ?? []), policy]),
});

interface SpineNode { readonly id: string; readonly moveUci: string; readonly moveSan: string; readonly children?: readonly SpineNode[]; }
interface Pack { readonly id: string; readonly phase: string; readonly start: { readonly fen: string; readonly side: "white" | "black" }; readonly spine: readonly SpineNode[]; }
interface EvalRecord { readonly anchor?: { readonly fen?: string }; readonly kind?: string; readonly values?: { readonly centipawns?: number; readonly engineId?: string; readonly requestedDepth?: number }; }

function mainline(nodes: readonly SpineNode[]): readonly SpineNode[] {
  const values: SpineNode[] = [];
  let current = nodes[0];
  while (current !== undefined) { values.push(current); current = current.children?.[0]; }
  return values;
}

function fixtureFiles(): readonly string[] {
  return readdirSync(DRAFTS).filter((name) => name.endsWith(".json") && !name.includes(".browser.") && !name.includes(".evidence.") && !name.includes(".sources.") && !name.includes(".job.")).sort();
}

function sidecar(packFile: string): Map<string, EvalRecord> {
  const path = join(DRAFTS, packFile.replace(/\.json$/u, ".evidence.json"));
  try {
    const document = JSON.parse(readFileSync(path, "utf8")) as { readonly records?: readonly EvalRecord[] };
    return new Map((document.records ?? []).filter((record) => record.kind === "engine_eval" && typeof record.anchor?.fen === "string" && Number.isSafeInteger(record.values?.centipawns)).map((record) => [record.anchor!.fen!, record]));
  } catch { return new Map(); }
}

function runFixture(pack: Pack, line: readonly SpineNode[], evaluations: Map<string, EvalRecord>) {
  let run = createRun({
    id: `r7-${pack.id}`,
    session: { kind: "position", start: pack.start, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 8,
    createdAt: at,
  });
  const attach = (nodeId: string, fen: string) => {
    const record = evaluations.get(fen);
    if (record === undefined) return;
    const whiteCp = record.values!.centipawns!;
    const sideToMoveCp = fen.split(" ")[1] === "w" ? whiteCp : -whiteCp;
    run = attachEvidence(run, nodeId, [`engine:r7:${nodeId}`], { kind: "eval", source: "engine_validated", values: { centipawns: sideToMoveCp, engineId: record.values?.engineId ?? "recorded authoring engine", requestedMovetimeMs: 0 } }, at).run;
  };
  attach(run.nodes[0]!.id, pack.start.fen);
  for (const node of line) {
    run = commitMove(run, node.moveUci, { actor: "system", at }).run;
    attach(run.activeCursor.nodeId, run.nodes.find((item) => item.id === run.activeCursor.nodeId)!.fen);
  }
  return run;
}

function selectMixed(beforeFen: string, moveUci: string, afterFen: string) {
  const events = (edge: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }): readonly SemanticEvidenceEvent[] => localSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen);
  return selectSemanticEvidence(manifest, ref(policy.id), {
    beforeFen,
    moveUci,
    afterFen,
    playedEvents: events({ beforeFen, moveUci, afterFen }),
    evaluateAlternative: events,
  });
}

describe("R7 same-mainline candidate policies", () => {
  it("compares current Story, one engine pivot and mixed exact moments over retained recorded evaluations", () => {
    const candidates = fixtureFiles().flatMap((file) => {
      const pack = JSON.parse(readFileSync(join(DRAFTS, file), "utf8")) as Pack;
      const line = mainline(pack.spine);
      const evals = sidecar(file);
      if (line.length < 4) return [];
      let fen = pack.start.fen;
      const edges: { beforeFen: string; moveUci: string; afterFen: string }[] = [];
      for (const node of line) {
        const run = createRun({ id: "edge", session: { kind: "position", start: { fen, side: fen.split(" ")[1] === "w" ? "white" : "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
        const committed = commitMove(run, node.moveUci, { actor: "system", at }).run;
        const afterFen = committed.nodes.at(-1)!.fen;
        edges.push({ beforeFen: fen, moveUci: node.moveUci, afterFen });
        fen = afterFen;
      }
      return [{ pack, line, evals, edges }];
    });
    const byPhase = new Map<string, typeof candidates>();
    for (const candidate of candidates) {
      const rows = byPhase.get(candidate.pack.phase) ?? [];
      if (rows.length < 2) rows.push(candidate);
      byPhase.set(candidate.pack.phase, rows);
    }
    const sample = [...byPhase.values()].flat();
    expect([...new Set(sample.map((item) => item.pack.phase))]).toEqual(expect.arrayContaining(["opening", "middlegame", "endgame"]));
    expect(sample.length).toBeGreaterThanOrEqual(6);

    const coverage = [...new Set(candidates.map((item) => item.pack.phase))].sort().map((phase) => {
      const phaseRows = candidates.filter((item) => item.pack.phase === phase);
      const full = phaseRows.filter((item) => item.evals.has(item.pack.start.fen) && item.edges.every((edge) => item.evals.has(edge.afterFen))).length;
      const anyPair = phaseRows.filter((item) => [item.pack.start.fen, ...item.edges.map((edge) => edge.afterFen)].some((fen, index, values) => index > 0 && item.evals.has(fen) && item.evals.has(values[index - 1]!))).length;
      return { phase, packs: phaseRows.length, full, anyPair };
    });

    const rows = sample.map(({ pack, line, evals, edges }) => {
      const run = runFixture(pack, line, evals);
      const story = storyMoments(run, run.activeCursor.branchId);
      const learnerSign = pack.start.side === "white" ? 1 : -1;
      const positions = [pack.start.fen, ...edges.map((edge) => edge.afterFen)];
      const cp = positions.map((fen) => evals.get(fen)?.values?.centipawns);
      let engineIndex: number | undefined;
      let engineDelta = -1;
      for (let index = 1; index < cp.length; index += 1) {
        if (cp[index] === undefined || cp[index - 1] === undefined) continue;
        const delta = Math.abs(cp[index]! * learnerSign - cp[index - 1]! * learnerSign);
        if (delta > engineDelta) { engineDelta = delta; engineIndex = index; }
      }
      const mixed = edges.flatMap((edge, index) => selectMixed(edge.beforeFen, edge.moveUci, edge.afterFen).selected.map((fact) => ({ ply: index + 1, projection: fact.event.projection.id, action: "retry_branch" as const })));
      expect(mixed.every((moment) => ADMITTED.has(moment.projection) && moment.action === "retry_branch")).toBe(true);
      expect(new Set(mixed.map((moment) => moment.ply)).size).toBe(mixed.length);
      return {
        pack: pack.id,
        phase: pack.phase,
        plies: line.length,
        current: story.rank.slice(0, 8).length,
        engine: engineIndex === undefined ? 0 : 1,
        enginePly: engineIndex,
        mixed: mixed.length,
        families: [...new Set(mixed.map((moment) => moment.projection.split(".").at(-1)!))].sort(),
      };
    });

    expect(rows.some((row) => row.current !== row.mixed)).toBe(true);
    expect(rows.some((row) => row.engine === 0)).toBe(true);
    const report = [
      "# R7 same-mainline policy comparison",
      "",
      "Disposable research output over retained authored Stockfish sidecars; no engine run and no product authority.",
      "",
      "## Recorded-evaluation reach over eligible mainlines",
      "",
      "| Phase | Packs | Any consecutive eval pair | Full mainline eval coverage |",
      "|---|---:|---:|---:|",
      ...coverage.map((row) => `| ${row.phase} | ${row.packs} | ${row.anyPair} | ${row.full} |`),
      "",
      "## Stratified two-per-phase comparison",
      "",
      "| Pack | Phase | Plies | Current Story top-8 | Engine-only | Mixed exact | Mixed families |",
      "|---|---|---:|---:|---:|---:|---|",
      ...rows.map((row) => `| ${row.pack} | ${row.phase} | ${row.plies} | ${row.current} | ${row.engine === 0 ? "abstain" : `1 (ply ${row.enginePly})`} | ${row.mixed} | ${row.families.join(", ") || "abstain"} |`),
      "",
      "Mixed exact is a research candidate: eligibility precedes selection, cap one, no avoidance/valence, every retained moment opens retry/branch.",
      "",
    ];
    writeFileSync(OUTPUT, report.join("\n"));
  }, 120_000);
});
