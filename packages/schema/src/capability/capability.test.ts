// rfc/pack-capability-contract.md — the schema-package half of the capability contract:
// criteria 1, 3 (the derivation algorithm on its §2.7 minimum fixture), 4 (inventory and identity
// fixtures), 8 (the shared public wire parser) and 18 (identity stability).
import { readFileSync } from "node:fs";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import {
  CapabilityError,
  canonicalCapabilityRequirements,
  capabilityId,
  capabilityKey,
  compareCapabilityIds,
  legacyCapabilityFixture,
  parseCanonicalRequirements,
  parseCapabilityRequirement,
  parseLegacyCapability,
  semverCapabilityId,
} from "./types.js";
import {
  closedSchemaInventory,
  mapSchemaMembers,
  SchemaIdentityError,
  stableMemberId,
} from "./schema-members.js";
import {
  RequirementDerivationError,
  deriveRequirements,
  walkSchemaMembers,
  type CapabilityApplicability,
  type RequirementDerivationAuthority,
} from "./requirements.js";
import { parsePackCapabilitiesPublicProjectionV1 } from "./public.js";
import { CAPABILITY_APPLICABILITY, CAPABILITY_METADATA_EXCLUSIONS } from "./applicability.generated.js";

const packSchema = JSON.parse(readFileSync(new URL("../../../../schemas/drill_pack.schema.json", import.meta.url), "utf8")) as Record<string, unknown>;
const i = (id: string, value = 1) => capabilityId(id, value);

describe("criterion 1 — CapabilityId is structured", () => {
  it("reads both shipped legacy spellings into one integer arm", () => {
    expect(parseLegacyCapability("x@1")).toEqual({ id: "x", version: { kind: "integer", value: 1 } });
    expect(parseLegacyCapability("x@v1")).toEqual({ id: "x", version: { kind: "integer", value: 1 } });
  });

  it.each(["mate-proof@1", "tablebase.probe@v1", "assistance:arrows@1", "error.SIMULATE_BUDGET_EXCEEDED@1"])("crosses the real %s family", (value) => {
    const parsed = parseLegacyCapability(value);
    expect(parsed.id).toBe(value.replace(/@v?1$/u, ""));
    expect(parsed.version).toEqual({ kind: "integer", value: 1 });
  });

  it.each(["x @1", "a/b@1", "a..b@1", "x@0.1.3", "x@1@2", "x", "@1", "x@0"])("refuses %s rather than guessing", (value) => {
    expect(() => parseLegacyCapability(value)).toThrow(CapabilityError);
  });

  it("keeps the version as data: integer and semver never coerce and key without collision", () => {
    expect(capabilityKey(i("shape.x", 1))).toBe("shape.x@i:1");
    expect(capabilityKey(semverCapabilityId("shape.x", "0.1.3"))).toBe("shape.x@s:0.1.3");
    expect(() => parseCapabilityRequirement({ id: "x", version: { kind: "semver", value: "1.0.0-rc.1" } })).toThrow(CapabilityError);
    expect(() => parseCapabilityRequirement({ id: "x@1", version: { kind: "integer", value: 1 } })).toThrow(CapabilityError);
    expect(() => parseCapabilityRequirement({ id: "x", version: { kind: "integer", value: 0 } })).toThrow(CapabilityError);
    expect(legacyCapabilityFixture("x@1")).toEqual(i("x"));
  });
});

describe("§4.1 — requires is canonical artifact data", () => {
  it("orders by bytewise id, integer before semver, integers numerically, semver by component", () => {
    const rows = [semverCapabilityId("b", "0.10.0"), i("b", 10), semverCapabilityId("b", "0.9.0"), i("b", 2), i("a", 1)];
    expect(canonicalCapabilityRequirements(rows).map(capabilityKey)).toEqual(["a@i:1", "b@i:2", "b@i:10", "b@s:0.9.0", "b@s:0.10.0"]);
    expect(compareCapabilityIds(i("Z"), i("a"))).toBeLessThan(0);
  });

  it("refuses a duplicate or reordered equivalent set at the parse boundary", () => {
    const row = { id: "a", version: { kind: "integer", value: 1 } };
    expect(() => parseCanonicalRequirements([row, row])).toThrow(/PACK_CAPABILITY_DUPLICATE/u);
    expect(() => parseCanonicalRequirements([{ id: "b", version: { kind: "integer", value: 1 } }, row])).toThrow(/PACK_CAPABILITY_ORDER/u);
    expect(parseCanonicalRequirements([row, { id: "b", version: { kind: "integer", value: 1 } }])).toHaveLength(2);
  });
});

// §2.7's minimum executable fixture, run through the one derivation algorithm with a four-row table.
const fixtureSchema = {
  type: "object",
  properties: {
    guard: { type: "object" },
    objective: { type: "object", properties: { successConditions: { type: "array", items: { $ref: "#/$defs/successCondition" } } } },
    shapes: { type: "array", items: { type: "string" } },
    extra: { $ref: "#/$defs/expression" },
    other: { $ref: "#/$defs/expression" },
    colour: { enum: ["white", "black"] },
    requires: { type: "array" },
  },
  $defs: {
    successCondition: { oneOf: [{ type: "object", required: ["kind", "feature"], properties: { kind: { const: "structural_feature" }, feature: { $ref: "#/$defs/feature" } } }] },
    feature: { oneOf: [
      { type: "object", required: ["kind", "color"], properties: { kind: { const: "outpost" }, color: { enum: ["white", "black"] } } },
      { type: "object", required: ["kind", "color"], properties: { kind: { const: "isolated_pawn" }, color: { enum: ["white", "black"] } } },
      { type: "object", required: ["kind", "color"], properties: { kind: { const: "pawn_safe_square" }, color: { enum: ["white", "black"] } } },
    ] },
    expression: { oneOf: [
      { type: "object", required: ["kind", "of"], properties: { kind: { enum: ["all", "any"] }, of: { type: "array", items: { $ref: "#/$defs/expression" } } } },
      { type: "object", required: ["kind", "of"], properties: { kind: { const: "not" }, of: { $ref: "#/$defs/expression" } } },
      { type: "object", required: ["kind", "feature"], properties: { kind: { const: "feature" }, feature: { $ref: "#/$defs/feature" } } },
    ] },
  },
};

const member = (schemaPointer: string, value: string) => ({ schemaPointer, member: value });
const fixtureTable: CapabilityApplicability[] = [
  { selector: { kind: "always" }, capability: i("objective.state_machine") },
  { selector: { kind: "absent", pointer: "/guard" }, capability: i("guard.defaults") },
  { selector: { kind: "schema_member", sourceIdentity: member("/$defs/feature", "outpost") }, capability: i("structuralFeature.outpost") },
  { selector: { kind: "schema_member", sourceIdentity: member("/$defs/feature", "isolated_pawn") }, capability: i("structuralFeature.isolated_pawn") },
  { selector: { kind: "schema_member", sourceIdentity: member("/$defs/feature", "pawn_safe_square") }, capability: i("structuralFeature.pawn_safe_square") },
  { selector: { kind: "schema_member", sourceIdentity: member("/$defs/expression", "not") }, capability: i("expression.not") },
  { selector: { kind: "schema_member", sourceIdentity: member("/$defs/expression", "all") }, capability: i("expression.all") },
  { selector: { kind: "schema_member", sourceIdentity: member("/$defs/expression", "feature") }, capability: i("expression.feature") },
  { selector: { kind: "schema_member", sourceIdentity: member("/properties/colour", "white") }, capability: i("colour.white") },
  { selector: { kind: "resolved", pointer: "/shapes/*", registry: "shape", value: "shape-reference" } },
];
const fixtureDependsOn = new Map([
  ["objective.state_machine@i:1", []],
  ["guard.defaults@i:1", []],
  ["structuralFeature.outpost@i:1", [i("structuralFeature.pawn_safe_square")]],
  ["structuralFeature.isolated_pawn@i:1", []],
  ["structuralFeature.pawn_safe_square@i:1", []],
  ["expression.not@i:1", []],
  ["expression.all@i:1", []],
  ["expression.feature@i:1", []],
  ["colour.white@i:1", []],
] as const) as unknown as RequirementDerivationAuthority["dependsOn"];
const fixtureAuthority: RequirementDerivationAuthority = { schema: fixtureSchema, applicability: fixtureTable, dependsOn: fixtureDependsOn, excludedInstancePointers: ["/requires"] };
const shapeResolver = { resolve: (registry: "shape" | "principle", id: string) => (registry === "shape" && id === "maroczy-bind" ? { capability: semverCapabilityId("shape.maroczy-bind", "0.1.3"), dependencies: [i("structuralFeature.outpost")] } : undefined) };
const outpostPack = { objective: { successConditions: [{ kind: "structural_feature", feature: { kind: "outpost", color: "white" } }] } };

describe("criterion 3 — declared equals applicable closure (§2.7 minimum fixture)", () => {
  it("derives exactly the outpost/default fixture", () => {
    expect(deriveRequirements(outpostPack, fixtureAuthority, shapeResolver).requires.map(capabilityKey)).toEqual([
      "guard.defaults@i:1",
      "objective.state_machine@i:1",
      "structuralFeature.outpost@i:1",
      "structuralFeature.pawn_safe_square@i:1",
    ]);
  });

  it("omitting the helper dependency under-stamps and adding isolated_pawn over-stamps", () => {
    const derived = deriveRequirements(outpostPack, fixtureAuthority, shapeResolver).requires;
    const underStamped = derived.filter((row) => row.id !== "structuralFeature.pawn_safe_square");
    const overStamped = canonicalCapabilityRequirements([...derived, i("structuralFeature.isolated_pawn")]);
    expect(underStamped).not.toEqual(derived);
    expect(overStamped).not.toEqual(derived);
    const brokenDependsOn = new Map(fixtureDependsOn);
    brokenDependsOn.delete("structuralFeature.pawn_safe_square@i:1" as never);
    expect(() => deriveRequirements(outpostPack, { ...fixtureAuthority, dependsOn: brokenDependsOn }, shapeResolver)).toThrow(/CAPABILITY_DEPENDENCY_MISSING/u);
  });

  it("a shape reference derives the exact generated capability and its semantic closure", () => {
    expect(deriveRequirements({ guard: {}, shapes: ["maroczy-bind"] }, fixtureAuthority, shapeResolver).requires.map(capabilityKey)).toEqual([
      "objective.state_machine@i:1",
      "shape.maroczy-bind@s:0.1.3",
      "structuralFeature.outpost@i:1",
      "structuralFeature.pawn_safe_square@i:1",
    ]);
    expect(() => deriveRequirements({ shapes: ["unknown"] }, fixtureAuthority, shapeResolver)).toThrow(RequirementDerivationError);
  });

  it("a three-level nested expression and one $defs member reached through two roots both derive", () => {
    const nested = { guard: {}, extra: { kind: "not", of: { kind: "all", of: [{ kind: "not", of: { kind: "feature", feature: { kind: "isolated_pawn", color: "black" } } }] } } };
    expect(deriveRequirements(nested, fixtureAuthority, shapeResolver).requires.map(capabilityKey)).toEqual([
      "expression.all@i:1", "expression.feature@i:1", "expression.not@i:1", "objective.state_machine@i:1", "structuralFeature.isolated_pawn@i:1",
    ]);
    const twoRoots = { guard: {}, extra: { kind: "feature", feature: { kind: "outpost", color: "white" } }, other: { kind: "not", of: { kind: "feature", feature: { kind: "outpost", color: "white" } } } };
    const walked = walkSchemaMembers(fixtureSchema, "", twoRoots).filter((row) => row.member.member === "outpost").map((row) => row.instancePointer);
    expect(walked).toEqual(["/extra/feature/kind", "/other/of/feature/kind"]);
  });

  it("an equal scalar under a different schema identity derives nothing", () => {
    const derived = deriveRequirements({ guard: {}, colour: "white", extra: { kind: "feature", feature: { kind: "outpost", color: "white" } } }, fixtureAuthority, shapeResolver).requires.map(capabilityKey);
    expect(derived.filter((key) => key.startsWith("colour."))).toEqual(["colour.white@i:1"]);
    expect(walkSchemaMembers(fixtureSchema, "", { extra: { kind: "feature", feature: { kind: "outpost", color: "white" } } }).map((row) => row.member.schemaPointer)).not.toContain("/properties/colour");
  });

  it("marking recursive schema identities visited globally would skip the nested instance (positive control)", () => {
    const nested = { extra: { kind: "not", of: { kind: "not", of: { kind: "feature", feature: { kind: "outpost", color: "white" } } } } };
    const ours = walkSchemaMembers(fixtureSchema, "", nested).filter((row) => row.member.member === "not");
    expect(ours).toHaveLength(2);
    const globallyVisited = new Set(ours.map((row) => row.member.schemaPointer));
    expect(globallyVisited.size).toBe(1);
  });

  it("capability metadata never emits a capability", () => {
    const derived = deriveRequirements({ guard: {}, requires: [{ id: "colour", version: { kind: "integer", value: 1 } }], colour: "black" }, fixtureAuthority, shapeResolver).requires;
    expect(derived.map(capabilityKey)).toEqual(["objective.state_machine@i:1"]);
  });
});

describe("criterion 4 / 18 — the closed inventory and stable identity", () => {
  const threeMember = { $defs: { phase: { enum: ["opening", "middlegame", "endgame"] } } };

  it("maps every member of a three-member enum, and only those", () => {
    const inventory = closedSchemaInventory(threeMember);
    expect(inventory.rows).toEqual([
      { schemaPointer: "/$defs/phase", member: "endgame" },
      { schemaPointer: "/$defs/phase", member: "middlegame" },
      { schemaPointer: "/$defs/phase", member: "opening" },
    ]);
    expect(mapSchemaMembers(threeMember, inventory).map((row) => row.id)).toEqual(["phase.endgame", "phase.middlegame", "phase.opening"]);
    const missing = { rows: inventory.rows.slice(1) };
    expect(missing.rows).not.toEqual(closedSchemaInventory(threeMember).rows);
    expect(stableMemberId(threeMember, { schemaPointer: "/$defs/phase", member: "opening" })).not.toBe(stableMemberId(threeMember, { schemaPointer: "/$defs/other", member: "opening" }));
  });

  it("recognises value unions (const and enum discriminators) and key unions the v1 algorithm dropped", () => {
    const inventory = closedSchemaInventory(packSchema, CAPABILITY_METADATA_EXCLUSIONS);
    const ids = new Set(mapSchemaMembers(packSchema, inventory).map((row) => row.id));
    for (const id of ["structuralExpression.not", "structuralExpression.feature", "structuralExpression.plan_signature", "structuralExpression.all", "transitionExpression.position", "simpleTrigger.atStart", "simpleTrigger.fenPredicate", "objectiveGrading.assessedBy.syzygy", "windowTrigger.atWindow.verdict", "structuralFeature.outpost"]) {
      expect(ids.has(id), id).toBe(true);
    }
    expect([...ids].some((id) => /shape-[0-9a-f]{12}|\boneOf\b/u.test(id))).toBe(false);
  });

  it("branch reorder and $defs relocation preserve identity; a member rename changes it", () => {
    const schema = { $defs: { feature: { oneOf: [
      { type: "object", required: ["kind", "color"], properties: { kind: { const: "outpost" }, color: { enum: ["white", "black"] } } },
      { type: "object", required: ["kind"], properties: { kind: { const: "open_file" } } },
    ] } } };
    const reordered = { $defs: { feature: { oneOf: [schema.$defs.feature.oneOf[1], schema.$defs.feature.oneOf[0]] } } };
    const relocated = { $defs: { nested: { $defs: { feature: schema.$defs.feature } } } };
    const renamed = structuredClone(schema);
    (renamed.$defs.feature.oneOf[0]!.properties.kind as { const: string }).const = "outpost_square";
    const ids = (value: unknown) => mapSchemaMembers(value, closedSchemaInventory(value)).map((row) => row.id).sort();
    expect(ids(reordered)).toEqual(ids(schema));
    expect(ids(relocated)).toEqual(ids(schema));
    expect(ids(schema)).toContain("feature.kind-outpost.color.white");
    expect(ids(renamed)).not.toEqual(ids(schema));
  });

  it("a collision is a hard failure, never an implementer-chosen suffix", () => {
    const colliding = { properties: { a: { properties: { b: { enum: ["c"] } } } }, $defs: { a: { properties: { b: { enum: ["c"] } } } } };
    expect(() => mapSchemaMembers(colliding, closedSchemaInventory(colliding))).toThrow(SchemaIdentityError);
    expect(() => mapSchemaMembers(colliding, closedSchemaInventory(colliding))).toThrow(/CAPABILITY_IDENTITY_COLLISION/u);
  });

  it("strict AJV rejects a capability keyword added to the pack schema", () => {
    const ajv = new Ajv2020({ strict: true });
    const withKeyword = structuredClone(packSchema) as Record<string, unknown>;
    (withKeyword.properties as Record<string, Record<string, unknown>>).mode!["x-capability"] = "mode";
    expect(() => ajv.compile(withKeyword)).toThrow();
  });

  it("the generated applicability image maps every live closed member exactly once", () => {
    const inventory = closedSchemaInventory(packSchema, CAPABILITY_METADATA_EXCLUSIONS);
    const members = CAPABILITY_APPLICABILITY.filter((row) => row.selector.kind === "schema_member");
    expect(members).toHaveLength(inventory.rows.length);
    for (const exclusion of CAPABILITY_METADATA_EXCLUSIONS) {
      expect(members.some((row) => row.selector.kind === "schema_member" && row.selector.sourceIdentity.schemaPointer.startsWith(exclusion))).toBe(false);
    }
  });
});

describe("criterion 8 — the one public wire authority", () => {
  const active = (id: string, availability = "local", reachability: unknown = { kind: "supported" }) => ({ capability: { id, version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "active" }, availability, reachability });
  const projection = (rows: unknown[]) => ({ protocol: "tabiya.pack-capabilities", protocolVersion: 1, rows });

  it("round-trips every lawful semantic/availability/reachability triple", () => {
    for (const availability of ["local", "recorded", "provider", "build_time"]) {
      expect(parsePackCapabilitiesPublicProjectionV1(projection([active("a", availability)])).rows).toHaveLength(1);
    }
    const transient = active("a", "provider", { kind: "temporarily_unavailable", providerFamily: "tablebase", retryAfterMs: 1000 });
    expect(parsePackCapabilitiesPublicProjectionV1(projection([transient])).rows[0]!.reachability.kind).toBe("temporarily_unavailable");
    const deprecated = { ...active("a"), semanticDisposition: { kind: "deprecated", successor: { id: "b", version: { kind: "integer", value: 1 } }, reasonCode: "superseded" } };
    expect(parsePackCapabilitiesPublicProjectionV1(projection([deprecated, active("b")])).rows).toHaveLength(2);
  });

  it.each([
    ["a transient local row", [active("a", "local", { kind: "temporarily_unavailable", providerFamily: "analysis" })]],
    ["a transient recorded row", [active("a", "recorded", { kind: "temporarily_unavailable", providerFamily: "analysis" })]],
    ["a transient build-time row", [active("a", "build_time", { kind: "temporarily_unavailable", providerFamily: "analysis" })]],
    ["an unknown field", [{ ...active("a"), providerId: "stockfish-analysis" }]],
    ["an unsafe reason", [{ ...active("a"), semanticDisposition: { kind: "deprecated", successor: { id: "a", version: { kind: "integer", value: 2 } }, reasonCode: "operator said so" } }]],
    ["an unsafe provider detail", [active("a", "provider", { kind: "temporarily_unavailable", providerFamily: "analysis", endpoint: "http://engine" })]],
    ["a refused semantic disposition", [{ ...active("a"), semanticDisposition: { kind: "refused" } }]],
    ["a duplicate row", [active("a"), active("a")]],
    ["bad order", [active("b"), active("a")]],
    ["a successor absent from the set", [{ ...active("a"), semanticDisposition: { kind: "deprecated", successor: { id: "z", version: { kind: "integer", value: 1 } }, reasonCode: "superseded" } }]],
  ])("refuses %s", (_label, rows) => {
    expect(() => parsePackCapabilitiesPublicProjectionV1(projection(rows as unknown[]))).toThrow(/PACK_CAPABILITIES_PROJECTION_INVALID|CAPABILITY_/u);
  });

  it("refuses an unknown protocol version", () => {
    expect(() => parsePackCapabilitiesPublicProjectionV1({ protocol: "tabiya.pack-capabilities", protocolVersion: 2, rows: [] })).toThrow();
  });
});
