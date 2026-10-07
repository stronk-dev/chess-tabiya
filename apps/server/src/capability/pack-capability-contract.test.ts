// rfc/pack-capability-contract.md — criteria 2, 4–11, 14–18 for the server half of the contract.
// Criteria 3's corpus half, 12, 13 and 19 run over committed content and live in
// pack-capability-corpus.test.ts (content tier).
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  CAPABILITY_APPLICABILITY,
  canonicalJson,
  capabilityId,
  capabilityKey,
  parsePackCapabilitiesPublicProjectionV1,
  semverCapabilityId,
  type CapabilityApplicability,
  type CapabilityId,
} from "@chess-tabiya/schema";
import {
  CAPABILITY_LIFECYCLE,
  CAPABILITY_REGISTRY,
  CLAIM_BINDING_CAPABILITY_ID,
  buildCapabilityRegistry,
  type CapabilityLifecycleRow,
  type GeneratedCapabilityDeclaration,
} from "@chess-tabiya/runtime";
import { GENERATED_CAPABILITY_DECLARATIONS } from "../../../../packages/runtime/src/capability/declarations.generated.js";

import { ServerError } from "../errors.js";
import { PackRegistry } from "../pack-registry.js";
import { validatePackDocument } from "../pack-validation.js";
import { assertDeclarationUpdate, buildContract, censusSubjects, compareDeclarations, readAuthority, runCensus } from "./contract.js";
import { EXIT_MALFORMED, EXIT_NOT_READY } from "./migration-cli.js";
import {
  LEGACY_REFUSED_MIGRATION,
  compileLegacyDispositions,
  repositoryReader,
  type LegacyRefusalMigration,
} from "./legacy-migration.js";
import {
  applyMigrationPlan,
  assertMigrationPlanShape,
  assertPopulationBaseline,
  buildMigrationPlan,
  migrationApplyReadiness,
  MigrationPopulationError,
  MIGRATION_POPULATION_BASELINE,
  type MigrationPopulation,
  type PlanInputs,
} from "./migration.js";
import {
  ALL_PROVIDERS_CONFIGURED,
  projectPackCapabilities,
  runtimeSupportedCapabilities,
  packRequirementIssues,
  withDerivedRequires,
} from "./pack-capabilities.js";
import { CapabilitySourceIndex } from "./source-image.js";

const ROOT = resolve(import.meta.dirname, "../../../..");
const SLOW = 180_000;
const read = (path: string): string => readFileSync(resolve(ROOT, path), "utf8");
const example = JSON.parse(read("schemas/drill_pack.example.json")) as Record<string, unknown>;
const schema = JSON.parse(read("schemas/drill_pack.schema.json")) as unknown;
const i = (id: string, value = 1): CapabilityId => capabilityId(id, value);

/** Inserts a statement into a helper: a no-op is a source change, not a meaning change. */
function mutate(module: string, signature: string, statement: string): Record<string, string> {
  const text = read(module);
  const at = text.indexOf(signature);
  if (at < 0) throw new Error(`${signature} not found in ${module}`);
  const brace = text.indexOf("{", at + signature.length - 1);
  return { [module]: `${text.slice(0, brace + 1)}\n  ${statement}${text.slice(brace + 1)}` };
}

describe("criterion 2 — the registry is closed and compatibility is explicitly versioned", () => {
  const generated = (overrides: Partial<GeneratedCapabilityDeclaration> = {}): GeneratedCapabilityDeclaration => ({
    subjectId: "fixture.subject",
    id: i("fixture.subject"),
    subject: "verdict_producer",
    sources: [{ kind: "ast", site: { kind: "symbol", module: "packages/runtime/src/grade.ts", symbol: "moveQualityGrade" } }],
    dependsOn: [],
    semanticsDigest: "sha256:fixture",
    availability: "local",
    ...overrides,
  });

  it("module-load invariants refuse a sourceless active declaration and a mis-kinded source", () => {
    expect(() => buildCapabilityRegistry([generated({ sources: [] })], [])).toThrow(/CAPABILITY_SOURCE_MISSING/u);
    expect(() => buildCapabilityRegistry([generated({ subject: "projection" })], [])).toThrow(/CAPABILITY_SOURCE_KIND_INVALID/u);
    expect(() => buildCapabilityRegistry([generated()], [{ subjectId: "fixture.undeclared", versions: [{ version: { kind: "integer", value: 1 }, disposition: { kind: "active" } }] }])).toThrow(/CAPABILITY_UNDECLARED/u);
    expect(() => buildCapabilityRegistry([generated(), generated()], [])).toThrow(/CAPABILITY_DECLARATION_DUPLICATE/u);
    expect(() => buildCapabilityRegistry([generated({ dependsOn: [i("fixture.absent")] })], [])).toThrow(/CAPABILITY_DECLARATION_MISSING/u);
  });

  it("an F1-backed declaration passes with its projection source and invents no AST site", () => {
    const projection = CAPABILITY_REGISTRY.declarations.find((row) => row.subject === "projection")!;
    expect(projection.sources).toEqual([{ kind: "f1_projection", projection: projection.id }]);
    expect(buildCapabilityRegistry([{ ...projection, dependsOn: [] }], []).declarations).toHaveLength(1);
  });

  it("every schema member carries its base source, and interpreted members their arm sites", () => {
    const outpost = CAPABILITY_REGISTRY.current("structuralFeature.outpost")!;
    expect(outpost.sources[0]).toEqual({ kind: "schema_member", sourceIdentity: { schemaPointer: "/$defs/structuralFeature", member: "outpost" } });
    expect(outpost.sources).toContainEqual({ kind: "ast", site: { kind: "discriminant_arm", module: "packages/runtime/src/structure.ts", owner: "matchesStructuralFeature", property: "kind", value: "outpost" } });
    expect(outpost.sources.some((source) => source.kind === "package_dependency" && source.package === "chessops" && source.version === "0.15.1")).toBe(true);
    expect(outpost.dependsOn.map(capabilityKey)).toContain("structuralFeature.pawn_safe_square@i:1");
  });

  it("helper no-ops, an unrelated symbol and receipt-only hash churn preserve every released declaration", () => {
    const overrides = {
      ...mutate("packages/runtime/src/structure.ts", "function pawnSafetyOnPosition(", "void 0;"),
      ...mutate("packages/runtime/src/transition.ts", "export function matchesTransitionFeature(", "void 0;"),
      ...mutate("packages/runtime/src/objective.ts", "function materialScore(", "void 0;"),
      "apps/server/src/capability/stamp-cli.ts": `${read("apps/server/src/capability/stamp-cli.ts")}\nfunction pawnSafetyOnPosition(): number { return 1; }\nvoid pawnSafetyOnPosition;\n`,
      "packages/runtime/src/semantic-validation-receipt.generated.ts": read("packages/runtime/src/semantic-validation-receipt.generated.ts").replace(/"receiptSha256": "[a-f0-9]+"/u, `"receiptSha256": "${"0".repeat(64)}"`),
    };
    const built = buildContract({ root: ROOT, overrides }).declarations;
    expect(overrides["packages/runtime/src/semantic-validation-receipt.generated.ts"]).not.toBe(read("packages/runtime/src/semantic-validation-receipt.generated.ts"));
    expect(built).toEqual(GENERATED_CAPABILITY_DECLARATIONS);
    expect(compareDeclarations(GENERATED_CAPABILITY_DECLARATIONS, built)).toEqual([]);
    expect(() => assertDeclarationUpdate(GENERATED_CAPABILITY_DECLARATIONS, built)).not.toThrow();
  }, SLOW);

  it("rejects same-version public contract edits and removals before a generator can write", () => {
    const original = generated();
    for (const patch of [{ availability: "provider" as const }, { dependsOn: [i("fixture.dependency")] }, { subject: "error_contract" as const }]) {
      expect(() => assertDeclarationUpdate([original], [{ ...original, ...patch }])).toThrow(/CAPABILITY_DECLARATION_REWRITTEN/u);
    }
    expect(() => assertDeclarationUpdate([original], [])).toThrow(/CAPABILITY_DECLARATION_REWRITTEN/u);
    expect(() => assertDeclarationUpdate([original], [original, generated({ id: i("fixture.subject", 2), semanticsDigest: "contract:fixture.subject@i:2" })])).not.toThrow();
  });
});

describe("criterion 4 and 6 — the census has independent roots", () => {
  const authority = readAuthority(ROOT);
  const clean = buildContract({ root: ROOT });
  const census = (input: Partial<Parameters<typeof runCensus>[0]>) => runCensus({
    schema,
    authority,
    index: clean.index,
    declarations: clean.declarations,
    applicability: clean.applicability,
    expectedSubjects: censusSubjects(ROOT, authority, clean.applicability),
    ...input,
  }).map((finding) => finding.code);

  it("is green on the tree", () => {
    expect(census({})).toEqual([]);
  }, SLOW);

  it("names an unannotated schema member", () => {
    const widened = structuredClone(schema) as { properties: { mode: { enum: string[] } } };
    widened.properties.mode.enum.push("puzzle");
    expect(census({ schema: widened })).toContain("SCHEMA_CAPABILITY_UNANNOTATED");
  });

  it("names a missing named root, an extra declaration and a count-preserving public-id swap", () => {
    const bogus = structuredClone(authority);
    (bogus.meaningAuthority.constantRoots as { capability: string; sites: string[] }[])[0]!.sites = ["packages/runtime/src/grade.ts#NO_SUCH_SYMBOL"];
    expect(census({ authority: bogus })).toContain("CAPABILITY_NAMED_ROOT_MISSING");
    expect(census({ declarations: [...clean.declarations, { ...clean.declarations[0]!, subjectId: "fixture.extra", id: i("fixture.extra") }] })).toContain("CAPABILITY_DECLARATION_EXTRA");
    const rows = [...clean.applicability] as CapabilityApplicability[];
    const a = rows.findIndex((row) => row.capability?.id === "phase.opening");
    const b = rows.findIndex((row) => row.capability?.id === "phase.endgame");
    [rows[a], rows[b]] = [{ ...rows[a]!, capability: rows[b]!.capability! }, { ...rows[b]!, capability: rows[a]!.capability! }];
    expect(rows).toHaveLength(clean.applicability.length);
    expect(census({ applicability: rows })).toContain("CAPABILITY_IDENTITY_MISMATCH");
  });

  it("an undeclared interpreter — a new exhaustive switch, or a removed evidence-ref site — is an orphan", () => {
    const withSwitch = new CapabilitySourceIndex({ root: ROOT, overrides: {
      "apps/server/src/capability/stamp-cli.ts": `${read("apps/server/src/capability/stamp-cli.ts")}
import type { StructuralFeature } from "@chess-tabiya/schema/drill-pack";
export function secondFeatureReader(feature: StructuralFeature): number {
  if (feature.kind === "outpost") return 1;
  if (feature.kind === "open_file") return 2;
  return 0;
}
`,
    } });
    expect(census({ index: withSwitch })).toContain("CAPABILITY_INTERPRETER_ORPHAN");
    const withoutEvidenceRefs = structuredClone(authority);
    const success = withoutEvidenceRefs.meaningAuthority.interpreterRoots.find((row) => row.subject === "SuccessCondition") as unknown as { sites: string[] };
    success.sites = success.sites.filter((site) => !site.endsWith("#conditionEvidenceRefs"));
    expect(census({ authority: withoutEvidenceRefs })).toContain("CAPABILITY_INTERPRETER_ORPHAN");
  }, SLOW);
});

describe("criterion 5 — version literals have a typed boundary", () => {
  it("fails current authority from a suffixed literal and passes legacy fixtures and schema strings", () => {
    const index = new CapabilitySourceIndex({ root: ROOT, overrides: {
      "apps/server/src/capability/stamp-cli.ts": `${read("apps/server/src/capability/stamp-cli.ts")}
import { capabilityId as makeId, legacyCapabilityFixture as legacy, type CapabilityId as Id } from "@chess-tabiya/schema";
export const forbiddenCall = makeId("mate-proof@1");
export const forbiddenObject: Id = { id: "tablebase.probe@v1", version: { kind: "integer", value: 1 } };
export const permittedLegacy = legacy("mate-proof@1");
export const unrelatedSchema = "tabiya.sourcing.evidence.v1";
`,
    } });
    const violations = index.capabilityLiteralViolations();
    expect(violations.filter((line) => line.startsWith("apps/server/src/capability/stamp-cli.ts"))).toHaveLength(2);
    expect(new CapabilitySourceIndex({ root: ROOT }).capabilityLiteralViolations()).toEqual([]);
  }, SLOW);
});

describe("criterion 7 — requirement scope", () => {
  it("a pack's derived projections are only those the three pack-meaning consumers accept", () => {
    const stamped = withDerivedRequires({ ...example, guard: { conditions: [{ kind: "engine_eval_swing", cp: 150 }, { kind: "tablebase_category_regression" }] } });
    const projections = stamped.requires.filter((row) => CAPABILITY_REGISTRY.byKey.get(capabilityKey(row))?.subject === "projection").map((row) => row.id);
    expect(projections).toEqual(expect.arrayContaining(["live.stockfish.eval", "live.syzygy.category"]));
    const scope = new Set(["authored.structural_condition.input", "derived.structural.predicate_result", "live.stockfish.eval", "live.syzygy.category", "live.syzygy.distance"]);
    for (const id of projections) expect(scope.has(id) || id.startsWith("rules.structural.predicate."), id).toBe(true);
  });

  it("an applicability dependency on an out-of-scope projection is refused", () => {
    const authority = readAuthority(ROOT);
    const widened = structuredClone(authority) as unknown as { memberDependencies: { rows: { capability: string; dependsOn: string[] }[] } };
    widened.memberDependencies.rows.push({ capability: "structuralFeature.outpost", dependsOn: ["live.stockfish.pv"] });
    expect(() => buildContract({ root: ROOT, authority: widened as unknown as typeof authority })).toThrow(/CAPABILITY_SCOPE_VIOLATION/u);
  }, SLOW);
});

describe("criterion 8 — semantic and deployment state do not alias", () => {
  it("every legacy row maps through the total table and keeps its real subject kind", () => {
    const compiled = compileLegacyDispositions({ reader: repositoryReader(ROOT) });
    const kinds = new Set(compiled.map((row) => row.disposition.kind));
    for (const kind of ["active", "withdrawn", "unmeasured", "impossible", "refused", "refuted", "pending_decision", "unimplemented", "deprecated"]) expect(kinds.has(kind as never), kind).toBe(true);
    expect(CAPABILITY_REGISTRY.current("assistance.arrows")?.subject).toBe("assistance_surface");
    expect(CAPABILITY_REGISTRY.current("error.SIMULATE_BUDGET_EXCEEDED")?.subject).toBe("error_contract");
    expect(CAPABILITY_REGISTRY.current("trajectory.leg_opponent_policy")?.subject).toBe("verdict_producer");
    expect(CAPABILITY_REGISTRY.current("trajectory.leg_shapes")?.subject).toBe("resolved_reference");
    expect(CAPABILITY_REGISTRY.current("opponentPolicy.mode.human_common")?.subject).toBe("vocabulary_arm");
  });

  it("publishes configured active/deprecated rows only, with a separate reachability", () => {
    const support = runtimeSupportedCapabilities({ providers: { ...ALL_PROVIDERS_CONFIGURED, tablebase: false } });
    const projection = projectPackCapabilities(support, { unreachable: { analysis: { retryAfterMs: 5000 } } });
    const byId = new Map(projection.rows.map((row) => [row.capability.id, row]));
    expect(byId.has("live.syzygy.category")).toBe(false);
    expect(byId.get("live.stockfish.eval")?.reachability).toEqual({ kind: "temporarily_unavailable", providerFamily: "analysis", retryAfterMs: 5000 });
    expect(byId.get("structuralFeature.outpost")?.reachability).toEqual({ kind: "supported" });
    expect(byId.get("successCondition.plan_consequence")?.semanticDisposition).toEqual({ kind: "deprecated", successor: i("successCondition.structural_feature"), reasonCode: "superseded" });
    for (const absent of ["opponentPolicy.mode.plan_defense", "assistance.arrows", "error.SIMULATE_BUDGET_EXCEEDED"]) expect(byId.has(absent), absent).toBe(false);
    for (const row of projection.rows) if (row.availability !== "provider") expect(row.reachability.kind).toBe("supported");
    // The server serializes and the web parses the same authority.
    expect(parsePackCapabilitiesPublicProjectionV1(JSON.parse(JSON.stringify(projection)))).toEqual(projection);
  });
});

describe("criterion 9 — every history resolves", () => {
  const decl = (id: string, version: number): GeneratedCapabilityDeclaration => ({
    subjectId: id, id: i(id, version), subject: "verdict_producer",
    sources: [{ kind: "ast", site: { kind: "symbol", module: "packages/runtime/src/grade.ts", symbol: "moveQualityGrade" } }],
    dependsOn: [], semanticsDigest: `sha256:${id}${version}`, availability: "local",
  });
  const v = (value: number) => ({ kind: "integer" as const, value });
  const history = (rows: CapabilityLifecycleRow["versions"]): CapabilityLifecycleRow[] => [{ subjectId: "h", versions: rows }];

  it("crosses 1→2, 1→2→3 and withdrawal with and without a successor", () => {
    expect(buildCapabilityRegistry([decl("h", 1), decl("h", 2)], history([{ version: v(1), disposition: { kind: "deprecated", successor: i("h", 2), reason: "r", reasonCode: "superseded" } }, { version: v(2), disposition: { kind: "active" } }])).current("h")?.id).toEqual(i("h", 2));
    expect(buildCapabilityRegistry([decl("h", 1), decl("h", 2), decl("h", 3)], history([
      { version: v(1), disposition: { kind: "withdrawn", reason: "r", removedAt: "0.30", successor: i("h", 2) } },
      { version: v(2), disposition: { kind: "deprecated", successor: i("h", 3), reason: "r", reasonCode: "superseded" } },
      { version: v(3), disposition: { kind: "active" } },
    ])).histories[0]!.declarations).toHaveLength(3);
    expect(buildCapabilityRegistry([decl("h", 1), decl("h", 2)], history([
      { version: v(1), disposition: { kind: "withdrawn", reason: "r", removedAt: "0.30", successor: null, noSuccessor: { kind: "no_migration_exists", reason: "no truthful projection" } } },
      { version: v(2), disposition: { kind: "active" } },
    ])).histories).toHaveLength(1);
  });

  it.each([
    ["a bare withdrawal", history([{ version: v(1), disposition: { kind: "withdrawn", reason: "r", removedAt: "0.30", successor: null } as never }, { version: v(2), disposition: { kind: "active" } }]), /CAPABILITY_WITHDRAWAL_REFUSAL_MISSING/u],
    ["a duplicate current", history([{ version: v(1), disposition: { kind: "active" } }, { version: v(2), disposition: { kind: "active" } }]), /more than one active/u],
    ["a cross-subject successor on an obsolete row", history([{ version: v(1), disposition: { kind: "deprecated", successor: i("other"), reason: "r", reasonCode: "superseded" } }, { version: v(2), disposition: { kind: "active" } }]), /CAPABILITY_SUCCESSOR_SUBJECT_MISMATCH/u],
    ["a cycle", history([{ version: v(1), disposition: { kind: "deprecated", successor: i("h", 2), reason: "r", reasonCode: "superseded" } }, { version: v(2), disposition: { kind: "deprecated", successor: i("h", 1), reason: "r", reasonCode: "superseded" } }]), /CAPABILITY_HISTORY_INVALID|CAPABILITY_SUCCESSOR_CYCLE/u],
  ])("refuses %s", (_label, lifecycle, error) => {
    expect(() => buildCapabilityRegistry([decl("h", 1), decl("h", 2), decl("other", 1)], lifecycle)).toThrow(error);
  });

  it("refuses a history mixing integer and semver arms", () => {
    const semver = { ...decl("h", 1), id: semverCapabilityId("h", "0.1.0") };
    expect(() => buildCapabilityRegistry([decl("h", 1), semver], [])).toThrow(/CAPABILITY_VERSION_ARM_MIXED/u);
  });
});

describe("criterion 10 — every legacy refusal migrates, and every refusal has authority", () => {
  const reader = repositoryReader(ROOT);
  const without = (predicate: (row: LegacyRefusalMigration) => boolean) => LEGACY_REFUSED_MIGRATION.filter((row) => !predicate(row));
  const replace = (instrument: string, change: (row: LegacyRefusalMigration) => LegacyRefusalMigration) => LEGACY_REFUSED_MIGRATION.map((row) => (row.legacy.register === "capability" && row.legacy.instrument === instrument ? change(row) : row));

  it("compiles the exact refused population", () => {
    expect(() => compileLegacyDispositions({ reader })).not.toThrow();
    expect(() => compileLegacyDispositions({ reader, migration: without((row) => row.legacy.register === "capability" && row.legacy.capability === "dtm") })).toThrow(/CAPABILITY_REFUSAL_MIGRATION_MISSING/u);
    expect(() => compileLegacyDispositions({ reader, migration: [...LEGACY_REFUSED_MIGRATION, { legacy: { register: "capability", instrument: "Stockfish", capability: "renamed" }, destinations: [] }] })).toThrow(/CAPABILITY_REFUSAL_MIGRATION_EXTRA/u);
  });

  it("refuses an owner ruling that is not ⚖, an unlisted intent anchor, and an unaccepted or unresolved RFC criterion", () => {
    const refused = (authority: never) => replace("Syzygy", (row) => ({ ...row, destinations: [{ ...row.destinations[0]!, disposition: { kind: "refused", reason: "r", authority } }] }));
    expect(() => compileLegacyDispositions({ reader, migration: refused({ kind: "owner_ruling", ledgerRow: "D1037" } as never) })).toThrow(/CAPABILITY_REFUSAL_AUTHORITY_INVALID/u);
    expect(() => compileLegacyDispositions({ reader, migration: refused({ kind: "protected_intent", document: "design/BACKLOG.md", anchor: "D1037" } as never) })).toThrow(/CAPABILITY_REFUSAL_AUTHORITY_INVALID/u);
    const draftReader = {
      read: (path: string) => path === "rfc/README.md"
        ? reader.read(path)?.split("\n").map((line) => line.startsWith("| `pack-training-forms.md`")
          ? "| `pack-training-forms.md` | **draft** | negative authority fixture |"
          : line).join("\n")
        : reader.read(path),
    };
    expect(() => compileLegacyDispositions({ reader: draftReader, migration: refused({ kind: "accepted_rfc", document: "rfc/pack-training-forms.md", criterion: "1" } as never) })).toThrow(/CAPABILITY_REFUSAL_AUTHORITY_INVALID/u);
    expect(() => compileLegacyDispositions({ reader, migration: refused({ kind: "accepted_rfc", document: "rfc/learner-rating.md", criterion: "R99" } as never) })).toThrow(/CAPABILITY_REFUSAL_AUTHORITY_INVALID/u);
    expect(() => compileLegacyDispositions({ reader, migration: refused({ kind: "owner_ruling", ledgerRow: "D1077" } as never) })).not.toThrow();
  });

  it("keeps the non-refusal states distinct, the cohort limit refused under R10(a), and retryVariants split", () => {
    const compiled = compileLegacyDispositions({ reader });
    const find = (capability: string) => compiled.find((row) => row.legacy.register === "capability" && row.legacy.capability === capability)!.disposition.kind;
    expect(find("MultiPV > 1 outside enumerate and the all-legal legal-root measurement")).toBe("pending_decision");
    expect(find("bestmove / MultiPV rank / bestline")).toBe("unimplemented");
    expect(find("band-conditioned resistance")).toBe("refuted");
    expect(find("Move Overhead")).toBe("unmeasured");
    expect(find("cross-learner comparison outside a joined cohort")).toBe("refused");
    expect(find("cohort standing over rated results")).toBe("active");
    const retry = compiled.filter((row) => row.legacy.register === "format" && row.legacy.pointer === "/retryVariants").map((row) => [row.capability.id, row.disposition.kind]);
    expect(retry).toEqual([["catalogue.variant_relation", "deprecated"], ["retryVariants.scheduler", "active"]]);
  });
});

describe("criteria 11 and 12 — plan shape, apply readiness and the population tripwire", () => {
  const scratch = mkdtempSync(join(tmpdir(), "tabiya-migration-"));
  afterAll(() => undefined);
  const emptyRoots = { draftPacks: [], candidatePacks: [], draftSidecars: [], candidateSourcing: [], shapes: [], principles: [] };
  const zero = { draftPacks: 0, candidatePacks: 0, draftSidecars: 0, candidateSourcing: 0, shapes: 0, principles: 0 };
  const inputs = (roots: MigrationPopulation["roots"], documents: Record<string, unknown>, registry = CAPABILITY_REGISTRY): PlanInputs => ({
    root: scratch,
    schema,
    population: { roots },
    readDocument: (path) => documents[path],
    registry,
    baseline: { ...zero, draftPacks: roots.draftPacks.length } as unknown as typeof MIGRATION_POPULATION_BASELINE,
  });
  const unstamped = structuredClone(example);
  delete unstamped.requires;

  it("empty, mechanical-only and judgement-bearing plans all pass the shape check; only judgement blocks apply", () => {
    const empty = buildMigrationPlan(inputs(emptyRoots, {}));
    assertMigrationPlanShape(empty);
    expect(migrationApplyReadiness(empty).ready).toBe(true);

    mkdirSync(join(scratch, "p"), { recursive: true });
    writeFileSync(join(scratch, "p", "a.json"), `${JSON.stringify(unstamped, null, 2)}\n`);
    const mechanical = buildMigrationPlan(inputs({ ...emptyRoots, draftPacks: ["p/a.json"] }, { "p/a.json": unstamped }));
    assertMigrationPlanShape(mechanical);
    expect(mechanical.mechanical.map((row) => row.edit)).toEqual(["stamp_requires"]);
    expect(migrationApplyReadiness(mechanical).ready).toBe(true);

    // A registry where the example's required `mode.plan@1` has been superseded by `@2`.
    const bumped = buildCapabilityRegistry(
      [...GENERATED_CAPABILITY_DECLARATIONS, { ...GENERATED_CAPABILITY_DECLARATIONS.find((row) => row.subjectId === "mode.trajectory")!, id: i("mode.trajectory", 2), semanticsDigest: "sha256:bumped" }],
      [...CAPABILITY_LIFECYCLE, { subjectId: "mode.trajectory", versions: [
        { version: { kind: "integer", value: 1 }, disposition: { kind: "deprecated", successor: i("mode.trajectory", 2), reason: "fixture", reasonCode: "superseded" } },
        { version: { kind: "integer", value: 2 }, disposition: { kind: "active" } },
      ] }],
    );
    const stamped = withDerivedRequires(unstamped);
    writeFileSync(join(scratch, "p", "b.json"), `${JSON.stringify(stamped, null, 2)}\n`);
    const judgement = buildMigrationPlan(inputs({ ...emptyRoots, draftPacks: ["p/b.json"] }, { "p/b.json": stamped }, bumped));
    assertMigrationPlanShape(judgement);
    expect(judgement.judgement.map((row) => [row.document, capabilityKey(row.capability), capabilityKey(row.successor)])).toEqual([["p/b.json", "mode.trajectory@i:1", "mode.trajectory@i:2"]]);
    expect(judgement.transitions).toEqual([{ subjectId: "mode.trajectory", from: [i("mode.trajectory", 1)], to: i("mode.trajectory", 2) }]);
    const readiness = migrationApplyReadiness(judgement);
    expect(readiness.ready).toBe(false);
    const before = readFileSync(join(scratch, "p", "b.json"), "utf8");
    expect(() => applyMigrationPlan(judgement, inputs({ ...emptyRoots, draftPacks: ["p/b.json"] }, { "p/b.json": stamped }, bumped), { documents: "all" })).toThrow(/MIGRATION_NOT_READY/u);
    expect(readFileSync(join(scratch, "p", "b.json"), "utf8")).toBe(before);
    expect(EXIT_NOT_READY).not.toBe(EXIT_MALFORMED);
  });

  it("a withdrawn-without-successor requirement becomes explicit refusal debt, never a silent drop", () => {
    const withdrawn = buildCapabilityRegistry(GENERATED_CAPABILITY_DECLARATIONS, [...CAPABILITY_LIFECYCLE.filter((row) => row.subjectId !== "mode.trajectory"), { subjectId: "mode.trajectory", versions: [
      { version: { kind: "integer", value: 1 }, disposition: { kind: "withdrawn", reason: "fixture", removedAt: "0.30", successor: null, noSuccessor: { kind: "no_migration_exists", reason: "fixture" } } },
    ] }]);
    const stamped = withDerivedRequires(unstamped);
    const plan = buildMigrationPlan(inputs({ ...emptyRoots, draftPacks: ["p/c.json"] }, { "p/c.json": stamped }, withdrawn));
    expect(plan.refusals.map((row) => capabilityKey(row.capability))).toEqual(["mode.trajectory@i:1"]);
    expect(migrationApplyReadiness(plan).ready).toBe(false);
  });

  it("criterion 12: a moved population reddens the plan", () => {
    const roots = { ...emptyRoots, shapes: Array.from({ length: MIGRATION_POPULATION_BASELINE.shapes + 1 }, (_, index) => `s/${index}.json`) };
    expect(() => assertPopulationBaseline({ roots: { ...roots, draftPacks: Array.from({ length: MIGRATION_POPULATION_BASELINE.draftPacks }, () => "x"), candidatePacks: Array.from({ length: MIGRATION_POPULATION_BASELINE.candidatePacks }, () => "x"), draftSidecars: Array.from({ length: MIGRATION_POPULATION_BASELINE.draftSidecars }, () => "x"), candidateSourcing: Array.from({ length: MIGRATION_POPULATION_BASELINE.candidateSourcing }, () => "x"), principles: Array.from({ length: MIGRATION_POPULATION_BASELINE.principles }, () => "x") } })).toThrow(MigrationPopulationError);
  });
});

describe("criterion 14 — normative convention text is a public contract, not a code hash", () => {
  it("changed convention text fails at its own version, with zero unrelated incompatibilities", async () => {
    const { BREADTH_CONVENTION_TEXT, SEMANTIC_CONVENTION_TEXT } = await import("../../../../packages/runtime/src/evidence-catalog.js");
    const edited = { BREADTH_CONVENTION_TEXT: { ...BREADTH_CONVENTION_TEXT, pressureLine: `${BREADTH_CONVENTION_TEXT.pressureLine}.` }, SEMANTIC_CONVENTION_TEXT };
    const built = buildContract({ root: ROOT, conventions: edited }).declarations;
    const findings = compareDeclarations(GENERATED_CAPABILITY_DECLARATIONS, built);
    expect(findings).toEqual([{ key: "pressure-line@i:1", kind: "changed" }]);
    expect(() => assertDeclarationUpdate(GENERATED_CAPABILITY_DECLARATIONS, built)).toThrow(/CAPABILITY_DECLARATION_REWRITTEN: pressure-line@i:1/u);
  }, SLOW);
});

describe("criterion 15 — the claim-binding handoff is compile-time only", () => {
  it("claim.binding is a structured generic identity with no sidecar consumer behaviour", () => {
    expect(CLAIM_BINDING_CAPABILITY_ID).toEqual({ id: "claim.binding", version: { kind: "integer", value: 1 } });
    expect(CAPABILITY_REGISTRY.current("claim.binding")?.subject).toBe("contract_identity");
    for (const value of [i("claim.binding", 2), semverCapabilityId("claim.binding", "2.0.0")]) expect(JSON.parse(JSON.stringify(value))).toEqual(value);
    const sources = ["apps/server/src/sourcing/types.ts", "apps/server/src/sourcing/claim-binding.ts", "apps/server/src/sourcing/ledger-validation.ts"].map(read).join("\n");
    expect(sources).not.toMatch(/CLAIM_BINDING_VERSION_UNSUPPORTED|claim-semantic-anchors/u);
    for (const path of ["apps/server/src/capability/pack-capabilities.ts", "apps/server/src/capability/contract.ts", "apps/server/src/capability/declarations.ts", "packages/runtime/src/capability/registry.ts"]) expect(read(path)).not.toMatch(/claim-semantic-anchors/u);
  });
});

describe("criterion 16 — unavailability resolves to exactly one of two states by cause", () => {
  const guarded = withDerivedRequires({ ...example, id: "needs-analysis", feedbackPolicy: "immediate_guard", guard: { conditions: [{ kind: "engine_eval_swing", cp: 150 }] } });

  it("an unsupported capability is absent, the pack is refused at registration, and the boot survives", async () => {
    const support = runtimeSupportedCapabilities({ providers: { ...ALL_PROVIDERS_CONFIGURED, analysis: false } });
    expect(projectPackCapabilities(support).rows.some((row) => row.capability.id === "live.stockfish.eval")).toBe(false);
    const registry = await PackRegistry.fromDocuments([{ source: "needs-analysis", value: guarded }, { source: "plain", value: example }], { capabilities: support });
    expect(registry.list().map((row) => row.id)).toEqual([String(example.id)]);
    expect(registry.capabilityRefusals().map((row) => [row.packId, row.unmet.map(capabilityKey)])).toEqual([["needs-analysis", ["live.stockfish.eval@i:1"]]]);
    let refusal: unknown;
    try { registry.assertSupported(guarded as never); } catch (error) { refusal = error; }
    expect(refusal).toBeInstanceOf(ServerError);
    expect((refusal as ServerError).code).toBe("PACK_CAPABILITY_UNSUPPORTED");
    expect(read("apps/server/src/rest.ts")).toMatch(/error\.code === "PACK_CAPABILITY_UNSUPPORTED"/u);
  });

  it("a configured provider that is down is present and transient; recovery restores it; the pack stays registered", async () => {
    const support = runtimeSupportedCapabilities();
    const registry = await PackRegistry.fromDocuments([{ source: "needs-analysis", value: guarded }], { capabilities: support });
    const down = projectPackCapabilities(support, { unreachable: { analysis: {} } }).rows.find((row) => row.capability.id === "live.stockfish.eval")!;
    expect(down.reachability).toEqual({ kind: "temporarily_unavailable", providerFamily: "analysis" });
    const recovered = projectPackCapabilities(support).rows.find((row) => row.capability.id === "live.stockfish.eval")!;
    expect(recovered.reachability).toEqual({ kind: "supported" });
    expect(registry.get("needs-analysis")?.document.requires).toEqual(guarded.requires);
    const local = projectPackCapabilities(support, { unreachable: { analysis: {}, opponent: {}, tablebase: {}, corpus: {} } }).rows.filter((row) => row.availability === "local" || row.availability === "build_time");
    expect(local.every((row) => row.reachability.kind === "supported")).toBe(true);
  });
});

describe("criteria 17 and 18 — instruments are wired; the transition is exact and single-reader", () => {
  it("make verify runs the capability instruments", () => {
    const makefile = read("Makefile");
    const software = /^verify-software:(.*)$/mu.exec(makefile)![1]!;
    for (const target of ["capability-check", "capability-census", "capability-site-check", "capability-applicability-check", "capability-lifecycle-check", "migration-plan-check"]) expect(software.split(/\s+/u)).toContain(target);
    expect(/^verify-content:(.*)$/mu.exec(makefile)![1]).toMatch(/pack-capability-check/u);
  });

  it("the live schema carries the sealed 0.30 post-conditions and `requires` emits no applicability", () => {
    const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json")) as { postConditions: { pointer: string; contains?: string; equals?: unknown }[] };
    for (const condition of transition.postConditions) {
      const value = condition.pointer.split("/").slice(1).reduce<unknown>((node, token) => (node as Record<string, unknown>)?.[token], schema);
      if (condition.contains !== undefined) expect(value as unknown[]).toContain(condition.contains);
      else expect(canonicalJson(value)).toBe(canonicalJson(condition.equals));
    }
    expect(CAPABILITY_APPLICABILITY.some((row) => row.selector.kind === "schema_member" && /capabilityRequirement|capabilityVersion|\/requires/u.test(row.selector.sourceIdentity.schemaPointer))).toBe(false);
  });

  it("there is one drill-pack reader and no legacy admission path", () => {
    const production = ["apps/server/src/pack-validation.ts", "apps/server/src/pack-schema.ts", "apps/server/src/pack-registry.ts", "apps/server/src/pack-studio.ts"].map((path) => [path, read(path)] as const);
    expect(production.filter(([, text]) => text.includes("drill_pack.schema.json")).map(([path]) => path)).toEqual(["apps/server/src/pack-schema.ts"]);
    expect(production.filter(([, text]) => /ajv\.compile\(livingSchema\(\)\)/u.test(text)).map(([path]) => path)).toEqual(["apps/server/src/pack-validation.ts"]);
    for (const [, text] of production) expect(text).not.toMatch(/drill-pack:0\.29|PACK_LEGACY_IMAGE_MISMATCH|legacyAllowlist/u);
    const unstamped = structuredClone(example);
    delete unstamped.requires;
    expect(validatePackDocument(unstamped).issues.map((row) => [row.code, row.path])).toContainEqual(["SCHEMA_REQUIRED", "/requires"]);
    const reordered = { ...example, requires: [...(example.requires as unknown[])].reverse() };
    expect(validatePackDocument(reordered).issues.map((row) => row.code)).toContain("PACK_CAPABILITY_ORDER");
    const under = { ...example, requires: (example.requires as { id: string }[]).filter((row) => row.id !== "mode.trajectory") };
    expect(validatePackDocument(under).issues.map((row) => row.code)).toContain("PACK_CAPABILITY_UNDER_DECLARED");
    const over = { ...example, requires: [...(example.requires as { id: string }[]), { id: "zz.fixture", version: { kind: "integer", value: 1 } }] };
    expect(validatePackDocument(over).issues.map((row) => row.code)).toContain("PACK_CAPABILITY_OVER_DECLARED");
    expect(validatePackDocument({ ...example, requires: [{ id: "x@1", version: { kind: "integer", value: 1 } }] }).issues.map((row) => row.code)).toContain("SCHEMA_PATTERN");
    const malformedRequires = packRequirementIssues({ ...example, requires: [{ id: "x", version: { kind: "integer", value: 1 }, extra: true }] }, { schema });
    expect(malformedRequires.map((row) => row.code)).toEqual(["PACK_CAPABILITY_INVALID"]);
    const underivable = packRequirementIssues({ ...example, shapes: ["no-such-shape"] }, { schema });
    expect(underivable.map((row) => row.code)).toEqual(["PACK_CAPABILITY_UNDERIVABLE"]);
  });
});
