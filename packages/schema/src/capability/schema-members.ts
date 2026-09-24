// rfc/pack-capability-contract.md §2.7 / §3.1 rule 1 — the closed-vocabulary inventory of the pack
// schema and the stable public identity of every member.
//
// `closed-schema-members-v2` (corrected 2026-09-24; see the RFC changelog): v1 recognised a `oneOf`
// only when every branch carried exactly one `const` property, which silently dropped every
// expression node of `structuralExpression`/`transitionExpression` (their `all|any` branch uses an
// `enum`), every `simpleTrigger` arm (key-discriminated) and every union with a second `const` in one
// branch (`assessedBy`, `deviationCost`, `graduationClearance`). v2 recognises three closed forms:
//
//   enum          — every scalar member of an `enum` node that is not itself a union discriminator;
//   value union   — a `oneOf` whose branches are objects that each require one common property whose
//                   schema is `const`/`enum` (preferring `kind`, `type`, `state`, else the unique
//                   property whose values are disjoint across branches);
//   key union     — a `oneOf` whose object branches each require exactly one property beyond the keys
//                   every branch requires, with those properties pairwise distinct.
//
// Anything else (type alternatives, `$ref` alternatives, constraint combinators without `required`)
// is not a vocabulary; enums nested inside it are still members.
//
// `stable-schema-member-v3` derives identity from the semantic owner, the union discriminator and
// the member; it never uses a `oneOf` ordinal or a content hash. Collision or an unidentifiable
// branch fails with CAPABILITY_IDENTITY_COLLISION / CAPABILITY_BRANCH_UNIDENTIFIED.

export const CLOSED_MEMBER_INVENTORY_ALGORITHM = "closed-schema-members-v2" as const;
export const STABLE_IDENTITY_ALGORITHM = "stable-schema-member-v3" as const;

export type SchemaScalar = string | number | boolean;

export interface SchemaMemberIdentity {
  readonly schemaPointer: string;
  readonly member: SchemaScalar;
}

export type ClosedUnionForm =
  | { readonly form: "value"; readonly discriminator: string }
  | { readonly form: "key"; readonly keys: readonly string[] };

export interface ClosedSchemaInventory {
  readonly rows: readonly SchemaMemberIdentity[];
  readonly unions: Readonly<Record<string, ClosedUnionForm>>;
  readonly enumNodes: number;
  readonly enumMembers: number;
  readonly valueUnionNodes: number;
  readonly valueUnionMembers: number;
  readonly keyUnionNodes: number;
  readonly keyUnionMembers: number;
}

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
type JsonObject = { readonly [key: string]: Json };

export class SchemaIdentityError extends TypeError {
  readonly code: "CAPABILITY_IDENTITY_COLLISION" | "CAPABILITY_BRANCH_UNIDENTIFIED" | "CAPABILITY_DISCRIMINATOR_AMBIGUOUS";
  constructor(code: SchemaIdentityError["code"], message: string) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);
const isScalar = (value: unknown): value is SchemaScalar => typeof value === "string" || typeof value === "number" || typeof value === "boolean";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export const escapePointerToken = (token: string): string => token.replaceAll("~", "~0").replaceAll("/", "~1");
export const unescapePointerToken = (token: string): string => token.replaceAll("~1", "/").replaceAll("~0", "~");
export const pointerTokens = (pointer: string): readonly string[] => pointer.split("/").slice(1).map(unescapePointerToken);

export function valueAtPointer(root: unknown, pointer: string): unknown {
  return pointerTokens(pointer).reduce<unknown>((value, token) => (isObject(value) || Array.isArray(value) ? (value as Record<string, unknown>)[token] : undefined), root);
}

export function resolveSchemaRef(root: unknown, ref: string): { readonly pointer: string; readonly node: unknown } {
  if (!ref.startsWith("#")) throw new TypeError(`only local $ref is supported: ${ref}`);
  const pointer = ref.slice(1);
  return { pointer, node: valueAtPointer(root, pointer) };
}

function scalarValues(schema: unknown): readonly SchemaScalar[] | undefined {
  if (!isObject(schema)) return undefined;
  if (Object.hasOwn(schema, "const") && isScalar(schema.const)) return [schema.const];
  if (Array.isArray(schema.enum) && schema.enum.every(isScalar)) return schema.enum as readonly SchemaScalar[];
  return undefined;
}

function branchObjects(node: JsonObject): readonly JsonObject[] | undefined {
  const branches = node.oneOf;
  if (!Array.isArray(branches) || branches.length === 0) return undefined;
  if (!branches.every((branch) => isObject(branch) && Array.isArray(branch.required) && isObject(branch.properties))) return undefined;
  return branches as readonly JsonObject[];
}

const PREFERRED_DISCRIMINATORS = ["kind", "type", "state"] as const;

/** Classifies a `oneOf` node as a closed value union, a closed key union, or not a vocabulary. */
export function classifyUnion(node: unknown): ClosedUnionForm | undefined {
  if (!isObject(node)) return undefined;
  const branches = branchObjects(node);
  if (branches === undefined) return undefined;
  const required = branches.map((branch) => (branch.required as readonly string[]));
  const candidates = Object.keys(branches[0]!.properties as JsonObject).filter((name) =>
    branches.every((branch, index) => required[index]!.includes(name) && scalarValues((branch.properties as JsonObject)[name]) !== undefined));
  if (candidates.length > 0) {
    const preferred = PREFERRED_DISCRIMINATORS.find((name) => candidates.includes(name));
    if (preferred !== undefined) return { form: "value", discriminator: preferred };
    const disjoint = candidates.filter((name) => {
      const seen = new Set<string>();
      for (const branch of branches) {
        for (const value of scalarValues((branch.properties as JsonObject)[name])!) {
          const key = JSON.stringify(value);
          if (seen.has(key)) return false;
          seen.add(key);
        }
      }
      return true;
    });
    if (disjoint.length === 1) return { form: "value", discriminator: disjoint[0]! };
    if (disjoint.length > 1) throw new SchemaIdentityError("CAPABILITY_DISCRIMINATOR_AMBIGUOUS", `oneOf has several disjoint discriminators: ${disjoint.join(", ")}`);
  }
  const common = required[0]!.filter((name) => required.every((set) => set.includes(name)));
  const distinct = required.map((set) => set.filter((name) => !common.includes(name)));
  if (distinct.every((set) => set.length === 1) && new Set(distinct.map((set) => set[0])).size === distinct.length) {
    return { form: "key", keys: distinct.map((set) => set[0]!) };
  }
  return undefined;
}

function unionMembers(node: JsonObject, form: ClosedUnionForm): readonly SchemaScalar[] {
  if (form.form === "key") return form.keys;
  const members: SchemaScalar[] = [];
  for (const branch of node.oneOf as readonly JsonObject[]) {
    for (const value of scalarValues((branch.properties as JsonObject)[form.discriminator])!) {
      if (!members.some((existing) => existing === value)) members.push(value);
    }
  }
  return members;
}

export function compareMemberIdentities(left: SchemaMemberIdentity, right: SchemaMemberIdentity): number {
  const a = canonicalJson(left), b = canonicalJson(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The closed-vocabulary inventory, with metadata subtrees excluded before enumeration. */
export function closedSchemaInventory(schema: unknown, excludedPointers: readonly string[] = []): ClosedSchemaInventory {
  const rows: SchemaMemberIdentity[] = [];
  const unions: Record<string, ClosedUnionForm> = {};
  const discriminatorEnums = new Set<string>();
  let enumNodes = 0, enumMembers = 0, valueUnionNodes = 0, valueUnionMembers = 0, keyUnionNodes = 0, keyUnionMembers = 0;
  const excluded = (pointer: string): boolean => excludedPointers.some((root) => pointer === root || pointer.startsWith(`${root}/`));
  // First pass: unions, so their discriminator enums are not double counted as bare enums.
  const visitUnions = (value: unknown, pointer: string): void => {
    if (excluded(pointer)) return;
    if (Array.isArray(value)) { value.forEach((item, index) => visitUnions(item, `${pointer}/${index}`)); return; }
    if (!isObject(value)) return;
    const form = classifyUnion(value);
    if (form !== undefined) {
      unions[pointer] = form;
      const members = unionMembers(value, form);
      if (form.form === "value") {
        valueUnionNodes += 1; valueUnionMembers += members.length;
        (value.oneOf as readonly JsonObject[]).forEach((_branch, index) => discriminatorEnums.add(`${pointer}/oneOf/${index}/properties/${escapePointerToken(form.discriminator)}`));
      } else { keyUnionNodes += 1; keyUnionMembers += members.length; }
      for (const member of members) rows.push({ schemaPointer: pointer, member });
    }
    for (const [key, child] of Object.entries(value)) visitUnions(child, `${pointer}/${escapePointerToken(key)}`);
  };
  visitUnions(schema, "");
  const visitEnums = (value: unknown, pointer: string): void => {
    if (excluded(pointer)) return;
    if (Array.isArray(value)) { value.forEach((item, index) => visitEnums(item, `${pointer}/${index}`)); return; }
    if (!isObject(value)) return;
    if (Array.isArray(value.enum) && !discriminatorEnums.has(pointer)) {
      enumNodes += 1;
      for (const member of value.enum) {
        if (!isScalar(member)) continue;
        enumMembers += 1;
        rows.push({ schemaPointer: pointer, member });
      }
    }
    for (const [key, child] of Object.entries(value)) visitEnums(child, `${pointer}/${escapePointerToken(key)}`);
  };
  visitEnums(schema, "");
  rows.sort(compareMemberIdentities);
  return Object.freeze({
    rows: Object.freeze(rows.map((row) => Object.freeze(row))),
    unions: Object.freeze(unions),
    enumNodes, enumMembers, valueUnionNodes, valueUnionMembers, keyUnionNodes, keyUnionMembers,
  });
}

export function encodeIdentityToken(value: SchemaScalar): string {
  const text = String(value);
  return /^[A-Za-z0-9_-]+$/u.test(text) ? text : `x${[...new TextEncoder().encode(text)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function branchIdentity(schema: unknown, unionPointer: string, branchIndex: number): string {
  const union = valueAtPointer(schema, unionPointer) as JsonObject;
  const branches = union.oneOf as readonly JsonObject[];
  const branch = branches[branchIndex]!;
  const form = classifyUnion(union);
  if (form?.form === "key") return `key-${encodeIdentityToken(form.keys[branchIndex]!)}`;
  if (form?.form === "value") {
    const values = scalarValues((branch.properties as JsonObject)[form.discriminator])!;
    let identity = `${encodeIdentityToken(form.discriminator)}-${values.map(encodeIdentityToken).join("-")}`;
    const sharing = branches.filter((candidate) => {
      const other = scalarValues((candidate.properties as JsonObject)[form.discriminator])!;
      return other.some((value) => values.includes(value));
    });
    if (sharing.length > 1) {
      // The closed structural discriminator: the first property (sorted) whose nested `required`
      // set differs among the branches that share a discriminator value (`over.files` / `over.squares`).
      const properties = Object.keys(branch.properties as JsonObject).sort();
      const structural = properties.find((name) => {
        const shapes = sharing.map((candidate) => {
          const property = (candidate.properties as JsonObject)[name];
          return isObject(property) && Array.isArray(property.required) ? (property.required as readonly string[]).join("-") : undefined;
        });
        return shapes.every((shape) => shape !== undefined) && new Set(shapes).size === shapes.length;
      });
      if (structural === undefined) throw new SchemaIdentityError("CAPABILITY_BRANCH_UNIDENTIFIED", `${unionPointer}/oneOf/${branchIndex} shares its discriminator and has no structural discriminator`);
      const nested = ((branch.properties as JsonObject)[structural] as JsonObject).required as readonly string[];
      identity += `.${encodeIdentityToken(structural)}-${nested.map(encodeIdentityToken).join("-")}`;
    }
    return identity;
  }
  // Not a vocabulary union (a constraint combinator or a type alternative): identify the branch by
  // its own const properties, else by its required set; an unidentifiable branch fails.
  const constants = isObject(branch.properties)
    ? Object.entries(branch.properties).flatMap(([name, property]) => (isObject(property) && isScalar(property.const) ? [`${encodeIdentityToken(name)}-${encodeIdentityToken(property.const)}`] : [])).sort()
    : [];
  if (constants.length > 0) return constants.join(".");
  if (Array.isArray(branch.required) && branch.required.length > 0) return `req-${[...(branch.required as readonly string[])].sort().map(encodeIdentityToken).join("-")}`;
  throw new SchemaIdentityError("CAPABILITY_BRANCH_UNIDENTIFIED", `${unionPointer}/oneOf/${branchIndex} has no stable identity`);
}

/** `stable-schema-member-v3`: the public capability id for one closed schema member. */
export function stableMemberId(schema: unknown, source: SchemaMemberIdentity): string {
  const raw = pointerTokens(source.schemaPointer);
  // The owner is the terminal `$defs` key (so moving a definition deeper under `$defs` keeps its
  // identity), else the root property.
  const lastDefs = raw.lastIndexOf("$defs");
  const ownerAt = lastDefs >= 0 ? lastDefs + 1 : raw[0] === "properties" ? 1 : 0;
  const tokens: string[] = [encodeIdentityToken(raw[ownerAt] ?? "root")];
  for (let index = ownerAt + 1; index < raw.length; index += 1) {
    const token = raw[index]!;
    if (token === "$defs" || token === "properties" || token === "items") continue;
    if (token === "oneOf" && /^\d+$/u.test(raw[index + 1] ?? "")) {
      const unionPointer = `/${raw.slice(0, index).map(escapePointerToken).join("/")}`;
      tokens.push(branchIdentity(schema, unionPointer === "/" ? "" : unionPointer, Number(raw[index + 1])));
      index += 1;
      continue;
    }
    if (token === "oneOf" && index === raw.length - 1) continue;
    if (/^\d+$/u.test(token)) continue;
    tokens.push(encodeIdentityToken(token));
  }
  return [...tokens, encodeIdentityToken(source.member)].join(".");
}

export interface SchemaMemberMapping {
  readonly sourceIdentity: SchemaMemberIdentity;
  readonly id: string;
}

/** Maps every inventory row to its public id and proves the mapping is one-to-one. */
export function mapSchemaMembers(schema: unknown, inventory: ClosedSchemaInventory): readonly SchemaMemberMapping[] {
  const mappings = inventory.rows.map((sourceIdentity) => Object.freeze({ sourceIdentity, id: stableMemberId(schema, sourceIdentity) }));
  const seen = new Map<string, SchemaMemberIdentity>();
  for (const mapping of mappings) {
    const previous = seen.get(mapping.id);
    if (previous !== undefined) throw new SchemaIdentityError("CAPABILITY_IDENTITY_COLLISION", `${mapping.id} names both ${canonicalJson(previous)} and ${canonicalJson(mapping.sourceIdentity)}`);
    seen.set(mapping.id, mapping.sourceIdentity);
  }
  return Object.freeze(mappings);
}
