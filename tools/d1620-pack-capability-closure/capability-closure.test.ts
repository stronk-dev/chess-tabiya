// DISPOSABLE research harness — D1620/D1621/D1622. Not production code.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { FORMAT_DISPOSITIONS } from "../../packages/schema/src/drill-pack/dispositions.js";
import { CAPABILITY_DISPOSITIONS } from "../../apps/server/src/capabilities.js";

type Site =
  | { readonly kind: "symbol"; readonly symbol: string }
  | { readonly kind: "discriminant_arm"; readonly owner: string; readonly property: string; readonly value: string };

interface Declaration {
  readonly id: string;
  readonly sites: readonly Site[];
  readonly dependsOn: readonly string[];
}

interface RequirementRule {
  readonly selector:
    | { readonly kind: "literal"; readonly property: string; readonly value: string }
    | { readonly kind: "absent"; readonly rootProperty: string };
  readonly capability: string;
}

const STRUCTURE = resolve("packages/runtime/src/structure.ts");
const currentSource = readFileSync(STRUCTURE, "utf8");

function sourceFile(source: string): ts.SourceFile {
  return ts.createSourceFile(STRUCTURE, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function namedFunction(root: ts.SourceFile, name: string): ts.FunctionDeclaration {
  const found = root.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === name);
  if (found === undefined) throw new TypeError(`missing function ${name}`);
  return found;
}

function discriminantArm(root: ts.SourceFile, owner: string, property: string, value: string): ts.IfStatement {
  const candidates: ts.IfStatement[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIfStatement(node) && ts.isBinaryExpression(node.expression)) {
      const { left, operatorToken, right } = node.expression;
      const matches = operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
        && ts.isPropertyAccessExpression(left)
        && left.name.text === property
        && ts.isStringLiteral(right)
        && right.text === value;
      if (matches) candidates.push(node);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(namedFunction(root, owner), visit);
  if (candidates.length !== 1) throw new TypeError(`expected one ${owner}.${property} === ${value} arm; found ${candidates.length}`);
  return candidates[0]!;
}

function tokenImage(source: string, node: ts.Node): readonly (readonly [number, string])[] {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source, undefined, node.getStart(), node.getEnd() - node.getStart());
  const tokens: [number, string][] = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    tokens.push([kind, scanner.getTokenText()]);
  }
  return Object.freeze(tokens.map((token) => Object.freeze(token)));
}

function siteImage(source: string, site: Site): unknown {
  const root = sourceFile(source);
  const node = site.kind === "symbol"
    ? namedFunction(root, site.symbol)
    : discriminantArm(root, site.owner, site.property, site.value);
  return { site, tokens: tokenImage(source, node) };
}

function capabilityDigests(source: string, declarations: readonly Declaration[]): ReadonlyMap<string, string> {
  const byId = new Map(declarations.map((declaration) => [declaration.id, declaration]));
  const memo = new Map<string, string>();
  const visiting = new Set<string>();
  const digest = (id: string): string => {
    const previous = memo.get(id);
    if (previous !== undefined) return previous;
    if (visiting.has(id)) throw new TypeError(`capability dependency cycle at ${id}`);
    const declaration = byId.get(id);
    if (declaration === undefined) throw new TypeError(`missing capability ${id}`);
    visiting.add(id);
    const material = {
      id,
      sites: declaration.sites.map((site) => siteImage(source, site)),
      dependencies: [...declaration.dependsOn].sort().map((dependency) => [dependency, digest(dependency)]),
    };
    const result = createHash("sha256").update(JSON.stringify(material)).digest("hex");
    visiting.delete(id);
    memo.set(id, result);
    return result;
  };
  for (const declaration of declarations) digest(declaration.id);
  return memo;
}

const DECLARATIONS: readonly Declaration[] = Object.freeze([
  Object.freeze({
    id: "structuralFeature.pawn_safe_square",
    sites: Object.freeze([
      Object.freeze({ kind: "discriminant_arm", owner: "matchesStructuralFeature", property: "kind", value: "pawn_safe_square" }),
      Object.freeze({ kind: "symbol", symbol: "pawnSafetyOnPosition" }),
    ]),
    dependsOn: Object.freeze([]),
  }),
  Object.freeze({
    id: "structuralFeature.outpost",
    sites: Object.freeze([Object.freeze({ kind: "discriminant_arm", owner: "matchesStructuralFeature", property: "kind", value: "outpost" })]),
    dependsOn: Object.freeze(["structuralFeature.pawn_safe_square"]),
  }),
  Object.freeze({
    id: "structuralFeature.isolated_pawn",
    sites: Object.freeze([Object.freeze({ kind: "discriminant_arm", owner: "matchesStructuralFeature", property: "kind", value: "isolated_pawn" })]),
    dependsOn: Object.freeze([]),
  }),
  Object.freeze({
    id: "guard.defaults",
    sites: Object.freeze([]),
    dependsOn: Object.freeze([]),
  }),
]);

const REQUIREMENT_RULES: readonly RequirementRule[] = Object.freeze([
  Object.freeze({ selector: Object.freeze({ kind: "literal", property: "kind", value: "pawn_safe_square" }), capability: "structuralFeature.pawn_safe_square" }),
  Object.freeze({ selector: Object.freeze({ kind: "literal", property: "kind", value: "outpost" }), capability: "structuralFeature.outpost" }),
  Object.freeze({ selector: Object.freeze({ kind: "literal", property: "kind", value: "isolated_pawn" }), capability: "structuralFeature.isolated_pawn" }),
  Object.freeze({ selector: Object.freeze({ kind: "absent", rootProperty: "guard" }), capability: "guard.defaults" }),
]);

function literalPairs(value: unknown): readonly (readonly [string, string])[] {
  const pairs: [string, string][] = [];
  const visit = (candidate: unknown): void => {
    if (Array.isArray(candidate)) candidate.forEach(visit);
    else if (typeof candidate === "object" && candidate !== null) {
      for (const [property, child] of Object.entries(candidate)) {
        if (typeof child === "string") pairs.push([property, child]);
        visit(child);
      }
    }
  };
  visit(value);
  return pairs;
}

function deriveRequirements(pack: Readonly<Record<string, unknown>>, declarations: readonly Declaration[] = DECLARATIONS): readonly string[] {
  const direct = new Set<string>();
  const pairs = literalPairs(pack);
  for (const rule of REQUIREMENT_RULES) {
    if (rule.selector.kind === "literal" && pairs.some(([property, value]) => property === rule.selector.property && value === rule.selector.value)) direct.add(rule.capability);
    if (rule.selector.kind === "absent" && !(rule.selector.rootProperty in pack)) direct.add(rule.capability);
  }
  const byId = new Map(declarations.map((declaration) => [declaration.id, declaration]));
  const close = (id: string): void => {
    for (const dependency of byId.get(id)?.dependsOn ?? []) if (!direct.has(dependency)) {
      direct.add(dependency);
      close(dependency);
    }
  };
  [...direct].forEach(close);
  return Object.freeze([...direct].sort());
}

type SemanticDisposition = "active" | "deprecated" | "withdrawn" | "refused" | "unmeasured" | "impossible";
type DeploymentReachability = "supported" | "unsupported" | "temporarily_unavailable";

function semanticDisposition(value: string): SemanticDisposition {
  if (value === "reached") return "active";
  if (value === "retired") return "withdrawn";
  if (["deprecated", "withdrawn", "refused", "unmeasured", "impossible"].includes(value)) return value as SemanticDisposition;
  throw new TypeError(`unmapped semantic disposition ${value}`);
}

function deploymentReachability(input: {
  readonly semantic: SemanticDisposition;
  readonly availability: "local" | "build_time" | "recorded" | "provider";
  readonly configured: boolean;
  readonly providerReachable?: boolean;
}): DeploymentReachability {
  if (input.semantic !== "active" && input.semantic !== "deprecated") return "unsupported";
  if (!input.configured) return "unsupported";
  if (input.availability !== "provider") {
    if (input.providerReachable === false) throw new TypeError("local/build-time/recorded capability cannot be transiently unavailable");
    return "supported";
  }
  return input.providerReachable === false ? "temporarily_unavailable" : "supported";
}

type CensusFailure =
  | "SCHEMA_CAPABILITY_UNANNOTATED"
  | "CAPABILITY_INTERPRETER_ORPHAN"
  | "CAPABILITY_NAMED_ROOT_MISSING"
  | "CAPABILITY_DECLARATION_EXTRA"
  | "CAPABILITY_IDENTITY_MISMATCH";

interface CensusRoot {
  readonly sourceIdentity: string;
  readonly capabilityId?: string;
  readonly excludedBy?: string;
}

interface CensusDeclaration {
  readonly id: string;
  readonly sourceIdentity: string;
}

function censusFailure(input: {
  readonly schema: readonly CensusRoot[];
  readonly interpreters: readonly string[];
  readonly named: readonly CensusRoot[];
  readonly declarations: readonly CensusDeclaration[];
}): CensusFailure | undefined {
  const unannotated = input.schema.find((root) => root.capabilityId === undefined && root.excludedBy === undefined);
  if (unannotated !== undefined) return "SCHEMA_CAPABILITY_UNANNOTATED";

  const activeRoots = [...input.schema, ...input.named].filter((root): root is CensusRoot & { readonly capabilityId: string } => root.capabilityId !== undefined);
  const identities = new Set(activeRoots.map((root) => root.sourceIdentity));
  if (input.interpreters.some((identity) => !identities.has(identity))) return "CAPABILITY_INTERPRETER_ORPHAN";

  const declarations = new Map(input.declarations.map((declaration) => [declaration.id, declaration]));
  if (input.named.some((root) => root.capabilityId !== undefined && !declarations.has(root.capabilityId))) return "CAPABILITY_NAMED_ROOT_MISSING";

  const rootIds = new Set(activeRoots.map((root) => root.capabilityId));
  if (input.declarations.some((declaration) => !rootIds.has(declaration.id))) return "CAPABILITY_DECLARATION_EXTRA";

  for (const root of activeRoots) {
    if (declarations.get(root.capabilityId)?.sourceIdentity !== root.sourceIdentity) return "CAPABILITY_IDENTITY_MISMATCH";
  }
  return undefined;
}

function forbiddenCurrentCapabilityLiterals(source: string): readonly string[] {
  const root = ts.createSourceFile("candidate.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const failures: string[] = [];
  const isCapabilityType = (node: ts.TypeNode | undefined): boolean =>
    node !== undefined && ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)
      && ["CapabilityId", "CapabilityKey"].includes(node.typeName.text);
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) && /@v?\d+$/u.test(node.text)) {
      const parent = node.parent;
      const allowedLegacy = ts.isCallExpression(parent) && ts.isIdentifier(parent.expression)
        && parent.expression.text === "legacyCapabilityFixture";
      const currentCall = ts.isCallExpression(parent) && ts.isIdentifier(parent.expression)
        && parent.expression.text === "assertCurrentCapability";
      const typedAuthority = ts.isVariableDeclaration(parent) && isCapabilityType(parent.type);
      if (!allowedLegacy && (currentCall || typedAuthority)) failures.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(root, visit);
  return failures;
}

describe("D1620-D1622 pack capability closure", () => {
  it("invalidates the D566 helper dependants at exact capability grain", () => {
    const beforeSource = currentSource.replace(" && captureAttackers.length === 0", "");
    expect(beforeSource).not.toBe(currentSource);
    const before = capabilityDigests(beforeSource, DECLARATIONS);
    const after = capabilityDigests(currentSource, DECLARATIONS);
    expect(after.get("structuralFeature.pawn_safe_square")).not.toBe(before.get("structuralFeature.pawn_safe_square"));
    expect(after.get("structuralFeature.outpost")).not.toBe(before.get("structuralFeature.outpost"));
    expect(after.get("structuralFeature.isolated_pawn")).toBe(before.get("structuralFeature.isolated_pawn"));
  });

  it("derives literal use, absent-field defaults, and transitive dependencies without over-stamping", () => {
    const pack = { objective: { successConditions: [{ kind: "structural_feature", feature: { kind: "outpost", color: "white", square: "d5" } }] } };
    const requirements = deriveRequirements(pack);
    expect(requirements).toEqual(["guard.defaults", "structuralFeature.outpost", "structuralFeature.pawn_safe_square"]);
    expect(requirements).not.toContain("structuralFeature.isolated_pawn");
  });

  it("makes both missing and extra requirement stamps fail exact set equality", () => {
    const pack = { objective: { successConditions: [{ kind: "structural_feature", feature: { kind: "outpost" } }] } };
    const derived = deriveRequirements(pack);
    expect(["guard.defaults", "structuralFeature.outpost"]).not.toEqual(derived);
    expect([...derived, "structuralFeature.isolated_pawn"].sort()).not.toEqual(derived);
  });

  it("maps every shipped semantic disposition without treating it as deployment health", () => {
    const format = FORMAT_DISPOSITIONS.map((row) => semanticDisposition(row.disposition));
    const instruments = CAPABILITY_DISPOSITIONS.map((row) => semanticDisposition(row.disposition));
    expect(format).toHaveLength(FORMAT_DISPOSITIONS.length);
    expect(instruments).toHaveLength(CAPABILITY_DISPOSITIONS.length);
    expect(format).toContain("withdrawn");
    expect(instruments).toContain("impossible");
  });

  it("permits transient failure only for configured provider capabilities", () => {
    expect(deploymentReachability({ semantic: "active", availability: "provider", configured: true, providerReachable: false })).toBe("temporarily_unavailable");
    expect(deploymentReachability({ semantic: "active", availability: "provider", configured: false, providerReachable: false })).toBe("unsupported");
    expect(deploymentReachability({ semantic: "refused", availability: "provider", configured: true, providerReachable: true })).toBe("unsupported");
    expect(() => deploymentReachability({ semantic: "active", availability: "local", configured: true, providerReachable: false })).toThrow(/cannot be transiently unavailable/u);
  });
});

describe("D1623/D1625 census and version boundaries", () => {
  const schema: readonly CensusRoot[] = Object.freeze([
    Object.freeze({ sourceIdentity: "#/$defs/structuralFeature|outpost", capabilityId: "structuralFeature.outpost" }),
    Object.freeze({ sourceIdentity: "#/$defs/displayOnly|compact", excludedBy: "D-test" }),
  ]);
  const named: readonly CensusRoot[] = Object.freeze([
    Object.freeze({ sourceIdentity: "named:objective.state_machine", capabilityId: "objective.state_machine" }),
  ]);
  const declarations: readonly CensusDeclaration[] = Object.freeze([
    Object.freeze({ id: "structuralFeature.outpost", sourceIdentity: "#/$defs/structuralFeature|outpost" }),
    Object.freeze({ id: "objective.state_machine", sourceIdentity: "named:objective.state_machine" }),
  ]);
  const valid = { schema, interpreters: ["#/$defs/structuralFeature|outpost"], named, declarations } as const;

  it("distinguishes each census closure failure, including a count-preserving id swap", () => {
    expect(censusFailure(valid)).toBeUndefined();
    expect(censusFailure({ ...valid, schema: [{ sourceIdentity: "#/$defs/newUnion|arm" }] })).toBe("SCHEMA_CAPABILITY_UNANNOTATED");
    expect(censusFailure({ ...valid, interpreters: ["#/$defs/orphan|arm"] })).toBe("CAPABILITY_INTERPRETER_ORPHAN");
    expect(censusFailure({ ...valid, declarations: declarations.slice(0, 1) })).toBe("CAPABILITY_NAMED_ROOT_MISSING");
    expect(censusFailure({ ...valid, declarations: [...declarations, { id: "extra", sourceIdentity: "extra" }] })).toBe("CAPABILITY_DECLARATION_EXTRA");
    expect(censusFailure({
      ...valid,
      declarations: [
        { id: "structuralFeature.outpost", sourceIdentity: "named:objective.state_machine" },
        { id: "objective.state_machine", sourceIdentity: "#/$defs/structuralFeature|outpost" },
      ],
    })).toBe("CAPABILITY_IDENTITY_MISMATCH");
  });

  it("rejects suffix strings only when they construct current typed authority", () => {
    expect(forbiddenCurrentCapabilityLiterals('const value: CapabilityKey = "rules.outpost@1";')).toEqual(["rules.outpost@1"]);
    expect(forbiddenCurrentCapabilityLiterals('assertCurrentCapability("rules.outpost@v1");')).toEqual(["rules.outpost@v1"]);
    expect(forbiddenCurrentCapabilityLiterals('legacyCapabilityFixture("rules.outpost@1");')).toEqual([]);
    expect(forbiddenCurrentCapabilityLiterals('const schema = "tabiya.sourcing.evidence.v1";')).toEqual([]);
  });
});
