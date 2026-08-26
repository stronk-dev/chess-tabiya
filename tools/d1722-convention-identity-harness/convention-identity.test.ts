// DISPOSABLE research harness — D1722. Not production code.
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  PRIMARY_EVIDENCE_MANIFEST,
  compileEvidenceManifest,
  type EvidenceContractDeclarations,
  type ProjectionDeclaration,
} from "@chess-tabiya/runtime";

const IDENTITY_OPERAND = /(?:^|[._-])(?:convention(?:id|version)?|[a-z]+convention(?:id|version)?|passconvention)(?:$|[._-])/iu;
const VERSIONED_PROSE = /\b[a-z][a-z0-9_-]*@v?\d+\b/iu;

interface Row {
  readonly projection: string;
  readonly producer: string;
  readonly role: string;
  readonly identityOperands: readonly string[];
  readonly versionedSemantics: boolean;
  readonly semantics: string;
  readonly limitations: readonly string[];
  readonly derivationMembers: readonly (readonly string[])[];
  readonly consumers: readonly string[];
}

function ref(value: { readonly id: string; readonly version: number }): string {
  return `${value.id}@${value.version}`;
}

function rows(): readonly Row[] {
  const consumersByProjection = new Map<string, string[]>();
  for (const binding of PRIMARY_EVIDENCE_MANIFEST.bindings) {
    const projection = ref(binding.projection);
    const consumers = consumersByProjection.get(projection) ?? [];
    consumers.push(ref(binding.consumer));
    consumersByProjection.set(projection, consumers);
  }
  return Object.freeze(PRIMARY_EVIDENCE_MANIFEST.projections
    .filter((projection) => projection.grounding === "declared_convention")
    .map((projection) => Object.freeze({
      projection: `${projection.id}@${projection.version}`,
      producer: `${projection.producer.id}@${projection.producer.version}`,
      role: projection.role,
      identityOperands: Object.freeze(projection.operands.filter((operand) => IDENTITY_OPERAND.test(operand))),
      versionedSemantics: VERSIONED_PROSE.test(`${projection.semantics} ${projection.limitations.join(" ")}`),
      semantics: projection.semantics,
      limitations: projection.limitations,
      derivationMembers: Object.freeze(projection.derivation === undefined
        ? []
        : "inputs" in projection.derivation
          ? [Object.freeze(projection.derivation.inputs!.map(ref))]
          : projection.derivation.anyOf.map((member) => Object.freeze(member.map(ref)))),
      consumers: Object.freeze([...(consumersByProjection.get(ref(projection)) ?? [])].sort()),
    }))
    .sort((left, right) => left.projection.localeCompare(right.projection)));
}

function conventionDependentKeys(): ReadonlySet<string> {
  const projections = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [ref(projection), projection]));
  const declaredFamilies = new Set(PRIMARY_EVIDENCE_MANIFEST.projections
    .filter((projection) => projection.grounding === "declared_convention")
    .map((projection) => `${ref(projection.producer)}:${projection.id.split(".").at(-1)}`));
  const candidates = PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => (
    projection.grounding === "declared_convention"
      || projection.operands.some((operand) => IDENTITY_OPERAND.test(operand))
      || VERSIONED_PROSE.test(`${projection.semantics} ${projection.limitations.join(" ")}`)
      || declaredFamilies.has(`${ref(projection.producer)}:${projection.id.split(".").at(-1)}`)
  ));
  const values = new Set(candidates.map(ref));
  let changed = true;
  while (changed) {
    changed = false;
    for (const projection of projections.values()) {
      if (values.has(ref(projection)) || projection.derivation === undefined) continue;
      const members = "inputs" in projection.derivation ? [projection.derivation.inputs!] : projection.derivation.anyOf;
      if (!members.some((member) => member.some((input) => values.has(ref(input))))) continue;
      values.add(ref(projection));
      changed = true;
    }
  }
  return values;
}

function conventionDependentsWithOtherGrounding(): readonly string[] {
  const conventionDependent = conventionDependentKeys();
  return Object.freeze(PRIMARY_EVIDENCE_MANIFEST.projections
    .filter((projection) => conventionDependent.has(ref(projection)) && projection.grounding !== "declared_convention")
    .map((projection) => `${ref(projection)}:${projection.grounding}/${projection.exactness}`)
    .sort());
}

function withProjection(
  id: string,
  update: (projection: ProjectionDeclaration) => ProjectionDeclaration,
): EvidenceContractDeclarations {
  return Object.freeze({
    ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: Object.freeze(EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => Object.freeze({
      ...producer,
      outputs: Object.freeze(producer.outputs.map((projection) => projection.id === id ? update(projection) : projection)),
    }))),
  });
}

describe("D1722 declared-convention identity closure", () => {
  it("derives a unique, non-empty population from the compiled manifest", () => {
    const values = rows();
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values.map((value) => value.projection)).size).toBe(values.length);
  });

  it("keeps the two source-semantic falsifiers visible", () => {
    const byProjection = new Map(rows().map((row) => [row.projection, row]));
    for (const projection of [
      "rules.structural.event.backward_pawn@1",
      "rules.structural.event.king_opposition@1",
    ]) {
      const row = byProjection.get(projection);
      expect(row).toBeDefined();
      expect(row?.identityOperands).toEqual([]);
      expect(row?.versionedSemantics).toBe(false);
    }
  });

  it("pins the measured convention-identity and consumer-reach census", () => {
    const values = rows();
    expect(values).toHaveLength(42);
    expect(values.filter((value) => value.identityOperands.length > 0)).toHaveLength(10);
    expect(values.filter((value) => value.identityOperands.length === 0 && value.versionedSemantics)).toHaveLength(16);
    expect(values.filter((value) => value.identityOperands.length === 0 && !value.versionedSemantics)).toHaveLength(16);
    expect(values.filter((value) => value.consumers.length > 0)).toHaveLength(27);
    expect(values.filter((value) => value.consumers.some((consumer) => consumer.startsWith("guidance.voice")))).toHaveLength(2);
  });

  it("shows the compiler accepts an in-place convention meaning change", () => {
    const declarations = withProjection("rules.structural.event.backward_pawn", (projection) => Object.freeze({
      ...projection,
      semantics: "Meaning changed in place without a convention reference.",
    }));
    expect(() => compileEvidenceManifest(declarations)).not.toThrow();
  });

  it("keeps convention-dependent projections with another grounding visible", () => {
    const values = conventionDependentsWithOtherGrounding();
    expect(values).toHaveLength(18);
    expect(values.filter((value) => value.startsWith("derived."))).toHaveLength(6);
    expect(values).toContain("rules.structural.predicate.backward_pawn@1:position_rules/exact");
    expect(values).toContain("rules.structural.reading.backward_pawn@1:position_rules/exact");
    expect(values).toContain("rules.structural.predicate.king_opposition@1:position_rules/exact");
    expect(values).toContain("rules.structural.reading.king_opposition@1:position_rules/exact");
  });

  it("shows the scalar grounding rule refuses an honest convention on a single-grounding derivation", () => {
    const declarations = withProjection("derived.tactic.square_clearance_observed", (projection) => Object.freeze({
      ...projection,
      grounding: "declared_convention" as const,
      exactness: "convention" as const,
    }));
    expect(() => compileEvidenceManifest(declarations)).toThrowError(expect.objectContaining({ code: "EVIDENCE_DERIVATION_WIDENS" }));
  });

  it("prints the exact derived table when explicitly requested", () => {
    if (process.env.D1722_PRINT !== "1") return;
    const values = rows();
    const classes = {
      operandIdentity: values.filter((value) => value.identityOperands.length > 0).length,
      proseIdentityOnly: values.filter((value) => value.identityOperands.length === 0 && value.versionedSemantics).length,
      noIdentity: values.filter((value) => value.identityOperands.length === 0 && !value.versionedSemantics).length,
    };
    const bound = values.filter((value) => value.consumers.length > 0);
    const providerBound = values.filter((value) => value.consumers.some((consumer) => consumer.startsWith("guidance.voice")));
    console.log(JSON.stringify({
      total: values.length,
      classes,
      bound: { anyConsumer: bound.length, providerConsumer: providerBound.length },
      providerBound: providerBound.map((value) => ({ projection: value.projection, consumers: value.consumers.filter((consumer) => consumer.startsWith("guidance.voice")) })),
      conventionDependentsWithOtherGrounding: conventionDependentsWithOtherGrounding(),
      projections: {
        operandIdentity: values.filter((value) => value.identityOperands.length > 0).map((value) => value.projection),
        proseIdentityOnly: values.filter((value) => value.identityOperands.length === 0 && value.versionedSemantics).map((value) => value.projection),
        noIdentity: values.filter((value) => value.identityOperands.length === 0 && !value.versionedSemantics).map((value) => ({ projection: value.projection, derivationMembers: value.derivationMembers })),
      },
    }, null, 2));
  });
});
