// rfc/pack-capability-contract.md §2.6/§2.7 — requirement derivation is one algorithm.
//
// Evaluate every selector of the applicability table against the parsed pack, add each direct
// capability, expand `dependsOn` transitively (a missing dependency or a cycle fails), resolve
// shape/principle references including their own embedded semantic dependencies, then canonicalize
// the unique `{id, version}` set. The authored `requires` array must byte-equal the result.
//
// A `schema_member` selector is evaluated by walking the finite parsed instance and the resolved
// pack schema together: local `$ref` is followed, the instance descends through the matching object
// property, array item and selected `oneOf` branch, and the member capability is emitted whenever a
// visited schema node has the exact pointer and the instance scalar equals the member. The walk
// tracks the instance path — never visited schema identities — so a recursive `$ref` reached again
// at a deeper instance child is visited again.

import {
  canonicalCapabilityRequirements,
  capabilityKey,
  type CapabilityId,
  type CapabilityKey,
} from "./types.js";
import {
  canonicalJson,
  classifyUnion,
  escapePointerToken,
  resolveSchemaRef,
  type ClosedUnionForm,
  type SchemaMemberIdentity,
  type SchemaScalar,
} from "./schema-members.js";

export type PackSelector =
  | { readonly kind: "always" }
  | { readonly kind: "schema_member"; readonly sourceIdentity: SchemaMemberIdentity }
  | { readonly kind: "literal"; readonly pointer: string; readonly equals: string | number | boolean }
  | { readonly kind: "absent"; readonly pointer: string }
  | { readonly kind: "resolved"; readonly pointer: string; readonly registry: "shape" | "principle"; readonly value: ResolvedReferenceValue };

export type ResolvedReferenceValue = "shape-reference" | "id" | "id-when-ground-kind-shape_plan";

export interface CapabilityApplicability {
  readonly selector: PackSelector;
  /** Absent only for a `resolved` row: the capability is generated from the referenced entry. */
  readonly capability?: CapabilityId;
}

export interface ResolvedEntryCapability {
  readonly capability: CapabilityId;
  /** The entry's own semantic dependencies (its expressions mapped through the same authority). */
  readonly dependencies: readonly CapabilityId[];
}

export interface RequirementDerivationAuthority {
  /** The resolved pack schema the member pointers index. */
  readonly schema: unknown;
  readonly applicability: readonly CapabilityApplicability[];
  /** Direct `dependsOn` per declared capability; a capability absent from this map is undeclared. */
  readonly dependsOn: ReadonlyMap<CapabilityKey, readonly CapabilityId[]>;
  /** Instance pointers skipped before selector evaluation (capability metadata). */
  readonly excludedInstancePointers: readonly string[];
}

export interface RequirementResolver {
  resolve(registry: "shape" | "principle", id: string): ResolvedEntryCapability | undefined;
}

export type RequirementDerivationCode =
  | "CAPABILITY_DEPENDENCY_MISSING"
  | "CAPABILITY_DEPENDENCY_CYCLE"
  | "CAPABILITY_REFERENCE_UNRESOLVED"
  | "CAPABILITY_APPLICABILITY_ORPHAN";

export class RequirementDerivationError extends TypeError {
  readonly code: RequirementDerivationCode;
  readonly pointer: string;
  constructor(code: RequirementDerivationCode, pointer: string, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
    this.pointer = pointer;
  }
}

type JsonObject = Readonly<Record<string, unknown>>;
const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);
const isScalar = (value: unknown): value is SchemaScalar => typeof value === "string" || typeof value === "number" || typeof value === "boolean";

function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function typeMatches(declared: unknown, value: unknown): boolean {
  const actual = jsonType(value);
  const types = Array.isArray(declared) ? declared : [declared];
  return types.some((type) => type === actual || (type === "number" && actual === "integer"));
}

/**
 * A shallow structural match used only to select the `oneOf` branch an already-schema-valid
 * instance took. It is not a validator: the pack has passed the strict schema before derivation.
 */
function branchMatches(root: unknown, node: unknown, value: unknown, depth: number): boolean {
  let schema = node;
  for (let hops = 0; isObject(schema) && typeof schema.$ref === "string"; hops += 1) {
    if (hops > 32) return true;
    schema = resolveSchemaRef(root, schema.$ref).node;
  }
  if (schema === true || !isObject(schema)) return true;
  const same = (left: unknown, right: unknown): boolean => left === right || (typeof left === "object" && left !== null && canonicalJson(left) === canonicalJson(right));
  if (Object.hasOwn(schema, "const") && !same(schema.const, value)) return false;
  if (Array.isArray(schema.enum) && !schema.enum.some((member) => same(member, value))) return false;
  if (schema.type !== undefined && !typeMatches(schema.type, value)) return false;
  if (Array.isArray(schema.oneOf) && !schema.oneOf.some((branch) => branchMatches(root, branch, value, depth))) return false;
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((branch) => branchMatches(root, branch, value, depth))) return false;
  if (Array.isArray(schema.allOf) && !schema.allOf.every((branch) => branchMatches(root, branch, value, depth))) return false;
  if (schema.not !== undefined && branchMatches(root, schema.not, value, depth)) return false;
  if (isObject(value)) {
    if (Array.isArray(schema.required) && !schema.required.every((key) => typeof key === "string" && Object.hasOwn(value, key))) return false;
    const properties = isObject(schema.properties) ? schema.properties : {};
    if (schema.additionalProperties === false && !Object.keys(value).every((key) => Object.hasOwn(properties, key))) return false;
    if (depth > 0) {
      for (const [key, child] of Object.entries(value)) {
        if (Object.hasOwn(properties, key) && !branchMatches(root, properties[key], child, depth - 1)) return false;
      }
    }
  }
  if (Array.isArray(value) && depth > 0 && schema.items !== undefined) {
    if (!value.every((item) => branchMatches(root, schema.items, item, depth - 1))) return false;
  }
  return true;
}

const memberKey = (pointer: string, member: SchemaScalar): string => canonicalJson({ member, schemaPointer: pointer });
const UNION_CACHE = new WeakMap<object, Map<string, ClosedUnionForm | undefined>>();
const MEMBER_CACHE = new WeakMap<readonly CapabilityApplicability[], ReadonlyMap<string, CapabilityId>>();

export interface SchemaMemberWalk {
  readonly member: SchemaMemberIdentity;
  readonly instancePointer: string;
}

/**
 * Walks `instance` against the schema node at `schemaPointer` and returns every closed schema
 * member it reaches, with the instance pointer where it was reached.
 */
export function walkSchemaMembers(
  schema: unknown,
  schemaPointer: string,
  instance: unknown,
  options: { readonly instancePointer?: string; readonly excludedInstancePointers?: readonly string[] } = {},
): readonly SchemaMemberWalk[] {
  const out: SchemaMemberWalk[] = [];
  const excluded = options.excludedInstancePointers ?? [];
  let unionCache = UNION_CACHE.get(schema as object);
  if (unionCache === undefined) { unionCache = new Map<string, ClosedUnionForm | undefined>(); UNION_CACHE.set(schema as object, unionCache); }
  // An enum that discriminates a value union is that union's member list, not a member of its own
  // (the inventory counts it once, at the union).
  const isDiscriminatorEnum = (pointer: string): boolean => {
    const match = /^(.*)\/oneOf\/\d+\/properties\/([^/]+)$/u.exec(pointer);
    if (match === null) return false;
    const form = unionAt(match[1]!, valueAtSchema(schema, match[1]!));
    return form?.form === "value" && escapePointerToken(form.discriminator) === match[2];
  };
  const unionAt = (pointer: string, node: unknown): ClosedUnionForm | undefined => {
    if (!unionCache.has(pointer)) unionCache.set(pointer, classifyUnion(node));
    return unionCache.get(pointer);
  };
  const visit = (node: unknown, pointer: string, value: unknown, path: string, depth: number): void => {
    if (depth > 256) throw new RangeError(`schema member walk exceeded depth at ${path}`);
    if (excluded.some((root) => path === root || path.startsWith(`${root}/`))) return;
    let schemaNode = node;
    let schemaPath = pointer;
    for (let hops = 0; isObject(schemaNode) && typeof schemaNode.$ref === "string"; hops += 1) {
      if (hops > 32) throw new RangeError(`$ref chain too long at ${schemaPath}`);
      const resolved = resolveSchemaRef(schema, schemaNode.$ref);
      schemaNode = resolved.node;
      schemaPath = resolved.pointer;
    }
    if (!isObject(schemaNode)) return;
    if (Array.isArray(schemaNode.enum) && isScalar(value) && schemaNode.enum.includes(value) && !isDiscriminatorEnum(schemaPath)) {
      out.push({ member: { schemaPointer: schemaPath, member: value }, instancePointer: path });
    }
    if (Array.isArray(schemaNode.oneOf)) {
      const form = unionAt(schemaPath, schemaNode);
      let candidates = schemaNode.oneOf.map((_branch, index) => index);
      if (form?.form === "value" && isObject(value) && isScalar(value[form.discriminator])) {
        const selected = value[form.discriminator] as SchemaScalar;
        out.push({ member: { schemaPointer: schemaPath, member: selected }, instancePointer: `${path}/${escapePointerToken(form.discriminator)}` });
        candidates = candidates.filter((index) => {
          const property = ((schemaNode as JsonObject).oneOf as readonly JsonObject[])[index]!.properties as JsonObject;
          const discriminator = property[form.discriminator] as JsonObject;
          return discriminator.const === selected || (Array.isArray(discriminator.enum) && discriminator.enum.includes(selected));
        });
      } else if (form?.form === "key" && isObject(value)) {
        const key = form.keys.find((candidate) => Object.hasOwn(value, candidate));
        if (key !== undefined) {
          out.push({ member: { schemaPointer: schemaPath, member: key }, instancePointer: `${path}/${escapePointerToken(key)}` });
          candidates = [form.keys.indexOf(key)];
        }
      }
      const matching = candidates.filter((index) => branchMatches(schema, ((schemaNode as JsonObject).oneOf as readonly unknown[])[index], value, 4));
      for (const index of matching) visit(((schemaNode as JsonObject).oneOf as readonly unknown[])[index], `${schemaPath}/oneOf/${index}`, value, path, depth + 1);
    }
    if (Array.isArray(schemaNode.anyOf)) {
      schemaNode.anyOf.forEach((branch, index) => {
        if (branchMatches(schema, branch, value, 4)) visit(branch, `${schemaPath}/anyOf/${index}`, value, path, depth + 1);
      });
    }
    if (Array.isArray(schemaNode.allOf)) schemaNode.allOf.forEach((branch, index) => visit(branch, `${schemaPath}/allOf/${index}`, value, path, depth + 1));
    if (isObject(value)) {
      const properties = isObject(schemaNode.properties) ? schemaNode.properties : undefined;
      for (const [key, child] of Object.entries(value)) {
        const childPath = `${path}/${escapePointerToken(key)}`;
        if (properties !== undefined && Object.hasOwn(properties, key)) visit(properties[key], `${schemaPath}/properties/${escapePointerToken(key)}`, child, childPath, depth + 1);
        else if (isObject(schemaNode.additionalProperties)) visit(schemaNode.additionalProperties, `${schemaPath}/additionalProperties`, child, childPath, depth + 1);
      }
    }
    if (Array.isArray(value) && schemaNode.items !== undefined) {
      value.forEach((item, index) => visit(schemaNode.items, `${schemaPath}/items`, item, `${path}/${index}`, depth + 1));
    }
  };
  visit(valueAtSchema(schema, schemaPointer), schemaPointer, instance, options.instancePointer ?? "", 0);
  return out;
}

function valueAtSchema(schema: unknown, pointer: string): unknown {
  return pointer === "" ? schema : resolveSchemaRef(schema, `#${pointer}`).node;
}

/** Expands an RFC 6901 pointer with `*` (one array/object segment per star) against an instance. */
export function expandStarPointer(instance: unknown, pointer: string): readonly { readonly pointer: string; readonly value: unknown }[] {
  const tokens = pointer.split("/").slice(1);
  let frontier: { pointer: string; value: unknown }[] = [{ pointer: "", value: instance }];
  for (const token of tokens) {
    const next: { pointer: string; value: unknown }[] = [];
    for (const { pointer: at, value } of frontier) {
      if (token === "*") {
        if (Array.isArray(value)) value.forEach((item, index) => next.push({ pointer: `${at}/${index}`, value: item }));
        else if (isObject(value)) for (const [key, item] of Object.entries(value)) next.push({ pointer: `${at}/${escapePointerToken(key)}`, value: item });
      } else {
        const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
        if ((Array.isArray(value) || isObject(value)) && Object.hasOwn(value as object, key)) next.push({ pointer: `${at}/${token}`, value: (value as Record<string, unknown>)[key] });
      }
    }
    frontier = next;
  }
  return frontier;
}

function referencedIds(instance: unknown, pointer: string, value: ResolvedReferenceValue): readonly { readonly pointer: string; readonly id: string }[] {
  const out: { pointer: string; id: string }[] = [];
  if (value === "id-when-ground-kind-shape_plan") {
    const groundPointer = pointer.replace(/\/shape$/u, "");
    for (const ground of expandStarPointer(instance, groundPointer)) {
      if (isObject(ground.value) && ground.value.kind === "shape_plan" && typeof ground.value.shape === "string") out.push({ pointer: `${ground.pointer}/shape`, id: ground.value.shape });
    }
    return out;
  }
  for (const found of expandStarPointer(instance, pointer)) {
    if (typeof found.value === "string") out.push({ pointer: found.pointer, id: found.value });
    else if (value === "shape-reference" && isObject(found.value) && typeof found.value.shape === "string") out.push({ pointer: `${found.pointer}/shape`, id: found.value.shape });
  }
  return out;
}

export interface DerivedRequirement {
  readonly capability: CapabilityId;
  /** Instance pointers that selected this capability directly; empty for always/dependency rows. */
  readonly pointers: readonly string[];
}

export interface RequirementDerivation {
  readonly requires: readonly CapabilityId[];
  readonly direct: readonly DerivedRequirement[];
}

/** Closes a capability set over `dependsOn`. A missing dependency or a cycle fails. */
export function closeOverDependencies(
  roots: readonly CapabilityId[],
  dependsOn: ReadonlyMap<CapabilityKey, readonly CapabilityId[]>,
): readonly CapabilityId[] {
  const out = new Map<CapabilityKey, CapabilityId>();
  const done = new Set<CapabilityKey>();
  const visit = (capability: CapabilityId, stack: readonly CapabilityKey[]): void => {
    const key = capabilityKey(capability);
    if (stack.includes(key)) throw new RequirementDerivationError("CAPABILITY_DEPENDENCY_CYCLE", "", `${[...stack, key].join(" -> ")}`);
    out.set(key, capability);
    if (done.has(key)) return;
    const dependencies = dependsOn.get(key);
    if (dependencies === undefined) throw new RequirementDerivationError("CAPABILITY_DEPENDENCY_MISSING", "", `${key} is not a declared capability`);
    for (const dependency of dependencies) visit(dependency, [...stack, key]);
    done.add(key);
  };
  for (const root of roots) visit(root, []);
  return canonicalCapabilityRequirements([...out.values()]);
}

/** The one derivation algorithm (§2.7). */
export function deriveRequirements(
  pack: unknown,
  authority: RequirementDerivationAuthority,
  resolver: RequirementResolver,
): RequirementDerivation {
  const direct = new Map<CapabilityKey, { capability: CapabilityId; pointers: Set<string> }>();
  const add = (capability: CapabilityId, pointer?: string): void => {
    const key = capabilityKey(capability);
    let row = direct.get(key);
    if (row === undefined) { row = { capability, pointers: new Set() }; direct.set(key, row); }
    if (pointer !== undefined) row.pointers.add(pointer);
  };
  let members = MEMBER_CACHE.get(authority.applicability);
  if (members === undefined) {
    const built = new Map<string, CapabilityId>();
    for (const row of authority.applicability) {
      const selector = row.selector;
      if (selector.kind !== "schema_member") continue;
      if (row.capability === undefined) throw new RequirementDerivationError("CAPABILITY_APPLICABILITY_ORPHAN", selector.sourceIdentity.schemaPointer, "a schema_member row carries no capability");
      built.set(memberKey(selector.sourceIdentity.schemaPointer, selector.sourceIdentity.member), row.capability);
    }
    members = built;
    MEMBER_CACHE.set(authority.applicability, built);
  }
  for (const walked of walkSchemaMembers(authority.schema, "", pack, { excludedInstancePointers: authority.excludedInstancePointers })) {
    const capability = members.get(memberKey(walked.member.schemaPointer, walked.member.member));
    if (capability !== undefined) add(capability, walked.instancePointer);
  }
  const resolvedDependencies: CapabilityId[] = [];
  // A resolved entry is declared by the resolver that loaded it: its dependencies are known even when
  // the entry is a deployment-local registration absent from the generated declarations.
  const dependsOn = new Map(authority.dependsOn);
  for (const row of authority.applicability) {
    const selector = row.selector;
    if (selector.kind === "always") add(row.capability!);
    else if (selector.kind === "absent") {
      if (expandStarPointer(pack, selector.pointer).length === 0) add(row.capability!, selector.pointer);
    } else if (selector.kind === "literal") {
      for (const found of expandStarPointer(pack, selector.pointer)) if (found.value === selector.equals) add(row.capability!, found.pointer);
    } else if (selector.kind === "resolved") {
      for (const reference of referencedIds(pack, selector.pointer, selector.value)) {
        const entry = resolver.resolve(selector.registry, reference.id);
        if (entry === undefined) throw new RequirementDerivationError("CAPABILITY_REFERENCE_UNRESOLVED", reference.pointer, `${selector.registry} ${reference.id} is not a registered entry`);
        add(entry.capability, reference.pointer);
        if (!dependsOn.has(capabilityKey(entry.capability))) dependsOn.set(capabilityKey(entry.capability), entry.dependencies);
        resolvedDependencies.push(...entry.dependencies);
      }
    }
  }
  const requires = closeOverDependencies([...[...direct.values()].map((row) => row.capability), ...resolvedDependencies], dependsOn);
  return Object.freeze({
    requires,
    direct: Object.freeze([...direct.values()].map((row) => Object.freeze({ capability: row.capability, pointers: Object.freeze([...row.pointers].sort()) }))),
  });
}

/** Byte-level comparison of an authored canonical array against the derived one. */
export function requirementDifference(declared: readonly CapabilityId[], derived: readonly CapabilityId[]): {
  readonly missing: readonly CapabilityId[];
  readonly extra: readonly CapabilityId[];
} {
  const declaredKeys = new Set(declared.map(capabilityKey));
  const derivedKeys = new Set(derived.map(capabilityKey));
  return Object.freeze({
    missing: Object.freeze(derived.filter((row) => !declaredKeys.has(capabilityKey(row)))),
    extra: Object.freeze(declared.filter((row) => !derivedKeys.has(capabilityKey(row)))),
  });
}

/** Member capabilities keyed by the canonical `{member, schemaPointer}` identity. */
export function memberCapabilityIndex(applicability: readonly CapabilityApplicability[]): ReadonlyMap<string, CapabilityId> {
  const out = new Map<string, CapabilityId>();
  for (const row of applicability) {
    if (row.selector.kind === "schema_member" && row.capability !== undefined) out.set(memberKey(row.selector.sourceIdentity.schemaPointer, row.selector.sourceIdentity.member), row.capability);
  }
  return out;
}

/**
 * §2.6: the semantic dependencies of a resolved shape entry — its trigger and every plan success
 * signature walked through the same member authority as a pack. An expression reaching an unmapped
 * member fails rather than contributing nothing.
 */
export function resolvedShapeDependencies(schema: unknown, members: ReadonlyMap<string, CapabilityId>, entry: Readonly<Record<string, unknown>>): readonly CapabilityId[] {
  const expressions: unknown[] = [entry.trigger];
  for (const plan of (entry.plans as readonly Readonly<Record<string, unknown>>[] | undefined) ?? []) {
    const signature = (plan.success as Readonly<Record<string, unknown>> | undefined)?.signature;
    if (signature !== null && signature !== undefined) expressions.push(signature);
  }
  const out: CapabilityId[] = [];
  for (const expression of expressions) {
    for (const walked of walkSchemaMembers(schema, "/$defs/structuralExpression", expression)) {
      const capability = members.get(memberKey(walked.member.schemaPointer, walked.member.member));
      if (capability === undefined) throw new RequirementDerivationError("CAPABILITY_APPLICABILITY_ORPHAN", walked.instancePointer, `shape ${String(entry.id)} reaches unmapped member ${canonicalJson(walked.member)}`);
      out.push(capability);
    }
  }
  return canonicalCapabilityRequirements(out);
}
