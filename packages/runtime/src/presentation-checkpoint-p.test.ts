// D3106: the Checkpoint-P fence executes behaviour; it never searches source text for needles.
//
// One `describe` per Checkpoint-P repair row of rfc/evidence-presentation.md (the eight operations
// the disposable author model lists as MANIFEST_PRESENTATION_REPAIRS). Each row resolves the real
// production exports and runs them:
//   - LANDED rows assert the postimage semantics of the production operation.
//   - NOT YET LANDED rows assert the CURRENT (preimage) catalogue/payload behaviour by executing the
//     compiled manifest and the value factories through public APIs. When the repair lands, the
//     preimage assertion fails and must be flipped to the postimage — that failure is the fence.
import { describe, expect, it } from "vitest";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import * as runtime from "./index.js";
import {
  CORPUS_RESULT_ABSTENTION_REASONS,
  PRIMARY_EVIDENCE_MANIFEST,
  SOURCE_ATTRIBUTION_REGISTRY_IMAGE,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  STRUCTURE_PREDICATES,
  branchPath,
  commitMove,
  compareBranches,
  comparisonNarrative,
  corpusPageEvidence,
  corpusPositionEvidence,
  createRun,
  evaluateNamedStructureWithWitness,
  evaluateStructuralExpressionWithWitness,
  evidenceForConsumer,
  fork,
  parseCorpusResultAbstention,
  parseSourceAttributionRegistryImage,
  positionGuidanceEvidence,
  resolveSourceAttribution,
  rewind,
  sourceAttributionRegistryDigest,
  structuralReading,
  type DeclaredEvidence,
  type DrillRun,
  type ParsedSourceAttributionRegistryImage,
} from "./index.js";

const CHECKPOINT_P_ROWS = Object.freeze({
  "internal-opponent": "not_yet_landed",
  "internal-repertoire": "not_yet_landed",
  "internal-story-rank": "not_yet_landed",
  "named-structure-geometry": "landed",
  "pack-phase-payload": "not_yet_landed",
  "consequence-payload": "not_yet_landed",
  "source-bound-citation": "partially_landed",
  "explorer-absence-reason": "landed",
} as const);

const at = "2026-09-24T00:00:00.000Z";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const MAROCZY = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
const MACHINE_ONLY = new Set(["machine_condition"]);
const population = Object.freeze({ source: "lichess-explorer", ratings: [1600], speeds: ["blitz", "rapid", "classical"], since: "2023-10", until: "2026-09" });

const projection = (id: string, version = 1) => {
  const found = PRIMARY_EVIDENCE_MANIFEST.projections.find((entry) => entry.id === id && entry.version === version);
  if (found === undefined) throw new Error(`${id}@${version} is not in the compiled manifest`);
  return found;
};
const consumer = (id: string) => {
  const found = PRIMARY_EVIDENCE_MANIFEST.consumers.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`${id} is not in the compiled manifest`);
  return found;
};
const bindingsOf = (consumerId: string, projectionId?: string) => PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) =>
  binding.consumer.id === consumerId && (projectionId === undefined || binding.projection.id === projectionId));
const presentational = (forms: readonly string[]): readonly string[] => forms.filter((form) => !MACHINE_ONLY.has(form));

function recordedComparison(): { readonly run: DrillRun; readonly comparison: ReturnType<typeof compareBranches> } {
  let run = createRun({ id: "checkpoint-p", packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1", seed: 1, createdAt: at, policyConfig });
  const root = run.activeCursor.nodeId;
  for (const move of ["e1g1", "e8c8", "c4e6"]) run = commitMove(run, move, { at }).run;
  const main = run.activeCursor.branchId;
  run = rewind(run, root, at).run;
  run = fork(run, root, { at }).run;
  for (const move of ["a2a3", "e8g8"]) run = commitMove(run, move, { at }).run;
  const alternative = run.activeCursor.branchId;
  return { run, comparison: compareBranches(run, [main, alternative]) };
}

function guidanceAt(fen: string, pack?: DrillPackDefinition): readonly DeclaredEvidence<unknown>[] {
  const run = createRun({ id: "checkpoint-p-guidance", packId: "p", packDigest: `sha256:${"b".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig });
  const node = branchPath(run, run.activeCursor.branchId).at(-1)!;
  return positionGuidanceEvidence({ run, node, ...(pack === undefined ? {} : { pack }) });
}

describe("Checkpoint P fence: population", () => {
  it("covers exactly the eight Checkpoint-P repair rows", () => {
    expect(Object.keys(CHECKPOINT_P_ROWS).sort()).toEqual([
      "consequence-payload", "explorer-absence-reason", "internal-opponent", "internal-repertoire",
      "internal-story-rank", "named-structure-geometry", "pack-phase-payload", "source-bound-citation",
    ]);
  });

  it("resolves every landed operation to a callable production export (not a string)", () => {
    const exports = runtime as unknown as Record<string, unknown>;
    for (const symbol of [
      "evaluateNamedStructureWithWitness", "evaluateStructuralExpressionWithWitness",
      "parseCorpusResultAbstention", "parseSourceAttributionRegistryImage",
      "sourceAttributionRegistryDigest", "resolveSourceAttribution",
    ]) expect(typeof exports[symbol], symbol).toBe("function");
    expect(exports.STRUCTURE_PREDICATES).toBe(STRUCTURE_PREDICATES);
    expect(exports.CORPUS_RESULT_ABSTENTION_REASONS).toBe(CORPUS_RESULT_ABSTENTION_REASONS);
    expect(exports[SOURCE_ATTRIBUTION_REGISTRY_IMAGE.resolver.symbol]).toBe(resolveSourceAttribution);
  });
});

describe("internal-opponent — NOT YET LANDED (opponent.selection@1 still declares presentational forms)", () => {
  it("preimage: the consumer and its bindings carry list/panel forms", () => {
    expect(CHECKPOINT_P_ROWS["internal-opponent"]).toBe("not_yet_landed");
    expect(presentational(consumer("opponent.selection").forms)).toEqual(["list", "panel"]);
    const bindings = bindingsOf("opponent.selection");
    expect(bindings.length).toBeGreaterThan(0);
    expect(bindings.some((binding) => presentational(binding.forms).length > 0)).toBe(true);
  });
});

describe("internal-repertoire — NOT YET LANDED (runtime.repertoire_scan@1 still declares presentational forms)", () => {
  it("preimage: the consumer admits position stats with list/panel forms", () => {
    expect(CHECKPOINT_P_ROWS["internal-repertoire"]).toBe("not_yet_landed");
    expect(presentational(consumer("runtime.repertoire_scan").forms)).toEqual(["list", "panel"]);
    const result = parseCorpusResultAbstention({ kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100", population });
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "runtime.repertoire_scan", version: 1 }, [corpusPositionEvidence(result)]);
    expect(view.items.map((item) => item.projection.id)).toEqual(["human.explorer.position_stats"]);
    const [binding] = bindingsOf("runtime.repertoire_scan", "human.explorer.position_stats");
    expect(presentational(binding!.forms)).toEqual(["list", "panel"]);
  });
});

describe("internal-story-rank — NOT YET LANDED (derived.story.rank@1 is still a visual review.story binding)", () => {
  it("preimage: review.story binds story rank with presentational forms", () => {
    expect(CHECKPOINT_P_ROWS["internal-story-rank"]).toBe("not_yet_landed");
    const [binding] = bindingsOf("review.story", "derived.story.rank");
    expect(binding).toBeDefined();
    expect(presentational(binding!.forms).length).toBeGreaterThan(0);
  });
});

describe("named-structure-geometry — LANDED operation (one registry decides match and witness)", () => {
  it("postimage: the production registry and evaluator return the Maroczy witness; structuralReading carries it", () => {
    expect(CHECKPOINT_P_ROWS["named-structure-geometry"]).toBe("landed");
    expect(evaluateNamedStructureWithWitness(MAROCZY, "maroczy-bind")).toEqual({ matched: true, squares: ["c4", "e4"] });
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, STRUCTURE_PREDICATES["maroczy-bind"])).toEqual({ matched: true, squares: ["c4", "e4"] });
    const observed = structuralReading(MAROCZY).features.filter((feature) => feature.kind === "named_structure");
    expect(observed.map((feature) => feature.squares)).toEqual([["c4", "e4"]]);
  });

  it("NOT YET LANDED: named_structure@2 evidence still retains id/name/provenanceNote without witness squares", () => {
    expect(projection("rules.structural.reading.named_structure", 2).operands).toEqual(["id", "name", "provenanceNote"]);
    const named = guidanceAt(MAROCZY).filter((item) => item.projection.id === "rules.structural.reading.named_structure");
    expect(named.map((item) => item.payload)).toEqual([{ id: "maroczy-bind", name: "Maroczy Bind", provenanceNote: "Tabiya catalogue convention: White pawns on c4/e4 with the declared open files." }]);
  });
});

describe("pack-phase-payload — NOT YET LANDED (pack.authored.phase@1 is still a bare string without a {phase} operand)", () => {
  it("preimage: the catalogue declares no operand and the factory mints the bare phase string", () => {
    expect(CHECKPOINT_P_ROWS["pack-phase-payload"]).toBe("not_yet_landed");
    expect(projection("pack.authored.phase").operands).toEqual([]);
    const pack = { id: "checkpoint-p-pack", phase: "endgame" } as unknown as DrillPackDefinition;
    const phase = guidanceAt(MAROCZY, pack).filter((item) => item.projection.id === "pack.authored.phase");
    expect(phase.map((item) => item.payload)).toEqual(["endgame"]);
  });
});

describe("consequence-payload — NOT YET LANDED (catalogue still declares context,terminal only)", () => {
  it("preimage: the executed factory emits the terminal:false arm whose operands the catalogue does not declare", () => {
    expect(CHECKPOINT_P_ROWS["consequence-payload"]).toBe("not_yet_landed");
    expect(projection("run.record.consequence").operands).toEqual(["context", "terminal"]);
    const { run, comparison } = recordedComparison();
    const consequences = comparisonNarrative(run, comparison).evidence.filter((item) => item.projection.id === "run.record.consequence");
    expect(consequences.length).toBeGreaterThan(0);
    for (const item of consequences) {
      const payload = item.payload as Readonly<Record<string, unknown>>;
      expect(payload.terminal).toBe(false);
      expect(Object.keys(payload).sort()).toEqual(["context", "objectiveState", "plies", "terminal"]);
    }
  });
});

describe("source-bound-citation — registry LANDED; derived.citation.attribution@1 NOT YET LANDED", () => {
  it("postimage: the registry issues identity only for its parsed image and resolves attribution without guessing", () => {
    expect(CHECKPOINT_P_ROWS["source-bound-citation"]).toBe("partially_landed");
    expect(sourceAttributionRegistryDigest(SOURCE_ATTRIBUTION_REGISTRY_IMAGE)).toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
    expect(() => sourceAttributionRegistryDigest({ id: "source-attribution-registry", version: 1, rows: [] } as unknown as ParsedSourceAttributionRegistryImage)).toThrow(TypeError);
    expect(() => parseSourceAttributionRegistryImage({ id: "source-attribution-registry", version: 1, rows: [] })).toThrow(TypeError);
    expect(resolveSourceAttribution("human.maia.event@1", { kind: "deployment_artifact", artifactId: "maia_model" })).toEqual({ kind: "absent", reason: "source_attribution_absent" });
    for (const row of SOURCE_ATTRIBUTION_REGISTRY_IMAGE.rows) {
      const [id, version] = row.sourceProjection.split("@") as [string, string];
      expect(projection(id, Number(version)).id).toBe(id);
    }
  });

  it("preimage: no derived.citation.attribution projection exists and runtime.evidence_ref does not accept one", () => {
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((entry) => entry.id === "derived.citation.attribution")).toBe(false);
    expect(consumer("runtime.evidence_ref").accepts.some((ref) => ref.id === "derived.citation.attribution")).toBe(false);
  });
});

describe("explorer-absence-reason — LANDED (one production tuple, complete-arm parser, catalogue join)", () => {
  it("postimage: the parser refuses the fragment and the executed page factory's reason joins the catalogue tuple", () => {
    expect(CHECKPOINT_P_ROWS["explorer-absence-reason"]).toBe("landed");
    expect(() => parseCorpusResultAbstention({ kind: "abstention", reason: "no_data_at_band" })).toThrow(TypeError);
    for (const reason of CORPUS_RESULT_ABSTENTION_REASONS) {
      const result = parseCorpusResultAbstention({ kind: "abstention", reason, detail: "fixture", population });
      const page = corpusPageEvidence({ nodeId: "n1", result, committedMoveSan: null });
      const declared = projection(page.projection.id, page.projection.version);
      expect(declared.id).toBe("human.explorer.population");
      expect(declared.abstention.reasons).toContain((page.payload as { readonly result: { readonly reason: string } }).result.reason);
    }
    expect([...projection("human.explorer.population").abstention.reasons].sort()).toEqual([...CORPUS_RESULT_ABSTENTION_REASONS].sort());
    expect([...projection("human.explorer.position_stats").abstention.reasons].sort()).toEqual([...CORPUS_RESULT_ABSTENTION_REASONS].sort());
  });

  it("NOT YET LANDED: the position_stats value factory still admits an abstention fragment without reason/detail", () => {
    const fragment = corpusPositionEvidence({ kind: "abstention", population });
    expect(fragment.projection.id).toBe("human.explorer.position_stats");
    expect(() => parseCorpusResultAbstention(fragment.payload)).toThrow(TypeError);
  });
});
