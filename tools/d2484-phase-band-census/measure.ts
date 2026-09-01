import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  DEVELOPED_MATERIAL_MIN,
  ENDGAME_MATERIAL_MAX,
  MIDDLEGAME_UNDEVELOPED_MAX,
  OPENING_UNDEVELOPED_MIN,
  type DetectedPhase,
} from "../../packages/runtime/src/phase.js";
import type { DrillPackDefinition, PackPhase } from "../../packages/schema/src/drill-pack/index.js";
import { readPackPhase, type PhaseSample } from "../d2483-phase-classifier-census/census.js";
import { phaseDecision, type PhaseDecision } from "./bands.js";

interface DecisionSample {
  readonly packId: string;
  readonly declared: PackPhase;
  readonly nodeId: string;
  readonly detected: DetectedPhase;
  readonly decision: PhaseDecision;
}

function decisionSample(packId: string, declared: PackPhase, sample: PhaseSample): DecisionSample {
  return Object.freeze({
    packId,
    declared,
    nodeId: sample.nodeId,
    detected: sample.detected,
    decision: phaseDecision({
      phase: sample.detected,
      material: sample.material,
      undevelopedMinors: sample.undevelopedMinors,
    }),
  });
}

function histogram(values: readonly number[]): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(
    [...new Set(values)].sort((left, right) => left - right).map((value) => [String(value), values.filter((candidate) => candidate === value).length]),
  ));
}

export function phaseBandCensus(packs: readonly DrillPackDefinition[]) {
  const readings = packs.map(readPackPhase).sort((left, right) => left.packId.localeCompare(right.packId));
  const samples = readings.flatMap((reading) => reading.samples.map((sample) => decisionSample(reading.packId, reading.declared, sample)));
  const roots = readings.map((reading) => decisionSample(reading.packId, reading.declared, reading.samples[0]!));
  const kinds = [
    "endgame_material_band",
    "material_transition_gap",
    "opening_development_band",
    "middlegame_development_band",
    "development_transition_gap",
  ] as const;
  const bandRows = samples.filter((sample): sample is DecisionSample & { decision: Extract<PhaseDecision, { marginInsideBand: number }> } => "marginInsideBand" in sample.decision);
  const abstentions = samples.filter((sample) => sample.detected === "unclear");

  return Object.freeze({
    schema: "tabiya.research.phase-band-census.v1",
    boundary: "Exact classifier threshold sensitivity over curated authored positions; not probability or chess-phase accuracy",
    corpus: Object.freeze({ packs: readings.length, positions: samples.length, roots: roots.length }),
    thresholds: Object.freeze({
      endgameMaterialMax: ENDGAME_MATERIAL_MAX,
      developedMaterialMin: DEVELOPED_MATERIAL_MIN,
      openingUndevelopedMin: OPENING_UNDEVELOPED_MIN,
      middlegameUndevelopedMax: MIDDLEGAME_UNDEVELOPED_MAX,
    }),
    arms: Object.freeze(Object.fromEntries(kinds.map((kind) => [kind, Object.freeze({
      positions: samples.filter((sample) => sample.decision.kind === kind).length,
      roots: roots.filter((sample) => sample.decision.kind === kind).length,
    })]))),
    selectedBandMargins: Object.freeze(Object.fromEntries(
      kinds.filter((kind) => kind.endsWith("_band")).map((kind) => [kind, histogram(
        bandRows.filter((sample) => sample.decision.kind === kind).map((sample) => sample.decision.marginInsideBand),
      )]),
    )),
    selectedBandsAtBoundary: bandRows.filter((sample) => sample.decision.marginInsideBand === 0).length,
    selectedBandsWithinOneUnit: bandRows.filter((sample) => sample.decision.marginInsideBand <= 1).length,
    abstentions: Object.freeze({
      positions: abstentions.length,
      roots: roots.filter((sample) => sample.detected === "unclear").length,
      byReason: Object.freeze(Object.fromEntries(kinds.filter((kind) => kind.includes("gap")).map((kind) => [kind, samples.filter((sample) => sample.decision.kind === kind).length]))),
      materialGapObserved: histogram(abstentions.filter((sample) => sample.decision.kind === "material_transition_gap").map((sample) => sample.decision.observed)),
      developmentGapObserved: histogram(abstentions.filter((sample) => sample.decision.kind === "development_transition_gap").map((sample) => sample.decision.observed)),
      rootDetails: Object.freeze(roots.filter((sample) => sample.detected === "unclear")),
    }),
  });
}

function packFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(entry.name))
    .map((entry) => resolve(root, entry.name))
    .sort();
}

function main(): void {
  const root = resolve(process.argv[2] ?? "content/drafts");
  const out = resolve(process.argv[3] ?? "planning/phase-band-census/results.json");
  const packs = packFiles(root).map((file) => JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition);
  const report = phaseBandCensus(packs);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`phase-band-census: ${report.corpus.positions} positions; arms ${Object.entries(report.arms).map(([kind, value]) => `${kind}=${value.positions}`).join(", ")}; abstentions ${report.abstentions.positions}; selected bands at boundary ${report.selectedBandsAtBoundary}\n`);
}

if (process.argv[1]?.endsWith("measure.mjs") || process.argv[1]?.endsWith("measure.js")) main();
