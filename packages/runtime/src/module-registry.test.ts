// rfc/module-registration.md acceptance criteria that the production registry landing can make
// able-to-fail today (A1–A4, A6, A19/D921, A21, A26), plus the two production consumers.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  MODULE_CONSUMER_ACCEPTS,
  MODULE_SUCCESSOR_REBASE,
  PRIMARY_EVIDENCE_MANIFEST,
  RECORDED_PATH_SUCCESSOR_REFS,
  SEMANTIC_EVENT_PROJECTION_REFS,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  WAVE_C_MODULE_PROJECTION_REFS,
} from "./evidence-catalog.js";
import { compileEvidenceManifest, EvidenceManifestError, type VersionedEvidenceId } from "./evidence-contract.js";
import { MODULE_ANSWER_CAPABILITY_IMAGE, MODULE_IDS, ModuleContractError, compileModuleRegistry, type ModuleDeclaration } from "./module-contract.js";
import { MODULE_POLICIES, moduleEvidenceRole, moduleSessions } from "./module-policy.js";
import {
  GUIDED_HINT_BLOCKERS,
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
  it("[A1] compiles all eleven fourteen-field declarations at import, in MODULE_IDS order", () => {
    expect(MODULE_REGISTRY.modules.map((module) => module.id)).toEqual(MODULE_IDS);
    for (const module of MODULE_REGISTRY.modules) expect(Object.keys(module).sort()).toHaveLength(14);
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
      theory_breadcrumb: ["theory"], guided_hint: "guided_hint@1", compare_coach: ["move", "evaluation"],
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
      structure_nudge: ["fact", "pattern", "plan", "theory"],
      theory_breadcrumb: ["fact", "pattern", "plan", "principle", "theory"],
      compare_coach: ["evaluation", "fact", "move"],
      review_map: ["evaluation", "fact", "theory", "threat"],
      full_inspector: ["candidate_moves", "evaluation", "fact", "move", "pattern", "plan", "principal_variation", "theory", "threat"],
    });
    // Sight: rook_on_seventh is the sole pattern witness and legal_moves the sole candidate witness.
    const sight = accepted(MODULE_REGISTRY.byId.get("sight_on_request")!);
    expect(sight.filter((projection) => projections.get(projection)!.answerContent.includes("pattern"))).toEqual(["rules.tactic.reading.rook_on_seventh@1"]);
    expect(sight.filter((projection) => projections.get(projection)!.answerContent.includes("candidate_moves"))).toEqual(["rules.mobility.reading.legal_moves@1"]);
    // A grade admitted to a threat-only module is refused at compile time.
    const graded = replace("blunder_prevention", (module) => module.accepts.kind !== "manifest" ? module : ({
      ...module,
      accepts: { ...module.accepts, projections: [...module.accepts.projections, { projection: { id: "derived.grade.move_quality", version: 1 } }] },
      selection: { ...module.selection, familyPrecedence: [...module.selection.familyPrecedence, { id: "derived.grade.move_quality", version: 1 }] },
    }));
    const closure = moduleEvidenceClosure(PRIMARY_EVIDENCE_MANIFEST);
    const withConsumer = { ...closure, consumers: closure.consumers.map((value) => value.consumer.id === "module.blunder_prevention" ? { ...value, accepts: [...value.accepts, { id: "derived.grade.move_quality", version: 1 }] } : value) };
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
    expect(awaiting.sort()).toEqual(["derived.explorer.population_summary@1", "pack.authored.classifier@1"]);
    expect(awaiting.every((projection) => !PRIMARY_EVIDENCE_MANIFEST.projections.some((value) => key(value) === projection))).toBe(true);
    const bound = PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.consumer.id.startsWith("module.")).map((binding) => `${binding.consumer.id.slice("module.".length)}\u0000${key(binding.projection)}`).sort();
    expect([...pairs].sort()).toEqual(bound);
    // Drift tripwires, derived: 237 post-rebase + 21 recorded-path successors + 5 typed Review
    // projections (rfc/review-evidence-compiler.md) compiled; 2 awaiting; R = 0 (guided hint blocked).
    expect(pairs).toHaveLength(263);
    expect(pairs.length + awaiting.length).toBe(265);
    expect(new Set(pairs.map((pair) => pair.split("\u0000")[1])).size).toBe(152);
    expect(Object.fromEntries(MODULE_REGISTRY.modules.map((module) => [module.id, accepted(module).length]))).toEqual({
      rules_floor: 0, sight_on_request: 23, blunder_prevention: 3, threat_radar: 7, postcommit_nudge: 52, structure_nudge: 7,
      theory_breadcrumb: 3, guided_hint: 0, compare_coach: 8, review_map: 85, full_inspector: 75,
    });
    // Semantic eligibility and the research selection policy are untouched (§2.2).
    expect(PRIMARY_EVIDENCE_MANIFEST.eligibility.every((row) => row.consumer.id === "research.semantic_selection")).toBe(true);
    expect(PRIMARY_EVIDENCE_MANIFEST.selectionPolicies.map((policy) => policy.id)).toEqual(["research.r2_candidate"]);
    // A non-event reading cannot enter F1 eligibility as a second module authority.
    const phase = { id: "rules.phase.reading", version: 2 };
    expect(() => compileEvidenceManifest({
      ...EVIDENCE_CONTRACT_DECLARATIONS,
      eligibility: [...EVIDENCE_CONTRACT_DECLARATIONS.eligibility!, { event: phase, consumer: { id: "module.review_map", version: 1 }, disposition: "eligible", reason: { id: "eligible_validated_literal", version: 1 }, allowedSigns: ["state"], requiredOperands: [], valenceAuthority: [] }],
    })).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_ELIGIBILITY_ORPHANED" }));
    // Deleting one module adapter while keeping the acceptance fails the binding set equality.
    const withoutAdapter = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, adapters: EVIDENCE_CONTRACT_DECLARATIONS.adapters.filter((adapter) => !(adapter.consumer.id === "module.review_map" && key(adapter.projection) === "derived.grade.move_quality@1")) });
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

  it("[learner-modules A19 / D921] the literal Wave-C delta is exactly 26 pairs at @1", () => {
    expect(WAVE_C_MODULE_PROJECTION_REFS).toHaveLength(12);
    expect(WAVE_C_MODULE_PROJECTION_REFS.every((value) => value.version === 1 && PRIMARY_EVIDENCE_MANIFEST.projections.some((projection) => key(projection) === key(value)))).toBe(true);
    const observed = SEMANTIC_WAVE_EVENT_PROJECTION_IDS.filter((id) => id.startsWith("derived.tactic.")).map((id) => `${id}@1`);
    expect(observed).toHaveLength(7);
    const waveC = new Set(WAVE_C_MODULE_PROJECTION_REFS.map(key));
    const delta = pairs.filter((pair) => waveC.has(pair.split("\u0000")[1]!));
    expect(delta).toHaveLength(26);
    for (const projection of observed) {
      expect(delta.filter((pair) => pair.endsWith(`\u0000${projection}`)).map((pair) => pair.split("\u0000")[0]).sort()).toEqual(["full_inspector", "postcommit_nudge", "review_map"]);
    }
    for (const projection of [...waveC].filter((value) => !observed.includes(value))) {
      expect(delta.filter((pair) => pair.endsWith(`\u0000${projection}`)).map((pair) => pair.split("\u0000")[0])).toEqual(["full_inspector"]);
    }
    // No Wave-C primitive keeps a disposition, and no withdrawn promotion projection sneaks in.
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => waveC.has(key(projection)) && projection.disposition !== undefined)).toEqual([]);
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
    for (const kind of ["irreversibility", "phase_change", "human_divergence", "option_collapse"]) expect(homes(`derived.pivotal.${kind}@1`)).toEqual(["full_inspector", "review_map"]);
  });

  it("[recorded-path successors] review-timed modules accept each exact v2 successor beside its v1 predecessor", () => {
    expect(RECORDED_PATH_SUCCESSOR_REFS).toHaveLength(11);
    const review = accepted(MODULE_REGISTRY.byId.get("review_map")!);
    const inspector = accepted(MODULE_REGISTRY.byId.get("full_inspector")!);
    for (const successor of RECORDED_PATH_SUCCESSOR_REFS) {
      const v1 = `${successor.id}@1`;
      expect(review.indexOf(key(successor))).toBe(review.indexOf(v1) + 1);
      if (inspector.includes(v1)) expect(inspector.indexOf(key(successor))).toBe(inspector.indexOf(v1) + 1);
      else expect(inspector).not.toContain(key(successor));
    }
    // Post-commit reads one committed edge, never a window: no v2 successor enters the nudge.
    expect(accepted(MODULE_REGISTRY.byId.get("postcommit_nudge")!).some((projection) => projection.endsWith("@2"))).toBe(false);
  });

  it("[A26 / D3065] every upstream discharge population is covered or refused, never both", () => {
    const covered = new Set(pairs.map((pair) => pair.split("\u0000")[1]));
    const refused = new Set(MODULE_COVERAGE_REFUSALS.map((value) => key(value.projection)));
    const open = MODULE_UPSTREAM_DISCHARGES.flatMap((discharge) => discharge.projections.map(key).filter((projection) => covered.has(projection) === refused.has(projection)).map((projection) => `${discharge.owner}: ${projection}`));
    expect(open).toEqual([]);
    expect([...refused]).toEqual(["rules.exchange.predicate.legal_exchange@1"]);
    expect(covered.has("rules.mobility.reading.legal_moves@1")).toBe(true);
  });

  it("marks what is executable versus blocked, per pair, and blocks guided hint by name", () => {
    expect(MODULE_PAIR_EXECUTION).toHaveLength(pairs.length);
    const executable = MODULE_PAIR_EXECUTION.filter((pair) => pair.status === "executable");
    expect(new Set(executable.map((pair) => pair.module))).toEqual(new Set(["review_map", "postcommit_nudge"]));
    for (const id of ["review_map", "postcommit_nudge"] as const) {
      expect(executable.some((pair) => pair.module === id && key(pair.projection) === "derived.grade.move_quality@1")).toBe(true);
    }
    for (const pair of MODULE_PAIR_EXECUTION) {
      if (pair.status === "blocked_dependencies") expect(pair.blockers.length).toBeGreaterThan(0);
    }
    // Pre-/at-commit pairs are blocked on the ephemeral disclosure receipt.
    expect(MODULE_PAIR_EXECUTION.filter((pair) => pair.module === "blunder_prevention").every((pair) => pair.status === "blocked_dependencies" && pair.blockers.some((blocker) => blocker.owner === "intent-presets"))).toBe(true);
    const hint = MODULE_REGISTRY.byId.get("guided_hint")!;
    expect(hint.accepts).toEqual({ kind: "blocked_dependencies", blockers: GUIDED_HINT_BLOCKERS, awaiting: [] });
    expect(PRIMARY_EVIDENCE_MANIFEST.consumers.some((consumer) => consumer.id === "module.guided_hint")).toBe(false);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((projection) => projection.id.startsWith("derived.hint.disclosure."))).toBe(false);
    // Every declared operation projection is accepted by its module; the one-edge set excludes windows and avoidance.
    for (const operation of MODULE_OPERATIONS) {
      const module = accepted(MODULE_REGISTRY.byId.get(operation.module)!);
      expect(operation.projections.every((projection) => module.includes(key(projection)))).toBe(true);
    }
    expect(ONE_EDGE_EVENT_REFS.every((value) => value.version === 1 && !value.id.startsWith("derived.semantic_avoidance.") && !value.id.endsWith("_observed"))).toBe(true);
    expect(ONE_EDGE_EVENT_REFS.every((value) => SEMANTIC_EVENT_PROJECTION_REFS.some((ref) => key(ref) === key(value)))).toBe(true);
  });

  it("keeps the module consumer ceilings derived from the one policy table", () => {
    for (const module of MODULE_REGISTRY.modules) {
      const consumer = PRIMARY_EVIDENCE_MANIFEST.consumers.find((value) => value.id === `module.${module.id}`);
      if (module.accepts.kind !== "manifest") { expect(consumer).toBeUndefined(); continue; }
      expect(consumer?.implementation).toBe("compileModulePacket");
      expect(consumer?.accepts.map(key)).toEqual(accepted(module));
      expect([...consumer!.roles]).toEqual([...module.ceilings.roles]);
      expect([...consumer!.sessions].sort()).toEqual([...module.ceilings.sessions].sort());
      expect([...consumer!.answerContent].sort()).toEqual([...MODULE_REGISTRY.answerImages.get(module.id)!].sort());
    }
    expect(Object.keys(MODULE_CONSUMER_ACCEPTS)).not.toContain("guided_hint");
  });
});
