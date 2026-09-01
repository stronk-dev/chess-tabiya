import { authoredSpineFens } from "../../apps/server/src/pack-validation.js";
import { classifyPhase, type DetectedPhase } from "../../packages/runtime/src/phase.js";
import type { DrillPackDefinition, PackPhase, SpineNode } from "../../packages/schema/src/drill-pack/index.js";

type DeclaredSinglePhase = Exclude<PackPhase, "cross_phase">;

export interface PhaseSample {
  readonly nodeId: "$start" | string;
  readonly fen: string;
  readonly detected: DetectedPhase;
  readonly material: Readonly<Record<"white" | "black", number>>;
  readonly undevelopedMinors: Readonly<Record<"white" | "black", number>>;
}

export interface PackPhaseReading {
  readonly packId: string;
  readonly declared: PackPhase;
  readonly samples: readonly PhaseSample[];
  readonly edgeChanges: number;
  readonly edgeTransitions: readonly { readonly nodeId: string; readonly from: DetectedPhase; readonly to: DetectedPhase }[];
  readonly twoEdgeReversals: number;
}

function sample(nodeId: "$start" | string, fen: string): PhaseSample {
  const reading = classifyPhase(fen);
  return Object.freeze({
    nodeId,
    fen,
    detected: reading.phase,
    material: reading.material,
    undevelopedMinors: reading.undevelopedMinors,
  });
}

export function readPackPhase(pack: DrillPackDefinition): PackPhaseReading {
  const fens = authoredSpineFens(pack);
  const authoredNodes = (nodes: readonly SpineNode[]): number => nodes.reduce((sum, node) => sum + 1 + authoredNodes(node.children), 0);
  const expectedPositions = 1 + authoredNodes(pack.spine ?? []);
  if (fens.length !== expectedPositions) {
    throw new TypeError(`${pack.id}: authored spine contains ${expectedPositions - 1} nodes but only ${fens.length - 1} legal successor positions`);
  }
  const start = sample("$start", fens[0]!);
  const samples: PhaseSample[] = [start];
  let edgeChanges = 0;
  const edgeTransitions: { nodeId: string; from: DetectedPhase; to: DetectedPhase }[] = [];
  let twoEdgeReversals = 0;
  let fenIndex = 1;

  const visit = (nodes: readonly SpineNode[], parent: DetectedPhase, grandparent: DetectedPhase | undefined): void => {
    for (const node of nodes) {
      const current = sample(node.id, fens[fenIndex++]!);
      samples.push(current);
      if (current.detected !== parent) {
        edgeChanges += 1;
        edgeTransitions.push(Object.freeze({ nodeId: node.id, from: parent, to: current.detected }));
      }
      if (grandparent !== undefined && current.detected === grandparent && current.detected !== parent) twoEdgeReversals += 1;
      visit(node.children, current.detected, parent);
    }
  };
  visit(pack.spine ?? [], start.detected, undefined);

  return Object.freeze({
    packId: pack.id,
    declared: pack.phase,
    samples: Object.freeze(samples),
    edgeChanges,
    edgeTransitions: Object.freeze(edgeTransitions),
    twoEdgeReversals,
  });
}

function countDetected(samples: readonly PhaseSample[]): Readonly<Record<DetectedPhase, number>> {
  return Object.freeze(Object.fromEntries(
    (["opening", "middlegame", "endgame", "unclear"] as const).map((phase) => [phase, samples.filter((row) => row.detected === phase).length]),
  ) as unknown as Record<DetectedPhase, number>);
}

function singlePhaseStatus(reading: PackPhaseReading, samples: readonly PhaseSample[]) {
  if (reading.declared === "cross_phase") return undefined;
  return Object.freeze({
    matches: samples.filter((row) => row.detected === reading.declared).length,
    abstains: samples.filter((row) => row.detected === "unclear").length,
    mismatches: samples.filter((row) => row.detected !== "unclear" && row.detected !== reading.declared).length,
  });
}

export function phaseCensus(packs: readonly DrillPackDefinition[]) {
  const readings = packs.map(readPackPhase).sort((left, right) => left.packId.localeCompare(right.packId));
  const allSamples = readings.flatMap((row) => row.samples);
  const allTransitions = readings.flatMap((row) => row.edgeTransitions.map((transition) => ({ packId: row.packId, ...transition })));
  const single = readings.filter((row): row is PackPhaseReading & { declared: DeclaredSinglePhase } => row.declared !== "cross_phase");
  const singleSamples = single.flatMap((row) => row.samples.map((sample) => ({ reading: row, sample })));
  const rootPairs = single.map((reading) => ({ reading, sample: reading.samples[0]! }));
  const aggregate = (pairs: readonly { reading: PackPhaseReading & { declared: DeclaredSinglePhase }; sample: PhaseSample }[]) => Object.freeze({
    positions: pairs.length,
    matches: pairs.filter(({ reading, sample }) => sample.detected === reading.declared).length,
    abstains: pairs.filter(({ sample }) => sample.detected === "unclear").length,
    mismatches: pairs.filter(({ reading, sample }) => sample.detected !== "unclear" && sample.detected !== reading.declared).length,
  });

  return Object.freeze({
    schema: "tabiya.research.phase-classifier-census.v1",
    boundary: "Curated pack phase conformance; not independent position ground truth",
    convention: Object.freeze({ endgameMaterialMax: 13, developedMaterialMin: 18, openingUndevelopedMin: 5, middlegameUndevelopedMax: 2 }),
    corpus: Object.freeze({
      packs: readings.length,
      positions: allSamples.length,
      byDeclared: Object.freeze(Object.fromEntries(
        (["opening", "middlegame", "endgame", "cross_phase"] as const).map((phase) => [phase, readings.filter((row) => row.declared === phase).length]),
      )),
    }),
    roots: aggregate(rootPairs),
    authoredPositions: aggregate(singleSamples),
    detected: countDetected(allSamples),
    edgeChanges: readings.reduce((sum, row) => sum + row.edgeChanges, 0),
    transitionMatrix: Object.freeze(Object.fromEntries(
      [...allTransitions.reduce((keys, row) => keys.add(`${row.from}->${row.to}`), new Set<string>())]
        .sort()
        .map((key) => [key, allTransitions.filter((row) => `${row.from}->${row.to}` === key).length]),
    )),
    transitionDetails: Object.freeze(allTransitions),
    twoEdgeReversals: readings.reduce((sum, row) => sum + row.twoEdgeReversals, 0),
    packs: Object.freeze(readings.map((reading) => Object.freeze({
      packId: reading.packId,
      declared: reading.declared,
      positions: reading.samples.length,
      detected: countDetected(reading.samples),
      root: reading.samples[0],
      conformance: singlePhaseStatus(reading, reading.samples),
      edgeChanges: reading.edgeChanges,
      edgeTransitions: reading.edgeTransitions,
      twoEdgeReversals: reading.twoEdgeReversals,
    }))),
  });
}
