// DISPOSABLE research harness — D1654/D1700. Not production code.
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  compileEvidenceManifest,
  type AvailabilityMode,
  type EvidenceContractDeclarations,
  type LatencyMode,
  type ProducerDeclaration,
  type ProjectionDeclaration,
  type VersionedEvidenceId,
} from "@chess-tabiya/runtime";

type Confidence = ProjectionDeclaration["confidence"];

interface ExecutionPath {
  readonly latency: LatencyMode;
  readonly requirements: readonly string[];
  readonly choices: readonly string[];
}

const latencyRank: Readonly<Record<LatencyMode, number>> = Object.freeze({
  sync: 0,
  interactive: 1,
  background: 2,
  offline: 3,
});

const key = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

function derivationMembers(projection: ProjectionDeclaration): readonly (readonly VersionedEvidenceId[])[] {
  if (projection.derivation === undefined) return Object.freeze([]);
  return "inputs" in projection.derivation
    ? Object.freeze([projection.derivation.inputs!])
    : projection.derivation.anyOf;
}

function slower(left: LatencyMode, right: LatencyMode): LatencyMode {
  return latencyRank[left] >= latencyRank[right] ? left : right;
}

function sourceRequirement(projection: ProjectionDeclaration, producer: ProducerDeclaration): string | undefined {
  if (producer.availability === "local") return undefined;
  return `${projection.id}@${projection.version}:${producer.availability}`;
}

function pathKey(path: ExecutionPath): string {
  return `${[...path.choices].sort().join(";")}=>${path.latency}|${[...path.requirements].sort().join("|")}`;
}

function executionPaths(
  projection: ProjectionDeclaration,
  producers: ReadonlyMap<string, ProducerDeclaration>,
  projections: ReadonlyMap<string, ProjectionDeclaration>,
  memo = new Map<string, readonly ExecutionPath[]>(),
): readonly ExecutionPath[] {
  const projectionKey = key(projection);
  const cached = memo.get(projectionKey);
  if (cached !== undefined) return cached;
  const owner = producers.get(key(projection.producer))!;
  const ownRequirement = sourceRequirement(projection, owner);
  const own: ExecutionPath = Object.freeze({
    latency: owner.latency,
    requirements: Object.freeze(ownRequirement === undefined ? [] : [ownRequirement]),
    choices: Object.freeze([]),
  });
  const members = derivationMembers(projection);
  if (members.length === 0) {
    const result = Object.freeze([own]);
    memo.set(projectionKey, result);
    return result;
  }

  const paths: ExecutionPath[] = [];
  for (const member of members) {
    const choice = `${projectionKey}<-${member.map(key).sort().join("+")}`;
    let combinations: readonly ExecutionPath[] = Object.freeze([Object.freeze({ ...own, choices: Object.freeze([choice]) })]);
    for (const input of member) {
      const dependency = projections.get(key(input))!;
      const dependencyPaths = executionPaths(dependency, producers, projections, memo);
      combinations = Object.freeze(combinations.flatMap((left) => dependencyPaths.map((right) => Object.freeze({
        latency: slower(left.latency, right.latency),
        requirements: Object.freeze([...new Set([...left.requirements, ...right.requirements])].sort()),
        choices: Object.freeze([...new Set([...left.choices, ...right.choices])].sort()),
      }))));
    }
    paths.push(...combinations);
  }
  const unique = [...new Map(paths.map((path) => [pathKey(path), path])).values()]
    .sort((left, right) => pathKey(left).localeCompare(pathKey(right)));
  const result = Object.freeze(unique);
  memo.set(projectionKey, result);
  return result;
}

function directConfidenceSignatures(
  projection: ProjectionDeclaration,
  projections: ReadonlyMap<string, ProjectionDeclaration>,
): readonly string[] {
  return Object.freeze(derivationMembers(projection).map((member) => [...new Set(member.map((input) => projections.get(key(input))!.confidence))].sort().join("+")));
}

function violatesConfidence(output: Confidence, inputs: readonly Confidence[]): boolean {
  if (inputs.includes("reported")) return output !== "reported";
  if (inputs.every((value) => value === "not_applicable")) return output !== "not_applicable";
  if (inputs.every((value) => value === "exact")) return output === "not_applicable";
  // No shipped member currently mixes exact and not_applicable. Keep that semantic question visible
  // instead of manufacturing an ordering for it in this research harness.
  return false;
}

function requiredConfidence(
  projection: ProjectionDeclaration,
  projections: ReadonlyMap<string, ProjectionDeclaration>,
  memo = new Map<string, Confidence>(),
): Confidence {
  const projectionKey = key(projection);
  const cached = memo.get(projectionKey);
  if (cached !== undefined) return cached;
  const members = derivationMembers(projection);
  if (members.length === 0) {
    memo.set(projectionKey, projection.confidence);
    return projection.confidence;
  }
  const memberRequirements = members.map((member) => {
    const inputs = member.map((input) => requiredConfidence(projections.get(key(input))!, projections, memo));
    if (inputs.includes("reported")) return "reported" as const;
    if (inputs.every((value) => value === "not_applicable")) return "not_applicable" as const;
    if (inputs.every((value) => value === "exact")) return "exact" as const;
    return projection.confidence;
  });
  const required = memberRequirements.includes("reported")
    ? "reported"
    : memberRequirements.every((value) => value === "not_applicable")
      ? "not_applicable"
      : memberRequirements.every((value) => value === "exact")
        ? "exact"
        : projection.confidence;
  memo.set(projectionKey, required);
  return required;
}

function dependencyAuthorityDifferences(projection: ProjectionDeclaration): {
  readonly id: string;
  readonly declaredOnly: readonly string[];
  readonly derivedOnly: readonly string[];
} | undefined {
  const declared = new Set(projection.dependsOn.map(key));
  const derived = new Set(derivationMembers(projection).flat().map(key));
  const declaredOnly = [...declared].filter((value) => !derived.has(value)).sort();
  const derivedOnly = [...derived].filter((value) => !declared.has(value)).sort();
  if (declaredOnly.length === 0 && derivedOnly.length === 0) return undefined;
  return Object.freeze({ id: projection.id, declaredOnly: Object.freeze(declaredOnly), derivedOnly: Object.freeze(derivedOnly) });
}

function producerFor(projection: ProjectionDeclaration, producers: ReadonlyMap<string, ProducerDeclaration>): ProducerDeclaration {
  return producers.get(key(projection.producer))!;
}

function falseScalarAdvertisements(
  projections: readonly ProjectionDeclaration[],
  producers: ReadonlyMap<string, ProducerDeclaration>,
  projectionMap: ReadonlyMap<string, ProjectionDeclaration>,
): readonly { readonly id: string; readonly producer: string; readonly scalar: string; readonly paths: readonly string[] }[] {
  return Object.freeze(projections.flatMap((projection) => {
    const owner = producerFor(projection, producers);
    const paths = executionPaths(projection, producers, projectionMap);
    const effective = [...new Set(paths.map((path) => path.latency))].sort();
    if (effective.length === 1 && effective[0] === owner.latency) return [];
    return [{
      id: projection.id,
      producer: owner.id,
      scalar: `${owner.availability}/${owner.latency}`,
      paths: Object.freeze(paths.map(pathKey)),
    }];
  }));
}

function confidenceWideningFixture(outputConfidence: Confidence): EvidenceContractDeclarations {
  const input = Object.freeze({ id: "live.stockfish.eval", version: 1 });
  const output: ProjectionDeclaration = Object.freeze({
    id: "derived.confidence_probe.output", version: 1,
    producer: Object.freeze({ id: "derived.confidence_probe", version: 1 }),
    role: "reading", plane: "derived", payloadType: "ConfidenceProbe",
    semantics: "Disposable reported-input confidence widening probe.", operands: Object.freeze(["value"]),
    signs: Object.freeze(["state"]), grounding: "bounded_search", exactness: "measured",
    confidence: outputConfidence, abstention: Object.freeze({ possible: true, reasons: Object.freeze(["input_abstained"]) }),
    answerContent: Object.freeze(["evaluation"]), forms: Object.freeze(["list"]),
    dependsOn: Object.freeze([input]), derivation: Object.freeze({ inputs: Object.freeze([input]) }),
    limitations: Object.freeze(["Disposable exploration fixture only."]),
    disposition: Object.freeze({ kind: "operator_only", reason: "Disposable exploration fixture only." }),
  });
  const producer: ProducerDeclaration = Object.freeze({
    id: "derived.confidence_probe", version: 1, plane: "derived",
    implementation: "tools/d1700-evidence-execution-harness", availability: "local", latency: "sync",
    outputs: Object.freeze([output]),
  });
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze([...EVIDENCE_CONTRACT_DECLARATIONS.producers, producer]),
  });
}

describe("D1654/D1700 manifest-wide execution contract", () => {
  const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
  const producers = new Map(manifest.producers.map((producer) => [key(producer), producer]));
  const projections = new Map(manifest.projections.map((projection) => [key(projection), projection]));
  const derived = manifest.projections.filter((projection) => projection.derivation !== undefined);

  it("reproduces the missing confidence guard over a reported provider input", () => {
    expect(() => compileEvidenceManifest(confidenceWideningFixture("exact"))).not.toThrow();
    expect(() => compileEvidenceManifest(confidenceWideningFixture("reported"))).not.toThrow();
  });

  it("enumerates every derivation path without losing alternative source requirements", () => {
    const paths = derived.flatMap((projection) => executionPaths(projection, producers, projections));
    expect(paths.length).toBeGreaterThanOrEqual(derived.length);
    expect(paths.some((path) => path.requirements.some((requirement) => requirement.includes(":provider")))).toBe(true);
    expect(paths.some((path) => path.requirements.some((requirement) => requirement.includes(":recorded")))).toBe(true);
  });

  it("prints the stable census used by the research dossier", () => {
    const falseAdvertisements = falseScalarAdvertisements(derived, producers, projections);
    const confidenceSignatures = new Map<string, number>();
    for (const projection of derived) for (const signature of directConfidenceSignatures(projection, projections)) {
      const row = `${signature}->${projection.confidence}`;
      confidenceSignatures.set(row, (confidenceSignatures.get(row) ?? 0) + 1);
    }
    const mixedPathProjections = derived.filter((projection) => {
      const paths = executionPaths(projection, producers, projections);
      return new Set(paths.map(pathKey)).size > 1;
    });
    const confidenceViolations = derived.flatMap((projection) => derivationMembers(projection).flatMap((member, memberIndex) => {
      const inputs = member.map((input) => projections.get(key(input))!.confidence);
      return violatesConfidence(projection.confidence, inputs)
        ? [{ id: projection.id, member: memberIndex, inputs: Object.freeze(inputs), output: projection.confidence }]
        : [];
    }));
    const transitiveConfidenceRepairs = derived.flatMap((projection) => {
      const required = requiredConfidence(projection, projections);
      return required === projection.confidence ? [] : [{ id: projection.id, current: projection.confidence, required }];
    });
    const dependencyAuthorityDrift = derived.flatMap((projection) => {
      const difference = dependencyAuthorityDifferences(projection);
      return difference === undefined ? [] : [difference];
    });
    const consumers = new Map(manifest.consumers.map((consumer) => [key(consumer), consumer]));
    const providerBackedBindings = manifest.bindings.flatMap((binding) => {
      const projection = projections.get(key(binding.projection))!;
      const paths = executionPaths(projection, producers, projections);
      if (!paths.some((path) => path.requirements.some((requirement) => requirement.endsWith(":provider")))) return [];
      const consumer = consumers.get(key(binding.consumer))!;
      return [{
        projection: projection.id,
        consumer: consumer.id,
        producerScalar: `${producerFor(projection, producers).availability}/${producerFor(projection, producers).latency}`,
        bindingLatency: `${binding.latency.mode}/${binding.latency.maxMs ?? "unbounded"}`,
        providerOff: consumer.providerOff,
        effectivePaths: paths.map(pathKey),
      }];
    });
    console.log(JSON.stringify({
      producers: manifest.producers.length,
      projections: manifest.projections.length,
      derivedProjections: derived.length,
      derivationMembers: derived.reduce((sum, projection) => sum + derivationMembers(projection).length, 0),
      executionPaths: derived.reduce((sum, projection) => sum + executionPaths(projection, producers, projections).length, 0),
      falseScalarAdvertisements: falseAdvertisements.map((row) => ({
        id: row.id,
        scalar: row.scalar,
        pathCount: row.paths.length,
        effectiveProfiles: [...new Set(row.paths.map((path) => path.slice(path.indexOf("=>") + 2)))].sort(),
      })),
      mixedPathProjections: mixedPathProjections.map((projection) => ({ id: projection.id, pathCount: executionPaths(projection, producers, projections).length })),
      dependencyAuthorityDrift: dependencyAuthorityDrift.map((row) => ({ id: row.id, declaredOnly: row.declaredOnly.length, derivedOnly: row.derivedOnly.length })),
      transitiveProviderBindings: providerBackedBindings
        .filter((row) => row.producerScalar === "local/sync")
        .map((row) => ({ projection: row.projection, consumer: row.consumer, providerOff: row.providerOff })),
      immediateConfidenceViolations: {
        members: confidenceViolations.length,
        projections: [...new Set(confidenceViolations.map((row) => row.id))].sort(),
      },
      transitiveConfidenceRepairs,
      confidenceSignatures: Object.fromEntries([...confidenceSignatures].sort()),
    }, null, 2));
    expect(falseAdvertisements.map((row) => row.id)).toEqual([
      "derived.compare.engine_trajectory",
      "derived.compare.eval_delta",
      "derived.grade.move_quality",
      "derived.opponent.candidate_feature_vector",
      "derived.story.eval_shift",
      "derived.story.last_level",
      "derived.story.rank",
      "derived.story.title",
    ]);
    expect(confidenceViolations).toHaveLength(49);
    expect(new Set(confidenceViolations.map((row) => row.id))).toEqual(new Set([
      "derived.opponent.candidate_feature_vector",
      "derived.story.last_level",
      "derived.story.rank",
    ]));
    expect(transitiveConfidenceRepairs).toEqual([
      { id: "derived.opponent.candidate_feature_vector", current: "not_applicable", required: "reported" },
      { id: "derived.story.last_level", current: "not_applicable", required: "reported" },
      { id: "derived.story.rank", current: "not_applicable", required: "reported" },
      { id: "derived.story.title", current: "not_applicable", required: "reported" },
    ]);
    expect(derived.reduce((sum, projection) => sum + executionPaths(projection, producers, projections).length, 0)).toBe(99);
    expect(dependencyAuthorityDrift).toHaveLength(14);
    expect(providerBackedBindings.filter((row) => row.producerScalar === "local/sync")).toHaveLength(10);
  });
});
