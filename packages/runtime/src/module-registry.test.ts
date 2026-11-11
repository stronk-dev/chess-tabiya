// rfc/module-registration.md acceptance criteria that the production registry landing can make
// able-to-fail today (A1–A4, A6, A19/D921, A21, A26), plus the two production consumers.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { presentationAdapter } from "./presentation-contract.js";
import * as consumerOperations from "./evidence-consumer-operations.js";
import { compileModulePacket } from "./module-packets.js";
import { moduleQueryProjections } from "./module-query.js";
import { INSPECTOR_SOURCE_TOPICS, INSPECTOR_DETAIL_SOURCES } from "./inspector-source-topics.js";
import { SUBJECT_OUTCOME_FAMILIES } from "./semantic-subject-types.js";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  MODULE_CONSUMER_ACCEPTS,
  MODULE_CURRENT_IMAGE,
  MODULE_SUCCESSOR_REBASE,
  PRIMARY_EVIDENCE_MANIFEST,
  RECORDED_PATH_SUCCESSOR_REFS,
  currentRecordedModuleRefs,
  SEMANTIC_EVENT_PROJECTION_REFS,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  WAVE_C_MODULE_PROJECTION_REFS,
} from "./evidence-catalog.js";
import { assertEvidenceConsumerOperations, compileEvidenceManifest, EvidenceManifestError, type EvidenceConsumerOperation, type VersionedEvidenceId } from "./evidence-contract.js";
import { MODULE_ANSWER_CAPABILITY_IMAGE, MODULE_IDS, ModuleContractError, compileModuleRegistry, type ModuleDeclaration } from "./module-contract.js";
import { MODULE_POLICIES, moduleEvidenceRole, moduleSessions } from "./module-policy.js";
import { HINT_DISCLOSURE_PROJECTION_IDS, HINT_HORIZON_PROJECTION_IDS, hintDeclarationRow, hintDisclosureIdentity } from "./hint-registry.js";
import {
  GUIDED_HINT_DISCLOSURE,
  MODULE_AWAITING,
  MODULE_COVERAGE_REFUSALS,
  MODULE_DECLARATIONS,
  MODULE_OPERATIONS,
  MODULE_PAIR_EXECUTION,
  MODULE_REGISTRY,
  MODULE_UPSTREAM_DISCHARGES,
  ModuleRegistryInvariantError,
  ONE_EDGE_EVENT_REFS,
  assertModuleRegistry,
  moduleEvidenceClosure,
} from "./module-registry.js";
import { WORKFLOW_CONTEXT_POLICIES } from "./presets.js";

const ROOT = new URL("../../../", import.meta.url);
const key = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;
const accepted = (module: ModuleDeclaration): readonly string[] => module.accepts.kind === "manifest" ? module.accepts.projections.map((value) => key(value.projection)) : [];
const pairs = MODULE_REGISTRY.modules.flatMap((module) => accepted(module).map((projection) => `${module.id}\u0000${projection}`));
const replace = (id: string, change: (module: ModuleDeclaration) => ModuleDeclaration) => MODULE_DECLARATIONS.map((module) => module.id === id ? change(module) : module);

describe("module registration — the compiled production registry", () => {
  it("D4095 refuses an unmapped or replaced Structure acceptance image and crossed policy", () => {
    const current = MODULE_DECLARATIONS.find(row => row.id === "structure_nudge")!;
    if (current.accepts.kind !== "manifest") throw Error("Actual Structure image unavailable");
    const image = current.accepts;
    for (const projections of [image.projections.slice(1),
      [...image.projections, { projection: { id: "rules.structural.reading.isolated_pawn", version: 1 } }],
      image.projections.map((row, i) => i === 0 ? { ...row, projection: { ...row.projection, version: row.projection.version + 1 } } : row),
    ]) expect(() => assertModuleRegistry({ declarations: replace("structure_nudge", module => ({ ...module, accepts: { ...image, projections } })) })).toThrow(/seven-ref mapping/u);
    expect(() => assertModuleRegistry({ declarations: replace("structure_nudge", module => ({ ...module,
      selection: { ...module.selection, policy: { id: "production.module_local", version: 1 } } })) })).toThrow(/exact current consumer, policy/u);
  });
  it("D3902 registers all nine runtime-owned tuples with the shared compiler, leaving Full2 to its sole server operation", () => {
    const registered = Reflect.get(consumerOperations, "MODULE_EVIDENCE_CONSUMER_OPERATIONS") as readonly EvidenceConsumerOperation[] | undefined;
    expect(registered).toBeDefined();
    const runtimeImage = MODULE_CURRENT_IMAGE.filter(row => row.moduleId !== "full_inspector");
    expect(runtimeImage).toHaveLength(9);
    expect(registered!.map(row => row.consumer)).toEqual(runtimeImage.map(row => row.consumer));
    expect(registered!.every(row => row.operation === compileModulePacket)).toBe(true);
    expect(registered!.some(row => row.consumer.id === "module.full_inspector")).toBe(false);
    const ids = runtimeImage.map(row => row.consumer.id);
    expect(() => assertEvidenceConsumerOperations(ids, PRIMARY_EVIDENCE_MANIFEST.consumers, registered!)).not.toThrow();
    expect(() => assertEvidenceConsumerOperations(ids, PRIMARY_EVIDENCE_MANIFEST.consumers, registered!.slice(1))).toThrow(/not set-equal/u);
    const obsolete = registered!.map(row => row.consumer.id === "module.compare_coach" ? { ...row, consumer: { ...row.consumer, version: 1 } } : row);
    expect(() => assertEvidenceConsumerOperations(ids, PRIMARY_EVIDENCE_MANIFEST.consumers, obsolete)).toThrow(/unsupported version/u);
    const wrongFunction = registered!.map((row, index) => index === 0 ? { ...row, operation: function notTheCompiler() {} } : row);
    expect(() => assertEvidenceConsumerOperations(ids, PRIMARY_EVIDENCE_MANIFEST.consumers, wrongFunction)).toThrow(/declares/u);
  });
  it("[A1] compiles all eleven fourteen-field declarations at import, in MODULE_IDS order", () => {
    expect(MODULE_REGISTRY.modules.map((module) => module.id)).toEqual(MODULE_IDS);
    // The current consumer is explicit; Guided Hint alone also carries disclosure.
    for (const module of MODULE_REGISTRY.modules) expect(Object.keys(module).sort()).toHaveLength(module.id === "guided_hint" ? 16 : 15);
    // The registry is compiled by the production module, not by a test.
    const registry = readFileSync(new URL("packages/runtime/src/module-registry.ts", ROOT), "utf8");
    expect(registry).toMatch(/^export const MODULE_REGISTRY: CompiledModuleRegistry = compileModuleRegistry\(MODULE_DECLARATIONS, moduleEvidenceClosure\(PRIMARY_EVIDENCE_MANIFEST\)\);$/mu);
    expect(registry).toMatch(/^assertModuleRegistry\(\{ declarations: MODULE_REGISTRY\.modules \}\);$/mu);
    expect(readFileSync(new URL("packages/runtime/src/index.ts", ROOT), "utf8")).toContain("from \"./module-reducers.js\"");
  });

  it("[A1 negatives] each cross-file invariant fails its own flipped fixture", () => {
    expect(() => assertModuleRegistry({ declarations: MODULE_DECLARATIONS })).not.toThrow();
    const code = (run: () => void) => { try { run(); } catch (error) { return (error as ModuleRegistryInvariantError).code; } return "passed"; };
    // 1. a session set that drifts from the moduleCeiling image
    expect(code(() => assertModuleRegistry({ declarations: replace("theory_breadcrumb", (module) => ({ ...module, ceilings: { ...module.ceilings, sessions: ["pack"] } })) }))).toBe("MODULE_SESSIONS_DRIFT");
    // 2. an operator role on a learner module
    expect(code(() => assertModuleRegistry({ declarations: replace("sight_on_request", (module) => ({ ...module, ceilings: { ...module.ceilings, roles: [...module.ceilings.roles, "operator"] } })) }))).toBe("MODULE_ROLE_FORBIDDEN");
    // 3. a preset naming a module with no declaration
    expect(code(() => assertModuleRegistry({ declarations: MODULE_DECLARATIONS.filter((module) => module.id !== "compare_coach") }))).toBe("MODULE_PRESET_UNRESOLVED");
    // 4. an accepted pair with no compiled binding
    expect(code(() => assertModuleRegistry({ declarations: replace("theory_breadcrumb", (module) => module.accepts.kind !== "manifest" ? module : ({ ...module, accepts: { ...module.accepts, projections: module.accepts.projections.slice(1) } })) }))).toBe("MODULE_BINDING_DRIFT");
    // 5. a refusal for a projection that is in fact covered, and a coverage gap
    expect(code(() => assertModuleRegistry({ declarations: MODULE_DECLARATIONS, refusals: [...MODULE_COVERAGE_REFUSALS, { projection: { id: "rules.tactic.consequence.threat", version: 1 }, reason: "fixture" }] }))).toBe("MODULE_COVERAGE_OPEN");
    expect(code(() => assertModuleRegistry({ declarations: MODULE_DECLARATIONS, refusals: [] }))).toBe("MODULE_COVERAGE_OPEN");
  });

  it("[A3] derives sessions from WORKFLOW_CONTEXT_POLICIES and fails when one ceiling moves", () => {
    for (const module of MODULE_REGISTRY.modules) expect([...module.ceilings.sessions].sort()).toEqual([...moduleSessions(module.id)].sort());
    expect(MODULE_REGISTRY.byId.get("blunder_prevention")!.ceilings.sessions).toEqual(["position"]);
    expect(MODULE_REGISTRY.byId.get("full_inspector")!.ceilings.sessions).toHaveLength(5);
    expect(MODULE_REGISTRY.byId.get("review_map")!.ceilings.sessions).toHaveLength(6);
    expect(MODULE_REGISTRY.byId.get("rules_floor")!.ceilings.sessions).toHaveLength(8);
    const moved = WORKFLOW_CONTEXT_POLICIES.map((context) => context.id === "academy" ? { ...context, moduleCeiling: context.moduleCeiling.filter((id) => id !== "guided_hint") } : context);
    expect(() => assertModuleRegistry({ declarations: MODULE_DECLARATIONS, contexts: moved })).toThrowError(expect.objectContaining({ code: "MODULE_SESSIONS_DRIFT" }));
    // A forbidden session (match on guided_hint) is refused the same way.
    expect(() => assertModuleRegistry({ declarations: replace("guided_hint", (module) => ({ ...module, ceilings: { ...module.ceilings, sessions: [...module.ceilings.sessions, "match"] } })) })).toThrowError(expect.objectContaining({ code: "MODULE_SESSIONS_DRIFT" }));
    // Roles: §1.2's three rules, through the one total role projection.
    expect(["solo", "host", "participant", "spectator"].map((role) => moduleEvidenceRole(role as "solo"))).toEqual(["learner", "host", "participant", "spectator"]);
    expect(MODULE_REGISTRY.byId.get("rules_floor")!.ceilings.roles).toEqual(["learner", "host", "participant"]);
    expect(MODULE_REGISTRY.byId.get("review_map")!.ceilings.roles).toEqual(["learner", "host", "participant", "spectator"]);
    for (const id of ["sight_on_request", "blunder_prevention", "threat_radar", "postcommit_nudge", "structure_nudge", "theory_breadcrumb", "guided_hint", "compare_coach", "full_inspector"] as const) {
      expect(MODULE_REGISTRY.byId.get(id)!.ceilings.roles).toEqual(["learner", "host"]);
    }
  });

  it("[A4] one capability authority: the §2.3(a) table, and each module's derived answer union", () => {
    const declared = Object.fromEntries(MODULE_POLICIES.map((policy) => [policy.id, policy.answer.kind === "capabilities" ? [...policy.answer.capabilities] : policy.answer.kind]));
    expect(declared).toEqual({
      rules_floor: "none", sight_on_request: ["pattern", "candidates"], blunder_prevention: ["threat"],
      threat_radar: ["pattern", "threat"], postcommit_nudge: ["threat", "evaluation"], structure_nudge: ["theory"],
      theory_breadcrumb: ["theory"], guided_hint: ["observation", "pattern", "threat", "candidates", "move"], compare_coach: ["move", "evaluation"],
      review_map: ["threat", "theory", "evaluation"], full_inspector: ["threat", "theory", "evaluation", "principal_variation"],
    });
    const projections = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [key(projection), projection]));
    const union = Object.fromEntries(MODULE_REGISTRY.modules.filter((module) => module.accepts.kind === "manifest").map((module) => [
      module.id, [...new Set(accepted(module).flatMap((projection) => projections.get(projection)!.answerContent))].sort(),
    ]));
    expect(union).toEqual({
      sight_on_request: ["candidate_moves", "fact", "pattern"],
      blunder_prevention: ["fact", "threat"],
      threat_radar: ["fact", "pattern", "threat"],
      postcommit_nudge: ["evaluation", "fact", "threat"],
      structure_nudge: ["fact", "pattern", "theory"],
      theory_breadcrumb: ["fact", "pattern", "plan", "principle", "theory"],
      // rfc/hint-distance.md §9: exactly the union of §1.1's disclosure rows — no rank, eval, theory or PV.
      guided_hint: ["candidate_moves", "fact", "move", "pattern", "threat"],
      compare_coach: ["evaluation", "fact", "move"],
      review_map: ["evaluation", "fact", "theory", "threat"],
      full_inspector: ["candidate_moves", "evaluation", "fact", "move", "pattern", "principal_variation", "theory", "threat"],
    });
    // Sight: rook_on_seventh is the sole pattern witness and legal_moves the sole candidate witness.
    const sight = accepted(MODULE_REGISTRY.byId.get("sight_on_request")!);
    expect(sight.filter((projection) => projections.get(projection)!.answerContent.includes("pattern"))).toEqual(["rules.tactic.reading.rook_on_seventh@1"]);
    expect(sight.filter((projection) => projections.get(projection)!.answerContent.includes("candidate_moves"))).toEqual(["rules.mobility.reading.legal_moves@1"]);
    // A grade admitted to a threat-only module is refused at compile time.
    const graded = replace("blunder_prevention", (module) => module.accepts.kind !== "manifest" ? module : ({
      ...module,
      accepts: { ...module.accepts, projections: [...module.accepts.projections, { projection: { id: "derived.grade.move_quality", version: 2 } }] },
      selection: { ...module.selection, familyPrecedence: [...module.selection.familyPrecedence, { id: "derived.grade.move_quality", version: 2 }] },
    }));
    const closure = moduleEvidenceClosure(PRIMARY_EVIDENCE_MANIFEST);
    const withConsumer = { ...closure, consumers: closure.consumers.map((value) => value.consumer.id === "module.blunder_prevention" ? { ...value, accepts: [...value.accepts, { id: "derived.grade.move_quality", version: 2 }] } : value) };
    expect(() => compileModuleRegistry(graded, withConsumer)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_ANSWER_WIDENS" }));
    expect(MODULE_ANSWER_CAPABILITY_IMAGE.theory).not.toContain("evaluation");
    expect(MODULE_ANSWER_CAPABILITY_IMAGE.evaluation).toEqual(["fact", "evaluation"]);
    // The author fixture imports this authority rather than restating it (D3066).
    const fixture = readFileSync(new URL("tools/d2120-module-registration-author-contract/module-plan-fixture.ts", ROOT), "utf8");
    expect(fixture).toContain("MODULE_POLICIES");
    expect(fixture).not.toMatch(/answerCapabilities: \[/u);
  });

  it("[A2] declared / compiled / awaiting pairs are derived and set-equal to the compiled bindings", () => {
    const awaiting = Object.values(MODULE_AWAITING).flat().map((value) => key(value!.projection));
    expect(awaiting.sort()).toEqual(["pack.authored.classifier@1"]);
    expect(awaiting.every((projection) => !PRIMARY_EVIDENCE_MANIFEST.projections.some((value) => key(value) === projection))).toBe(true);
    const bound = PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.consumer.id.startsWith("module.")).map((binding) => `${binding.consumer.id.slice("module.".length)}\u0000${key(binding.projection)}`).sort();
    expect([...pairs].sort()).toEqual(bound);
    // Current source-safe cut:88 Full2 topics/fourteen details; ordinary avoidance26 is held,
    // not silently installed as a binding that the operation cannot supply.
    expect(pairs).toHaveLength(292);
    expect(pairs.length + awaiting.length).toBe(293);
    // Nine retired public events and ten old ordinary avoidance refs leave the old214 union;
    // the current seven native sources were already present in Full2.
    expect(new Set(pairs.map((pair) => pair.split("\u0000")[1])).size).toBe(195);
    expect(pairs.filter(pair => pair.includes("\u0000run.record.objective_transition@"))).toEqual([
      "compare_coach\u0000run.record.objective_transition@1", "review_map\u0000run.record.objective_transition@2",
    ]);
    expect(Object.fromEntries(MODULE_REGISTRY.modules.map((module) => [module.id, accepted(module).length]))).toEqual({
      rules_floor: 0, sight_on_request: 23, blunder_prevention: 3, threat_radar: 7, postcommit_nudge: 41, structure_nudge: 7,
      theory_breadcrumb: 4, guided_hint: 35, compare_coach: 8, review_map: 62, full_inspector: 102,
    });
    expect(accepted(MODULE_REGISTRY.byId.get("full_inspector")!)).toEqual([
      ...INSPECTOR_SOURCE_TOPICS.map(row => row.projection), ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`),
    ]);
    expect(MODULE_OPERATIONS.find(row => row.module === "full_inspector")!.operation).toBe("compileInspectorSourcePage");
    // Separate exact54 selector3 and all-live86 validation1 images; neither grants learner use.
    expect(new Set(PRIMARY_EVIDENCE_MANIFEST.eligibility.map(row => key(row.consumer)))).toEqual(new Set(["research.semantic_selection@3", "research.semantic_validation@1"]));
    expect(PRIMARY_EVIDENCE_MANIFEST.eligibility.filter(row => key(row.consumer) === "research.semantic_selection@3")).toHaveLength(54);
    expect(PRIMARY_EVIDENCE_MANIFEST.eligibility.filter(row => key(row.consumer) === "research.semantic_validation@1")).toHaveLength(86);
    expect(PRIMARY_EVIDENCE_MANIFEST.eligibility.every(row => row.semanticValidation === "research_only")).toBe(true);
    expect(PRIMARY_EVIDENCE_MANIFEST.selectionPolicies.map(key)).toEqual(["research.r2_candidate@3"]);
    // A non-event reading cannot enter F1 eligibility as a second module authority.
    const phase = { id: "rules.phase.reading", version: 2 };
    expect(() => compileEvidenceManifest({
      ...EVIDENCE_CONTRACT_DECLARATIONS,
      eligibility: [...EVIDENCE_CONTRACT_DECLARATIONS.eligibility!, { event: phase, consumer: { id: "module.review_map", version: 2 }, disposition: "eligible", reason: { id: "eligible_validated_literal", version: 1 }, allowedSigns: ["state"], requiredOperands: [], valenceAuthority: [], semanticValidation: "research_only" }],
    })).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_ELIGIBILITY_ORPHANED" }));
    // Deleting one module adapter while keeping the acceptance fails the binding set equality.
    const withoutAdapter = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, adapters: EVIDENCE_CONTRACT_DECLARATIONS.adapters.filter((adapter) => !(adapter.consumer.id === "module.review_map" && key(adapter.projection) === "derived.grade.move_quality@2")) });
    expect(() => assertModuleRegistry({ declarations: MODULE_DECLARATIONS, manifest: withoutAdapter })).toThrowError(expect.objectContaining({ code: "MODULE_BINDING_DRIFT" }));
  });

  it("[A6] the disposition transfer is exact: no accepted projection keeps one, and binding + disposition stays a build failure", () => {
    const acceptedKeys = new Set(pairs.map((pair) => pair.split("\u0000")[1]));
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => acceptedKeys.has(key(projection)) && projection.disposition !== undefined)).toEqual([]);
    // Named retained complement stays disposed at its original boundary.
    for (const id of ["rules.exchange.predicate.legal_exchange@1", "run.record.edge@1", "run.record.position@1", "theory.endgame.method_stage@1"]) {
      expect(PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => key(projection) === id)?.disposition).toBeDefined();
    }
    const withDisposition = {
      ...EVIDENCE_CONTRACT_DECLARATIONS,
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => ({
        ...producer,
        outputs: producer.outputs.map((projection) => key(projection) === "rules.tactic.consequence.threat@1" ? { ...projection, disposition: { kind: "inspector_only" as const, reason: "fixture" } } : projection),
      })),
    };
    expect(() => compileEvidenceManifest(withDisposition)).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_PROJECTION_ORPHANED" }));
  });

  it("[learner-modules A19 / D921] replaces historical Wave-C duplicates with the exact current recorded Inspector successors", () => {
    expect(WAVE_C_MODULE_PROJECTION_REFS).toHaveLength(12);
    expect(WAVE_C_MODULE_PROJECTION_REFS.every((value) => value.version === 1 && PRIMARY_EVIDENCE_MANIFEST.projections.some((projection) => key(projection) === key(value)))).toBe(true);
    const observed = SEMANTIC_WAVE_EVENT_PROJECTION_IDS.filter((id) => id.startsWith("derived.tactic.")).map((id) => `${id}@1`);
    expect(observed).toHaveLength(7);
    const waveC = new Set(WAVE_C_MODULE_PROJECTION_REFS.map(key));
    const delta = pairs.filter((pair) => waveC.has(pair.split("\u0000")[1]!));
    expect(delta).toHaveLength(4);
    for (const projection of observed) {
      const homes = (route: string) => pairs.filter(pair => pair.endsWith(`\u0000${route}`)).map(pair => pair.split("\u0000")[0]).sort();
      expect(homes(projection)).toEqual([]);
      expect(homes(projection.replace(/@1$/u, "@2"))).toEqual([]);
      expect(homes(projection.replace(/@1$/u, "@3"))).toEqual(["full_inspector", "postcommit_nudge", "review_map"]);
    }
    for (const projection of [...waveC].filter((value) => !observed.includes(value))) {
      const current = projection === "derived.tactic.overloaded_defender_response_conflict@1" ? "rules.tactic.predicate.overload_conflict@1" : projection;
      expect(pairs.filter((pair) => pair.endsWith(`\u0000${current}`)).map((pair) => pair.split("\u0000")[0])).toEqual(["full_inspector"]);
      if (current !== projection) expect(delta.some(pair => pair.endsWith(`\u0000${projection}`))).toBe(false);
    }
    // Actual bound successors carry no disposition; withdrawn predecessors do not reappear.
    const currentWave = new Set([...waveC].map(projection => observed.includes(projection) ? projection.replace(/@1$/u, "@3")
      : projection === "derived.tactic.overloaded_defender_response_conflict@1" ? "rules.tactic.predicate.overload_conflict@1" : projection));
    expect(currentWave.size).toBe(12);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => currentWave.has(key(projection)) && projection.disposition !== undefined)).toEqual([]);
    expect(pairs.some((pair) => /promotion_race|race_arrival/u.test(pair))).toBe(false);
  });

  it("[A21] the evidence-value-authority successor rebase is exact and leaves no retired ref", () => {
    const retired = MODULE_SUCCESSOR_REBASE.map((row) => key(row.retired));
    expect(retired.sort()).toEqual(["rules.endgame.reading@1", "rules.phase.reading@1", "rules.pivotal.marker@1", "rules.structural.reading.named_structure@1"]);
    expect(MODULE_SUCCESSOR_REBASE.flatMap((row) => row.successors)).toHaveLength(8);
    for (const projection of retired) {
      expect(PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => key(value) === projection)?.disposition?.kind).toBe("retired");
      expect(pairs.some((pair) => pair.endsWith(`\u0000${projection}`))).toBe(false);
    }
    const homes = (projection: string) => pairs.filter((pair) => pair.endsWith(`\u0000${projection}`)).map((pair) => pair.split("\u0000")[0]).sort();
    expect(homes("rules.structural.reading.named_structure@2")).toEqual(["sight_on_request", "structure_nudge"]);
    expect(homes("rules.phase.reading@2")).toEqual(["full_inspector", "review_map", "structure_nudge"]);
    expect(homes("rules.endgame.classification@1")).toEqual(["review_map", "structure_nudge"]);
    expect(homes("theory.endgame.setup_match@1")).toEqual(["review_map", "structure_nudge"]);
    expect(homes("derived.pivotal.irreversibility@1")).toEqual(["full_inspector", "review_map"]);
    for (const kind of ["phase_change", "human_divergence", "option_collapse"]) {
      expect(homes(`derived.pivotal.${kind}@1`)).toEqual([]);
      expect(homes(`derived.pivotal.${kind}@2`)).toEqual(["full_inspector", "review_map"]);
    }
  });

  it("[recorded-path successors] current learner consumers replace narrative/window duplicates with exact owned sources", () => {
    expect(RECORDED_PATH_SUCCESSOR_REFS).toHaveLength(11);
    const review = accepted(MODULE_REGISTRY.byId.get("review_map")!);
    const inspector = accepted(MODULE_REGISTRY.byId.get("full_inspector")!);
    for (const successor of RECORDED_PATH_SUCCESSOR_REFS) {
      const v1 = `${successor.id}@1`;
      const current = key(currentRecordedModuleRefs([successor])[0]!);
      expect(review).not.toContain(v1);
      expect(review.filter(value => value === current)).toHaveLength(1);
      if (successor.id !== "derived.exchange.trade_completed") expect(review).not.toContain(key(successor));
      expect(inspector).not.toContain(v1);
      expect(inspector).not.toContain(key(successor));
      if (successor.id === "derived.exchange.trade_completed") expect(inspector).not.toContain(current);
      else expect(inspector.filter(value => value === current)).toHaveLength(1);
    }
    const nudge = accepted(MODULE_REGISTRY.byId.get("postcommit_nudge")!);
    const currentWindows = currentRecordedModuleRefs(RECORDED_PATH_SUCCESSOR_REFS).map(key);
    expect(currentWindows.filter(value => nudge.includes(value))).toHaveLength(9);
    expect(nudge).not.toContain("derived.pawn.sequence.contact_timing@3");
    expect(nudge).not.toContain("derived.tactic.sequence.defender_consequence@3");
  });

  it("[A26 / D3065] every upstream discharge population is covered or refused, never both", () => {
    const covered = new Set(pairs.map((pair) => pair.split("\u0000")[1]));
    const refused = new Set(MODULE_COVERAGE_REFUSALS.map((value) => key(value.projection)));
    const open = MODULE_UPSTREAM_DISCHARGES.flatMap((discharge) => discharge.projections.map(key).filter((projection) => covered.has(projection) === refused.has(projection)).map((projection) => `${discharge.owner}: ${projection}`));
    expect(open).toEqual([]);
    const expectedRefusals = ["rules.exchange.predicate.legal_exchange@1", "derived.exchange.trade_completed@1", "derived.tactic.defender_exposure@1",
      "derived.tactic.fork_survives_reply@1", "derived.tactic.promotion_pressure@1", "human.maia.candidate_wdl@1",
      "derived.material.reading.role_signature@1", "derived.material.event.role_asymmetry@1", "derived.opening.deepest_reached@1",
      "derived.tactic.overloaded_defender_response_conflict@1", "rules.structural.event.pawn_islands@1",
      "derived.semantic_avoidance.loose_piece@1", "derived.semantic_avoidance.pawn_islands@1",
      ...RECORDED_PATH_SUCCESSOR_REFS.filter(ref => ref.id !== "derived.exchange.trade_completed").flatMap(ref => [`${ref.id}@1`, `${ref.id}@2`])];
    expect(expectedRefusals).toHaveLength(33);
    expect([...refused].sort()).toEqual(expectedRefusals.sort());
    expect(covered.has("derived.tactic.defender_exposure@2")).toBe(true);
    expect(MODULE_PAIR_EXECUTION.find(pair => pair.module === "threat_radar" && key(pair.projection) === "derived.tactic.defender_exposure@2"))
      .toMatchObject({ status: "executable", timing: "post_commit" });
    expect(covered.has("rules.mobility.reading.legal_moves@1")).toBe(true);
  });

  it("marks what is executable versus blocked, per pair, and executes Guided Hint through its disclosure registry", () => {
    expect(MODULE_PAIR_EXECUTION).toHaveLength(pairs.length);
    const executable = MODULE_PAIR_EXECUTION.filter((pair) => pair.status === "executable");
    // evidence-presentation Checkpoint B: every evidence-bearing module has executable pairs — an
    // operation acquires the source AND an exact adapter presents it (Guided Hint: rfc/hint-distance.md
    // §4's per-disclosure `play.guided_hint@1` adapters).
    expect(new Set(executable.map((pair) => pair.module))).toEqual(new Set(["sight_on_request", "blunder_prevention", "threat_radar", "postcommit_nudge", "structure_nudge", "theory_breadcrumb", "guided_hint", "compare_coach", "review_map", "full_inspector"]));
    for (const id of ["review_map", "postcommit_nudge"] as const) {
      expect(executable.some((pair) => pair.module === id && key(pair.projection) === "derived.grade.move_quality@2")).toBe(true);
    }
    for (const pair of MODULE_PAIR_EXECUTION) {
      if (pair.status === "blocked_dependencies") expect(pair.blockers.length).toBeGreaterThan(0);
      // Flip rule: executable exactly when the operation acquires the pair and its adapter exists.
      const adapter = presentationAdapter(MODULE_REGISTRY.byId.get(pair.module)!.consumer!, pair.projection) !== undefined;
      const acquired = MODULE_OPERATIONS.some((operation) => operation.module === pair.module && operation.projections.some((projection) => key(projection) === key(pair.projection)));
      expect(pair.status === "executable", `${pair.module} ${key(pair.projection)}`).toBe(adapter && acquired);
      if (pair.status === "blocked_dependencies" && !adapter) expect(pair.blockers.some((blocker) => blocker.owner === "evidence-presentation")).toBe(true);
      if (pair.status === "blocked_dependencies") expect(pair.blockers.some(blocker => blocker.owner === "evidence-presentation"), `D3761 ${pair.module} ${key(pair.projection)} reports actual adapter absence`).toBe(!adapter);
    }
    // The pre-/at-commit disclosure receipt and the query operation have landed: no pair is blocked on them.
    expect(MODULE_PAIR_EXECUTION.some((pair) => pair.status === "blocked_dependencies" && pair.blockers.some((blocker) => blocker.owner === "intent-presets"))).toBe(false);
    expect(MODULE_PAIR_EXECUTION.filter((pair) => pair.module === "blunder_prevention").every((pair) => pair.status === "executable")).toBe(true);
    // rfc/hint-distance.md §3/§9 (criteria 6, 8, 14): the module accepts exactly the 35 disclosure
    // projections, each row with its exact registry answer image; no horizon, raw PV, Syzygy, authored
    // claim or endgame reading is a learner binding.
    const hint = MODULE_REGISTRY.byId.get("guided_hint")!;
    expect(hint.disclosure).toEqual(GUIDED_HINT_DISCLOSURE);
    expect(accepted(hint)).toEqual(HINT_DISCLOSURE_PROJECTION_IDS.map(key));
    if (hint.accepts.kind !== "manifest") throw new Error("guided_hint must be manifest-backed");
    for (const row of hint.accepts.projections) {
      const identity = hintDisclosureIdentity(row.projection.id)!;
      expect(row.answerContent).toEqual(hintDeclarationRow(identity.family).rungAnswers[identity.rung]);
    }
    const hintPairs = MODULE_PAIR_EXECUTION.filter((pair) => pair.module === "guided_hint");
    expect(hintPairs.every((pair) => pair.status === "executable" && pair.operation === "compileGuidedHintPacket" && pair.timing === "checkpoint")).toBe(true);
    const horizons = new Set(HINT_HORIZON_PROJECTION_IDS.map(key));
    expect(pairs.filter((pair) => horizons.has(pair.split("\u0000")[1]!))).toEqual([]);
    expect(accepted(hint).some((projection) => /^(live\.|pack\.authored\.|rules\.endgame\.)/u.test(projection))).toBe(false);
    for (const projection of HINT_HORIZON_PROJECTION_IDS) expect(PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => key(value) === key(projection))?.disposition?.kind).toBe("operator_only");
    // Every declared operation projection is accepted by its module; the one-edge set excludes windows and avoidance.
    for (const operation of MODULE_OPERATIONS) {
      const module = accepted(MODULE_REGISTRY.byId.get(operation.module)!);
      expect(operation.projections.every((projection) => module.includes(key(projection)))).toBe(true);
    }
    expect(ONE_EDGE_EVENT_REFS).toHaveLength(39);
    expect(ONE_EDGE_EVENT_REFS.every((value) => !value.id.startsWith("derived.semantic_avoidance.") && !value.id.endsWith("_observed"))).toBe(true);
    expect(ONE_EDGE_EVENT_REFS.every((value) => SEMANTIC_EVENT_PROJECTION_REFS.some((ref) => key(ref) === key(value)))).toBe(true);
  });

  it("D4175 keeps all26 current avoidance pairs held outside ordinary acceptance and acquisition", () => {
    const held = SUBJECT_OUTCOME_FAMILIES.map(family => ({ id: `derived.semantic_avoidance.${family}`, version: 2 }));
    expect(held).toHaveLength(13);
    const acquired = MODULE_OPERATIONS.find(value => value.module === "postcommit_nudge")!.projections;
    expect(MODULE_CONSUMER_ACCEPTS.postcommit_nudge).toHaveLength(41);
    expect(acquired).toHaveLength(41);
    expect(moduleQueryProjections("postcommit_nudge")).toEqual(acquired);
    for (const operation of MODULE_OPERATIONS) expect(moduleQueryProjections(operation.module)).toEqual(
      operation.operation === "queryModules" ? operation.projections : []);
    expect(acquired.filter(value => value.id.startsWith("derived.semantic_avoidance."))).toEqual([]);
    for (const projection of held) {
      expect(PRIMARY_EVIDENCE_MANIFEST.projections.some(value => key(value) === key(projection))).toBe(true);
      for (const module of ["postcommit_nudge", "review_map"] as const) {
        expect(MODULE_CONSUMER_ACCEPTS[module].filter(value => value.id.startsWith("derived.semantic_avoidance."))).toEqual([]);
        expect(MODULE_PAIR_EXECUTION.some(value => value.module === module && key(value.projection) === key(projection))).toBe(false);
        expect(moduleQueryProjections(module).some(value => key(value) === key(projection))).toBe(false);
        expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some(binding => binding.consumer.id === `module.${module}`
          && binding.consumer.version === 2 && key(binding.projection) === key(projection))).toBe(false);
      }
    }
  });

  it("keeps Review's exact current supplied image separate from the26 held ordinary pairs", () => {
    const required = MODULE_CONSUMER_ACCEPTS.review_map;
    const expectedBlocked = required.filter(ref => ref.id.startsWith("derived.semantic_avoidance."));
    expect(required).toHaveLength(62);
    expect(expectedBlocked).toEqual([]);
    const blocked = MODULE_PAIR_EXECUTION.filter(pair => pair.module === "review_map" && pair.status === "blocked_dependencies");
    expect(blocked.map(pair => key(pair.projection))).toEqual(expectedBlocked.map(key));
    expect(MODULE_OPERATIONS.find(operation => operation.module === "review_map")!.projections).toHaveLength(62);
    expect(MODULE_PAIR_EXECUTION.find(pair => pair.module === "review_map" && key(pair.projection) === "run.record.objective_transition@2")).toMatchObject({ status: "executable" });
  });

  it("D3760 never advertises the two-capture trade as a one-edge source", () => {
    expect(ONE_EDGE_EVENT_REFS.some(value => key(value) === "derived.exchange.trade_completed@1")).toBe(false);
    expect(MODULE_PAIR_EXECUTION.find(value => value.module === "postcommit_nudge" && key(value.projection) === "derived.exchange.trade_completed@1")).toBeUndefined();
    const pair = MODULE_PAIR_EXECUTION.find(value => value.module === "postcommit_nudge" && key(value.projection) === "derived.exchange.trade_completed@2");
    expect(pair?.status).toBe("executable");
    expect(MODULE_PAIR_EXECUTION.some(value => value.module === "review_map" && key(value.projection) === "derived.exchange.trade_completed@2" && value.status === "executable")).toBe(true);
  });

  it("keeps the module consumer ceilings derived from the one policy table", () => {
    for (const module of MODULE_REGISTRY.modules) {
      const consumer = PRIMARY_EVIDENCE_MANIFEST.consumers.find((value) => value.id === `module.${module.id}`);
      if (module.accepts.kind !== "manifest") { expect(consumer).toBeUndefined(); continue; }
      expect(consumer?.implementation).toBe(MODULE_CURRENT_IMAGE.find(row => row.moduleId === module.id)!.implementation);
      expect(consumer?.accepts.map(key)).toEqual(accepted(module));
      expect([...consumer!.roles]).toEqual([...module.ceilings.roles]);
      expect([...consumer!.sessions].sort()).toEqual([...module.ceilings.sessions].sort());
      expect([...consumer!.answerContent].sort()).toEqual([...MODULE_REGISTRY.answerImages.get(module.id)!].sort());
    }
    expect(MODULE_CONSUMER_ACCEPTS.guided_hint).toBe(HINT_DISCLOSURE_PROJECTION_IDS);
  });
});
