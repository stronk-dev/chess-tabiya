import { describe, expect, it, vi } from "vitest";
import * as routes from "./internal/evidence-value-routes.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST as MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceManifest, type BindingSourceAbsence, type CompiledEvidenceManifest, type EvidenceBinding, type LatencyMode, type ProjectionDeclaration, type VersionedEvidenceId } from "./evidence-contract.js";
import { aggregateEvidenceConsumerSourceAvailability as aggregate, compileEvidenceConsumerExecution as compile } from "./evidence-binding-execution.js";
import { compileEvidenceConsumerExecutionV2, assertEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "./evidence-execution-v2.js";
import { isImmutableOwnData } from "./internal/immutable-data.js";

const ref = (id: string, version = 1): VersionedEvidenceId => ({ id, version });
const consumer = ref("fixture.consumer");
const OPTIONAL = { necessity: "optional", whenNoPath: "omit_optional_item" } as const;
const EMPTY = { necessity: "required", whenNoPath: "honest_empty" } as const;
const UNAVAILABLE = { necessity: "required", whenNoPath: "operation_unavailable" } as const;
const source = MANIFEST.projections.find(row => row.id === "live.stockfish.position_eval")!;
const prototypeBinding = MANIFEST.bindings[0]!;
function local(id: string, derivation?: ProjectionDeclaration["derivation"]): ProjectionDeclaration {
  return { ...source, ...ref(id), producer: ref("fixture.local"), plane: "derived", payloadType: "FixtureDerived", dependsOn: [], ...(derivation === undefined ? {} : { derivation }) };
}
function binding(id: string, projection = source, policy?: BindingSourceAbsence, mode: LatencyMode = "interactive"): EvidenceBinding {
  return { ...prototypeBinding, adapter: ref(id), producer: projection.producer, projection: { id: projection.id, version: projection.version }, consumer, latency: { mode, maxMs: null }, ...(policy === undefined ? {} : { sourceAbsence: policy }) };
}
function fixture(bindings: readonly EvidenceBinding[], outputs: readonly ProjectionDeclaration[] = []): CompiledEvidenceManifest {
  return { ...MANIFEST,
    consumers: [{ ...MANIFEST.consumers[0]!, ...consumer,
      accepts: [...new Map(bindings.map(row => [`${row.projection.id}@${row.projection.version}`, row.projection])).values()] }], bindings,
    projections: [...MANIFEST.projections, ...outputs],
    producers: [...MANIFEST.producers, { id: "fixture.local", version: 1, plane: "derived", implementation: "fixture", availability: "local", latency: "sync", outputs }],
  };
}
function satisfied(compiled: ReturnType<typeof compile>, ids: readonly string[]) {
  return compiled.bindings.map(row => ({ adapter: row.binding.adapter, satisfiedPathIds: ids.includes(row.binding.adapter.id) ? [row.paths[0]!.pathId] : [] }));
}

describe("binding execution and source absence", () => {
  it("D4084 an accessor request cannot insert one consumer's plan under another consumer key", () => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const first = "authoring.predicate", second = "runtime.objective_condition";
    let spreading = false, alternate = false;
    const request = new Proxy({ id: first, version: 2 }, {
      ownKeys(target) { spreading = true; return Reflect.ownKeys(target); },
      get(target, property, receiver) {
        if (property === "id") return alternate ? second : first;
        if (property === "version" && spreading) alternate = true;
        return Reflect.get(target, property, receiver);
      },
    });
    const original = compileEvidenceConsumerExecutionV2(manifest, request);
    expect(original.consumer).toEqual({ id: first, version: 2 });
    const other = compileEvidenceConsumerExecutionV2(manifest, { id: second, version: 2 });
    expect(other.consumer).toEqual({ id: second, version: 2 });
    expect(other).not.toBe(original);
  });

  it("D4083 reuses a plan only for its exact immutable manifest and root", () => {
    const root = { id: "derived.structural.predicate_result", version: 2 };
    const original = compileProjectionExecutionV2(MANIFEST, root);
    for (let index = 0; index < 100; index++) expect(compileProjectionExecutionV2(MANIFEST, { ...root })).toBe(original);
    const other = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const equal = compileProjectionExecutionV2(other, root);
    expect(equal).not.toBe(original);
    expect(executionPlanDigest(equal)).toBe(executionPlanDigest(original));
    const changed = Object.freeze({ ...MANIFEST, projections: Object.freeze(MANIFEST.projections.map(row => row.id === root.id && row.version === root.version
      ? Object.freeze({ ...row, semantics: `${row.semantics} Mechanical alternate image.` }) : row)) });
    const different = compileProjectionExecutionV2(changed, root);
    expect(different).not.toBe(original);
    expect(executionPlanDigest(different)).not.toBe(executionPlanDigest(original));
    expect(() => executionPlanDigest({ ...original })).toThrow(/not issued/u);
  });

  it("D4083 keeps validating shallow-frozen mutable and accessor-backed manifests", () => {
    const root = { id: "derived.structural.predicate_result", version: 2 };
    const projections = [...MANIFEST.projections], shallow = Object.freeze({ ...MANIFEST, projections });
    compileProjectionExecutionV2(shallow, root);
    projections.push(projections[0]!);
    expect(() => compileProjectionExecutionV2(shallow, root)).toThrow(/duplicate declaration/u);
    let current = MANIFEST.projections;
    const accessor = Object.freeze({ ...MANIFEST, get projections() { return current; } });
    compileProjectionExecutionV2(accessor, root);
    current = [...current, current[0]!];
    expect(() => compileProjectionExecutionV2(accessor, root)).toThrow(/duplicate declaration/u);
    const cycle: { self?: unknown } = {}; cycle.self = cycle; Object.freeze(cycle);
    for (const unstable of [shallow, accessor, Object.freeze([,]), Object.freeze({ fn: () => 1 }), Object.freeze(new Map()), cycle]) expect(isImmutableOwnData(unstable)).toBe(false);
  });

  it("D4083 rechecks a cached projection's live reduction binding before returning it", () => {
    const root = { id: "derived.structural.predicate_result", version: 2 };
    const original = compileProjectionExecutionV2(MANIFEST, root), inspect = routes.inspectEvidenceReductionBinding;
    const crossed = vi.spyOn(routes, "inspectEvidenceReductionBinding").mockImplementation(operation => ({ ...inspect(operation) }));
    try { expect(() => compileProjectionExecutionV2(MANIFEST, root)).toThrow(/binding changed/u); }
    finally { crossed.mockRestore(); }
    expect(compileProjectionExecutionV2(MANIFEST, root)).toBe(original);
  });

  it("D4083 snapshots a requested root once so an accessor cannot poison another root's cache", () => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const first = "rules.castling.reading.rights", second = "rules.castling.reading.legality";
    let reads = 0;
    const original = compileProjectionExecutionV2(manifest, { get id() { return ++reads === 1 ? first : second; }, version: 1 });
    expect(reads).toBe(1);
    expect(original).toMatchObject({ kind: "fixed", execution: { projection: ref(first) } });
    expect(compileProjectionExecutionV2(manifest, ref(first))).toBe(original);
    expect(compileProjectionExecutionV2(manifest, ref(second))).toMatchObject({ kind: "fixed", execution: { projection: ref(second) } });
    expect(() => compileProjectionExecutionV2(manifest, { id: first, version: Number.NaN })).toThrow(/invalid projection reference/u);
  });

  it("rechecks live reduction callables even for the cached exact immutable consumer", () => {
    const consumer = { id: "module.review_map", version: 2 };
    const original = compileEvidenceConsumerExecutionV2(MANIFEST, consumer), inspect = routes.inspectEvidenceReductionBinding;
    const crossed = vi.spyOn(routes, "inspectEvidenceReductionBinding").mockImplementation(operation => ({ ...inspect(operation) }));
    try { expect(() => compileEvidenceConsumerExecutionV2(MANIFEST, consumer)).toThrow(/binding changed/u); }
    finally { crossed.mockRestore(); }
    expect(compileEvidenceConsumerExecutionV2(MANIFEST, consumer)).toBe(original);
  });
  it("reuses only complete immutable consumer images, never mutable or crossed manifests", () => {
    const ref = { id: "module.review_map", version: 2 };
    const original = compileEvidenceConsumerExecutionV2(MANIFEST, ref);
    expect(compileEvidenceConsumerExecutionV2(MANIFEST, { ...ref })).toBe(original);
    const mutable = { ...MANIFEST, bindings: [...MANIFEST.bindings] };
    expect(compileEvidenceConsumerExecutionV2(mutable, ref)).not.toBe(original);
    const shallow = Object.freeze(mutable);
    compileEvidenceConsumerExecutionV2(shallow, ref);
    mutable.bindings.splice(mutable.bindings.findIndex(row => row.consumer.id === ref.id && row.consumer.version === ref.version), 1);
    expect(() => compileEvidenceConsumerExecutionV2(shallow, ref)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });
  it("keeps a complete reduction plan and exact binding policies without inventing realized paths", () => {
    const comparison = MANIFEST.projections.find(row => row.id === "derived.compare.structure_delta" && row.version === 2)!;
    const row = binding("fixture.comparison", comparison, UNAVAILABLE, "sync"), manifest = fixture([row]);
    const compiled = compileEvidenceConsumerExecutionV2(manifest, consumer);
    expect(compiled.bindings).toHaveLength(1);
    expect(compiled.bindings[0]).toMatchObject({ binding: row, sourceAbsence: UNAVAILABLE, plan: { kind: "reduction", sourceUse: "captured_only" } });
    expect(compiled.bindings[0]).not.toHaveProperty("paths");
    expect(() => assertEvidenceConsumerExecutionV2(compiled)).not.toThrow();
    expect(() => assertEvidenceConsumerExecutionV2({ ...compiled })).toThrow();
    expect(() => compile(manifest, consumer)).toThrow(/V2/);
    expect(() => compileEvidenceConsumerExecutionV2(fixture([binding("fixture.missing_policy", comparison)]), consumer)).toThrow(/BINDING_SOURCE_ABSENCE/);
    expect(() => compileEvidenceConsumerExecutionV2({ ...manifest, bindings: [] }, consumer)).toThrow(/BINDING_EXECUTION_UNDECLARED/);
    expect(() => compileEvidenceConsumerExecutionV2({ ...manifest, bindings: [row, { ...row }] }, consumer)).toThrow(/duplicate adapter/);
    const missingElement = { ...manifest, projections: manifest.projections.filter(projection => projection.id !== "run.record.position") };
    expect(() => compileEvidenceConsumerExecutionV2(missingElement, consumer)).toThrow(/missing/);
    const crossed = { ...manifest, bindings: [{ ...row, producer: ref("foreign") }] };
    expect(() => compileEvidenceConsumerExecutionV2(crossed, consumer)).toThrow(/exact admitted adapter/);
  });
  it("refuses a missing accepted binding even when the semantic manifest still compiles", () => {
    const theory = ref("module.theory_breadcrumb", 2);
    const declarations = { ...EVIDENCE_CONTRACT_DECLARATIONS,
      adapters: EVIDENCE_CONTRACT_DECLARATIONS.adapters.filter(row =>
        !(row.consumer.id === theory.id && row.consumer.version === theory.version && row.projection.id === "theory.shapes.firing")),
    };
    const incomplete = compileEvidenceManifest(declarations);
    expect(incomplete.consumers.find(row => row.id === theory.id)!.accepts).toHaveLength(4);
    expect(incomplete.bindings.filter(row => row.consumer.id === theory.id)).toHaveLength(3);
    expect(() => compile(incomplete, theory)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });

  it("refuses an Inspector execution plan missing declared source bindings", () => {
    const inspector = { id: "module.full_inspector", version: 2 };
    const retired = ["live.stockfish.eval@1", "live.stockfish.wdl@1", "live.stockfish.pv@1",
      "human.maia.policy@1", "human.maia.candidate_wdl@1", "human.explorer.population@1",
      "live.syzygy.result@1", "live.syzygy.category@1", "live.syzygy.distance@1",
      "derived.pivotal.human_divergence@1", "derived.compare.eval_delta@1", "derived.story.rank@2",
      "rules.structural.event.backward_pawn@1", "rules.structural.event.king_opposition@1", "rules.structural.event.pawn_islands@1",
      "rules.structural.event.doubled_pawn@1", "rules.structural.event.isolated_pawn@1", "rules.structural.event.open_file@1", "rules.structural.event.half_open_file@1", "rules.structural.event.line_blockers@1"];
    const current = MANIFEST.consumers.find(row => row.id === inspector.id)!;
    expect(current.version).toBe(2);
    expect(current.accepts).toHaveLength(104);
    for (const old of retired) expect(current.accepts.map(row => `${row.id}@${row.version}`)).not.toContain(old);
    const failed = new Set(["recorded.inspector.eval_packet@1", "recorded.inspector.wdl_packet@1", "recorded.inspector.pv_packet@1",
      "derived.maia.node_distribution@1", "derived.maia.node_candidate_wdl@1", "derived.explorer.inspector_population@1",
      "recorded.inspector.tablebase_packet@1", "derived.inspector.tablebase_category@1", "derived.inspector.tablebase_distance@1",
      "derived.pivotal.human_divergence@2", "derived.compare.eval_delta@2", "derived.story.rank@3"]);
    const bindings = MANIFEST.bindings.filter(row => row.consumer.id !== inspector.id || !failed.has(`${row.projection.id}@${row.projection.version}`));
    expect(bindings.filter(row => row.consumer.id === inspector.id)).toHaveLength(current.accepts.length - failed.size);
    expect(() => compileEvidenceConsumerExecutionV2({ ...MANIFEST, bindings }, inspector)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
    const compiled = compileEvidenceConsumerExecutionV2(MANIFEST, inspector);
    expect(compiled.bindings).toHaveLength(104);
    for (const exposure of ["derived.tactic.defender_exposure@2", "derived.inspector.detail.defender_exposure@1"]) {
      const withoutExposure = MANIFEST.bindings.filter(row =>
        row.consumer.id !== inspector.id || `${row.projection.id}@${row.projection.version}` !== exposure);
      expect(withoutExposure).toHaveLength(MANIFEST.bindings.length - 1);
      expect(() => compileEvidenceConsumerExecutionV2({ ...MANIFEST, bindings: withoutExposure }, inspector))
        .toThrow(/BINDING_EXECUTION_UNDECLARED/u);
    }
    expect(() => compile(MANIFEST, inspector)).toThrow(/V2/u);
    expect(() => compileEvidenceConsumerExecutionV2(MANIFEST, ref("module.full_inspector"))).toThrow();
  });

  it("refuses an extra projection outside the exact accepted image", () => {
    const theory = ref("module.theory_breadcrumb", 2);
    const original = MANIFEST.bindings.find(row => row.consumer.id === theory.id)!;
    const projection = ref("rules.mobility.reading.legal_moves");
    const extra = { ...original, adapter: ref("fixture.extra"), projection };
    expect(() => compile({ ...MANIFEST, bindings: [...MANIFEST.bindings, extra] }, theory)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });

  it("refuses duplicate exact consumer declarations", () => {
    const theory = ref("module.theory_breadcrumb", 2);
    const declaration = MANIFEST.consumers.find(row => row.id === theory.id)!;
    expect(() => compile({ ...MANIFEST, consumers: [...MANIFEST.consumers, declaration] }, theory)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });

  it("refuses duplicate accepted refs instead of silently collapsing the declaration", () => {
    const theory = ref("module.theory_breadcrumb", 2);
    const declaration = MANIFEST.consumers.find(row => row.id === theory.id)!;
    const consumers = MANIFEST.consumers.map(row => row === declaration ? { ...row, accepts: [...row.accepts, row.accepts[0]!] } : row);
    expect(() => compile({ ...MANIFEST, consumers }, theory)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });

  it("preserves every declared adapter when two valid adapters serve the same accepted projection", () => {
    const theory = ref("module.theory_breadcrumb", 2);
    const original = MANIFEST.bindings.find(row => row.consumer.id === theory.id && row.projection.id === "theory.shapes.firing")!;
    const extra = { ...original, adapter: ref("fixture.second_form") };
    const compiled = compile({ ...MANIFEST, bindings: [...MANIFEST.bindings, extra] }, theory);
    expect(compiled.bindings).toHaveLength(5);
    expect(compiled.bindings.filter(row => row.binding.projection.id === "theory.shapes.firing")).toHaveLength(2);
  });

  it("does not substitute an old-version binding for a missing successor binding", () => {
    const successor = { id: "opponent.selection", version: 2 };
    const bindings = MANIFEST.bindings.filter(row => !(row.consumer.id === successor.id && row.consumer.version === successor.version));
    expect(bindings.some(row => row.consumer.id === successor.id && row.consumer.version === 1)).toBe(true);
    expect(() => compile({ ...MANIFEST, bindings }, successor)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });

  it("compiles the complete production Theory consumer with optional source policies", () => {
    const theory = compile(MANIFEST, ref("module.theory_breadcrumb", 2));
    expect(theory.bindings.map(row => `${row.binding.projection.id}@${row.binding.projection.version}`).sort()).toEqual([
      "derived.explorer.population_summary@1", "pack.authored.claim@1",
      "theory.opening.current_endpoint@1", "theory.shapes.firing@3",
    ]);
    for (const row of theory.bindings) expect(row.sourceAbsence).toEqual(OPTIONAL);
    const unavailable = aggregate(theory, satisfied(theory, []));
    expect(unavailable.state).toBe("available");
    expect(unavailable.missingRequiredBindings).toEqual([]);
    expect(unavailable.omittedOptionalBindings.map(adapter => theory.bindings.find(row => row.binding.adapter.id === adapter.id)!.binding.projection.id).sort()).toEqual([
      "derived.explorer.population_summary", "pack.authored.claim",
    ]);
    // A successful page does not create a recorded authored claim. Local theory remains usable.
    const provider = theory.bindings.find(row => row.binding.projection.id === "derived.explorer.population_summary")!;
    const success = aggregate(theory, satisfied(theory, [provider.binding.adapter.id]));
    expect(success.state).toBe("available");
    expect(success.omittedOptionalBindings).toHaveLength(1);
    expect(provider.paths[0]!.sourceRequirements[0]!.providerOperation).toBe("lichess_explorer.position_page@1");
  });

  it("refuses a missing or crossed Theory provider policy even alongside local theory", () => {
    const bindings = MANIFEST.bindings.map(row => {
      if (row.consumer.id !== "module.theory_breadcrumb" || row.projection.id !== "derived.explorer.population_summary") return row;
      const { sourceAbsence: _policy, ...withoutPolicy } = row;
      return withoutPolicy;
    });
    expect(() => compile({ ...MANIFEST, bindings }, ref("module.theory_breadcrumb", 2))).toThrow(/BINDING_SOURCE_ABSENCE/u);
    const crossed = bindings.map(row => row.consumer.id === "module.theory_breadcrumb" && row.projection.id === "derived.explorer.population_summary"
      ? { ...row, sourceAbsence: { necessity: "optional", whenNoPath: "operation_unavailable" } as unknown as BindingSourceAbsence } : row);
    expect(() => compile({ ...MANIFEST, bindings: crossed }, ref("module.theory_breadcrumb", 2))).toThrow(/BINDING_SOURCE_ABSENCE/u);
  });

  it.each([OPTIONAL, EMPTY, UNAVAILABLE])("compiles each literal absence arm: $whenNoPath", policy => {
    const result = compile(fixture([binding("fixture.a", source, policy)]), consumer);
    expect(result.bindings[0]!.sourceAbsence).toEqual(policy);
    expect(result.bindings[0]!.paths[0]!.sourceRequirements[0]!.providerOperation).toBe("stockfish.position_evaluation@1");
    expect(Object.isFrozen(result.bindings[0]!.binding)).toBe(true);
    expect(Object.isFrozen(result.bindings[0]!.sourceAbsence)).toBe(true);
  });

  it("requires policy at the transitive boundary, not just a provider's own binding", () => {
    const summary = MANIFEST.projections.find(row => row.id === "derived.explorer.population_summary")!;
    expect(() => compile(fixture([binding("fixture.summary", summary)]), consumer)).toThrow(/BINDING_SOURCE_ABSENCE/u);
    const result = compile(fixture([binding("fixture.summary", summary, OPTIONAL)]), consumer);
    expect(result.bindings[0]!.paths[0]!.sourceRequirements[0]!.providerOperation).toBe("lichess_explorer.position_page@1");
  });

  it("does not use consumer providerOff as an absence declaration", () => {
    for (const providerOff of ["available", "honest_empty", "unavailable"] as const) {
      const manifest = fixture([binding("fixture.a")]);
      expect(() => compile({ ...manifest, consumers: [{ ...manifest.consumers[0]!, providerOff }] }, consumer)).toThrow(/BINDING_SOURCE_ABSENCE/u);
    }
  });

  it.each([
    null, {}, { necessity: "optional", whenNoPath: "honest_empty" },
    { necessity: "required", whenNoPath: "omit_optional_item" },
    { necessity: "required", whenNoPath: "available" },
    { ...OPTIONAL, fallback: "available" },
  ])("refuses malformed/crossed absence vocabulary %j", invalid => {
    expect(() => compile(fixture([{ ...binding("fixture.a"), sourceAbsence: invalid as BindingSourceAbsence }]), consumer)).toThrow(/BINDING_SOURCE_ABSENCE/u);
  });

  it("refuses a sync binding that cannot execute its provider path", () => {
    expect(() => compile(fixture([binding("fixture.a", source, OPTIONAL, "sync")]), consumer)).toThrow(/BINDING_EXECUTION_LATENCY/u);
  });
  it("admits only paths that fit the binding's latency without widening its consumer", () => {
    const fast = local("fixture.fast");
    const alternatives = local("fixture.alternatives", { anyOf: [[ref(fast.id)], [ref(source.id)]] });
    const compiled = compile(fixture([binding("fixture.a", alternatives, OPTIONAL, "sync")], [fast, alternatives]), consumer);
    expect(compiled.bindings[0]!.paths).toHaveLength(1);
    expect(compiled.bindings[0]!.paths[0]!.effectiveLatency).toBe("sync");
    // Even an excluded provider alternative requires literal policy; no implicit fallback.
    expect(() => compile(fixture([binding("fixture.a", alternatives, undefined, "sync")], [fast, alternatives]), consumer)).toThrow(/BINDING_SOURCE_ABSENCE/u);
    expect(aggregate(compiled, satisfied(compiled, [])).state).toBe("available");
  });
  it("retains a recorded alternative and does not poison it with failed provider acquisition", () => {
    const alternatives = local("fixture.recorded_or_live", { anyOf: [[ref("run.record.edge")], [ref(source.id)]] });
    const compiled = compile(fixture([binding("fixture.a", alternatives, EMPTY)], [alternatives]), consumer);
    const recorded = compiled.bindings[0]!.paths.find(path => path.sourceRequirements[0]!.availability === "recorded")!;
    expect(aggregate(compiled, [{ adapter: ref("fixture.a"), satisfiedPathIds: [recorded.pathId] }]).state).toBe("available");
  });
  it("does not conceal raw legacy operands or return a partial consumer image", () => {
    const legacy = MANIFEST.projections.find(row => row.id === "human.maia.uci_response")!;
    expect(() => compile(fixture([binding("fixture.a", source, OPTIONAL), binding("fixture.legacy", legacy, OPTIONAL)]), consumer)).toThrow(/EXECUTION_SOURCE_UNREGISTERED/u);
  });
  it("refuses unknown consumers and duplicated adapter identities", () => {
    const manifest = fixture([binding("fixture.a", source, OPTIONAL)]);
    expect(() => compile(manifest, ref("fixture.other"))).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
    expect(() => compile({ ...manifest, bindings: [] }, consumer)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
    expect(() => compile({ ...manifest, bindings: [...manifest.bindings, ...manifest.bindings] }, consumer)).toThrow(/BINDING_EXECUTION_UNDECLARED/u);
  });
  it("snapshots policy so caller mutation cannot change the result", () => {
    const policy: { necessity: "required"; whenNoPath: "honest_empty" | "operation_unavailable" } = { ...EMPTY };
    const compiled = compile(fixture([binding("fixture.a", source, policy)]), consumer);
    policy.whenNoPath = "operation_unavailable";
    expect(aggregate(compiled, satisfied(compiled, [])).state).toBe("honest_empty");
    expect(() => aggregate({ ...compiled }, satisfied(compiled, []))).toThrow(/BINDING_AVAILABILITY_CROSSED/u);
  });

  it("aggregates the complete 3-binding satisfaction truth table with fixed precedence", () => {
    const fast = local("fixture.fast");
    for (let mask = 0; mask < 8; mask += 1) {
      for (const reverse of [false, true]) {
        const bindings = [binding("fixture.optional", source, OPTIONAL), binding("fixture.empty", source, EMPTY), binding("fixture.unavailable", source, UNAVAILABLE), binding("fixture.local", fast)];
        const compiled = compile(fixture(reverse ? bindings.reverse() : bindings, [fast]), consumer);
        const ids = ["fixture.optional", "fixture.empty", "fixture.unavailable"].filter((_, index) => Boolean(mask & (1 << index)));
        const result = aggregate(compiled, satisfied(compiled, ids));
        const state = !(mask & 4) ? "unavailable" : !(mask & 2) ? "honest_empty" : "available";
        expect(result.state).toBe(state);
        expect(result.providerOff).toBe(state);
        expect(result.omittedOptionalBindings).toEqual(mask & 1 ? [] : [ref("fixture.optional")]);
        expect(result.missingRequiredBindings).toEqual([...(mask & 2 ? [] : [ref("fixture.empty")]), ...(mask & 4 ? [] : [ref("fixture.unavailable")])]);
      }
    }
  });
  it("rejects missing, extra, duplicate, crossed and unadmitted path results", () => {
    const compiled = compile(fixture([binding("fixture.a", source, OPTIONAL)]), consumer);
    const good = satisfied(compiled, ["fixture.a"]);
    const other = compile(fixture([binding("fixture.a", MANIFEST.projections.find(row => row.id === "human.maia.policy_page")!, OPTIONAL)]), consumer);
    for (const rows of [[], [...good, ...good], [{ ...good[0]!, adapter: ref("fixture.other") }], [{ ...good[0]!, satisfiedPathIds: [...good[0]!.satisfiedPathIds, ...good[0]!.satisfiedPathIds] }], [{ ...good[0]!, satisfiedPathIds: [other.bindings[0]!.paths[0]!.pathId] }]]) {
      expect(() => aggregate(compiled, rows)).toThrow(/BINDING_AVAILABILITY_CROSSED/u);
    }
  });
  it("refuses missing recorded-only evidence without inventing a fallback policy", () => {
    const recorded = MANIFEST.projections.find(row => row.id === "run.record.edge")!;
    const compiled = compile(fixture([binding("fixture.a", recorded)]), consumer);
    expect(() => aggregate(compiled, satisfied(compiled, []))).toThrow(/BINDING_SOURCE_ABSENCE/u);
    expect(aggregate(compiled, satisfied(compiled, ["fixture.a"])).state).toBe("available");
  });

  it("the semantic compiler retains explicit policy in the binding and its digest", () => {
    const { disposition: _projectionDisposition, ...unbound } = local("fixture.local_output");
    const output = { ...unbound, plane: "rules" as const, grounding: "position_rules" as const, exactness: "exact" as const, confidence: "not_applicable" as const };
    const base = fixture([binding("fixture.a", output)], [output]);
    const declaredAdapter = { ...base.bindings[0]!, ...ref("fixture.a"), implementation: "fixture", forms: output.forms, answerContent: output.answerContent };
    const { disposition: _consumerDisposition, ...fixtureConsumer } = base.consumers[0]!;
    const declarations = { producers: [{ ...base.producers.at(-1)!, plane: "rules" as const }], consumers: [{ ...fixtureConsumer, timing: declaredAdapter.timing, roles: declaredAdapter.roles, sessions: declaredAdapter.sessions, latency: declaredAdapter.latency, budget: declaredAdapter.budget, accepts: [ref(output.id)], forms: output.forms, answerContent: output.answerContent }], adapters: [declaredAdapter] };
    const plain = compileEvidenceManifest(declarations);
    const explicit = compileEvidenceManifest({ ...declarations, adapters: [{ ...declarations.adapters[0]!, sourceAbsence: OPTIONAL }] });
    expect(plain.bindings[0]!.sourceAbsence).toBeUndefined();
    expect(explicit.bindings[0]!.sourceAbsence).toEqual(OPTIONAL);
    expect(explicit.digest).not.toBe(plain.digest);
    expect(Object.isFrozen(explicit.bindings[0]!.sourceAbsence)).toBe(true);
    expect(() => compileEvidenceManifest({ ...declarations, adapters: [{ ...declarations.adapters[0]!, sourceAbsence: { ...OPTIONAL, whenNoPath: "honest_empty" } as unknown as BindingSourceAbsence }] })).toThrow(/EVIDENCE_PROVIDER_FALLBACK_MISSING/u);
  });
});
